"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const go = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:'Inter',sans-serif;background:#fff;color:#0f172a;overflow-x:hidden}

        .nav{position:fixed;top:0;left:0;right:0;z-index:200;padding:0 32px;height:64px;display:flex;align-items:center;justify-content:space-between;background:rgba(8,8,24,0.7);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.06)}
        .nav-links{display:flex;gap:32px;align-items:center}
        .nl{color:rgba(255,255,255,0.55);font-size:14px;font-weight:500;cursor:pointer;transition:color .15s;text-decoration:none}
        .nl:hover{color:#fff}
        .nav-btn{background:linear-gradient(135deg,#7C3AED,#4F46E5);color:#fff;padding:10px 22px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;box-shadow:0 4px 20px rgba(124,58,237,0.4);transition:opacity .2s,transform .15s}
        .nav-btn:hover{opacity:.9;transform:translateY(-1px)}
        .hamburger{display:none;background:none;border:none;color:#fff;font-size:22px;cursor:pointer}
        .mmenu{display:none;flex-direction:column;position:fixed;top:64px;left:0;right:0;background:rgba(8,8,24,0.97);backdrop-filter:blur(20px);z-index:199;border-bottom:1px solid rgba(255,255,255,0.08)}
        .mmenu.open{display:flex}
        .mlink{padding:16px 32px;color:rgba(255,255,255,0.7);font-size:15px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.05)}
        .mbtn{padding:16px 32px;color:#a78bfa;font-weight:700;cursor:pointer}

        /* HERO */
        .hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:100px 24px 80px;background:#080818;position:relative;overflow:hidden}
        .orb1{position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,0.25) 0%,transparent 70%);top:-100px;left:-100px;pointer-events:none;animation:float1 8s ease-in-out infinite}
        .orb2{position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(6,182,212,0.2) 0%,transparent 70%);bottom:-80px;right:-80px;pointer-events:none;animation:float2 10s ease-in-out infinite}
        .orb3{position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(236,72,153,0.15) 0%,transparent 70%);top:50%;left:60%;pointer-events:none;animation:float1 12s ease-in-out infinite reverse}
        @keyframes float1{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-30px) scale(1.05)}}
        @keyframes float2{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(24px) scale(0.97)}}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.35);border-radius:100px;padding:6px 18px;font-size:12px;color:#c4b5fd;margin-bottom:28px;font-weight:600;letter-spacing:.5px;position:relative;z-index:1}
        .badge-dot{width:6px;height:6px;border-radius:50%;background:#7C3AED;box-shadow:0 0 8px #7C3AED}
        .hero-h1{font-size:clamp(40px,7vw,80px);font-weight:900;line-height:1.05;letter-spacing:-3px;color:#fff;position:relative;z-index:1;margin-bottom:24px}
        .grad-text{background:linear-gradient(135deg,#7C3AED,#06B6D4,#10B981);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .hero-sub{color:rgba(255,255,255,0.5);font-size:clamp(15px,2.2vw,20px);max-width:560px;line-height:1.7;margin:0 auto 40px;position:relative;z-index:1}
        .hero-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;position:relative;z-index:1;margin-bottom:16px}
        .btn-hero-primary{background:linear-gradient(135deg,#7C3AED,#4F46E5);color:#fff;padding:16px 36px;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;border:none;box-shadow:0 8px 32px rgba(124,58,237,0.45);transition:transform .15s,box-shadow .2s}
        .btn-hero-primary:hover{transform:translateY(-3px);box-shadow:0 16px 48px rgba(124,58,237,0.55)}
        .btn-hero-ghost{background:rgba(255,255,255,0.07);color:#fff;padding:16px 36px;border-radius:14px;font-size:16px;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,0.15);transition:background .15s,transform .15s;backdrop-filter:blur(8px)}
        .btn-hero-ghost:hover{background:rgba(255,255,255,0.12);transform:translateY(-3px)}
        .hero-note{color:rgba(255,255,255,0.25);font-size:12px;position:relative;z-index:1}
        .hero-note span{margin:0 8px}

        /* TRUST BAR */
        .trust{background:#0d0d20;padding:20px 32px 30px;display:flex;align-items:center;justify-content:center;gap:40px;flex-wrap:wrap;border-top:1px solid rgba(255,255,255,0.05)}
        .trust-item{display:flex;align-items:center;gap:10px}
        .trust-icon{font-size:20px}
        .trust-text{color:rgba(255,255,255,0.4);font-size:13px;font-weight:500}
        .trust-val{color:rgba(255,255,255,0.8);font-weight:700}
        .wave-div{width:100%;overflow:hidden;line-height:0;background:#fff;margin-top:-1px;}
        .wave-div svg{display:block;width:calc(100% + 1.3px);height:40px;}

        /* FEATURES */
        .sec{padding:100px 24px}
        .sec-inner{max-width:1000px;margin:0 auto}
        .sec-eye{display:inline-block;background:linear-gradient(135deg,rgba(124,58,237,0.1),rgba(6,182,212,0.1));border:1px solid rgba(124,58,237,0.25);border-radius:100px;padding:4px 16px;font-size:11px;color:#a78bfa;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:14px}
        .sec-h2{font-size:clamp(28px,4.5vw,48px);font-weight:900;letter-spacing:-1.5px;margin-bottom:14px;color:#0f172a}
        .sec-sub{color:#64748b;font-size:16px;line-height:1.7;max-width:520px;margin-bottom:60px}
        .feat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
        .feat-card{background:#fff;border:1px solid #F1F5F9;border-radius:20px;padding:28px;transition:all .25s;position:relative;overflow:hidden}
        .feat-card::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(124,58,237,0.04),rgba(6,182,212,0.04));opacity:0;transition:opacity .25s}
        .feat-card:hover{border-color:rgba(124,58,237,0.25);box-shadow:0 20px 60px rgba(124,58,237,0.08);transform:translateY(-4px)}
        .feat-card:hover::before{opacity:1}
        .feat-ico{width:52px;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:18px}
        .feat-title{font-size:15px;font-weight:800;color:#0f172a;margin-bottom:8px}
        .feat-desc{font-size:13px;color:#64748b;line-height:1.75}

        /* HOW */
        .how-sec{padding:100px 24px;background:linear-gradient(135deg,#080818,#0f0a2a)}
        .how-inner{max-width:740px;margin:0 auto}
        .how-sec .sec-h2{color:#fff}
        .how-sec .sec-sub{color:rgba(255,255,255,0.45)}
        .steps{display:flex;flex-direction:column;margin-top:50px}
        .step{display:flex;gap:24px;padding:28px 0;border-bottom:1px solid rgba(255,255,255,0.06)}
        .step:last-child{border-bottom:none}
        .step-num{width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#7C3AED,#4F46E5);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:900;flex-shrink:0;box-shadow:0 8px 24px rgba(124,58,237,0.4)}
        .step-title{color:#fff;font-size:16px;font-weight:700;margin-bottom:6px}
        .step-desc{color:rgba(255,255,255,0.45);font-size:14px;line-height:1.75}

        /* PRICING */
        .pricing-sec{padding:100px 24px;background:#fafbff}
        .plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;margin-top:50px;max-width:900px;margin-left:auto;margin-right:auto}
        .plan{background:#fff;border:1.5px solid #E2E8F0;border-radius:24px;padding:32px 28px;display:flex;flex-direction:column;gap:20px;transition:all .25s;position:relative}
        .plan:hover{box-shadow:0 24px 64px rgba(0,0,0,0.08);transform:translateY(-4px)}
        .plan.hot{border:2px solid transparent;background:linear-gradient(#fff,#fff) padding-box,linear-gradient(135deg,#7C3AED,#06B6D4) border-box;box-shadow:0 16px 48px rgba(124,58,237,0.15)}
        .plan-badge{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#7C3AED,#4F46E5);color:#fff;padding:5px 20px;border-radius:100px;font-size:11px;font-weight:700;white-space:nowrap}
        .plan-name{font-size:16px;font-weight:800;color:#0f172a}
        .plan-desc{font-size:12px;color:#94a3b8;margin-top:2px}
        .plan-price{font-size:42px;font-weight:900;letter-spacing:-2px;color:#0f172a}
        .plan-price span{font-size:16px;color:#94a3b8;font-weight:400}
        .plan-feats{display:flex;flex-direction:column;gap:10px;flex:1}
        .pf{font-size:13px;color:#475569;display:flex;align-items:center;gap:10px}
        .pf-check{color:#7C3AED;font-weight:900;font-size:14px}
        .plan-btn{width:100%;padding:13px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;border:none;background:linear-gradient(135deg,#7C3AED,#4F46E5);color:#fff;box-shadow:0 4px 20px rgba(124,58,237,0.3);transition:opacity .2s,transform .15s}
        .plan-btn:hover{opacity:.9;transform:translateY(-2px)}
        .plan-btn.ghost{background:#F8FAFC;color:#7C3AED;box-shadow:none;border:1.5px solid #E2E8F0}

        /* CTA */
        .cta-sec{padding:100px 24px;text-align:center;background:linear-gradient(135deg,#080818 0%,#1a0b3b 50%,#080818 100%);position:relative;overflow:hidden}
        .cta-orb{position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,0.3) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
        .cta-h2{color:#fff;font-size:clamp(32px,5vw,56px);font-weight:900;letter-spacing:-2px;margin-bottom:16px;position:relative;z-index:1}
        .cta-sub{color:rgba(255,255,255,0.5);font-size:16px;line-height:1.7;margin-bottom:36px;max-width:440px;margin-left:auto;margin-right:auto;position:relative;z-index:1}
        .cta-btn{position:relative;z-index:1;display:inline-block;background:linear-gradient(135deg,#7C3AED,#06B6D4);color:#fff;padding:18px 48px;border-radius:16px;font-size:17px;font-weight:800;cursor:pointer;border:none;box-shadow:0 12px 40px rgba(124,58,237,0.5);transition:transform .15s,box-shadow .2s}
        .cta-btn:hover{transform:translateY(-3px);box-shadow:0 20px 60px rgba(124,58,237,0.6)}

        /* FOOTER */
        .footer{background:#06060f;padding:28px 32px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;border-top:1px solid rgba(255,255,255,0.05)}
        .footer-links{display:flex;gap:20px}
        .flink{color:rgba(255,255,255,0.3);font-size:12px;cursor:pointer;transition:color .15s;text-decoration:none}
        .flink:hover{color:rgba(255,255,255,0.7)}
        .footer-made{color:rgba(255,255,255,0.2);font-size:11px}

        @media(max-width:768px){
          .nav{padding:0 20px}
          .nav-links{display:none}
          .hamburger{display:block}
          .hero{padding:80px 20px 60px}
          .hero-h1{font-size:36px;letter-spacing:-1px}
          .hero-sub{font-size:15px;margin-bottom:32px}
          .hero-btns{flex-direction:column;gap:12px;width:100%}
          .btn-hero-primary, .btn-hero-ghost{width:100%}
          .hero-note{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;line-height:1.6}
          .trust{gap:16px;padding:24px 16px}
          .trust-item{flex:1 1 40%;justify-content:center;text-align:center;flex-direction:column;gap:4px}
          .sec,.how-sec,.pricing-sec,.cta-sec{padding:64px 20px}
          .sec-h2{font-size:28px;letter-spacing:-1px}
          .footer{flex-direction:column;text-align:center;padding:32px 20px;gap:24px}
          .footer-links{flex-direction:column;gap:16px}
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <img src="/logo.svg" alt="TokenPe" style={{ height: 36, width: "auto", cursor: "pointer" }} onClick={() => router.push("/")} />
        <div className="nav-links">
          <span className="nl" onClick={() => go("features")}>Features</span>
          <span className="nl" onClick={() => go("how")}>How it works</span>
          <span className="nl" onClick={() => go("pricing")}>Pricing</span>
          <button className="nav-btn" onClick={() => router.push("/login")}>Get Started →</button>
        </div>
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "✕" : "☰"}</button>
      </nav>
      <div className={`mmenu ${menuOpen ? "open" : ""}`}>
        <span className="mlink" onClick={() => go("features")}>Features</span>
        <span className="mlink" onClick={() => go("how")}>How it works</span>
        <span className="mlink" onClick={() => go("pricing")}>Pricing</span>
        <span className="mbtn" onClick={() => router.push("/login")}>Get Started →</span>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="orb1" /><div className="orb2" /><div className="orb3" />
        <div className="hero-badge"><span className="badge-dot" />🇮🇳 Built for India's 6 lakh+ clinics</div>
        <h1 className="hero-h1">No more waiting.<br /><span className="grad-text">Queue smarter.</span></h1>
        <p className="hero-sub">Replace your clinic's paper token chaos with a WhatsApp-based digital queue. Patients wait at home. Voice updates in 10 languages. Zero apps needed.</p>
        <div className="hero-btns">
          <button className="btn-hero-primary" onClick={() => router.push("/login")}>Start Free Trial →</button>
          <button className="btn-hero-ghost" onClick={() => go("how")}>See how it works</button>
        </div>
        <p className="hero-note"><span>No app for patients</span>·<span>Any phone</span>·<span>2 min setup</span></p>
      </section>

      {/* TRUST */}
      <div className="trust">
        {[["💬", "100%", "WhatsApp Native"], ["🇮🇳", "Built for", "Indian Clinics"], ["🎙️", "10", "Languages"], ["⚡", "2 min", "Setup time"]].map(([ic, v, l]) => (
          <div key={l} className="trust-item">
            <span className="trust-icon">{ic}</span>
            <span className="trust-text"><span className="trust-val">{v}</span> {l}</span>
          </div>
        ))}
      </div>
      <div className="wave-div">
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#0d0d20"></path>
        </svg>
      </div>

      {/* FEATURES */}
      <section id="features" className="sec">
        <div className="sec-inner">
          <div className="sec-eye">Features</div>
          <h2 className="sec-h2">Everything your clinic needs</h2>
          <p className="sec-sub">One tool that replaces paper tokens, crowded waiting rooms, and manual calling — forever.</p>
          <div className="feat-grid">
            {[
              { ico: "🎙️", bg: "linear-gradient(135deg,#f0fdf4,#dcfce7)", title: "Voice in 10 Indian languages", desc: "Patients get WhatsApp voice updates in Hindi, Tamil, Telugu, Marathi, Gujarati and 5 more." },
              { ico: "💬", bg: "linear-gradient(135deg,#eff6ff,#dbeafe)", title: "WhatsApp — zero app needed", desc: "Scan QR → join queue. No downloads, no logins. Works on any phone, even a basic one." },
              { ico: "⚡", bg: "linear-gradient(135deg,#fdf4ff,#f3e8ff)", title: "Real-time live dashboard", desc: "See who's waiting, with doctor, and done — all updating live as patients move through." },
              { ico: "🔔", bg: "linear-gradient(135deg,#fff7ed,#ffedd5)", title: "Smart automatic alerts", desc: "10-away, 5-away, and your-turn alerts sent automatically. Zero manual effort needed." },
              { ico: "📅", bg: "linear-gradient(135deg,#f0f9ff,#e0f2fe)", title: "History by date", desc: "View complete patient records for any past date. Know daily volume at a glance." },
              { ico: "🔲", bg: "linear-gradient(135deg,#fff1f2,#ffe4e6)", title: "QR code + print card", desc: "Generate your clinic's unique QR. Download PNG or print a ready-to-display card." },
            ].map(f => (
              <div key={f.title} className="feat-card">
                <div className="feat-ico" style={{ background: f.bg }}>{f.ico}</div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave Divider: Features (Light) to How it works (Dark) */}
      <div className="wave-div" style={{ background: "#080818" }}>
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#fff"></path>
        </svg>
      </div>

      {/* HOW */}
      <section id="how" className="how-sec">
        <div className="how-inner">
          <div className="sec-eye">How it works</div>
          <h2 className="sec-h2">Up and running in 3 steps</h2>
          <p className="sec-sub">No IT team needed. No hardware. No complexity.</p>
          <div className="steps">
            {[
              { n: "1", t: "Register your clinic", d: "Sign up in 2 minutes with Google or your clinic code. Get your unique WhatsApp QR instantly." },
              { n: "2", t: "Display the QR at reception", d: "Print the card or show on a screen. Patients scan once and they're in the queue — no app needed." },
              { n: "3", t: "Call patients with one tap", d: "Press 'Call Next' on your dashboard. The patient gets a WhatsApp text + voice note in their language." },
            ].map(s => (
              <div key={s.n} className="step">
                <div className="step-num">{s.n}</div>
                <div><div className="step-title">{s.t}</div><div className="step-desc">{s.d}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wave Divider: How it works (Dark) to Pricing (Light) */}
      <div className="wave-div" style={{ background: "#fafbff" }}>
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#0f0a2a"></path>
        </svg>
      </div>

      {/* PRICING */}
      <section id="pricing" className="pricing-sec">
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div className="sec-eye">Pricing</div>
          <h2 className="sec-h2">Simple. Affordable.</h2>
          <p className="sec-sub" style={{ margin: "0 auto 0" }}>Choose the plan that fits your clinic's needs.</p>
        </div>
        <div className="plans">
          {[
            { name: "Starter", desc: "Perfect for small clinics", price: "₹499", per: "/mo", feats: ["50 patients/day", "Standard WhatsApp Alerts", "Basic 7-day Analytics", "Auto-Generated Code"], hot: false },
            { name: "Pro", desc: "For busy clinics that want to look professional", price: "₹999", per: "/mo", feats: ["150 patients/day", "Branded WhatsApp Identity", "Multilingual Voice Alerts", "Queue Pause & Smart Wait Time", "30-Day History & Heatmap"], hot: true },
            { name: "Elite", desc: "For hospitals, polyclinics & top doctors", price: "₹1999", per: "/mo", feats: ["Unlimited patients", "Multi-Clinic Management", "Monthly PDF Reports", "VIP WhatsApp Support", "CRM Broadcasts"], hot: false },
          ].map(p => (
            <div key={p.name} className={`plan${p.hot ? " hot" : ""}`}>
              {p.hot && <div className="plan-badge">✦ Most Popular</div>}
              <div><div className="plan-name">{p.name}</div><div className="plan-desc">{p.desc}</div></div>
              <div className="plan-price">{p.price}<span>{p.per}</span></div>
              <div className="plan-feats">{p.feats.map(f => <div key={f} className="pf"><span className="pf-check">✓</span>{f}</div>)}</div>
              <button className={`plan-btn${p.hot ? "" : " ghost"}`} onClick={() => router.push("/login")}>Get started →</button>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 40, padding: "0 20px" }}>
          <button onClick={() => setShowDetails(true)} style={{ background: "none", border: "none", color: "#7C3AED", fontSize: "15px", fontWeight: "700", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 4, whiteSpace: "normal", lineHeight: 1.5 }}>
            📄 View Detailed Feature Breakdown & Terms
          </button>
        </div>
      </section>

      {/* Wave Divider: Pricing (Light) to CTA (Dark) */}
      <div className="wave-div" style={{ background: "#080818" }}>
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#fafbff"></path>
        </svg>
      </div>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-orb" />
        <h2 className="cta-h2">Ready to transform your clinic?</h2>
        <p className="cta-sub">Join clinics across India already using TokenPe to manage queues and delight patients.</p>
        <button className="cta-btn" onClick={() => router.push("/login")}>Start your free trial →</button>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#080818", borderTop: "1px solid rgba(255,255,255,0.05)", padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginBottom: "24px", flexWrap: "wrap" }}>
          <a href="/privacy" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "14px", fontWeight: "600", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = "white"} onMouseOut={e => e.target.style.color = "#94a3b8"}>Privacy Policy</a>
          <a href="/terms" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "14px", fontWeight: "600", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = "white"} onMouseOut={e => e.target.style.color = "#94a3b8"}>Terms of Service</a>
          <a href="mailto:tokenpe.online@gmail.com" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "14px", fontWeight: "600", transition: "color 0.2s" }} onMouseOver={e => e.target.style.color = "white"} onMouseOut={e => e.target.style.color = "#94a3b8"}>Contact Support</a>
        </div>
        <div style={{ fontSize: "13px", opacity: 0.7 }}>
          Made with ❤️ from TokenPe <br />
          &copy; {new Date().getFullYear()} TokenPe. All rights reserved.
        </div>
      </footer>

      {/* MODAL */}
      {showDetails && (
        <div onClick={() => setShowDetails(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyItems: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", width: "100%", maxWidth: 800, maxHeight: "90vh", overflowY: "auto", borderRadius: 24, padding: "40px 32px", position: "relative", margin: "auto" }}>
            <button onClick={() => setShowDetails(false)} style={{ position: "absolute", top: 20, right: 20, background: "#f1f5f9", border: "none", width: 36, height: 36, borderRadius: "50%", fontSize: 20, cursor: "pointer", color: "#64748b" }}>×</button>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", marginBottom: 8, letterSpacing: "-1px" }}>Detailed Feature Breakdown</h2>
            <p style={{ color: "#64748b", marginBottom: 32 }}>A comprehensive look at what's included in every TokenPe subscription tier.</p>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ textAlign: "left", padding: "16px 8px", color: "#0f172a", width: "40%" }}>Feature</th>
                    <th style={{ textAlign: "center", padding: "16px 8px", color: "#64748b" }}>Starter</th>
                    <th style={{ textAlign: "center", padding: "16px 8px", color: "#7C3AED", fontWeight: 800 }}>Pro</th>
                    <th style={{ textAlign: "center", padding: "16px 8px", color: "#f59e0b", fontWeight: 800 }}>Elite</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: 14, color: "#475569" }}>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Daily Patient Limit</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>50</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 600 }}>150</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 700 }}>Unlimited</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>All WhatsApp Alerts</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Text Only</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Text + AI Voice</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Text + AI Voice</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>AI Voice Notes (10 languages)</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#cbd5e1" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Clinic Code</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Auto-generated</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>Custom (DRSHARMA)</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>Custom (CITYHOSP)</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>QR Card</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Basic</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Name + Address</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Name + Address + Logo</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Queue Pause Button</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#cbd5e1" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Patient Visit History</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>7 Days</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 600 }}>30 Days</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 700 }}>365 Days</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Smart Wait Time Prediction</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#cbd5e1" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>✓</td>
                  </tr>

                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Busy Hour Heatmap</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#cbd5e1" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Personalized Welcome Message</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#cbd5e1" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#cbd5e1" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Multi-Location (3 clinics)</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#cbd5e1" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#cbd5e1" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Patient Feedback & Star Rating</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#cbd5e1" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>CRM Broadcasts</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#cbd5e1" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#cbd5e1" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Smart Patient Follow-ups</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#cbd5e1" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Monthly PDF Report</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#cbd5e1" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#cbd5e1" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "#10b981", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Dashboard Analytics</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>7 Days</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>30 Days + Heatmap</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 600 }}>Unlimited + Excel Export</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Support</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Email</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Priority Email & Chat</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 600 }}>Dedicated WhatsApp Support</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #e2e8f0", fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
              <strong>Terms of Subscription:</strong> All plans automatically renew monthly. You can cancel your subscription at any time from the billing dashboard. The free trial is available for 14 days and provides full access to Elite features. After the trial, you must choose a plan to continue service.
            </div>
          </div>
        </div>
      )}
    </>
  );
}