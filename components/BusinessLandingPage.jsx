"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ClipboardList, Users, Zap, CheckCircle2, ChevronRight, Bell, Calendar, Mic, Globe2, Briefcase, Building } from "lucide-react";

export default function OtherLandingPage({ config }) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/find-business?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/find-business`);
    }
  };

  const go = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #0a0f1e;
          color: #e2e8f0;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* ── GLOBAL BACKGROUND AMBIENCE ── */
        .business-bg {
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background:
            radial-gradient(ellipse at 20% 0%, rgba(120, 113, 108, 0.07) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='0.8' fill='rgba(255,255,255,0.03)'/%3E%3C/svg%3E") repeat;
        }

        /* ── GHOST QUEUE BACKGROUND ── */
        .c-hero-wrap {
          position: relative;
          overflow: hidden;
        }
        .c-ghost-queue {
          position: absolute;
          bottom: 0;
          left: -10vw;
          width: 120vw;
          height: 220px;
          background: url("data:image/svg+xml,%3Csvg width='240' height='200' viewBox='0 0 24 24' fill='none' stroke='rgba(120,113,108,0.07)' stroke-width='0.5' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='9' cy='7' r='4'/%3E%3Cpath d='M23 21v-2a4 4 0 0 0-3-3.87'/%3E%3Cpath d='M16 3.13a4 4 0 0 1 0 7.75'/%3E%3C/svg%3E") repeat-x center;
          background-size: 200px 180px;
          animation: c-queue-slide 12s linear infinite;
          pointer-events: none;
          z-index: 0;
          mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
        }
        @keyframes c-queue-slide {
          from { background-position-x: 0px; }
          to { background-position-x: 200px; }
        }

        /* ── TOPBAR ── */
        .c-topbar {
          background: rgba(120, 113, 108, 0.12);
          border-bottom: 1px solid rgba(120, 113, 108, 0.2);
          color: #a5f3fc;
          text-align: center;
          padding: 10px 24px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        /* ── NAV ── */
        .c-nav {
          position: sticky;
          top: 0;
          z-index: 200;
          background: rgba(10, 15, 30, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(120, 113, 108, 0.1);
          transition: all 0.3s ease;
        }
        .c-nav.scrolled {
          background: rgba(10, 15, 30, 0.95);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
        }
        .c-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
        }
        .c-nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .c-nl {
          color: #94a3b8;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: color 0.2s;
        }
        .c-nl:hover { color: #78716c; }
        .c-nav-cta {
          background: linear-gradient(135deg, #78716c, #44403c);
          color: #fff;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(120, 113, 108, 0.3);
        }
        .c-nav-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(120, 113, 108, 0.5);
        }

        /* ── HERO ── */
        .c-hero {
          padding: 100px 24px 80px;
          text-align: center;
          max-width: 900px;
          margin: 0 auto;
          position: relative;
        }
        .c-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(120, 113, 108, 0.1);
          border: 1px solid rgba(120, 113, 108, 0.3);
          color: #a8a29e;
          padding: 6px 16px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 32px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .c-h1 {
          font-size: 58px;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin-bottom: 24px;
          color: #f1f5f9;
        }
        .c-h1-grad {
          background: linear-gradient(135deg, #a8a29e 0%, #78716c 50%, #d6d3d1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .c-sub {
          font-size: 19px;
          color: #94a3b8;
          line-height: 1.7;
          margin-bottom: 48px;
          max-width: 650px;
          margin-inline: auto;
        }

        /* ── SEARCH BAR (HERO) ── */
        .c-search-box {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(120, 113, 108, 0.2);
          border-radius: 16px;
          padding: 8px;
          display: flex;
          gap: 12px;
          max-width: 520px;
          margin: 0 auto 40px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(120,113,108,0.05);
          backdrop-filter: blur(10px);
          transition: border-color 0.2s;
        }
        .c-search-box:focus-within {
          border-color: rgba(120, 113, 108, 0.5);
        }
        .c-search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #f1f5f9;
          font-size: 15px;
          padding: 12px 16px;
          outline: none;
          font-family: inherit;
        }
        .c-search-input::placeholder { color: #475569; }
        .c-search-btn {
          background: linear-gradient(135deg, #78716c, #44403c);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 0 24px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 10px rgba(120,113,108,0.3);
        }
        .c-search-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(120,113,108,0.5);
        }

        /* ── SECTIONS ── */
        .c-sec {
          padding: 100px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .c-sec-title {
          text-align: center;
          font-size: 38px;
          font-weight: 800;
          margin-bottom: 16px;
          color: #f1f5f9;
          letter-spacing: -0.02em;
        }
        .c-sec-sub {
          text-align: center;
          font-size: 17px;
          color: #64748b;
          margin-bottom: 64px;
          max-width: 560px;
          margin-inline: auto;
          line-height: 1.7;
        }

        /* ── VALUE CARDS ── */
        .c-roles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .c-role-card {
          position: relative;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(120, 113, 108, 0.1);
          border-radius: 24px;
          padding: 40px 32px;
          transition: transform 0.3s, background 0.3s, border-color 0.3s, box-shadow 0.3s;
        }
        .c-role-card > *:not(.c-role-ghost) { position: relative; z-index: 1; }
        .c-role-ghost {
          position: absolute;
          bottom: -20px;
          right: -20px;
          color: #78716c;
          opacity: 0.05;
          filter: blur(1px);
          z-index: 0;
          transition: transform 0.3s ease, opacity 0.3s ease, filter 0.3s ease;
          pointer-events: none;
        }
        .c-role-card:hover .c-role-ghost {
          opacity: 0.12;
          transform: rotate(5deg) scale(1.05);
          filter: blur(0px);
        }
        .c-role-card:hover {
          background: rgba(120, 113, 108, 0.05);
          border-color: rgba(120, 113, 108, 0.3);
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(120,113,108,0.1);
        }
        .c-role-icon {
          width: 56px; height: 56px;
          background: rgba(120, 113, 108, 0.1);
          color: #a8a29e;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 24px;
          border: 1px solid rgba(120,113,108,0.2);
        }
        .c-role-tag {
          font-size: 11px; font-weight: 700; color: #78716c; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px;
        }
        .c-role-h3 {
          font-size: 22px; font-weight: 700; color: #f1f5f9; margin-bottom: 14px; line-height: 1.3;
        }
        .c-role-p {
          font-size: 15px; color: #64748b; line-height: 1.7;
        }

        /* ── HOW IT WORKS ── */
        .c-how-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          text-align: center;
          position: relative;
        }
        .c-how-grid::before {
          content: '';
          position: absolute;
          top: 23px;
          left: 16%;
          right: 16%;
          height: 1px;
          background: linear-gradient(90deg, #78716c, #d6d3d1);
          opacity: 0.4;
          z-index: 0;
        }
        .c-how-step {
          position: relative;
          z-index: 1;
          transition: transform 0.3s ease;
        }
        .c-how-step:hover {
          transform: translateY(-8px);
        }
        .c-how-n {
          width: 48px; height: 48px;
          background: linear-gradient(135deg, #78716c, #44403c);
          color: #fff;
          font-size: 20px; font-weight: 800;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
          box-shadow: 0 0 0 8px rgba(120, 113, 108, 0.1), 0 0 24px rgba(120,113,108,0.3);
          transition: all 0.3s ease;
        }
        .c-how-step:hover .c-how-n {
          box-shadow: 0 0 0 14px rgba(120,113,108,0.12), 0 0 32px rgba(120,113,108,0.5);
          transform: scale(1.1);
        }
        .c-how-h3 { font-size: 19px; font-weight: 700; margin-bottom: 12px; color: #f1f5f9; }
        .c-how-p { font-size: 15px; color: #64748b; line-height: 1.6; }

        /* ── CTA ── */
        .c-cta-sec {
          margin: 80px 24px;
          background: linear-gradient(135deg, rgba(120,113,108,0.15) 0%, rgba(99,102,241,0.1) 100%);
          border: 1px solid rgba(120, 113, 108, 0.2);
          border-radius: 32px;
          padding: 80px 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        .c-cta-sec:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 60px rgba(120, 113, 108, 0.15);
        }
        .c-cta-sec::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at top right, rgba(120,113,108,0.08), transparent 60%);
          pointer-events: none;
        }
        .c-cta-ghost-1 {
          position: absolute; top: -30px; left: -30px;
          color: rgba(120, 113, 108, 0.07);
          transform: rotate(-15deg);
          pointer-events: none;
        }
        .c-cta-ghost-2 {
          position: absolute; bottom: -50px; right: -40px;
          color: rgba(99,102,241,0.07);
          transform: rotate(10deg);
          pointer-events: none;
        }
        .c-cta-h2 { font-size: 38px; font-weight: 800; color: #f1f5f9; margin-bottom: 20px; position: relative; z-index: 2; letter-spacing: -0.02em; }
        .c-cta-p { font-size: 17px; color: #94a3b8; margin-bottom: 40px; max-width: 500px; margin-inline: auto; position: relative; z-index: 2; line-height: 1.7; }
        
        .c-cta-btn {
          padding: 16px 44px;
          font-size: 16px;
          background: linear-gradient(135deg, #78716c, #44403c);
          color: #fff;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          cursor: pointer;
          position: relative;
          z-index: 2;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(120, 113, 108, 0.4);
          font-family: inherit;
        }
        .c-cta-btn:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 10px 30px rgba(120, 113, 108, 0.6);
        }

        .c-hero-cta-group {
          display: flex;
          gap: 16px;
          justify-content: center;
          align-items: center;
        }

        @media(max-width: 900px) {
          .c-roles-grid { grid-template-columns: 1fr; }
          .c-how-grid { grid-template-columns: 1fr; }
          .c-how-grid::before { display: none; }
        }

        @media(max-width: 768px) {
          .c-nav-links { display: none; }
          .c-hero { padding: 60px 20px 40px; }
          .c-h1 { font-size: 36px; }
          .c-sub { font-size: 16px; margin-bottom: 32px; }
          .c-sec { padding: 60px 20px; }
          .c-sec-title { font-size: 28px; }
          .c-cta-sec { padding: 60px 20px; margin: 60px 20px; border-radius: 24px; }
          .c-cta-h2 { font-size: 28px; }
          .c-hero-cta-group { flex-direction: column; gap: 12px; }
          .c-search-box { padding: 6px; }
          .c-search-input { font-size: 14px; padding: 10px; }
          .c-search-btn { padding: 0 16px; font-size: 14px; }
        }
      `}</style>

      <div className="business-bg" />

      <div className="c-topbar">
        Need help registering a business? Contact our businessal support: <a href="mailto:tokenpe.online@gmail.com" style={{ color: "inherit", textDecoration: "underline" }}>tokenpe.online@gmail.com</a>
      </div>

      <nav className={`c-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="c-nav-inner">
          <img src="/logo-nav.svg" alt="TokenPe" style={{ height: 38, width: "auto", cursor: "pointer" }} onClick={() => router.push("/")} />
          <div className="c-nav-links">
            <span className="c-nl" onClick={() => go("roles")}>Benefits</span>
            <span className="c-nl" onClick={() => go("how")}>How it works</span>
            <span className="c-nl" onClick={() => router.push("/find-business")}>Find Business</span>
            <button className="c-nav-cta" onClick={() => router.push("/business-login")}>Business Login</button>
          </div>
        </div>
      </nav>

      <div className="c-hero-wrap">
        <div className="c-ghost-queue" />
      <header className="c-hero">

        <div className="c-badge" style={{ position: "relative", zIndex: 1 }}>
          <ClipboardList size={16} /> For Businesss & Universities
        </div>
        <h1 className="c-h1" style={{ position: "relative", zIndex: 1 }}>
          End waiting room chaos.<br />
          <span className="c-h1-grad">Streamline on WhatsApp.</span>
        </h1>
        <p className="c-sub" style={{ position: "relative", zIndex: 1 }}>
          No more long lines during peak hours. Customers scan a QR code, join a digital waitlist, and are called sequentially when it's their turn.
        </p>

        <div style={{ position: "relative", zIndex: 1, marginTop: "48px" }}>
          <form className="c-search-box" onSubmit={handleSearch}>
            <Search size={20} color="#64748b" style={{ margin: "auto 0" }} />
            <input 
              type="text" 
              className="c-search-input" 
              placeholder="Search for a business by name or city..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="c-search-btn">Find</button>
          </form>
        </div>

        <div className="c-hero-cta-group" style={{ position: "relative", zIndex: 1 }}>
          <button className="c-nav-cta" style={{ padding: "14px 28px" }} onClick={() => router.push("/business-login?mode=register")}>
            Register Business for Free
          </button>
          <span style={{ color: "#64748b", fontSize: "14px" }}>Takes 2 minutes. No credit card required.</span>
        </div>
      </header>
      </div>

      <section className="c-sec" id="roles">
        <h2 className="c-sec-title">Built for every department</h2>
        <p className="c-sec-sub">TokenPe solves the queuing problem for admissions, fee collection, and administration.</p>
        
        <div className="c-roles-grid">
          <div className="c-role-card">
            <Briefcase className="c-role-ghost" size={140} />
            <div className="c-role-icon"><Briefcase size={28} /></div>
            <div className="c-role-tag">For Management</div>
            <h3 className="c-role-h3">Maintain order and efficiency</h3>
            <p className="c-role-p">
              Eliminate crowded waiting areas and frustrated customers. Keep your store or office organized and project a modern, professional image.
            </p>
          </div>

          <div className="c-role-card">
            <Users className="c-role-ghost" size={140} />
            <div className="c-role-icon"><Users size={28} /></div>
            <div className="c-role-tag">For Staff</div>
            <h3 className="c-role-h3">Process files smoothly</h3>
            <p className="c-role-p">
              Staff members can call the next parent instantly via a dashboard. No shouting names or dealing with people pushing to the front of the line.
            </p>
          </div>

          <div className="c-role-card">
            <ClipboardList className="c-role-ghost" size={140} />
            <div className="c-role-icon"><ClipboardList size={28} /></div>
            <div className="c-role-tag">For Customers & Students</div>
            <h3 className="c-role-h3">Wait comfortably</h3>
            <p className="c-role-p">
              Customers take a digital token on WhatsApp and can sit in the cafeteria or their car until they receive an alert that it's their turn.
            </p>
          </div>
        </div>
      </section>

      <section className="c-sec" id="how">
        <h2 className="c-sec-title">How TokenPe works</h2>
        <p className="c-sec-sub">Set up digital queuing across your store or office in minutes. Zero hardware required.</p>

        <div className="c-how-grid">
          <div className="c-how-step">
            <div className="c-how-n">1</div>
            <h3 className="c-how-h3">Print QR Codes</h3>
            <p className="c-how-p">Generate QR codes for admissions, fee desks, or specific departments.</p>
          </div>
          <div className="c-how-step">
            <div className="c-how-n">2</div>
            <h3 className="c-how-h3">Customers Scan</h3>
            <p className="c-how-p">Visitors scan the code with their phone to join the WhatsApp queue instantly.</p>
          </div>
          <div className="c-how-step">
            <div className="c-how-n">3</div>
            <h3 className="c-how-h3">Call Next</h3>
            <p className="c-how-p">Your staff taps a button on the dashboard to notify the next person via WhatsApp.</p>
          </div>
        </div>
      </section>

      <div className="c-cta-sec">
        <Briefcase className="c-cta-ghost-1" size={240} />
        <Building className="c-cta-ghost-2" size={280} />
        <h2 className="c-cta-h2">Ready to modernize your store or office?</h2>
        <p className="c-cta-p">Join innovative businesss across India using TokenPe to manage their queues.</p>
        <button className="c-cta-btn" onClick={() => router.push("/business-login?mode=register")}>
          Start your 7-Day Free Trial
        </button>
      </div>

      <footer style={{ textAlign: "center", padding: "40px 24px", color: "#64748b", fontSize: "14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        © {new Date().getFullYear()} TokenPe. All rights reserved.
      </footer>
    </>
  );
}
