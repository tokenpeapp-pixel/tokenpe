"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #0A1929;
          color: white;
          overflow-x: hidden;
        }

        /* NAV */
        .nav {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(10, 25, 41, 0.95);
          backdrop-filter: blur(12px);
          border-bottom: 0.5px solid rgba(255,255,255,0.08);
          padding: 14px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 700;
          color: white;
          text-decoration: none;
        }
        .nav-brand-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #1565C0, #0D47A1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        .nav-links {
          display: flex;
          gap: 28px;
          align-items: center;
        }
        .nav-link {
          color: rgba(255,255,255,0.55);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.2s;
        }
        .nav-link:hover { color: white; }
        .nav-cta {
          background: #1565C0;
          color: white;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: background 0.2s, transform 0.15s;
        }
        .nav-cta:hover { background: #1976D2; transform: translateY(-1px); }
        .nav-hamburger {
          display: none;
          background: none;
          border: none;
          color: white;
          font-size: 22px;
          cursor: pointer;
        }
        .mobile-menu {
          display: none;
          flex-direction: column;
          gap: 0;
          background: #0D1F35;
          border-bottom: 0.5px solid rgba(255,255,255,0.08);
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu a, .mobile-menu span {
          padding: 14px 24px;
          color: rgba(255,255,255,0.7);
          font-size: 14px;
          border-bottom: 0.5px solid rgba(255,255,255,0.05);
          cursor: pointer;
          text-decoration: none;
        }
        .mobile-menu .mobile-cta {
          color: #60A5FA;
          font-weight: 600;
        }

        /* HERO */
        .hero {
          padding: 64px 24px 48px;
          text-align: center;
          background: linear-gradient(180deg, #091728 0%, #0A1929 60%, #0A1929 100%);
          position: relative;
          overflow: hidden;
        }
        .hero::before {
          content: '';
          position: absolute;
          top: -120px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(21,101,192,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(21,101,192,0.2);
          border: 0.5px solid rgba(21,101,192,0.45);
          border-radius: 20px;
          padding: 5px 14px;
          font-size: 11px;
          color: #90CAF9;
          margin-bottom: 22px;
          font-weight: 500;
        }
        .hero-headline {
          font-size: clamp(28px, 7vw, 48px);
          font-weight: 700;
          line-height: 1.15;
          margin-bottom: 16px;
          color: white;
        }
        .hero-headline .accent { color: #10B981; }
        .hero-sub {
          color: rgba(255,255,255,0.5);
          font-size: clamp(13px, 2vw, 15px);
          max-width: 480px;
          margin: 0 auto 28px;
          line-height: 1.75;
        }
        .hero-btns {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .btn-primary {
          background: #1565C0;
          color: white;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: background 0.2s, transform 0.15s;
        }
        .btn-primary:hover { background: #1976D2; transform: translateY(-2px); }
        .btn-secondary {
          border: 0.5px solid rgba(255,255,255,0.25);
          color: white;
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          background: transparent;
          transition: border-color 0.2s, transform 0.15s;
        }
        .btn-secondary:hover { border-color: rgba(255,255,255,0.5); transform: translateY(-2px); }
        .hero-note {
          color: rgba(255,255,255,0.28);
          font-size: 11px;
        }

        /* MOCKUPS */
        .mockups {
          display: flex;
          gap: 16px;
          justify-content: center;
          padding: 8px 20px 40px;
          flex-wrap: wrap;
        }
        .phone-mock {
          background: #0D1B2A;
          border-radius: 18px;
          border: 0.5px solid rgba(255,255,255,0.1);
          width: 175px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .phone-top-bar {
          background: #0A1520;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .phone-notch {
          width: 40px;
          height: 4px;
          background: rgba(255,255,255,0.15);
          border-radius: 2px;
        }
        .phone-body { padding: 10px; }
        .wa-header {
          background: #1565C0;
          padding: 6px 10px;
          font-size: 10px;
          font-weight: 600;
          color: white;
          border-radius: 7px 7px 0 0;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .wa-body {
          background: #111827;
          padding: 9px 10px;
          font-size: 10px;
          line-height: 1.9;
          color: #CBD5E1;
          border-radius: 0 0 7px 7px;
        }
        .wa-voice {
          padding: 6px 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          border-top: 0.5px solid rgba(255,255,255,0.05);
        }
        .voice-bars {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 2px;
          height: 16px;
        }
        .voice-bar {
          width: 2px;
          background: #10B981;
          border-radius: 1px;
        }

        .dashboard-mock {
          background: #0D1B2A;
          border-radius: 18px;
          border: 0.5px solid rgba(255,255,255,0.1);
          width: 230px;
          padding: 14px;
          flex-shrink: 0;
        }
        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 9px;
          border-bottom: 0.5px solid rgba(255,255,255,0.06);
        }
        .dash-title {
          color: white;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .live-badge {
          color: #4ADE80;
          font-size: 9px;
          font-weight: 600;
        }
        .dash-stats {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }
        .dash-stat {
          flex: 1;
          border-radius: 7px;
          padding: 7px 5px;
          text-align: center;
        }
        .dash-stat-n {
          font-size: 16px;
          font-weight: 700;
        }
        .dash-stat-l {
          font-size: 8px;
          color: rgba(255,255,255,0.4);
          margin-top: 1px;
        }
        .queue-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .queue-row {
          background: rgba(255,255,255,0.03);
          border-radius: 0;
          padding: 7px 9px;
          display: flex;
          align-items: center;
          gap: 7px;
          border-radius: 6px;
        }
        .queue-token {
          font-size: 10px;
          font-weight: 700;
          min-width: 32px;
        }
        .queue-name {
          color: rgba(255,255,255,0.8);
          font-size: 9px;
          flex: 1;
        }
        .queue-status {
          font-size: 8px;
          font-weight: 500;
        }

        /* STATS BAR */
        .stats-bar {
          background: rgba(21,101,192,0.1);
          border-top: 0.5px solid rgba(21,101,192,0.2);
          border-bottom: 0.5px solid rgba(21,101,192,0.2);
          padding: 24px 20px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          max-width: 600px;
          margin: 0 auto;
        }
        .stats-bar-item { text-align: center; }
        .stats-bar-n {
          color: #10B981;
          font-size: 22px;
          font-weight: 700;
        }
        .stats-bar-l {
          color: rgba(255,255,255,0.4);
          font-size: 11px;
          margin-top: 3px;
        }

        /* FEATURES */
        .features {
          padding: 56px 20px;
          max-width: 700px;
          margin: 0 auto;
        }
        .section-label {
          display: inline-block;
          background: rgba(16,185,129,0.1);
          border: 0.5px solid rgba(16,185,129,0.25);
          border-radius: 20px;
          padding: 3px 12px;
          font-size: 10px;
          color: #10B981;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }
        .section-title {
          color: white;
          font-size: clamp(20px, 4vw, 26px);
          font-weight: 700;
          margin-bottom: 32px;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 14px;
        }
        .feature-card {
          background: rgba(255,255,255,0.03);
          border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 20px;
          transition: border-color 0.2s, background 0.2s;
        }
        .feature-card:hover {
          border-color: rgba(21,101,192,0.4);
          background: rgba(21,101,192,0.06);
        }
        .feature-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          margin-bottom: 12px;
        }
        .feature-title {
          color: white;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .feature-desc {
          color: rgba(255,255,255,0.45);
          font-size: 12px;
          line-height: 1.7;
        }

        /* HOW IT WORKS */
        .how {
          padding: 56px 20px;
          background: #091728;
          text-align: center;
        }
        .how-inner { max-width: 700px; margin: 0 auto; }
        .steps {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-top: 32px;
          text-align: left;
        }
        .step {
          display: flex;
          gap: 16px;
          padding: 20px 0;
          border-bottom: 0.5px solid rgba(255,255,255,0.06);
        }
        .step:last-child { border-bottom: none; }
        .step-num {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(21,101,192,0.2);
          border: 0.5px solid rgba(21,101,192,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #60A5FA;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .step-title {
          color: white;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 5px;
        }
        .step-desc {
          color: rgba(255,255,255,0.45);
          font-size: 12px;
          line-height: 1.7;
        }

        /* PRICING */
        .pricing {
          padding: 56px 20px;
          max-width: 700px;
          margin: 0 auto;
        }
        .plans {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 32px;
        }
        .plan-card {
          background: rgba(255,255,255,0.03);
          border: 0.5px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
          transition: border-color 0.2s;
        }
        .plan-card:hover { border-color: rgba(255,255,255,0.2); }
        .plan-card.featured {
          background: rgba(21,101,192,0.12);
          border: 2px solid rgba(21,101,192,0.45);
          position: relative;
        }
        .plan-popular {
          position: absolute;
          top: -11px;
          left: 50%;
          transform: translateX(-50%);
          background: #1565C0;
          color: white;
          padding: 3px 14px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
          white-space: nowrap;
        }
        .plan-name {
          color: white;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .plan-desc {
          color: rgba(255,255,255,0.4);
          font-size: 11px;
          margin-bottom: 12px;
        }
        .plan-features-list {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .plan-feature {
          font-size: 11px;
          color: rgba(255,255,255,0.6);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .plan-price {
          color: #10B981;
          font-size: 26px;
          font-weight: 700;
          white-space: nowrap;
          text-align: right;
        }
        .plan-per {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          font-weight: 400;
        }

        /* CTA SECTION */
        .cta-section {
          padding: 56px 20px;
          text-align: center;
          background: #091728;
        }
        .cta-box {
          max-width: 480px;
          margin: 0 auto;
          background: rgba(21,101,192,0.1);
          border: 0.5px solid rgba(21,101,192,0.3);
          border-radius: 20px;
          padding: 40px 28px;
        }
        .cta-title {
          color: white;
          font-size: clamp(20px, 4vw, 26px);
          font-weight: 700;
          margin-bottom: 12px;
        }
        .cta-sub {
          color: rgba(255,255,255,0.45);
          font-size: 13px;
          line-height: 1.7;
          margin-bottom: 24px;
        }

        /* FOOTER */
        .footer {
          background: rgba(0,0,0,0.4);
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 0.5px solid rgba(255,255,255,0.06);
          flex-wrap: wrap;
          gap: 12px;
        }
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 7px;
          color: white;
          font-size: 14px;
          font-weight: 600;
        }
        .footer-tag {
          color: rgba(255,255,255,0.3);
          font-size: 11px;
          font-style: italic;
        }
        .footer-made {
          color: rgba(255,255,255,0.3);
          font-size: 11px;
        }
        .footer-links {
          display: flex;
          gap: 16px;
        }
        .footer-link {
          color: rgba(255,255,255,0.4);
          font-size: 11px;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.2s;
        }
        .footer-link:hover {
          color: white;
        }

        /* RESPONSIVE */
        @media (max-width: 600px) {
          .nav-links { display: none; }
          .nav-hamburger { display: block; }
          .hero { padding: 48px 16px 36px; }
          .mockups { padding: 8px 12px 32px; }
          .dashboard-mock { width: 100%; max-width: 340px; }
          .phone-mock { width: 155px; }
          .stats-bar { grid-template-columns: repeat(2, 1fr); padding: 20px 16px; }
          .features, .pricing { padding: 40px 16px; }
          .how { padding: 40px 16px; }
          .plan-card { flex-direction: column; }
          .plan-price { text-align: left; }
          .footer { flex-direction: column; text-align: center; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <a className="nav-brand" onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <img src="/logo-icon.svg" alt="TokenPe" style={{ width: "32px", height: "32px" }} />
          <span style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-0.5px" }}>
            Token<span style={{ color: "#00D05A" }}>Pe</span>
          </span>
        </a>
        <div className="nav-links">
          <span className="nav-link" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Features</span>
          <span className="nav-link" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>How it works</span>
          <span className="nav-link" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>Pricing</span>
          <button className="nav-cta" onClick={() => router.push("/login")}>Get Started</button>
        </div>
        <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <span onClick={() => { document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); }}>Features</span>
        <span onClick={() => { document.getElementById("how")?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); }}>How it works</span>
        <span onClick={() => { document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); }}>Pricing</span>
        <span className="mobile-cta" onClick={() => router.push("/login")}>Get Started →</span>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">🇮🇳 Built for India's 6 lakh+ clinics</div>
        <h1 className="hero-headline">
          No more <span className="accent">waiting rooms.</span><br />No more chaos.
        </h1>
        <p className="hero-sub">
          TokenPe replaces your clinic's paper token system with a WhatsApp-based digital queue. Patients wait at home. Everyone wins.
        </p>
        <div className="hero-btns">
          <button className="btn-primary" onClick={() => router.push("/login")}>Start Free Trial →</button>
          <button className="btn-secondary" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>See how it works</button>
        </div>
        <p className="hero-note">No app for patients &nbsp;·&nbsp; Works on any phone &nbsp;·&nbsp; Setup in minutes</p>
      </section>

      {/* MOCKUPS */}
      <div className="mockups">
        {/* Phone mockup */}
        <div className="phone-mock">
          <div className="phone-top-bar"><div className="phone-notch"></div></div>
          <div className="phone-body">
            <div className="wa-header" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <img src="/logo-icon.svg" alt="TokenPe" style={{ width: "16px", height: "16px", borderRadius: "3px" }} />
              <span>TokenPe</span>
            </div>
            <div className="wa-body">
              ✅ <strong style={{ color: "white" }}>You're in the queue!</strong><br />
              🎫 Token: <strong style={{ color: "white" }}>T004</strong><br />
              👥 Ahead: <strong style={{ color: "white" }}>3</strong><br />
              🕐 Wait: <strong style={{ color: "white" }}>~21 mins</strong>
            </div>
            <div className="wa-voice">
              <span style={{ fontSize: 14, color: "#10B981" }}>🎙</span>
              <div className="voice-bars">
                {[6, 12, 8, 14, 6, 10, 16, 8].map((h, i) => (
                  <div key={i} className="voice-bar" style={{ height: h }} />
                ))}
              </div>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>0:08</span>
            </div>
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className="dashboard-mock">
          <div className="dash-header">
            <div className="dash-title">🏥 Dr. Sharma Clinic</div>
            <span className="live-badge">● LIVE</span>
          </div>
          <div className="dash-stats">
            <div className="dash-stat" style={{ background: "rgba(249,115,22,0.1)" }}>
              <div className="dash-stat-n" style={{ color: "#F97316" }}>3</div>
              <div className="dash-stat-l">Waiting</div>
            </div>
            <div className="dash-stat" style={{ background: "rgba(16,185,129,0.1)" }}>
              <div className="dash-stat-n" style={{ color: "#10B981" }}>1</div>
              <div className="dash-stat-l">With Doctor</div>
            </div>
            <div className="dash-stat" style={{ background: "rgba(56,189,248,0.1)" }}>
              <div className="dash-stat-n" style={{ color: "#38BDF8" }}>8</div>
              <div className="dash-stat-l">Done</div>
            </div>
          </div>
          <div className="queue-list">
            {[
              { token: "T001", name: "Rajesh Kumar", status: "with doctor", color: "#10B981", border: "#10B981" },
              { token: "T002", name: "Priya Singh", status: "waiting", color: "#F97316", border: "#F97316" },
              { token: "T003", name: "Amit Patel", status: "waiting", color: "#F97316", border: "#F97316" },
            ].map((p) => (
              <div key={p.token} className="queue-row" style={{ borderLeft: `2px solid ${p.border}` }}>
                <span className="queue-token" style={{ color: p.color }}>{p.token}</span>
                <span className="queue-name">{p.name}</span>
                <span className="queue-status" style={{ color: p.color }}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="stats-bar">
        {[
          { n: "500+", l: "Clinics onboarded" },
          { n: "50,000+", l: "Patients served" },
          { n: "12 cities", l: "Across India" },
          { n: "3 hrs", l: "Avg wait saved" },
        ].map((s) => (
          <div key={s.l} className="stats-bar-item">
            <div className="stats-bar-n">{s.n}</div>
            <div className="stats-bar-l">{s.l}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section id="features" className="features">
        <div className="section-label">Features</div>
        <h2 className="section-title">Everything your clinic needs</h2>
        <div className="features-grid">
          {[
            { icon: "🎙️", bg: "rgba(16,185,129,0.12)", title: "Voice in 10 Indian languages", desc: "Patients get WhatsApp voice updates in Hindi, Tamil, Telugu, Marathi and 6 more languages." },
            { icon: "💬", bg: "rgba(21,101,192,0.12)", title: "WhatsApp queue — zero app needed", desc: "Patients scan a QR and join via WhatsApp. No downloads, no logins, no friction." },
            { icon: "📊", bg: "rgba(56,189,248,0.12)", title: "Live queue dashboard", desc: "See who's waiting, who's with the doctor, and who's done — all in real time." },
            { icon: "🔔", bg: "rgba(249,115,22,0.12)", title: "Real-time notifications", desc: "Auto-notify patients when their turn is near so they don't crowd your waiting room." },
          ].map((f) => (
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
          <div className="section-label">How it works</div>
          <h2 className="section-title">Up and running in 3 steps</h2>
          <div className="steps">
            {[
              { n: "1", title: "Register your clinic", desc: "Sign up in 2 minutes. Get your clinic code and a unique WhatsApp QR code." },
              { n: "2", title: "Display the QR at reception", desc: "Print or show the QR on a screen. Patients scan it once and they're in the queue." },
              { n: "3", title: "Call patients with one tap", desc: "Hit 'Call Next' on your dashboard. The patient gets a WhatsApp voice note in their language." },
            ].map((s) => (
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
        <div className="section-label">Pricing</div>
        <h2 className="section-title">Simple. Affordable. No surprises.</h2>
        <div className="plans">
          {[
            {
              name: "Starter", desc: "Single doctor clinic", price: "₹499", per: "/mo",
              features: ["50 patients/day", "WhatsApp queue", "Voice notes in 10 languages"],
              featured: false,
            },
            {
              name: "Growth", desc: "Busy clinics", price: "₹999", per: "/mo",
              features: ["150 patients/day", "Analytics dashboard", "Priority support"],
              featured: true,
            },
            {
              name: "Pro", desc: "Multi-doctor hospitals", price: "₹1,999", per: "/mo",
              features: ["Unlimited patients", "Multiple queues", "API access"],
              featured: false,
            },
          ].map((p) => (
            <div key={p.name} className={`plan-card ${p.featured ? "featured" : ""}`} style={{ position: "relative" }}>
              {p.featured && <div className="plan-popular">Most Popular</div>}
              <div>
                <div className="plan-name">{p.name}</div>
                <div className="plan-desc">{p.desc}</div>
                <div className="plan-features-list">
                  {p.features.map((f) => (
                    <div key={f} className="plan-feature">
                      <span style={{ color: "#10B981", fontSize: 12 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="plan-price">{p.price}<span className="plan-per">{p.per}</span></div>
                <button
                  className="btn-primary"
                  style={{ marginTop: 12, width: "100%", fontSize: 12, padding: "9px 16px" }}
                  onClick={() => router.push("/login")}
                >
                  Get started →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-box">
          <h2 className="cta-title">Ready to modernise your clinic?</h2>
          <p className="cta-sub">Join 500+ clinics across India already using TokenPe to manage queues and delight patients.</p>
          <button className="btn-primary" style={{ fontSize: 15, padding: "14px 32px" }} onClick={() => router.push("/login")}>
            Start your free trial →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-brand" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="/logo-icon.svg" alt="TokenPe" style={{ width: "24px", height: "24px" }} />
          <span style={{ fontSize: "16px", fontWeight: "800", letterSpacing: "-0.5px" }}>
            Token<span style={{ color: "#00D05A" }}>Pe</span>
          </span>
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