"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, UtensilsCrossed, GraduationCap, Scissors, MoreHorizontal, Search, Check, Users, Megaphone, ClipboardList, Stethoscope, Activity, Building2, Smile, Mic, MessageSquare, Zap, Bell, Calendar, QrCode, FileSignature, BellRing, FileText, CheckCircle2, XCircle, ChevronRight, Mail, PhoneOff, TrendingDown, Menu, X, Smartphone } from "lucide-react";

import WhatsAppDemo from "../app/components/WhatsAppDemo";
import Lenis from "lenis";
import "lenis/dist/lenis.css";


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
          <div 
            key={i} 
            className={`lp-carousel-dot ${i === active ? 'active' : ''}`}
            onClick={() => {
              if (scrollRef.current) {
                const cardWidth = scrollRef.current.scrollWidth / count;
                scrollRef.current.scrollTo({ left: i * cardWidth, behavior: 'smooth' });
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

function HeroCursorField() {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5, active: false });

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setMousePos({ x, y, active: true });
  };

  const handleMouseLeave = () => {
    setMousePos((prev) => ({ ...prev, active: false }));
  };

  const offsetX = mousePos.active ? (mousePos.x - 0.5) * 35 : 0;
  const offsetY = mousePos.active ? (mousePos.y - 0.5) * 35 : 0;

  return (
    <div
      ref={containerRef}
      className={`lp-cursor-pulse-field ${mousePos.active ? 'active' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="lp-pulse-cursor-glow"
        style={{
          left: `${mousePos.x * 100}%`,
          top: `${mousePos.y * 100}%`,
          opacity: mousePos.active ? 1 : 0
        }}
      />

      {/* SVG Connecting Path with Top-to-Bottom Surging Energy Pulses */}
      <svg className="lp-pulse-path-svg" viewBox="0 0 250 360">
        {/* Base Connecting Wire Path */}
        <path
          d="M 65 45 C 200 100, 200 160, 80 220 C 30 260, 130 300, 180 325"
          stroke="rgba(34, 197, 94, 0.28)"
          strokeWidth="2"
          strokeDasharray="5 5"
          fill="none"
        />

        {/* Top-to-Bottom Surging Light Beams traveling along the path */}
        <circle r="5.5" fill="#ffffff" filter="drop-shadow(0 0 10px #22c55e)">
          <animateMotion
            path="M 65 45 C 200 100, 200 160, 80 220 C 30 260, 130 300, 180 325"
            dur={mousePos.active ? "1.0s" : "2.2s"}
            repeatCount="indefinite"
          />
        </circle>

        <circle r="4.5" fill="#22c55e" filter="drop-shadow(0 0 8px #22c55e)">
          <animateMotion
            path="M 65 45 C 200 100, 200 160, 80 220 C 30 260, 130 300, 180 325"
            begin="0.55s"
            dur={mousePos.active ? "1.0s" : "2.2s"}
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      {/* Connected Floating Micro-Chips */}
      <div
        className="lp-cursor-node lp-node-1"
        style={{
          transform: `translate(${offsetX * 0.8}px, ${offsetY * 0.8}px)`
        }}
      >
        <span className="lp-node-dot" />
        <span className="lp-node-txt">Token #013</span>
      </div>

      <div
        className="lp-cursor-node lp-node-2"
        style={{
          transform: `translate(${offsetX * -0.6}px, ${offsetY * -0.6}px)`
        }}
      >
        <Zap size={13} color="#22c55e" />
        <span className="lp-node-txt">Real-time Sync</span>
      </div>

      <div
        className="lp-cursor-node lp-node-3"
        style={{
          transform: `translate(${offsetX * 1.1}px, ${offsetY * 1.1}px)`
        }}
      >
        <MessageSquare size={13} color="#2dd4a7" />
        <span className="lp-node-txt">WhatsApp Alert</span>
      </div>
    </div>
  );
}

export default function LandingPageTemplate({ config = {} }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dots, setDots] = useState([]);
  const [activeWho, setActiveWho] = useState(0);
  
  const go = (id) => {
    const target = document.getElementById(id);
    if (target) {
      if (window.lenisInstance) {
        window.lenisInstance.scrollTo(target, { duration: 1.2 });
      } else {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
    setMenuOpen(false);
  };

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    window.lenisInstance = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      window.lenisInstance = null;
      lenis.destroy();
    };
  }, []);

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
      ico: <Mic size="1.3em" color="#22c55e" />, color: "rgba(34, 197, 94, 0.12)", iconColor: "#22c55e", bloom: "rgba(34, 197, 94, 0.25)", title: "Voice in 10 Languages", desc: "Patients get WhatsApp voice alerts in Hindi, Tamil, Telugu, Marathi, Gujarati & 5 more.",
      GhostIco: Mic,
      Deco: () => (
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 20L15 10L20 30L25 15L30 25L35 5L40 35L45 15L50 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      ico: <MessageSquare size="1.3em" color="#22c55e" />, color: "rgba(34, 197, 94, 0.12)", iconColor: "#22c55e", bloom: "rgba(34, 197, 94, 0.25)", title: "Zero App for Patients", desc: "Scan QR → join queue. No downloads, no logins. Works on any phone.",
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
      ico: <Zap size="1.3em" color="#22c55e" />, color: "rgba(34, 197, 94, 0.12)", iconColor: "#22c55e", bloom: "rgba(34, 197, 94, 0.25)", title: "Live Dashboard", desc: "See who's waiting, with doctor, and done — updating in real-time.",
      GhostIco: Zap,
      Deco: () => (
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 35L20 20L35 25L55 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      ico: <Bell size="1.3em" color="#22c55e" />, color: "rgba(34, 197, 94, 0.12)", iconColor: "#22c55e", bloom: "rgba(34, 197, 94, 0.25)", title: "Smart Auto Alerts", desc: "10-away, 5-away, and your-turn notifications sent automatically.",
      GhostIco: Bell,
      Deco: () => (
        <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="40" r="20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" fill="none"/>
          <circle cx="30" cy="40" r="35" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" fill="none"/>
        </svg>
      )
    },
    { 
      ico: <Calendar size="1.3em" color="#22c55e" />, color: "rgba(34, 197, 94, 0.12)", iconColor: "#22c55e", bloom: "rgba(34, 197, 94, 0.25)", title: "Date-wise History", desc: "Complete patient records for any past date. Daily volumes at a glance.",
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
      ico: <QrCode size="1.3em" color="#22c55e" />, color: "rgba(34, 197, 94, 0.12)", iconColor: "#22c55e", bloom: "rgba(34, 197, 94, 0.25)", title: "QR Code & Print Card", desc: "Generate your clinic QR. Download PNG or print a display-ready card.",
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
        html { scroll-behavior: smooth; max-width: 100vw !important; overflow-x: hidden !important; }
        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: var(--bg-color);
          color: var(--text-main);
          background-attachment: fixed;
          max-width: 100vw !important;
          overflow-x: hidden !important;
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
          background: #f97316 !important;
          color: #ffffff !important;
          text-align: center;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.2px;
          line-height: 1.5;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: block !important;
        }
        .lp-topbar a {
          color: #ffffff !important;
          font-weight: 800;
          text-decoration: underline;
          margin-left: 8px;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          transition: color 0.15s ease;
        }
        .lp-topbar a:hover {
          color: #4ade80 !important;
          text-decoration: underline;
        }

        /* ── NAV (TRANSPARENT AT TOP, GLASSMORPHISM ON SCROLL) ── */
        .lp-nav {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          z-index: 9999 !important;
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border-bottom: 1px solid transparent !important;
          box-shadow: none !important;
          transition: background 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease, backdrop-filter 0.3s ease !important;
        }
        .lp-nav.scrolled {
          background: rgba(14, 15, 17, 0.88) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
        }
        .lp-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .lp-nav-left {
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        .lp-nav-center {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 36px;
        }
        .lp-nav-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 16px;
        }
        .lp-nl {
          color: #9ca3af !important;
          font-size: 14.5px !important;
          font-weight: 450 !important;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.2s ease, transform 0.2s ease;
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .lp-nl:hover { 
          color: #ffffff !important;
          background: transparent !important;
          transform: translateY(-1px);
        }
        .lp-nav-cta {
          background: #ffffff !important;
          color: #0c0c0e !important;
          padding: 10px 24px !important;
          border-radius: 9999px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          cursor: pointer;
          border: none !important;
          box-shadow: 0 4px 14px rgba(255, 255, 255, 0.15) !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: inherit;
        }
        .lp-nav-cta:hover { 
          background: #f8fafc !important;
          transform: translateY(-2px) !important; 
          box-shadow: 0 8px 24px rgba(255, 255, 255, 0.25) !important; 
        }
        .lp-nav-cta:active { transform: scale(0.96) !important; }
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
          padding: 125px 24px 60px;
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
          position: absolute !important;
          top: 100px !important;
          left: 0 !important;
          width: 100% !important;
          height: 480px !important;
          pointer-events: none !important;
          z-index: 0 !important;
          overflow: hidden !important;
          opacity: 0.9 !important;
        }
        .lp-ghost-queue-track {
          display: flex !important;
          width: 200% !important;
          height: 100% !important;
          animation: queue-slide 18s linear infinite !important;
        }
        .lp-ghost-queue-svg {
          width: 50% !important;
          height: 100% !important;
        }
        @keyframes queue-slide {
          from { transform: translateX(0%); }
          to { transform: translateX(-50%); }
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
        .lp-cursor-pulse-field {
          position: absolute;
          left: 52%;
          top: 48%;
          transform: translate(-50%, -50%);
          width: 250px;
          height: 360px;
          z-index: 10;
          pointer-events: auto;
          cursor: crosshair;
        }
        @media (max-width: 1100px) {
          .lp-cursor-pulse-field { display: none !important; }
        }
        .lp-pulse-path-svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
        }
        .lp-pulse-cursor-glow {
          position: absolute;
          width: 160px;
          height: 160px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.25) 0%, rgba(34, 197, 94, 0.06) 50%, transparent 70%);
          pointer-events: none;
          transition: opacity 0.25s ease;
        }
        .lp-cursor-node {
          position: absolute;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 15px;
          background: rgba(18, 20, 24, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 99px;
          backdrop-filter: blur(14px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(34, 197, 94, 0.12);
          transition: transform 0.12s ease-out, border-color 0.3s ease, box-shadow 0.3s ease;
          user-select: none;
          pointer-events: none;
        }
        .lp-cursor-pulse-field:hover .lp-cursor-node,
        .lp-cursor-pulse-field.active .lp-cursor-node {
          border-color: rgba(34, 197, 94, 0.45);
          box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.6), 0 0 22px rgba(34, 197, 94, 0.25);
        }
        .lp-node-1 { top: 25px; left: 10px; }
        .lp-node-2 { top: 150px; right: 10px; }
        .lp-node-3 { bottom: 25px; left: 20px; }
        .lp-node-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
        }
        .lp-node-txt {
          font-size: 11.5px;
          font-weight: 600;
          color: #f3f4f6;
          letter-spacing: 0.2px;
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
          background: rgba(255, 255, 255, 0.03) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: 9999px !important;
          padding: 5px 14px 5px 10px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          color: #d1d5db !important;
          margin-bottom: 24px !important;
          box-shadow: none !important;
          animation: none !important;
        }
        .lp-badge-country {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: #9ca3af;
          background: rgba(255, 255, 255, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .lp-badge-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #16a34a;
          animation: lp-pulse-ring 2s ease-out infinite;
          flex-shrink: 0;
        }
        .font-heading {
          font-family: 'Outfit', sans-serif !important;
        }
        .lp-hero-h1 {
          font-family: 'Outfit', sans-serif !important;
          font-size: 2.6rem !important;
          font-weight: 500 !important;
          line-height: 1.02 !important;
          letter-spacing: -0.03em !important;
          margin-bottom: 24px !important;
          max-width: 680px;
        }
        @media (min-width: 640px) {
          .lp-hero-h1 {
            font-size: 3.75rem !important;
          }
        }
        @media (min-width: 1024px) {
          .lp-hero-h1 {
            font-size: 4.7rem !important;
          }
        }
        .lp-h1-dim {
          color: #64748b;
          font-weight: 500;
        }
        .lp-h1-white {
          color: #ffffff;
          font-weight: 500;
        }
        .lp-h1-green {
          color: #22c55e;
          font-weight: 500;
        }
        .lp-grad { background: linear-gradient(135deg, #16a34a, #0891b2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .lp-hero-sub {
          color: #9ca3af !important;
          font-size: 15px !important;
          line-height: 1.65 !important;
          margin-bottom: 32px !important;
          max-width: 480px !important;
          font-weight: 400 !important;
        }
        .lp-hero-btns { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 32px; }
        .lp-btn-primary {
          background: #22c55e !important;
          color: #0c0c0e !important;
          padding: 12px 24px !important;
          border-radius: 9999px !important;
          font-size: 14.5px !important;
          font-weight: 600 !important;
          cursor: pointer;
          border: none !important;
          box-shadow: 0 4px 16px rgba(34, 197, 94, 0.25) !important;
          transition: all 0.2s ease !important;
          text-decoration: none;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .lp-btn-primary:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(34, 197, 94, 0.35) !important; background: #16a34a !important; }
        .lp-btn-primary:active { transform: scale(0.96) !important; }
        .lp-btn-secondary {
          background: transparent !important;
          color: #ffffff !important;
          padding: 12px 24px !important;
          border-radius: 9999px !important;
          font-size: 14.5px !important;
          font-weight: 500 !important;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          transition: all 0.2s ease !important;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .lp-btn-secondary:hover { border-color: rgba(255, 255, 255, 0.4) !important; background: rgba(255, 255, 255, 0.06) !important; transform: translateY(-2px) !important; }
        .lp-btn-secondary:active { transform: scale(0.96) !important; }
        .lp-hero-trust {
          display: flex;
          flex-wrap: wrap;
          gap: 28px;
          align-items: center;
          margin-top: 12px;
        }
        .lp-hero-trust-item {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 14.5px;
          font-weight: 400;
          color: #9ca3af;
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }

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
        .lp-pain-sec { background: transparent; padding: 70px 24px 60px; }
        .lp-pain-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #9ca3af;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .lp-pain-eyebrow.centered {
          display: flex !important;
          justify-content: center !important;
          margin-left: auto !important;
          margin-right: auto !important;
          width: fit-content !important;
        }
        .lp-pain-eyebrow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
        }
        .lp-pain-h2 {
          font-family: 'Outfit', sans-serif !important;
          font-size: 2.25rem !important;
          font-weight: 500 !important;
          line-height: 1.08 !important;
          letter-spacing: -0.02em !important;
          color: #ffffff !important;
          margin-bottom: 12px !important;
        }
        @media (min-width: 640px) {
          .lp-pain-h2 {
            font-size: 2.8rem !important;
          }
        }
        .lp-h2-dim {
          color: #64748b !important;
          font-weight: 500 !important;
        }
        .lp-h2-white {
          color: #ffffff !important;
          font-weight: 500 !important;
        }
        .lp-pain-dim {
          color: #64748b;
          font-weight: 500;
        }
        .lp-pain-sub {
          color: #9ca3af !important;
          font-size: 16px !important;
          line-height: 1.6 !important;
          margin-bottom: 40px !important;
        }
        .lp-pain-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 900px) {
          .lp-pain-grid { grid-template-columns: 1fr; }
        }
        .lp-pain-card {
          background: #161a22 !important;
          border: 1px solid rgba(255, 255, 255, 0.07) !important;
          border-radius: 18px !important;
          padding: 34px 28px !important;
          position: relative !important;
          overflow: hidden !important;
          box-shadow: none !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          text-align: left !important;
        }
        .lp-pain-card:hover {
          background: #1c212b !important;
          border-color: rgba(255, 255, 255, 0.16) !important;
          transform: translateY(-4px) !important;
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.6) !important;
        }
        .lp-pain-num {
          position: absolute !important;
          top: 12px !important;
          right: 20px !important;
          left: auto !important;
          font-size: 96px !important;
          font-weight: 800 !important;
          color: rgba(255, 255, 255, 0.05) !important;
          line-height: 0.85 !important;
          pointer-events: none !important;
          font-family: 'Outfit', sans-serif !important;
          user-select: none !important;
          z-index: 0 !important;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), color 0.3s ease !important;
        }
        .lp-pain-card:hover .lp-pain-num {
          color: rgba(255, 255, 255, 0.10) !important;
          transform: scale(1.04) translateY(-2px) !important;
        }
        .lp-pain-card-body {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }
        .lp-pain-tag {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 24px;
          text-align: left;
          width: 100%;
        }
        .lp-pain-iconbox {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          color: #f87171;
          transition: all 0.3s ease;
        }
        .lp-pain-card:hover .lp-pain-iconbox {
          background: rgba(239, 68, 68, 0.14);
          border-color: rgba(239, 68, 68, 0.35);
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.25);
          transform: scale(1.05);
        }
        .lp-pain-title {
          font-family: 'Outfit', sans-serif !important;
          font-size: 22px !important;
          font-weight: 600 !important;
          color: #ffffff !important;
          margin-bottom: 12px !important;
          letter-spacing: -0.01em;
          text-align: left !important;
          width: 100%;
        }
        .lp-pain-desc {
          font-size: 14px !important;
          color: #9ca3af !important;
          line-height: 1.6 !important;
          font-weight: 400 !important;
          text-align: left !important;
          width: 100%;
        }

        /* ── WHO IS THIS FOR (2-COLUMN SPLIT SHOWCASE) ── */
        .lp-who-sec { background: transparent; padding: 80px 24px 70px; }
        .lp-who-split {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 32px;
          margin-top: 40px;
          align-items: stretch;
        }
        @media (max-width: 960px) {
          .lp-who-split { grid-template-columns: 1fr; }
        }
        .lp-who-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          justify-content: center;
        }
        .lp-who-item {
          background: #141517;
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
        }
        .lp-who-item:hover {
          background: #17181b;
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateX(4px);
        }
        .lp-who-item.active {
          background: #17181c;
          border-color: rgba(34, 197, 94, 0.35);
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(34, 197, 94, 0.1);
        }
        .lp-who-iconbox {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          flex-shrink: 0;
          transition: all 0.25s ease;
        }
        .lp-who-item.active .lp-who-iconbox,
        .lp-who-item:hover .lp-who-iconbox {
          background: rgba(34, 197, 94, 0.12);
          border-color: rgba(34, 197, 94, 0.3);
          color: #22c55e;
        }
        .lp-who-item-title {
          font-family: 'Outfit', sans-serif !important;
          font-size: 18px !important;
          font-weight: 600 !important;
          color: #ffffff !important;
          margin-bottom: 4px !important;
        }
        .lp-who-item-desc {
          font-size: 13.5px !important;
          color: #9ca3af !important;
          line-height: 1.5 !important;
          font-weight: 400 !important;
        }
        .lp-who-showcase {
          background: #141517;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          position: relative;
          overflow: hidden;
          min-height: 480px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
        }
        .lp-who-showcase-slide {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 36px 32px;
          pointer-events: none;
        }
        .lp-who-showcase-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          filter: brightness(0.7) contrast(1.1);
        }
        .lp-who-showcase-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(12, 13, 15, 0.95) 0%, rgba(12, 13, 15, 0.4) 45%, transparent 100%);
          pointer-events: none;
        }
        .lp-who-showcase-content {
          position: relative;
          z-index: 2;
          text-align: left;
        }
        .lp-who-showcase-tag {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: #22c55e;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .lp-who-showcase-title {
          font-family: 'Outfit', sans-serif !important;
          font-size: 28px !important;
          font-weight: 600 !important;
          color: #ffffff !important;
          margin-bottom: 0 !important;
          letter-spacing: -0.01em;
        }

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
          position: relative;
          background: #161a22 !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          border-radius: 20px;
          padding: 32px 28px;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5) !important;
        }
        .lp-feat-card::before {
          display: none !important;
        }
        .lp-feat-card:hover {
          transform: translateY(-5px) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          box-shadow: 0 15px 35px -10px rgba(0, 0, 0, 0.7) !important;
        }
        .lp-feat-ghost {
          position: absolute;
          bottom: -25px;
          right: -25px;
          color: rgba(255, 255, 255, 0.04) !important;
          opacity: 1 !important;
          filter: none !important;
          z-index: 0;
          transition: transform 0.4s ease, opacity 0.4s ease;
          pointer-events: none;
        }
        .lp-feat-card:hover .lp-feat-ghost {
          color: rgba(255, 255, 255, 0.08) !important;
          transform: rotate(6deg) scale(1.05);
          filter: none !important;
        }
        .lp-feat-deco {
          position: absolute;
          top: 32px;
          right: 28px;
          color: rgba(255, 255, 255, 0.05) !important;
          opacity: 1 !important;
          z-index: 0;
          transition: opacity 0.2s ease;
          pointer-events: none;
        }
        .lp-feat-card:hover .lp-feat-deco {
          color: rgba(255, 255, 255, 0.1) !important;
        }
        .lp-feat-ico {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(34, 197, 94, 0.10) !important;
          border: 1.5px solid rgba(34, 197, 94, 0.35) !important;
          font-size: 22px;
          margin: 0 0 22px;
          position: relative;
          z-index: 1;
          color: #22c55e !important;
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.18), inset 0 0 10px rgba(34, 197, 94, 0.1) !important;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease !important;
        }
        .lp-feat-ico svg {
          stroke: #22c55e !important;
          color: #22c55e !important;
          stroke-width: 2.2px !important;
        }
        .lp-feat-card:hover .lp-feat-ico {
          transform: scale(1.08) translateY(-2px) !important;
          background: rgba(34, 197, 94, 0.20) !important;
          border-color: #22c55e !important;
          box-shadow: 0 0 28px rgba(34, 197, 94, 0.4), inset 0 0 12px rgba(34, 197, 94, 0.2) !important;
        }
        .lp-feat-title { font-size: 18px; font-weight: 800; color: #ffffff; margin-bottom: 10px; position: relative; z-index: 1; letter-spacing: -0.2px; }
        .lp-feat-desc { font-size: 14px; color: #9ca3af; line-height: 1.6; position: relative; z-index: 1; flex: 1; margin-bottom: 24px; }


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
        .lp-footer {
          background: #111113 !important;
          border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
          padding: 80px 24px 32px !important;
          color: #9ca3af;
          position: relative;
          overflow: hidden;
        }
        .lp-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
        }
        .lp-footer-top {
          display: grid;
          grid-template-columns: 2.2fr 1fr 1fr;
          gap: 48px;
          margin-bottom: 30px;
          align-items: start;
        }
        .lp-footer-brand {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: flex-start;
        }
        .lp-footer-tagline {
          color: #9ca3af !important;
          font-size: 14.5px;
          line-height: 1.6;
          max-width: 320px;
        }
        .lp-footer-explore-btn {
          background: #22c55e;
          color: #0c0c0e;
          padding: 10px 22px;
          border-radius: 9999px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
        }
        .lp-footer-explore-btn:hover {
          background: #16a34a;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(34, 197, 94, 0.3);
        }
        .lp-footer-links {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .lp-footer-links-title {
          color: #6b7280 !important;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .lp-flink {
          color: #9ca3af !important;
          font-size: 14px;
          font-weight: 400;
          text-decoration: none;
          transition: color 0.15s, transform 0.15s;
        }
        .lp-flink:hover {
          color: #ffffff !important;
          transform: none !important;
        }
        .lp-footer-big-text {
          font-size: clamp(3.5rem, 15.5vw, 12rem);
          font-weight: 900;
          letter-spacing: 0.03em;
          text-align: center;
          margin: 30px 0 20px 0;
          color: transparent;
          -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.16);
          user-select: none;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          line-height: 0.9;
          text-transform: uppercase;
        }
        .lp-footer-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08) !important;
          margin-bottom: 24px;
        }
        .lp-footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .lp-footer-copy, .lp-footer-made {
          color: #6b7280 !important;
          font-size: 13px;
        }

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
          
          /* Features Grid & Mobile Lucide Icon Glow */
          .lp-feat-grid { display: grid !important; grid-template-columns: 1fr; gap: 16px; }
          .lp-feat-card {
            background: #141517 !important;
            border: 1px solid rgba(255, 255, 255, 0.09) !important;
            border-radius: 18px !important;
            padding: 24px 20px !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
            position: relative !important;
            overflow: hidden !important;
          }
          .lp-feat-ico {
            width: 44px !important;
            height: 44px !important;
            border-radius: 12px !important;
            background: rgba(34, 197, 94, 0.12) !important;
            border: 1px solid rgba(34, 197, 94, 0.3) !important;
            color: #22c55e !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            margin-bottom: 16px !important;
            box-shadow: 0 0 16px rgba(34, 197, 94, 0.22) !important;
          }
          .lp-feat-ico svg {
            color: #22c55e !important;
            stroke-width: 2.2px !important;
            width: 22px !important;
            height: 22px !important;
          }
          .lp-feat-title {
            font-size: 17px !important;
            font-weight: 600 !important;
            color: #ffffff !important;
            margin-bottom: 8px !important;
          }
          .lp-feat-desc {
            font-size: 13.5px !important;
            color: #9ca3af !important;
            line-height: 1.55 !important;
            margin-bottom: 0 !important;
          }
          .lp-feat-ghost {
            color: rgba(255, 255, 255, 0.04) !important;
            opacity: 1 !important;
            bottom: -10px !important;
            right: -10px !important;
            transform: scale(0.85) !important;
            filter: none !important;
          }

          /* Mobile Lighter Card Backgrounds & Panels */
          .lp-pain-card,
          .lp-who-card,
          .lp-who-item,
          .lp-feat-card,
          .lp-vcard {
            background: #161a22 !important;
            border-color: rgba(255, 255, 255, 0.12) !important;
          }

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
          .lp-nav-center, .lp-nav-right, .lp-nav-links { display: none !important; }
          .lp-hamburger {
            display: flex !important;
            background: rgba(255, 255, 255, 0.06) !important;
            border: 1px solid rgba(255, 255, 255, 0.12) !important;
            border-radius: 10px !important;
            width: 40px !important;
            height: 40px !important;
            color: #ffffff !important;
            align-items: center !important;
            justify-content: center !important;
            cursor: pointer !important;
            margin-left: auto !important;
            padding: 0 !important;
          }
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

        body, .lp-template {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background-color: #121315 !important;
          background-image: radial-gradient(rgba(255, 255, 255, 0.08) 0.8px, transparent 0.8px) !important;
          background-size: 16px 16px !important;
          background-attachment: fixed !important;
          color: var(--text-main);
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          overflow-wrap: break-word;
          word-wrap: break-word;
        }

        .lp-hero::before,
        .lp-hero::after,
        .lp-hero-visual::before,
        .lp-ghost-queue,
        .lp-particles {
          display: none !important;
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
        .lp-topbar { background: #f97316 !important; color: #ffffff !important; border-bottom: 1px solid rgba(255,255,255,0.06) !important; }
        .lp-topbar a { color: #ffffff !important; text-decoration: underline; }
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
        
        /* ── MOBILE MENU DROPDOWN (FIT HORIZONTALLY, BELOW NAV) ── */
        .lp-mmenu {
          position: fixed !important;
          top: 68px !important;
          left: 0 !important;
          right: 0 !important;
          bottom: auto !important;
          width: auto !important;
          height: auto !important;
          max-width: 100% !important;
          max-height: calc(100vh - 72px) !important;
          z-index: 998 !important;
          background: rgba(18, 19, 21, 0.96) !important;
          backdrop-filter: blur(24px) !important;
          -webkit-backdrop-filter: blur(24px) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7) !important;
          padding: 16px 20px 24px !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 6px !important;
          box-sizing: border-box !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
          opacity: 0 !important;
          transform: translateY(-12px) !important;
          pointer-events: none !important;
          visibility: hidden !important;
          transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s ease !important;
        }
        .lp-mmenu.open {
          opacity: 1 !important;
          transform: translateY(0) !important;
          pointer-events: auto !important;
          visibility: visible !important;
        }
        .lp-mmenu-close-btn {
          position: absolute !important;
          top: 14px !important;
          right: 16px !important;
          background: rgba(255, 255, 255, 0.08) !important;
          border: 1px solid rgba(255, 255, 255, 0.14) !important;
          border-radius: 10px !important;
          width: 34px !important;
          height: 34px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          padding: 0 !important;
          transition: all 0.2s ease !important;
        }
        .lp-mmenu-close-btn:active {
          background: rgba(255, 255, 255, 0.18) !important;
          transform: scale(0.95) !important;
        }
        .lp-mlink {
          color: #ffffff !important;
          font-size: 16px !important;
          font-weight: 500 !important;
          font-family: 'Outfit', sans-serif !important;
          padding: 14px 16px !important;
          border-radius: 12px !important;
          text-decoration: none !important;
          display: block !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        .lp-mlink:hover, .lp-mlink:active {
          color: #22c55e !important;
          background: rgba(255, 255, 255, 0.04) !important;
          transform: translateX(4px) !important;
        }
        .lp-mfind {
          color: #22c55e !important;
          font-size: 15px !important;
          font-weight: 600 !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          padding: 14px 16px !important;
          text-decoration: none !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        .lp-mcta {
          background: #22c55e !important;
          color: #0c0c0e !important;
          font-family: 'Outfit', sans-serif !important;
          font-size: 15px !important;
          font-weight: 600 !important;
          padding: 14px 28px !important;
          border-radius: 9999px !important;
          border: none !important;
          width: 90% !important;
          max-width: 320px !important;
          margin: 12px auto 0 !important;
          cursor: pointer !important;
          box-shadow: 0 4px 20px rgba(34, 197, 94, 0.35) !important;
          transition: all 0.2s ease !important;
          text-align: center !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .lp-mcta:active {
          transform: scale(0.97) !important;
          background: #16a34a !important;
        }
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

        /* ── MOBILE ONLY FLAT DARK GREY BACKGROUND WITH DESKTOP MATCHING TEXTURE (NO GLOWS) ── */
        @media (max-width: 768px) {
          body {
            background: #14181f !important;
          }
          .lp-global-bg {
            background: 
              url("data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='1' height='1' fill='rgba(255,255,255,0.05)'/%3E%3C/svg%3E") repeat,
              #14181f !important;
          }
          .lp-global-bg::after {
            display: none !important;
          }
          /* Completely remove all glow effects on mobile */
          .lp-hero::before,
          .lp-hero::after,
          .lp-hero-visual::before {
            display: none !important;
            background: none !important;
          }
          .lp-ghost-queue {
            opacity: 1 !important;
          }
        }
      `}
        </style>

      {/* ── GLOBAL BACKGROUND ── */}
      <div className="lp-global-bg" />

      {/* ── FIXED NAV (CONTAINING TOPBAR & MAIN NAV INNER) ── */}
      <nav className={`lp-nav${scrolled ? " scrolled" : ""}`}>
        {!scrolled && (
          <div className="lp-topbar">
            <Sparkles size={14} style={{ display: "inline-block", marginRight: "6px", verticalAlign: "middle" }} /> 7-Day Elite Trial — No credit card needed.
            {!config.isRoot && <a href="#" onClick={(e) => { e.preventDefault(); router.push("/login"); }}>Start now →</a>}
            {config.isRoot && <a href="#" onClick={(e) => { e.preventDefault(); go("industries"); }}>Start now →</a>}
          </div>
        )}
        <div className="lp-nav-inner">
          <div className="lp-nav-left">
            <img src="/logo.png" alt="TokenPe" style={{ height: 36, width: "auto", cursor: "pointer" }} onClick={() => router.push("/")} />
          </div>

          <div className="lp-nav-center">
            {!config.isRoot && (
              <Link href="/" className="lp-nl" style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                <MoreHorizontal size={16} /> Explore Industries
              </Link>
            )}
            <span className="lp-nl" onClick={() => go("features")}>Features</span>
            <span className="lp-nl" onClick={() => go("how")}>How it works</span>
            <span className="lp-nl" onClick={() => go("pricing")}>Pricing</span>
            <span className="lp-nl" onClick={() => go("faq")}>FAQ</span>
          </div>

          <div className="lp-nav-right">
            {config.find && <Link href={config.find.href} className="lp-nav-find"><Search size={16} strokeWidth={2.5} /> {config.find.text}</Link>}
            {!config.isRoot && <button className="lp-nav-cta" onClick={() => router.push("/login")}>Get Started <span style={{ marginLeft: 2 }}>→</span></button>}
            {config.isRoot && <button className="lp-nav-cta" onClick={() => go("industries")}>Get Started <span style={{ marginLeft: 2 }}>→</span></button>}
          </div>

          <button className="lp-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X size={20} color="#ffffff" /> : <Menu size={20} color="#ffffff" />}
          </button>
        </div>
      </nav>
      {/* ── MOBILE MENU DROPDOWN ── */}
      <div className={`lp-mmenu${menuOpen ? " open" : ""}`}>
        <button className="lp-mmenu-close-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu">
          <X size={18} color="#ffffff" />
        </button>

        {!config.isRoot && (
          <Link href="/" className="lp-mlink" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MoreHorizontal size={18} color="#22c55e" /> Explore Industries
          </Link>
        )}
        <span className="lp-mlink" onClick={() => { go("features"); setMenuOpen(false); }}>Features</span>
        <span className="lp-mlink" onClick={() => { go("how"); setMenuOpen(false); }}>How it works</span>
        <span className="lp-mlink" onClick={() => { go("pricing"); setMenuOpen(false); }}>Pricing</span>
        <span className="lp-mlink" onClick={() => { go("faq"); setMenuOpen(false); }}>FAQ</span>
        {config.find && (
          <Link href={config.find.href} className="lp-mfind" onClick={() => setMenuOpen(false)}>
            <Search size={16} strokeWidth={2.5} /> {config.find.text}
          </Link>
        )}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <button
            className="lp-mcta"
            onClick={() => {
              if (!config.isRoot) router.push("/login");
              else go("industries");
              setMenuOpen(false);
            }}
          >
            Get Started <span style={{ marginLeft: 4 }}>→</span>
          </button>
        </div>
      </div>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-particles">
          {dots.map((d, i) => <div key={i} className="lp-particle" style={{ top: d.top, left: d.left, animationDelay: d.delay, opacity: d.opacity }} />)}
        </div>
        <div className="lp-ghost-queue">
          <div className="lp-ghost-queue-track">
            {[1, 2].map((s) => (
              <svg key={s} className="lp-ghost-queue-svg" viewBox="0 0 1000 480" fill="none" xmlns="http://www.w3.org/2000/svg">
                <pattern id={`queue-pattern-${s}`} width="220" height="480" patternUnits="userSpaceOnUse">
                  {/* Top Row Queue Silhouettes - Crisp White/Gray */}
                  <g stroke="rgba(255, 255, 255, 0.35)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    <path d="M60 210v-20a32 32 0 0 0-32-32H20a32 32 0 0 0-32 32v20" />
                    <circle cx="20" cy="115" r="22" />
                    <path d="M170 210v-20a32 32 0 0 0-32-32h-8a32 32 0 0 0-32 32v20" />
                    <circle cx="130" cy="115" r="22" />
                  </g>
                  {/* Bottom Row Queue Silhouettes - Glowing Green Tint */}
                  <g stroke="rgba(34, 197, 94, 0.40)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                    <path d="M115 440v-20a32 32 0 0 0-32-32H75a32 32 0 0 0-32 32v20" />
                    <circle cx="75" cy="345" r="22" />
                    <path d="M225 440v-20a32 32 0 0 0-32-32h-8a32 32 0 0 0-32 32v20" />
                    <circle cx="185" cy="345" r="22" />
                  </g>
                </pattern>
                <rect width="100%" height="100%" fill={`url(#queue-pattern-${s})`} />
              </svg>
            ))}
          </div>
        </div>
        <div className="lp-hero-inner">
          <div className="lp-hero-content">
            <div className="lp-hero-badge">
              <span className="lp-badge-country">🇮🇳</span>
              {config.badge || "Built for India's businesses"}
            </div>
            {config.hero?.h1 ? (
              <h1 className="lp-hero-h1 font-heading" dangerouslySetInnerHTML={{ __html: config.hero.h1 }} />
            ) : (
              <h1 className="lp-hero-h1 font-heading">
                <span className="lp-h1-dim">Stop making</span><br />
                <span className="lp-h1-white">people wait.</span><br />
                <span className="lp-h1-green">Manage queues</span><br />
                <span className="lp-h1-white">on WhatsApp.</span>
              </h1>
            )}
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
              <span className="lp-hero-trust-item">
                <Smartphone size={18} color="#22c55e" strokeWidth={2} />
                <span>No app for patients</span>
              </span>
              <span className="lp-hero-trust-item">
                <QrCode size={18} color="#22c55e" strokeWidth={2} />
                <span>Works on any phone</span>
              </span>
              <span className="lp-hero-trust-item">
                <Zap size={18} color="#22c55e" strokeWidth={2} />
                <span>2-min setup</span>
              </span>
            </div>
          </div>

          {/* ── CURSOR INTERACTIVE FIELD ── */}
          <HeroCursorField />

          <div className="lp-hero-visual">
            <WhatsAppDemo flow={config.waFlow} />
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
          <div className="lp-pain-eyebrow">
            <span className="lp-pain-eyebrow-dot" />
            SOUND FAMILIAR?
          </div>
          <h2 className="lp-pain-h2 font-heading">
            <span className="lp-h2-white">These problems are costing you</span><br />
            <span className="lp-h2-dim">every single day.</span>
          </h2>
          <p className="lp-pain-sub">{config.pain?.sub || "TokenPe fixes all three. In 2 minutes."}</p>
          <MobileCarousel gridClass="lp-pain-grid">
            {[
              {
                num: "01",
                tag: "CUSTOMER PROBLEM",
                icon: <Users size={22} color="#f87171" />,
                title: "Overcrowded Areas",
                desc: "Customers sit for hours in packed waiting areas. They leave frustrated — or worse, they leave and never come back."
              },
              {
                num: "02",
                tag: "STAFF PROBLEM",
                icon: <PhoneOff size={22} color="#f87171" />,
                title: "Missed Turns",
                desc: "Staff calls out names. Half the people step out. Chaos ensues. Turns are missed, slots are wasted."
              },
              {
                num: "03",
                tag: "BUSINESS PROBLEM",
                icon: <TrendingDown size={22} color="#f87171" />,
                title: "Inefficient Queues",
                desc: "Paper tokens can't scale. No data, no history, no visibility. You don't know how busy you are until it's too late."
              }
            ].map((c) => (
              <div key={c.title} className="lp-pain-card">
                <div className="lp-pain-num">{c.num}</div>
                <div className="lp-pain-card-body">
                  <div className="lp-pain-tag">{c.tag}</div>
                  <div className="lp-pain-iconbox">{c.icon}</div>
                  <div className="lp-pain-title font-heading">{c.title}</div>
                  <div className="lp-pain-desc">{c.desc}</div>
                </div>
              </div>
            ))}
          </MobileCarousel>
        </div>
      </section>

      {/* ── WHO IS THIS FOR (2-COLUMN SPLIT SHOWCASE) ── */}
      <section className="lp-sec lp-who-sec">
        <div className="lp-sec-inner">
          <div className="lp-pain-eyebrow">
            <span className="lp-pain-eyebrow-dot" />
            WHO IS THIS FOR?
          </div>
          <h2 className="lp-pain-h2 font-heading">
            <span className="lp-h2-white">{config.who?.h2 || "Built for every kind of business."}</span>
          </h2>
          <p className="lp-pain-sub">{config.who?.sub || "If you have a waiting room or a queue, TokenPe is for you."}</p>

          <div className="lp-who-split">
            {/* Left Column: 4 Interactive List Items */}
            <div className="lp-who-list">
              {[
                {
                  tag: "CLINICS",
                  title: "Clinics & Hospitals",
                  desc: "Manage high patient volumes effortlessly. Reduce no-shows, eliminate crowding.",
                  ico: <Stethoscope size={20} />
                },
                {
                  tag: "RESTAURANTS",
                  title: "Restaurants",
                  desc: "End the host-stand chaos. Diners join the waitlist and get notified when the table is ready.",
                  ico: <UtensilsCrossed size={20} />
                },
                {
                  tag: "SALONS",
                  title: "Salons & Spas",
                  desc: "Manage walk-ins and appointments seamlessly with automated WhatsApp alerts.",
                  ico: <Scissors size={20} />
                },
                {
                  tag: "SCHOOLS",
                  title: "Schools & Events",
                  desc: "Organize admissions, interviews, or event entries without the long physical lines.",
                  ico: <GraduationCap size={20} />
                }
              ].map((item, idx) => (
                <div
                  key={item.title}
                  className={`lp-who-item ${activeWho === idx ? 'active' : ''}`}
                  onClick={() => setActiveWho(idx)}
                  onMouseEnter={() => setActiveWho(idx)}
                >
                  <div className="lp-who-iconbox">{item.ico}</div>
                  <div>
                    <div className="lp-who-item-title font-heading">{item.title}</div>
                    <div className="lp-who-item-desc">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Featured Image Showcase with Smooth Cross-Fade */}
            <div className="lp-who-showcase">
              {[
                {
                  tag: "CLINICS",
                  title: "Clinics & Hospitals",
                  img: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=80"
                },
                {
                  tag: "RESTAURANTS",
                  title: "Restaurants",
                  img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80"
                },
                {
                  tag: "SALONS",
                  title: "Salons & Spas",
                  img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80"
                },
                {
                  tag: "SCHOOLS",
                  title: "Schools & Events",
                  img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80"
                }
              ].map((item, idx) => {
                const isActive = activeWho === idx;
                return (
                  <div
                    key={item.title}
                    className="lp-who-showcase-slide"
                    style={{
                      opacity: isActive ? 1 : 0,
                      visibility: isActive ? "visible" : "hidden",
                      transition: "opacity 0.6s ease-in-out, visibility 0.6s ease-in-out",
                      zIndex: isActive ? 2 : 1
                    }}
                  >
                    <img
                      src={item.img}
                      alt={item.title}
                      className="lp-who-showcase-img"
                      style={{
                        transform: isActive ? "scale(1)" : "scale(1.05)",
                        transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease"
                      }}
                    />
                    <div className="lp-who-showcase-overlay" />
                    <div
                      className="lp-who-showcase-content"
                      style={{
                        opacity: isActive ? 1 : 0,
                        transform: isActive ? "translateY(0)" : "translateY(12px)",
                        transition: "opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s"
                      }}
                    >
                      <div className="lp-who-showcase-tag">{item.tag}</div>
                      <h3 className="lp-who-showcase-title font-heading">{item.title}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON ── */}
      <section className="lp-sec lp-cmp-sec">
        <div className="lp-sec-inner" style={{ textAlign: 'center' }}>
          <div className="lp-pain-eyebrow centered" style={{ marginBottom: '14px' }}>
            <span className="lp-pain-eyebrow-dot" />
            COMPARISON
          </div>
          <h2 className="lp-pain-h2 font-heading" style={{ textAlign: 'center', margin: '0 auto 12px' }}>
            <span className="lp-h2-white">The old way </span>
            <span className="lp-h2-dim" style={{ color: '#64748b', fontWeight: 400 }}>vs. </span>
            <span className="lp-h2-white">the TokenPe way.</span>
          </h2>
          <p className="lp-pain-sub" style={{ textAlign: 'center', margin: '0 auto 36px' }}>See the difference at a glance.</p>
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
          <div className="lp-pain-eyebrow" style={{ marginBottom: '14px' }}>
            <span className="lp-pain-eyebrow-dot" />
            FEATURES
          </div>
          <h2 className="lp-pain-h2 font-heading" style={{ marginBottom: '12px' }}>
            <span className="lp-h2-white">{config.featuresData?.h2 || "Everything your business needs."}</span>
          </h2>
          <p className="lp-pain-sub" style={{ marginBottom: '8px' }}>
            One tool that replaces paper tokens, crowded waiting rooms, and manual calling — forever.
          </p>
          <p className="lp-pain-sub" style={{ marginBottom: '40px' }}>
            We operate as a full-service agency, supplying and managing all of this end-to-end for your business.
          </p>
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
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src="/logo.png" alt="TokenPe" style={{ height: 36, width: "auto" }} />
              </div>
              <p className="lp-footer-tagline">WhatsApp-based digital queue management for India's businesses. No apps. No fuss.</p>
              <button className="lp-footer-explore-btn" onClick={() => go("industries")}>
                Explore Industries <span style={{ marginLeft: 2 }}>→</span>
              </button>
            </div>

            <div className="lp-footer-links">
              <div className="lp-footer-links-title">PRODUCT</div>
              <span className="lp-flink" style={{ cursor: "pointer" }} onClick={() => go("features")}>Features</span>
              <span className="lp-flink" style={{ cursor: "pointer" }} onClick={() => go("how")}>How it works</span>
              <span className="lp-flink" style={{ cursor: "pointer" }} onClick={() => go("pricing")}>Pricing</span>
            </div>

            <div className="lp-footer-links">
              <div className="lp-footer-links-title">SUPPORT & LEGAL</div>
              <a href="mailto:tokenpe.online@gmail.com" className="lp-flink" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Mail className="w-4 h-4" /> Contact Support
              </a>
              <Link href="/privacy" className="lp-flink">Privacy Policy</Link>
              <Link href="/terms" className="lp-flink">Terms of Service</Link>
            </div>
          </div>

          <div className="lp-footer-divider" />

          <div className="lp-footer-bottom">
            <p className="lp-footer-copy">© {new Date().getFullYear()} TokenPe. All rights reserved.</p>
            <p className="lp-footer-made">Made with <span style={{ color: "#ef4444", margin: "0 2px" }}>♥</span> in India</p>
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
