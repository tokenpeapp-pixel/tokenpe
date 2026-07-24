"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, UtensilsCrossed, GraduationCap, Scissors, MoreHorizontal, Search, Check, Users, Megaphone, ClipboardList, Stethoscope, Activity, Building2, Smile, Mic, MessageSquare, Zap, Bell, Calendar, QrCode, FileSignature, BellRing, FileText, CheckCircle2, XCircle, ChevronRight } from "lucide-react";

import WhatsAppDemo from "../app/components/WhatsAppDemo";


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

export default function LandingPageTemplate({ config = {} }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dots, setDots] = useState([]);
  
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
    setDots([...Array(15)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `-${Math.random() * 20}s, -${Math.random() * 3}s`,
      opacity: Math.random() * 0.5 + 0.1
    })));
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

  const defaultCompData = [
    { old: "Crowded waiting rooms", new: "Wait comfortably at home" },
    { old: "No status updates", new: "Real-time WhatsApp alerts" },
    { old: "No multiple language support", new: "10 Indian languages + voice" },
    { old: "Manual token calling", new: "Automated notifications" },
    { old: "No patient data", new: "Full history & analytics" },
    { old: "App required to use", new: "Works on any phone via WhatsApp" },
    { old: "Zero digital presence", new: "Your own clinic QR code" },
  ];

  const defaultFeatures = [
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
          background: var(--bg-color);
          color: var(--text-main);
          background-attachment: fixed;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }

        /* ── ANIMATIONS ── */
        .lp-reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1);
        }
        .lp-reveal.lp-visible { opacity: 1; transform: none; }
        .lp-reveal-d1.lp-visible { transition-delay: 0.1s; }
        .lp-reveal-d2.lp-visible { transition-delay: 0.15s; }
        .lp-reveal-d3.lp-visible { transition-delay: 0.15s; }
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
        @keyframes cta-shine {
          0% { left: -100%; }
          20% { left: 200%; }
          100% { left: 200%; }
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
          transition: box-shadow 0.15s ease;
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
          transition: all 0.15s ease;
          padding: 6px 12px;
          border-radius: 8px;
        }
        .lp-nl:hover { 
          color: #065f46;
          background: rgba(6, 95, 70, 0.04);
          transform: translateY(-2px);
        }
        .lp-nav-cta {
          background: linear-gradient(135deg, #16a34a, #0d9488);
          color: #fff;
          padding: 10px 24px;
          border-radius: 999px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 14px rgba(22, 163, 74, 0.35);
          transition: all 0.15s ease;
          white-space: nowrap;
          position: relative;
          overflow: hidden;
        }
        .lp-nav-cta:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 24px rgba(22, 163, 74, 0.45); 
        }
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
          transition: all 0.15s ease;
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
        .lp-ghost-queue {
          position: absolute;
          bottom: 15%;
          left: 0;
          width: 100%;
          height: 200px;
          /* SVG of 3 people standing in line, repeating horizontally */
          background: url("data:image/svg+xml,%3Csvg width='240' height='200' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='0.5' stroke-linecap='round' stroke-linejoin='round' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='9' cy='7' r='4'/%3E%3Cpath d='M23 21v-2a4 4 0 0 0-3-3.87'/%3E%3Cpath d='M16 3.13a4 4 0 0 1 0 7.75'/%3E%3C/svg%3E") repeat-x;
          background-size: 240px 200px;
          animation: queue-slide 15s linear infinite;
          pointer-events: none;
          z-index: 0;
        }
        @keyframes queue-slide {
          from { background-position-x: 240px; }
          to { background-position-x: 0px; }
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
          transition: transform 0.15s ease, box-shadow 0.22s, background 0.15s;
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
          transition: transform 0.15s ease, border-color 0.15s, box-shadow 0.22s;
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
        .lp-sec { padding: 60px 24px; scroll-margin-top: 69px; position: relative; overflow: hidden; }
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
          transition: transform 0.15s ease, box-shadow 0.15s, border-color 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .lp-pain-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px rgba(0,0,0,0.09); border-color: #fca5a5; }
        .lp-pain-ico { font-size: 32px; margin-bottom: 14px; display: flex; justify-content: center; }
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
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 4px 16px rgba(22,163,74,0.06);
          text-align: center;
        }
        .lp-who-card:hover { transform: translateY(-6px); box-shadow: 0 20px 48px rgba(22,163,74,0.14); }
        .lp-who-ico { font-size: 36px; margin-bottom: 12px; display: flex; justify-content: center; }
        .lp-who-title { font-size: 15px; font-weight: 800; color: #065f46; margin-bottom: 6px; }
        .lp-who-desc { font-size: 13px; color: #4b5563; line-height: 1.65; }

        /* ── GHOST ICONS FOR SLIDERS ── */
        .lp-pain-card, .lp-who-card { position: relative; overflow: hidden; text-align: center; }
        .lp-pain-card > div:not(.lp-pain-ghost), .lp-who-card > div:not(.lp-who-ghost) { position: relative; z-index: 1; }
        .lp-pain-ghost, .lp-who-ghost {
          position: absolute;
          bottom: -20px;
          right: -20px;
          color: #6b7280;
          opacity: 0.05;
          filter: blur(1px);
          z-index: 0;
          transition: transform 0.3s ease, opacity 0.3s ease, color 0.3s ease, filter 0.3s ease;
          pointer-events: none;
        }
        .lp-pain-card:hover .lp-pain-ghost, .lp-who-card:hover .lp-who-ghost {
          color: #f97316;
          opacity: 0.2;
          transform: rotate(5deg) scale(1.05);
          filter: blur(0px);
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
        .lp-cmp-item-bad { transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; }
        .lp-cmp-item-bad:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(239,68,68,0.1); border-color: #fecaca; }
        .lp-cmp-item-good { background: #fff; border: 1px solid #dcfce7; box-shadow: 0 4px 12px rgba(22,163,74,0.06); transition: transform 0.15s; }
        .lp-cmp-item-good:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(22,163,74,0.12); }
        .lp-cmp-icon-bad { color: #ef4444; flex-shrink: 0; margin-top: 2px; }
        .lp-cmp-icon-good { color: #16a34a; flex-shrink: 0; margin-top: 2px; }
        .lp-cmp-item-title { font-size: 15px; font-weight: 700; color: #111827; line-height: 1.4; }

        /* ── MID CTA ── */
        .lp-midcta {
          background: linear-gradient(135deg, #FF8A2B, #FF6B00 50%, #F45D00);
          padding: 70px 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .lp-midcta::before {
          content: '';
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08) 0%, transparent 40%),
            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.06) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='1' fill='rgba(255,255,255,0.05)'/%3E%3C/svg%3E") repeat;
          pointer-events: none;
          z-index: 0;
          animation: lp-ambient-float 20s infinite alternate ease-in-out;
        }
        @keyframes lp-ambient-float {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.05) translate(1%, 2%); }
        }
        .lp-midcta-inner { 
          max-width: 760px; 
          margin: 0 auto; 
          position: relative; 
          z-index: 1; 
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .lp-midcta-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border-radius: 999px;
          padding: 12px 22px;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 20px;
          letter-spacing: 0.5px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .lp-midcta-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.12);
        }
        .lp-midcta h2 {
          font-family: 'Inter', sans-serif;
          font-size: 52px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -2px;
          margin-bottom: 16px;
          line-height: 1.05;
        }
        .lp-midcta-hl {
          background: linear-gradient(135deg, #fff, #ffe4d6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-midcta p {
          color: rgba(255,255,255,0.9);
          font-size: 18px;
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 600px;
        }
        .lp-midcta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: #fff;
          color: #ea580c;
          height: 60px;
          padding: 0 40px;
          border-radius: 18px;
          font-size: 17px;
          font-weight: 800;
          cursor: pointer;
          border: none;
          box-shadow: 0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(255,255,255,0.1);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .lp-midcta-btn svg {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .lp-midcta-btn:hover { 
          transform: translateY(-2px) scale(1.02); 
          box-shadow: 0 20px 48px rgba(0,0,0,0.18), 0 8px 24px rgba(255,255,255,0.15); 
        }
        .lp-midcta-btn:hover svg {
          transform: translateX(6px);
        }
        .lp-midcta-btn:active { transform: scale(0.98); }
        .lp-midcta-notes {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-top: 32px;
          width: 100%;
        }
        .lp-midcta-note { 
          font-size: 13px; 
          color: #fff; 
          font-weight: 600; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          padding: 8px 16px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          transition: all 0.2s ease, transform 0.2s ease;
          cursor: default;
        }
        .lp-midcta-note:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.35);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .lp-midcta-note::before { display: none; }

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
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
          box-shadow: 0 4px 16px rgba(0,0,0,0.03);
          position: relative;
          overflow: hidden;
        }
        .lp-feat-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 100% 100%, var(--feat-bloom) 0%, transparent 70%);
          z-index: 0;
          opacity: 0.6;
          transition: opacity 0.15s ease;
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
          transition: transform 0.3s ease, opacity 0.3s ease, color 0.3s ease, filter 0.3s ease;
          pointer-events: none;
        }
        .lp-feat-card:hover .lp-feat-ghost {
          color: #f97316;
          opacity: 0.2;
          transform: rotate(5deg) scale(1.05);
          filter: blur(0px);
        }
        .lp-feat-deco {
          position: absolute;
          top: 32px;
          right: 28px;
          color: #6b7280;
          opacity: 0.06;
          z-index: 0;
          transition: opacity 0.15s ease;
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
          margin: 0 auto 24px;
          position: relative; z-index: 1;
          color: #4b5563;
          transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .lp-feat-card:hover .lp-feat-ico {
          transform: scale(1.05) translateY(-2px);
          background: #f0fdf4;
          color: #16a34a;
          border-color: #bbf7d0;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.08);
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
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .lp-how-step:hover .lp-step-num {
          transform: scale(1.15);
          box-shadow: 0 12px 32px rgba(22,163,74,0.5);
        }
        .lp-step-ico { font-size: 28px; margin-bottom: 14px; display: flex; align-items: center; justify-content: center; height: 36px; transition: transform 0.15s ease; }
        .lp-how-step:hover .lp-step-ico { transform: translateY(-4px) scale(1.1); }
        .lp-step-title { font-size: 15px; font-weight: 800; color: #111827; margin-bottom: 8px; transition: color 0.15s; }
        .lp-how-step:hover .lp-step-title { color: #059669; }
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
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
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
        .lp-plan-feats { display: flex; flex-direction: column; gap: 10px; flex: 1; text-align: left; }
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
          transition: transform 0.3s ease, box-shadow 0.3s ease;
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
          transition: box-shadow 0.15s;
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
          transition: background 0.15s, color 0.15s, transform 0.15s;
        }
        .lp-faq-item.open .lp-faq-icon { background: #dcfce7; color: #16a34a; transform: rotate(45deg); }
        .lp-faq-a {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.16,1,0.3,1), padding 0.15s;
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
          transition: background 0.15s, transform 0.15s;
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
          .lp-carousel-dot { width: 6px; height: 6px; border-radius: 50%; background: #d1d5db; transition: 0.15s; }
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
          
          /* Features Grid */
          .lp-feat-grid { display: grid !important; grid-template-columns: 1fr; gap: 16px; }
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
          .lp-midcta h2 { font-size: 40px; }
        }
        @media (max-width: 480px) {
          .lp-hero-h1 { font-size: 30px; }
          .lp-sec-h2 { font-size: 24px; }
          .lp-how-steps { grid-template-columns: 1fr; gap: 24px; }
          .lp-footer-bottom { flex-direction: column; align-items: center; text-align: center; }
          .lp-midcta h2 { font-size: 34px; }
        }
        :root {
          --bg-color: ${config.theme?.bg || "#111827"};
          --text-main: ${config.theme?.textMain || "#f9fafb"};
          --text-muted: ${config.theme?.textMuted || "#9ca3af"};
          --primary-start: ${config.theme?.primaryStart || "#f5a623"};
          --primary-end: ${config.theme?.primaryEnd || "#e85d3f"};
          --secondary-accent: ${config.theme?.secondaryAccent || "#2dd4a7"};
          --tint: ${config.theme?.tint || "rgba(255, 255, 255, 0.05)"};
        }

        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: var(--bg-color);
          color: var(--text-main);
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }

        /* ── ANIMATED QUEUE BACKGROUND ── */
        .queue-bg-container {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
          opacity: 0.15;
        }
        .queue-dot {
          position: absolute;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-start), var(--primary-end));
          box-shadow: 0 0 10px var(--primary-start);
          animation: queue-drift 20s linear infinite, queue-pulse 3s ease-in-out infinite;
        }
        @keyframes queue-drift {
          from { transform: translateX(-10vw); }
          to { transform: translateX(110vw); }
        }
        @keyframes queue-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1) translateX(var(--drift-x)); }
          50% { opacity: 1; transform: scale(1.5) translateX(var(--drift-x)); }
        }

        /* ── VERTICAL SELECTOR ── */
        .lp-vertical-grid {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .lp-vcard {
          flex: 1 1 180px;
          max-width: 220px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          text-decoration: none;
          color: var(--text-main);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .lp-vcard::before {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(135deg, var(--primary-start), var(--primary-end));
          opacity: 0; transition: opacity 0.15s; z-index: 0;
        }
        .lp-vcard:hover::before { opacity: 0.1; }
        .lp-vcard:hover {
          transform: translateY(-4px) scale(1.03);
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 15px var(--tint);
        }
        .lp-vcard:active { transform: scale(0.98); }
        .lp-vcard-icon {
          font-size: 32px;
          margin-bottom: 12px;
          color: var(--text-muted);
          transition: color 0.15s;
          position: relative; z-index: 1;
          display: flex; justify-content: center;
        }
        .lp-vcard:hover .lp-vcard-icon { color: var(--primary-start); }
        .lp-vcard-name {
          font-size: 16px; font-weight: 700;
          position: relative; z-index: 1;
        }
        .lp-vcard-ghost {
          position: absolute;
          right: -25px;
          bottom: -25px;
          color: rgba(255, 255, 255, 0.03);
          transition: all 0.3s ease;
          transform: rotate(-15deg) scale(0.85);
          pointer-events: none;
          z-index: 0;
        }
        .lp-vcard:hover .lp-vcard-ghost {
          color: #f97316; /* Ember */
          opacity: 0.2;
          transform: rotate(5deg) scale(1.05);
        }
        
        @media (max-width: 768px) {
          .lp-vertical-grid { gap: 12px; }
          .lp-vcard { flex: 1 1 45%; max-width: none; padding: 16px; }
        }

        /* ── THEMING OVERRIDES FOR SIGNAL FLOW ── */
        .lp-topbar { background: #000; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .lp-topbar a { color: var(--primary-start); }
        .lp-nav { background: rgba(0,0,0,0.8); border-bottom: 1px solid rgba(255,255,255,0.1); }
        .lp-nl { color: var(--text-muted); }
        .lp-nl:hover { 
          color: var(--text-main);
          background: rgba(255,255,255,0.06);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .lp-nav-cta {
          background: #fff;
          color: #000 !important;
          border-radius: 12px;
          border: 1px solid #fff;
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
          font-weight: 800;
          transition: all 0.15s ease;
        }
        .lp-nav-cta:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 8px 24px rgba(255, 255, 255, 0.2); 
          background: #f3f4f6;
        }
        .lp-nav-find { background: rgba(255,255,255,0.05); color: var(--text-main); border: 1px solid rgba(255,255,255,0.1); }
        .lp-nav-find:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); box-shadow: none; }
        
        .lp-hero-badge { background: rgba(45, 212, 167, 0.1); color: var(--secondary-accent); border: 1px solid rgba(45, 212, 167, 0.3); }
        .lp-badge-dot { background: var(--secondary-accent); }
        .lp-grad { background: linear-gradient(135deg, var(--primary-start), var(--primary-end)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .lp-hero-visual::before { background: radial-gradient(circle, rgba(245, 166, 35, 0.15) 0%, rgba(232, 93, 63, 0.08) 50%, transparent 70%); }
        .lp-demo-label { background: linear-gradient(135deg, var(--primary-start), var(--primary-end)); }
        .lp-hero-h1 { color: var(--text-main); }
        .lp-hero-sub { color: var(--text-muted); }
        .lp-btn-primary {
          background: #fff;
          color: #000;
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
          border: 1px solid #fff;
        }
        .lp-btn-primary:hover {
          box-shadow: 0 8px 24px rgba(255, 255, 255, 0.2);
          transform: translateY(-3px);
          background: #f3f4f6;
        }
        .lp-btn-secondary {
          background: rgba(255,255,255,0.05); color: var(--text-main);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .lp-btn-secondary:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.4); transform: translateY(-3px); }
        .lp-hero-trust-item {
          background: rgba(255,255,255,0.05);
          color: #fff !important;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: none;
          transition: transform 0.15s ease, border-color 0.15s, background 0.15s;
          cursor: default;
        }
        .lp-hero-trust-item:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.1);
        }
        .lp-hero-trust-item svg { color: var(--secondary-accent); transition: transform 0.15s; }
        .lp-hero-trust-item:hover svg { transform: scale(1.2); }
        
        .lp-stat-val { color: var(--primary-start); }
        .lp-stat-lbl { color: var(--text-muted); }
        
        .lp-sec-tag { background: rgba(255,255,255,0.05); color: var(--secondary-accent); border: 1px solid rgba(255,255,255,0.1); }
        .lp-sec-h2 { color: var(--text-main); }
        .lp-sec-sub { color: var(--text-muted); }
        
        .lp-ccard { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); box-shadow: none; transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .lp-ccard:hover { transform: translateY(-4px) scale(1.02); border-color: var(--primary-start); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .lp-ccard-title { color: var(--text-main); }
        .lp-citem { color: var(--text-muted); }
        .lp-citem-bad { color: #f87171; }
        .lp-citem-good { color: var(--secondary-accent); }
        
        .lp-pain-card, .lp-who-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); box-shadow: none; transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; }
        .lp-pain-card:hover, .lp-who-card:hover { transform: translateY(-4px) scale(1.02); border-color: var(--primary-start); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .lp-pain-title, .lp-who-title { color: var(--text-main); }
        .lp-pain-desc, .lp-who-desc { color: var(--text-muted); }

        .lp-cmp-grid { background: transparent; }
        .lp-cmp-old { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.1); }
        .lp-cmp-new { background: rgba(255,255,255,0.05); }
        .lp-cmp-header-title { color: var(--text-main); }
        .lp-cmp-header-sub { color: var(--text-muted); }
        .lp-cmp-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); box-shadow: none; transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; }
        .lp-cmp-item-bad:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 10px 30px rgba(239,68,68,0.2); border-color: #ef4444; }
        .lp-cmp-item-good:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 10px 30px rgba(45,212,167,0.2); border-color: var(--secondary-accent); }
        .lp-cmp-item-title { color: var(--text-main); }

        .lp-feat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); box-shadow: none; transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .lp-feat-card:hover {
          transform: translateY(-4px) scale(1.02);
          border-color: var(--primary-start);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .lp-feat-title { color: var(--text-main); }
        .lp-feat-desc { color: var(--text-muted); }
        .lp-feat-ico { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); color: var(--text-main); }
        .lp-feat-card:hover .lp-feat-ico { 
          transform: scale(1.05) translateY(-2px); 
          background: rgba(245, 166, 35, 0.1);
          color: var(--primary-start);
          border-color: rgba(245, 166, 35, 0.3);
          box-shadow: 0 4px 16px rgba(245, 166, 35, 0.15);
        }
        
        .lp-how-step { background: transparent; border: none; cursor: default; }
        .lp-step-num { background: var(--bg-color); color: var(--primary-start); box-shadow: 0 0 0 2px var(--primary-start); transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .lp-how-step:hover .lp-step-num { transform: scale(1.15); box-shadow: 0 0 0 4px var(--primary-start), 0 10px 30px rgba(0,0,0,0.5); }
        .lp-step-ico { background: transparent; color: var(--text-main); transition: transform 0.15s, color 0.15s; }
        .lp-how-step:hover .lp-step-ico { transform: translateY(-4px) scale(1.1); color: var(--primary-start); }
        .lp-step-title { color: var(--text-main); transition: color 0.15s; }
        .lp-how-step:hover .lp-step-title { color: var(--primary-start); }
        .lp-step-desc { color: var(--text-muted); }
        
        .lp-plan { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; }
        .lp-plan:hover { transform: translateY(-8px) scale(1.03); border-color: var(--primary-start); box-shadow: 0 20px 50px rgba(0,0,0,0.4), 0 0 20px rgba(245, 166, 35, 0.1); }
        .lp-plan.lp-plan-hot { 
          border-color: transparent; 
          background: linear-gradient(var(--bg-color),var(--bg-color)) padding-box, linear-gradient(135deg,var(--primary-start),var(--primary-end)) border-box;
          box-shadow: 0 0 20px rgba(245, 166, 35, 0.1); 
        }
        .lp-plan-name { color: var(--text-main); }
        .lp-plan-desc { color: var(--text-muted); }
        .lp-plan-price { color: var(--text-main); transition: transform 0.15s; }
        .lp-plan:hover .lp-plan-price { transform: scale(1.05); }
        .lp-plan-price span { color: var(--text-muted); }
        .lp-pf { color: var(--text-muted); }
        .lp-pf-check { color: var(--secondary-accent); background: rgba(45, 212, 167, 0.1); }
        .lp-plan-btn {
          background: #fff;
          color: #000;
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
          border: 1px solid #fff;
          transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .lp-plan-btn:hover {
          box-shadow: 0 8px 24px rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          background: #f3f4f6;
        }
        .lp-plan-btn.lp-ghost { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: var(--text-main); }
        .lp-plan-btn.lp-ghost:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.4); }
        
        .lp-faq-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s; }
        .lp-faq-item:hover { transform: scale(1.01) translateY(-2px); border-color: var(--primary-start); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .lp-faq-q { color: var(--text-main); transition: color 0.15s; }
        .lp-faq-item:hover .lp-faq-q { color: var(--primary-start); }
        .lp-faq-icon { background: rgba(255,255,255,0.05); color: var(--text-muted); transition: background 0.15s, color 0.15s, transform 0.15s; }
        .lp-faq-item:hover .lp-faq-icon { background: rgba(245, 166, 35, 0.1); color: var(--primary-start); transform: rotate(90deg); }
        .lp-faq-item.open .lp-faq-icon { background: rgba(245, 166, 35, 0.2); color: var(--primary-start); }
        .lp-faq-a { color: var(--text-muted); }
        
        .lp-footer { background: #000; border-top: 1px solid rgba(255,255,255,0.1); }
        .lp-footer-tagline, .lp-flink, .lp-footer-copy { color: var(--text-muted); transition: color 0.15s, transform 0.15s; }
        .lp-flink:hover { color: var(--primary-start); transform: translateX(4px); }
        .lp-footer-links-title { color: var(--text-main); }
        .lp-footer-divider { background: rgba(255,255,255,0.1); }
        
        .lp-modal { background: var(--bg-color); color: var(--text-main); }
        .lp-modal h2 { color: var(--text-main) !important; }
        .lp-modal th { color: var(--text-main) !important; border-bottom: 2px solid rgba(255,255,255,0.1) !important; }
        .lp-modal tr { border-bottom: 1px solid rgba(255,255,255,0.1) !important; }
        .lp-modal td { color: var(--text-muted) !important; }
        
        .lp-mmenu { background: var(--bg-color); }
        .lp-mmenu .lp-nl { color: var(--text-main); }
        .lp-hamburger { color: var(--text-main); }
        

        /* Remove static body background from old theme */
        body { background: var(--bg-color) !important; }
        
        /* ── GLOBAL BACKGROUND ── */
        .lp-global-bg {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: -1;
          pointer-events: none;
          background: 
            radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 70%),
            radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.02) 0%, transparent 60%),
            url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='1' height='1' fill='rgba(255,255,255,0.03)'/%3E%3C/svg%3E") repeat;
        }
      `}
        </style>

      {/* ── GLOBAL BACKGROUND ── */}
      <div className="lp-global-bg" />

      {/* ── TOP BAR ── */}
      <div className="lp-topbar">
        <Sparkles size={16} style={{ display: "inline-block", marginRight: "6px", verticalAlign: "text-bottom" }} /> 7-Day Elite Trial — No credit card needed.
        {!config.isRoot && <a href="#" onClick={(e) => { e.preventDefault(); router.push("/login"); }}>Start now →</a>}
        {config.isRoot && <a href="#" onClick={(e) => { e.preventDefault(); go("industries"); }}>Start now →</a>}
      </div>

      {/* ── NAV ── */}
      <nav className={`lp-nav${scrolled ? " scrolled" : ""}`}>
        <div className="lp-nav-inner">
          <img src="/logo-light.svg" alt="TokenPe" style={{ height: 38, width: "auto", cursor: "pointer" }} onClick={() => router.push("/")} />
          <div className="lp-nav-links">
            
          {/* Explore Dropdown */}
          {!config.isRoot && (
            <Link href="/" className="lp-nl" style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
              <MoreHorizontal size={16} /> Explore Industries
            </Link>
          )}
          <span className="lp-nl" onClick={() => go("features")}>Features</span>
          <span className="lp-nl" onClick={() => go("how")}>How it works</span>
            <span className="lp-nl" onClick={() => go("pricing")}>Pricing</span>
            <span className="lp-nl" onClick={() => go("faq")}>FAQ</span>
            {config.find && <Link href={config.find.href} className="lp-nav-find"><Search size={16} strokeWidth={2.5} /> {config.find.text}</Link>}
            {!config.isRoot && <button className="lp-nav-cta" onClick={() => router.push("/login")}>Get Started →</button>}
            {config.isRoot && <button className="lp-nav-cta" onClick={() => go("industries")}>Get Started →</button>}
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
        {config.find && <Link href={config.find.href} className="lp-mfind"><Search size={16} strokeWidth={2.5} /> {config.find.text}</Link>}
        {!config.isRoot ? (
          <>
            <button className="lp-mcta" onClick={() => { router.push("/login"); setMenuOpen(false); }}>Start Free Trial →</button>
            <span className="lp-mlink" style={{ textAlign: "center", marginTop: "4px", color: "#6b7280", fontSize: "14px" }} onClick={() => { router.push("/login"); setMenuOpen(false); }}>
              Already registered? <strong style={{ color: "#16a34a" }}>Log in</strong>
            </span>
          </>
        ) : (
          <button className="lp-mcta" onClick={() => { go("industries"); setMenuOpen(false); }}>Explore Industries →</button>
        )}
      </div>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-particles">
          {dots.map((d, i) => <div key={i} className="lp-particle" style={{ top: d.top, left: d.left, animationDelay: d.delay, opacity: d.opacity }} />)}
        </div>
        <div className="lp-ghost-queue" />
        <div className="lp-hero-inner">
          <div className="lp-hero-content">
            <div className="lp-hero-badge">
              <span className="lp-badge-dot" />
              {config.badge || "🇮🇳 Built for India's businesses"}
            </div>
            <h1 className="lp-hero-h1">
              No more waiting.<br />
              <span className="lp-grad">Queue smarter.</span>
            </h1>
            <p className="lp-hero-sub">
              {config.hero?.sub || "Replace paper tokens and long lines with a digital WhatsApp queue. Customers wait anywhere. Zero apps needed."}
            </p>
            <div className="lp-hero-btns">
              <button className="lp-btn-primary" onClick={() => !config.isRoot ? router.push("/login") : go("industries")}>
                {!config.isRoot ? "Start Free Trial" : "Explore Industries"}
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
            <WhatsAppDemo flow={config.waFlow} />
            <span className="lp-demo-label"><Sparkles size={14} style={{ display: "inline-block", marginRight: "4px", verticalAlign: "text-bottom" }} /> Live WhatsApp Preview</span>
          </div>
        </div>
      </section>

      {/* ── VERTICAL SELECTOR (Root Only) ── */}
      {config.isRoot && (
        <section id="industries" className="lp-sec lp-vertical-sec" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
          <div className="lp-sec-inner">
            <h2 className="lp-sec-h2 lp-sec-centered lp-reveal" style={{ marginBottom: '32px' }}>Choose your industry</h2>
            <div className="lp-vertical-grid lp-reveal lp-reveal-d1">
              {[
                { name: "Clinic", Ico: Stethoscope, path: "/clinics" },
                { name: "Restaurant", Ico: UtensilsCrossed, path: "/restaurants" },
                { name: "School", Ico: GraduationCap, path: "/schools" },
                { name: "Salon", Ico: Scissors, path: "/salons" },
                { name: "Other", Ico: Sparkles, path: "/other" }
              ].map(v => (
                <Link key={v.name} href={v.path} className="lp-vcard">
                  <div className="lp-vcard-ghost"><v.Ico size={120} strokeWidth={1.5} /></div>
                  <div className="lp-vcard-icon"><v.Ico size={24} /></div>
                  <div className="lp-vcard-name">{v.name}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PAIN POINTS ── */}
      <section className="lp-sec lp-pain-sec">
        <div className="lp-sec-inner">
          <div className="lp-sec-tag lp-reveal">Sound Familiar?</div>
          <h2 className="lp-sec-h2 lp-reveal lp-reveal-d1">{config.pain?.h2 || "These problems are costing you every day"}</h2>
          <p className="lp-sec-sub lp-reveal lp-reveal-d2">{config.pain?.sub || "TokenPe fixes all three. In 2 minutes."}</p>
          <MobileCarousel gridClass="lp-pain-grid">
            {(config.pain?.list || [
              { ico: <Users size="1em" color="#ef4444" />, tag: "Customer Problem", title: "Overcrowded Areas", desc: "Customers sit for hours in packed waiting areas. They leave frustrated — or worse, they leave and never come back." },
              { ico: <Megaphone size="1em" color="#f97316" />, tag: "Staff Problem", title: "Missed Turns", desc: "Staff calls out names. Half the people step out. Chaos ensues. Turns are missed, slots are wasted." },
              { ico: <ClipboardList size="1em" color="#374151" />, tag: "Business Problem", title: "Inefficient Queues", desc: "Paper tokens can\'t scale. No data, no history, no visibility. You don\'t know how busy you are until it\'s too late." },
            ]).map((c, i) => (
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
          <h2 className="lp-sec-h2 lp-reveal lp-reveal-d1">{config.who?.h2 || "Built for every kind of business"}</h2>
          <p className="lp-sec-sub lp-reveal lp-reveal-d2">{config.who?.sub || "If you have a waiting room or a queue, TokenPe is for you."}</p>
          <MobileCarousel gridClass="lp-who-grid">
            {(config.who?.list || [
              { ico: <Building2 size="1em" color="#065f46" />, title: "Clinics & Hospitals", desc: "Manage high patient volumes effortlessly. Reduce no-shows, eliminate crowding." },
              { ico: <Users size="1em" color="#065f46" />, title: "Restaurants", desc: "End the host-stand chaos. Diners join the waitlist and get notified when the table is ready." },
              { ico: <Activity size="1em" color="#065f46" />, title: "Salons & Spas", desc: "Manage walk-ins and appointments seamlessly with automated WhatsApp alerts." },
              { ico: <ClipboardList size="1em" color="#065f46" />, title: "Schools & Events", desc: "Organize admissions, interviews, or event entries without the long physical lines." },
            ]).map((c, i) => (
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
                  {(config.compData || defaultCompData).map((item, i) => (
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
                  {(config.compData || defaultCompData).map((item, i) => (
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
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block", boxShadow: "0 0 8px rgba(255,255,255,0.8)" }} />
            Limited Time Offer
          </div>
          <h2 className="lp-reveal lp-reveal-d1">Claim Your <span className="lp-midcta-hl">7-Day Free Trial</span><br />with Zero Risk</h2>
          <p className="lp-reveal lp-reveal-d2">Get full Elite Plan access — our most powerful tier — completely free. No credit card. No hidden charges. Cancel anytime.</p>
          <button className="lp-midcta-btn lp-reveal lp-reveal-d3" onClick={() => !config.isRoot ? router.push("/login") : go("industries")}>
            {!config.isRoot ? "Start My Free Trial" : "Explore Industries"}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
          <div className="lp-midcta-notes lp-reveal lp-reveal-d4">
            <span className="lp-midcta-note"><Check size={14} strokeWidth={3} color="#fff" /> No Credit Card</span>
            <span className="lp-midcta-note"><Check size={14} strokeWidth={3} color="#fff" /> Cancel Anytime</span>
            <span className="lp-midcta-note"><Check size={14} strokeWidth={3} color="#fff" /> Instant Access</span>
            <span className="lp-midcta-note"><Check size={14} strokeWidth={3} color="#fff" /> 2-Minute Setup</span>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="lp-sec lp-feat-sec">
        <div className="lp-sec-inner">
          <div className="lp-sec-tag lp-reveal">Features</div>
          <h2 className="lp-sec-h2 lp-reveal lp-reveal-d1">{config.featuresData?.h2 || "Everything your business needs"}</h2>
          <p className="lp-sec-sub lp-reveal lp-reveal-d2">One tool that replaces paper tokens, crowded waiting rooms, and manual calling — forever.</p>
          <div className="lp-feat-grid">
            {(config.features || defaultFeatures).map((f, i) => (
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
            {(config.howSteps || [
              { n: "1", ico: <FileSignature size="1em" color="currentColor" />, title: "Register your business", desc: "Sign up in 2 minutes with Google. Get your unique WhatsApp QR code instantly." },
              { n: "2", ico: <QrCode size="1em" color="currentColor" />, title: "Display the QR code", desc: "Print and display the QR card. Customers scan once — they're in the queue." },
              { n: "3", ico: <BellRing size="1em" color="currentColor" />, title: "Call with one tap", desc: "Press 'Call Next' on your dashboard. The customer gets a WhatsApp alert." },
            ]).map((s, i) => (
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
          <p className="lp-sec-sub lp-sec-centered lp-reveal lp-reveal-d2" style={{ marginBottom: 0 }}>{config.pricing?.sub || "Choose the plan that fits your business. Start free, upgrade anytime."}</p>
          <div className="lp-plans">
            {(config.pricing?.plans || [
              { name: "Starter", desc: "Perfect for small businesses", price: "₹499", per: "/mo", feats: ["50 customers/day", "Standard WhatsApp Alerts", "Basic 7-day Analytics", "Auto-Generated Code"], hot: false },
              { name: "Pro", desc: "For busy businesses that want to look professional", price: "₹999", per: "/mo", feats: ["150 customers/day", "Branded WhatsApp Identity", "Multilingual Voice Alerts", "Queue Pause & Smart Wait Time", "30-Day History & Heatmap"], hot: true },
              { name: "Elite", desc: "For enterprise & multi-branch", price: "₹1999", per: "/mo", feats: ["Unlimited customers", "Multi-Branch Management", "Report Download (PDF/CSV)", "VIP WhatsApp Support", "CRM Broadcasts", "All-Time History"], hot: false },
            ]).map((p, i) => (
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
                {!config.isRoot && (
                  <button className="lp-plan-btn lp-ghost" onClick={() => router.push("/login")}>
                    Get started
                  </button>
                )}
                {config.isRoot && (
                  <button className="lp-plan-btn lp-ghost" onClick={() => go("industries")}>
                    Explore
                  </button>
                )}
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
            {!config.isRoot ? (
              <button className="lp-footer-cta" onClick={() => router.push("/login")}>Start Free Trial →</button>
            ) : (
              <button className="lp-footer-cta" onClick={() => go("industries")}>Explore Industries →</button>
            )}
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
    { q: "What if my customers don't have WhatsApp?", a: "TokenPe works on any smartphone with WhatsApp. For the rare customer without a smartphone, your staff can add them manually to the queue from the dashboard. They still appear perfectly in sequence!" },
    { q: "What if the internet goes down in my business?", a: "TokenPe is lightweight and works seamlessly on mobile data. If your location's Wi-Fi drops, your staff can continue managing the queue using their phone's 4G/5G connection." },
    { q: "How is this different from just giving out paper tokens?", a: "Paper tokens require customers to wait in a crowded area for hours. TokenPe allows them to wait comfortably at home or nearby, only arriving when it's their turn. It elevates the customer experience and makes your business look modern." },
    { q: "Do customers need to download an app?", a: "Not at all! Customers simply scan a QR code or send a WhatsApp message. No app downloads, no logins, and no friction whatsoever." },
    { q: "How long does setup take?", a: "Less than 2 minutes. Sign up with Google, verify your business details, and you'll have your QR code ready to display. No IT team, no hardware required." },
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
