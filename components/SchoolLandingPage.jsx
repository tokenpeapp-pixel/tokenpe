"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, GraduationCap, Users, Zap, CheckCircle2, ChevronRight, Bell, Calendar, Mic, Globe2, School, Book } from "lucide-react";

export default function SchoolLandingPage({ config }) {
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
      router.push(`/find-school?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/find-school`);
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
          background: #020617; /* Deep slate / navy */
          color: #f8fafc;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* ── GLOBAL BACKGROUND AMBIENCE ── */
        .school-bg {
          position: fixed;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: 
            radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.05) 0%, transparent 60%),
            radial-gradient(circle at 100% 50%, rgba(245, 158, 11, 0.03) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='1' height='1' fill='rgba(255,255,255,0.02)'/%3E%3C/svg%3E") repeat;
        }

        
          to { background-position-x: 0px; }
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
          background: url("data:image/svg+xml,%3Csvg width='240' height='200' viewBox='0 0 24 24' fill='none' stroke='rgba(59,130,246,0.07)' stroke-width='0.5' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='9' cy='7' r='4'/%3E%3Cpath d='M23 21v-2a4 4 0 0 0-3-3.87'/%3E%3Cpath d='M16 3.13a4 4 0 0 1 0 7.75'/%3E%3C/svg%3E") repeat-x center;
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
          background: #1e3a8a;
          color: #dbeafe;
          text-align: center;
          padding: 10px 24px;
          font-size: 14px;
          font-weight: 600;
        }

        /* ── NAV ── */
        .c-nav {
          position: sticky;
          top: 0;
          z-index: 200;
          background: rgba(2, 6, 23, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(59, 130, 246, 0.15);
          transition: all 0.2s ease;
        }
        .c-nav.scrolled {
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
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
          color: #cbd5e1;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: color 0.2s;
        }
        .c-nl:hover { color: #60a5fa; }
        .c-nav-cta {
          background: #f59e0b;
          color: #fff;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
        }
        .c-nav-cta:hover {
          background: #fbbf24;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
        }

        /* ── HERO ── */
        .c-hero {
          padding: 100px 24px 80px;
          text-align: center;
          max-width: 900px;
          margin: 0 auto;
        }
        .c-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          padding: 6px 16px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 32px;
        }
        .c-h1 {
          font-size: 56px;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin-bottom: 24px;
          color: #f8fafc;
        }
        .c-h1-grad {
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .c-sub {
          font-size: 20px;
          color: #94a3b8;
          line-height: 1.6;
          margin-bottom: 48px;
          max-width: 700px;
          margin-inline: auto;
        }

        /* ── SEARCH BAR (HERO) ── */
        .c-search-box {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 16px;
          padding: 8px;
          display: flex;
          gap: 12px;
          max-width: 500px;
          margin: 0 auto 40px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.2);
          backdrop-filter: blur(10px);
        }
        .c-search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 16px;
          padding: 12px 16px;
          outline: none;
        }
        .c-search-input::placeholder { color: #64748b; }
        .c-search-btn {
          background: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 0 24px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .c-search-btn:hover { background: #60a5fa; }

        /* ── SECTIONS ── */
        .c-sec {
          padding: 80px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .c-sec-title {
          text-align: center;
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 16px;
          color: #f8fafc;
        }
        .c-sec-sub {
          text-align: center;
          font-size: 18px;
          color: #94a3b8;
          margin-bottom: 60px;
          max-width: 600px;
          margin-inline: auto;
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
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 40px 32px;
          transition: transform 0.2s, background 0.2s, border-color 0.2s;
        }
        .c-role-card > *:not(.c-role-ghost) { position: relative; z-index: 1; }
        .c-role-ghost {
          position: absolute;
          bottom: -20px;
          right: -20px;
          color: #3b82f6;
          opacity: 0.05;
          filter: blur(1px);
          z-index: 0;
          transition: transform 0.3s ease, opacity 0.3s ease, filter 0.3s ease;
          pointer-events: none;
        }
        .c-role-card:hover .c-role-ghost {
          opacity: 0.15;
          transform: rotate(5deg) scale(1.05);
          filter: blur(0px);
        }
        .c-role-card:hover {
          background: rgba(59, 130, 246, 0.03);
          border-color: rgba(59, 130, 246, 0.2);
          transform: translateY(-4px);
        }
        .c-role-icon {
          width: 56px; height: 56px;
          background: rgba(59, 130, 246, 0.1);
          color: #60a5fa;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 24px;
        }
        .c-role-tag {
          font-size: 13px; font-weight: 700; color: #3b82f6; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px;
        }
        .c-role-h3 {
          font-size: 24px; font-weight: 700; color: #f8fafc; margin-bottom: 16px; line-height: 1.3;
        }
        .c-role-p {
          font-size: 16px; color: #94a3b8; line-height: 1.6;
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
          height: 2px;
          background: #60a5fa;
          box-shadow: 0 0 12px #3b82f6, 0 0 24px #60a5fa;
          z-index: 0;
          opacity: 0.8;
        }
        .c-how-step {
          position: relative;
          z-index: 1;
          transition: transform 0.3s ease;
        }
        .c-how-step:hover {
          transform: translateY(-8px);
        }
        .c-how-step:hover .c-how-n {
          box-shadow: 0 0 0 12px rgba(59, 130, 246, 0.2), 0 0 20px rgba(96, 165, 250, 0.4);
          transform: scale(1.1);
        }
        .c-how-n {
          width: 48px; height: 48px;
          background: #3b82f6;
          color: #fff;
          font-size: 20px; font-weight: 800;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
          box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.1);
          transition: all 0.3s ease;
        }
        .c-how-h3 { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #f8fafc; }
        .c-how-p { font-size: 15px; color: #94a3b8; line-height: 1.6; }

        /* ── CTA ── */
        .c-cta-sec {
          margin: 100px 24px;
          background: linear-gradient(135deg, #1e3a8a, #0f172a);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 32px;
          padding: 80px 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        .c-cta-sec:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(59, 130, 246, 0.15);
        }
        .c-cta-sec::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at top right, rgba(96, 165, 250, 0.1), transparent 50%);
          pointer-events: none;
        }
        .c-cta-ghost-1 {
          position: absolute; top: -30px; left: -30px;
          color: rgba(59, 130, 246, 0.05);
          transform: rotate(-15deg);
          pointer-events: none;
          transition: transform 0.6s ease, color 0.6s ease;
        }
        .c-cta-ghost-2 {
          position: absolute; bottom: -50px; right: -40px;
          color: rgba(59, 130, 246, 0.05);
          transform: rotate(10deg);
          pointer-events: none;
          transition: transform 0.6s ease, color 0.6s ease;
        }
        .c-cta-sec:hover .c-cta-ghost-1 { transform: rotate(-5deg) scale(1.1); color: rgba(59, 130, 246, 0.08); }
        .c-cta-sec:hover .c-cta-ghost-2 { transform: rotate(0deg) scale(1.1); color: rgba(59, 130, 246, 0.08); }
        
        .c-cta-h2 { font-size: 40px; font-weight: 800; color: #fff; margin-bottom: 20px; position: relative; z-index: 2; }
        .c-cta-p { font-size: 18px; color: #bfdbfe; margin-bottom: 40px; max-width: 500px; margin-inline: auto; position: relative; z-index: 2; }
        
        .c-cta-btn {
          padding: 16px 40px;
          font-size: 16px;
          background: #f59e0b;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          position: relative;
          z-index: 2;
          transition: all 0.3s ease;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
        }
        .c-cta-btn:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.5);
          background: #fbbf24;
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

      <div className="school-bg" />

      <div className="c-topbar">
        Need help registering a school? Contact our institutional support: <a href="mailto:tokenpe.online@gmail.com" style={{ color: "inherit", textDecoration: "underline" }}>tokenpe.online@gmail.com</a>
      </div>

      <nav className={`c-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="c-nav-inner">
          <img src="/logo-nav.svg" alt="TokenPe" style={{ height: 38, width: "auto", cursor: "pointer" }} onClick={() => router.push("/")} />
          <div className="c-nav-links">
            <span className="c-nl" onClick={() => go("roles")}>Benefits</span>
            <span className="c-nl" onClick={() => go("how")}>How it works</span>
            <span className="c-nl" onClick={() => router.push("/find-school")}>Find School</span>
            <button className="c-nav-cta" onClick={() => router.push("/school-login")}>School Login</button>
          </div>
        </div>
      </nav>

      <div className="c-hero-wrap">
        <div className="c-ghost-queue" />
      <header className="c-hero">
        

        <div className="c-badge" style={{ position: "relative", zIndex: 1 }}>
          <GraduationCap size={16} /> For Schools & Universities
        </div>
        <h1 className="c-h1" style={{ position: "relative", zIndex: 1 }}>
          End admission day chaos.<br />
          <span className="c-h1-grad">Streamline on WhatsApp.</span>
        </h1>
        <p className="c-sub" style={{ position: "relative", zIndex: 1 }}>
          No more long lines during peak enrollment. Parents scan a QR code, join a digital waitlist, and are called sequentially when it's their turn.
        </p>

        <div style={{ position: "relative", zIndex: 1, marginTop: "48px" }}>
          <form className="c-search-box" onSubmit={handleSearch}>
            <Search size={20} color="#64748b" style={{ margin: "auto 0" }} />
            <input 
              type="text" 
              className="c-search-input" 
              placeholder="Search for a school by name or city..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="c-search-btn">Find</button>
          </form>
        </div>

        <div className="c-hero-cta-group" style={{ position: "relative", zIndex: 1 }}>
          <button className="c-nav-cta" style={{ padding: "14px 28px" }} onClick={() => router.push("/school-login?mode=register")}>
            Register School for Free
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
            <School className="c-role-ghost" size={140} />
            <div className="c-role-icon"><School size={28} /></div>
            <div className="c-role-tag">For Administration</div>
            <h3 className="c-role-h3">Maintain order and efficiency</h3>
            <p className="c-role-p">
              Eliminate crowded corridors and frustrated parents. Keep your campus organized and project a modern, professional image.
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
            <GraduationCap className="c-role-ghost" size={140} />
            <div className="c-role-icon"><GraduationCap size={28} /></div>
            <div className="c-role-tag">For Parents & Students</div>
            <h3 className="c-role-h3">Wait comfortably</h3>
            <p className="c-role-p">
              Parents take a digital token on WhatsApp and can sit in the cafeteria or their car until they receive an alert that it's their turn.
            </p>
          </div>
        </div>
      </section>

      <section className="c-sec" id="how">
        <h2 className="c-sec-title">How TokenPe works</h2>
        <p className="c-sec-sub">Set up digital queuing across your campus in minutes. Zero hardware required.</p>

        <div className="c-how-grid">
          <div className="c-how-step">
            <div className="c-how-n">1</div>
            <h3 className="c-how-h3">Print QR Codes</h3>
            <p className="c-how-p">Generate QR codes for admissions, fee desks, or specific departments.</p>
          </div>
          <div className="c-how-step">
            <div className="c-how-n">2</div>
            <h3 className="c-how-h3">Parents Scan</h3>
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
        <School className="c-cta-ghost-1" size={240} />
        <Book className="c-cta-ghost-2" size={280} />
        <h2 className="c-cta-h2">Ready to modernize your campus?</h2>
        <p className="c-cta-p">Join innovative institutions across India using TokenPe to manage their queues.</p>
        <button className="c-cta-btn" onClick={() => router.push("/school-login?mode=register")}>
          Start your 7-Day Free Trial
        </button>
      </div>

      <footer style={{ textAlign: "center", padding: "40px 24px", color: "#64748b", fontSize: "14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        © {new Date().getFullYear()} TokenPe. All rights reserved.
      </footer>
    </>
  );
}
