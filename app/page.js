"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Search, Check, Users, Megaphone, ClipboardList, Stethoscope, Activity, Building2, Smile, Mic, MessageSquare, Zap, Bell, Calendar, QrCode, FileSignature, BellRing, FileText, CheckCircle2, XCircle, ChevronRight } from "lucide-react";

import WhatsAppDemo from "./components/WhatsAppDemo";


const MobileCarousel = ({ children, gridClass }) => {
  const [active, setActive] = useState(0);
  const scrollRef = useRef();

  const count = React.Children.count(children);

  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const cardWidth = e.target.scrollWidth / count;
    const index = Math.round(scrollLeft / cardWidth);
    if(index !== active && index >= 0 && index < count) {
      setActive(index);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollRef.current && window.innerWidth <= 768) {
        let nextIndex = active + 1;
        if (nextIndex >= count) nextIndex = 0;
        const cardWidth = scrollRef.current.scrollWidth / count;
        scrollRef.current.scrollTo({ left: nextIndex * cardWidth, behavior: 'smooth' });
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [active, count]);

  return (
    <div className="lp-carousel-wrapper">
      <div className={`lp-carousel-track ${gridClass}`} ref={scrollRef} onScroll={handleScroll}>
        {children}
      </div>
      <div className="lp-carousel-dots">
        {React.Children.map(children, (child, i) => (
          <span key={i} className={`lp-carousel-dot ${i === active ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
};

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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("lp-visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -20px 0px" }
    );
    
    document.querySelectorAll(".lp-reveal").forEach((el) => {
      observer.observe(el);
    });
    
    return () => observer.disconnect();
  }, []);

  const compData = [
    { old: "Crowded waiting rooms", new: "Wait comfortably at home" },
    { old: "No status updates", new: "Real-time WhatsApp alerts" },
    { old: "No multiple language support", new: "10 Indian languages + voice" },
    { old: "Manual token calling", new: "Automated notifications" },
    { old: "No patient data", new: "Full history & analytics" },
    { old: "App required to use", new: "Works on any phone via WhatsApp" },
    { old: "Zero digital presence", new: "Your own clinic QR code" },
  ];

  const features = [
    { 
      ico: <Mic size="1em" color="#374151" />, color: "#e8f5e9", iconColor: "#16a34a", bloom: "rgba(156, 163, 175, 0.15)", title: "Voice in 10 Languages", desc: "Patients get WhatsApp voice alerts in Hindi, Tamil, Telugu, Marathi, Gujarati & 5 more.",
      GhostIco: Mic,
      Deco: () => (
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 20L15 10L20 30L25 15L30 25L35 5L40 35L45 15L50 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      ico: <MessageSquare size="1em" color="#374151" />, color: "#e3f2fd", iconColor: "#0ea5e9", bloom: "rgba(156, 163, 175, 0.15)", title: "Zero App for Patients", desc: "Scan QR → join queue. No downloads, no logins. Works on any phone.",
      GhostIco: MessageSquare,
      Deco: () => (
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="1.5" fill="currentColor"/><circle cx="20" cy="10" r="1.5" fill="currentColor"/><circle cx="30" cy="10" r="1.5" fill="currentColor"/>
          <circle cx="10" cy="20" r="1.5" fill="currentColor"/><circle cx="20" cy="20" r="1.5" fill="currentColor"/><circle cx="30" cy="20" r="1.5" fill="currentColor"/>
          <circle cx="10" cy="30" r="1.5" fill="currentColor"/><circle cx="20" cy="30" r="1.5" fill="currentColor"/><circle cx="30" cy="30" r="1.5" fill="currentColor"/>
        </svg>
      )
    },
    { 
      ico: <Zap size="1em" color="#374151" />, color: "#f3e5f5", iconColor: "#8b5cf6", bloom: "rgba(156, 163, 175, 0.15)", title: "Live Dashboard", desc: "See who's waiting, with doctor, and done — updating in real-time.",
      GhostIco: Zap,
      Deco: () => (
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 35L20 20L35 25L55 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      ico: <Bell size="1em" color="#374151" />, color: "#fff3e0", iconColor: "#f59e0b", bloom: "rgba(156, 163, 175, 0.15)", title: "Smart Auto Alerts", desc: "10-away, 5-away, and your-turn notifications sent automatically.",
      GhostIco: Bell,
      Deco: () => (
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="40" r="20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" fill="none"/>
          <circle cx="30" cy="40" r="35" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" fill="none"/>
        </svg>
      )
    },
    { 
      ico: <Calendar size="1em" color="#374151" />, color: "#e0f7fa", iconColor: "#06b6d4", bloom: "rgba(156, 163, 175, 0.15)", title: "Date-wise History", desc: "Complete patient records for any past date. Daily volumes at a glance.",
      GhostIco: Calendar,
      Deco: () => (
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="5" y="25" width="8" height="15" rx="2" fill="currentColor"/>
          <rect x="20" y="15" width="8" height="25" rx="2" fill="currentColor"/>
          <rect x="35" y="5" width="8" height="35" rx="2" fill="currentColor"/>
          <rect x="50" y="20" width="8" height="20" rx="2" fill="currentColor"/>
        </svg>
      )
    },
    { 
      ico: <QrCode size="1em" color="#374151" />, color: "#fce4ec", iconColor: "#ec4899", bloom: "rgba(156, 163, 175, 0.15)", title: "QR Code & Print Card", desc: "Generate your clinic QR. Download PNG or print a display-ready card.",
      GhostIco: QrCode,
      Deco: () => (
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 15V5H15M45 5H55V15M55 25V35H45M15 35H5V25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: linear-gradient(160deg, #e6f9ec 0%, #ffffff 50%, #ffedd5 100%);
          background-attachment: fixed;
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
          line-height: 1.5;
        }
        .lp-topbar a {
          color: #6ee7b7;
          text-decoration: underline;
          margin-left: 6px;
          white-space: nowrap;
          display: inline-block;
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
        .lp-nav-find {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0fdf4;
          color: #15803d;
          padding: 8px 18px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          border: 1.5px solid #86efac;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
        }
        .lp-nav-find:hover {
          background: #dcfce7;
          border-color: #4ade80;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(22,163,74,0.12);
        }
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
        .lp-mfind {
          margin: 16px 24px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #f0fdf4;
          color: #15803d;
          padding: 14px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          border: 1.5px solid #86efac;
          text-decoration: none;
          width: calc(100% - 48px);
        }
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
        .lp-sec { padding: 60px 24px; }
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
        .lp-pain-sec { background: transparent; }
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
        .lp-who-sec { background: transparent; }
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
        .lp-who-ico { font-size: 36px; margin-bottom: 12px; display: flex; justify-content: center; }
        .lp-who-title { font-size: 15px; font-weight: 800; color: #065f46; margin-bottom: 6px; }
        .lp-who-desc { font-size: 13px; color: #4b5563; line-height: 1.65; }

        /* ── GHOST ICONS FOR SLIDERS ── */
        .lp-pain-card, .lp-who-card { position: relative; overflow: hidden; }
        .lp-pain-card > div:not(.lp-pain-ghost), .lp-who-card > div:not(.lp-who-ghost) { position: relative; z-index: 1; }
        .lp-pain-ghost, .lp-who-ghost {
          position: absolute;
          bottom: -20px;
          right: -20px;
          color: #6b7280;
          opacity: 0.05;
          filter: blur(1px);
          z-index: 0;
          transition: transform 0.25s ease-out, opacity 0.25s ease-out;
          pointer-events: none;
        }
        .lp-pain-card:hover .lp-pain-ghost, .lp-who-card:hover .lp-who-ghost {
          transform: translate(6px, -4px);
          opacity: 0.08;
        }

        /* ── COMPARISON ── */
        .lp-cmp-sec { background: transparent; }
        .lp-cmp-wrap { margin-top: 48px; border-radius: 20px; box-shadow: 0 12px 40px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #e5e7eb; }
        .lp-cmp-grid { display: grid; grid-template-columns: 1fr 1fr; background: #fff; }
        .lp-cmp-col { padding: 40px 32px; display: flex; flex-direction: column; gap: 32px; }
        .lp-cmp-old { background: #f3f4f6; border-right: 1px solid #e5e7eb; }
        .lp-cmp-new { background: linear-gradient(145deg, #dcfce7 0%, #f0fdf4 100%); position: relative; }
        .lp-cmp-badge { position: absolute; top: 16px; right: 24px; background: #dcfce7; color: #16a34a; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 800; border: 1px solid #86efac; }
        .lp-cmp-header { text-align: center; margin-bottom: 8px; }
        .lp-cmp-header-title { font-size: 24px; font-weight: 900; color: #4b5563; margin-bottom: 4px; letter-spacing: -0.5px; }
        .lp-cmp-header-sub { font-size: 15px; color: #6b7280; font-weight: 600; }
        .lp-cmp-list { display: flex; flex-direction: column; gap: 20px; flex: 1; justify-content: center; }
        .lp-cmp-item { display: flex; align-items: flex-start; gap: 14px; padding: 16px; border-radius: 12px; background: #fff; border: 1px solid #f3f4f6; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .lp-cmp-item-bad { transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }
        .lp-cmp-item-bad:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(239,68,68,0.1); border-color: #fecaca; }
        .lp-cmp-item-good { background: #fff; border: 1px solid #dcfce7; box-shadow: 0 4px 12px rgba(22,163,74,0.06); transition: transform 0.2s; }
        .lp-cmp-item-good:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(22,163,74,0.12); }
        .lp-cmp-icon-bad { color: #ef4444; flex-shrink: 0; margin-top: 2px; }
        .lp-cmp-icon-good { color: #16a34a; flex-shrink: 0; margin-top: 2px; }
        .lp-cmp-item-title { font-size: 15px; font-weight: 700; color: #111827; line-height: 1.4; }

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
        .lp-midcta-note::before { content: ''; color: #bbf7d0; }

        /* ── FEATURES ── */
        .lp-feat-sec { background: transparent; }
        .lp-feat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
          gap: 20px;
          margin-top: 52px;
        }
        .lp-feat-card {
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 32px 28px 24px;
          background-color: #fff;
          transition: transform 0.25s ease-out, box-shadow 0.25s ease-out, border-color 0.25s ease-out;
          box-shadow: 0 4px 16px rgba(0,0,0,0.03);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .lp-feat-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 100% 100%, var(--feat-bloom) 0%, transparent 70%);
          z-index: 0;
          opacity: 0.6;
          transition: opacity 0.25s ease-out;
          pointer-events: none;
        }
        .lp-feat-card:hover { 
          transform: translateY(-6px); 
          box-shadow: 0 20px 48px rgba(0,0,0,0.08); 
          border-color: #d1d5db; 
        }
        .lp-feat-card:hover::before {
          opacity: 1;
        }
        .lp-feat-ghost {
          position: absolute;
          bottom: -30px;
          right: -30px;
          color: #6b7280;
          opacity: 0.05;
          filter: blur(1px);
          z-index: 0;
          transition: transform 0.25s ease-out, opacity 0.25s ease-out;
          pointer-events: none;
        }
        .lp-feat-card:hover .lp-feat-ghost {
          transform: translate(6px, -4px);
          opacity: 0.08;
        }
        .lp-feat-deco {
          position: absolute;
          top: 32px;
          right: 28px;
          color: #6b7280;
          opacity: 0.06;
          z-index: 0;
          transition: opacity 0.25s ease-out;
          pointer-events: none;
        }
        .lp-feat-card:hover .lp-feat-deco {
          opacity: 0.12;
        }
        .lp-feat-ico {
          width: 52px; height: 52px;
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          font-size: 26px;
          margin-bottom: 24px;
          position: relative; z-index: 1;
        }
        .lp-feat-title { font-size: 17px; font-weight: 800; color: #111827; margin-bottom: 10px; position: relative; z-index: 1; }
        .lp-feat-desc { font-size: 14px; color: #6b7280; line-height: 1.6; position: relative; z-index: 1; flex: 1; margin-bottom: 24px; }


        /* ── HOW IT WORKS ── */
        .lp-how-sec { background: transparent; }
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
        .lp-price-sec { background: transparent; }
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
        .lp-faq-sec { background: transparent; }
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

        
        /* Carousel Desktop Default (Hidden) */
        .lp-carousel-dots { display: none; }
\n        /* ── RESPONSIVE ── */
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
          /* Mobile Carousels */
          .lp-carousel-dots { display: flex; justify-content: center; gap: 6px; margin-top: 16px; }
          .lp-carousel-dot { width: 6px; height: 6px; border-radius: 50%; background: #d1d5db; transition: 0.2s; }
          .lp-carousel-dot.active { background: #16a34a; width: 14px; border-radius: 100px; }
          .lp-carousel-track { 
            display: flex !important; 
            overflow-x: auto; 
            scroll-snap-type: x mandatory; 
            -webkit-overflow-scrolling: touch; 
            scrollbar-width: none; 
            padding-bottom: 12px; 
            margin-left: -20px;
            padding-left: 20px;
            margin-right: -20px; 
            padding-right: 20px; 
            gap: 16px; 
          }
          .lp-carousel-track::-webkit-scrollbar { display: none; }
          .lp-carousel-track > div { width: 78%; min-width: 78%; max-width: 78%; flex-shrink: 0; scroll-snap-align: center; white-space: normal; }
          .lp-carousel-track .lp-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
          
          /* Features 2-column Grid */
          .lp-feat-grid { display: grid !important; grid-template-columns: 1fr 1fr; gap: 12px; }
          .lp-feat-card { padding: 20px 16px 16px; border-radius: 16px; }
          .lp-feat-ico { width: 36px; height: 36px; font-size: 20px !important; margin-bottom: 16px; border-radius: 12px; }
          .lp-feat-title { font-size: 14px; margin-bottom: 6px; }
          .lp-feat-desc { font-size: 12px; line-height: 1.45; margin-bottom: 0; }
          .lp-feat-ghost { bottom: -20px; right: -20px; transform: scale(0.65); }
          .lp-feat-deco { transform: scale(0.7); top: 16px; right: 12px; }

          /* Generic Mobile Fixes */
          .lp-sec { padding: 48px 20px; }
          .lp-sec-sub { font-size: 14px; max-width: 100%; line-height: 1.6; }
          .lp-pain-ico, .lp-who-ico { font-size: 26px !important; }
          .lp-step-ico { font-size: 24px !important; height: 32px; }
          
          /* Comparison Compression */
          .lp-cmp-grid { grid-template-columns: 1fr; }
          .lp-cmp-old { border-right: none; border-bottom: 1px solid #e5e7eb; padding: 24px 16px; gap: 20px; }
          .lp-cmp-new { padding: 24px 16px; gap: 20px; }
          .lp-cmp-item { padding: 12px; gap: 10px; }
          .lp-cmp-header-title { font-size: 20px; }
          .lp-cmp-header-sub { font-size: 13px; }
          .lp-cmp-item-title { font-size: 13.5px; }
          
          /* Pricing Compression */
          .lp-plans { max-width: 100%; grid-template-columns: 1fr; gap: 16px; margin-top: 36px; }
          .lp-plan { padding: 24px 20px; gap: 16px; border-radius: 20px; }
          .lp-plan-price { font-size: 32px; letter-spacing: -1px; }
          .lp-pf { font-size: 13px; gap: 8px; }

          /* Nav & UI */
          .lp-nav-links { display: none; }
          .lp-hamburger { display: block; }
          .lp-hero { padding: 60px 20px 48px; }
          .lp-midcta { padding: 60px 20px; }
          .lp-hero-h1 { letter-spacing: -1px; }
          .lp-hero-btns { flex-direction: column; width: 100%; }
          .lp-btn-primary, .lp-btn-secondary { width: 100%; justify-content: center; }
          .lp-footer-top { grid-template-columns: 1fr; gap: 32px; }
          .lp-footer-links { align-items: flex-start; flex-direction: column; gap: 12px; }
          .lp-topbar { font-size: 12px; padding: 8px 12px; }
          .lp-modal { padding: 28px 18px; border-radius: 16px; }
          .lp-cmp-table th, .lp-cmp-table td { padding: 12px 10px; font-size: 12px; }
          .lp-step-num { width: 44px; height: 44px; font-size: 17px; }
          .lp-midcta-notes { flex-direction: column; align-items: center; gap: 10px; }
        }
        @media (max-width: 480px) {
          .lp-hero-h1 { font-size: 30px; }
          .lp-sec-h2 { font-size: 24px; }
          .lp-how-steps { grid-template-columns: 1fr; gap: 24px; }
          .lp-footer-bottom { flex-direction: column; align-items: center; text-align: center; }
          .lp-midcta h2 { font-size: 26px; }
        }
      `}</style>

      {/* ── TOP BAR ── */}
      <div className="lp-topbar">
        <Sparkles size={16} style={{ display: "inline-block", marginRight: "6px", verticalAlign: "text-bottom" }} /> 7-Day Elite Trial — No credit card needed.
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
            <span className="lp-nl" onClick={() => go("faq")}>FAQ</span>
            <Link href="/find" className="lp-nav-find"><Search size={16} strokeWidth={2.5} /> Find Clinic</Link>
            <button className="lp-nav-cta" onClick={() => router.push("/login")}>Get Started →</button>
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
        <span className="lp-mlink" onClick={() => go("faq")}>FAQ</span>
        <Link href="/find" className="lp-mfind"><Search size={16} strokeWidth={2.5} /> Find Clinic</Link>
        <button className="lp-mcta" onClick={() => { router.push("/login"); setMenuOpen(false); }}>Start Free Trial →</button>
        <span className="lp-mlink" style={{ textAlign: "center", marginTop: "4px", color: "#6b7280", fontSize: "14px" }} onClick={() => { router.push("/login"); setMenuOpen(false); }}>
          Already registered? <strong style={{ color: "#16a34a" }}>Log in</strong>
        </span>
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
              <span className="lp-hero-trust-item"><span style={{display: "flex", alignItems: "center"}}><Check size={16} strokeWidth={3} /> No app for patients</span></span>
              <span className="lp-hero-trust-item"><span style={{display: "flex", alignItems: "center"}}><Check size={16} strokeWidth={3} /> Works on any phone</span></span>
              <span className="lp-hero-trust-item"><span style={{display: "flex", alignItems: "center"}}><Check size={16} strokeWidth={3} /> 2-min setup</span></span>
              <span className="lp-hero-trust-item"><span style={{display: "flex", alignItems: "center"}}><Check size={16} strokeWidth={3} /> 7-Day Elite Trial</span></span>
            </div>
          </div>
          <div className="lp-hero-visual">
            <WhatsAppDemo />
            <span className="lp-demo-label"><Sparkles size={14} style={{ display: "inline-block", marginRight: "4px", verticalAlign: "text-bottom" }} /> Live WhatsApp Preview</span>
          </div>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="lp-sec lp-pain-sec">
        <div className="lp-sec-inner">
          <div className="lp-sec-tag lp-reveal">Sound Familiar?</div>
          <h2 className="lp-sec-h2 lp-reveal lp-reveal-d1">These problems are costing your clinic every day</h2>
          <p className="lp-sec-sub lp-reveal lp-reveal-d2">TokenPe fixes all three. In 2 minutes.</p>
          <MobileCarousel gridClass="lp-pain-grid">
            {[
              { ico: <Users size="1em" color="#ef4444" />, tag: "Patient Problem", title: "Overcrowded Rooms", desc: "Patients sit for 3+ hours in packed waiting areas. They leave frustrated — or worse, they leave and never come back." },
              { ico: <Megaphone size="1em" color="#f97316" />, tag: "Staff Problem", title: "Missed Turns", desc: "The receptionist calls out names. Half the patients step out. Chaos ensues. Turns are missed, slots are wasted." },
              { ico: <ClipboardList size="1em" color="#374151" />, tag: "Clinic Problem", title: "Inefficient Queues", desc: "Paper tokens can't scale. No data, no history, no visibility. You don't know how busy you are until it's too late." },
            ].map((c, i) => (
              <div key={c.title} className={`lp-pain-card lp-reveal lp-reveal-d${i + 1}`}>
                <div className="lp-pain-ghost">{React.cloneElement(c.ico, { size: 140, color: "currentColor" })}</div>
                <div className="lp-pain-badge">{c.tag}</div>
                <div className="lp-pain-ico">{c.ico}</div>
                <div className="lp-pain-title">{c.title}</div>
                <div className="lp-pain-desc">{c.desc}</div>
              </div>
            ))}
          </MobileCarousel>
        </div>
      </section>

      {/* ── WHO IS THIS FOR ── */}
      <section className="lp-sec lp-who-sec">
        <div className="lp-sec-inner">
          <div className="lp-sec-tag lp-reveal">Who is this for?</div>
          <h2 className="lp-sec-h2 lp-reveal lp-reveal-d1">Built for every kind of clinic</h2>
          <p className="lp-sec-sub lp-reveal lp-reveal-d2">From solo practitioners to large polyclinics — if you have a waiting room, TokenPe is for you.</p>
          <MobileCarousel gridClass="lp-who-grid">
            {[
              { ico: <Stethoscope size="1em" color="#065f46" />, title: "General Physicians", desc: "Manage high patient volumes effortlessly. Reduce no-shows, eliminate crowding." },
              { ico: <Activity size="1em" color="#065f46" />, title: "Specialists", desc: "Set precise appointment slots. Patients know exactly when their turn is." },
              { ico: <Building2 size="1em" color="#065f46" />, title: "Polyclinics", desc: "Manage multiple departments and doctors with one centralised dashboard." },
              { ico: <Smile size="1em" color="#065f46" />, title: "Dentists & Eye Clinics", desc: "Appointment-style queuing with automated reminders for longer consultations." },
            ].map((c, i) => (
              <div key={c.title} className={`lp-who-card lp-reveal lp-reveal-d${i + 1}`}>
                <div className="lp-who-ghost">{React.cloneElement(c.ico, { size: 140, color: "currentColor" })}</div>
                <div className="lp-who-ico">{c.ico}</div>
                <div className="lp-who-title">{c.title}</div>
                <div className="lp-who-desc">{c.desc}</div>
              </div>
            ))}
          </MobileCarousel>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section className="lp-sec lp-cmp-sec">
        <div className="lp-sec-inner">
          <div className="lp-sec-tag lp-reveal lp-sec-centered" style={{ display: "table", margin: "0 auto 14px" }}>Comparison</div>
          <h2 className="lp-sec-h2 lp-sec-centered lp-reveal lp-reveal-d1">The old way vs. the TokenPe way</h2>
          <p className="lp-sec-sub lp-sec-centered lp-reveal lp-reveal-d2" style={{ marginBottom: 0 }}>See the difference at a glance.</p>
          <div className="lp-cmp-wrap lp-reveal lp-reveal-d3">
            <div className="lp-cmp-grid">
              <div className="lp-cmp-col lp-cmp-old">
                <div className="lp-cmp-header">
                  <div className="lp-cmp-header-title">The Old Way</div>
                  <div className="lp-cmp-header-sub">Paper Token System</div>
                </div>
                <div className="lp-cmp-list">
                  {compData.map((item, i) => (
                    <div key={i} className="lp-cmp-item lp-cmp-item-bad">
                      <XCircle size={20} className="lp-cmp-icon-bad" />
                      <div className="lp-cmp-item-content">
                        <div className="lp-cmp-item-title">{item.old}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lp-cmp-col lp-cmp-new">
                <div className="lp-cmp-header">
                  <div className="lp-cmp-header-title" style={{color: '#16a34a'}}>The TokenPe Way</div>
                  <div className="lp-cmp-header-sub" style={{color: '#065f46'}}>Digital WhatsApp Queue</div>
                </div>
                <div className="lp-cmp-list">
                  {compData.map((item, i) => (
                    <div key={i} className="lp-cmp-item lp-cmp-item-good">
                      <CheckCircle2 size={20} className="lp-cmp-icon-good" />
                      <div className="lp-cmp-item-content">
                        <div className="lp-cmp-item-title">{item.new}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
            <span className="lp-midcta-note"><Check size={16} strokeWidth={3} color="#bbf7d0" /> No credit card required</span>
            <span className="lp-midcta-note"><Check size={16} strokeWidth={3} color="#bbf7d0" /> No auto-charge after trial</span>
            <span className="lp-midcta-note"><Check size={16} strokeWidth={3} color="#bbf7d0" /> Cancel anytime</span>
            <span className="lp-midcta-note"><Check size={16} strokeWidth={3} color="#bbf7d0" /> 2-minute setup</span>
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
              <div key={f.title} className={`lp-feat-card lp-reveal lp-reveal-d${(i % 3) + 1}`} style={{ '--feat-color': f.iconColor, '--feat-bloom': f.bloom }}>
                <f.GhostIco size={160} className="lp-feat-ghost" />
                <div className="lp-feat-deco"><f.Deco /></div>
                <div className="lp-feat-ico">{f.ico}</div>
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
              { n: "1", ico: <FileSignature size="1em" color="#111827" />, title: "Register your clinic", desc: "Sign up in 2 minutes with Google. Get your unique WhatsApp clinic QR code instantly." },
              { n: "2", ico: <QrCode size="1em" color="#111827" />, title: "Display the QR code", desc: "Print and display the QR card at reception. Patients scan once — they're in the queue." },
              { n: "3", ico: <BellRing size="1em" color="#111827" />, title: "Call with one tap", desc: "Press 'Call Next' on your dashboard. The patient gets a WhatsApp alert in their language." },
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
                    <div key={f} className="lp-pf"><span className="lp-pf-check"><Check size={16} strokeWidth={3} /></span>{f}</div>
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
              <FileText size={16} style={{ display: "inline-block", marginRight: "6px", verticalAlign: "text-bottom" }} /> View full feature comparison & terms
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
              <Link href="/find" className="lp-flink"><Search size={16} style={{ display: "inline-block", marginRight: "4px", verticalAlign: "text-bottom" }} /> Find a Clinic</Link>
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
