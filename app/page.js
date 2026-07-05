"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WhatsAppDemo from "./components/WhatsAppDemo";

export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const go = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observe = () => {
      const observer = new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => {
            if (e.isIntersecting) e.target.classList.add("lp-visible");
          }),
        { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
      );
      document.querySelectorAll(".lp-reveal:not(.lp-visible)").forEach((el) => observer.observe(el));
      return observer;
    };
    // Initial pass
    let obs = observe();
    // Re-observe after 600ms to catch elements rendered later (e.g. FAQ)
    const timer = setTimeout(() => { obs.disconnect(); obs = observe(); }, 600);
    return () => { obs.disconnect(); clearTimeout(timer); };
  }, []);

  const compData = [
    ["Paper Token System", "Digital Chaos", "🏥 TokenPe"],
    ["Crowded waiting rooms", "❌", "✅ Wait comfortably at home"],
    ["No status updates", "❌", "✅ Real-time WhatsApp alerts"],
    ["Hindi only / no language", "❌", "✅ 10 Indian languages + voice"],
    ["Manual token calling", "❌", "✅ Automated notifications"],
    ["No patient data", "❌", "✅ Full history & analytics"],
    ["App required to use", "❌", "✅ Works on any phone via WhatsApp"],
    ["Zero digital presence", "❌", "✅ Your own clinic QR code"],
  ];

  const features = [
    { ico: "🎙️", color: "#e8f5e9", title: "Voice in 10 Languages", desc: "Patients get WhatsApp voice alerts in Hindi, Tamil, Telugu, Marathi, Gujarati & 5 more." },
    { ico: "💬", color: "#e3f2fd", title: "Zero App for Patients", desc: "Scan QR → join queue. No downloads, no logins. Works on any phone." },
    { ico: "⚡", color: "#f3e5f5", title: "Live Dashboard", desc: "See who's waiting, with doctor, and done — updating in real-time." },
    { ico: "🔔", color: "#fff3e0", title: "Smart Auto Alerts", desc: "10-away, 5-away, and your-turn notifications sent automatically." },
    { ico: "📅", color: "#e0f7fa", title: "Date-wise History", desc: "Complete patient records for any past date. Daily volumes at a glance." },
    { ico: <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M7 7h.01M18 7h.01M18 18h.01M7 18h.01"/><path d="M11 11h2v2h-2z"/><path d="M14 11h.01M11 14h.01"/></svg>, color: "#fce4ec", title: "QR Code & Print Card", desc: "Generate your clinic QR. Download PNG or print a display-ready card." },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #fff;
          color: #1a202c;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* ── ANIMATIONS ── */
        .lp-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1);
        }
        .lp-reveal.lp-visible { opacity: 1; transform: none; }
        .lp-reveal-d1.lp-visible { transition-delay: 0.1s; }
        .lp-reveal-d2.lp-visible { transition-delay: 0.2s; }
        .lp-reveal-d3.lp-visible { transition-delay: 0.3s; }
        .lp-reveal-d4.lp-visible { transition-delay: 0.4s; }
        .lp-reveal-d5.lp-visible { transition-delay: 0.5s; }

        @keyframes lp-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes lp-pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(22,163,74,0.5); }
          70%  { box-shadow: 0 0 0 10px rgba(22,163,74,0); }
          100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); }
        }
        @keyframes lp-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes lp-badge-pulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }

        /* ── TOPBAR ── */
        .lp-topbar {
          background: #065f46;
          color: #fff;
          text-align: center;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.2px;
        }
        .lp-topbar a {
          color: #6ee7b7;
          text-decoration: underline;
          margin-left: 6px;
        }

        /* ── NAV ── */
        .lp-nav {
          position: sticky;
          top: 0;
          z-index: 200;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid #e5e7eb;
          transition: box-shadow 0.3s ease;
        }
        .lp-nav.scrolled { box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
        .lp-nav-inner {
          max-width: 1140px;
          margin: 0 auto;
          padding: 0 24px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .lp-nav-links { display: flex; align-items: center; gap: 28px; }
        .lp-nl {
          color: #4b5563;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.15s;
        }
        .lp-nl:hover { color: #065f46; }
        .lp-nav-cta {
          background: #f97316;
          color: #fff;
          padding: 10px 22px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 14px rgba(249,115,22,0.35);
          transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s, background 0.15s;
          white-space: nowrap;
        }
        .lp-nav-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(249,115,22,0.45); background: #ea6c0a; }
        .lp-nav-cta:active { transform: scale(0.96); }
        .lp-hamburger {
          display: none;
          background: none;
          border: none;
          color: #1a202c;
          font-size: 24px;
          cursor: pointer;
          padding: 4px;
        }
        .lp-mmenu {
          display: none;
          flex-direction: column;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          position: fixed;
          top: 68px;
          left: 0;
          right: 0;
          z-index: 199;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
          max-height: calc(100vh - 68px);
          overflow-y: auto;
        }
        .lp-mmenu.open { display: flex; }
        .lp-mlink {
          padding: 16px 24px;
          color: #374151;
          font-size: 15px;
          font-weight: 600;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          text-decoration: none;
          display: block;
        }
        .lp-mlink:hover { background: #f9fafb; }
        .lp-mcta {
          margin: 16px 24px;
          background: #f97316;
          color: #fff;
          text-align: center;
          padding: 14px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          width: calc(100% - 48px);
          box-shadow: 0 4px 14px rgba(249,115,22,0.3);
        }

        /* ── HERO ── */
        .lp-hero {
          background: linear-gradient(160deg, #f0fdf4 0%, #ffffff 50%, #fff7ed 100%);
          padding: 80px 24px 60px;
          position: relative;
          overflow: hidden;
        }
        .lp-hero::before {
          content: '';
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%);
          top: -150px; right: -100px;
          pointer-events: none;
        }
        .lp-hero::after {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%);
          bottom: -100px; left: -50px;
          pointer-events: none;
        }
        .lp-hero-inner {
          max-width: 1140px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 48px;
          position: relative;
          z-index: 1;
        }
        .lp-hero-content { flex: 1; min-width: 0; }
        .lp-hero-visual {
          flex: 0 0 auto;
          display: flex;
          justify-content: center;
          align-items: center;
          max-width: 100%;
          overflow: visible;
          position: relative;
          animation: lp-float 5s ease-in-out infinite;
        }
        .lp-hero-visual::before {
          content: '';
          position: absolute;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(22,163,74,0.12) 0%, rgba(8,145,178,0.06) 50%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: -1;
          filter: blur(20px);
        }
        .lp-demo-label {
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #16a34a, #0891b2);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 16px;
          border-radius: 100px;
          white-space: nowrap;
          letter-spacing: 0.3px;
          box-shadow: 0 4px 16px rgba(22,163,74,0.3);
          z-index: 10;
        }
        .lp-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #dcfce7;
          border: 1px solid #86efac;
          border-radius: 100px;
          padding: 6px 14px 6px 8px;
          font-size: 12px;
          font-weight: 700;
          color: #15803d;
          margin-bottom: 24px;
          animation: lp-badge-pulse 2.5s ease-in-out infinite;
        }
        .lp-badge-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #16a34a;
          animation: lp-pulse-ring 2s ease-out infinite;
          flex-shrink: 0;
        }
        .lp-hero-h1 {
          font-size: clamp(34px, 5vw, 60px);
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -2px;
          color: #111827;
          margin-bottom: 20px;
        }
        .lp-grad { background: linear-gradient(135deg, #16a34a, #0891b2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .lp-hero-sub {
          color: #6b7280;
          font-size: clamp(15px, 2vw, 18px);
          line-height: 1.75;
          margin-bottom: 36px;
          max-width: 520px;
        }
        .lp-hero-btns { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
        .lp-btn-primary {
          background: #16a34a;
          color: #fff;
          padding: 15px 32px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          box-shadow: 0 8px 28px rgba(22,163,74,0.35);
          transition: transform 0.22s cubic-bezier(0.16,1,0.3,1), box-shadow 0.22s, background 0.15s;
          text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .lp-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(22,163,74,0.45); background: #15803d; }
        .lp-btn-primary:active { transform: scale(0.96); }
        .lp-btn-secondary {
          background: #fff;
          color: #374151;
          padding: 15px 32px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          border: 1.5px solid #d1d5db;
          transition: transform 0.22s cubic-bezier(0.16,1,0.3,1), border-color 0.15s, box-shadow 0.22s;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .lp-btn-secondary:hover { border-color: #16a34a; color: #16a34a; transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.07); }
        .lp-btn-secondary:active { transform: scale(0.96); }
        .lp-hero-trust {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
        }
        .lp-hero-trust-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #15803d;
          background: #dcfce7;
          padding: 4px 12px;
          border-radius: 100px;
          border: 1px solid #86efac;
          box-shadow: 0 2px 8px rgba(22,163,74,0.15);
        }
        .lp-hero-trust-item span:first-child { color: #16a34a; font-size: 14px; }

        /* ── SECTION COMMON ── */
        .lp-sec { padding: 90px 24px; }
        .lp-sec-inner { max-width: 1100px; margin: 0 auto; }
        .lp-sec-tag {
          display: inline-block;
          background: #dcfce7;
          color: #16a34a;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 4px 14px;
          border-radius: 100px;
          margin-bottom: 14px;
        }
        .lp-sec-h2 {
          font-size: clamp(26px, 4vw, 42px);
          font-weight: 900;
          letter-spacing: -1.5px;
          color: #111827;
          margin-bottom: 14px;
          line-height: 1.12;
        }
        .lp-sec-sub {
          color: #6b7280;
          font-size: 16px;
          line-height: 1.7;
          max-width: 520px;
        }
        .lp-sec-centered { text-align: center; }
        .lp-sec-centered.lp-sec-sub { margin: 0 auto; }

        /* ── PAIN POINTS ── */
        .lp-pain-sec { background: #f9fafb; }
        .lp-pain-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 48px;
        }
        .lp-pain-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 28px;
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s, border-color 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .lp-pain-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px rgba(0,0,0,0.09); border-color: #fca5a5; }
        .lp-pain-ico { font-size: 32px; margin-bottom: 14px; }
        .lp-pain-title { font-size: 16px; font-weight: 800; color: #111827; margin-bottom: 8px; }
        .lp-pain-desc { font-size: 13.5px; color: #6b7280; line-height: 1.7; }
        .lp-pain-badge {
          display: inline-block;
          background: #fee2e2;
          color: #dc2626;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 100px;
          margin-bottom: 12px;
        }

        /* ── WHO IS THIS FOR ── */
        .lp-who-sec { background: #f0fdf4; }
        .lp-who-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-top: 48px;
        }
        .lp-who-card {
          background: #fff;
          border: 1.5px solid #86efac;
          border-radius: 20px;
          padding: 28px;
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s;
          box-shadow: 0 4px 16px rgba(22,163,74,0.06);
          text-align: center;
        }
        .lp-who-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px rgba(22,163,74,0.14); }
        .lp-who-ico { font-size: 36px; margin-bottom: 12px; }
        .lp-who-title { font-size: 15px; font-weight: 800; color: #065f46; margin-bottom: 6px; }
        .lp-who-desc { font-size: 13px; color: #4b5563; line-height: 1.65; }

        /* ── COMPARISON ── */
        .lp-cmp-sec { background: #fff; }
        .lp-cmp-wrap { margin-top: 48px; overflow-x: auto; border-radius: 16px; box-shadow: 0 4px 32px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
        .lp-cmp-table { width: 100%; border-collapse: collapse; min-width: 560px; }
        .lp-cmp-table thead tr { background: #f9fafb; }
        .lp-cmp-table th {
          padding: 18px 20px;
          font-size: 13px;
          font-weight: 800;
          color: #374151;
          text-align: center;
          border-bottom: 1px solid #e5e7eb;
        }
        .lp-cmp-table th:first-child { text-align: left; width: 42%; }
        .lp-cmp-table th.lp-cmp-good { background: #f0fdf4; color: #16a34a; }
        .lp-cmp-table td {
          padding: 14px 20px;
          font-size: 13.5px;
          color: #4b5563;
          border-bottom: 1px solid #f3f4f6;
          text-align: center;
        }
        .lp-cmp-table td:first-child { text-align: left; font-weight: 600; color: #374151; }
        .lp-cmp-table td.lp-cmp-good { background: rgba(240,253,244,0.5); color: #15803d; font-weight: 600; }
        .lp-cmp-table tr:last-child td { border-bottom: none; }
        .lp-cmp-table tr:hover td { background: #fafafa; }
        .lp-cmp-table tr:hover td.lp-cmp-good { background: #f0fdf4; }
        .lp-cmp-bad { color: #ef4444; font-weight: 700; }

        /* ── MID CTA ── */
        .lp-midcta {
          background: linear-gradient(135deg, #f97316, #ea580c);
          padding: 80px 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .lp-midcta::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='1.5' fill='rgba(255,255,255,0.08)'/%3E%3C/svg%3E") repeat;
          pointer-events: none;
        }
        .lp-midcta-inner { max-width: 680px; margin: 0 auto; position: relative; z-index: 1; }
        .lp-midcta-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.18);
          border: 1px solid rgba(255,255,255,0.35);
          border-radius: 100px;
          padding: 5px 16px;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 20px;
          letter-spacing: 0.5px;
        }
        .lp-midcta h2 {
          font-size: clamp(28px, 4.5vw, 48px);
          font-weight: 900;
          color: #fff;
          letter-spacing: -1.5px;
          margin-bottom: 12px;
          line-height: 1.1;
        }
        .lp-midcta p {
          color: rgba(255,255,255,0.82);
          font-size: 16px;
          line-height: 1.7;
          margin-bottom: 32px;
        }
        .lp-midcta-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          color: #ea580c;
          padding: 16px 40px;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          border: none;
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
          transition: transform 0.22s cubic-bezier(0.16,1,0.3,1), box-shadow 0.22s;
        }
        .lp-midcta-btn:hover { transform: translateY(-4px); box-shadow: 0 20px 56px rgba(0,0,0,0.2); }
        .lp-midcta-btn:active { transform: scale(0.96); }
        .lp-midcta-notes {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 20px;
        }
        .lp-midcta-note { font-size: 12px; color: rgba(255,255,255,0.75); font-weight: 500; display: flex; align-items: center; gap: 5px; }
        .lp-midcta-note::before { content: '✓'; color: #bbf7d0; }

        /* ── FEATURES ── */
        .lp-feat-sec { background: #fff; }
        .lp-feat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
          gap: 20px;
          margin-top: 52px;
        }
        .lp-feat-card {
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 28px;
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s, border-color 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          position: relative;
          overflow: hidden;
        }
        .lp-feat-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(22,163,74,0.04), rgba(8,145,178,0.04));
          opacity: 0;
          transition: opacity 0.25s;
        }
        .lp-feat-card:hover { transform: translateY(-6px); box-shadow: 0 24px 60px rgba(0,0,0,0.09); border-color: #86efac; }
        .lp-feat-card:hover::after { opacity: 1; }
        .lp-feat-ico {
          width: 52px; height: 52px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 26px;
          margin-bottom: 16px;
          position: relative; z-index: 1;
        }
        .lp-feat-title { font-size: 15px; font-weight: 800; color: #111827; margin-bottom: 8px; position: relative; z-index: 1; }
        .lp-feat-desc { font-size: 13.5px; color: #6b7280; line-height: 1.7; position: relative; z-index: 1; }

        /* ── HOW IT WORKS ── */
        .lp-how-sec { background: #f9fafb; }
        .lp-how-steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 32px;
          margin-top: 52px;
          position: relative;
        }
        .lp-how-steps::before {
          content: '';
          position: absolute;
          top: 26px;
          left: 60px;
          right: 60px;
          height: 2px;
          background: linear-gradient(90deg, #86efac, #67e8f9);
          z-index: 0;
        }
        .lp-how-step {
          text-align: center;
          padding: 0 8px;
          position: relative;
          z-index: 1;
        }
        .lp-step-num {
          width: 52px; height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #16a34a, #0891b2);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          font-weight: 900;
          color: #fff;
          margin: 0 auto 20px;
          box-shadow: 0 8px 24px rgba(22,163,74,0.35);
        }
        .lp-step-ico { font-size: 28px; margin-bottom: 14px; display: flex; align-items: center; justify-content: center; height: 36px; }
        .lp-step-title { font-size: 15px; font-weight: 800; color: #111827; margin-bottom: 8px; }
        .lp-step-desc { font-size: 13.5px; color: #6b7280; line-height: 1.7; }

        /* ── PRICING ── */
        .lp-price-sec { background: #fff; }
        .lp-plans {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px;
          margin-top: 52px;
          max-width: 940px;
          margin-left: auto;
          margin-right: auto;
        }
        .lp-plan {
          border: 1.5px solid #e5e7eb;
          border-radius: 24px;
          padding: 32px 26px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
        }
        .lp-plan:hover { transform: translateY(-6px); box-shadow: 0 24px 60px rgba(0,0,0,0.09); }
        .lp-plan.lp-plan-hot {
          border: 2px solid transparent;
          background: linear-gradient(#fff,#fff) padding-box, linear-gradient(135deg,#16a34a,#0891b2) border-box;
          box-shadow: 0 12px 40px rgba(22,163,74,0.14);
        }
        .lp-plan.lp-plan-hot:hover { box-shadow: 0 28px 72px rgba(22,163,74,0.22); }
        .lp-plan-badge {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #16a34a, #0891b2);
          color: #fff;
          padding: 4px 18px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          letter-spacing: 0.3px;
        }
        .lp-plan-name { font-size: 17px; font-weight: 800; color: #111827; }
        .lp-plan-desc { font-size: 12px; color: #9ca3af; margin-top: 2px; }
        .lp-plan-price { font-size: 44px; font-weight: 900; letter-spacing: -2px; color: #111827; }
        .lp-plan-price span { font-size: 15px; color: #9ca3af; font-weight: 500; }
        .lp-plan-feats { display: flex; flex-direction: column; gap: 10px; flex: 1; }
        .lp-pf { font-size: 13.5px; color: #374151; display: flex; align-items: flex-start; gap: 10px; }
        .lp-pf-check { color: #16a34a; font-weight: 800; font-size: 13px; flex-shrink: 0; margin-top: 1px; }
        .lp-plan-btn {
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          background: linear-gradient(135deg, #16a34a, #0891b2);
          color: #fff;
          box-shadow: 0 4px 16px rgba(22,163,74,0.28);
          transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s;
          font-family: inherit;
        }
        .lp-plan-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(22,163,74,0.38); }
        .lp-plan-btn:active { transform: scale(0.96); }
        .lp-plan-btn.lp-ghost { background: #f9fafb; color: #16a34a; box-shadow: none; border: 1.5px solid #e5e7eb; }
        .lp-plan-btn.lp-ghost:hover { border-color: #16a34a; background: #f0fdf4; }

        /* ── FAQ ── */
        .lp-faq-sec { background: #f9fafb; }
        .lp-faq-inner { max-width: 780px; margin: 0 auto; }
        .lp-faq-list { margin-top: 48px; display: flex; flex-direction: column; gap: 12px; }
        .lp-faq-item {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .lp-faq-item:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
        .lp-faq-q {
          width: 100%;
          background: none;
          border: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 22px;
          font-size: 15px;
          font-weight: 700;
          color: #111827;
          text-align: left;
          cursor: pointer;
          gap: 16px;
          font-family: inherit;
        }
        .lp-faq-icon {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: #f3f4f6;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          color: #6b7280;
          flex-shrink: 0;
          transition: background 0.2s, color 0.2s, transform 0.3s;
        }
        .lp-faq-item.open .lp-faq-icon { background: #dcfce7; color: #16a34a; transform: rotate(45deg); }
        .lp-faq-a {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.16,1,0.3,1), padding 0.3s;
          padding: 0 22px;
          font-size: 14.5px;
          color: #4b5563;
          line-height: 1.75;
        }
        .lp-faq-item.open .lp-faq-a { max-height: 800px; padding-bottom: 20px; }

        /* ── FOOTER ── */
        .lp-footer { background: #064e3b; padding: 60px 24px 36px; }
        .lp-footer-inner { max-width: 1140px; margin: 0 auto; }
        .lp-footer-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
          align-items: start;
        }
        .lp-footer-brand { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
        .lp-footer-logo { height: 36px; width: auto; }
        .lp-footer-tagline { color: rgba(255,255,255,0.7); font-size: 14.5px; line-height: 1.65; max-width: 280px; }
        .lp-footer-links { display: flex; flex-direction: column; gap: 12px; }
        .lp-footer-links-title { color: #fff; font-size: 15px; font-weight: 700; margin-bottom: 4px; }
        .lp-flink {
          color: rgba(255,255,255,0.7);
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.15s;
        }
        .lp-flink:hover { color: #6ee7b7; }
        .lp-footer-divider { height: 1px; background: rgba(255,255,255,0.08); margin-bottom: 24px; }
        .lp-footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .lp-footer-copy { color: rgba(255,255,255,0.35); font-size: 13px; }
        .lp-footer-cta {
          background: #f97316;
          color: #fff;
          padding: 10px 22px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: background 0.15s, transform 0.2s;
          font-family: inherit;
        }
        .lp-footer-cta:hover { background: #ea6c0a; transform: translateY(-2px); }

        /* ── MODAL ── */
        .lp-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .lp-modal {
          background: #fff;
          border-radius: 24px;
          padding: 40px 32px;
          max-width: 820px;
          width: 100%;
          max-height: 88vh;
          overflow-y: auto;
          position: relative;
        }
        .lp-modal-close {
          position: absolute; top: 16px; right: 16px;
          background: #f3f4f6; border: none;
          width: 36px; height: 36px;
          border-radius: 50%;
          font-size: 20px; cursor: pointer;
          color: #6b7280;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s;
        }
        .lp-modal-close:hover { background: #e5e7eb; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .lp-hero-inner { flex-direction: column; text-align: center; }
          .lp-hero-content { max-width: 100%; }
          .lp-hero-sub { margin: 0 auto 36px; }
          .lp-hero-btns { justify-content: center; }
          .lp-hero-trust { justify-content: center; }
          .lp-how-steps::before { display: none; }
          .lp-hero-visual { width: 100%; }
        }
        @media (max-width: 768px) {
          .lp-nav-links { display: none; }
          .lp-hamburger { display: block; }
          .lp-hero { padding: 60px 20px 48px; }
          .lp-sec { padding: 64px 20px; }
          .lp-midcta { padding: 60px 20px; }
          .lp-hero-h1 { letter-spacing: -1px; }
          .lp-hero-btns { flex-direction: column; width: 100%; }
          .lp-btn-primary, .lp-btn-secondary { width: 100%; justify-content: center; }
          .lp-footer-top { grid-template-columns: 1fr; gap: 32px; }
          .lp-footer-links { align-items: flex-start; flex-direction: column; gap: 12px; }
          .lp-plans { max-width: 100%; }
          .lp-topbar { font-size: 12px; padding: 8px 12px; }
          .lp-modal { padding: 28px 18px; border-radius: 16px; }
          .lp-cmp-table th, .lp-cmp-table td { padding: 12px 10px; font-size: 12px; }
          .lp-step-num { width: 44px; height: 44px; font-size: 17px; }
          .lp-midcta-notes { flex-direction: column; align-items: center; gap: 10px; }
        }
        @media (max-width: 480px) {
          .lp-hero-h1 { font-size: 30px; }
          .lp-sec-h2 { font-size: 24px; }
          .lp-pain-grid, .lp-who-grid, .lp-feat-grid { grid-template-columns: 1fr; }
          .lp-how-steps { grid-template-columns: 1fr; gap: 24px; }
          .lp-plans { grid-template-columns: 1fr; }
          .lp-footer-bottom { flex-direction: column; align-items: center; text-align: center; }
          .lp-midcta h2 { font-size: 26px; }
        }
      `}</style>

      {/* ── TOP BAR ── */}
      <div className="lp-topbar">
        🎉 7-Day Elite Trial — No credit card needed.
        <a href="#" onClick={(e) => { e.preventDefault(); router.push("/login"); }}>Start now →</a>
      </div>

      {/* ── NAV ── */}
      <nav className={`lp-nav${scrolled ? " scrolled" : ""}`}>
        <div className="lp-nav-inner">
          <img src="/logo-nav.svg" alt="TokenPe" style={{ height: 38, width: "auto", cursor: "pointer" }} onClick={() => router.push("/")} />
          <div className="lp-nav-links">
            <span className="lp-nl" onClick={() => go("features")}>Features</span>
            <span className="lp-nl" onClick={() => go("how")}>How it works</span>
            <span className="lp-nl" onClick={() => go("pricing")}>Pricing</span>
            <Link href="/find" className="lp-nl" style={{ color: "#16a34a" }}>🔍 Find Clinic</Link>
            <button className="lp-nav-cta" onClick={() => router.push("/login")}>Start Free Trial →</button>
          </div>
          <button className="lp-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>
      <div className={`lp-mmenu${menuOpen ? " open" : ""}`}>
        <span className="lp-mlink" onClick={() => go("features")}>Features</span>
        <span className="lp-mlink" onClick={() => go("how")}>How it works</span>
        <span className="lp-mlink" onClick={() => go("pricing")}>Pricing</span>
        <Link href="/find" className="lp-mlink" style={{ color: "#16a34a" }}>🔍 Find Clinic</Link>
        <button className="lp-mcta" onClick={() => { router.push("/login"); setMenuOpen(false); }}>Start Free Trial →</button>
      </div>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-content">
            <div className="lp-hero-badge">
              <span className="lp-badge-dot" />
              🇮🇳 Built for India's 6 lakh+ clinics
            </div>
            <h1 className="lp-hero-h1">
              No more waiting.<br />
              <span className="lp-grad">Queue smarter.</span>
            </h1>
            <p className="lp-hero-sub">
              Replace your clinic's paper token chaos with a WhatsApp-based digital queue. Patients wait at home. Voice updates in 10 languages. Zero apps needed.
            </p>
            <div className="lp-hero-btns">
              <button className="lp-btn-primary" onClick={() => router.push("/login")}>
                Start Free Trial
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
              <button className="lp-btn-secondary" onClick={() => go("how")}>
                See how it works
              </button>
            </div>
            <div className="lp-hero-trust">
              <span className="lp-hero-trust-item"><span>✓</span> No app for patients</span>
              <span className="lp-hero-trust-item"><span>✓</span> Works on any phone</span>
              <span className="lp-hero-trust-item"><span>✓</span> 2-min setup</span>
              <span className="lp-hero-trust-item"><span>✓</span> 7-Day Elite Trial</span>
            </div>
          </div>
          <div className="lp-hero-visual">
            <WhatsAppDemo />
            <span className="lp-demo-label">✨ Live WhatsApp Preview</span>
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="lp-sec lp-pain-sec">
        <div className="lp-sec-inner">
          <div className="lp-sec-tag lp-reveal">Sound Familiar?</div>
          <h2 className="lp-sec-h2 lp-reveal lp-reveal-d1">These problems are costing your clinic every day</h2>
          <p className="lp-sec-sub lp-reveal lp-reveal-d2">TokenPe fixes all three. In 2 minutes.</p>
          <div className="lp-pain-grid">
            {[
              { ico: "😤", tag: "Patient Problem", title: "Overcrowded Rooms", desc: "Patients sit for 3+ hours in packed waiting areas. They leave frustrated — or worse, they leave and never come back." },
              { ico: "📢", tag: "Staff Problem", title: "Missed Turns", desc: "The receptionist calls out names. Half the patients step out. Chaos ensues. Turns are missed, slots are wasted." },
              { ico: "📋", tag: "Clinic Problem", title: "Inefficient Queues", desc: "Paper tokens can't scale. No data, no history, no visibility. You don't know how busy you are until it's too late." },
            ].map((c, i) => (
              <div key={c.title} className={`lp-pain-card lp-reveal lp-reveal-d${i + 1}`}>
                <div className="lp-pain-badge">{c.tag}</div>
                <div className="lp-pain-ico">{c.ico}</div>
                <div className="lp-pain-title">{c.title}</div>
                <div className="lp-pain-desc">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IS THIS FOR ── */}
      <section className="lp-sec lp-who-sec">
        <div className="lp-sec-inner">
          <div className="lp-sec-tag lp-reveal">Who is this for?</div>
          <h2 className="lp-sec-h2 lp-reveal lp-reveal-d1">Built for every kind of clinic</h2>
          <p className="lp-sec-sub lp-reveal lp-reveal-d2">From solo practitioners to large polyclinics — if you have a waiting room, TokenPe is for you.</p>
          <div className="lp-who-grid">
            {[
              { ico: "👨‍⚕️", title: "General Physicians", desc: "Manage high patient volumes effortlessly. Reduce no-shows, eliminate crowding." },
              { ico: "🩺", title: "Specialists", desc: "Set precise appointment slots. Patients know exactly when their turn is." },
              { ico: "🏥", title: "Polyclinics", desc: "Manage multiple departments and doctors with one centralised dashboard." },
              { ico: "🦷", title: "Dentists & Eye Clinics", desc: "Appointment-style queuing with automated reminders for longer consultations." },
            ].map((c, i) => (
              <div key={c.title} className={`lp-who-card lp-reveal lp-reveal-d${i + 1}`}>
                <div className="lp-who-ico">{c.ico}</div>
                <div className="lp-who-title">{c.title}</div>
                <div className="lp-who-desc">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section className="lp-sec lp-cmp-sec">
        <div className="lp-sec-inner">
          <div className="lp-sec-tag lp-reveal lp-sec-centered" style={{ display: "table", margin: "0 auto 14px" }}>Comparison</div>
          <h2 className="lp-sec-h2 lp-sec-centered lp-reveal lp-reveal-d1">The old way vs. the TokenPe way</h2>
          <p className="lp-sec-sub lp-sec-centered lp-reveal lp-reveal-d2" style={{ marginBottom: 0 }}>See the difference at a glance.</p>
          <div className="lp-cmp-wrap lp-reveal lp-reveal-d3">
            <table className="lp-cmp-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Paper Tokens</th>
                  <th className="lp-cmp-good">🏥 TokenPe</th>
                </tr>
              </thead>
              <tbody>
                {compData.slice(1).map(([feat, bad, good]) => (
                  <tr key={feat}>
                    <td>{feat}</td>
                    <td className="lp-cmp-bad">{bad}</td>
                    <td className="lp-cmp-good">{good}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── MID CTA ── */}
      <div className="lp-midcta">
        <div className="lp-midcta-inner">
          <div className="lp-midcta-badge lp-reveal">
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
            Limited Time Offer
          </div>
          <h2 className="lp-reveal lp-reveal-d1">Claim Your 7-Day Free Trial<br />with Zero Risk</h2>
          <p className="lp-reveal lp-reveal-d2">Get full Elite Plan access — our most powerful tier — completely free. No credit card. No hidden charges. Cancel anytime.</p>
          <button className="lp-midcta-btn lp-reveal lp-reveal-d3" onClick={() => router.push("/login")}>
            Start My Free Trial
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
          <div className="lp-midcta-notes lp-reveal lp-reveal-d4">
            <span className="lp-midcta-note">No credit card required</span>
            <span className="lp-midcta-note">No auto-charge after trial</span>
            <span className="lp-midcta-note">Cancel anytime</span>
            <span className="lp-midcta-note">2-minute setup</span>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="lp-sec lp-feat-sec">
        <div className="lp-sec-inner">
          <div className="lp-sec-tag lp-reveal">Features</div>
          <h2 className="lp-sec-h2 lp-reveal lp-reveal-d1">Everything your clinic needs</h2>
          <p className="lp-sec-sub lp-reveal lp-reveal-d2">One tool that replaces paper tokens, crowded waiting rooms, and manual calling — forever.</p>
          <div className="lp-feat-grid">
            {features.map((f, i) => (
              <div key={f.title} className={`lp-feat-card lp-reveal lp-reveal-d${(i % 3) + 1}`}>
                <div className="lp-feat-ico" style={{ background: f.color }}>{f.ico}</div>
                <div className="lp-feat-title">{f.title}</div>
                <div className="lp-feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="lp-sec lp-how-sec">
        <div className="lp-sec-inner">
          <div className="lp-sec-tag lp-reveal lp-sec-centered" style={{ display: "table", margin: "0 auto 14px" }}>How it works</div>
          <h2 className="lp-sec-h2 lp-sec-centered lp-reveal lp-reveal-d1">Up and running in 3 steps</h2>
          <p className="lp-sec-sub lp-sec-centered lp-reveal lp-reveal-d2" style={{ marginBottom: 0 }}>No IT team. No hardware. No complexity.</p>
          <div className="lp-how-steps">
            {[
              { n: "1", ico: "📝", title: "Register your clinic", desc: "Sign up in 2 minutes with Google. Get your unique WhatsApp clinic QR code instantly." },
              { n: "2", ico: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'block'}}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M7 7h.01M18 7h.01M18 18h.01M7 18h.01"/><path d="M11 11h2v2h-2z"/><path d="M14 11h.01M11 14h.01"/></svg>, title: "Display the QR code", desc: "Print and display the QR card at reception. Patients scan once — they're in the queue." },
              { n: "3", ico: "📣", title: "Call with one tap", desc: "Press 'Call Next' on your dashboard. The patient gets a WhatsApp alert in their language." },
            ].map((s, i) => (
              <div key={s.n} className={`lp-how-step lp-reveal lp-reveal-d${i + 1}`}>
                <div className="lp-step-num">{s.n}</div>
                <span className="lp-step-ico">{s.ico}</span>
                <div className="lp-step-title">{s.title}</div>
                <div className="lp-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="lp-sec lp-price-sec">
        <div className="lp-sec-inner">
          <div className="lp-sec-tag lp-reveal lp-sec-centered" style={{ display: "table", margin: "0 auto 14px" }}>Pricing</div>
          <h2 className="lp-sec-h2 lp-sec-centered lp-reveal lp-reveal-d1">Simple. Affordable.</h2>
          <p className="lp-sec-sub lp-sec-centered lp-reveal lp-reveal-d2" style={{ marginBottom: 0 }}>Choose the plan that fits your clinic. Start free, upgrade anytime.</p>
          <div className="lp-plans">
            {[
              { name: "Starter", desc: "Perfect for small clinics", price: "₹499", per: "/mo", feats: ["50 patients/day", "Standard WhatsApp Alerts", "Basic 7-day Analytics", "Auto-Generated Clinic Code"], hot: false },
              { name: "Pro", desc: "For busy clinics that want to look professional", price: "₹999", per: "/mo", feats: ["150 patients/day", "Branded WhatsApp Identity", "Multilingual Voice Alerts", "Queue Pause & Smart Wait Time", "30-Day History & Heatmap"], hot: true },
              { name: "Elite", desc: "For hospitals, polyclinics & top doctors", price: "₹1999", per: "/mo", feats: ["Unlimited patients", "Multi-Clinic Management", "Report Download (PDF/CSV)", "VIP WhatsApp Support", "CRM Broadcasts"], hot: false },
            ].map((p, i) => (
              <div key={p.name} className={`lp-plan${p.hot ? " lp-plan-hot" : ""} lp-reveal lp-reveal-d${i + 1}`}>
                {p.hot && <div className="lp-plan-badge">✦ Most Popular</div>}
                <div>
                  <div className="lp-plan-name">{p.name}</div>
                  <div className="lp-plan-desc">{p.desc}</div>
                </div>
                <div className="lp-plan-price">{p.price}<span>{p.per}</span></div>
                <div className="lp-plan-feats">
                  {p.feats.map((f) => (
                    <div key={f} className="lp-pf"><span className="lp-pf-check">✓</span>{f}</div>
                  ))}
                </div>
                <button className={`lp-plan-btn${p.hot ? "" : " lp-ghost"}`} onClick={() => router.push("/login")}>
                  {p.hot ? "Get started →" : "Get started"}
                </button>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button
              onClick={() => setShowDetails(true)}
              style={{ background: "none", border: "none", color: "#16a34a", fontSize: "14px", fontWeight: 700, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 4, fontFamily: "inherit" }}
            >
              📄 View full feature comparison & terms
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="lp-sec lp-faq-sec">
        <div className="lp-faq-inner">
          <div className="lp-sec-tag lp-reveal lp-sec-centered" style={{ display: "table", margin: "0 auto 14px" }}>FAQ</div>
          <h2 className="lp-sec-h2 lp-sec-centered lp-reveal lp-reveal-d1">Common Questions</h2>
          <div className="lp-reveal lp-reveal-d2">
            <FAQList />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <img src="/logo.svg" alt="TokenPe" className="lp-footer-logo" />
              <p className="lp-footer-tagline">WhatsApp-based digital queue management for India's clinics. No apps. No fuss.</p>
            </div>
            <div className="lp-footer-links">
              <div className="lp-footer-links-title">Product</div>
              <span className="lp-flink" style={{ cursor: "pointer" }} onClick={() => go("features")}>Features</span>
              <span className="lp-flink" style={{ cursor: "pointer" }} onClick={() => go("how")}>How it works</span>
              <span className="lp-flink" style={{ cursor: "pointer" }} onClick={() => go("pricing")}>Pricing</span>
              <Link href="/find" className="lp-flink">🔍 Find a Clinic</Link>
            </div>
            <div className="lp-footer-links">
              <div className="lp-footer-links-title">Support & Legal</div>
              <a href="mailto:tokenpe.online@gmail.com" className="lp-flink">✉ Contact Support</a>
              <Link href="/privacy" className="lp-flink">Privacy Policy</Link>
              <Link href="/terms" className="lp-flink">Terms of Service</Link>
            </div>
          </div>
          <div className="lp-footer-divider" />
          <div className="lp-footer-bottom">
            <p className="lp-footer-copy">© {new Date().getFullYear()} TokenPe. All rights reserved. Made with ❤️ in India.</p>
            <button className="lp-footer-cta" onClick={() => router.push("/login")}>Start Free Trial →</button>
          </div>
        </div>
      </footer>

      {/* ── FEATURE DETAILS MODAL ── */}
      {showDetails && (
        <div className="lp-modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="lp-modal" onClick={(e) => e.stopPropagation()}>
            <button className="lp-modal-close" onClick={() => setShowDetails(false)}>✕</button>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: "#111827", marginBottom: 6, letterSpacing: "-1px" }}>Detailed Feature Breakdown</h2>
            <p style={{ color: "#6b7280", marginBottom: 28, fontSize: 14 }}>A comprehensive look at what's included in every TokenPe subscription tier.</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ textAlign: "left", padding: "14px 10px", color: "#374151", fontSize: 13, fontWeight: 800 }}>Feature</th>
                    <th style={{ textAlign: "center", padding: "14px 10px", color: "#6b7280", fontSize: 13, fontWeight: 700 }}>Starter</th>
                    <th style={{ textAlign: "center", padding: "14px 10px", color: "#16a34a", fontSize: 13, fontWeight: 800 }}>Pro</th>
                    <th style={{ textAlign: "center", padding: "14px 10px", color: "#f59e0b", fontSize: 13, fontWeight: 800 }}>Elite</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: 13, color: "#4b5563" }}>
                  {[
                    ["Daily Patient Limit", "50", "150", "Unlimited"],
                    ["WhatsApp Alerts", "Text Only", "Text + AI Voice", "Text + AI Voice"],
                    ["AI Voice (10 Languages)", "—", "✓", "✓"],
                    ["Clinic Code", "Auto-generated", "Custom (DRSHARMA)", "Custom (CITYHOSP)"],
                    ["QR Print Card", "Basic", "Name + Address", "Name + Address + Logo"],
                    ["Queue Pause", "—", "✓", "✓"],
                    ["Analytics History", "7 days", "30 days", "Unlimited"],
                    ["Report Downloads", "—", "—", "✓ (PDF/CSV)"],
                    ["Multi-Clinic", "—", "—", "✓"],
                    ["CRM Broadcasts", "—", "—", "✓"],
                    ["WhatsApp Support", "Standard", "Priority", "VIP Dedicated"],
                  ].map(([feat, s, p, e]) => (
                    <tr key={feat} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 10px", fontWeight: 600, color: "#374151" }}>{feat}</td>
                      <td style={{ textAlign: "center", padding: "12px 10px", color: s === "—" ? "#d1d5db" : "#4b5563" }}>{s}</td>
                      <td style={{ textAlign: "center", padding: "12px 10px", color: p === "—" ? "#d1d5db" : p === "✓" ? "#16a34a" : "#374151", fontWeight: p === "✓" ? 700 : 400 }}>{p}</td>
                      <td style={{ textAlign: "center", padding: "12px 10px", color: e === "—" ? "#d1d5db" : e === "✓" ? "#16a34a" : "#374151", fontWeight: e === "✓" ? 700 : 400 }}>{e}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── FAQ Component ──────────────────────────────────────────────────────────────
function FAQList() {
  const [open, setOpen] = useState(null);
  const faqs = [
    { q: "What if my patients don't have WhatsApp?", a: "TokenPe works on any smartphone with WhatsApp. For the rare patient without a smartphone, your receptionist can add them manually to the queue from the dashboard. They still appear in sequence for the doctor!" },
    { q: "What if the internet goes down in my clinic?", a: "TokenPe is lightweight and works seamlessly on mobile data. If your clinic's Wi-Fi drops, your staff can continue managing the queue using their phone's 4G/5G connection." },
    { q: "How is this different from just giving out paper tokens?", a: "Paper tokens require patients to sit in a crowded waiting room for hours. TokenPe allows them to wait comfortably at home or nearby, only arriving when it's their turn. It elevates the patient experience and makes your clinic look modern." },
    { q: "Do patients need to download an app?", a: "Not at all! Patients simply scan a QR code or send a WhatsApp message. No app downloads, no logins, and no friction whatsoever." },
    { q: "How long does setup take?", a: "Less than 2 minutes. Sign up with Google, verify your clinic details, and you'll have your QR code ready to display. No IT team, no hardware required." },
    { q: "Can I cancel my subscription anytime?", a: "Yes, absolutely. There are no lock-in contracts. You can cancel your plan at any time from your dashboard settings. Your access will continue until the end of your current billing cycle, after which you won't be charged again." },
  ];
  return (
    <div className="lp-faq-list">
      {faqs.map((faq, i) => (
        <div key={i} className={`lp-faq-item${open === i ? " open" : ""}`}>
          <button className="lp-faq-q" onClick={() => setOpen(open === i ? null : i)}>
            <span>{faq.q}</span>
            <span className="lp-faq-icon">+</span>
          </button>
          <div className="lp-faq-a">{faq.a}</div>
        </div>
      ))}
    </div>
  );
}