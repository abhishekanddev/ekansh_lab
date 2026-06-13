import { useEffect } from "react";

/**
 * Public marketing landing — navy + gold luxury theme.
 * Ported from ekansh_portal/marketing/lab.html (lab-specific pricing & copy).
 * All CTAs route to /app/login.
 */

const FEAT_ICON_SVG =
  '<div class="feat-ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="1.5" stroke-linecap="round"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg></div>';
const featIcon = FEAT_ICON_SVG;

function plan(name: string, price: string, sub: string, items: string[], featured: boolean) {
  return `
  <div class="plan-card ${featured ? "plan-featured" : ""}">
    ${featured ? '<div class="plan-badge">RECOMMENDED</div>' : ""}
    <div class="plan-name">${name}</div>
    <div class="plan-price"><span class="pp">${price}</span><span class="pm">/month</span></div>
    <div class="plan-sub">${sub}</div>
    <div class="plan-div"></div>
    <ul class="plan-list">${items.map((i) => `<li><span class="chk">✓</span>${i}</li>`).join("")}</ul>
    <a href="/app/login" class="${featured ? "btn-gold" : "btn-ghost"} plan-cta">${featured ? "Start free trial →" : "Get started"}</a>
  </div>`;
}

const MARKUP = `
<nav id="topnav" class="nav-glass">
  <div class="nav-inner">
    <div class="nav-left">
      <a href="/" class="wordmark">
        <span class="wm-text">Ekansh</span><span class="wm-sub">Lab Suite</span>
      </a>
    </div>
    <div class="nav-links">
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
      <a href="/app/login">Login</a>
    </div>
    <a href="/app/login" class="btn-gold nav-cta">Start free trial →</a>
    <button id="mobileMenu" class="mobile-burger" aria-label="Menu">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
    </button>
  </div>
  <div id="mobileDrawer" class="mobile-drawer">
    <a href="#features">Features</a>
    <a href="#pricing">Pricing</a>
    <a href="/app/login">Login</a>
    <a href="/app/login" class="btn-gold" style="text-align:center;">Start free trial →</a>
  </div>
</nav>

<section class="hero dot-grid">
  <div class="glow glow-cyan"></div>
  <div class="glow glow-gold"></div>
  <div class="hero-inner">
    <div class="hero-copy">
      <div class="pill-gold"><span class="dot"></span>Trusted by 200+ labs across India</div>
      <h1 class="hero-h1">Run your lab<br>like the<br><em>top 1%.</em></h1>
      <p class="hero-sub">Reports, billing, doctor portal, and AI interpretation in one beautifully simple workspace. Built for Indian labs.</p>
      <div class="hero-cta">
        <a href="/app/login" class="btn-gold lg">Start 5-day free trial</a>
        <a href="#features" class="btn-ghost lg">Explore features</a>
      </div>
      <div class="trust">
        <p class="trust-label">Powering diagnostics at</p>
        <div class="trust-logos">
          <span>Jeevan Raksha Pharmacy</span><span>Medix Path Lab</span><span>Criticure Lab</span>
        </div>
        <p class="trust-note">✓ No credit card required &nbsp;·&nbsp; Cancel any time</p>
      </div>
    </div>
    <div class="hero-mock float">
      <div class="mock-shell">
        <div class="mock-top">
          <div><div class="mock-lab">Aarogya Diagnostics</div><div class="mock-meta">CBC Report · 27 May 2026</div></div>
          <div class="ai-live"><span class="ai-dot"></span>AI LIVE</div>
        </div>
        <div class="mock-patient"><div class="mp-name">Sneha Iyer</div><div class="mp-meta">32F · Ref: Dr. R.K. Sharma · UHID: AAD-04471</div></div>
        <div class="mock-table">
          <div class="mt-head"><span class="c1">Parameter</span><span class="c2">Value</span><span class="c3">Unit</span><span class="c4"></span></div>
          <div class="prow"><span class="c1">Haemoglobin</span><span class="c2">13.2</span><span class="c3">g/dL</span><span class="c4"><span class="flag-n">OK</span></span></div>
          <div class="prow"><span class="c1">Total WBC</span><span class="c2 hi">11,800</span><span class="c3">/cumm</span><span class="c4"><span class="flag-h">↑H</span></span></div>
          <div class="prow"><span class="c1">MCV</span><span class="c2 lo">72.0</span><span class="c3">fL</span><span class="c4"><span class="flag-l">↓L</span></span></div>
          <div class="prow"><span class="c1">RDW-CV</span><span class="c2 hi">16.8</span><span class="c3">%</span><span class="c4"><span class="flag-h">↑H</span></span></div>
          <div class="prow"><span class="c1">Platelet Count</span><span class="c2">285K</span><span class="c3">/cumm</span><span class="c4"><span class="flag-n">OK</span></span></div>
        </div>
      </div>
      <div class="ai-card gold-pulse">
        <div class="ai-head"><span class="ai-star">✦</span><span>AI Interpretation</span><span class="ai-count">3 flags</span></div>
        <div class="ai-item">↑ WBC elevated — possible infection or reactive leukocytosis. Suggest CRP follow-up.</div>
        <div class="ai-item">↓ MCV low — microcytic pattern. Consider iron studies & TIBC.</div>
        <div class="ai-item">↑ RDW-CV elevated — anisocytosis noted; correlate with peripheral smear.</div>
      </div>
    </div>
  </div>
</section>

<section id="features" class="sec">
  <div class="sec-head reveal">
    <div class="tag tag-cyan">Platform</div>
    <h2>Everything your lab needs.<br><span class="gold">Nothing it doesn't.</span></h2>
    <p>From day one to NABL certification — a single workspace replaces five separate tools.</p>
  </div>
  <div class="feat-grid">
    <div class="feat-card reveal">${featIcon}<div class="ft">AI Report Interpretation</div><p>Flag abnormalities and draft clinical notes automatically.</p></div>
    <div class="feat-card reveal">${featIcon}<div class="ft">Smart Report Builder</div><p>Branded PDFs in seconds with auto-populated reference ranges for 2,000+ parameters.</p></div>
    <div class="feat-card reveal">${featIcon}<div class="ft">Doctor & Patient Portal</div><p>Doctors review, patients download. WhatsApp delivery built in.</p></div>
    <div class="feat-card reveal">${featIcon}<div class="ft">Billing & GST</div><p>One-click invoices with line items, discount, and GST. Daily collection summary.</p></div>
    <div class="feat-card reveal">${featIcon}<div class="ft">Multi-device Sync</div><p>Phone, tablet, front desk — real-time, offline-safe. Staff permissions per role.</p></div>
    <div class="feat-card reveal">${featIcon}<div class="ft">Audit-grade Compliance</div><p>Every edit logged. NABL-ready audit trail. QR-verified reports patients can check.</p></div>
  </div>
</section>

<div class="gold-rule-wrap"><div class="gold-rule"></div></div>

<section id="pricing" class="sec">
  <div class="sec-head reveal">
    <div class="tag tag-gold">Pricing</div>
    <h2>Start at ₹299.<br><span class="gold">Grow as you scale.</span></h2>
    <p>Every plan includes core reports. AI interpretation available on Basic and above.</p>
  </div>
  <div class="plan-grid reveal">
    ${plan("Starter", "₹299", "Single-technician labs", ["10 reports / day", "1 device", "Billing & GST"], false)}
    ${plan("Basic", "₹349", "Growing labs", ["20 reports / day", "3 AI reports / day", "1 device", "Billing & GST"], false)}
    ${plan("Basic+", "₹399", "Higher volume", ["25 reports / day", "10 AI reports / day", "2 devices", "1 Staff account", "Billing & GST"], true)}
    ${plan("Pro", "₹499", "Multi-technician", ["50 reports / day", "20 AI reports / day", "2 devices", "1 Staff account", "Billing & GST"], false)}
    ${plan("Premium", "₹699", "Full diagnostic centre", ["Unlimited reports", "50 AI reports / day", "Doctor review flow", "WhatsApp delivery", "2 devices"], false)}
  </div>
  <div class="topup reveal">
    <div class="topup-ico">✦</div>
    <div class="topup-body"><div class="topup-title">AI Top-up <span class="topup-price">₹49</span></div><div class="topup-sub">+50 AI interpretation credits. Stack on any plan. Credits never expire.</div></div>
    <a href="/app/login" class="btn-ghost">Buy credits</a>
  </div>
  <p class="price-foot">All plans include 5-day free trial · Prices in INR · GST included · Cancel any time</p>
</section>

<div class="gold-rule-wrap"><div class="gold-rule"></div></div>

<section class="sec">
  <div class="cta-banner reveal">
    <h2>Your lab deserves better software<br>than a 2009 Excel sheet.</h2>
    <p>Set up in 15 minutes. First report in 20. No training needed. Built for the way Indian labs actually work.</p>
    <div class="cta-row">
      <a href="/app/login" class="btn-gold lg">Start 5-day free trial</a>
      <a href="mailto:chaurasiaservices@gmail.com?subject=Ekansh%20Lab%20demo" class="btn-ghost lg">Book a demo →</a>
    </div>
    <p class="cta-foot">✓ No credit card &nbsp;·&nbsp; ✓ Full access &nbsp;·&nbsp; ✓ Cancel any time</p>
  </div>
</section>

<footer class="foot">
  <div class="foot-inner">
    <div class="foot-brand">
      <div class="wm-text" style="font-size:24px;">Ekansh</div>
      <p>The operating system for modern diagnostic labs. Built in India, for India.</p>
    </div>
    <div class="foot-col"><div class="fc-head">Product</div><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#features">AI Interpretation</a></div>
    <div class="foot-col"><div class="fc-head">Company</div><a href="#">About</a><a href="#">Contact</a></div>
    <div class="foot-col"><div class="fc-head">Legal</div><a href="#">Privacy Policy</a><a href="#">Terms of Service</a></div>
  </div>
  <div class="foot-bottom">
    <span>© 2026 Ekansh Lab Suite by Ekansh Systems. All rights reserved.</span>
    <span class="foot-badges">🛡️ ISO 15189 aligned &nbsp;·&nbsp; 🔒 AES-256 encrypted &nbsp;·&nbsp; 🇮🇳 Made in India</span>
  </div>
</footer>
`;

const STYLE = `
.landing { background:#0A1628; color:#F8F6F1; font-family:'Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased; overflow-x:hidden; min-height:100vh; }
.landing a { text-decoration:none; }
.landing .dot-grid { background-image: radial-gradient(rgba(212,175,55,0.07) 1px, transparent 1px); background-size:32px 32px; }
.landing .gold { color:#D4AF37; }

.btn-gold { background:linear-gradient(135deg,#D4AF37 0%,#B8960F 100%); color:#0A1628; font-weight:700; cursor:pointer; border:none; box-shadow:0 4px 20px rgba(212,175,55,0.22); transition:transform .2s, box-shadow .2s; padding:10px 20px; border-radius:12px; font-size:14px; display:inline-block; }
.btn-gold:hover { transform:translateY(-1px); box-shadow:0 10px 36px rgba(212,175,55,0.38); }
.btn-ghost { background:transparent; border:1px solid rgba(255,255,255,0.16); color:#F8F6F1; cursor:pointer; transition:background .2s,border-color .2s; padding:10px 18px; border-radius:12px; font-size:14px; display:inline-block; }
.btn-ghost:hover { background:rgba(255,255,255,0.06); border-color:rgba(255,255,255,0.32); }
.btn-gold.lg,.btn-ghost.lg { padding:15px 30px; font-size:15px; }

/* NAV */
.nav-glass { position:fixed; top:0; left:0; right:0; z-index:50; padding:16px 24px; transition:background .4s,border-bottom .4s; }
.nav-glass.scrolled { background:rgba(10,22,40,0.88); backdrop-filter:blur(20px); border-bottom:1px solid rgba(255,255,255,0.07); }
.nav-inner { max-width:1200px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:24px; }
.wordmark { display:flex; align-items:baseline; gap:8px; }
.wm-text { font-family:'Fraunces',Georgia,serif; font-weight:700; font-size:26px; letter-spacing:-1px; color:#F8F6F1; }
.wm-sub { font-size:12px; font-weight:600; color:#D4AF37; letter-spacing:1px; text-transform:uppercase; }
.nav-links { display:flex; align-items:center; gap:32px; }
.nav-links a { font-size:14px; color:#94A3B8; transition:color .2s; }
.nav-links a:hover { color:#F8F6F1; }
.nav-cta { }
.mobile-burger { display:none; background:none; border:none; color:#F8F6F1; cursor:pointer; }
.mobile-drawer { display:none; flex-direction:column; gap:14px; padding:20px 24px; border-top:1px solid rgba(255,255,255,0.07); margin-top:16px; }
.mobile-drawer a { color:#94A3B8; font-size:16px; }
@media (max-width:860px){ .nav-links,.nav-cta{ display:none; } .mobile-burger{ display:block; } }

/* HERO */
.hero { position:relative; min-height:100vh; display:flex; align-items:center; overflow:hidden; padding-top:80px; }
.glow { position:absolute; pointer-events:none; }
.glow-cyan { top:-10%; left:-5%; width:55%; height:70%; background:radial-gradient(ellipse,rgba(34,211,238,0.06) 0%,transparent 65%); }
.glow-gold { top:15%; right:-15%; width:65%; height:80%; background:radial-gradient(ellipse,rgba(212,175,55,0.07) 0%,transparent 65%); }
.hero-inner { max-width:1200px; margin:0 auto; padding:96px 24px; width:100%; display:grid; grid-template-columns:1fr 1fr; gap:56px; align-items:center; }
@media (max-width:980px){ .hero-inner{ grid-template-columns:1fr; } .hero-mock{ display:none !important; } }
.pill-gold { display:inline-flex; align-items:center; gap:8px; padding:6px 14px; border-radius:999px; background:rgba(212,175,55,0.10); border:1px solid rgba(212,175,55,0.28); font-size:12px; font-weight:600; color:#D4AF37; margin-bottom:32px; }
.pill-gold .dot { width:6px; height:6px; border-radius:50%; background:#D4AF37; }
.hero-h1 { font-family:'Fraunces',Georgia,serif; font-size:70px; line-height:1.04; font-weight:700; letter-spacing:-2px; color:#F8F6F1; }
.hero-h1 em { color:#D4AF37; font-style:italic; }
@media (max-width:640px){ .hero-h1{ font-size:42px; } }
.hero-sub { font-size:18px; color:#94A3B8; line-height:1.72; margin-top:24px; max-width:460px; }
.hero-cta { display:flex; align-items:center; gap:14px; margin-top:36px; flex-wrap:wrap; }
.trust { margin-top:48px; padding-top:36px; border-top:1px solid rgba(255,255,255,0.07); }
.trust-label { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:#475569; margin-bottom:18px; }
.trust-logos { display:flex; align-items:center; gap:32px; flex-wrap:wrap; opacity:0.35; }
.trust-logos span { font-size:13px; font-weight:700; }
.trust-note { font-size:12px; color:#475569; margin-top:18px; }

/* HERO MOCK */
.hero-mock { position:relative; display:flex; justify-content:center; }
.float { animation:lndFloat 5s ease-in-out infinite; }
@keyframes lndFloat { 0%,100%{ transform:translateY(0);} 50%{ transform:translateY(-8px);} }
.mock-shell { width:100%; max-width:400px; background:#0D1E35; border:1px solid rgba(255,255,255,0.07); border-radius:18px; overflow:hidden; box-shadow:0 48px 96px rgba(0,0,0,0.65); }
.mock-top { padding:14px 18px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.06); }
.mock-lab { font-family:'Fraunces',serif; font-weight:700; font-size:14px; }
.mock-meta { font-size:10px; color:#64748B; margin-top:2px; }
.ai-live { display:flex; align-items:center; gap:6px; padding:5px 10px; border-radius:999px; background:rgba(34,211,238,0.10); border:1px solid rgba(34,211,238,0.25); font-size:10px; font-weight:700; color:#22D3EE; letter-spacing:.5px; }
.ai-dot { width:6px; height:6px; border-radius:50%; background:#22D3EE; box-shadow:0 0 6px #22D3EE; }
.mock-patient { padding:12px 18px; background:rgba(22,45,79,0.6); border-bottom:1px solid rgba(255,255,255,0.05); }
.mp-name { font-size:13px; font-weight:700; }
.mp-meta { font-size:11px; color:#64748B; margin-top:2px; }
.mock-table { padding:14px 18px; }
.mt-head { display:flex; gap:8px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.06); }
.mt-head span,.prow span { font-size:11px; }
.mt-head .c1,.mt-head .c2,.mt-head .c3 { font-size:9px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:#374151; }
.prow { display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px solid rgba(255,255,255,0.05); }
.prow:last-child { border-bottom:none; }
.c1 { flex:3; color:#D1D5DB; } .c2 { flex:2; text-align:right; font-weight:600; color:#F8F6F1; } .c3 { width:48px; text-align:right; color:#6B7280; } .c4 { width:36px; text-align:right; }
.c2.hi { color:#F87171; font-weight:700; } .c2.lo { color:#93C5FD; font-weight:700; }
.flag-h { background:rgba(244,67,54,0.15); color:#F44336; padding:2px 7px; border-radius:4px; font-size:10px; font-weight:700; }
.flag-l { background:rgba(33,150,243,0.15); color:#64B5F6; padding:2px 7px; border-radius:4px; font-size:10px; font-weight:700; }
.flag-n { background:rgba(76,175,80,0.12); color:#66BB6A; padding:2px 7px; border-radius:4px; font-size:10px; font-weight:700; }
.ai-card { position:absolute; bottom:-28px; right:-24px; z-index:10; width:248px; background:#0A1628; border:1.5px solid rgba(212,175,55,0.55); border-radius:16px; padding:16px 18px; }
.gold-pulse { animation:lndPulse 2.8s ease-in-out infinite; }
@keyframes lndPulse { 0%,100%{ box-shadow:0 0 0 0 rgba(212,175,55,0.45),0 20px 48px rgba(0,0,0,0.5);} 50%{ box-shadow:0 0 0 14px rgba(212,175,55,0),0 20px 48px rgba(212,175,55,0.22);} }
.ai-head { display:flex; align-items:center; gap:7px; margin-bottom:12px; font-size:11px; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:#D4AF37; }
.ai-count { margin-left:auto; background:rgba(212,175,55,0.12); font-size:9px; padding:2px 7px; border-radius:999px; }
.ai-item { font-size:12px; color:#D1D5DB; line-height:1.45; padding:9px 0; border-bottom:1px solid rgba(212,175,55,0.10); }
.ai-item:last-child { border-bottom:none; }

/* SECTIONS */
.sec { padding:96px 24px; max-width:1200px; margin:0 auto; }
.sec-head { text-align:center; margin-bottom:64px; }
.tag { display:inline-flex; padding:5px 14px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:1.4px; text-transform:uppercase; margin-bottom:20px; }
.tag-cyan { background:rgba(34,211,238,0.08); border:1px solid rgba(34,211,238,0.2); color:#22D3EE; }
.tag-gold { background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.22); color:#D4AF37; }
.sec-head h2 { font-family:'Fraunces',serif; font-size:48px; font-weight:700; letter-spacing:-1.2px; line-height:1.12; }
.sec-head p { font-size:17px; color:#94A3B8; margin-top:18px; max-width:520px; margin-left:auto; margin-right:auto; line-height:1.7; }

.feat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:16px; }
.feat-card { background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.07); border-radius:18px; padding:30px; transition:transform .22s,border-color .22s,background .22s; }
.feat-card:hover { transform:translateY(-5px); border-color:rgba(212,175,55,0.24); background:rgba(255,255,255,0.05); }
.feat-ico { width:44px; height:44px; border-radius:12px; background:rgba(212,175,55,0.10); display:flex; align-items:center; justify-content:center; margin-bottom:20px; }
.ft { font-size:18px; font-weight:700; margin-bottom:10px; }
.feat-card p { font-size:14px; color:#64748B; line-height:1.65; }

.gold-rule-wrap { max-width:1200px; margin:0 auto; padding:0 24px; }
.gold-rule { height:1px; background:linear-gradient(90deg,transparent,rgba(212,175,55,0.4),transparent); }

/* PRICING */
.plan-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:14px; margin-top:52px; }
.plan-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:22px; padding:32px 24px; transition:transform .22s; position:relative; }
.plan-card:hover { transform:translateY(-3px); }
.plan-featured { background:linear-gradient(150deg,rgba(212,175,55,0.11),rgba(212,175,55,0.04)); border-color:rgba(212,175,55,0.38); }
.plan-badge { position:absolute; top:0; left:50%; transform:translateX(-50%); background:linear-gradient(135deg,#D4AF37,#B8960F); color:#0A1628; font-size:9px; font-weight:800; letter-spacing:2px; padding:4px 18px; border-radius:0 0 10px 10px; }
.plan-name { font-size:13px; font-weight:700; color:#94A3B8; letter-spacing:1px; text-transform:uppercase; margin-bottom:10px; margin-top:6px; }
.plan-price { display:flex; align-items:baseline; gap:4px; margin-bottom:6px; }
.pp { font-family:'Fraunces',serif; font-size:38px; font-weight:700; letter-spacing:-1px; }
.pm { font-size:13px; color:#64748B; }
.plan-sub { font-size:12px; color:#64748B; margin-bottom:22px; }
.plan-div { height:1px; background:rgba(255,255,255,0.07); margin-bottom:22px; }
.plan-list { list-style:none; display:flex; flex-direction:column; gap:10px; margin-bottom:28px; padding:0; }
.plan-list li { font-size:13px; color:#D1D5DB; display:flex; gap:9px; align-items:flex-start; }
.chk { color:#D4AF37; font-size:15px; }
.plan-cta { width:100%; text-align:center; padding:12px; }
.topup { background:rgba(34,211,238,0.05); border:1px solid rgba(34,211,238,0.18); border-radius:14px; padding:20px 22px; display:flex; align-items:center; gap:20px; margin-top:20px; max-width:680px; margin-left:auto; margin-right:auto; }
.topup-ico { width:40px; height:40px; border-radius:12px; background:rgba(34,211,238,0.10); display:flex; align-items:center; justify-content:center; color:#22D3EE; font-size:18px; }
.topup-body { flex:1; }
.topup-title { font-size:15px; font-weight:700; display:flex; align-items:center; gap:10px; }
.topup-price { font-family:'Fraunces',serif; font-size:20px; color:#22D3EE; }
.topup-sub { font-size:13px; color:#64748B; margin-top:3px; }
.price-foot { text-align:center; font-size:13px; color:#475569; margin-top:32px; }

/* CTA */
.cta-banner { max-width:900px; margin:0 auto; text-align:center; background:rgba(212,175,55,0.06); border:1px solid rgba(212,175,55,0.16); border-radius:28px; padding:56px 40px; }
.cta-banner h2 { font-family:'Fraunces',serif; font-size:44px; font-weight:700; letter-spacing:-1px; line-height:1.12; }
.cta-banner p { font-size:17px; color:#94A3B8; margin-top:18px; line-height:1.7; max-width:480px; margin-left:auto; margin-right:auto; }
.cta-row { display:flex; justify-content:center; align-items:center; gap:14px; margin-top:36px; flex-wrap:wrap; }
.cta-foot { font-size:12px; color:#475569; margin-top:20px; }

/* FOOTER */
.foot { border-top:1px solid rgba(255,255,255,0.06); padding:48px 24px; }
.foot-inner { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:2fr 1fr 1fr 1fr; gap:40px; }
@media (max-width:760px){ .foot-inner{ grid-template-columns:1fr 1fr; } }
.foot-brand p { font-size:13px; color:#475569; line-height:1.7; max-width:240px; margin-top:12px; }
.fc-head { font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#475569; margin-bottom:16px; }
.foot-col a { display:block; font-size:13px; color:#64748B; margin-bottom:10px; }
.foot-col a:hover { color:#F8F6F1; }
.foot-bottom { max-width:1200px; margin:48px auto 0; padding-top:28px; border-top:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; font-size:12px; color:#374151; }

.reveal { opacity:0; transform:translateY(28px); transition:opacity .65s ease, transform .65s ease; }
.reveal.in { opacity:1; transform:translateY(0); }
`;

export function Landing() {
  useEffect(() => {
    const nav = document.getElementById("topnav");
    const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });

    const burger = document.getElementById("mobileMenu");
    const drawer = document.getElementById("mobileDrawer");
    const toggle = () => {
      if (drawer) drawer.style.display = drawer.style.display === "flex" ? "none" : "flex";
    };
    burger?.addEventListener("click", toggle);

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); observer.unobserve(e.target); } }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".landing .reveal").forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      burger?.removeEventListener("click", toggle);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <style>{STYLE}</style>
      <div className="landing" dangerouslySetInnerHTML={{ __html: MARKUP }} />
    </>
  );
}
