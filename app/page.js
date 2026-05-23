"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',sans-serif;background:#ffffff;color:#0F172A;overflow-x:hidden}

        /* NAV */
        .nav{position:sticky;top:0;z-index:100;background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);border-bottom:1px solid #F1F5F9;padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between}
        .nav-links{display:flex;gap:32px;align-items:center}
        .nav-link{color:#64748B;font-size:14px;font-weight:500;cursor:pointer;transition:color 0.15s;text-decoration:none}
        .nav-link:hover{color:#0F172A}
        .nav-cta{background:#0F4C75;color:#fff;padding:9px 20px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:background 0.15s,transform 0.1s}
        .nav-cta:hover{background:#1B6CA8;transform:translateY(-1px)}
        .nav-hamburger{display:none;background:none;border:none;color:#0F172A;font-size:22px;cursor:pointer}
        .mobile-menu{display:none;flex-direction:column;background:#fff;border-bottom:1px solid #F1F5F9}
        .mobile-menu.open{display:flex}
        .mobile-menu span{padding:14px 24px;color:#475569;font-size:14px;border-bottom:1px solid #F8FAFC;cursor:pointer}
        .mobile-cta{color:#0F4C75!important;font-weight:600!important}

        /* HERO */
        .hero{padding:80px 24px 64px;text-align:center;background:linear-gradient(180deg,#F0F9FF 0%,#ffffff 100%);position:relative}
        .hero-badge{display:inline-flex;align-items:center;gap:6px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:20px;padding:5px 14px;font-size:12px;color:#1D4ED8;margin-bottom:24px;font-weight:500}
        .hero-headline{font-size:clamp(30px,6vw,54px);font-weight:800;line-height:1.1;margin-bottom:18px;color:#0F172A;letter-spacing:-1.5px}
        .hero-headline .accent{color:#0F4C75}
        .hero-headline .green{color:#10B981}
        .hero-sub{color:#64748B;font-size:clamp(14px,2vw,17px);max-width:520px;margin:0 auto 32px;line-height:1.75}
        .hero-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:12px}
        .btn-primary{background:#0F4C75;color:#fff;padding:13px 28px;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;border:none;transition:background 0.15s,transform 0.1s;box-shadow:0 4px 16px rgba(15,76,117,0.25)}
        .btn-primary:hover{background:#1B6CA8;transform:translateY(-2px)}
        .btn-secondary{border:1.5px solid #CBD5E1;color:#0F172A;padding:13px 28px;border-radius:10px;font-size:15px;font-weight:500;cursor:pointer;background:#fff;transition:border-color 0.15s,transform 0.1s}
        .btn-secondary:hover{border-color:#94A3B8;transform:translateY(-2px)}
        .hero-note{color:#94A3B8;font-size:12px;margin-top:4px}

        /* MOCKUPS */
        .mockups{display:flex;gap:20px;justify-content:center;padding:8px 20px 64px;flex-wrap:wrap}
        .phone-mock{background:#fff;border-radius:20px;border:1px solid #E2E8F0;width:180px;overflow:hidden;flex-shrink:0;box-shadow:0 8px 32px rgba(0,0,0,0.08)}
        .phone-top-bar{background:#F8FAFC;height:20px;display:flex;align-items:center;justify-content:center}
        .phone-notch{width:40px;height:4px;background:#CBD5E1;border-radius:2px}
        .phone-body{padding:12px}
        .wa-header{background:#0F4C75;padding:8px 10px;font-size:10px;font-weight:600;color:#fff;border-radius:8px 8px 0 0;display:flex;align-items:center;gap:5px}
        .wa-body{background:#F8FAFC;padding:10px;font-size:10px;line-height:2;color:#475569;border-radius:0 0 8px 8px;border:1px solid #E2E8F0;border-top:none}
        .wa-voice{padding:8px 10px;display:flex;align-items:center;gap:6px;background:#F0FDF4;border-radius:8px;margin-top:8px;border:1px solid #BBF7D0}
        .voice-bars{flex:1;display:flex;align-items:center;gap:2px;height:16px}
        .voice-bar{width:2px;background:#10B981;border-radius:1px}
        .dashboard-mock{background:#fff;border-radius:20px;border:1px solid #E2E8F0;width:260px;padding:16px;flex-shrink:0;box-shadow:0 8px 32px rgba(0,0,0,0.08)}
        .dash-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #F1F5F9}
        .dash-title{color:#0F172A;font-size:11px;font-weight:700}
        .live-badge{color:#10B981;font-size:9px;font-weight:700;background:#ECFDF5;padding:2px 8px;border-radius:10px;border:1px solid #BBF7D0}
        .dash-stats{display:flex;gap:8px;margin-bottom:12px}
        .dash-stat{flex:1;border-radius:8px;padding:8px 6px;text-align:center}
        .dash-stat-n{font-size:18px;font-weight:800}
        .dash-stat-l{font-size:8px;color:#94A3B8;margin-top:1px}
        .queue-list{display:flex;flex-direction:column;gap:6px}
        .queue-row{background:#F8FAFC;padding:8px 10px;display:flex;align-items:center;gap:8px;border-radius:8px;border-left:3px solid transparent}
        .queue-token{font-size:10px;font-weight:800;min-width:34px}
        .queue-name{color:#475569;font-size:9px;flex:1}
        .queue-status-badge{font-size:8px;font-weight:600;padding:2px 6px;border-radius:6px}

        /* FEATURES */
        .features{padding:80px 24px;max-width:860px;margin:0 auto}
        .section-eyebrow{font-size:12px;font-weight:600;color:#0F4C75;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px}
        .section-title{color:#0F172A;font-size:clamp(22px,4vw,32px);font-weight:800;margin-bottom:10px;letter-spacing:-0.5px}
        .section-sub{color:#64748B;font-size:15px;margin-bottom:48px;line-height:1.7;max-width:500px}
        .features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
        .feature-card{background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:24px;transition:box-shadow 0.2s,transform 0.15s;cursor:default}
        .feature-card:hover{box-shadow:0 8px 32px rgba(0,0,0,0.08);transform:translateY(-3px)}
        .feature-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:14px}
        .feature-title{color:#0F172A;font-size:14px;font-weight:700;margin-bottom:6px}
        .feature-desc{color:#64748B;font-size:13px;line-height:1.7}

        /* HOW */
        .how{padding:80px 24px;background:#F8FAFC}
        .how-inner{max-width:680px;margin:0 auto}
        .steps{display:flex;flex-direction:column;gap:0;margin-top:40px}
        .step{display:flex;gap:20px;padding:24px 0;border-bottom:1px solid #E2E8F0}
        .step:last-child{border-bottom:none}
        .step-num{width:40px;height:40px;border-radius:12px;background:#EFF6FF;border:1.5px solid #BFDBFE;display:flex;align-items:center;justify-content:center;color:#1D4ED8;font-size:14px;font-weight:800;flex-shrink:0}
        .step-title{color:#0F172A;font-size:15px;font-weight:700;margin-bottom:5px}
        .step-desc{color:#64748B;font-size:13px;line-height:1.7}

        /* PRICING */
        .pricing{padding:80px 24px;max-width:860px;margin:0 auto}
        .plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:40px}
        .plan-card{background:#fff;border:1.5px solid #E2E8F0;border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:16px;transition:box-shadow 0.2s,transform 0.15s;position:relative}
        .plan-card:hover{box-shadow:0 8px 32px rgba(0,0,0,0.08);transform:translateY(-3px)}
        .plan-card.featured{border:2px solid #0F4C75;background:linear-gradient(135deg,#F0F9FF,#fff)}
        .plan-popular{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:#0F4C75;color:#fff;padding:3px 16px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap}
        .plan-name{color:#0F172A;font-size:15px;font-weight:800}
        .plan-desc{color:#94A3B8;font-size:12px;margin-top:2px}
        .plan-price{color:#0F172A;font-size:32px;font-weight:800;letter-spacing:-1px}
        .plan-per{font-size:14px;color:#94A3B8;font-weight:400}
        .plan-features-list{display:flex;flex-direction:column;gap:8px;flex:1}
        .plan-feature{font-size:13px;color:#475569;display:flex;align-items:center;gap:8px}
        .plan-feature .chk{color:#10B981;font-weight:700}

        /* CTA */
        .cta-section{padding:80px 24px;text-align:center;background:linear-gradient(135deg,#0F4C75,#1B6CA8)}
        .cta-title{color:#fff;font-size:clamp(24px,4vw,36px);font-weight:800;margin-bottom:12px;letter-spacing:-0.5px}
        .cta-sub{color:rgba(255,255,255,0.75);font-size:15px;line-height:1.7;margin-bottom:28px;max-width:440px;margin-left:auto;margin-right:auto}
        .btn-white{background:#fff;color:#0F4C75;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;border:none;transition:transform 0.1s,box-shadow 0.2s;box-shadow:0 4px 20px rgba(0,0,0,0.15)}
        .btn-white:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(0,0,0,0.2)}

        /* FOOTER */
        .footer{background:#0F172A;padding:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
        .footer-brand{display:flex;align-items:center;gap:8px}
        .footer-tag{color:rgba(255,255,255,0.3);font-size:12px;font-style:italic}
        .footer-made{color:rgba(255,255,255,0.3);font-size:11px}
        .footer-links{display:flex;gap:16px}
        .footer-link{color:rgba(255,255,255,0.4);font-size:12px;text-decoration:none;cursor:pointer;transition:color 0.15s}
        .footer-link:hover{color:rgba(255,255,255,0.8)}

        /* RESPONSIVE */
        @media(max-width:640px){
          .nav-links{display:none}
          .nav-hamburger{display:block}
          .hero{padding:56px 16px 40px}
          .mockups{padding:8px 12px 40px}
          .dashboard-mock{width:100%;max-width:340px}
          .phone-mock{width:155px}
          .features,.pricing{padding:56px 16px}
          .how{padding:56px 16px}
          .footer{flex-direction:column;text-align:center}
          .footer-links{justify-content:center}
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <a onClick={() => router.push("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
          <img src="/logo-light.svg" alt="TokenPe" style={{ height: 38, width: "auto" }} />
        </a>
        <div className="nav-links">
          <span className="nav-link" onClick={() => scrollTo("features")}>Features</span>
          <span className="nav-link" onClick={() => scrollTo("how")}>How it works</span>
          <span className="nav-link" onClick={() => scrollTo("pricing")}>Pricing</span>
          <button className="nav-cta" onClick={() => router.push("/login")}>Get Started →</button>
        </div>
        <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <span onClick={() => scrollTo("features")}>Features</span>
        <span onClick={() => scrollTo("how")}>How it works</span>
        <span onClick={() => scrollTo("pricing")}>Pricing</span>
        <span className="mobile-cta" onClick={() => router.push("/login")}>Get Started →</span>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">🇮🇳 Built for India's clinics & hospitals</div>
        <h1 className="hero-headline">
          The smartest queue<br />for your <span className="accent">clinic</span>
        </h1>
        <p className="hero-sub">
          Patients join via WhatsApp. Get voice updates in their language. Wait at home — not your waiting room.
        </p>
        <div className="hero-btns">
          <button className="btn-primary" onClick={() => router.push("/login")}>Start Free Trial →</button>
          <button className="btn-secondary" onClick={() => scrollTo("how")}>See how it works</button>
        </div>
        <p className="hero-note">No app for patients &nbsp;·&nbsp; Works on any phone &nbsp;·&nbsp; Setup in 2 minutes</p>
      </section>

      {/* MOCKUPS */}
      <div className="mockups">
        <div className="phone-mock">
          <div className="phone-top-bar"><div className="phone-notch" /></div>
          <div className="phone-body">
            <div className="wa-header">
              <img src="/logo-icon.svg" alt="T" style={{ width: 16, height: 16, borderRadius: 3 }} />
              <span>TokenPe</span>
            </div>
            <div className="wa-body">
              ✅ <strong style={{ color: "#0F172A" }}>You're in the queue!</strong><br />
              🎫 Token: <strong style={{ color: "#0F4C75" }}>T007</strong><br />
              👥 Ahead: <strong style={{ color: "#0F172A" }}>6</strong><br />
              🕐 Wait: <strong style={{ color: "#0F172A" }}>~42 mins</strong>
            </div>
            <div className="wa-voice">
              <span style={{ fontSize: 14, color: "#10B981" }}>🎙</span>
              <div className="voice-bars">
                {[6, 12, 8, 14, 6, 10, 16, 8, 11, 7].map((h, i) => (
                  <div key={i} className="voice-bar" style={{ height: h }} />
                ))}
              </div>
              <span style={{ fontSize: 9, color: "#94A3B8" }}>0:09</span>
            </div>
          </div>
        </div>

        <div className="dashboard-mock">
          <div className="dash-header">
            <div className="dash-title">🏥 Dr. Sharma Clinic</div>
            <span className="live-badge">● LIVE</span>
          </div>
          <div className="dash-stats">
            <div className="dash-stat" style={{ background: "#FFF7ED" }}>
              <div className="dash-stat-n" style={{ color: "#F97316" }}>4</div>
              <div className="dash-stat-l">Waiting</div>
            </div>
            <div className="dash-stat" style={{ background: "#ECFDF5" }}>
              <div className="dash-stat-n" style={{ color: "#10B981" }}>1</div>
              <div className="dash-stat-l">With Doctor</div>
            </div>
            <div className="dash-stat" style={{ background: "#F0F9FF" }}>
              <div className="dash-stat-n" style={{ color: "#0F4C75" }}>11</div>
              <div className="dash-stat-l">Done</div>
            </div>
          </div>
          <div className="queue-list">
            {[
              { token: "T012", name: "Rajesh Kumar", status: "With Doctor", bg: "#ECFDF5", c: "#10B981", bc: "#10B981" },
              { token: "T013", name: "Priya Singh", status: "Waiting", bg: "#FFF7ED", c: "#F97316", bc: "#F97316" },
              { token: "T014", name: "Amit Patel", status: "Waiting", bg: "#FFF7ED", c: "#F97316", bc: "#F97316" },
            ].map(p => (
              <div key={p.token} className="queue-row" style={{ borderLeftColor: p.bc }}>
                <span className="queue-token" style={{ color: p.c }}>{p.token}</span>
                <span className="queue-name">{p.name}</span>
                <span className="queue-status-badge" style={{ background: p.bg, color: p.c }}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="features">
        <div className="section-eyebrow">Features</div>
        <h2 className="section-title">Everything your clinic needs</h2>
        <p className="section-sub">One simple tool that replaces the chaos of paper tokens, shouting names, and crowded waiting rooms.</p>
        <div className="features-grid">
          {[
            { icon: "🎙️", bg: "#ECFDF5", title: "Voice in 10 Indian languages", desc: "Patients get WhatsApp voice updates in Hindi, Tamil, Telugu, Marathi, Gujarati and 5 more languages." },
            { icon: "💬", bg: "#EFF6FF", title: "WhatsApp — zero app needed", desc: "Patients scan a QR and join via WhatsApp. No downloads, no logins, no friction for anyone." },
            { icon: "📊", bg: "#F0F9FF", title: "Live queue dashboard", desc: "See who's waiting, who's with the doctor, and who's done — all updating in real time." },
            { icon: "🔔", bg: "#FFF7ED", title: "Smart auto-alerts", desc: "Patients are automatically alerted at 10-away, 5-away, and when it's their turn. No manual work needed." },
            { icon: "📅", bg: "#F5F3FF", title: "History & reports", desc: "View complete patient history by date. Know exactly how many patients were seen each day." },
            { icon: "📲", bg: "#FFF1F2", title: "QR code generation", desc: "Generate, download and print your clinic's unique QR card in seconds. Patients scan once to join." },
          ].map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon" style={{ background: f.bg }}>{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="how">
        <div className="how-inner">
          <div className="section-eyebrow">How it works</div>
          <h2 className="section-title">Up and running in 3 steps</h2>
          <div className="steps">
            {[
              { n: "1", title: "Register your clinic", desc: "Sign up in 2 minutes with Google or your clinic code. Get your personal WhatsApp QR code instantly." },
              { n: "2", title: "Display the QR at reception", desc: "Print the QR card or show it on a screen. Patients scan it once and they're in the queue — no app needed." },
              { n: "3", title: "Call patients with one tap", desc: "Press 'Call Next' on your dashboard. The patient gets a WhatsApp text + voice note in their preferred language." },
            ].map(s => (
              <div key={s.n} className="step">
                <div className="step-num">{s.n}</div>
                <div>
                  <div className="step-title">{s.title}</div>
                  <div className="step-desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="pricing">
        <div className="section-eyebrow">Pricing</div>
        <h2 className="section-title">Simple. Affordable. No surprises.</h2>
        <p className="section-sub">All plans include the full feature set. Pay only for volume.</p>
        <div className="plans">
          {[
            { name: "Starter", desc: "Solo doctor clinics", price: "₹499", per: "/mo", features: ["Up to 50 patients/day", "WhatsApp queue", "Voice notes — 10 languages", "QR code generation"], featured: false },
            { name: "Growth", desc: "Busy clinics", price: "₹999", per: "/mo", features: ["Up to 150 patients/day", "History & analytics", "Priority support", "Walk-in management"], featured: true },
            { name: "Pro", desc: "Hospitals & chains", price: "₹1,999", per: "/mo", features: ["Unlimited patients/day", "Multiple doctor queues", "API access", "Dedicated support"], featured: false },
          ].map(p => (
            <div key={p.name} className={`plan-card ${p.featured ? "featured" : ""}`}>
              {p.featured && <div className="plan-popular">Most Popular</div>}
              <div>
                <div className="plan-name">{p.name}</div>
                <div className="plan-desc">{p.desc}</div>
              </div>
              <div className="plan-price">{p.price}<span className="plan-per">{p.per}</span></div>
              <div className="plan-features-list">
                {p.features.map(f => (
                  <div key={f} className="plan-feature"><span className="chk">✓</span>{f}</div>
                ))}
              </div>
              <button className="btn-primary" style={{ width: "100%", fontSize: 13, padding: "10px 0" }} onClick={() => router.push("/login")}>
                Get started →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2 className="cta-title">Ready to modernise your clinic?</h2>
        <p className="cta-sub">Join clinics across India already using TokenPe to manage queues and delight patients.</p>
        <button className="btn-white" onClick={() => router.push("/login")}>Start your free trial →</button>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-brand">
          <img src="/logo.svg" alt="TokenPe" style={{ height: 32, width: "auto" }} />
        </div>
        <span className="footer-tag">Your token. Your time.</span>
        <div className="footer-links">
          <span className="footer-link" onClick={() => router.push("/privacy")}>Privacy Policy</span>
          <span className="footer-link" onClick={() => router.push("/terms")}>Terms & Support</span>
        </div>
        <span className="footer-made">Made with ❤️ in India</span>
      </footer>
    </>
  );
}