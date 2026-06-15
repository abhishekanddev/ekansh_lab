import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

/**
 * Razorpay web checkout — port of the Flutter `razorpay_checkout_web.dart` +
 * `SubscriptionService`. The backend cloud functions are shared with the mobile
 * app, so the web client only loads checkout.js and relays order → verify.
 *
 *   createRazorpayOrder      → { orderId, amount, currency, keyId }
 *   verifyPaymentAndUpgrade  → activates the new plan after a successful payment
 *   purchaseAiTopUp          → credits AI usage after a successful payment
 */

interface RazorpayOrder {
  orderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
}

interface RazorpayHandlerResponse {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

// Minimal typing for the global injected by checkout.js.
type RazorpayCtor = new (options: Record<string, unknown>) => {
  open: () => void;
  on: (event: string, handler: (resp: { error?: { code?: string; description?: string } }) => void) => void;
};
declare global {
  interface Window { Razorpay?: RazorpayCtor }
}

let scriptPromise: Promise<void> | null = null;

function ensureScriptLoaded(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.setAttribute("data-razorpay", "true");
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error("Failed to load Razorpay checkout.")); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

async function createOrder(args: {
  purpose: "subscription" | "ai_topup";
  planTier?: string;
  billingCycle?: string;
}): Promise<RazorpayOrder> {
  if (!functions) throw new Error("Payments are not available right now.");
  const call = httpsCallable<typeof args, { orderId: string; amount: number; currency?: string; keyId: string }>(
    functions, "createRazorpayOrder",
  );
  const res = await call(args);
  return {
    orderId: res.data.orderId,
    amount: res.data.amount,
    currency: res.data.currency ?? "INR",
    keyId: res.data.keyId,
  };
}

/** Open Razorpay checkout for `order`, resolving with the payment fields on success. */
function openCheckout(
  order: RazorpayOrder,
  prefill: { name: string; email: string; contact: string },
  description: string,
): Promise<{ paymentId: string; orderId: string; signature: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      await ensureScriptLoaded();
    } catch (e) {
      reject(e);
      return;
    }
    const Ctor = window.Razorpay;
    if (!Ctor) { reject(new Error("Razorpay failed to initialise.")); return; }

    const rzp = new Ctor({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "Ekansh Lab Suite",
      description,
      prefill: { name: prefill.name, email: prefill.email, contact: prefill.contact },
      modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
      handler: (resp: RazorpayHandlerResponse) => {
        const paymentId = resp.razorpay_payment_id ?? "";
        const signature = resp.razorpay_signature ?? "";
        if (!paymentId || !signature) { reject(new Error("Missing payment fields from Razorpay.")); return; }
        resolve({ paymentId, orderId: resp.razorpay_order_id || order.orderId, signature });
      },
    });
    rzp.on("payment.failed", (resp) => {
      reject(new Error(resp.error?.description || "Payment failed."));
    });
    rzp.open();
  });
}

/** Full subscription upgrade flow: order → checkout → verify + activate. */
export async function upgradePlan(args: {
  planTier: string;
  billingCycle: "monthly" | "yearly";
  prefill: { name: string; email: string; contact: string };
}): Promise<void> {
  if (!functions) throw new Error("Payments are not available right now.");
  const order = await createOrder({ purpose: "subscription", planTier: args.planTier, billingCycle: args.billingCycle });
  const pay = await openCheckout(order, args.prefill, `Ekansh Lab — ${args.planTier} (${args.billingCycle})`);
  const verify = httpsCallable(functions, "verifyPaymentAndUpgrade");
  await verify({
    paymentId: pay.paymentId,
    orderId: pay.orderId,
    signature: pay.signature,
    planTier: args.planTier,
    billingCycle: args.billingCycle,
  });
}
