"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import {
  Search, Stethoscope, Users, Zap, Bell,
  Hospital, QrCode, MessageSquare, ArrowRight,
  Star, Globe2, Shield, BarChart3, CheckCircle2, Mic, Clock, Calendar, Mail,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════
   COUNT-UP
═══════════════════════════════════════════════════════ */
function CountUp({ target, suffix = "", prefix = "", duration = 1.8 }) {
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
      setVal(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString("en-IN")}{suffix}</span>;
}

function DurationCountUp({ targetMin = 9, targetSec = 42, duration = 1.8 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [min, setMin] = useState(0);
  const [sec, setSec] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = null;
    const totalTargetSec = targetMin * 60 + targetSec;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const currentTotalSec = Math.floor(eased * totalTargetSec);
      setMin(Math.floor(currentTotalSec / 60));
      setSec(currentTotalSec % 60);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, targetMin, targetSec, duration]);

  return (
    <span ref={ref}>
      {min}m {sec < 10 ? `0${sec}` : sec}s
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   SCROLL-REVEAL WRAPPER
═══════════════════════════════════════════════════════ */
const EASE = [0.16, 1, 0.3, 1];
function Reveal({ children, delay = 0, className = "", y = 28, style = {} }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-48px" }}
      transition={{ duration: 0.72, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   TYPEWRITER
═══════════════════════════════════════════════════════ */
function Typewriter({ words }) {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const word = words[idx];
    const spd = del ? 38 : 76;
    const t = setTimeout(() => {
      if (!del && text === word) { setTimeout(() => setDel(true), 2000); return; }
      if (del && text === "") { setDel(false); setIdx((i) => (i + 1) % words.length); return; }
      setText(del ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1));
    }, spd);
    return () => clearTimeout(t);
  }, [text, del, idx, words]);
  return <>{text}<span style={{ borderRight: "2.5px solid #065F46", marginLeft: 2, animation: "caret 1s step-end infinite" }} /></>;
}

/* ═══════════════════════════════════════════════════════
   FLOATING CLINIC GHOST OBJECTS (Inspired by Schools/Salons)
═══════════════════════════════════════════════════════ */
function SvgStethoscope() {
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
      <path d="M16 12v16a18 18 0 0036 0V12" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M34 46v10a8 8 0 0016 0v-2" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="50" cy="52" r="5" fill="#a7f3d0" stroke="#059669" strokeWidth="2" />
      <circle cx="16" cy="10" r="3" fill="#059669" />
      <circle cx="52" cy="10" r="3" fill="#059669" />
    </svg>
  );
}

function SvgSyringe() {
  return (
    <svg width="54" height="68" viewBox="0 0 54 68" fill="none">
      <rect x="18" y="16" width="18" height="34" rx="4" fill="#ecfdf5" stroke="#059669" strokeWidth="2.2" />
      <line x1="27" y1="50" x2="27" y2="64" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="16" x2="40" y2="16" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="23" y="4" width="8" height="12" fill="#a7f3d0" stroke="#059669" strokeWidth="1.8" />
      <line x1="22" y1="26" x2="28" y2="26" stroke="#059669" strokeWidth="1.5" />
      <line x1="22" y1="34" x2="30" y2="34" stroke="#059669" strokeWidth="1.5" />
    </svg>
  );
}

function SvgPillCapsule() {
  return (
    <svg width="60" height="40" viewBox="0 0 60 40" fill="none">
      <rect x="4" y="6" width="52" height="28" rx="14" fill="#ecfdf5" stroke="#059669" strokeWidth="2.2" />
      <path d="M30 6v28" stroke="#059669" strokeWidth="2" strokeDasharray="3 3" />
      <path d="M4 20h26" fill="#a7f3d0" opacity="0.5" />
    </svg>
  );
}

function SvgHeartRate() {
  return (
    <svg width="72" height="44" viewBox="0 0 72 44" fill="none">
      <rect x="2" y="2" width="68" height="40" rx="10" fill="#f0fdf4" stroke="#059669" strokeWidth="2" />
      <path d="M12 22h12l4-10 6 20 6-14 4 6h16" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SvgCross() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="18" y="6" width="12" height="36" rx="3" fill="#34d399" stroke="#059669" strokeWidth="2" />
      <rect x="6" y="18" width="36" height="12" rx="3" fill="#34d399" stroke="#059669" strokeWidth="2" />
    </svg>
  );
}

function SvgThermometer() {
  return (
    <svg width="36" height="68" viewBox="0 0 36 68" fill="none">
      <rect x="12" y="4" width="12" height="42" rx="6" fill="#ecfdf5" stroke="#059669" strokeWidth="2" />
      <circle cx="18" cy="52" r="10" fill="#a7f3d0" stroke="#059669" strokeWidth="2" />
      <line x1="18" y1="20" x2="18" y2="48" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const CLINIC_FLOAT_OBJECTS = [
  { Comp: SvgStethoscope, pos: { top: "6%", left: "2.5%" }, anim: { y: [-12, 10, -12], rotate: [-15, 8, -15] }, dur: 5.4, delay: 0 },
  { Comp: SvgSyringe, pos: { top: "12%", right: "3%" }, anim: { y: [8, -12, 8], rotate: [5, -7, 5] }, dur: 4.9, delay: 0.5 },
  { Comp: SvgPillCapsule, pos: { top: "45%", left: "1.5%" }, anim: { y: [-9, 12, -9], rotate: [0, 8, 0] }, dur: 6.2, delay: 1.0 },
  { Comp: SvgHeartRate, pos: { top: "68%", right: "2.5%" }, anim: { y: [10, -12, 10], rotate: [12, -8, 12] }, dur: 5.6, delay: 0.3 },
  { Comp: SvgCross, pos: { top: "30%", right: "2%" }, anim: { y: [-10, 8, -10], rotate: [0, 4, 0] }, dur: 7.1, delay: 0.8 },
  { Comp: SvgThermometer, pos: { top: "82%", left: "3%" }, anim: { y: [-7, 10, -7], rotate: [6, -5, 6] }, dur: 5.1, delay: 0.6 },
];

function FloatingClinicObjects() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {CLINIC_FLOAT_OBJECTS.map(({ Comp, pos, anim, dur, delay }, i) => (
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

/* ═══════════════════════════════════════════════════════
   GHOST SVG ILLUSTRATIONS (per feature card)
═══════════════════════════════════════════════════════ */
function WaveformGhost() {
  return (
    <svg width="160" height="80" viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.18 }}>
      {[8,20,36,28,46,18,38,24,44,16,34,22,40,14,30].map((h, i) => (
        <rect key={i} x={i * 10 + 4} y={(80 - h) / 2} width="5" height={h} rx="2.5" fill="#065F46" />
      ))}
    </svg>
  );
}

function ChatBubbleGhost() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.13 }}>
      <rect x="10" y="10" width="110" height="70" rx="18" fill="#065F46" />
      <polygon points="30,80 50,80 38,100" fill="#065F46" />
      <rect x="26" y="28" width="60" height="8" rx="4" fill="white" fillOpacity="0.6" />
      <rect x="26" y="44" width="44" height="8" rx="4" fill="white" fillOpacity="0.6" />
    </svg>
  );
}

function QRGhost({ size = 320 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="44" height="44" rx="6" stroke="currentColor" strokeWidth="6" fill="none" />
      <rect x="20" y="20" width="20" height="20" rx="2" fill="currentColor" />
      <rect x="68" y="8" width="44" height="44" rx="6" stroke="currentColor" strokeWidth="6" fill="none" />
      <rect x="80" y="20" width="20" height="20" rx="2" fill="currentColor" />
      <rect x="8" y="68" width="44" height="44" rx="6" stroke="currentColor" strokeWidth="6" fill="none" />
      <rect x="20" y="80" width="20" height="20" rx="2" fill="currentColor" />
      <rect x="68" y="68" width="12" height="12" rx="2" fill="currentColor" />
      <rect x="86" y="68" width="12" height="12" rx="2" fill="currentColor" />
      <rect x="100" y="68" width="12" height="12" rx="2" fill="currentColor" />
      <rect x="68" y="86" width="12" height="12" rx="2" fill="currentColor" />
      <rect x="100" y="86" width="12" height="12" rx="2" fill="currentColor" />
      <rect x="68" y="100" width="12" height="12" rx="2" fill="currentColor" />
      <rect x="86" y="100" width="26" height="12" rx="2" fill="currentColor" />
    </svg>
  );
}

function ChartLineGhost() {
  return (
    <svg width="160" height="80" viewBox="0 0 160 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.16 }}>
      <polyline points="8,68 36,48 64,54 92,28 120,38 152,14" stroke="#065F46" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {[8,36,64,92,120,152].map((x, i) => {
        const ys = [68, 48, 54, 28, 38, 14];
        return <circle key={i} cx={x} cy={ys[i]} r="5" fill="#065F46" />;
      })}
    </svg>
  );
}

function LanguageGhost() {
  return (
    <svg width="130" height="100" viewBox="0 0 130 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.14 }}>
      <circle cx="65" cy="50" r="44" stroke="#065F46" strokeWidth="5" fill="none" />
      <ellipse cx="65" cy="50" rx="20" ry="44" stroke="#065F46" strokeWidth="4" fill="none" />
      <line x1="21" y1="50" x2="109" y2="50" stroke="#065F46" strokeWidth="4" />
      <line x1="28" y1="28" x2="102" y2="28" stroke="#065F46" strokeWidth="3" />
      <line x1="28" y1="72" x2="102" y2="72" stroke="#065F46" strokeWidth="3" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   ROLES / THE TOKEN JOURNEY COMPONENT
═══════════════════════════════════════════════════════ */
function RolesTokenJourneySection({ ROLES }) {
  const sectionRef = useRef(null);
  const containerRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });
  
  const [activeStep, setActiveStep] = useState(-1);
  const [tokenPos, setTokenPos] = useState({ x: 16.66, opacity: 0 });
  const [hoveredCard, setHoveredCard] = useState(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const sliderRef = useRef(null);
  const autoSlideRef = useRef(null);
  const userTouchRef = useRef(false);
  const TOTAL_SLIDES = 3;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mq.matches);
    }
  }, []);

  // Auto-slide disabled to prevent viewport jumping

  useEffect(() => {
    if (!inView || reducedMotion || hoveredCard !== null) return;
    let timeoutIds = [];
    setTokenPos({ x: 16.66, opacity: 1 }); setActiveStep(2);
    timeoutIds.push(setTimeout(() => { if (hoveredCard === null) { setTokenPos({ x: 50, opacity: 1 }); setActiveStep(1); } }, 1200));
    timeoutIds.push(setTimeout(() => { if (hoveredCard === null) { setTokenPos({ x: 83.33, opacity: 1 }); setActiveStep(0); } }, 2400));
    const loopInterval = setInterval(() => {
      if (hoveredCard !== null) return;
      setTokenPos({ x: 16.66, opacity: 1 }); setActiveStep(2);
      timeoutIds.push(setTimeout(() => { if (hoveredCard === null) { setTokenPos({ x: 50, opacity: 1 }); setActiveStep(1); } }, 1500));
      timeoutIds.push(setTimeout(() => { if (hoveredCard === null) { setTokenPos({ x: 83.33, opacity: 1 }); setActiveStep(0); } }, 3000));
    }, 10000);
    return () => { timeoutIds.forEach(clearTimeout); clearInterval(loopInterval); };
  }, [inView, reducedMotion, hoveredCard]);

  const handleMouseEnter = (cardIndex) => {
    setHoveredCard(cardIndex);
    setActiveStep(cardIndex);
    const targetX = cardIndex === 2 ? 16.66 : cardIndex === 1 ? 50 : 83.33;
    setTokenPos({ x: targetX, opacity: 1 });
  };
  const handleMouseLeave = () => { setHoveredCard(null); };

  const resumeTimer = useRef(null);

  const handleTouchStart = () => {
    userTouchRef.current = true;
    clearTimeout(resumeTimer.current);
  };

  const handleTouchEnd = () => {
    resumeTimer.current = setTimeout(() => {
      userTouchRef.current = false;
    }, 6000);
  };

  // Track scroll position for dot indicator
  const handleSliderScroll = (e) => {
    const el = e.target;
    const idx = Math.round(el.scrollLeft / el.offsetWidth);
    setSlideIndex(idx);
  };

  const scrollToSlide = (idx) => {
    userTouchRef.current = true;
    clearTimeout(resumeTimer.current);
    if (sliderRef.current) {
      sliderRef.current.scrollTo({ left: idx * sliderRef.current.offsetWidth, behavior: "smooth" });
      setSlideIndex(idx);
    }
    resumeTimer.current = setTimeout(() => {
      userTouchRef.current = false;
    }, 6000);
  };

  const ORDERED_ROLES = [ROLES[2], ROLES[1], ROLES[0]];
  const MAPPED_INDICES = [2, 1, 0];

  return (
    <section className="cl-roles-section" id="roles" ref={sectionRef}>
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div className="cl-roles-wrapper">
          <div className="cl-roles-header">
            <Reveal>
              <span className="cl-eyebrow" style={{ color: "#34d399" }}>The Patient Queue Journey</span>
              <h2 className="cl-sec-title" style={{ color: "#ffffff" }}>One system. Three beneficiaries.</h2>
              <p className="cl-sec-sub" style={{ color: "rgba(241, 245, 249, 0.75)" }}>
                Watch a live token move through TokenPe — from patient check-in to doctor consultation.
              </p>
            </Reveal>
          </div>

          <div className="cl-journey-container" ref={containerRef}>
            {/* Curved SVG Connecting Path (desktop only) */}
            <svg className="cl-journey-path-svg" viewBox="0 0 1000 48" preserveAspectRatio="none">
              <defs>
                <linearGradient id="tokenPathGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#5eead4" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#34d399" stopOpacity="1" />
                  <stop offset="100%" stopColor="#5eead4" stopOpacity="0.95" />
                </linearGradient>
                <filter id="pathGlowFilter" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#34d399" floodOpacity="0.6" />
                </filter>
              </defs>
              <path d="M 166 24 Q 333 -4, 500 24 T 833 24" fill="none" stroke="url(#tokenPathGlow)" strokeWidth="3" strokeDasharray="8 6" filter="url(#pathGlowFilter)" />
            </svg>

            {/* Token pill (desktop only) */}
            {!reducedMotion && (
              <div className="cl-token-pill" style={{ left: `${tokenPos.x}%`, opacity: tokenPos.opacity }}>
                <div className="cl-token-pill-dot" />
                <span>{activeStep === 2 ? "For Patients" : activeStep === 1 ? "For Receptionists" : "For Doctors"}</span>
              </div>
            )}

            {/* ── Desktop Grid ── */}
            <div className="cl-roles-grid cl-roles-desktop">
              {ORDERED_ROLES.map((r, i) => {
                const originalIdx = MAPPED_INDICES[i];
                const isActive = activeStep === originalIdx;
                return (
                  <div
                    key={i}
                    className={`cl-role-card${isActive ? " active-step" : ""}`}
                    onMouseEnter={() => handleMouseEnter(originalIdx)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="cl-card-notch" />
                    <div className="cl-role-ghost-bg">
                      {originalIdx === 0 && <Stethoscope size={160} />}
                      {originalIdx === 1 && <Users size={160} />}
                      {originalIdx === 2 && <Zap size={160} />}
                    </div>
                    <div className="cl-role-icon">{r.icon}</div>
                    <div className="cl-role-tag">{r.tag}</div>
                    <h3 className="cl-role-h3">{r.title}</h3>
                    <p className="cl-role-p">{r.body}</p>
                  </div>
                );
              })}
            </div>

            {/* ── Mobile Snap Slider ── */}
            <div className="cl-roles-slider-wrap">
              <div
                className="cl-roles-slider"
                ref={sliderRef}
                onScroll={handleSliderScroll}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {ORDERED_ROLES.map((r, i) => {
                  const originalIdx = MAPPED_INDICES[i];
                  return (
                    <div key={i} className="cl-roles-slide">
                      <div className="cl-role-ghost-bg">
                        {originalIdx === 0 && <Stethoscope size={120} />}
                        {originalIdx === 1 && <Users size={120} />}
                        {originalIdx === 2 && <Zap size={120} />}
                      </div>
                      <div className="cl-role-icon">{r.icon}</div>
                      <div className="cl-role-tag">{r.tag}</div>
                      <h3 className="cl-role-h3">{r.title}</h3>
                      <p className="cl-role-p">{r.body}</p>
                    </div>
                  );
                })}
              </div>
              {/* Dot Indicators */}
              <div className="cl-roles-dots">
                {ORDERED_ROLES.map((_, i) => (
                  <button
                    key={i}
                    className={`cl-roles-dot${slideIndex === i ? " active" : ""}`}
                    onClick={() => scrollToSlide(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   SETUP INTERACTIVE TIMELINE (With Cartoon Art & Curved S-Path)
═══════════════════════════════════════════════════════ */
/* Rich 2D Cartoon SVG Illustration Screens for Phone Frame (Scaled Proportionally) */
function Step1QrCartoon() {
  return (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {/* Clinic Header Bar */}
      <div style={{ padding: "12px 16px 8px", background: "#0284c7", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 800 }}>City Care Clinic</span>
        <span style={{ fontSize: 9, background: "rgba(255,255,255,0.2)", padding: "2px 7px", borderRadius: 8 }}>OPD Desk</span>
      </div>

      {/* Main Cartoon Scene */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <svg width="210" height="215" viewBox="0 0 240 260" fill="none">
          {/* Background Wall Decor */}
          <rect x="20" y="20" width="80" height="40" rx="6" fill="#bae6fd" opacity="0.6" />
          <line x1="30" y1="35" x2="70" y2="35" stroke="#0284c7" strokeWidth="3" />
          <line x1="30" y1="45" x2="90" y2="45" stroke="#0284c7" strokeWidth="2" />
          
          {/* Reception Counter Desk */}
          <rect x="20" y="140" width="200" height="85" rx="16" fill="#0284c7" />
          <rect x="30" y="152" width="180" height="60" rx="10" fill="#38bdf8" />
          
          {/* Cartoon Receptionist Character */}
          <circle cx="120" cy="85" r="30" fill="#fde047" />
          <path d="M100 85 Q120 60 140 85" fill="#38bdf8" />
          <circle cx="120" cy="76" r="20" fill="#f87171" />
          {/* Eyes & Smile */}
          <circle cx="113" cy="75" r="2.5" fill="#0f172a" />
          <circle cx="127" cy="75" r="2.5" fill="#0f172a" />
          <path d="M115 82 Q120 87 125 82" stroke="#0f172a" strokeWidth="2" fill="none" />
          
          {/* Big QR Stand */}
          <rect x="150" y="95" width="50" height="60" rx="8" fill="#ffffff" stroke="#0f172a" strokeWidth="3.5" />
          {/* QR Pattern */}
          <rect x="160" y="105" width="30" height="30" fill="#0f172a" />
          <rect x="165" y="110" width="8" height="8" fill="#ffffff" />
          <rect x="177" y="122" width="8" height="8" fill="#ffffff" />

          {/* Patient Hand holding Phone Scanning */}
          <path d="M40 220 Q60 160 80 135" stroke="#fbbf24" strokeWidth="18" strokeLinecap="round" />
          <rect x="65" y="105" width="40" height="70" rx="8" fill="#0f172a" stroke="#ffffff" strokeWidth="2" />
          <rect x="70" y="112" width="30" height="56" rx="4" fill="#38bdf8" />
          {/* Scan Ray Cone */}
          <polygon points="105,140 150,110 150,140" fill="#38bdf8" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

function Step2QueueCartoon() {
  return (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {/* Live Status Header */}
      <div style={{ padding: "12px 16px 8px", background: "#15803d", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 800 }}>TokenPe Live Queue</span>
        <span style={{ fontSize: 9, background: "#22c55e", padding: "2px 7px", borderRadius: 8, fontWeight: 700 }}>2 Patients Ahead</span>
      </div>

      {/* Main Waiting Lounge Scene */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <svg width="210" height="215" viewBox="0 0 240 260" fill="none">
          {/* Live Queue Display Board */}
          <rect x="35" y="15" width="170" height="55" rx="12" fill="#0f172a" stroke="#22c55e" strokeWidth="3" />
          <text x="120" y="38" textAnchor="middle" fill="#4ade80" fontSize="11" fontWeight="800" letterSpacing="1">NOW SERVING</text>
          <text x="120" y="60" textAnchor="middle" fill="#ffffff" fontSize="20" fontWeight="900">T-100</text>

          {/* Comfortable Waiting Sofa */}
          <rect x="20" y="150" width="200" height="60" rx="18" fill="#16a34a" />
          <rect x="10" y="130" width="30" height="80" rx="10" fill="#15803d" />
          <rect x="200" y="130" width="30" height="80" rx="10" fill="#15803d" />

          {/* Cartoon Patient Sitting */}
          <circle cx="90" cy="95" r="26" fill="#fde047" />
          <circle cx="90" cy="86" r="18" fill="#3b82f6" />
          <path d="M68 150 C68 120, 112 120, 112 150" fill="#22c55e" />

          {/* Second Patient Sitting */}
          <circle cx="155" cy="98" r="24" fill="#fed7aa" />
          <circle cx="155" cy="90" r="16" fill="#f43f5e" />
          <path d="M135 150 C135 124, 175 124, 175 150" fill="#ec4899" />

          {/* Floating WhatsApp Phone Alert */}
          <rect x="70" y="185" width="100" height="38" rx="19" fill="#ffffff" stroke="#22c55e" strokeWidth="3" />
          <text x="120" y="208" textAnchor="middle" fill="#15803d" fontSize="13" fontWeight="900">#A-102 Active</text>
        </svg>
      </div>
    </div>
  );
}

function Step3DoctorCartoon() {
  return (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
      {/* Consultation Header */}
      <div style={{ padding: "12px 16px 8px", background: "#d97706", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 800 }}>Dr. Sharma's Cabin</span>
        <span style={{ fontSize: 9, background: "#f59e0b", padding: "2px 7px", borderRadius: 8, fontWeight: 700 }}>Ready</span>
      </div>

      {/* Main Doctor Cabin Scene */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <svg width="210" height="215" viewBox="0 0 240 260" fill="none">
          {/* Medical Cross Wall Chart */}
          <rect x="25" y="20" width="60" height="75" rx="8" fill="#ffffff" stroke="#f59e0b" strokeWidth="2.5" />
          <rect x="47" y="32" width="16" height="40" rx="3" fill="#ef4444" />
          <rect x="35" y="44" width="40" height="16" rx="3" fill="#ef4444" />

          {/* Doctor Desk */}
          <rect x="15" y="145" width="210" height="75" rx="14" fill="#b45309" />
          <rect x="25" y="155" width="190" height="50" rx="8" fill="#d97706" />

          {/* Doctor Character */}
          <circle cx="120" cy="82" r="32" fill="#fde047" />
          <circle cx="120" cy="72" r="22" fill="#64748b" />
          <path d="M88 145 L120 95 L152 145 Z" fill="#ffffff" />
          {/* Stethoscope */}
          <path d="M102 95 C102 120, 138 120, 138 95" stroke="#0284c7" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <circle cx="120" cy="122" r="7" fill="#0284c7" />

          {/* Calling Bell / Alert Banner */}
          <circle cx="185" cy="65" r="22" fill="#ef4444" />
          <path d="M175 65 L195 55 L195 75 Z" fill="#ffffff" />
        </svg>
      </div>
    </div>
  );
}

const SETUP_ARTWORK = [
  {
    Cartoon: Step1QrCartoon,
    notifHead: "QR Scan Complete",
    notifBody: "Scan confirmed! Token #A-102 issued for OPD Consultation.",
    notifTime: "Just now",
  },
  {
    Cartoon: Step2QueueCartoon,
    notifHead: "WhatsApp • Live Queue Update",
    notifBody: "You are #2 in queue. Estimated wait time: ~8 minutes.",
    notifTime: "10:14 AM",
  },
  {
    Cartoon: Step3DoctorCartoon,
    notifHead: "WhatsApp • Doctor Alert",
    notifBody: "Your token (A-102) is next! Please proceed to Cabin 4.",
    notifTime: "10:22 AM",
  },
];

function SetupInteractiveTimeline() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="cl-how-section" id="how" style={{ position: "relative", overflow: "hidden" }}>
      {/* Dynamic Background Ghost Element (Fills section background on hover) */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 0.35, scale: 1.05, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.2, rotate: 10 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              position: "absolute",
              top: "10%",
              left: "2%",
              color: "#059669",
              filter: "drop-shadow(0 0 16px rgba(16, 185, 129, 0.4))",
            }}
          >
            {activeStep === 0 && <QRGhost size={320} />}
            {activeStep === 1 && <Bell size={320} />}
            {activeStep === 2 && <Stethoscope size={320} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="cl-timeline-layout" style={{ position: "relative", zIndex: 2 }}>
        {/* Left Column: Title & Vertical Timeline */}
        <div>
          <Reveal>
            <h2 className="cl-sec-title" style={{ fontSize: 34, lineHeight: 1.25, marginBottom: 36 }}>
              Seamless Journey.<br />Zero Friction.
            </h2>
          </Reveal>

          <div className="cl-timeline-container">
            {/* Curved SVG Dotted Line */}
            <svg className="cl-timeline-line-svg" viewBox="0 0 50 300" preserveAspectRatio="none">
              <path
                d="M 24,10 C 45,60 -5,120 24,170 C 45,220 -5,270 24,290"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                opacity="0.6"
              />
            </svg>

            {/* Step 1: Scan QR */}
            <div
              className={`cl-timeline-step${activeStep === 0 ? " active" : ""}`}
              onMouseEnter={() => setActiveStep(0)}
            >
              <div className="cl-timeline-badge">1</div>
              <div className="cl-timeline-card-wrap">
                <div className="cl-timeline-card">
                  <h3 className="cl-timeline-h3">Scan QR</h3>
                  <p className="cl-timeline-p">Patient arrives and scans the desk QR code.</p>
                </div>
              </div>
            </div>

            {/* Step 2: Receive Update */}
            <div
              className={`cl-timeline-step${activeStep === 1 ? " active" : ""}`}
              onMouseEnter={() => setActiveStep(1)}
            >
              <div className="cl-timeline-badge">2</div>
              <div className="cl-timeline-card-wrap">
                <div className="cl-timeline-card">
                  <h3 className="cl-timeline-h3">Receive Update</h3>
                  <p className="cl-timeline-p">Live status and token number sent via WhatsApp.</p>
                </div>
              </div>
            </div>

            {/* Step 3: Consultation */}
            <div
              className={`cl-timeline-step${activeStep === 2 ? " active" : ""}`}
              onMouseEnter={() => setActiveStep(2)}
            >
              <div className="cl-timeline-badge">3</div>
              <div className="cl-timeline-card-wrap">
                <div className="cl-timeline-card">
                  <h3 className="cl-timeline-h3">Consultation</h3>
                  <p className="cl-timeline-p">Doctor calls patient when ready.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Smartphone Lockscreen Mockup */}
        <div className="cl-phone-wrap">
          <motion.div
            className="cl-phone-frame"
            key={activeStep}
            initial={{ opacity: 0.8, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="cl-phone-screen" style={{ padding: 0 }}>
              {(() => {
                const CartoonComp = SETUP_ARTWORK[activeStep].Cartoon;
                return <CartoonComp />;
              })()}
              <motion.div
                className="cl-phone-notif"
                style={{ position: "absolute", bottom: 40, left: 16, right: 16 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.45, ease: "backOut" }}
              >
                <div className="cl-notif-header">
                  <span>{SETUP_ARTWORK[activeStep].notifHead}</span>
                  <span style={{ fontSize: 10, color: "#64748b" }}>{SETUP_ARTWORK[activeStep].notifTime}</span>
                </div>
                <div className="cl-notif-body">
                  {SETUP_ARTWORK[activeStep].notifBody}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function ShieldGhost() {
  return (
    <svg width="110" height="130" viewBox="0 0 110 130" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.14 }}>
      <path d="M55 8 L102 28 L102 72 C102 98 78 118 55 124 C32 118 8 98 8 72 L8 28 Z" stroke="#065F46" strokeWidth="5" fill="none" />
      <polyline points="34,65 50,82 76,52" stroke="#065F46" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function ClinicLandingPage({ config }) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Features Mobile Slider State
  const [featSlideIndex, setFeatSlideIndex] = useState(0);
  const featSliderRef = useRef(null);
  const featUserTouchRef = useRef(false);
  const featResumeTimer = useRef(null);

  // Command Center Interactive Tooltips State
  const [hoveredBar, setHoveredBar] = useState(null); // index or null
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState(null); // index or null
  const [trendMouseY, setTrendMouseY] = useState(40); // Y offset
  const [barMouseY, setBarMouseY] = useState(30); // Y offset for bars

  // Request Demo Modal State
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoEmail, setDemoEmail] = useState("");
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    if (!demoEmail.trim()) return;
    setDemoLoading(true);
    setTimeout(() => {
      setDemoLoading(false);
      setDemoSubmitted(true);
    }, 800);
  };

  const openDemoModal = () => {
    setDemoSubmitted(false);
    setDemoEmail("");
    setDemoModalOpen(true);
  };

  const handleTrendMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const clampedY = Math.max(15, Math.min(offsetY - 20, rect.height - 75));
    setTrendMouseY(clampedY);
  };

  const handleBarMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const clampedY = Math.max(10, Math.min(offsetY - 20, rect.height - 65));
    setBarMouseY(clampedY);
  };

  // Close menu on route change or resize
  useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, []);

  // Features Slider Event Handlers (manual swipe & dot navigation)

  const handleFeatSliderScroll = (e) => {
    const el = e.target;
    const slide = el.querySelector(".cl-feat-slide");
    if (!slide) return;
    const slideWidth = slide.offsetWidth + 16; // width + gap
    const idx = Math.round(el.scrollLeft / slideWidth);
    if (idx >= 0 && idx < 4) {
      setFeatSlideIndex(idx);
    }
  };

  const handleFeatTouchStart = () => {
    featUserTouchRef.current = true;
    clearTimeout(featResumeTimer.current);
  };

  const handleFeatTouchEnd = () => {
    featResumeTimer.current = setTimeout(() => {
      featUserTouchRef.current = false;
    }, 6000);
  };

  const scrollToFeatSlide = (idx) => {
    featUserTouchRef.current = true;
    clearTimeout(featResumeTimer.current);
    if (featSliderRef.current) {
      const slide = featSliderRef.current.querySelector(".cl-feat-slide");
      const slideWidth = slide ? slide.offsetWidth + 16 : featSliderRef.current.offsetWidth;
      featSliderRef.current.scrollTo({
        left: idx * slideWidth,
        behavior: "smooth",
      });
      setFeatSlideIndex(idx);
    }
    featResumeTimer.current = setTimeout(() => {
      featUserTouchRef.current = false;
    }, 6000);
  };

  // Smooth scrolling disabled for native scroll stability

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    router.push(searchQuery.trim() ? `/find?q=${encodeURIComponent(searchQuery)}` : "/find");
  };

  const go = (id) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  /* ── Data ── */
  const STATS = [
    { n: 4200, suf: "+", label: "Clinics Onboarded" },
    { n: 98, suf: "%", label: "Patient Satisfaction" },
    { n: 2, suf: " min", label: "Setup Time" },
    { n: 50, suf: "+", label: "Patients Managed Daily" },
  ];

  const ROLES = [
    {
      icon: <Stethoscope size={24} />, tag: "For Doctors",
      title: "Focus on healing, not crowd control",
      body: "Eliminate the chaos of a noisy waiting room. Maintain a calm clinic environment and see every patient precisely when they're ready.",
      accent: "#065F46",
    },
    {
      icon: <Users size={24} />, tag: "For Receptionists",
      title: "Automate token calling in one tap",
      body: "Stop answering \"how much longer?\" every five minutes. One tap sends live WhatsApp alerts to the next five patients in queue automatically.",
      accent: "#065F46",
    },
    {
      icon: <Zap size={24} />, tag: "For Patients",
      title: "Wait comfortably from anywhere",
      body: "Patients scan a QR code, join the queue, then wait in their car or at home. Real-time WhatsApp updates keep them informed of their live position.",
      accent: "#065F46",
    },
  ];

  const HOW = [
    { n: "01", icon: <QrCode size={26} />, title: "Print your QR Code", body: "Sign up, generate your unique clinic QR code and place it on your reception desk. Done in under 2 minutes." },
    { n: "02", icon: <MessageSquare size={26} />, title: "Patients scan & join", body: "Walk-in patients scan the QR with their camera and instantly join the WhatsApp queue — no app download needed." },
    { n: "03", icon: <Bell size={26} />, title: "Call next & notify", body: "Tap 'Call Next'. The patient receives a WhatsApp notification instantly and walks in — effortless for everyone." },
  ];

  const FEATURES = [
    {
      icon: <Bell size={20} />,
      title: "Smart Patient Calling",
      bullets: ["One-click \"Call Next\"", "Voice announcements", "Multi-language support"],
      Ghost: () => (
        <div style={{ position: "relative", width: 220, height: 140 }}>
          {/* Subtle waveform graphic bottom left */}
          <div style={{ position: "absolute", bottom: 10, left: -20, display: "flex", gap: 5, alignItems: "center", opacity: 0.15 }}>
            {[10, 18, 30, 22, 38, 16, 32, 20, 36, 14, 28, 18, 34, 12, 24].map((h, i) => (
              <div key={i} style={{ width: 4, height: h, borderRadius: 2, background: "#065F46" }} />
            ))}
          </div>
          {/* Giant ghost Megaphone stroke outline bottom right */}
          <svg width="180" height="150" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", bottom: -25, right: -25, opacity: 0.08 }}>
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        </div>
      ),
    },
    {
      icon: <MessageSquare size={20} />,
      title: "WhatsApp Queue Updates",
      bullets: ["Join queue remotely", "Live position updates", "Automatic reminders"],
      Ghost: () => (
        <div style={{ position: "relative", width: 220, height: 140 }}>
          {/* Subtle dot matrix bottom left */}
          <div style={{ position: "absolute", bottom: 20, left: 0, display: "grid", gridTemplateColumns: "repeat(6, 6px)", gap: 8, opacity: 0.15 }}>
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#065F46" }} />
            ))}
          </div>
          {/* Giant ghost Chat Bubble outline bottom right */}
          <svg width="190" height="160" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", bottom: -30, right: -25, opacity: 0.08 }}>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>
      ),
    },
    {
      icon: <QrCode size={20} />,
      title: "QR Check-In",
      bullets: ["Scan and join instantly", "No app required", "Contactless reception flow"],
      Ghost: () => (
        <div style={{ position: "relative", width: 220, height: 140 }}>
          {/* Subtle dot cluster bottom left */}
          <div style={{ position: "absolute", bottom: 15, left: -10, display: "flex", gap: 6, opacity: 0.15 }}>
            <div style={{ width: 6, height: 6, borderRadius: 2, background: "#065F46" }} />
            <div style={{ width: 6, height: 6, borderRadius: 2, background: "#065F46", marginTop: 8 }} />
            <div style={{ width: 6, height: 6, borderRadius: 2, background: "#065F46" }} />
            <div style={{ width: 6, height: 6, borderRadius: 2, background: "#065F46", marginTop: 4 }} />
          </div>
          {/* Giant ghost QR Code stroke outline bottom right */}
          <svg width="190" height="170" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", bottom: -35, right: -25, opacity: 0.08 }}>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
      ),
    },
    {
      icon: <BarChart3 size={20} />,
      title: "Real-Time Dashboard",
      bullets: ["Waiting · With Doctor · Completed", "Average wait time", "Reception performance"],
      Ghost: () => (
        <div style={{ position: "relative", width: 220, height: 140 }}>
          {/* Subtle wavy trend line bottom left */}
          <svg width="120" height="40" viewBox="0 0 120 40" fill="none" stroke="#065F46" strokeWidth="2" strokeDasharray="3 3" style={{ position: "absolute", bottom: 20, left: -10, opacity: 0.25 }}>
            <path d="M0 30 Q 30 5, 60 25 T 120 10" />
          </svg>
          {/* Giant ghost Dashboard Layout Grid bottom right */}
          <svg width="180" height="150" viewBox="0 0 24 24" fill="none" stroke="#065F46" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", bottom: -25, right: -20, opacity: 0.08 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>
      ),
    },
  ];

  const TESTIMONIALS = [
    { quote: "TokenPe eliminated the chaos at my OPD completely. My waiting room is now calm and my staff is stress-free.", name: "Dr. Priya Sharma", role: "General Physician, Mumbai", stars: 5 },
    { quote: "Patients love getting WhatsApp updates. We saw a 40% drop in no-shows within the first week of using TokenPe.", name: "Dr. Rakesh Nair", role: "Cardiologist, Bangalore", stars: 5 },
    { quote: "Setup took literally 90 seconds. I printed the QR, stuck it on the desk, and we were live. Absolutely brilliant.", name: "Dr. Anita Menon", role: "Pediatrician, Kochi", stars: 5 },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html {
          scroll-behavior: smooth !important;
          scroll-padding-top: 68px;
          overflow-y: auto;
          overscroll-behavior-y: none;
        }
        body {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: #e8f7f1;
          color: #1a3d2b;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* ── SCROLLBAR ── */
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(6,95,70,0.3); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(6,95,70,0.5); }

        @keyframes caret { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

        /* ── TOPBAR ── */
        .cl-topbar {
          background: #043828;
          color: #a7f3d0;
          text-align: center;
          padding: 8px 24px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.2px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .cl-topbar a { color: #5eead4; text-decoration: none; font-weight: 700; }
        .cl-topbar a:hover { text-decoration: underline; }

        /* ── NAV (PERMANENT FIXED TOPBAR) ── */
        .cl-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 99999;
          background: #ffffff;
          border-bottom: 2px solid rgba(6, 95, 70, 0.15);
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
        }
        .cl-nav-inner {
          max-width: 1160px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          height: 68px;
          position: relative;
        }
        .cl-nav-links {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .cl-nl {
          color: #065F46;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .cl-nl:hover { color: #047857; text-decoration: underline; }
        .cl-nav-cta {
          background: #065F46;
          color: #ffffff;
          padding: 10px 22px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14.5px;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 14px rgba(6, 95, 70, 0.22);
        }
        .cl-nav-cta:hover {
          background: #047857;
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(6, 95, 70, 0.32);
        }

        /* ── HERO ── */
        .cl-hero-wrap {
          position: relative;
          overflow: hidden;
          min-height: 90vh;
          padding-top: 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #e8f7f1;
        }
        .cl-hero-texture {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(circle, rgba(6,95,70,0.05) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .cl-hero {
          padding: 96px 24px 80px;
          text-align: center;
          max-width: 840px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }
        .cl-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(6, 95, 70, 0.08);
          border: 1px solid rgba(6, 95, 70, 0.16);
          color: #065F46;
          padding: 6px 15px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 28px;
          letter-spacing: 0.1px;
        }
        .cl-h1 {
          font-size: 55px;
          font-weight: 900;
          line-height: 1.13;
          letter-spacing: -0.03em;
          margin-bottom: 20px;
          color: #0d2b1e;
        }
        .cl-h1-accent {
          color: #065F46;
        }
        .cl-sub {
          font-size: 18px;
          color: rgba(26,61,43,0.65);
          line-height: 1.7;
          margin-bottom: 42px;
          max-width: 620px;
          margin-inline: auto;
          font-weight: 400;
        }

        /* ── SEARCH ── */
        .cl-search-box {
          background: #fff;
          border: 1.5px solid rgba(6, 95, 70, 0.14);
          border-radius: 14px;
          padding: 6px 6px 6px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 460px;
          margin: 0 auto 32px;
          box-shadow: 0 4px 24px rgba(6, 95, 70, 0.08);
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .cl-search-box:focus-within {
          border-color: rgba(6, 95, 70, 0.35);
          box-shadow: 0 4px 24px rgba(6, 95, 70, 0.14), 0 0 0 4px rgba(6,95,70,0.06);
        }
        .cl-search-input {
          flex: 1; background: transparent; border: none;
          color: #1a3d2b; font-size: 15px; font-family: inherit;
          font-weight: 500; outline: none; padding: 9px 0;
        }
        .cl-search-input::placeholder { color: rgba(26,61,43,0.38); }
        .cl-search-btn {
          background: #065F46; color: #fff;
          border: none; border-radius: 10px;
          padding: 10px 20px; font-weight: 700;
          font-size: 14px; cursor: pointer; font-family: inherit;
          transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
          white-space: nowrap;
        }
        .cl-search-btn:hover {
          background: #047857;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(6,95,70,0.28);
        }

        /* ── CTA BUTTONS ── */
        .cl-cta-group {
          display: flex; gap: 12px;
          justify-content: center; align-items: center; flex-wrap: wrap;
        }
        .cl-btn-primary {
          background: #065F46; color: #fff;
          border: none; padding: 13px 28px;
          border-radius: 12px; font-weight: 800;
          font-size: 15px; cursor: pointer; font-family: inherit;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 4px 16px rgba(6, 95, 70, 0.28);
          display: flex; align-items: center; gap: 8px;
        }
        .cl-btn-primary:hover {
          background: #047857;
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(6, 95, 70, 0.38);
        }
        .cl-btn-ghost {
          background: transparent; color: rgba(26,61,43,0.7);
          border: 1.5px solid rgba(6, 95, 70, 0.2);
          padding: 13px 22px; border-radius: 12px;
          font-weight: 600; font-size: 15px; cursor: pointer;
          font-family: inherit;
          transition: all 0.22s ease;
          display: flex; align-items: center; gap: 7px;
        }
        .cl-btn-ghost:hover {
          border-color: rgba(6, 95, 70, 0.4);
          color: #065F46;
          background: rgba(6, 95, 70, 0.04);
        }

        /* ── STATS STRIP ── */
        .cl-stats-strip {
          background: #fff;
          border-top: 1px solid rgba(6,95,70,0.08);
          border-bottom: 1px solid rgba(6,95,70,0.08);
          padding: 40px 24px;
        }
        .cl-stats-inner {
          max-width: 860px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 24px; text-align: center;
        }
        .cl-stat-n {
          font-size: 38px; font-weight: 900;
          letter-spacing: -0.04em; color: #065F46;
          line-height: 1; margin-bottom: 6px;
        }
        .cl-stat-l {
          font-size: 13px; font-weight: 600;
          color: rgba(26,61,43,0.5); letter-spacing: 0.1px;
        }

        /* ── SECTIONS ── */
        .cl-sec {
          padding: 96px 24px;
          max-width: 1160px;
          margin: 0 auto;
        }
        .cl-eyebrow {
          display: inline-block; font-size: 11.5px;
          font-weight: 800; letter-spacing: 0.1em;
          text-transform: uppercase; color: #10b981;
          margin-bottom: 12px;
        }
        .cl-sec-title {
          font-size: 38px; font-weight: 900;
          margin-bottom: 14px; color: #0d2b1e;
          letter-spacing: -0.03em; line-height: 1.2;
        }
        .cl-sec-sub {
          font-size: 16.5px; color: rgba(26,61,43,0.6);
          margin-bottom: 56px; max-width: 520px;
          line-height: 1.65;
        }

        /* ── ROLES / THE TOKEN JOURNEY (FULL-WIDTH MATTE BAND) ── */
        .cl-roles-section {
          width: 100vw;
          position: relative;
          left: 50%;
          right: 50%;
          margin-left: -50vw;
          margin-right: -50vw;
          background-color: #206650;
          padding: 100px 0;
          overflow: hidden;
        }
        /* Closely packed ghost dot-grid texture overlay */
        .cl-roles-section::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(255, 255, 255, 0.08) 1.2px, transparent 1.2px);
          background-size: 16px 16px;
          pointer-events: none;
          z-index: 1;
        }
        /* Fine dusty noise overlay */
        .cl-roles-section::after {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
        }
        .cl-roles-wrapper {
          max-width: 1160px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 2;
        }
        .cl-roles-header {
          position: relative; z-index: 2; margin-bottom: 44px; text-align: left;
        }

        /* Connecting Path & Token Container */
        .cl-journey-container {
          position: relative;
          z-index: 2;
        }
        .cl-journey-path-svg {
          position: absolute;
          top: -24px;
          left: 0;
          width: 100%;
          height: 48px;
          pointer-events: none;
          z-index: 3;
          overflow: visible;
        }

        /* Floating Token Pill (Clean Matte Clinical Badge) */
        .cl-token-pill {
          position: absolute;
          top: -38px;
          left: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 7px;
          background: #ffffff;
          border: 1px solid rgba(6, 95, 70, 0.2);
          color: #065F46;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: 0.2px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
          pointer-events: none;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
          transform: translate(-50%, -50%);
        }
        .cl-token-pill-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
        }
        @keyframes tokenDotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }

        /* Roles Grid & Cards (High-Contrast Crisp Cards) */
        .cl-roles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          position: relative;
          z-index: 2;
        }
        .cl-role-card {
          background: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 22px;
          padding: 40px 32px 36px;
          position: relative;
          box-shadow: 0 12px 32px rgba(4, 40, 28, 0.22);
          transition: background 0.35s ease, transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease, box-shadow 0.35s ease;
          overflow: hidden;
          cursor: pointer;
        }
        .cl-role-card.active-step {
          background: #ffffff;
          border-color: #34d399;
          transform: translateY(-5px);
          box-shadow: 0 16px 40px rgba(4, 40, 28, 0.3), 0 0 0 3px rgba(52, 211, 153, 0.4);
        }
        .cl-role-card:hover {
          background: #ffffff;
          border-color: #34d399;
          transform: translateY(-6px);
          box-shadow: 0 20px 48px rgba(4, 40, 28, 0.35);
        }
        .cl-role-card > * { position: relative; z-index: 2; }

        /* Connection Notch Points */
        .cl-card-notch {
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 12px;
          height: 12px;
          background: #206650;
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          z-index: 4;
          transition: border-color 0.3s ease, background 0.3s ease;
        }
        .cl-role-card.active-step .cl-card-notch,
        .cl-role-card:hover .cl-card-notch {
          background: #10b981;
          border-color: #ffffff;
          box-shadow: 0 0 8px #34d399;
        }

        .cl-role-ghost-bg {
          position: absolute;
          bottom: -20px; right: -20px;
          color: #10b981;
          opacity: 0.15;
          z-index: 1;
          pointer-events: none;
          transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease, color 0.4s ease, filter 0.4s ease;
          transform: scale(0.96) rotate(0deg);
          filter: drop-shadow(0 0 0px transparent);
        }
        .cl-role-card.active-step .cl-role-ghost-bg,
        .cl-role-card:hover .cl-role-ghost-bg {
          opacity: 0.45;
          color: #059669;
          transform: scale(1.18) rotate(10deg) translate(-8px, -8px);
          filter: drop-shadow(0 0 16px rgba(16, 185, 129, 0.5));
        }
        .cl-role-icon {
          width: 46px; height: 46px;
          background: #e6f4ee;
          border: 1px solid rgba(6, 95, 70, 0.12);
          border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          color: #065F46; margin-bottom: 22px;
          transition: transform 0.3s ease, background 0.3s ease;
        }
        .cl-role-card.active-step .cl-role-icon,
        .cl-role-card:hover .cl-role-icon {
          transform: translateY(-2px);
          background: #dcfce7;
          color: #047857;
        }
        .cl-role-tag {
          font-size: 11.5px; font-weight: 800;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #059669; margin-bottom: 12px;
        }
        .cl-role-h3 {
          font-size: 21px; font-weight: 800;
          margin-bottom: 14px; color: #0d2b1e;
          line-height: 1.25; letter-spacing: -0.02em;
        }
        .cl-role-p {
          font-size: 14.5px; color: #475569; line-height: 1.65; font-weight: 500;
        }

        @media (max-width: 960px) {
          .cl-roles-wrapper { padding: 40px 24px; }
          .cl-roles-grid { grid-template-columns: 1fr; gap: 24px; }
          .cl-journey-path-svg, .cl-token-pill { display: none; }
          .cl-card-notch { display: none; }
        }

        /* ── STATS STRIP ── */
        .cl-stats-strip {
          background: #e8f7f1;
          border-top: 1px solid rgba(6,95,70,0.08);
          border-bottom: 1px solid rgba(6,95,70,0.08);
          padding: 40px 24px;
        }
        .cl-stats-inner {
          max-width: 860px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 24px; text-align: center;
        }
        .cl-stat-n {
          font-size: 38px; font-weight: 900;
          letter-spacing: -0.04em; color: #065F46;
          line-height: 1; margin-bottom: 6px;
        }
        .cl-stat-l {
          font-size: 13px; font-weight: 600;
          color: rgba(26,61,43,0.5); letter-spacing: 0.1px;
        }

        /* ── SECTIONS ── */
        .cl-sec {
          padding: 96px 24px;
          max-width: 1160px;
          margin: 0 auto;
        }

        /* ── HOW IT WORKS / TIMELINE LAYOUT (MATCHING REFERENCE UI) ── */
        .cl-how-section {
          background: #f8faf9;
          border-top: 1px solid rgba(6,95,70,0.06);
          border-bottom: 1px solid rgba(6,95,70,0.06);
          padding: 80px 24px 100px;
        }
        /* ── HOW IT WORKS / TIMELINE LAYOUT (FIXED ALIGNMENT & HOVER PHYSICS) ── */
        .cl-how-section {
          background: #f8faf9;
          border-top: 1px solid rgba(6,95,70,0.06);
          border-bottom: 1px solid rgba(6,95,70,0.06);
          padding: 90px 24px 110px;
        }
        .cl-timeline-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
          max-width: 1160px;
          margin: 0 auto;
        }
        .cl-timeline-container {
          position: relative;
          padding: 10px 0;
        }
        /* Curved Aesthetic Dotted Path */
        .cl-timeline-line-svg {
          position: absolute;
          left: 0;
          top: 20px;
          bottom: 20px;
          width: 50px;
          height: calc(100% - 40px);
          pointer-events: none;
          z-index: 1;
        }
        .cl-timeline-step {
          display: flex;
          align-items: center;
          margin-bottom: 32px;
          position: relative;
          z-index: 2;
          cursor: pointer;
        }
        .cl-timeline-step:last-child {
          margin-bottom: 0;
        }
        .cl-timeline-card-wrap {
          margin-left: 68px;
          width: 100%;
        }

        /* Numbered Step Circle Badge */
        .cl-timeline-badge {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #94a3b8;
          color: #475569;
          font-weight: 800;
          font-size: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: absolute;
          left: 24px;
          transform: translateX(-50%);
          z-index: 3;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cl-timeline-step:hover .cl-timeline-badge,
        .cl-timeline-step.active .cl-timeline-badge {
          border-color: #065F46;
          background: #065F46;
          color: #ffffff;
          box-shadow: 0 0 0 6px rgba(6, 95, 70, 0.15), 0 6px 16px rgba(6, 95, 70, 0.25);
          transform: translateX(-50%) scale(1.1);
        }

        /* White Step Card */
        .cl-timeline-card {
          background: #ffffff;
          border: 1.5px solid rgba(6, 95, 70, 0.09);
          border-radius: 20px;
          padding: 24px 28px;
          box-shadow: 0 8px 24px rgba(6, 95, 70, 0.04);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease;
          position: relative;
          overflow: hidden;
        }
        .cl-timeline-card > * { position: relative; z-index: 2; }
        
        .cl-step-ghost-bg {
          position: absolute;
          bottom: -15px; right: -15px;
          color: #065F46;
          opacity: 0.07;
          z-index: 1;
          pointer-events: none;
          transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease, filter 0.4s ease;
          transform: scale(0.9) rotate(0deg);
        }
        .cl-timeline-step:hover .cl-step-ghost-bg,
        .cl-timeline-step.active .cl-step-ghost-bg {
          opacity: 0.28;
          color: #059669;
          transform: scale(1.15) rotate(8deg) translate(-6px, -6px);
          filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.4));
        }

        .cl-timeline-step:hover .cl-timeline-card,
        .cl-timeline-step.active .cl-timeline-card {
          transform: translateX(6px);
          border-color: #065F46;
          box-shadow: 0 14px 36px rgba(6, 95, 70, 0.1);
        }
        .cl-timeline-h3 {
          font-size: 19px;
          font-weight: 800;
          color: #0d2b1e;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }
        .cl-timeline-p {
          font-size: 14px;
          color: #64748b;
          line-height: 1.6;
          font-weight: 500;
        }

        /* Right Side Phone Mockup (Scaled Down Vertically) */
        .cl-phone-wrap {
          position: relative;
          display: flex;
          justify-content: center;
        }
        .cl-phone-frame {
          position: relative;
          width: 290px;
          height: 490px;
          background: #0f172a;
          border-radius: 40px;
          padding: 9px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
          transform: rotate(2deg) translateY(-4px);
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cl-phone-frame:hover {
          transform: rotate(0deg) translateY(-8px);
        }
        .cl-phone-screen {
          width: 100%;
          height: 100%;
          border-radius: 32px;
          overflow: hidden;
          position: relative;
          background-size: cover;
          background-position: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0;
        }
        /* WhatsApp Floating Lockscreen Notification */
        .cl-phone-notif {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(16px);
          border-radius: 18px;
          padding: 14px 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.18);
          border: 1px solid rgba(255,255,255,0.4);
          transform: translateY(-40px);
        }
        .cl-notif-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #25d366;
        }
        .cl-notif-body {
          font-size: 13.5px;
          color: #1e293b;
          font-weight: 600;
          line-height: 1.4;
        }

        @media (max-width: 960px) {
          .cl-timeline-layout { grid-template-columns: 1fr; gap: 40px; }
          .cl-timeline-line, .cl-timeline-badge { left: 24px; }
          .cl-timeline-step.left-step, .cl-timeline-step.right-step { flex-direction: row; justify-content: flex-start; }
          .cl-timeline-step.left-step .cl-timeline-card-wrap, .cl-timeline-step.right-step .cl-timeline-card-wrap { margin-left: 64px; margin-right: 0; }
          .cl-timeline-card { width: 100%; }
          .cl-phone-frame { width: 300px; height: 540px; transform: none; margin: 0 auto; }
        }

        /* ── FEATURES (ASYMMETRIC BENTO GRID: RECT, SQ, SQ, RECT) ── */
        .cl-feat-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 24px;
        }
        .cl-feat-card {
          background: #ffffff;
          border: 1.5px solid rgba(6, 95, 70, 0.08);
          border-radius: 28px;
          padding: 38px 40px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 6px 24px rgba(6, 95, 70, 0.03);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      box-shadow 0.35s ease, border-color 0.3s ease, background 0.4s ease;
          min-height: 270px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        /* Asymmetric Bento Layout: Rectangle (7 cols), Square (5 cols), Square (5 cols), Rectangle (7 cols) */
        .cl-feat-col.feat-rect-1 { grid-column: span 7; }
        .cl-feat-col.feat-sq-1   { grid-column: span 5; }
        .cl-feat-col.feat-sq-2   { grid-column: span 5; }
        .cl-feat-col.feat-rect-2 { grid-column: span 7; }
        .cl-feat-card { width: 100%; height: 100%; }
        .cl-feat-card:hover {
          transform: translateY(-5px);
          background: linear-gradient(145deg, #ffffff 40%, #dcfce7 100%);
          box-shadow: 0 16px 40px rgba(6, 95, 70, 0.12);
          border-color: #34d399;
        }
        .cl-feat-card > * { position: relative; z-index: 1; }
        .cl-feat-ghost {
          position: absolute;
          bottom: -15px; right: -15px;
          z-index: 0;
          pointer-events: none;
          opacity: 0.65;
          color: #065F46;
          transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
                      opacity 0.4s ease, filter 0.4s ease, color 0.4s ease;
          transform: scale(0.95) rotate(0deg);
          filter: drop-shadow(0 0 0px transparent);
        }
        .cl-feat-card:hover .cl-feat-ghost {
          transform: scale(1.18) rotate(8deg) translate(-8px, -8px);
          opacity: 1;
          color: #059669;
          filter: drop-shadow(0 0 16px rgba(16, 185, 129, 0.45));
        }
        .cl-feat-icon {
          width: 44px; height: 44px;
          background: #e6f4ee;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: #065F46; margin-bottom: 22px;
        }
        .cl-feat-title {
          font-size: 22px; font-weight: 800;
          color: #0d2b1e; margin-bottom: 18px;
          letter-spacing: -0.02em; line-height: 1.25;
        }
        .cl-feat-bullets {
          list-style: none; display: flex; flex-direction: column; gap: 12px;
        }
        .cl-feat-bullet {
          display: flex; align-items: center; gap: 10px;
          font-size: 14.5px; color: #475569; font-weight: 600;
        }
        .cl-feat-check {
          width: 17px; height: 17px; flex-shrink: 0;
          color: #10b981;
        }

        /* ── TESTIMONIALS ── */
        .cl-test-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        .cl-test-card {
          background: #fff;
          border: 1.5px solid rgba(6, 95, 70, 0.09);
          border-radius: 20px;
          padding: 30px 26px;
          display: flex; flex-direction: column;
          transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), border-color 0.22s ease;
        }
        .cl-test-card:hover {
          transform: translateY(-5px);
          border-color: rgba(6, 95, 70, 0.2);
          box-shadow: 0 14px 36px rgba(6,95,70,0.08);
        }
        .cl-stars { display: flex; gap: 3px; margin-bottom: 16px; }
        .cl-test-q {
          font-size: 15px; color: rgba(26,61,43,0.78);
          line-height: 1.7; font-style: italic; flex: 1; margin-bottom: 20px;
        }
        .cl-test-name { font-size: 14px; font-weight: 800; color: #065F46; margin-bottom: 2px; }
        /* ── LOOPING TICKER STRIP ── */
        .cl-ticker-strip {
          background: #f4faf7;
          border-top: 1px solid rgba(6, 95, 70, 0.08);
          border-bottom: 1px solid rgba(6, 95, 70, 0.08);
          overflow: hidden;
          padding: 16px 0;
          white-space: nowrap;
          display: flex;
          user-select: none;
        }
        .cl-ticker-track {
          display: flex;
          width: max-content;
          animation: cl-marquee-scroll 35s linear infinite;
        }
        .cl-ticker-strip:hover .cl-ticker-track {
          animation-play-state: paused;
        }
        .cl-ticker-set {
          display: flex;
          align-items: center;
          gap: 28px;
          padding-right: 28px;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #475569;
          font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
        }
        .cl-ticker-dot {
          color: #10b981;
          font-size: 16px;
          line-height: 1;
        }
        @keyframes cl-marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        /* ── FEATURES MOBILE SLIDER ── */
        .cl-feat-slider-wrap { display: none; margin-top: 10px; }
        .cl-feat-desktop { display: grid; }
        .cl-feat-slider {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          gap: 14px;
          padding: 8px 16px 20px;
          margin: 0 -16px;
          scrollbar-width: none;
        }
        .cl-feat-slider::-webkit-scrollbar { display: none; }
        .cl-feat-slide {
          flex: 0 0 85vw;
          max-width: 320px;
          scroll-snap-align: center;
          scroll-snap-stop: always;
          background: #ffffff;
          border-radius: 24px;
          padding: 28px 24px 24px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(6, 95, 70, 0.08);
          border: 1.5px solid rgba(6, 95, 70, 0.1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 250px;
        }
        .cl-feat-dots {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 16px;
          padding: 10px 0;
          position: relative;
          z-index: 10;
        }
        .cl-feat-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(6, 95, 70, 0.25);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cl-feat-dot.active {
          background: #059669;
          width: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4);
        }

        /* ── COMMAND CENTER ANALYTICS (FULL-WIDTH MATTE TEAL BAND) ── */
        .cl-command-section {
          width: 100vw;
          position: relative;
          left: 50%;
          right: 50%;
          margin-left: -50vw;
          margin-right: -50vw;
          background: #082a20;
          background-image:
            radial-gradient(circle at 80% 10%, rgba(52, 211, 153, 0.08) 0%, transparent 60%),
            radial-gradient(circle at 10% 90%, rgba(16, 185, 129, 0.06) 0%, transparent 60%);
          padding: 100px 0 110px;
          margin-top: 80px;
          margin-bottom: 80px;
          border-top: 1px solid rgba(52, 211, 153, 0.12);
          border-bottom: 1px solid rgba(52, 211, 153, 0.12);
        }
        .cl-command-container {
          max-width: 1160px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .cl-command-header {
          margin-bottom: 54px;
        }
        .cl-command-badge {
          display: inline-block;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #34d399;
          margin-bottom: 14px;
          text-transform: uppercase;
        }
        .cl-command-title {
          font-size: 44px;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 16px;
          max-width: 720px;
        }
        .cl-command-sub {
          font-size: 17px;
          color: rgba(241, 245, 249, 0.72);
          max-width: 600px;
          line-height: 1.65;
        }

        /* Command Grid & Interactive Cards */
        .cl-command-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 24px;
        }
        .cl-cmd-card {
          background: rgba(13, 51, 39, 0.7);
          border: 1px solid rgba(52, 211, 153, 0.14);
          border-radius: 24px;
          padding: 32px;
          backdrop-filter: blur(12px);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.35s ease,
                      box-shadow 0.35s ease,
                      background 0.35s ease;
          cursor: cell;
          position: relative;
          overflow: hidden;
        }
        .cl-cmd-card:hover {
          transform: translateY(-6px);
          border-color: rgba(52, 211, 153, 0.4);
          background: rgba(16, 62, 48, 0.85);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.4), 0 0 24px rgba(52, 211, 153, 0.12);
        }
        .cl-cmd-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .cl-cmd-card-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: rgba(241, 245, 249, 0.6);
          text-transform: uppercase;
          display: block;
        }
        .cl-cmd-legend {
          display: flex;
          gap: 16px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(241, 245, 249, 0.8);
        }
        .cl-cmd-legend span { display: flex; align-items: center; gap: 6px; }
        .cl-cmd-dot {
          width: 8px; height: 8px; border-radius: 50%; display: inline-block;
        }
        .cl-cmd-dot.dot-served { background: #34d399; box-shadow: 0 0 8px #34d399; }
        .cl-cmd-dot.dot-waiting { background: rgba(255,255,255,0.6); }

        /* Chart SVG */
        .cl-cmd-chart-wrap {
          position: relative;
          padding-top: 10px;
          cursor: cell;
        }
        .cl-cmd-chart-svg {
          width: 100%;
          height: 140px;
          overflow: visible;
        }
        .cl-cmd-axis-y {
          position: absolute; left: -4px; top: 12px; bottom: 30px;
          display: flex; flex-direction: column; justify-content: space-between;
          font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.35);
        }
        .cl-cmd-axis-x {
          display: flex; justify-content: space-between;
          padding-left: 24px; margin-top: 10px;
          font-size: 11.5px; font-weight: 700; color: rgba(255,255,255,0.45);
        }

        /* Gauge Efficiency */
        .cl-cmd-gauge-wrap {
          position: relative; width: 140px; height: 140px;
          margin: 20px auto 16px;
          display: flex; align-items: center; justify-content: center;
        }
        .cl-cmd-gauge-svg {
          width: 100%; height: 100%; transform: rotate(-90deg);
        }
        .cl-cmd-gauge-fill {
          stroke-dasharray: 390;
          stroke-dashoffset: 390;
          animation: fill-gauge 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.3s;
        }
        @keyframes fill-gauge {
          from { stroke-dashoffset: 390; }
          to { stroke-dashoffset: 24; }
        }
        .cl-cmd-gauge-val {
          position: absolute; text-align: center;
          display: flex; flex-direction: column; align-items: center;
        }
        .cl-cmd-gauge-num {
          font-size: 34px; font-weight: 900; color: #ffffff; line-height: 1;
          letter-spacing: -0.03em;
        }
        .cl-cmd-gauge-sub {
          font-size: 9px; font-weight: 800; letter-spacing: 0.12em;
          color: #34d399; margin-top: 4px;
        }
        .cl-cmd-gauge-desc {
          text-align: center; font-size: 13px; color: rgba(241, 245, 249, 0.6);
          font-weight: 500; margin-top: 12px;
        }

        /* Tooltips & Hover Effects */
        .cl-cmd-chart-pt { cursor: cell; }
        .cl-cmd-tooltip {
          position: absolute;
          background: #0d3327;
          border: 1.5px solid rgba(52, 211, 153, 0.4);
          border-radius: 12px;
          padding: 8px 12px;
          color: #ffffff;
          box-shadow: 0 10px 28px rgba(0,0,0,0.5), 0 0 16px rgba(52,211,153,0.2);
          pointer-events: none;
          z-index: 20;
          min-width: 90px;
          animation: cl-pop-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes cl-pop-in {
          from { opacity: 0; transform: translateY(4px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .cl-cmd-tooltip-trend {
          top: 15px;
          transform: translateX(-50%);
        }
        .cl-cmd-tooltip-bar {
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
        }
        .cl-tooltip-title {
          font-size: 12px; font-weight: 800; color: #ffffff; margin-bottom: 4px;
        }
        .cl-tooltip-row {
          font-size: 11px; color: rgba(241,245,249,0.85); display: flex; align-items: center; gap: 6px; margin-top: 2px;
        }
        .cl-tooltip-row .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
        .cl-tooltip-row .dot-served { background: #34d399; }
        .cl-tooltip-row .dot-waiting { background: rgba(255,255,255,0.7); }
        .cl-tooltip-row strong { color: #34d399; font-weight: 800; }

        /* Hourly Bars */
        .cl-cmd-bars-wrap {
          display: flex; justify-content: space-between; align-items: flex-end;
          height: 140px; margin-top: 20px; gap: 8px; position: relative;
          cursor: cell;
        }
        .cl-cmd-bar-col {
          flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%;
          cursor: cell; position: relative; transition: opacity 0.2s ease;
        }
        .cl-cmd-bar-col.active .cl-cmd-bar-fill {
          background: linear-gradient(180deg, #6ee7b7 0%, #10b981 100%);
          box-shadow: 0 0 16px rgba(52, 211, 153, 0.6);
        }
        .cl-cmd-bar-col.active .cl-cmd-bar-time {
          color: #34d399; font-weight: 800;
        }
        .cl-cmd-bar-track {
          flex: 1; width: 100%; background: rgba(255,255,255,0.05);
          border-radius: 8px; display: flex; align-items: flex-end; overflow: hidden;
          transition: background 0.2s ease;
        }
        .cl-cmd-bar-col:hover .cl-cmd-bar-track {
          background: rgba(52, 211, 153, 0.1);
        }
        .cl-cmd-bar-fill {
          width: 100%; background: linear-gradient(180deg, #34d399 0%, #059669 100%);
          border-radius: 8px;
          transform-origin: bottom;
          animation: grow-bar 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: filter 0.3s ease, background 0.2s ease;
        }
        @keyframes grow-bar {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        .cl-cmd-bar-time {
          font-size: 10.5px; font-weight: 700; color: rgba(255,255,255,0.4); margin-top: 8px;
          white-space: nowrap;
        }

        /* Consultation Duration */
        .cl-cmd-duration-val {
          margin: 16px 0 12px; display: flex; flex-direction: column; gap: 8px;
        }
        .cl-cmd-duration-num {
          font-size: 42px; font-weight: 900; color: #ffffff; letter-spacing: -0.03em; line-height: 1;
        }
        .cl-cmd-badge-pill {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(52, 211, 153, 0.12); border: 1px solid rgba(52, 211, 153, 0.25);
          color: #34d399; padding: 4px 12px; border-radius: 20px;
          font-size: 12px; font-weight: 700; width: fit-content;
        }

        /* Branch Chips Row */
        .cl-cmd-branches-row {
          grid-column: span 2;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 8px;
        }
        .cl-cmd-branch-chip {
          background: rgba(13, 51, 39, 0.7);
          border: 1px solid rgba(52, 211, 153, 0.14);
          border-radius: 18px; padding: 18px 22px;
          display: flex; justify-content: space-between; align-items: center;
          transition: all 0.3s ease; cursor: cell;
        }
        .cl-cmd-branch-chip:hover {
          background: rgba(16, 62, 48, 0.9);
          border-color: rgba(52, 211, 153, 0.4);
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
        }
        .cl-cmd-branch-name {
          font-size: 15px; font-weight: 800; color: #ffffff; display: block; margin-bottom: 2px;
        }
        .cl-cmd-branch-sub {
          font-size: 12px; color: rgba(241, 245, 249, 0.55); font-weight: 500;
        }
        .cl-cmd-tag {
          padding: 4px 10px; border-radius: 8px; font-size: 11.5px; font-weight: 800;
        }
        .cl-cmd-tag.tag-green { background: rgba(52, 211, 153, 0.18); color: #34d399; }
        .cl-cmd-tag.tag-gold { background: rgba(251, 191, 36, 0.2); color: #f59e0b; }

        /* ── CTA SECTION ── */
        .cl-cta-sec {
          background: #082a20;
          border: 1px solid rgba(52, 211, 153, 0.2);
          border-radius: 36px;
          padding: 100px 48px 84px;
          text-align: center;
          position: relative;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .cl-cta-sec:hover {
          border-color: rgba(52, 211, 153, 0.45);
          box-shadow: 0 35px 90px rgba(0, 0, 0, 0.55), 0 0 40px rgba(52, 211, 153, 0.15);
        }
        .cl-cta-sec::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.15), transparent 70%),
            radial-gradient(circle at 10% 90%, rgba(52, 211, 153, 0.08), transparent 50%),
            radial-gradient(circle at 90% 10%, rgba(52, 211, 153, 0.08), transparent 50%);
          pointer-events: none;
          transition: opacity 0.4s ease;
        }
        .cl-cta-sec:hover::before {
          opacity: 1.3;
        }
        .cl-cta-grid-bg {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(52, 211, 153, 0.12) 1px, transparent 1px);
          background-size: 24px 24px;
          opacity: 0.5;
          pointer-events: none;
          transition: opacity 0.4s ease;
        }
        .cl-cta-sec:hover .cl-cta-grid-bg {
          opacity: 0.75;
        }
        .cl-cta-wave-svg {
          position: absolute; inset: 0; width: 100%; height: 100%;
          opacity: 0.18; pointer-events: none;
          transition: transform 0.6s ease, opacity 0.4s ease;
        }
        .cl-cta-sec:hover .cl-cta-wave-svg {
          opacity: 0.32;
          transform: scale(1.02);
        }
        .cl-cta-h2 {
          font-size: 56px; font-weight: 900; color: #ffffff;
          margin-bottom: 20px; position: relative; z-index: 2;
          letter-spacing: -0.035em; line-height: 1.12;
          max-width: 840px; margin-inline: auto;
          transition: transform 0.3s ease;
        }
        .cl-cta-sec:hover .cl-cta-h2 {
          transform: translateY(-2px);
        }
        .cl-cta-p {
          font-size: 18px; color: rgba(241, 245, 249, 0.75);
          margin-bottom: 44px; max-width: 580px;
          margin-inline: auto; position: relative; z-index: 2;
          line-height: 1.65; font-weight: 400;
        }
        .cl-cta-group {
          display: flex; align-items: center; justify-content: center; gap: 16px;
          margin-bottom: 48px; position: relative; z-index: 2; flex-wrap: wrap;
        }
        .cl-cta-btn-primary {
          background: #ffffff; color: #082a20;
          border: none; padding: 16px 36px;
          border-radius: 14px; font-weight: 800;
          font-size: 16px; cursor: pointer; font-family: inherit;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          display: inline-flex; align-items: center; gap: 10px;
        }
        .cl-cta-btn-primary:hover {
          transform: translateY(-4px) scale(1.03);
          box-shadow: 0 14px 40px rgba(255, 255, 255, 0.35), 0 0 20px rgba(52, 211, 153, 0.4);
          background: #ffffff;
        }
        .cl-cta-btn-primary svg {
          transition: transform 0.25s ease;
        }
        .cl-cta-btn-primary:hover svg {
          transform: translateX(4px);
        }
        .cl-cta-btn-ghost {
          background: rgba(13, 51, 39, 0.6); color: #ffffff;
          border: 1px solid rgba(52, 211, 153, 0.3); padding: 16px 32px;
          border-radius: 14px; font-weight: 700; font-size: 16px;
          cursor: pointer; font-family: inherit;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-flex; align-items: center; gap: 9px;
          backdrop-filter: blur(8px);
        }
        .cl-cta-btn-ghost:hover {
          background: rgba(16, 62, 48, 0.95);
          border-color: rgba(52, 211, 153, 0.7);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4), 0 0 20px rgba(52, 211, 153, 0.2);
          color: #34d399;
        }
        .cl-cta-trust-row {
          display: flex; align-items: center; justify-content: center; gap: 32px;
          font-size: 13.5px; font-weight: 600; color: rgba(241, 245, 249, 0.65);
          position: relative; z-index: 2; flex-wrap: wrap;
        }
        .cl-cta-trust-item {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 20px;
          transition: all 0.25s ease; cursor: default;
        }
        .cl-cta-trust-item:hover {
          background: rgba(52, 211, 153, 0.12);
          color: #ffffff;
          transform: translateY(-2px);
        }
        .cl-cta-trust-icon {
          width: 18px; height: 18px; color: #34d399; display: flex; align-items: center; justify-content: center;
          transition: transform 0.25s ease;
        }
        .cl-cta-trust-item:hover .cl-cta-trust-icon {
          transform: scale(1.2);
        }

        /* ── REQUEST DEMO MODAL POPUP ── */
        .cl-modal-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(4, 30, 23, 0.82);
          backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
        }
        .cl-modal-card {
          background: #082a20;
          border: 1.5px solid rgba(52, 211, 153, 0.3);
          border-radius: 28px;
          padding: 40px 36px;
          max-width: 460px; width: 100%;
          position: relative;
          box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 30px rgba(52,211,153,0.15);
        }
        .cl-modal-close {
          position: absolute; top: 20px; right: 24px;
          background: rgba(255,255,255,0.08); border: none;
          color: rgba(255,255,255,0.7); font-size: 24px; font-weight: 300;
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s ease;
        }
        .cl-modal-close:hover {
          background: rgba(255,255,255,0.2); color: #fff;
        }
        .cl-modal-icon-wrap {
          width: 60px; height: 60px; border-radius: 18px;
          background: rgba(52, 211, 153, 0.12);
          border: 1px solid rgba(52, 211, 153, 0.25);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }
        .cl-modal-title {
          font-size: 26px; font-weight: 900; color: #ffffff;
          letter-spacing: -0.02em; margin-bottom: 8px;
        }
        .cl-modal-sub {
          font-size: 14px; color: rgba(241, 245, 249, 0.72);
          line-height: 1.6; margin-bottom: 24px;
        }
        .cl-modal-form {
          display: flex; flex-direction: column; gap: 16px;
        }
        .cl-modal-input-wrap {
          position: relative; width: 100%;
        }
        .cl-modal-mail-icon {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.45); pointer-events: none;
        }
        .cl-modal-input {
          width: 100%; background: rgba(255, 255, 255, 0.06);
          border: 1.5px solid rgba(52, 211, 153, 0.25);
          border-radius: 14px; padding: 14px 16px 14px 46px;
          font-size: 15px; color: #ffffff; font-family: inherit;
          outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .cl-modal-input:focus {
          border-color: #34d399;
          box-shadow: 0 0 16px rgba(52, 211, 153, 0.3);
        }
        .cl-modal-input::placeholder {
          color: rgba(255, 255, 255, 0.38);
        }
        .cl-modal-btn {
          width: 100%; background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff; border: none; padding: 15px 24px;
          border-radius: 14px; font-weight: 800; font-size: 15.5px;
          font-family: inherit; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
          transition: all 0.2s ease;
        }
        .cl-modal-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(16, 185, 129, 0.45);
        }

        /* ── FOOTER (PREMIUM DARK MATTE EMERALD) ── */
        .cl-footer {
          background: #041e17;
          color: rgba(241, 245, 249, 0.75);
          border-top: 1px solid rgba(52, 211, 153, 0.15);
          padding: 80px 24px 36px;
          position: relative;
          overflow: hidden;
        }
        .cl-footer::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle at 50% 0%, rgba(52, 211, 153, 0.08), transparent 70%);
          pointer-events: none;
        }
        .cl-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }
        .cl-footer-top {
          display: grid;
          grid-template-columns: 1.8fr 1fr 1fr 1.2fr;
          gap: 48px;
          margin-bottom: 60px;
        }
        .cl-footer-brand-desc {
          font-size: 14.5px;
          color: rgba(241, 245, 249, 0.65);
          line-height: 1.65;
          margin-top: 16px;
          max-width: 320px;
        }
        .cl-footer-status {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(52, 211, 153, 0.1);
          border: 1px solid rgba(52, 211, 153, 0.25);
          color: #34d399; padding: 5px 12px; border-radius: 20px;
          font-size: 12px; font-weight: 700; margin-top: 20px;
        }
        .cl-footer-status-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #34d399;
          box-shadow: 0 0 8px #34d399;
        }
        .cl-footer-heading {
          font-size: 13px; font-weight: 800; color: #ffffff;
          letter-spacing: 0.12em; text-transform: uppercase;
          margin-bottom: 20px;
        }
        .cl-footer-links {
          list-style: none; display: flex; flex-direction: column; gap: 12px;
        }
        .cl-footer-link {
          font-size: 14px; color: rgba(241, 245, 249, 0.65);
          text-decoration: none; transition: all 0.2s ease;
          cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
        }
        .cl-footer-link:hover {
          color: #34d399; transform: translateX(3px);
        }
        .cl-footer-contact-card {
          background: rgba(13, 51, 39, 0.6);
          border: 1px solid rgba(52, 211, 153, 0.2);
          border-radius: 18px; padding: 20px;
        }
        .cl-footer-contact-title {
          font-size: 14px; font-weight: 800; color: #ffffff; margin-bottom: 6px;
        }
        .cl-footer-contact-email {
          font-size: 13.5px; color: #34d399; text-decoration: none; font-weight: 700;
          display: flex; align-items: center; gap: 6px; word-break: break-all;
          transition: opacity 0.2s ease;
        }
        .cl-footer-contact-email:hover { opacity: 0.85; text-decoration: underline; }
        .cl-footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 28px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 16px;
          font-size: 13px; color: rgba(241, 245, 249, 0.5);
        }
        .cl-footer-bottom-links {
          display: flex; align-items: center; gap: 24px;
        }
        .cl-footer-bottom-links a {
          color: rgba(241, 245, 249, 0.6); text-decoration: none; transition: color 0.2s ease;
        }
        .cl-footer-bottom-links a:hover { color: #34d399; }

        /* ── ROLES MOBILE SLIDER ── */
        /* Desktop shows the grid, slider is hidden */
        .cl-roles-slider-wrap { display: none; }
        .cl-roles-desktop { display: grid; }
        .cl-roles-slider {
          display: flex;
          overflow-x: scroll;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
          gap: 16px;
          padding: 4px 4px 8px;
          scrollbar-width: none;
        }
        .cl-roles-slider::-webkit-scrollbar { display: none; }
        .cl-roles-slide {
          flex: 0 0 calc(85vw);
          max-width: 340px;
          scroll-snap-align: center;
          background: #ffffff;
          border-radius: 22px;
          padding: 32px 26px 28px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 12px 32px rgba(4, 40, 28, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .cl-roles-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
        }
        .cl-roles-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.35);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: background 0.3s ease, transform 0.3s ease, width 0.3s ease;
        }
        .cl-roles-dot.active {
          background: #34d399;
          width: 24px;
          border-radius: 4px;
          transform: none;
        }

        /* ── MOBILE MENU ── */
        .cl-hamburger {
          display: none;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 5.5px;
          width: 42px;
          height: 42px;
          cursor: pointer;
          border: 1.5px solid rgba(6, 95, 70, 0.14);
          background: #f0faf5;
          padding: 4px;
          border-radius: 11px;
          transition: background 0.2s ease, border-color 0.2s ease;
          z-index: 100001;
          position: relative;
          flex-shrink: 0;
          margin-left: auto;
        }
        .cl-hamburger:hover { background: #dcfce7; border-color: rgba(6, 95, 70, 0.28); }
        .cl-ham-bar {
          width: 22px;
          height: 2.5px;
          background: #065F46;
          border-radius: 4px;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 0.25s ease, width 0.3s ease;
          transform-origin: center;
        }
        .cl-hamburger.open .cl-ham-bar:nth-child(1) { transform: translateY(7.5px) rotate(45deg); }
        .cl-hamburger.open .cl-ham-bar:nth-child(2) { opacity: 0; width: 0; }
        .cl-hamburger.open .cl-ham-bar:nth-child(3) { transform: translateY(-7.5px) rotate(-45deg); }

        /* Mobile Backdrop */
        .cl-mobile-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(10, 30, 20, 0.45);
          z-index: 99997;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .cl-mobile-backdrop.open {
          display: block;
          animation: cl-fade-in 0.3s ease forwards;
        }
        @keyframes cl-fade-in { from { opacity: 0; } to { opacity: 1; } }

        /* Mobile Drawer */
        .cl-mobile-drawer {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 99998;
          background: #ffffff;
          border-bottom-left-radius: 24px;
          border-bottom-right-radius: 24px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
          padding: 0 20px 28px;
          transform: translateY(-110%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
        }
        .cl-mobile-drawer.open { transform: translateY(0); }
        .cl-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          border-bottom: 1.5px solid rgba(6, 95, 70, 0.08);
          margin-bottom: 8px;
        }
        .cl-drawer-links {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 20px;
        }
        .cl-drawer-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 14px;
          font-size: 15.5px;
          font-weight: 700;
          color: #0d2b1e;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }
        .cl-drawer-link:hover { background: #f0faf5; color: #065F46; transform: translateX(4px); }
        .cl-drawer-link-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #10b981;
          flex-shrink: 0;
        }
        .cl-drawer-cta {
          background: #065F46;
          color: #ffffff;
          border: none;
          border-radius: 14px;
          padding: 15px 20px;
          font-size: 15.5px;
          font-weight: 800;
          width: 100%;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
          box-shadow: 0 4px 18px rgba(6, 95, 70, 0.3);
        }
        .cl-drawer-cta:hover { background: #047857; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(6, 95, 70, 0.4); }
        .cl-drawer-find {
          margin-top: 10px;
          width: 100%;
          background: transparent;
          border: 1.5px solid rgba(6, 95, 70, 0.2);
          border-radius: 14px;
          padding: 13px 20px;
          font-size: 14.5px;
          font-weight: 700;
          color: #065F46;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .cl-drawer-find:hover { background: rgba(6, 95, 70, 0.05); border-color: rgba(6, 95, 70, 0.35); }

        /* ══════════════════════════════
           RESPONSIVE — TABLET (≤960px)
        ══════════════════════════════ */
        @media (max-width: 960px) {
          /* Nav */
          .cl-nav-inner { height: 60px; padding: 10px 16px; }
          .cl-nav-links { gap: 18px; font-size: 13px; }
          .cl-nav-cta { padding: 8px 16px; font-size: 13px; }

          /* Hero */
          .cl-hero-wrap { padding-top: 88px; }
          .cl-hero { padding: 48px 20px 40px; }
          .cl-h1 { font-size: 42px; }
          .cl-sub { font-size: 16px; }

          /* Stats */
          .cl-stats-inner { grid-template-columns: repeat(2, 1fr); gap: 20px; }

          /* Roles — keep grid on tablet, hide slider */
          .cl-roles-section { padding: 60px 0; }
          .cl-roles-wrapper { padding: 0 20px; }
          .cl-roles-grid { grid-template-columns: 1fr; gap: 18px; }
          .cl-journey-path-svg, .cl-token-pill { display: none; }
          .cl-card-notch { display: none; }
          .cl-roles-slider-wrap { display: none; }
          .cl-roles-desktop { display: grid; }

          /* Timeline / How it works */
          .cl-timeline-layout { grid-template-columns: 1fr; gap: 40px; }
          .cl-phone-wrap { display: none; }
          .cl-how-section { padding: 60px 20px 80px; }
          .cl-timeline-card { width: 100%; }

          /* Features bento → 2-col */
          .cl-feat-grid { grid-template-columns: repeat(2, 1fr); }
          .cl-feat-card.feat-rect-1,
          .cl-feat-card.feat-sq-1,
          .cl-feat-card.feat-sq-2,
          .cl-feat-card.feat-rect-2 { grid-column: span 1; }

          /* Testimonials */
          .cl-test-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }

          /* Command Center Tablet */
          .cl-command-section { padding: 70px 0 80px; margin-top: 50px; margin-bottom: 50px; }
          .cl-command-title { font-size: 32px; }
          .cl-command-grid { grid-template-columns: 1fr; }
          .cl-cmd-branches-row { grid-column: span 1; grid-template-columns: 1fr; }

          /* Section padding */
          .cl-sec { padding: 64px 20px; }
        }

        /* ══════════════════════════════
           RESPONSIVE — MOBILE (≤640px)
        ══════════════════════════════ */
        @media (max-width: 640px) {
          /* Topbar */
          .cl-topbar { font-size: 11.5px; padding: 7px 14px; gap: 4px; }

          /* Nav — hide desktop links, show hamburger */
          .cl-nav-inner { height: 56px; padding: 8px 16px; }
          .cl-nav-links { display: none; }
          .cl-nav-cta { display: none; }
          .cl-hamburger { display: flex; }

          /* Hero */
          .cl-hero-wrap { padding-top: 80px; min-height: auto; }
          .cl-hero { padding: 40px 16px 32px; }
          .cl-h1 { font-size: 30px; letter-spacing: -0.02em; line-height: 1.2; }
          .cl-sub { font-size: 15px; margin-bottom: 28px; }
          .cl-badge { font-size: 11.5px; padding: 5px 12px; margin-bottom: 20px; }

          /* Search */
          .cl-search-box { padding: 5px 5px 5px 14px; max-width: 100%; }
          .cl-search-input { font-size: 14px; }
          .cl-search-btn { padding: 9px 14px; font-size: 13px; }

          /* CTA Buttons */
          .cl-cta-group { flex-direction: column; width: 100%; gap: 10px; }
          .cl-btn-primary, .cl-btn-ghost { width: 100%; justify-content: center; font-size: 15px; padding: 14px 20px; }

          /* Stats strip */
          .cl-stats-strip { padding: 28px 16px; }
          .cl-stats-inner { grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .cl-stat-n { font-size: 28px; }
          .cl-stat-l { font-size: 12px; }

          /* Roles band — SWITCH TO SLIDER */
          .cl-roles-section { padding: 48px 0; }
          .cl-roles-wrapper { padding: 0 16px; }
          .cl-roles-header { margin-bottom: 28px; }
          .cl-roles-desktop { display: none !important; }
          .cl-journey-path-svg, .cl-token-pill, .cl-card-notch { display: none; }
          .cl-roles-slider-wrap { display: block; }
          .cl-roles-slide { flex: 0 0 82vw; max-width: 310px; padding: 26px 20px 22px; }
          .cl-role-h3 { font-size: 18px; }
          .cl-role-p { font-size: 14px; }

          /* How it works / Setup Timeline */
          .cl-how-section { padding: 48px 16px 64px; }
          .cl-timeline-layout { grid-template-columns: 1fr; gap: 32px; }
          .cl-phone-wrap { display: none; }
          .cl-timeline-container { padding: 0; }
          .cl-timeline-step { margin-bottom: 20px; }
          .cl-timeline-card { padding: 20px 18px; border-radius: 16px; }

          /* Sections */
          .cl-sec { padding: 48px 16px; }
          .cl-sec-title { font-size: 24px; margin-bottom: 10px; }
          .cl-sec-sub { font-size: 14.5px; margin-bottom: 32px; }
          .cl-eyebrow { font-size: 10.5px; }

          /* Features → 1-col stack on mobile */
          .cl-feat-grid { display: flex !important; flex-direction: column; gap: 16px; width: 100%; }
          .cl-feat-card { width: 100% !important; grid-column: span 12 !important; padding: 26px 20px; min-height: auto; border-radius: 20px; }
          .cl-feat-desktop { display: flex !important; }
          .cl-feat-slider-wrap { display: none !important; }
          .cl-feat-title { font-size: 18px; margin-bottom: 12px; }
          .cl-feat-bullets { gap: 10px; }
          .cl-feat-bullet { font-size: 13.5px; }

          /* Testimonials → single column */
          .cl-test-grid { grid-template-columns: 1fr; gap: 12px; }
          .cl-test-card { padding: 22px 20px; }

          /* CTA section Mobile */
          .cl-cta-h2 { font-size: 32px; margin-bottom: 14px; }
          .cl-cta-p { font-size: 15px; margin-bottom: 32px; }
          .cl-cta-sec { padding: 56px 20px 48px; border-radius: 24px; }
          .cl-cta-btn-primary, .cl-cta-btn-ghost { width: 100%; justify-content: center; font-size: 15px; padding: 14px 20px; }
          .cl-cta-btn-ghost { display: flex !important; }
          .cl-cta-trust-row { gap: 16px; flex-direction: column; align-items: center; }

          /* Command Center Mobile Fixes (Eliminate 100vw horizontal overflow) */
          .cl-command-section {
            width: 100% !important;
            left: 0 !important;
            right: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding: 48px 0 60px;
            margin-top: 30px;
            margin-bottom: 30px;
            overflow-x: hidden;
          }
          .cl-command-container { padding: 0 16px; max-width: 100%; box-sizing: border-box; }
          .cl-command-title { font-size: 26px; margin-bottom: 12px; }
          .cl-command-sub { font-size: 14.5px; }
          .cl-command-grid { grid-template-columns: 1fr; gap: 16px; width: 100%; max-width: 100%; box-sizing: border-box; }
          .cl-cmd-card { padding: 22px 16px; border-radius: 20px; width: 100%; max-width: 100%; box-sizing: border-box; overflow: hidden; }
          .cl-cmd-chart-wrap { padding-top: 5px; width: 100%; max-width: 100%; overflow: hidden; }
          .cl-cmd-chart-svg { width: 100%; max-width: 100%; height: 120px; }
          .cl-cmd-axis-y { font-size: 9.5px; left: 0px; }
          .cl-cmd-axis-x { font-size: 9.5px; padding-left: 20px; margin-top: 6px; }
          .cl-cmd-bars-wrap { gap: 4px; height: 120px; margin-top: 14px; width: 100%; max-width: 100%; box-sizing: border-box; }
          .cl-cmd-bar-time { font-size: 9px; margin-top: 6px; }
          .cl-cmd-branches-row { grid-template-columns: 1fr; gap: 12px; margin-top: 0; width: 100%; max-width: 100%; box-sizing: border-box; }
          .cl-cmd-branch-chip { padding: 14px 16px; border-radius: 14px; width: 100%; max-width: 100%; box-sizing: border-box; }

          /* Modal Popup Mobile */
          .cl-modal-card { padding: 28px 20px; border-radius: 22px; }
          .cl-modal-title { font-size: 22px; }

          /* Footer Mobile */
          .cl-footer { padding: 56px 20px 110px; }
          .cl-footer-top { grid-template-columns: 1fr; gap: 36px; margin-bottom: 44px; }
          .cl-footer-brand-desc { max-width: 100%; }
          .cl-footer-bottom { flex-direction: column; align-items: flex-start; gap: 14px; }
          .cl-footer-bottom-links { display: flex; flex-wrap: nowrap; gap: 16px; font-size: 12.5px; width: 100%; justify-content: space-between; }
          .cl-footer-bottom-links a { white-space: nowrap; }
        }

        /* ══════════════════════════════
           RESPONSIVE — SMALL (≤480px)
        ══════════════════════════════ */
        @media (max-width: 480px) {
          .cl-h1 { font-size: 28px; }
          .cl-cta-h2 { font-size: 26px; }
          .cl-stat-n { font-size: 24px; }
          .cl-role-h3 { font-size: 17px; }
          .cl-sec-title { font-size: 22px; }
          .cl-feat-title { font-size: 17px; }
        }
      `}</style>

      {/* ── Topbar ── */}
      <div className="cl-topbar">
        🏥 Priority support for doctors →{" "}
        <a href="mailto:tokenpe.online@gmail.com">tokenpe.online@gmail.com</a>
      </div>

      {/* ── Nav ── */}
      <nav className={`cl-nav${scrolled ? " scrolled" : ""}`}>
        <div className="cl-nav-inner">
          <img
            src="/logo-clinic-nav.svg"
            alt="TokenPe"
            style={{ height: 38, width: "auto", cursor: "pointer" }}
            onClick={() => router.push("/")}
          />
          {/* Desktop Links */}
          <div className="cl-nav-links">
            <span className="cl-nl" onClick={() => go("roles")}>Benefits</span>
            <span className="cl-nl" onClick={() => go("how")}>How it works</span>
            <span className="cl-nl" onClick={() => go("features")}>Features</span>
            <span className="cl-nl" onClick={() => router.push("/find")}>Find Clinic</span>
          </div>
          <button className="cl-nav-cta" onClick={() => router.push("/login?mode=register")}>
            Get Started
          </button>
          {/* Hamburger (mobile only) */}
          <button
            className={`cl-hamburger${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            <span className="cl-ham-bar" />
            <span className="cl-ham-bar" />
            <span className="cl-ham-bar" />
          </button>
        </div>
      </nav>

      {/* ── Mobile Backdrop ── */}
      <div
        className={`cl-mobile-backdrop${menuOpen ? " open" : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* ── Mobile Drawer ── */}
      <div className={`cl-mobile-drawer${menuOpen ? " open" : ""}`}>
        <div className="cl-drawer-header">
          <img src="/logo-clinic-nav.svg" alt="TokenPe" style={{ height: 34, width: "auto" }} />
          <button
            className={`cl-hamburger${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <span className="cl-ham-bar" />
            <span className="cl-ham-bar" />
            <span className="cl-ham-bar" />
          </button>
        </div>
        <div className="cl-drawer-links">
          {[
            { label: "Benefits", action: () => { go("roles"); setMenuOpen(false); } },
            { label: "How it works", action: () => { go("how"); setMenuOpen(false); } },
            { label: "Features", action: () => { go("features"); setMenuOpen(false); } },
          ].map(({ label, action }) => (
            <div key={label} className="cl-drawer-link" onClick={action}>
              <span className="cl-drawer-link-dot" />
              {label}
            </div>
          ))}
        </div>
        <button className="cl-drawer-cta" onClick={() => { router.push("/login?mode=register"); setMenuOpen(false); }}>
          Get Started Free →
        </button>
        <button className="cl-drawer-find" onClick={() => { router.push("/find"); setMenuOpen(false); }}>
          <Search size={16} /> Find a Clinic
        </button>
      </div>

      {/* ── Hero ── */}
      <div className="cl-hero-wrap">
        <div className="cl-hero-texture" />
        <FloatingClinicObjects />
        {/* Soft green glow blobs */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <motion.div
            style={{ position: "absolute", top: -80, left: -80, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.12), transparent 70%)", filter: "blur(80px)" }}
            animate={{ y: [0, -24, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            style={{ position: "absolute", bottom: -60, right: -60, width: 440, height: 440, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,95,70,0.09), transparent 70%)", filter: "blur(80px)" }}
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          />
        </div>

        <header className="cl-hero">
          <Reveal delay={0}>
            <div className="cl-badge">
              <Stethoscope size={13} /> For Clinics &amp; Hospitals
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="cl-h1">
              Your patients deserve{" "}
              <span className="cl-h1-accent">
                <Typewriter words={["zero wait time.", "live updates.", "calm queues.", "WhatsApp alerts."]} />
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="cl-sub">
              No more crowded waiting rooms. Patients scan a QR code, join the queue on WhatsApp, and wait comfortably anywhere — while you manage the flow from a single dashboard.
            </p>
          </Reveal>

          <Reveal delay={0.22}>
            <form className="cl-search-box" onSubmit={handleSearch}>
              <Search size={17} color="rgba(26,61,43,0.38)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                className="cl-search-input"
                placeholder="Search for a clinic by name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="cl-search-btn">Find Clinic</button>
            </form>
          </Reveal>

          <Reveal delay={0.28}>
            <div className="cl-cta-group">
              <button className="cl-btn-primary" onClick={() => router.push("/login?mode=register")}>
                Register Clinic for Free <ArrowRight size={16} />
              </button>
              <button className="cl-btn-ghost" onClick={() => go("how")}>
                <CheckCircle2 size={15} /> See how it works
              </button>
            </div>
            <p style={{ marginTop: 14, fontSize: 13, color: "rgba(26,61,43,0.4)", textAlign: "center" }}>
              Takes 2 minutes · No credit card · 7-day Elite trial included
            </p>
          </Reveal>
        </header>
      </div>

      {/* ── Stats Strip ── */}
      <div className="cl-stats-strip">
        <div className="cl-stats-inner">
          {STATS.map((s, i) => (
            <Reveal key={i} delay={i * 0.07}>
              <div className="cl-stat-n">
                <CountUp target={s.n} suffix={s.suf} prefix={s.pre || ""} />
              </div>
              <div className="cl-stat-l">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── Infinite Looping Ticker Strip ── */}
      <div className="cl-ticker-strip">
        <div className="cl-ticker-track">
          {[...Array(2)].map((_, setIdx) => (
            <div className="cl-ticker-set" key={setIdx}>
              <span>EXPRESS RECEPTION</span>
              <span className="cl-ticker-dot">•</span>
              <span>AUTOMATED REMINDERS</span>
              <span className="cl-ticker-dot">•</span>
              <span>SMART PATIENT CALLING</span>
              <span className="cl-ticker-dot">•</span>
              <span>WHATSAPP QUEUE UPDATES</span>
              <span className="cl-ticker-dot">•</span>
              <span>QR CHECK-IN</span>
              <span className="cl-ticker-dot">•</span>
              <span>REAL-TIME DASHBOARD</span>
              <span className="cl-ticker-dot">•</span>
              <span>MULTI-LANGUAGE ANNOUNCEMENTS</span>
              <span className="cl-ticker-dot">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Roles / Benefits — The Token Journey ── */}
      <RolesTokenJourneySection ROLES={ROLES} />

      {/* ── How It Works (Setup Interactive Timeline with Dynamic Artwork) ── */}
      <SetupInteractiveTimeline />

      {/* ── Features (Bento Cards) ── */}
      <section className="cl-sec" id="features">
        <Reveal>
          <span className="cl-eyebrow">Packed with power</span>
          <h2 className="cl-sec-title">Everything your clinic needs</h2>
          <p className="cl-sec-sub">
            Built specifically for Indian clinics — from solo GPs to large multi-specialty hospitals.
          </p>
        </Reveal>
        {/* Desktop Bento Grid */}
        <div className="cl-feat-grid cl-feat-desktop">
          {FEATURES.map((f, i) => {
            const bentoClass = i === 0 ? "feat-rect-1" : i === 1 ? "feat-sq-1" : i === 2 ? "feat-sq-2" : "feat-rect-2";
            return (
              <Reveal key={i} delay={Math.floor(i / 2) * 0.08 + (i % 2) * 0.06} className={`cl-feat-col ${bentoClass}`}>
                <div className={`cl-feat-card ${bentoClass}`}>
                  {/* Ghost SVG illustration in bottom-right */}
                  <div className="cl-feat-ghost">
                    <f.Ghost />
                  </div>
                  <div className="cl-feat-icon">{f.icon}</div>
                  <div className="cl-feat-title">{f.title}</div>
                  <ul className="cl-feat-bullets">
                    {f.bullets.map((b, j) => (
                      <li key={j} className="cl-feat-bullet">
                        <CheckCircle2 size={15} className="cl-feat-check" color="#10b981" style={{ flexShrink: 0 }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Mobile Snap Slider */}
        <div className="cl-feat-slider-wrap">
          <div
            className="cl-feat-slider"
            ref={featSliderRef}
            onScroll={handleFeatSliderScroll}
            onTouchStart={handleFeatTouchStart}
            onTouchEnd={handleFeatTouchEnd}
          >
            {FEATURES.map((f, i) => (
              <div key={i} className="cl-feat-slide">
                <div className="cl-feat-ghost">
                  <f.Ghost />
                </div>
                <div>
                  <div className="cl-feat-icon">{f.icon}</div>
                  <div className="cl-feat-title">{f.title}</div>
                  <ul className="cl-feat-bullets">
                    {f.bullets.map((b, j) => (
                      <li key={j} className="cl-feat-bullet">
                        <CheckCircle2 size={15} className="cl-feat-check" color="#10b981" style={{ flexShrink: 0 }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          {/* Dot Indicators */}
          <div className="cl-feat-dots">
            {FEATURES.map((_, i) => (
              <button
                key={i}
                className={`cl-feat-dot${featSlideIndex === i ? " active" : ""}`}
                onClick={() => scrollToFeatSlide(i)}
                aria-label={`Feature slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Command Center Full-Width Section ── */}
      <section className="cl-command-section" id="analytics">
        <div className="cl-command-container">
          <Reveal>
            <div className="cl-command-header">
              <span className="cl-command-badge">04 ──── ANALYTICS CENTRE</span>
              <h2 className="cl-command-title">Every queue, measured. Every minute, accounted for.</h2>
              <p className="cl-command-sub">
                A live analytics layer your reception and doctors actually enjoy looking at.
              </p>
            </div>
          </Reveal>

          {/* Analytics Dashboard Grid */}
          <div className="cl-command-grid">
            {/* Card 1: Queue Trend */}
            <Reveal delay={0.1}>
              <div className="cl-cmd-card cl-cmd-trend">
                <div className="cl-cmd-card-header">
                  <span className="cl-cmd-card-label">QUEUE TREND — THIS WEEK</span>
                  <div className="cl-cmd-legend">
                    <span><span className="cl-cmd-dot dot-served" /> Served</span>
                    <span><span className="cl-cmd-dot dot-waiting" /> Waiting</span>
                  </div>
                </div>
                {/* SVG Curve Chart */}
                <div className="cl-cmd-chart-wrap" onMouseMove={handleTrendMouseMove}>
                  <svg className="cl-cmd-chart-svg" viewBox="0 0 500 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="servedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="20" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.06)" />
                    <line x1="20" y1="55" x2="480" y2="55" stroke="rgba(255,255,255,0.06)" />
                    <line x1="20" y1="90" x2="480" y2="90" stroke="rgba(255,255,255,0.06)" />
                    <line x1="20" y1="125" x2="480" y2="125" stroke="rgba(255,255,255,0.06)" />

                    {/* Gradient Fill under Served Curve */}
                    <path
                      d="M 30,90 C 80,75 120,40 180,45 C 240,50 280,60 330,35 C 380,15 430,45 480,95 L 480,140 L 30,140 Z"
                      fill="url(#servedGrad)"
                    />

                    {/* Waiting Curve (Dashed White) */}
                    <path
                      d="M 30,60 C 70,80 120,85 170,40 C 220,10 270,75 330,65 C 380,55 430,85 480,105"
                      fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeDasharray="5 5"
                    />

                    {/* Served Curve (Solid Glowing Green) */}
                    <path
                      d="M 30,90 C 80,75 120,40 180,45 C 240,50 280,60 330,35 C 380,15 430,45 480,95"
                      fill="none" stroke="#34d399" strokeWidth="3"
                    />

                    {/* Interactive Days Hover Columns & Dots (Mon-Sat, exclude Sun hover) */}
                    {[
                      { day: "Mon", x: 30, servedY: 90, waitingY: 60, served: 30, waiting: 34 },
                      { day: "Tue", x: 105, servedY: 72, waitingY: 75, served: 35, waiting: 28 },
                      { day: "Wed", x: 180, servedY: 45, waitingY: 40, served: 42, waiting: 40 },
                      { day: "Thu", x: 255, servedY: 56, waitingY: 66, served: 38, waiting: 26 },
                      { day: "Fri", x: 330, servedY: 35, waitingY: 65, served: 45, waiting: 32 },
                      { day: "Sat", x: 405, servedY: 40, waitingY: 82, served: 40, waiting: 22 },
                    ].map((pt, pIdx) => (
                      <g
                        key={pIdx}
                        className="cl-cmd-chart-pt"
                        onMouseEnter={() => setHoveredTrendIdx(pIdx)}
                        onMouseLeave={() => setHoveredTrendIdx(null)}
                      >
                        {/* Transparent full height hit box for smooth hover */}
                        <rect x={pt.x - 30} y="0" width="60" height="140" fill="transparent" />

                        {/* Full height vertical guide line when hovered */}
                        {hoveredTrendIdx === pIdx && (
                          <line x1={pt.x} y1="10" x2={pt.x} y2="135" stroke="rgba(255, 255, 255, 0.35)" strokeWidth="1" />
                        )}

                        {/* White Circular Nodes on lines when hovered */}
                        {hoveredTrendIdx === pIdx && (
                          <>
                            <circle cx={pt.x} cy={pt.servedY} r="5" fill="#ffffff" stroke="#34d399" strokeWidth="2.5" />
                            <circle cx={pt.x} cy={pt.waitingY} r="5" fill="#ffffff" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" />
                          </>
                        )}
                      </g>
                    ))}
                  </svg>

                  {/* Floating Dark Glass Tooltip Popup */}
                  {hoveredTrendIdx !== null && hoveredTrendIdx < 6 && (() => {
                    const DATA = [
                      { day: "Mon", served: 30, waiting: 34 },
                      { day: "Tue", served: 35, waiting: 28 },
                      { day: "Wed", served: 42, waiting: 40 },
                      { day: "Thu", served: 38, waiting: 26 },
                      { day: "Fri", served: 45, waiting: 32 },
                      { day: "Sat", served: 40, waiting: 22 },
                    ];
                    const item = DATA[hoveredTrendIdx];
                    const leftPos = `calc(${6 + hoveredTrendIdx * 14.8}% + 12px)`;
                    return (
                      <div
                        className="cl-cmd-tooltip cl-cmd-tooltip-trend"
                        style={{ left: leftPos, top: `${trendMouseY}px` }}
                      >
                        <div className="cl-tooltip-title">{item.day}</div>
                        <div className="cl-tooltip-row"><span className="dot dot-served" /> served : <strong>{item.served}</strong></div>
                        <div className="cl-tooltip-row"><span className="dot dot-waiting" /> waiting : <strong>{item.waiting}</strong></div>
                      </div>
                    );
                  })()}

                  {/* Axis Labels */}
                  <div className="cl-cmd-axis-y">
                    <span>60</span><span>45</span><span>30</span><span>15</span><span>0</span>
                  </div>
                  <div className="cl-cmd-axis-x">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Card 2: Reception Efficiency */}
            <Reveal delay={0.15}>
              <div className="cl-cmd-card cl-cmd-efficiency">
                <span className="cl-cmd-card-label">RECEPTION EFFICIENCY</span>
                <div className="cl-cmd-gauge-wrap">
                  <svg className="cl-cmd-gauge-svg" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="62" stroke="rgba(52, 211, 153, 0.15)" strokeWidth="14" fill="none" />
                    <motion.circle
                      cx="80" cy="80" r="62"
                      stroke="#10b981" strokeWidth="14" fill="none"
                      strokeLinecap="round"
                      strokeDasharray="390"
                      initial={{ strokeDashoffset: 390 }}
                      whileInView={{ strokeDashoffset: 24 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 1.6, ease: EASE, delay: 0.2 }}
                    />
                  </svg>
                  <div className="cl-cmd-gauge-val">
                    <span className="cl-cmd-gauge-num">
                      <CountUp target={94} suffix="%" duration={1.6} />
                    </span>
                    <span className="cl-cmd-gauge-sub">EFFICIENCY</span>
                  </div>
                </div>
                <p className="cl-cmd-gauge-desc">Tokens called on time, across all counters</p>
              </div>
            </Reveal>

            {/* Card 3: Hourly Patient Load */}
            <Reveal delay={0.2}>
              <div className="cl-cmd-card cl-cmd-hourly">
                <span className="cl-cmd-card-label">HOURLY PATIENT LOAD</span>
                <div className="cl-cmd-bars-wrap" onMouseMove={handleBarMouseMove}>
                  {[
                    { h: "20%", count: 12, timeLabel: "8 AM", shortTime: "8am" },
                    { h: "42%", count: 28, timeLabel: "9 AM", shortTime: "9am" },
                    { h: "70%", count: 44, timeLabel: "10 AM", shortTime: "10am" },
                    { h: "85%", count: 52, timeLabel: "11 AM", shortTime: "11am" },
                    { h: "60%", count: 38, timeLabel: "12 PM", shortTime: "12pm" },
                    { h: "35%", count: 22, timeLabel: "1 PM", shortTime: "1pm" },
                    { h: "58%", count: 34, timeLabel: "4 PM", shortTime: "4pm" },
                    { h: "75%", count: 48, timeLabel: "5 PM", shortTime: "5pm" },
                    { h: "64%", count: 40, timeLabel: "6 PM", shortTime: "6pm" },
                    { h: "25%", count: 18, timeLabel: "7 PM", shortTime: "7pm" },
                  ].map((bar, bIdx) => (
                    <div
                      key={bIdx}
                      className={`cl-cmd-bar-col${hoveredBar === bIdx ? " active" : ""}`}
                      onMouseEnter={() => setHoveredBar(bIdx)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Floating Tooltip */}
                      {hoveredBar === bIdx && (
                        <div className="cl-cmd-tooltip cl-cmd-tooltip-bar" style={{ top: `${barMouseY}px` }}>
                          <div className="cl-tooltip-title">{bar.shortTime}</div>
                          <div className="cl-tooltip-row">p : <strong>{bar.count}</strong></div>
                        </div>
                      )}
                      <div className="cl-cmd-bar-track">
                        <motion.div
                          className="cl-cmd-bar-fill"
                          style={{ height: bar.h }}
                          initial={{ scaleY: 0 }}
                          whileInView={{ scaleY: 1 }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{ duration: 1.2, ease: EASE, delay: 0.1 * bIdx }}
                        />
                      </div>
                      <span className="cl-cmd-bar-time">{bar.timeLabel}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Card 4: Avg Consultation Duration */}
            <Reveal delay={0.25}>
              <div className="cl-cmd-card cl-cmd-duration">
                <span className="cl-cmd-card-label">AVG CONSULTATION DURATION</span>
                <div className="cl-cmd-duration-val">
                  <span className="cl-cmd-duration-num">
                    <DurationCountUp targetMin={9} targetSec={42} />
                  </span>
                  <div className="cl-cmd-badge-pill">
                    <span>↘ 18% shorter than last month</span>
                  </div>
                </div>
                <div className="cl-cmd-mini-wave">
                  <svg viewBox="0 0 300 60" preserveAspectRatio="none" style={{ width: "100%", height: 45 }}>
                    <path d="M 0,45 Q 75,48 150,30 T 300,20" fill="none" stroke="#34d399" strokeWidth="3" />
                  </svg>
                </div>
              </div>
            </Reveal>

            {/* Row 3: Branch Chips */}
            <div className="cl-cmd-branches-row">
              <Reveal delay={0.3}>
                <div className="cl-cmd-branch-chip">
                  <div>
                    <div className="cl-cmd-branch-name">Andheri Branch</div>
                    <div className="cl-cmd-branch-sub">Avg wait 11 min · 86 patients today</div>
                  </div>
                  <span className="cl-cmd-tag tag-gold">↘ -12%</span>
                </div>
              </Reveal>

              <Reveal delay={0.35}>
                <div className="cl-cmd-branch-chip">
                  <div>
                    <div className="cl-cmd-branch-name">Powai Branch</div>
                    <div className="cl-cmd-branch-sub">Avg wait 14 min · 64 patients today</div>
                  </div>
                  <span className="cl-cmd-tag tag-green">↗ +6%</span>
                </div>
              </Reveal>

              <Reveal delay={0.4}>
                <div className="cl-cmd-branch-chip">
                  <div>
                    <div className="cl-cmd-branch-name">Thane Branch</div>
                    <div className="cl-cmd-branch-sub">Avg wait 9 min · 51 patients today</div>
                  </div>
                  <span className="cl-cmd-tag tag-gold">↘ -12%</span>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="cl-sec" style={{ paddingTop: 0 }}>
        <Reveal style={{ textAlign: "center" }}>
          <span className="cl-eyebrow">Trusted by doctors</span>
          <h2 className="cl-sec-title" style={{ textAlign: "center" }}>What clinics are saying</h2>
          <p className="cl-sec-sub" style={{ textAlign: "center", marginInline: "auto" }}>
            Join thousands of doctors who've transformed their OPD experience.
          </p>
        </Reveal>
        <div className="cl-test-grid">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="cl-test-card">
                <div className="cl-stars">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <p className="cl-test-q">"{t.quote}"</p>
                <div className="cl-test-name">{t.name}</div>
                <div className="cl-test-role">{t.role}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Final CTA Banner ── */}
      <div style={{ padding: "0 24px 120px", maxWidth: 1320, margin: "0 auto" }}>
        <Reveal>
          <div className="cl-cta-sec">
            <div className="cl-cta-grid-bg" />
            <svg className="cl-cta-wave-svg" viewBox="0 0 1200 400" preserveAspectRatio="none">
              <path d="M 0,220 Q 300,140 600,240 T 1200,180" fill="none" stroke="#34d399" strokeWidth="1.5" opacity="0.6" />
              <path d="M 0,280 Q 350,180 700,300 T 1200,240" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.4" />
              <path d="M 0,160 Q 250,260 550,140 T 1200,220" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.3" />
            </svg>

            <div style={{ position: "relative", zIndex: 2 }}>
              <h2 className="cl-cta-h2">Ready to Modernize Your Clinic?</h2>
              <p className="cl-cta-p">
                Start your free 7-day trial and experience faster queues, happier patients, and a calmer reception desk.
              </p>
              
              <div className="cl-cta-group">
                <button className="cl-cta-btn-primary" onClick={() => router.push("/login?mode=register")}>
                  Start Free Trial <ArrowRight size={18} />
                </button>
                <button className="cl-cta-btn-ghost" onClick={openDemoModal}>
                  <Calendar size={18} /> Book a Live Demo
                </button>
              </div>

              {/* Bottom Trust Indicators */}
              <div className="cl-cta-trust-row">
                <div className="cl-cta-trust-item">
                  <Shield className="cl-cta-trust-icon" />
                  <span>Secure & encrypted</span>
                </div>
                <div className="cl-cta-trust-item">
                  <CheckCircle2 className="cl-cta-trust-icon" />
                  <span>Cancel anytime</span>
                </div>
                <div className="cl-cta-trust-item">
                  <Users className="cl-cta-trust-icon" />
                  <span>Dedicated onboarding support</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── Request Demo Modal Popup ── */}
      <AnimatePresence>
        {demoModalOpen && (
          <motion.div
            className="cl-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDemoModalOpen(false)}
          >
            <motion.div
              className="cl-modal-card"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="cl-modal-close" onClick={() => setDemoModalOpen(false)}>×</button>

              {!demoSubmitted ? (
                <>
                  <div className="cl-modal-icon-wrap">
                    <Calendar size={28} color="#34d399" />
                  </div>
                  <h3 className="cl-modal-title">Request a Live Demo</h3>
                  <p className="cl-modal-sub">
                    Enter your email below. Our team will reach out within 2 hours to schedule a 1-on-1 personalized clinic walkthrough.
                  </p>
                  <form onSubmit={handleDemoSubmit} className="cl-modal-form">
                    <div className="cl-modal-input-wrap">
                      <Mail size={18} className="cl-modal-mail-icon" />
                      <input
                        type="email"
                        required
                        placeholder="Enter your doctor / clinic email"
                        value={demoEmail}
                        onChange={(e) => setDemoEmail(e.target.value)}
                        className="cl-modal-input"
                        autoFocus
                      />
                    </div>
                    <button type="submit" disabled={demoLoading} className="cl-modal-btn">
                      {demoLoading ? "Scheduling..." : "Submit Request"} <ArrowRight size={16} />
                    </button>
                  </form>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                  <div className="cl-modal-icon-wrap" style={{ background: "rgba(52, 211, 153, 0.15)" }}>
                    <CheckCircle2 size={36} color="#34d399" />
                  </div>
                  <h3 className="cl-modal-title" style={{ marginTop: 12 }}>Demo Request Sent!</h3>
                  <p className="cl-modal-sub">
                    Thank you! We have sent a confirmation email to <strong>{demoEmail}</strong>. One of our OPD specialists will contact you shortly.
                  </p>
                  <button className="cl-modal-btn" onClick={() => setDemoModalOpen(false)} style={{ marginTop: 16 }}>
                    Got it, thanks!
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer ── */}
      <footer className="cl-footer">
        <div className="cl-footer-inner">
          <div className="cl-footer-top">
            {/* Column 1: Brand & Status */}
            <div>
              <img src="/logo-nav.svg" alt="TokenPe" style={{ height: 38, width: "auto" }} />
              <p className="cl-footer-brand-desc">
                TokenPe replaces chaotic paper OPD queues with real-time WhatsApp digital queues. Built specifically for Indian clinics & hospitals.
              </p>
              <div className="cl-footer-status">
                <span className="cl-footer-status-dot" />
                <span>All WhatsApp Queue Systems Operational</span>
              </div>
            </div>

            {/* Column 2: Navigation Links */}
            <div>
              <h4 className="cl-footer-heading">Platform</h4>
              <ul className="cl-footer-links">
                <li><span className="cl-footer-link" onClick={() => go("roles")}>For Doctors & Staff</span></li>
                <li><span className="cl-footer-link" onClick={() => go("how")}>How Queue Works</span></li>
                <li><span className="cl-footer-link" onClick={() => go("features")}>OPD Features</span></li>
                <li><span className="cl-footer-link" onClick={() => go("analytics")}>Analytics Center</span></li>
              </ul>
            </div>

            {/* Column 3: Quick Access */}
            <div>
              <h4 className="cl-footer-heading">Quick Links</h4>
              <ul className="cl-footer-links">
                <li><a className="cl-footer-link" href="/find">Find a Clinic</a></li>
                <li><a className="cl-footer-link" href="/login?mode=register">Clinic Registration</a></li>
                <li><a className="cl-footer-link" href="/login">Staff Login</a></li>
                <li><span className="cl-footer-link" onClick={openDemoModal}>Request Demo</span></li>
              </ul>
            </div>

            {/* Column 4: Contact Card */}
            <div>
              <div className="cl-footer-contact-card">
                <h4 className="cl-footer-contact-title">Doctor Support Line</h4>
                <p style={{ fontSize: 13, color: "rgba(241, 245, 249, 0.65)", marginBottom: 12 }}>
                  Need assistance setting up your clinic QR code?
                </p>
                <a href="mailto:tokenpe.online@gmail.com" className="cl-footer-contact-email">
                  <Mail size={15} /> tokenpe.online@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="cl-footer-bottom">
            <div>
              © {new Date().getFullYear()} TokenPe · Smart WhatsApp Queues for Indian Clinics
            </div>
            <div className="cl-footer-bottom-links">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
              <a href="mailto:tokenpe.online@gmail.com">Contact Support</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
