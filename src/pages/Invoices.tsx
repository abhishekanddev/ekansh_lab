import { useMemo, useState } from "react";
import { Plus, X, Trash2, Receipt, Download } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { Spinner, EmptyState } from "../components/ui";
import { useInvoices, useHospitalConfig } from "../hooks/useLabData";
import { useCreateInvoice, type CreateInvoiceInput } from "../hooks/useInvoices";
import { downloadInvoicePdf } from "../lib/pdf/invoicePdf";
import { fmtDate, fmtMoney } from "../lib/format";
import type { InvoiceLineItem, InvoiceModel } from "../lib/types";

export function Invoices() {
  const invoices = useInvoices();
  const config = useHospitalConfig();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function downloadPdf(inv: InvoiceModel) {
    setBusyId(inv.id);
    try {
      await downloadInvoicePdf(inv, config.data ?? {});
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumb="Home / Billing"
        title="Billing"
        description="Invoices with GST and auto-numbered receipts."
        actions={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New Invoice</button>}
      />

      <div className="card overflow-hidden">
        {invoices.isLoading ? (
          <Spinner />
        ) : (invoices.data?.length ?? 0) === 0 ? (
          <div className="p-8"><EmptyState title="No invoices yet" hint="Create your first invoice." action={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New Invoice</button>} /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-faint)] border-b border-[var(--color-border)]">
                <th className="font-semibold px-4 py-2.5">Invoice #</th>
                <th className="font-semibold px-4 py-2.5">Patient</th>
                <th className="font-semibold px-4 py-2.5">Date</th>
                <th className="font-semibold px-4 py-2.5">Payment</th>
                <th className="font-semibold px-4 py-2.5 text-right">Amount</th>
                <th className="font-semibold px-4 py-2.5 text-right">PDF</th>
              </tr>
            </thead>
            <tbody>
              {invoices.data!.map((inv) => (
                <tr key={inv.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg)]">
                  <td className="px-4 py-3 font-medium num inline-flex items-center gap-2"><Receipt size={15} className="text-[var(--color-muted)]" />{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">{inv.patientName || "—"}</td>
                  <td className="px-4 py-3 num text-[var(--color-muted)]">{fmtDate(inv.date)}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{inv.paymentMode}</td>
                  <td className="px-4 py-3 text-right num font-semibold">{fmtMoney(inv.finalBillAmount)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => downloadPdf(inv)} disabled={busyId === inv.id} title="Download bill PDF"
                      className="w-8 h-8 grid place-items-center rounded-md border border-[var(--color-border)] text-[var(--color-muted)] hover:bg-white ml-auto">
                      <Download size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && <CreateInvoiceModal onClose={() => setOpen(false)} />}
    </div>
  );
}

type LineItemDraft = { particulars: string; rate: string; quantity: string; discountPercent: string; taxPercent: string };

export interface InvoiceSeed {
  patientName?: string;
  phone?: string;
  age?: string;
  gender?: string;
  patientUhid?: string;
  reportId?: string;
  items?: { particulars: string; rate: number }[];
}

export function CreateInvoiceModal({ onClose, seed }: { onClose: () => void; seed?: InvoiceSeed }) {
  const create = useCreateInvoice();
  const [patientName, setPatientName] = useState(seed?.patientName ?? "");
  const [phone, setPhone] = useState(seed?.phone ?? "");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [items, setItems] = useState<LineItemDraft[]>(
    seed?.items?.length
      ? seed.items.map((it) => ({ particulars: it.particulars, rate: String(it.rate || ""), quantity: "1", discountPercent: "0", taxPercent: "0" }))
      : [{ particulars: "", rate: "", quantity: "1", discountPercent: "0", taxPercent: "0" }],
  );

  const computed = useMemo(() => {
    const lines: InvoiceLineItem[] = items.map((it) => {
      const rate = Number(it.rate) || 0;
      const qty = Number(it.quantity) || 0;
      const disc = Number(it.discountPercent) || 0;
      const tax = Number(it.taxPercent) || 0;
      const gross = rate * qty;
      const afterDisc = gross * (1 - disc / 100);
      const amount = afterDisc * (1 + tax / 100);
      return { particulars: it.particulars, rate, quantity: qty, discountPercent: disc, taxPercent: tax, amount: Math.round(amount * 100) / 100 };
    });
    const billAmount = lines.reduce((s, l) => s + l.rate * l.quantity, 0);
    const discountTotal = lines.reduce((s, l) => s + l.rate * l.quantity * ((l.discountPercent ?? 0) / 100), 0);
    const taxTotal = lines.reduce((s, l) => {
      const afterDisc = l.rate * l.quantity * (1 - (l.discountPercent ?? 0) / 100);
      return s + afterDisc * ((l.taxPercent ?? 0) / 100);
    }, 0);
    const finalBillAmount = lines.reduce((s, l) => s + l.amount, 0);
    return { lines, billAmount, discountTotal, taxTotal, finalBillAmount: Math.round(finalBillAmount * 100) / 100 };
  }, [items]);

  function setItem(i: number, patch: Partial<(typeof items)[number]>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  async function submit() {
    const input: CreateInvoiceInput = {
      patientName, phone,
      age: seed?.age, gender: seed?.gender, patientUhid: seed?.patientUhid,
      reportId: seed?.reportId,
      lineItems: computed.lines,
      billAmount: computed.billAmount,
      discountTotal: computed.discountTotal,
      taxTotal: computed.taxTotal,
      finalBillAmount: computed.finalBillAmount,
      paidAmount: computed.finalBillAmount,
      paymentMode,
    };
    await create.mutateAsync(input);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
          <h3 className="font-semibold">New Invoice</h3>
          <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-ink)]"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Patient name</label><input className="input" value={patientName} onChange={(e) => setPatientName(e.target.value)} /></div>
            <div><label className="label">Phone</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Line items</label>
              <button className="text-[13px] text-[var(--color-primary-600)] hover:underline" onClick={() => setItems([...items, { particulars: "", rate: "", quantity: "1", discountPercent: "0", taxPercent: "0" }])}>+ Add</button>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex gap-1.5 items-center">
                  <input className="input h-9 flex-1" placeholder="Particulars" value={it.particulars} onChange={(e) => setItem(i, { particulars: e.target.value })} />
                  <input className="input h-9 w-20" placeholder="Rate" inputMode="decimal" value={it.rate} onChange={(e) => setItem(i, { rate: e.target.value })} />
                  <input className="input h-9 w-14" placeholder="Qty" inputMode="numeric" value={it.quantity} onChange={(e) => setItem(i, { quantity: e.target.value })} />
                  <input className="input h-9 w-16" placeholder="Disc%" inputMode="decimal" value={it.discountPercent} onChange={(e) => setItem(i, { discountPercent: e.target.value })} />
                  <input className="input h-9 w-16" placeholder="GST%" inputMode="decimal" value={it.taxPercent} onChange={(e) => setItem(i, { taxPercent: e.target.value })} />
                  <button className="w-8 h-8 grid place-items-center text-[var(--color-danger)]" onClick={() => setItems(items.filter((_, idx) => idx !== i))}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <div><label className="label">Payment mode</label>
              <select className="input" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                <option>Cash</option><option>Card</option><option>UPI</option><option>Bank Transfer</option>
              </select>
            </div>
            <div className="text-right">
              <div className="text-[12px] text-[var(--color-muted)]">Discount {fmtMoney(computed.discountTotal)} · GST {fmtMoney(computed.taxTotal)}</div>
              <div className="text-[22px] font-bold num">{fmtMoney(computed.finalBillAmount)}</div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-[var(--color-border)]">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={create.isPending} onClick={submit}>{create.isPending ? "Saving…" : "Create invoice"}</button>
        </div>
      </div>
    </div>
  );
}
