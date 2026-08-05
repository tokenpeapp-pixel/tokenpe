"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import {
  Search, Stethoscope, Users, Zap, Bell,
  Hospital, QrCode, MessageSquare, ArrowRight,
  Star, Globe2, Shield, BarChart3, CheckCircle2, Mic, Clock,
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(mq.matches);
    }
  }, []);

  useEffect(() => {
    if (!inView || reducedMotion || hoveredCard !== null) return;

    let timeoutIds = [];

    // Patient (idx 2)
    setTokenPos({ x: 16.66, opacity: 1 });
    setActiveStep(2);

    // Travel to Receptionist (idx 1)
    timeoutIds.push(setTimeout(() => {
      if (hoveredCard === null) {
        setTokenPos({ x: 50, opacity: 1 });
        setActiveStep(1);
      }
    }, 1200));

    // Travel to Doctor (idx 0)
    timeoutIds.push(setTimeout(() => {
      if (hoveredCard === null) {
        setTokenPos({ x: 83.33, opacity: 1 });
        setActiveStep(0);
      }
    }, 2400));

    const loopInterval = setInterval(() => {
      if (hoveredCard !== null) return;

      setTokenPos({ x: 16.66, opacity: 1 });
      setActiveStep(2);

      timeoutIds.push(setTimeout(() => {
        if (hoveredCard === null) {
          setTokenPos({ x: 50, opacity: 1 });
          setActiveStep(1);
        }
      }, 1500));

      timeoutIds.push(setTimeout(() => {
        if (hoveredCard === null) {
          setTokenPos({ x: 83.33, opacity: 1 });
          setActiveStep(0);
        }
      }, 3000));
    }, 10000);

    return () => {
      timeoutIds.forEach(clearTimeout);
      clearInterval(loopInterval);
    };
  }, [inView, reducedMotion, hoveredCard]);

  const handleMouseEnter = (cardIndex) => {
    setHoveredCard(cardIndex);
    setActiveStep(cardIndex);
    const targetX = cardIndex === 2 ? 16.66 : cardIndex === 1 ? 50 : 83.33;
    setTokenPos({ x: targetX, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setHoveredCard(null);
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
            {/* Curved SVG Connecting Path */}
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
              <path
                d="M 166 24 Q 333 -4, 500 24 T 833 24"
                fill="none"
                stroke="url(#tokenPathGlow)"
                strokeWidth="3"
                strokeDasharray="8 6"
                filter="url(#pathGlowFilter)"
              />
            </svg>

            {/* Glowing Floating Token Pill */}
            {!reducedMotion && (
              <div
                className="cl-token-pill"
                style={{
                  left: `${tokenPos.x}%`,
                  opacity: tokenPos.opacity,
                }}
              >
                <div className="cl-token-pill-dot" />
                <span>
                  {activeStep === 2 ? "For Patients" : activeStep === 1 ? "For Receptionists" : "For Doctors"}
                </span>
              </div>
            )}

            {/* Roles Grid */}
            <div className="cl-roles-grid">
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
      if (window.lenisInstance) {
        window.lenisInstance.scrollTo(target, { duration: 1.2 });
      } else {
        target.scrollIntoView({ behavior: "smooth" });
      }
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
        .cl-feat-card.feat-rect-1 { grid-column: span 7; }
        .cl-feat-card.feat-sq-1   { grid-column: span 5; }
        .cl-feat-card.feat-sq-2   { grid-column: span 5; }
        .cl-feat-card.feat-rect-2 { grid-column: span 7; }
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
        .cl-test-role { font-size: 12.5px; color: rgba(26,61,43,0.45); }

        /* ── CTA SECTION ── */
        .cl-cta-sec {
          background: linear-gradient(135deg, #064e3b 0%, #065F46 60%, #047857 100%);
          border-radius: 24px;
          padding: 88px 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
          margin-bottom: 0;
        }
        .cl-cta-sec::before {
          content: '';
          position: absolute; inset: 0;
          background:
            radial-gradient(circle at 80% 20%, rgba(52,211,153,0.15), transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(16,185,129,0.1), transparent 50%);
          pointer-events: none;
        }
        .cl-cta-bg-icon {
          position: absolute; opacity: 0.06;
          pointer-events: none;
          transition: opacity 0.4s ease;
        }
        .cl-cta-sec:hover .cl-cta-bg-icon { opacity: 0.1; }
        .cl-cta-h2 {
          font-size: 40px; font-weight: 900; color: #fff;
          margin-bottom: 16px; position: relative; z-index: 2;
          letter-spacing: -0.03em; line-height: 1.2;
        }
        .cl-cta-p {
          font-size: 17px; color: rgba(167,243,208,0.9);
          margin-bottom: 40px; max-width: 500px;
          margin-inline: auto; position: relative; z-index: 2;
          line-height: 1.65;
        }
        .cl-cta-btn-primary {
          background: #fff; color: #065F46;
          border: none; padding: 14px 30px;
          border-radius: 12px; font-weight: 800;
          font-size: 15px; cursor: pointer; font-family: inherit;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
          display: inline-flex; align-items: center; gap: 8px;
          position: relative; z-index: 2;
        }
        .cl-cta-btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.28);
        }
        .cl-cta-btn-ghost {
          background: rgba(255,255,255,0.12); color: #fff;
          border: 1.5px solid rgba(255,255,255,0.25); padding: 14px 24px;
          border-radius: 12px; font-weight: 600; font-size: 15px;
          cursor: pointer; font-family: inherit;
          transition: all 0.22s ease;
          display: inline-flex; align-items: center; gap: 7px;
          position: relative; z-index: 2;
        }
        .cl-cta-btn-ghost:hover {
          background: rgba(255,255,255,0.2);
          border-color: rgba(255,255,255,0.4);
        }

        /* ── FOOTER ── */
        .cl-footer {
          border-top: 1px solid rgba(6,95,70,0.08);
          padding: 40px 24px;
          text-align: center;
          color: rgba(26,61,43,0.45);
          font-size: 13.5px;
          background: #f0faf6;
        }
        .cl-footer a { color: rgba(6,95,70,0.7); text-decoration: none; transition: color 0.2s; }
        .cl-footer a:hover { color: #065F46; }

        /* ── RESPONSIVE ── */
        @media (max-width: 960px) {
          .cl-roles-grid { grid-template-columns: 1fr; gap: 14px; }
          .cl-how-grid { grid-template-columns: 1fr; gap: 14px; }
          .cl-how-connector { display: none; }
          .cl-feat-grid { grid-template-columns: 1fr; }
          .cl-test-grid { grid-template-columns: 1fr; gap: 14px; }
          .cl-stats-inner { grid-template-columns: repeat(2, 1fr); gap: 24px; }
        }
        @media (max-width: 640px) {
          .cl-nav-links { gap: 14px; font-size: 13px; }
          .cl-h1 { font-size: 34px; }
          .cl-sub { font-size: 16px; }
          .cl-hero { padding: 64px 20px 48px; }
          .cl-sec { padding: 72px 20px; }
          .cl-sec-title { font-size: 27px; }
          .cl-cta-h2 { font-size: 27px; }
          .cl-cta-sec { padding: 60px 22px; border-radius: 18px; }
          .cl-stats-inner { grid-template-columns: repeat(2, 1fr); }
          .cl-stat-n { font-size: 30px; }
          .cl-cta-group { flex-direction: column; width: 100%; }
          .cl-btn-primary, .cl-btn-ghost { width: 100%; justify-content: center; }
          .cl-feat-card { min-height: auto; }
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
            src="/logo-nav.svg"
            alt="TokenPe"
            style={{ height: 34, width: "auto", cursor: "pointer" }}
            onClick={() => router.push("/")}
          />
          <div className="cl-nav-links">
            <span className="cl-nl" onClick={() => go("roles")}>Benefits</span>
            <span className="cl-nl" onClick={() => go("how")}>How it works</span>
            <span className="cl-nl" onClick={() => go("features")}>Features</span>
            <span className="cl-nl" onClick={() => router.push("/find")}>Find Clinic</span>
          </div>
          <button className="cl-nav-cta" onClick={() => router.push("/login?mode=register")}>
            Get Started
          </button>
        </div>
      </nav>

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
        <div className="cl-feat-grid">
          {FEATURES.map((f, i) => {
            const bentoClass = i === 0 ? "feat-rect-1" : i === 1 ? "feat-sq-1" : i === 2 ? "feat-sq-2" : "feat-rect-2";
            return (
              <Reveal key={i} delay={Math.floor(i / 2) * 0.08 + (i % 2) * 0.06} style={{ gridColumn: i === 0 || i === 3 ? "span 7" : "span 5" }}>
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

      {/* ── Final CTA ── */}
      <div style={{ padding: "0 24px 100px", maxWidth: 1160, margin: "0 auto" }}>
        <Reveal>
          <div className="cl-cta-sec">
            <Stethoscope className="cl-cta-bg-icon" size={280} style={{ top: -40, left: -40, transform: "rotate(-15deg)" }} color="white" />
            <Hospital className="cl-cta-bg-icon" size={300} style={{ bottom: -60, right: -40, transform: "rotate(10deg)" }} color="white" />
            <div style={{ position: "relative", zIndex: 2 }}>
              <span className="cl-eyebrow" style={{ color: "rgba(167,243,208,0.8)" }}>Ready to start?</span>
              <h2 className="cl-cta-h2">Modernize your clinic today.</h2>
              <p className="cl-cta-p">
                Join 4,200+ clinics across India who trust TokenPe to manage their daily OPD queues — effortlessly.
              </p>
              <div className="cl-cta-group">
                <button className="cl-cta-btn-primary" onClick={() => router.push("/login?mode=register")}>
                  Start 7-Day Free Trial <ArrowRight size={16} />
                </button>
                <button className="cl-cta-btn-ghost" onClick={() => router.push("/find")}>
                  <Search size={15} /> Find a clinic near you
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* ── Footer ── */}
      <footer className="cl-footer">
        <div style={{ marginBottom: 6 }}>
          © {new Date().getFullYear()} TokenPe · Built for Indian clinics ·{" "}
          <a href="/privacy">Privacy Policy</a> · <a href="/terms">Terms</a>
        </div>
        <div>
          Questions? <a href="mailto:tokenpe.online@gmail.com">tokenpe.online@gmail.com</a>
        </div>
      </footer>
    </>
  );
}
