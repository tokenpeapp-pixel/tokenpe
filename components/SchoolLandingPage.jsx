"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Search, CheckCircle2, Bell, GraduationCap, Sparkles, Menu, X, Star,
  ArrowRight, TrendingUp, Phone, MessageSquare, Mic, Zap, Clock,
  ThumbsUp, BarChart3, Users, Package, QrCode, Shield, CheckCheck,
  School, BookOpen, Calendar, ShieldCheck, FileText, UserCheck, Award,
  PartyPopper, Heart, Volume2, Layers
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   TYPEWRITER HOOK
═══════════════════════════════════════════════════════════════ */
function useTypewriter(words, speed = 85, deleteSpeed = 48, pause = 2200) {
  const [text, setText] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    let t;
    if (!deleting && text === word) {
      t = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && text === "") {
      setDeleting(false);
      setWordIdx((i) => (i + 1) % words.length);
    } else {
      t = setTimeout(
        () =>
          setText(
            deleting
              ? word.slice(0, text.length - 1)
              : word.slice(0, text.length + 1)
          ),
        deleting ? deleteSpeed : speed
      );
    }
    return () => clearTimeout(t);
  }, [text, deleting, wordIdx, words, speed, deleteSpeed, pause]);

  return text;
}

/* ═══════════════════════════════════════════════════════════════
   COUNT-UP
═══════════════════════════════════════════════════════════════ */
function CountUp({ target, suffix = "", decimals = 0, duration = 1.6 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(parseFloat((eased * target).toFixed(decimals)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration, decimals]);

  return (
    <span ref={ref}>
      {decimals > 0 ? val.toFixed(decimals) : val.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCROLL-REVEAL WRAPPER
═══════════════════════════════════════════════════════════════ */
const revealVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0 },
};
function Reveal({ children, delay = 0, className = "", as: Comp = motion.div, ...rest }) {
  return (
    <Comp
      className={className}
      variants={revealVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SVG GRADIENT DEFS (Academic Blue Palette)
═══════════════════════════════════════════════════════════════ */
function GradientDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <linearGradient id="blueLine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
        <linearGradient id="blueFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EFF6FF" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATED FLOATING SCHOOL SVG OBJECTS
═══════════════════════════════════════════════════════════════ */
function SvgGraduationCap() {
  return (
    <svg width="72" height="64" viewBox="0 0 72 64" fill="none">
      <polygon points="36,8 68,22 36,36 4,22" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="2.2" strokeLinejoin="round" />
      <rect x="22" y="32" width="28" height="18" rx="4" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="2" />
      <path d="M60 25 L60 48" stroke="#1D4ED8" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="60" cy="52" r="4" fill="#2563EB" />
    </svg>
  );
}

function SvgSchoolBus() {
  return (
    <svg width="84" height="48" viewBox="0 0 84 48" fill="none">
      <rect x="2" y="8" width="80" height="30" rx="8" fill="#FEF08A" stroke="#1D4ED8" strokeWidth="2.2" />
      <rect x="10" y="14" width="16" height="12" rx="3" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="1.8" />
      <rect x="32" y="14" width="16" height="12" rx="3" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="1.8" />
      <rect x="54" y="14" width="16" height="12" rx="3" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="1.8" />
      <circle cx="20" cy="38" r="6" fill="#1E293B" stroke="#1D4ED8" strokeWidth="1.8" />
      <circle cx="64" cy="38" r="6" fill="#1E293B" stroke="#1D4ED8" strokeWidth="1.8" />
    </svg>
  );
}

function SvgBook() {
  return (
    <svg width="74" height="56" viewBox="0 0 74 56" fill="none">
      <path d="M6 10 Q37 2 37 46 Q6 38 6 10 Z" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M68 10 Q37 2 37 46 Q68 38 68 10 Z" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="2.2" strokeLinejoin="round" />
      <line x1="37" y1="2" x2="37" y2="46" stroke="#1D4ED8" strokeWidth="2.4" />
    </svg>
  );
}

function SvgPencil() {
  return (
    <svg width="32" height="68" viewBox="0 0 32 68" fill="none">
      <polygon points="16,2 4,18 28,18" fill="#FDE047" stroke="#1D4ED8" strokeWidth="2" strokeLinejoin="round" />
      <rect x="4" y="18" width="24" height="38" rx="2" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="2" />
      <rect x="4" y="56" width="24" height="10" rx="3" fill="#F43F5E" stroke="#1D4ED8" strokeWidth="2" />
    </svg>
  );
}

function SvgBell() {
  return (
    <svg width="60" height="64" viewBox="0 0 60 64" fill="none">
      <path d="M30 6 C18 6 12 18 12 34 L6 46 L54 46 L48 34 C48 18 42 6 30 6 Z" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="30" cy="54" r="6" fill="#2563EB" stroke="#1D4ED8" strokeWidth="1.8" />
    </svg>
  );
}

function SvgDiploma() {
  return (
    <svg width="78" height="42" viewBox="0 0 78 42" fill="none">
      <rect x="4" y="10" width="70" height="22" rx="11" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="2" />
      <rect x="35" y="4" width="8" height="34" fill="#F43F5E" rx="2" />
      <circle cx="39" cy="36" r="5" fill="#F59E0B" />
    </svg>
  );
}

function SvgBackpack() {
  return (
    <svg width="58" height="68" viewBox="0 0 58 68" fill="none">
      <rect x="8" y="16" width="42" height="48" rx="14" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="2.2" />
      <rect x="14" y="32" width="30" height="22" rx="6" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="1.8" />
      <path d="M22 16 C22 6 36 6 36 16" fill="none" stroke="#1D4ED8" strokeWidth="2.2" />
    </svg>
  );
}

function SvgChalkboard() {
  return (
    <svg width="78" height="52" viewBox="0 0 78 52" fill="none">
      <rect x="4" y="4" width="70" height="44" rx="6" fill="#1E293B" stroke="#1D4ED8" strokeWidth="2.2" />
      <line x1="14" y1="18" x2="42" y2="18" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="28" x2="64" y2="28" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="38" x2="32" y2="38" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SvgCalculator() {
  return (
    <svg width="48" height="66" viewBox="0 0 48 66" fill="none">
      <rect x="4" y="4" width="40" height="58" rx="8" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="2.2" />
      <rect x="10" y="10" width="28" height="14" rx="4" fill="#DBEAFE" stroke="#1D4ED8" strokeWidth="1.6" />
      {[12, 22, 32].map((x) => (
        [30, 42, 54].map((y) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" rx="2" fill="#2563EB" opacity="0.7" />
        ))
      ))}
    </svg>
  );
}

const FLOAT_OBJECTS = [
  { Comp: SvgGraduationCap, pos: { top: "7%", left: "2.5%" }, anim: { y: [-14, 12, -14], rotate: [-18, 10, -18] }, dur: 5.4, delay: 0 },
  { Comp: SvgSchoolBus, pos: { top: "13%", right: "3%" }, anim: { y: [8, -12, 8], rotate: [4, -7, 4] }, dur: 4.9, delay: 0.5 },
  { Comp: SvgBook, pos: { top: "52%", left: "1%" }, anim: { y: [-9, 13, -9], rotate: [0, 7, 0] }, dur: 6.2, delay: 1.0 },
  { Comp: SvgPencil, pos: { top: "70%", right: "2.5%" }, anim: { y: [11, -13, 11], rotate: [14, -9, 14] }, dur: 5.6, delay: 0.3 },
  { Comp: SvgBell, pos: { top: "33%", right: "1.5%" }, anim: { y: [-10, 9, -10], rotate: [0, 3, 0] }, dur: 7.1, delay: 0.8 },
  { Comp: SvgDiploma, pos: { top: "36%", left: "1.5%" }, anim: { y: [7, -11, 7], rotate: [-6, 6, -6] }, dur: 6.4, delay: 1.3 },
  { Comp: SvgBackpack, pos: { top: "80%", left: "3.5%" }, anim: { y: [-7, 11, -7], rotate: [8, -6, 8] }, dur: 5.1, delay: 0.6 },
  { Comp: SvgCalculator, pos: { top: "85%", right: "3.5%" }, anim: { y: [9, -9, 9], rotate: [-12, 10, -12] }, dur: 4.7, delay: 0.2 },
  { Comp: SvgChalkboard, pos: { top: "10%", left: "45%" }, anim: { y: [-15, 10, -15], rotate: [-5, 5, -5] }, dur: 6.5, delay: 0.4 },
];

function FloatingObjects() {
  return (
    <div className="hero-floating" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {FLOAT_OBJECTS.map(({ Comp, pos, anim, dur, delay }, i) => (
        <motion.div
          key={i}
          style={{ position: "absolute", opacity: 0.35, ...pos }}
          animate={anim}
          transition={{ duration: dur, repeat: Infinity, ease: "easeInOut", delay }}
        >
          <Comp />
        </motion.div>
      ))}
    </div>
  );
}



/* ═══════════════════════════════════════════════════════════════
   HERO DEVICE — SCHOOL MOCK PHONE
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   MOBILE AUTO CAROUSEL WITH PROGRESS DOTS
═══════════════════════════════════════════════════════════════ */
function MobileAutoCarousel({ children, total, activeDotColor = "#1D4ED8" }) {
  const containerRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const isInteracting = useRef(false);

  const getScrollEl = useCallback(() => {
    if (!containerRef.current) return null;
    return containerRef.current.querySelector('.power-grid, .feat-grid, .test-grid') || containerRef.current;
  }, []);

  const handleScroll = useCallback(() => {
    const el = getScrollEl();
    if (!el) return;
    const scrollPos = el.scrollLeft;
    const firstCard = el.querySelector('.power-card, .feat-card, .test-card') || el.firstElementChild;
    const cardWidth = firstCard ? firstCard.offsetWidth + 16 : el.offsetWidth;
    const idx = Math.round(scrollPos / cardWidth);
    setActiveIdx(Math.min(Math.max(0, idx), total - 1));
  }, [getScrollEl, total]);

  useEffect(() => {
    const checkAndAutoSlide = () => {
      if (typeof window === 'undefined') return false;
      return window.innerWidth <= 768;
    };

    if (!checkAndAutoSlide()) return;

    const interval = setInterval(() => {
      if (isInteracting.current) return;
      const el = getScrollEl();
      if (!el) return;

      setActiveIdx((prevIdx) => {
        const nextIdx = (prevIdx + 1) % total;
        const firstCard = el.querySelector('.power-card, .feat-card, .test-card') || el.firstElementChild;
        const cardWidth = firstCard ? firstCard.offsetWidth + 16 : el.offsetWidth;
        el.scrollTo({ left: nextIdx * cardWidth, behavior: "smooth" });
        return nextIdx;
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [total, getScrollEl]);

  const scrollToIdx = (idx) => {
    const el = getScrollEl();
    if (!el) return;
    const firstCard = el.querySelector('.power-card, .feat-card, .test-card') || el.firstElementChild;
    const cardWidth = firstCard ? firstCard.offsetWidth + 16 : el.offsetWidth;
    el.scrollTo({ left: idx * cardWidth, behavior: "smooth" });
    setActiveIdx(idx);
  };

  return (
    <div>
      <div 
        ref={containerRef} 
        onScroll={handleScroll} 
        onTouchStart={() => { isInteracting.current = true; }}
        onTouchEnd={() => { setTimeout(() => { isInteracting.current = false; }, 2000); }}
        className="mobile-carousel-grid"
      >
        {children}
      </div>
      <div className="carousel-dots-wrap">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIdx(i)}
            className={`carousel-dot ${activeIdx === i ? "active" : ""}`}
            style={{
              backgroundColor: activeIdx === i ? activeDotColor : "rgba(148, 163, 184, 0.4)",
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ULTRA-MODERN FLOATING FLOW PATH VISUALIZER (REPLACES CARDS)
═══════════════════════════════════════════════════════════════ */
function SchoolHeroFlow() {
  return (
    <motion.div
      className="hd-wrap"
      initial={{ opacity: 0, scale: 0.94, y: 25 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "relative", width: "100%", maxWidth: 500, height: 480,
        margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center"
      }}
    >
      {/* Background Radial Glow */}
      <div style={{
        position: "absolute", width: 380, height: 380, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(29,78,216,0.18) 0%, rgba(96,165,250,0.08) 50%, transparent 75%)",
        filter: "blur(20px)", pointerEvents: "none"
      }} />

      {/* Curved Animated SVG Flow Path */}
      <svg
        width="100%" height="100%" viewBox="0 0 450 420" fill="none"
        style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}
      >
        <defs>
          <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#60A5FA" stopOpacity="1" />
            <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Curved Flow S-Line */}
        <motion.path
          d="M 80,50 C 350,70 360,200 120,240 C -40,270 120,380 370,370"
          stroke="url(#flowGrad)"
          strokeWidth="3"
          strokeDasharray="8 8"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.85 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
        />

        {/* Pulsing Dots along the Path */}
        <motion.circle
          cx="210" cy="95" r="5" fill="#60A5FA"
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="170" cy="235" r="5" fill="#60A5FA"
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.circle
          cx="280" cy="365" r="5" fill="#60A5FA"
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </svg>

      {/* Floating Node 1: Token Badge (Top Left) */}
      <motion.div
        whileHover={{ scale: 1.08, y: -6 }}
        animate={{ y: [0, -10, 0] }}
        transition={{
          y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 0.25 }
        }}
        style={{
          position: "absolute", top: "8%", left: "4%", zIndex: 10, cursor: "pointer",
          background: "linear-gradient(135deg, #0F172A, #1E3A8A)",
          border: "1.5px solid #60A5FA", borderRadius: 100,
          padding: "10px 22px", color: "#fff", display: "inline-flex", alignItems: "center", gap: 10,
          boxShadow: "0 10px 30px rgba(29, 78, 216, 0.35), 0 0 20px rgba(96, 165, 250, 0.3)"
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#34D399", display: "inline-block", boxShadow: "0 0 10px #34D399" }} />
        <QrCode size={16} color="#60A5FA" />
        <span style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: "0.02em" }}>Token #GP-104</span>
      </motion.div>

      {/* Floating Node 2: Real-time Sync (Top Right) */}
      <motion.div
        whileHover={{ scale: 1.08, y: -6 }}
        animate={{ y: [0, 12, 0] }}
        transition={{
          y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
          scale: { duration: 0.25 }
        }}
        style={{
          position: "absolute", top: "28%", right: "2%", zIndex: 10, cursor: "pointer",
          background: "linear-gradient(135deg, #0F172A, #1E3A8A)",
          border: "1.5px solid #60A5FA", borderRadius: 100,
          padding: "10px 22px", color: "#fff", display: "inline-flex", alignItems: "center", gap: 10,
          boxShadow: "0 10px 30px rgba(29, 78, 216, 0.35), 0 0 20px rgba(96, 165, 250, 0.3)"
        }}
      >
        <Zap size={16} color="#34D399" />
        <span style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: "0.02em" }}>Real-time Sync</span>
      </motion.div>

      {/* Floating Node 3: 24/7 Voice AI Call (Center Left) */}
      <motion.div
        whileHover={{ scale: 1.08, y: -6 }}
        animate={{ y: [0, -12, 0] }}
        transition={{
          y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
          scale: { duration: 0.25 }
        }}
        style={{
          position: "absolute", top: "54%", left: "0%", zIndex: 10, cursor: "pointer",
          background: "linear-gradient(135deg, #0F172A, #1E3A8A)",
          border: "1.5px solid #60A5FA", borderRadius: 100,
          padding: "10px 22px", color: "#fff", display: "inline-flex", alignItems: "center", gap: 10,
          boxShadow: "0 10px 30px rgba(29, 78, 216, 0.35), 0 0 20px rgba(96, 165, 250, 0.3)"
        }}
      >
        <Phone size={16} color="#60A5FA" />
        <span style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: "0.02em" }}>24/7 Voice AI Call</span>
      </motion.div>

      {/* Floating Node 4: WhatsApp Alert (Bottom Right) */}
      <motion.div
        whileHover={{ scale: 1.08, y: -6 }}
        animate={{ y: [0, 10, 0] }}
        transition={{
          y: { duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 1.8 },
          scale: { duration: 0.25 }
        }}
        style={{
          position: "absolute", bottom: "10%", right: "8%", zIndex: 10, cursor: "pointer",
          background: "linear-gradient(135deg, #0F172A, #1E3A8A)",
          border: "1.5px solid #34D399", borderRadius: 100,
          padding: "10px 22px", color: "#fff", display: "inline-flex", alignItems: "center", gap: 10,
          boxShadow: "0 10px 30px rgba(52, 211, 153, 0.35), 0 0 20px rgba(52, 211, 153, 0.3)"
        }}
      >
        <MessageSquare size={16} color="#34D399" />
        <span style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: "0.02em" }}>WhatsApp Alert</span>
      </motion.div>
    </motion.div>
  );
}


/* ═══════════════════════════════════════════════════════════════
   VOICE AI — WAVEFORM
═══════════════════════════════════════════════════════════════ */
const WAVE_BARS = [4, 7, 11, 16, 12, 8, 14, 18, 10, 6, 13, 17, 9, 7, 15];
function Waveform() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, height: 48 }}>
      {WAVE_BARS.map((h, i) => (
        <motion.div
          key={i}
          style={{ width: 5, borderRadius: 3, background: "linear-gradient(180deg,#1D4ED8,#60A5FA)", flexShrink: 0 }}
          animate={{ height: [h * 0.6, h * 2.8, h * 0.6] }}
          transition={{ duration: 0.7 + i * 0.05, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WHATSAPP CHATBOT — SCHOOL CHAT UI
═══════════════════════════════════════════════════════════════ */
const CHAT = [
  { from: "parent", text: "Good morning! Requesting a gate pass for Rahul V (Grade 8-B) for 2 PM dentist appointment.", time: "10:14 AM" },
  { from: "bot", text: "Hello Mrs. Sharma! Request received for Rahul V. Reply 'YES' to issue digital gate pass.", time: "10:14 AM" },
  { from: "parent", text: "YES", time: "10:15 AM" },
  { from: "bot", text: "Gate Pass Issued! Token: GP-104. Valid for 2:00 PM today. Security notified!", time: "10:15 AM" },
];
function WhatsAppChat() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 10px", background: "#efeae2", borderRadius: 16, backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: "cover" }}>
      {CHAT.map((msg, i) => (
        <motion.div
          key={i}
          style={{ display: "flex", justifyContent: msg.from === "parent" ? "flex-end" : "flex-start" }}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: i * 0.8 + 0.3, duration: 0.4, type: "spring", stiffness: 200 }}
        >
          <div style={{
            background: msg.from === "bot" ? "#ffffff" : "#d9fdd3",
            color: "#111b21",
            padding: "8px 12px",
            borderRadius: msg.from === "bot" ? "0 10px 10px 10px" : "10px 0 10px 10px",
            fontSize: 13,
            fontWeight: 400,
            maxWidth: "85%",
            lineHeight: 1.4,
            boxShadow: "0 1px 1px rgba(0,0,0,0.1)",
            position: "relative",
            display: "flex",
            flexDirection: "column"
          }}>
            <span>{msg.text}</span>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, marginTop: 4 }}>
              <span style={{ fontSize: 10, color: "#667781" }}>{msg.time}</span>
              {msg.from === "parent" && <CheckCheck size={14} color="#53bdeb" />}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GOOGLE REVIEWS — ANIMATED STARS
═══════════════════════════════════════════════════════════════ */
function AnimatedStars({ n = 5 }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: n }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, rotate: -30, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ delay: i * 0.15, duration: 0.4, type: "spring", stiffness: 300 }}
        >
          <Star size={24} fill="#1D4ED8" stroke="#1D4ED8" strokeWidth={1} />
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CITY MARQUEE
═══════════════════════════════════════════════════════════════ */
const CITIES = ["Mumbai", "Delhi NCR", "Bengaluru", "Hyderabad", "Pune", "Chennai", "Kolkata", "Jaipur", "Ahmedabad", "Surat", "Indore", "Lucknow", "Nagpur", "Bhopal"];
function CityMarquee() {
  const items = [...CITIES, ...CITIES];
  return (
    <div style={{ overflow: "hidden" }}>
      <motion.div
        style={{ display: "inline-flex", gap: 50, whiteSpace: "nowrap" }}
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        {items.map((c, i) => (
          <span key={i} style={{ fontSize: 14, fontWeight: 700, color: "#1E40AF", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={12} color="#1D4ED8" /> {c}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCHOOL LOGO MARQUEE
═══════════════════════════════════════════════════════════════ */
const SCHOOL_LOGOS = ["DPS International", "Ryan Group", "DAV Public", "St. Xavier's", "Podar World", "Oakridge Intl", "Indus World", "Heritage Academy", "Modern School", "KRM Mangalam"];
function LogoMarquee() {
  const items = [...SCHOOL_LOGOS, ...SCHOOL_LOGOS];
  return (
    <div style={{ overflow: "hidden" }}>
      <motion.div
        style={{ display: "inline-flex", gap: 20, whiteSpace: "nowrap" }}
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
      >
        {items.map((s, i) => (
          <div key={i} style={{
            background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14,
            padding: "14px 24px", fontSize: 14, fontWeight: 800, color: "#1E40AF",
            letterSpacing: "0.03em", flexShrink: 0, boxShadow: "0 4px 15px rgba(29,78,216,0.08)",
            transition: "transform 0.3s"
          }}
            className="marquee-logo-card"
          >
            {s}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN SCHOOL PAGE
═══════════════════════════════════════════════════════════════ */
export default function SchoolLandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });
  const ctaRef = useRef(null);

  const heroWord = useTypewriter(["digital gate pass", "WhatsApp PTM alerts", "voice AI fee calls", "parent notifications"]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleMouseMove = useCallback((e) => {
    if (!ctaRef.current) return;
    const r = ctaRef.current.getBoundingClientRect();
    setSpotlight({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(searchQuery.trim() ? `/find-school?q=${encodeURIComponent(searchQuery)}` : "/find-school");
  };

  const go = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
  };

  const FEATURES = [
    { icon: QrCode, tag: "SCAN & JOIN", title: "WhatsApp Queue Join", desc: "Parents/guardians join the admission queue by scanning a QR code, no app download, no separate account required." },
    { icon: Bell, tag: "POSITION ALERTS", title: "Real-Time Position Updates", desc: "Parents get notified as their position in line moves up (\"5 ahead of you,\" \"you're next\"), so they can wait in a car, canteen, or outside instead of standing in a packed corridor for hours." },
    { icon: MessageSquare, tag: "BROADCAST", title: "Broadcast Messages via WhatsApp", desc: "Send announcements to everyone currently in queue at once — counter delays, schedule changes, or last-minute instructions — without needing to call or track down each family individually." },
    { icon: Layers, tag: "MULTI-COUNTER", title: "Multi-Counter / Department Routing", desc: "Larger schools often have separate counters for enrollment, fee submission, and document verification. TokenPe routes each family to the correct counter/queue based on what they're there for." },
    { icon: BarChart3, tag: "ANALYTICS", title: "Analytics Dashboard", desc: "Track queue volume, peak admission hours, average wait times, and counter-wise load over the admission season — giving school administration visibility they never had with a paper token system." },
    { icon: Volume2, tag: "VOICE ALERTS", title: "Voice Announcements in Regional Languages", desc: "Token/name announcements made automatically in the local language, useful for schools in diverse linguistic areas where families may not read English signage well." },
  ];

  const STEPS = [
    { n: "01", title: "Print your QR codes", desc: "Place QR codes at the main gate, admin office, and PTM desks in a few clicks." },
    { n: "02", title: "Parents scan & request", desc: "Parents request gate passes or join PTM queues instantly from their own phone." },
    { n: "03", title: "Approve & notify", desc: "Staff tap 'Approve' or 'Call Next'; parents get instant WhatsApp alerts." },
  ];

  const TESTIMONIALS = [
    { q: "Our PTM Saturdays used to be complete chaos at the main gate. Now parents wait comfortably in the cafeteria until their turn.", n: "Dr. Sunita Rao", r: "Principal, DPS Mumbai" },
    { q: "Digital gate passes & WhatsApp alerts made our campus security 100x tighter and more professional.", n: "Rajesh Sharma", r: "Admin Head, Ryan Group, Bengaluru" },
    { q: "Parents love receiving WhatsApp updates instead of standing in long lines outside classrooms.", n: "Anita Verma", r: "Vice Principal, St. Xavier's, Delhi" },
  ];

  const BEFORE = [
    "Parents crowd the school main gate during PTM & dismissal",
    "Security manually writes paper gate passes — slow & error-prone",
    "No digital log of student early exits or visitor entries",
    "Parents wait in long lines outside teacher cabins",
    "High office call volume asking about fees & PTM schedules",
    "No structured system to capture parent feedback",
  ];
  const AFTER = [
    "Parents wait anywhere — cafeteria, parking, or home",
    "WhatsApp digital gate pass with instant security approval",
    "100% digital audit trail of all student exits & visitor passes",
    "WhatsApp alert when teacher is free → 40% shorter waits",
    "AI voice agent & WhatsApp bot answer parent queries 24/7",
    "Automated feedback & Google review requests after PTM",
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@500;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        .pg-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #DCEBFE;
          color: #0F172A;
          overflow-x: clip;
          -webkit-font-smoothing: antialiased;
        }

        /* ── AMBIENT BACKGROUND ── */
        .pg-bg {
          position: fixed; inset: 0; z-index: -1; pointer-events: none;
          background: #DCEBFE;
        }

        /* ── TOPBAR ── */
        .pg-topbar {
          background: linear-gradient(90deg, #1E40AF, #1D4ED8, #1E40AF);
          background-size: 200% 100%;
          animation: topbar-shine 5s linear infinite;
          color: #fff;
          text-align: center;
          padding: 12px 24px;
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        @keyframes topbar-shine {
          0%   { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
        .pg-topbar a { color: #fff; text-decoration: underline; text-underline-offset: 3px; font-weight: 700; }
        .pg-topbar a:hover { color: #DBEAFE; }

        /* ── NAV ── */
        .pg-nav {
          position: sticky; top: 0; z-index: 300;
          background: rgba(220,235,254,0.92);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(29,78,216,0.18);
          transition: box-shadow 0.3s, background 0.3s;
        }
        .pg-nav.scrolled { box-shadow: 0 6px 40px rgba(29,78,216,0.18); background: rgba(220,235,254,0.97); }
        .pg-nav-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 32px;
        }
        .pg-nav-links { display: flex; align-items: center; gap: 36px; }
        .pg-nl {
          color: #475569; font-weight: 600; font-size: 14.5px; cursor: pointer;
          transition: color 0.25s, transform 0.2s; position: relative; background: none; border: none;
          font-family: inherit; padding: 4px 0;
        }
        .pg-nl::after {
          content: ''; position: absolute; left: 0; bottom: 0;
          width: 0; height: 2px; background: #1D4ED8;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 2px;
        }
        .pg-nl:hover { color: #1D4ED8; transform: translateY(-1px); }
        .pg-nl:hover::after { width: 100%; }

        /* ── BUTTONS ── */
        .btn {
          display: inline-flex; align-items: center; gap: 10px;
          border: none; cursor: pointer; font-family: inherit; font-weight: 700;
          border-radius: 14px; transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          text-decoration: none; position: relative; overflow: hidden;
        }
        .btn-primary {
          background: linear-gradient(135deg, #1D4ED8, #1E40AF);
          color: #fff; padding: 14px 26px; font-size: 14.5px;
          box-shadow: 0 10px 25px rgba(29,78,216,0.3);
        }
        .btn-primary::before {
          content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: skewX(-20deg); transition: 0.5s;
        }
        .btn-primary:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 16px 35px rgba(29,78,216,0.45); }
        .btn-primary:hover::before { left: 150%; }
        .btn-primary:active { transform: scale(0.97); }

        .btn-ghost {
          background: #fff; color: #0F172A; padding: 14px 26px; font-size: 14.5px;
          border: 1.5px solid #DBEAFE; box-shadow: 0 4px 10px rgba(0,0,0,0.03);
        }
        .btn-ghost:hover { border-color: #1D4ED8; color: #1D4ED8; transform: translateY(-3px); box-shadow: 0 8px 20px rgba(29,78,216,0.15); }
        .btn-lg { padding: 16px 36px !important; font-size: 15.5px !important; border-radius: 16px !important; }

        .pg-burger { display: none; background: none; border: none; cursor: pointer; color: #0F172A; transition: transform 0.2s; padding: 8px; }
        .pg-burger:hover { transform: scale(1.1); color: #1D4ED8; }

        /* ── MOBILE MENU ── */
        .pg-mobile {
          position: fixed; inset: 0; z-index: 500; background: #F8FAFC;
          display: flex; flex-direction: column; padding: 24px 28px 48px;
        }
        .pg-mobile-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 50px; }
        .pg-mobile button.mm-link {
          display: block; width: 100%; text-align: left; background: none; border: none;
          font-family: inherit; font-size: 24px; font-weight: 700; color: #0F172A;
          padding: 20px 0; border-bottom: 1px solid #DBEAFE; cursor: pointer;
          transition: color 0.2s, padding-left 0.2s;
        }
        .pg-mobile button.mm-link:hover { color: #1D4ED8; padding-left: 10px; }

        /* ── HERO ── */
        .hero-outer { position: relative; overflow: hidden; padding-bottom: 40px; }
        .hero-wrap { position: relative; padding: 80px 32px 64px; max-width: 1280px; margin: 0 auto; z-index: 1; }
        .hero-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 60px; align-items: center; }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 10px;
          background: #EFF6FF; border: 1px solid #DBEAFE; color: #1E40AF;
          padding: 10px 20px; border-radius: 100px; font-size: 13.5px; font-weight: 700; margin-bottom: 32px;
          box-shadow: 0 4px 15px rgba(29,78,216,0.1); cursor: default;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .hero-badge:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(29,78,216,0.2); }
        .badge-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #1D4ED8;
          animation: pulse-dot 1.5s infinite;
        }
        @keyframes pulse-dot {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.7); opacity: 0.5; }
        }

        .hero-h1 {
          font-family: 'Playfair Display', serif; font-size: 60px; font-weight: 700;
          line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 28px; color: #0F172A;
        }
        .hero-h1-grad {
          display: block;
          background: linear-gradient(120deg, #1D4ED8, #1E40AF 40%, #60A5FA);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        }
        .tw-wrap { display: inline-block; min-width: 260px; }
        .tw-cursor {
          display: inline-block; width: 3px; height: 0.85em; background: #1D4ED8;
          margin-left: 4px; border-radius: 2px; vertical-align: text-bottom;
          animation: blink 0.9s step-end infinite;
        }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

        .hero-sub { font-size: 18px; color: #475569; line-height: 1.75; margin-bottom: 40px; max-width: 520px; }

        .search-box {
          background: #fff; border: 1.5px solid #E2E8F0; border-radius: 18px;
          padding: 8px; display: flex; gap: 10px; max-width: 500px; margin-bottom: 32px;
          box-shadow: 0 12px 40px rgba(29,78,216,0.1); transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .search-box:hover { transform: translateY(-2px); box-shadow: 0 16px 50px rgba(29,78,216,0.15); }
        .search-box:focus-within { border-color: #1D4ED8; box-shadow: 0 16px 50px rgba(29,78,216,0.25); transform: translateY(-3px); }
        .search-inp {
          flex: 1; background: transparent; border: none; color: #0F172A;
          font-size: 15.5px; padding: 12px 8px 12px 16px; outline: none; font-family: inherit;
        }
        .search-inp::placeholder { color: #94A3B8; }
        .search-go {
          background: linear-gradient(135deg,#1D4ED8,#1E40AF); color: #fff; border: none;
          border-radius: 14px; padding: 0 26px; font-weight: 700; font-size: 14.5px;
          cursor: pointer; font-family: inherit; transition: transform 0.2s, box-shadow 0.2s;
        }
        .search-go:hover { transform: translateY(-1px); box-shadow: 0 6px 15px rgba(29,78,216,0.3); }

        .hero-cta { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin-bottom: 40px; }

        .trust-row { display: flex; align-items: center; gap: 16px; cursor: default; transition: transform 0.3s; }
        .trust-row:hover { transform: translateX(5px); }
        .trust-avatars { display: flex; }
        .trust-av {
          width: 38px; height: 38px; border-radius: 50%; border: 3px solid #F8FAFC;
          margin-left: -12px; display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #1E40AF;
          background: linear-gradient(135deg,#EFF6FF,#DBEAFE); flex-shrink: 0;
          transition: transform 0.3s;
        }
        .trust-av:first-child { margin-left: 0; }
        .trust-avatars:hover .trust-av { transform: translateY(-4px); }
        .trust-text { font-size: 14px; color: #64748B; }
        .trust-text b { color: #0F172A; }
        .stars { display: flex; gap: 3px; margin-bottom: 4px; }

        /* ── DEVICE ── */
        .hd-wrap { position: relative; display: flex; align-items: center; justify-content: center; min-height: 540px; perspective: 1000px; }
        .hd-glow { position: absolute; width: 400px; height: 400px; background: radial-gradient(circle, rgba(29,78,216,0.22), transparent 70%); filter: blur(20px); border-radius: 50%; }
        .hd-phone { position: relative; width: 280px; background: #0F172A; border-radius: 40px; padding: 14px; box-shadow: 0 40px 80px rgba(30,58,138,0.35), 0 10px 25px rgba(0,0,0,0.2); transform-style: preserve-3d; transition: transform 0.5s ease; }
        .hd-wrap:hover .hd-phone { transform: rotateY(-10deg) rotateX(5deg); }
        .hd-notch { width: 80px; height: 20px; background: #0F172A; border-radius: 0 0 16px 16px; margin: 0 auto 8px; }
        .hd-screen { background: #F8FAFC; border-radius: 28px; padding: 18px 16px 24px; min-height: 420px; }
        .hd-header { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 16px; }
        .hd-live { margin-left: auto; font-size: 11px; color: #1E9E5A; font-weight: 800; background: #DCF5E8; padding: 3px 8px; border-radius: 10px; }
        .hd-card { background: linear-gradient(135deg,#1D4ED8,#1E40AF); border-radius: 18px; padding: 16px; display: flex; align-items: center; gap: 14px; margin-bottom: 18px; box-shadow: 0 15px 30px rgba(29,78,216,0.4); }
        .hd-token { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: #fff; font-weight: 800; font-size: 14px; border-radius: 12px; padding: 10px 12px; white-space: nowrap; }
        .hd-card-title { color: #fff; font-size: 14px; font-weight: 700; }
        .hd-card-sub { color: rgba(255,255,255,0.9); font-size: 11px; margin-top: 3px; }
        .hd-row { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 14px; margin-bottom: 6px; transition: transform 0.2s; }
        .hd-row:hover { transform: translateX(5px); }
        .hd-row.hi { background: #EFF6FF; border: 1px solid #DBEAFE; }
        .hd-av { width: 30px; height: 30px; border-radius: 50%; background: #DBEAFE; color: #1E40AF; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .hd-av.active { background: linear-gradient(135deg,#1D4ED8,#1E40AF); color: #fff; }
        .hd-line { height: 8px; background: #DBEAFE; border-radius: 4px; flex: 1; }
        .hd-st { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 100px; white-space: nowrap; margin-left: auto; }
        .hd-st.done    { background: #DCF5E8; color: #1E9E5A; display: flex; align-items: center; gap: 4px; }
        .hd-st.serving { background: #EFF6FF; color: #1D4ED8; }
        .hd-st.wait    { background: #FEF3C7; color: #D97706; }
        .hd-toast { margin-top: 18px; background: #fff; color: #0F172A; padding: 10px 14px; border-radius: 16px; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); border: 1px solid rgba(0,0,0,0.04); }
        .hd-chip { position: absolute; background: #fff; border: 1.5px solid #DBEAFE; box-shadow: 0 15px 35px rgba(29,78,216,0.18); border-radius: 100px; padding: 12px 20px; font-size: 13.5px; font-weight: 700; display: flex; align-items: center; gap: 8px; transition: transform 0.3s, box-shadow 0.3s; cursor: default; }
        .hd-chip:hover { transform: scale(1.05) translateY(-5px) !important; box-shadow: 0 20px 45px rgba(29,78,216,0.25); }
        .chip-a { top: 8%;  left: -12%;  color: #1D4ED8; }
        .chip-b { bottom: 10%; right: -15%; color: #1E40AF; }

        /* ── MARQUEE STRIP ── */
        .city-strip { background: #EFF6FF; border-top: 1px solid #DBEAFE; border-bottom: 1px solid #DBEAFE; padding: 20px 0; }
        .city-label { text-align: center; font-size: 12.5px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #1E40AF; margin-bottom: 14px; }

        /* ── SECTIONS ── */
        .sec { padding: 110px 32px; max-width: 1280px; margin: 0 auto; }
        .sec-sm { padding: 80px 32px; max-width: 1280px; margin: 0 auto; }
        .sec-head { text-align: center; max-width: 680px; margin: 0 auto 64px; }
        .eyebrow { display: inline-block; font-size: 13px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #1D4ED8; margin-bottom: 16px; background: #EFF6FF; padding: 6px 16px; border-radius: 100px; border: 1px solid #DBEAFE; }
        .sec-title { font-family: 'Playfair Display', serif; font-size: 44px; font-weight: 700; margin-bottom: 18px; color: #0F172A; line-height: 1.25; }
        .sec-sub { font-size: 18px; color: #475569; line-height: 1.7; }

        /* ── STATS ── */
        .stats-band { background: linear-gradient(135deg,#0F172A,#1E3A8A 50%,#1D4ED8); border-radius: 36px; padding: 64px 40px; max-width: 1220px; margin-inline: auto; box-shadow: 0 25px 60px rgba(30,58,138,0.25); }
        .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 30px; text-align: center; }
        .stats-grid > div { transition: transform 0.35s cubic-bezier(0.2,0.8,0.2,1); cursor: default; }
        .stats-grid > div:hover { transform: translateY(-8px) scale(1.08); }
        .stat-num { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 700; color: #fff; text-shadow: 0 4px 10px rgba(0,0,0,0.2); transition: text-shadow 0.3s; }
        .stats-grid > div:hover .stat-num { text-shadow: 0 0 25px rgba(96,165,250,0.8); }
        .stat-label { font-size: 14px; color: rgba(255,255,255,0.85); margin-top: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

        /* ── AI POWER CARDS ── */
        .power-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 28px; }
        .power-card {
          background: linear-gradient(135deg, #FFFFFF 0%, #F4F8FF 100%);
          border: 1.5px solid #CBD5E1;
          border-radius: 28px; padding: 36px 32px;
          box-shadow: 0 12px 35px rgba(29, 78, 216, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
          transition: all 0.45s cubic-bezier(.16,1,.3,1);
          position: relative; overflow: hidden; cursor: pointer;
        }
        .power-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, #1D4ED8, #60A5FA, #1D4ED8);
          opacity: 0; transition: opacity 0.4s ease;
        }
        .power-card:hover { transform: translateY(-14px) scale(1.02); box-shadow: 0 35px 85px rgba(29,78,216,0.22); border-color: #93C5FD; }
        .power-card:hover::before { opacity: 1; }
        .power-card-top { display: flex; align-items: center; gap: 16px; margin-bottom: 22px; position: relative; z-index: 2; }
        .power-icon { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg,#EFF6FF,#DBEAFE); border: 1px solid #BFDBFE; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.4s, background 0.4s, color 0.4s; }
        .power-card:hover .power-icon { transform: scale(1.18) rotate(8deg); background: linear-gradient(135deg,#1D4ED8,#1E40AF); color: #fff !important; }
        .power-card:hover .power-icon svg { stroke: #fff; }
        .power-tag { font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #1D4ED8; margin-bottom: 4px; }
        .power-title { font-size: 22px; font-weight: 700; color: #0F172A; letter-spacing: -0.01em; transition: color 0.3s; }
        .power-card:hover .power-title { color: #1D4ED8; }
        .power-desc { font-size: 15px; color: #475569; line-height: 1.7; margin-bottom: 26px; position: relative; z-index: 2; }
        .power-demo { background: #FFFFFF; border: 1.5px solid #CBD5E1; border-radius: 20px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); transition: background 0.35s, border-color 0.35s, transform 0.35s; position: relative; z-index: 2; }
        .power-card:hover .power-demo { background: #EFF6FF; border-color: #93C5FD; transform: translateY(-2px); }
        .power-badge { display: inline-flex; align-items: center; gap: 8px; background: #EFF6FF; color: #1E40AF; font-size: 13px; font-weight: 700; padding: 8px 16px; border-radius: 100px; margin-top: 20px; border: 1px solid #BFDBFE; transition: background 0.3s, border-color 0.3s, transform 0.3s; position: relative; z-index: 2; }
        .power-card:hover .power-badge { background: #DBEAFE; border-color: #60A5FA; transform: scale(1.04); }

        /* Ghost watermark icon for cards */
        .card-ghost-icon {
          position: absolute;
          right: -20px;
          bottom: -20px;
          width: 140px;
          height: 140px;
          color: #1D4ED8;
          opacity: 0.06;
          pointer-events: none;
          z-index: 1;
          transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.5s ease, color 0.5s ease;
        }
        .power-card:hover .card-ghost-icon,
        .feat-card:hover .card-ghost-icon {
          transform: scale(1.3) rotate(-12deg) translate(-10px, -10px);
          opacity: 0.16;
          color: #1D4ED8;
        }

        /* ── BEFORE / AFTER ── */
        .compare-wrap { max-width: 1220px; margin-inline: auto; padding: 0 32px 90px; }
        .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .compare-card { border-radius: 26px; padding: 36px; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s, border-color 0.4s; }
        .compare-before { background: linear-gradient(135deg, #FEF2F2 0%, #FFF5F5 100%); border: 2px solid #FECDD3; box-shadow: 0 12px 35px rgba(239, 68, 68, 0.08); }
        .compare-before:hover { transform: translateY(-10px) scale(1.01); border-color: #FCA5A5; box-shadow: 0 25px 60px rgba(239, 68, 68, 0.2); }
        .compare-after  { background: linear-gradient(135deg,#EFF6FF,#F8FAFC); border: 2px solid #DBEAFE; box-shadow: 0 15px 40px rgba(29,78,216,0.1); }
        .compare-after:hover { transform: translateY(-10px) scale(1.01); border-color: #93C5FD; box-shadow: 0 25px 60px rgba(29,78,216,0.22); }
        .compare-head { display: flex; align-items: center; gap: 12px; margin-bottom: 26px; font-size: 18px; font-weight: 700; }
        .compare-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 15px; line-height: 1.6; transition: background 0.25s, padding-left 0.25s; }
        .compare-item:last-child { border-bottom: none; }
        .compare-item svg { transition: transform 0.25s ease, color 0.25s ease; }
        .compare-before .compare-item:hover { background: rgba(254, 226, 226, 0.7); border-radius: 8px; padding-left: 12px; cursor: default; }
        .compare-before .compare-item:hover svg { transform: scale(1.25) rotate(90deg); color: #DC2626; }
        .compare-after .compare-item:hover { background: rgba(255,255,255,0.7); border-radius: 8px; padding-left: 12px; cursor: default; }
        .compare-after .compare-item:hover svg { transform: scale(1.25) rotate(10deg); color: #1D4ED8; }

        /* ── FEATURES GRID ── */
        .feat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
        .feat-card {
          background: linear-gradient(135deg, #FFFFFF 0%, #F4F8FF 100%);
          border: 1.5px solid #CBD5E1;
          border-radius: 26px; padding: 36px 30px;
          box-shadow: 0 12px 35px rgba(29, 78, 216, 0.08), 0 2px 6px rgba(0,0,0,0.04);
          transition: all 0.45s cubic-bezier(.16,1,.3,1);
          position: relative; overflow: hidden; cursor: pointer;
        }
        .feat-card::before {
          content: ''; position: absolute; inset: 0; border-radius: 26px; padding: 2px;
          background: linear-gradient(135deg,#1D4ED8,#60A5FA); opacity: 0;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          transition: opacity 0.4s; pointer-events: none;
        }
        .feat-card:hover { transform: translateY(-12px) scale(1.02); box-shadow: 0 35px 75px rgba(29,78,216,0.2); border-color: #93C5FD; }
        .feat-card:hover::before { opacity: 1; }
        .feat-icon { width: 52px; height: 52px; border-radius: 15px; background: linear-gradient(135deg,#EFF6FF,#DBEAFE); border: 1px solid #BFDBFE; display: flex; align-items: center; justify-content: center; margin-bottom: 22px; transition: transform 0.4s, background 0.4s; position: relative; z-index: 2; }
        .feat-card:hover .feat-icon { transform: scale(1.2) rotate(-8deg); background: linear-gradient(135deg,#1D4ED8,#1E40AF); color: #fff !important; }
        .feat-card:hover .feat-icon svg { stroke: #fff; }
        .feat-tag { font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #1D4ED8; margin-bottom: 10px; position: relative; z-index: 2; }
        .feat-title { font-size: 19px; font-weight: 700; color: #0F172A; margin-bottom: 12px; letter-spacing: -0.01em; transition: color 0.3s; position: relative; z-index: 2; }
        .feat-card:hover .feat-title { color: #1D4ED8; }
        .feat-desc { font-size: 14.5px; color: #475569; line-height: 1.7; position: relative; z-index: 2; }

        /* ── HOW IT WORKS ── */
        .how-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 48px; position: relative; }
        .how-grid::before { content: ''; position: absolute; top: 32px; left: 16%; right: 16%; height: 2px; background: linear-gradient(90deg,#DBEAFE,#1D4ED8,#DBEAFE); z-index: 0; }
        .how-step { position: relative; z-index: 1; text-align: center; cursor: default; transition: transform 0.35s cubic-bezier(0.16,1,0.3,1); }
        .how-step:hover { transform: translateY(-8px); }
        .how-n { width: 64px; height: 64px; background: linear-gradient(135deg,#1D4ED8,#1E40AF); color: #fff; font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 28px; box-shadow: 0 0 0 10px #F8FAFC, 0 12px 30px rgba(29,78,216,0.35); transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s; }
        .how-step:hover .how-n { transform: scale(1.22) rotate(12deg); box-shadow: 0 0 0 14px #F8FAFC, 0 20px 45px rgba(29,78,216,0.5); }
        .how-h3 { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #0F172A; transition: color 0.3s; }
        .how-step:hover .how-h3 { color: #1D4ED8; }
        .how-p { font-size: 15px; color: #475569; line-height: 1.7; max-width: 260px; margin-inline: auto; }

        /* ── LOGO MARQUEE ── */
        .logo-strip { background: #EFF6FF; border-top: 1px solid #DBEAFE; border-bottom: 1px solid #DBEAFE; padding: 32px 0; }
        .logo-label { text-align: center; font-size: 12.5px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #1E40AF; margin-bottom: 20px; }
        .marquee-logo-card { transition: all 0.35s ease; }
        .marquee-logo-card:hover { transform: translateY(-4px) scale(1.08); border-color: #1D4ED8; box-shadow: 0 12px 30px rgba(29,78,216,0.2); color: #1D4ED8; cursor: pointer; }

        /* ── TESTIMONIALS ── */
        .test-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 26px; }
        .test-card { background: #fff; border: 1px solid #F1F5F9; border-radius: 26px; padding: 32px 30px; transition: all 0.45s cubic-bezier(.16,1,.3,1); cursor: default; }
        .test-card:hover { transform: translateY(-10px) scale(1.02); box-shadow: 0 30px 65px rgba(29,78,216,0.18); border-color: #93C5FD; }
        .test-q { font-size: 16px; color: #334155; line-height: 1.7; margin: 16px 0 26px; font-style: italic; }
        .test-person { display: flex; align-items: center; gap: 14px; }
        .test-av { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg,#EFF6FF,#DBEAFE); color: #1E40AF; font-weight: 700; font-size: 16px; display: flex; align-items: center; justify-content: center; border: 2px solid #DBEAFE; transition: transform 0.35s, border-color 0.35s; }
        .test-card:hover .test-av { transform: scale(1.15) rotate(5deg); border-color: #1D4ED8; }
        .test-name { font-size: 15px; font-weight: 700; color: #0F172A; }
        .test-role { font-size: 13px; color: #94A3B8; }

        /* ── CTA ── */
        .cta-outer { padding: 0 32px 90px; }
        .cta-sec {
          border-radius: 40px; padding: 110px 56px; text-align: center;
          position: relative; overflow: hidden; max-width: 1220px; margin-inline: auto;
          background: linear-gradient(135deg,#0F172A,#1E3A8A 40%,#1D4ED8);
          box-shadow: 0 30px 70px rgba(30,58,138,0.3);
        }
        .cta-inner { position: relative; z-index: 2; pointer-events: none; }
        .cta-inner button { pointer-events: auto; }
        .cta-pill { display: inline-flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); color: #fff; padding: 8px 20px; border-radius: 100px; font-size: 14px; font-weight: 700; margin-bottom: 28px; backdrop-filter: blur(5px); }
        .cta-h2 { font-family: 'Playfair Display', serif; font-size: 52px; font-weight: 700; color: #fff; margin-bottom: 22px; line-height: 1.2; text-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .cta-p { font-size: 19px; color: rgba(255,255,255,0.85); margin-bottom: 46px; max-width: 520px; margin-inline: auto; line-height: 1.7; }
        .cta-btn { display: inline-flex; align-items: center; gap: 12px; padding: 20px 46px; font-size: 16px; background: #fff; color: #1E40AF; border: none; border-radius: 16px; font-weight: 800; cursor: pointer; font-family: inherit; transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: 0 10px 25px rgba(0,0,0,0.2); position: relative; z-index: 10; }
        .cta-btn:hover { transform: translateY(-4px) scale(1.04); box-shadow: 0 20px 45px rgba(0,0,0,0.35); color: #1D4ED8; }
        .cta-btn:active { transform: translateY(0) scale(0.98); }
        .cta-note { margin-top: 22px; font-size: 14px; color: rgba(255,255,255,0.6); }

        /* ── FOOTER ── */
        .pg-footer { text-align: center; padding: 48px 20px 40px; color: #475569; font-size: 14px; border-top: 2px solid #DBEAFE; background: #F8FAFC; font-weight: 500; }
        .footer-links { display: flex; justify-content: center; gap: 24px; margin-top: 16px; flex-wrap: wrap; }
        .footer-links a { color: #1D4ED8; text-decoration: none; font-weight: 600; transition: color 0.25s; font-size: 14px; }
        .footer-links a:hover { color: #1E3A8A; }

        
        .carousel-dots-wrap { display: none; }
        @media (max-width: 768px) {
          .carousel-dots-wrap {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 8px !important;
            margin-top: 18px !important;
          }
          .carousel-dot {
            width: 8px !important;
            height: 8px !important;
            border-radius: 50% !important;
            border: none !important;
            padding: 0 !important;
            cursor: pointer !important;
            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .carousel-dot.active {
            width: 24px !important;
            border-radius: 100px !important;
          }
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .hero-grid    { grid-template-columns: 1fr; gap: 32px; }
          .hd-wrap      { order: -1; min-height: 340px; height: 340px; margin-bottom: 24px; transform: scale(0.9); transform-origin: top center; }
          .hero-h1      { font-size: 46px; }
          .power-grid   { grid-template-columns: 1fr; }
          .feat-grid    { grid-template-columns: repeat(2,1fr); }
          .test-grid    { grid-template-columns: repeat(2,1fr); }
          .stats-grid   { grid-template-columns: repeat(2,1fr); row-gap: 36px; }
          .compare-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .pg-topbar     { font-size: 12px; padding: 10px 14px; line-height: 1.5; }
          .pg-nav-inner  { padding: 12px 18px; }
          .pg-nav-links  { display: none; }
          .pg-burger     { display: block; }

          .hero-outer    { overflow-x: hidden; }
          .hero-wrap     { padding: 24px 18px 24px; }
          .hd-wrap       { display: none !important; }

          .hero-h1       { font-size: 40px; line-height: 1.18; margin-bottom: 20px; letter-spacing: -0.02em; }
          .hero-sub      { font-size: 16px; line-height: 1.65; margin-bottom: 28px; color: #475569; }
          .tw-wrap       { min-width: auto; }

          .search-box    { max-width: 100%; flex-direction: column; gap: 8px; padding: 8px; border-radius: 16px; }
          .search-inp    { font-size: 15px; padding: 10px; width: 100%; }
          .search-go     { width: 100%; height: 46px; justify-content: center; font-size: 15px; padding: 0 16px; }

          .hero-cta      { flex-direction: column; align-items: stretch; gap: 12px; margin-bottom: 28px; }
          .hero-cta .btn { justify-content: center; width: 100%; font-size: 16px; padding: 16px 24px; }
          .trust-row     { flex-direction: column; align-items: flex-start; gap: 10px; }

          .sec, .sec-sm  { padding: 28px 18px; }
          .sec-head      { margin-bottom: 24px; }
          .sec-title     { font-size: 30px; line-height: 1.2; margin-bottom: 12px; }
          .sec-sub       { font-size: 15px; }
          .eyebrow       { font-size: 11.5px; padding: 5px 12px; margin-bottom: 10px; }

          .power-grid, .feat-grid, .test-grid {
            display: flex !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            scroll-behavior: smooth !important;
            -webkit-overflow-scrolling: touch;
            padding: 8px 18px 24px 18px !important;
            margin-left: -18px !important;
            margin-right: -18px !important;
            gap: 16px !important;
          }
          .power-grid::-webkit-scrollbar,
          .feat-grid::-webkit-scrollbar,
          .test-grid::-webkit-scrollbar {
            display: none !important;
          }
          .power-card, .feat-card, .test-card {
            flex: 0 0 82% !important;
            min-width: 82% !important;
            max-width: 82% !important;
            scroll-snap-align: center !important;
            padding: 28px 22px !important;
            border-radius: 24px !important;
            box-sizing: border-box !important;
          }
          .how-grid {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
          }
          .how-p {
            display: none !important;
          }
          .how-n {
            width: 48px !important;
            height: 48px !important;
            font-size: 18px !important;
            margin-bottom: 12px !important;
          }
          .how-h3 {
            font-size: 13.5px !important;
            line-height: 1.25 !important;
          }
          .power-title   { font-size: 20px; }
          .power-desc    { font-size: 14.5px; margin-bottom: 20px; }
          .power-icon    { width: 50px; height: 50px; border-radius: 14px; }
          .card-ghost-icon { width: 90px; height: 90px; right: -10px; bottom: -10px; opacity: 0.05; }
          .feat-title    { font-size: 19px; }
          .feat-desc     { font-size: 14.5px; }
          .feat-icon     { width: 48px; height: 48px; border-radius: 14px; margin-bottom: 18px; }
          .test-q        { font-size: 15px; margin: 14px 0 22px; }

          .stats-band    { border-radius: 26px; padding: 44px 22px; }
          .stats-grid    { grid-template-columns: repeat(2,1fr); gap: 28px 16px; }
          .stat-num      { font-size: 40px; }
          .stat-label    { font-size: 12.5px; margin-top: 6px; }

          .cta-outer     { padding: 0 18px 56px; }
          .cta-sec       { padding: 64px 22px; border-radius: 28px; }
          .cta-pill      { font-size: 13px; padding: 7px 16px; margin-bottom: 22px; }
          .cta-h2        { font-size: 32px; margin-bottom: 18px; }
          .cta-p         { font-size: 16px; margin-bottom: 36px; }
          .cta-btn       { padding: 18px 28px; font-size: 16px; width: 100%; justify-content: center; }
          .cta-note      { font-size: 13px; }

          .pg-footer     { padding: 40px 18px; font-size: 13.5px; }
          .footer-links  { gap: 18px; font-size: 13.5px; }
        }

        @media (max-width: 480px) {
          .hd-wrap       { height: 290px; min-height: 290px; transform: scale(0.78); }
          .hero-h1       { font-size: 34px; line-height: 1.2; }
          .hero-sub      { font-size: 14.5px; }
          .sec-title     { font-size: 28px; }
          .stats-grid    { grid-template-columns: 1fr; gap: 22px; }
          .stat-num      { font-size: 36px; }
          .cta-h2        { font-size: 28px; }
          .cta-btn       { width: 100%; justify-content: center; }
          .footer-links  { gap: 14px; font-size: 13px; }
          .cta-outer     { padding: 0 12px 48px; }
        }
      `}</style>

      <div className="pg-root">
        <GradientDefs />
        <div className="pg-bg" />

        {/* ── TOPBAR ── */}
        <div className="pg-topbar">
          <PartyPopper size={15} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }} />
          Now live: WhatsApp Admission Queue, Multi-Counter Routing &amp; Regional Voice Alerts &nbsp;·&nbsp;{" "}
          <a href="mailto:tokenpe.online@gmail.com" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            Get early access <ArrowRight size={13} />
          </a>
        </div>

        {/* ── NAV ── */}
        <nav className={`pg-nav${scrolled ? " scrolled" : ""}`}>
          <div className="pg-nav-inner">
            <img src="/logo-light.png" alt="TokenPe" style={{ height: 38, cursor: "pointer" }} onClick={() => router.push("/")} />
            <div className="pg-nav-links">
              <button className="pg-nl" onClick={() => go("ai")}>AI Tools</button>
              <button className="pg-nl" onClick={() => go("features")}>Features</button>
              <button className="pg-nl" onClick={() => go("how")}>How it works</button>
              <button className="pg-nl" onClick={() => router.push("/find-school")}>Find school</button>
              <button className="btn btn-primary" onClick={() => router.push("/school-login?mode=register")}>
                Start 7-day free trial
              </button>
            </div>
            <button className="pg-burger" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={26} /></button>
          </div>
        </nav>

        {/* ── MOBILE MENU ── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div className="pg-mobile"
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="pg-mobile-top">
                <img src="/logo-light.png" alt="TokenPe" style={{ height: 34 }} />
                <button className="pg-burger" onClick={() => setMenuOpen(false)} aria-label="Close"><X size={26} /></button>
              </div>
              <button className="mm-link" onClick={() => go("ai")}>AI Tools</button>
              <button className="mm-link" onClick={() => go("features")}>Features</button>
              <button className="mm-link" onClick={() => go("how")}>How it works</button>
              <button className="mm-link" onClick={() => { setMenuOpen(false); router.push("/find-school"); }}>Find school</button>
              <div style={{ marginTop: 44 }}>
                <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }} onClick={() => router.push("/school-login?mode=register")}>
                  Start 7-day free trial <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HERO ── */}
        <div className="hero-outer">
          <FloatingObjects />
          <div className="hero-wrap">
            <div className="hero-grid">
              <div style={{ position: "relative", zIndex: 1 }}>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                  <div className="hero-badge">
                    <div className="badge-dot" />
                    Built for schools &amp; educational institutions across India
                  </div>
                </motion.div>

                <motion.h1 className="hero-h1" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1 }}>
                  Ditch the gate chaos.<br />
                  <span className="hero-h1-grad">
                    <span className="tw-wrap">{heroWord}</span>
                    <span className="tw-cursor" aria-hidden />
                  </span>
                </motion.h1>

                <motion.p className="hero-sub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }}>
                  No more crowded main gates or chaotic Parent-Teacher Meetings. Parents scan a QR code, join a digital queue, and receive real-time WhatsApp updates when it's their turn.
                </motion.p>

                <motion.form className="search-box" onSubmit={handleSearch} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.25 }}>
                  <Search size={20} color="#94A3B8" style={{ margin: "auto 0 auto 10px", flexShrink: 0 }} />
                  <input className="search-inp" type="text" placeholder="Search school by name or city..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <button type="submit" className="search-go">Find</button>
                </motion.form>

                <motion.div className="hero-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3 }}>
                  <button className="btn btn-primary btn-lg" onClick={() => router.push("/school-login?mode=register")}>
                    Start 7-day free trial <ArrowRight size={18} />
                  </button>
                  <button className="btn btn-ghost btn-lg" onClick={() => go("how")}>See how it works</button>
                </motion.div>

                <motion.div className="trust-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.4 }}>
                  <div className="trust-avatars">
                    {["D", "R", "S", "P", "K"].map((l) => <div key={l} className="trust-av">{l}</div>)}
                  </div>
                  <div>
                    <div className="stars">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="#1D4ED8" stroke="none" />)}</div>
                    <div className="trust-text"><b>500+ schools</b> streamlining campus queues</div>
                  </div>
                </motion.div>

              </div>
              <SchoolHeroFlow />
            </div>
          </div>
        </div>

        {/* ── CITY MARQUEE ── */}
        <div className="city-strip">
          <div className="city-label">Schools live in</div>
          <CityMarquee />
        </div>

        {/* ── STATS ── */}
        <div style={{ padding: "64px 32px 0" }}>
          <Reveal className="stats-band">
            <div className="stats-grid">
              {[
                { t: 500, s: "+", d: 0, l: "Schools onboarded" },
                { t: 2500000, s: "+", d: 0, l: "Gate passes & tokens" },
                { t: 40, s: "%", d: 0, l: "Avg. PTM wait time cut" },
                { t: 4.9, s: "/5", d: 1, l: "Parent satisfaction rating" },
              ].map((st, i) => (
                <div key={i}>
                  <div className="stat-num"><CountUp target={st.t} suffix={st.s} decimals={st.d} /></div>
                  <div className="stat-label">{st.l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* ── AI POWER FEATURES ── */}
        <section className="sec" id="ai">
          <Reveal className="sec-head">
            <span className="eyebrow">New · School AI Features</span>
            <h2 className="sec-title">Your school front office, powered by AI</h2>
            <p className="sec-sub">TokenPe acts as an intelligent digital receptionist for your school gate, PTM desk, and administration office — working 24/7.</p>
          </Reveal>

          <MobileAutoCarousel total={3} activeDotColor="#1D4ED8"><div className="power-grid">
            {/* ─ Voice AI ─ */}
            <div className="power-card">
              <Phone className="card-ghost-icon" aria-hidden />
              <div className="power-card-top">
                <div className="power-icon"><Phone size={26} color="#1D4ED8" /></div>
                <div>
                  <div className="power-tag">Voice AI</div>
                  <div className="power-title">AI Parent Assistant</div>
                </div>
              </div>
              <p className="power-desc">
                Parents call your school — our Voice AI answers, checks PTM status, verifies fee records, and issues digital gate passes automatically.
              </p>
              <div className="power-demo">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#1D4ED8,#1E40AF)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Mic size={18} color="#fff" />
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>AI Assistant · Live Call</span>
                  <span style={{ marginLeft: "auto", fontSize: 11.5, color: "#1E9E5A", fontWeight: 800, background: "#DCF5E8", padding: "2px 8px", borderRadius: 8 }}>● Active</span>
                </div>
                <Waveform />
                <div style={{ marginTop: 14, fontSize: 12.5, color: "#475569", fontStyle: "italic", lineHeight: 1.6 }}>
                  "Gate pass GP-104 for Rahul V (Grade 8-B) is confirmed. WhatsApp notification sent to parent."
                </div>
              </div>
              <div className="power-badge"><Zap size={14} /> Handles 200+ parent calls/day</div>
            </div>

            {/* ─ WhatsApp Chatbot ─ */}
            <div className="power-card">
              <MessageSquare className="card-ghost-icon" aria-hidden />
              <div className="power-card-top">
                <div className="power-icon"><MessageSquare size={26} color="#1D4ED8" /></div>
                <div>
                  <div className="power-tag">WhatsApp AI</div>
                  <div className="power-title">Gate Pass Chatbot</div>
                </div>
              </div>
              <p className="power-desc">
                Instant digital gate passes, PTM queue tokens, fee reminders, and circulars — delivered directly on WhatsApp.
              </p>
              <div className="power-demo" style={{ padding: "0", border: "none", background: "transparent" }}>
                <WhatsAppChat />
              </div>
              <div className="power-badge"><Clock size={14} /> 24 / 7 instant responses</div>
            </div>

            {/* ─ Google Reviews ─ */}
            <div className="power-card">
              <ThumbsUp className="card-ghost-icon" aria-hidden />
              <div className="power-card-top">
                <div className="power-icon"><ThumbsUp size={26} color="#1D4ED8" /></div>
                <div>
                  <div className="power-tag">Reputation</div>
                  <div className="power-title">Parent Reviews &amp; Feedback</div>
                </div>
              </div>
              <p className="power-desc">
                After PTMs or admissions, TokenPe automatically requests feedback from parents — building your school's reputation online.
              </p>
              <div className="power-demo">
                <div style={{ marginBottom: 16 }}><AnimatedStars /></div>
                <div style={{ fontSize: 13.5, color: "#333", lineHeight: 1.65, fontStyle: "italic", marginBottom: 16 }}>
                  "Super organized PTM! Zero waiting time outside the classroom"
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#1E40AF" }}>S</div>
                  <span style={{ fontSize: 13, color: "#64748B" }}>Sunita M. · Parent</span>
                  <span style={{ marginLeft: "auto", fontSize: 11.5, background: "#EFF6FF", color: "#1E40AF", padding: "3px 10px", borderRadius: 100, fontWeight: 700, border: "1px solid #DBEAFE" }}>Auto-sent</span>
                </div>
              </div>
              <div className="power-badge"><Star size={14} fill="#1D4ED8" stroke="none" /> Avg. 4.9 rating from parents</div>
            </div>
          </div></MobileAutoCarousel>
        </section>

        {/* ── BEFORE / AFTER ── */}
        <div className="compare-wrap">
          <Reveal className="sec-head" style={{ marginBottom: 48 }}>
            <span className="eyebrow">The difference</span>
            <h2 className="sec-title">Before &amp; after TokenPe</h2>
          </Reveal>
          <div className="compare-grid">
            <Reveal className="compare-card compare-before">
              <div className="compare-head">
                <X size={22} color="#EF4444" />
                <span style={{ color: "#DC2626" }}>Without TokenPe</span>
              </div>
              {BEFORE.map((item, i) => (
                <div key={i} className="compare-item">
                  <X size={18} style={{ color: "#F87171", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: "#7F1D1D" }}>{item}</span>
                </div>
              ))}
            </Reveal>
            <Reveal delay={0.15} className="compare-card compare-after">
              <div className="compare-head">
                <CheckCircle2 size={22} color="#1D4ED8" />
                <span style={{ color: "#1D4ED8" }}>With TokenPe</span>
              </div>
              {AFTER.map((item, i) => (
                <div key={i} className="compare-item">
                  <CheckCircle2 size={18} style={{ color: "#1D4ED8", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: "#0F172A" }}>{item}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </div>

        {/* ── FEATURES GRID ── */}
        <section className="sec" id="features" style={{ paddingTop: 0 }}>
          <Reveal className="sec-head">
            <span className="eyebrow">Everything, in one place</span>
            <h2 className="sec-title">Built for the way schools actually operate</h2>
            <p className="sec-sub">From main gate passes to teacher PTM queues — TokenPe replaces paper registers with one smart digital dashboard.</p>
          </Reveal>
          <MobileAutoCarousel total={FEATURES.length} activeDotColor="#1D4ED8"><div className="feat-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feat-card">
                <f.icon className="card-ghost-icon" aria-hidden />
                <div className="feat-icon"><f.icon size={26} color="#1D4ED8" /></div>
                <div className="feat-tag">{f.tag}</div>
                <h3 className="feat-title">{f.title}</h3>
                <p className="feat-desc">{f.desc}</p>
              </div>
            ))}
          </div></MobileAutoCarousel>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="sec" id="how" style={{ paddingTop: 0 }}>
          <Reveal className="sec-head">
            <span className="eyebrow">Simple setup</span>
            <h2 className="sec-title">Live in under 10 minutes</h2>
            <p className="sec-sub">Zero hardware, zero training. If your staff and security guards can use WhatsApp, they can use TokenPe.</p>
          </Reveal>
          <div className="how-grid">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.15} className="how-step">
                <div className="how-n">{s.n}</div>
                <h3 className="how-h3">{s.title}</h3>
                <p className="how-p">{s.desc}</p>
              </Reveal>
            ))}
          </div>
        </section>


        {/* ── TESTIMONIALS ── */}
        <section className="sec test-sec">
          <Reveal className="sec-head">
            <span className="eyebrow">Loved by school leaders</span>
            <h2 className="sec-title">Don&apos;t just take our word for it</h2>
          </Reveal>
          <MobileAutoCarousel total={TESTIMONIALS.length} activeDotColor="#1D4ED8"><div className="test-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.n} className="test-card">
                <div className="stars">{Array.from({ length: 5 }).map((_, j) => <Star key={j} size={16} fill="#1D4ED8" stroke="none" />)}</div>
                <p className="test-q">&ldquo;{t.q}&rdquo;</p>
                <div className="test-person">
                  <div className="test-av">{t.n.split(" ").map((w) => w[0]).join("")}</div>
                  <div>
                    <div className="test-name">{t.n}</div>
                    <div className="test-role">{t.r}</div>
                  </div>
                </div>
              </div>
            ))}
          </div></MobileAutoCarousel>
        </section>

        {/* ── CTA ── */}
        <div className="cta-outer">
          <Reveal>
            <div
              className="cta-sec"
              ref={ctaRef}
              onMouseMove={handleMouseMove}
            >
              {/* Mouse spotlight layer */}
              <div style={{
                position: "absolute", inset: 0, borderRadius: 40, pointerEvents: "none",
                background: `radial-gradient(450px circle at ${spotlight.x}% ${spotlight.y}%, rgba(96,165,250,0.25), transparent 60%)`,
                transition: "background 0.1s",
              }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: 40, background: "radial-gradient(600px circle at 15% 20%, rgba(96,165,250,0.18), transparent 55%), radial-gradient(450px circle at 85% 80%, rgba(96,165,250,0.15), transparent 55%)", pointerEvents: "none" }} />

              <div className="cta-inner">
                <Reveal delay={0.05}>
                  <div className="cta-pill"><Sparkles size={16} /> 7-day free trial · No card required</div>
                </Reveal>
                <Reveal delay={0.15}>
                  <h2 className="cta-h2">Ready to modernize<br />your school front office?</h2>
                </Reveal>
                <Reveal delay={0.25}>
                  <p className="cta-p">Join hundreds of schools across India running a safer, smoother, and more professional campus gate and PTM system with TokenPe.</p>
                </Reveal>
                <Reveal delay={0.35}>
                  <button className="cta-btn" onClick={() => router.push("/school-login?mode=register")}>
                    Register your school for free <ArrowRight size={18} />
                  </button>
                </Reveal>
                <Reveal delay={0.45}>
                  <div className="cta-note">No credit card · Setup in 10 minutes · Cancel anytime</div>
                </Reveal>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ── FOOTER ── */}
        <footer className="pg-footer">
          <div>© {new Date().getFullYear()} TokenPe · Made with <Heart size={14} color="#EF4444" fill="#EF4444" style={{ display: "inline-block", verticalAlign: "middle", margin: "0 2px" }} /> for Indian schools &amp; educational institutions</div>
          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="mailto:tokenpe.online@gmail.com">Contact Us</a>
            <a href="/find-school">Find a School</a>
          </div>
        </footer>
      </div>
    </>
  );
}
