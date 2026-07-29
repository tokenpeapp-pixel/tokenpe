"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Search, CheckCircle2, Bell, Scissors, Sparkles, Menu, X, Star,
  ArrowRight, TrendingUp, Phone, MessageSquare, Mic, Zap, Clock,
  ThumbsUp, BarChart3, Users, Package, QrCode, Shield, CheckCheck
} from "lucide-react";
import WhatsAppDemoSalon from "../app/components/WhatsAppDemoSalon";

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
   SVG GRADIENT DEFS
═══════════════════════════════════════════════════════════════ */
function GradientDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <linearGradient id="roseLine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D14D72" />
          <stop offset="100%" stopColor="#F5A3BE" />
        </linearGradient>
        <linearGradient id="roseFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FBEAEF" />
          <stop offset="100%" stopColor="#F5D6E2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATED FLOATING SALON SVG OBJECTS
═══════════════════════════════════════════════════════════════ */
function SvgScissors() {
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
      <circle cx="13" cy="21" r="9" fill="#FBEAEF" stroke="#D14D72" strokeWidth="2.2" />
      <circle cx="13" cy="47" r="9" fill="#FBEAEF" stroke="#D14D72" strokeWidth="2.2" />
      <circle cx="13" cy="21" r="3.5" fill="#D14D72" />
      <circle cx="13" cy="47" r="3.5" fill="#D14D72" />
      <line x1="20" y1="17" x2="58" y2="53" stroke="#D14D72" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="20" y1="51" x2="58" y2="15" stroke="#D14D72" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function SvgComb() {
  return (
    <svg width="88" height="36" viewBox="0 0 88 36" fill="none">
      <rect x="1" y="1" width="86" height="15" rx="5.5" fill="#FBEAEF" stroke="#D14D72" strokeWidth="2" />
      {[9, 20, 31, 42, 53, 64, 75].map((x) => (
        <rect key={x} x={x} y="15" width="5.5" height="18" rx="2.8" fill="#D14D72" opacity="0.75" />
      ))}
    </svg>
  );
}

function SvgHairDryer() {
  return (
    <svg width="78" height="64" viewBox="0 0 78 64" fill="none">
      <ellipse cx="36" cy="30" rx="23" ry="19" fill="#FBEAEF" stroke="#D14D72" strokeWidth="2" />
      <path d="M56 23 L72 19 L72 41 L56 37Z" fill="#FBEAEF" stroke="#D14D72" strokeWidth="2" strokeLinejoin="round" />
      <rect x="22" y="46" width="13" height="16" rx="6.5" fill="#FBEAEF" stroke="#D14D72" strokeWidth="2" />
      <circle cx="33" cy="28" r="5" fill="#D14D72" opacity="0.55" />
      <path d="M74 23 L80 21 M74 30 L82 30 M74 37 L80 39" stroke="#F5A3BE" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SvgRazor() {
  return (
    <svg width="36" height="64" viewBox="0 0 36 64" fill="none">
      <rect x="8" y="2" width="20" height="30" rx="5" fill="#FBEAEF" stroke="#D14D72" strokeWidth="2" />
      <rect x="12" y="32" width="12" height="28" rx="4" fill="#F5D6E2" stroke="#D14D72" strokeWidth="1.8" />
      <rect x="10" y="9" width="16" height="4.5" rx="2.2" fill="#D14D72" opacity="0.45" />
      <rect x="10" y="16" width="16" height="4.5" rx="2.2" fill="#D14D72" opacity="0.45" />
      <rect x="10" y="23" width="16" height="4.5" rx="2.2" fill="#D14D72" opacity="0.45" />
    </svg>
  );
}

function SvgBarberPole() {
  return (
    <svg width="30" height="76" viewBox="0 0 30 76" fill="none">
      <rect x="4" y="8" width="22" height="58" rx="4" fill="#fff" stroke="#D14D72" strokeWidth="2" />
      <clipPath id="bpc">
        <rect x="4" y="8" width="22" height="58" rx="4" />
      </clipPath>
      <g clipPath="url(#bpc)">
        <rect x="4" y="10" width="22" height="9" fill="#D14D72" opacity="0.75" />
        <rect x="4" y="28" width="22" height="9" fill="#D14D72" opacity="0.75" />
        <rect x="4" y="46" width="22" height="9" fill="#D14D72" opacity="0.75" />
        <rect x="4" y="60" width="22" height="8" fill="#D14D72" opacity="0.75" />
      </g>
      <rect x="2" y="3" width="26" height="7" rx="3.5" fill="#D14D72" />
      <rect x="2" y="66" width="26" height="7" rx="3.5" fill="#D14D72" />
      <rect x="10" y="0" width="10" height="5" rx="2.5" fill="#F5D6E2" stroke="#D14D72" strokeWidth="1.5" />
    </svg>
  );
}

function SvgMirror() {
  return (
    <svg width="46" height="68" viewBox="0 0 46 68" fill="none">
      <ellipse cx="23" cy="24" rx="20" ry="22" fill="#FBEAEF" stroke="#D14D72" strokeWidth="2" />
      <ellipse cx="23" cy="24" rx="14" ry="16" fill="#fff" opacity="0.55" />
      <path d="M19 5 Q23 2 27 5" stroke="#D14D72" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <rect x="20" y="45" width="6" height="18" rx="3" fill="#FBEAEF" stroke="#D14D72" strokeWidth="1.8" />
      <rect x="11" y="61" width="24" height="5" rx="2.5" fill="#F5D6E2" stroke="#D14D72" strokeWidth="1.6" />
    </svg>
  );
}

function SvgNailPolish() {
  return (
    <svg width="28" height="64" viewBox="0 0 28 64" fill="none">
      <rect x="7" y="20" width="14" height="38" rx="5" fill="#FBEAEF" stroke="#D14D72" strokeWidth="2" />
      <rect x="9" y="25" width="10" height="28" rx="3.5" fill="#F5A3BE" opacity="0.5" />
      <rect x="9" y="11" width="10" height="11" rx="3.5" fill="#F5D6E2" stroke="#D14D72" strokeWidth="1.6" />
      <rect x="12" y="4" width="4" height="9" rx="2" fill="#D14D72" />
    </svg>
  );
}

function SvgBrush() {
  return (
    <svg width="18" height="68" viewBox="0 0 18 68" fill="none">
      <rect x="6" y="0" width="6" height="34" rx="3" fill="#FBEAEF" stroke="#D14D72" strokeWidth="1.6" />
      <ellipse cx="9" cy="52" rx="8" ry="15" fill="#FBEAEF" stroke="#D14D72" strokeWidth="1.8" />
      <ellipse cx="9" cy="56" rx="4.5" ry="9" fill="#F5A3BE" opacity="0.55" />
    </svg>
  );
}

function SvgHaircut() {
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
      {/* Head */}
      <circle cx="34" cy="40" r="14" fill="#FBEAEF" stroke="#D14D72" strokeWidth="2" />
      {/* Shoulders */}
      <path d="M14 68 Q34 45 54 68" fill="#F5D6E2" stroke="#D14D72" strokeWidth="2" />
      
      {/* Hair outline */}
      <path d="M22 40 Q34 15 46 40" fill="#D14D72" opacity="0.1" stroke="#D14D72" strokeWidth="2" />
      
      {/* Scissors cutting near top */}
      <path d="M30 18 L44 10 M30 10 L44 18" stroke="#D14D72" strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="8" r="2.5" fill="#D14D72" />
      <circle cx="28" cy="20" r="2.5" fill="#D14D72" />
    </svg>
  );
}

const FLOAT_OBJECTS = [
  { Comp: SvgScissors,  pos: { top: "7%",  left: "2.5%" },  anim: { y: [-14, 12, -14], rotate: [-18, 10, -18] }, dur: 5.4, delay: 0   },
  { Comp: SvgComb,      pos: { top: "13%", right: "3%"   },  anim: { y: [8,  -12, 8],  rotate: [4,  -7,  4]   }, dur: 4.9, delay: 0.5 },
  { Comp: SvgHairDryer, pos: { top: "52%", left: "1%"    },  anim: { y: [-9, 13, -9],  rotate: [0,   7,  0]   }, dur: 6.2, delay: 1.0 },
  { Comp: SvgRazor,     pos: { top: "70%", right: "2.5%" },  anim: { y: [11, -13, 11], rotate: [14, -9, 14]   }, dur: 5.6, delay: 0.3 },
  { Comp: SvgBarberPole,pos: { top: "33%", right: "1.5%" },  anim: { y: [-10, 9, -10], rotate: [0,   3,  0]   }, dur: 7.1, delay: 0.8 },
  { Comp: SvgMirror,    pos: { top: "36%", left: "1.5%"  },  anim: { y: [7,  -11, 7],  rotate: [-6,  6, -6]   }, dur: 6.4, delay: 1.3 },
  { Comp: SvgNailPolish,pos: { top: "80%", left: "3.5%"  },  anim: { y: [-7, 11, -7],  rotate: [8,  -6,  8]   }, dur: 5.1, delay: 0.6 },
  { Comp: SvgBrush,     pos: { top: "85%", right: "3.5%" },  anim: { y: [9,  -9,  9],  rotate: [-12, 10,-12]  }, dur: 4.7, delay: 0.2 },
  { Comp: SvgHaircut,   pos: { top: "10%", left: "45%"   },  anim: { y: [-15, 10, -15], rotate: [-5, 5, -5]   }, dur: 6.5, delay: 0.4 },
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
   SCROLL PROGRESS BAR
═══════════════════════════════════════════════════════════════ */
function ScrollProgressBar() {
  const [prog, setProg] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      setProg(el.scrollTop / (el.scrollHeight - el.clientHeight));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 4, zIndex: 9999, background: "rgba(245,214,226,0.5)" }}>
      <motion.div
        style={{ height: "100%", background: "linear-gradient(90deg,#D14D72,#F5A3BE)", transformOrigin: "left" }}
        animate={{ scaleX: prog }}
        transition={{ duration: 0 }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO DEVICE — MOCK PHONE
═══════════════════════════════════════════════════════════════ */
function HeroDevice() {
  return (
    <motion.div
      className="hd-wrap"
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div style={{ position: "relative", zIndex: 10 }}>
        <WhatsAppDemoSalon />
      </div>

      <motion.div className="hd-chip chip-a" animate={{ y: [0, -14, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <Sparkles size={14} color="#D14D72" /> 500+ salons live
      </motion.div>
      <motion.div className="hd-chip chip-b" animate={{ y: [0, 14, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}>
        <TrendingUp size={14} color="#C0405F" /> 32% shorter waits
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
          style={{ width: 5, borderRadius: 3, background: "linear-gradient(180deg,#D14D72,#F5A3BE)", flexShrink: 0 }}
          animate={{ height: [h * 0.6, h * 2.8, h * 0.6] }}
          transition={{ duration: 0.7 + i * 0.05, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WHATSAPP CHATBOT — REAL CHAT UI
═══════════════════════════════════════════════════════════════ */
const CHAT = [
  { from: "client", text: "Hey! Looking for a haircut around 4 PM today. 💇‍♂️", time: "10:14 AM" },
  { from: "bot",    text: "Hi! 👋 We have a slot at 4:00 PM. Reply 'YES' to confirm.", time: "10:14 AM" },
  { from: "client", text: "YES", time: "10:15 AM" },
  { from: "bot",    text: "✅ Booked! Your Token is S-07. See you at 4:00 PM! 🎉", time: "10:15 AM" },
];
function WhatsAppChat() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px 10px", background: "#efeae2", borderRadius: 16, backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", backgroundSize: "cover" }}>
      {CHAT.map((msg, i) => (
        <motion.div
          key={i}
          style={{ display: "flex", justifyContent: msg.from === "client" ? "flex-end" : "flex-start" }}
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
              {msg.from === "client" && <CheckCheck size={14} color="#53bdeb" />}
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
          <Star size={24} fill="#D14D72" stroke="#D14D72" strokeWidth={1} />
        </motion.div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CITY MARQUEE
═══════════════════════════════════════════════════════════════ */
const CITIES = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Pune", "Chennai", "Kolkata", "Jaipur", "Ahmedabad", "Surat", "Indore", "Lucknow", "Nagpur", "Bhopal"];
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
          <span key={i} style={{ fontSize: 14, fontWeight: 700, color: "#C0405F", letterSpacing: "0.05em" }}>
            ✦ {c}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SALON LOGO MARQUEE
═══════════════════════════════════════════════════════════════ */
const SALON_LOGOS = ["GL Studio", "FR Salon", "BS Spa", "VS Parlour", "HS Cuts", "NS Beauty", "CS Lounge", "RS Aesthetics", "PK Salon", "MR Studio"];
function LogoMarquee() {
  const items = [...SALON_LOGOS, ...SALON_LOGOS];
  return (
    <div style={{ overflow: "hidden" }}>
      <motion.div
        style={{ display: "inline-flex", gap: 20, whiteSpace: "nowrap" }}
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
      >
        {items.map((s, i) => (
          <div key={i} style={{
            background: "#fff", border: "1px solid #F0F0F0", borderRadius: 14,
            padding: "14px 24px", fontSize: 14, fontWeight: 800, color: "#C0405F",
            letterSpacing: "0.03em", flexShrink: 0, boxShadow: "0 4px 15px rgba(209,77,114,0.08)",
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
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function SalonLandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });
  const ctaRef = useRef(null);

  const heroWord = useTypewriter(["digital queue", "WhatsApp alerts", "voice AI calls", "Google reviews"]);

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
    router.push(searchQuery.trim() ? `/find-salon?q=${encodeURIComponent(searchQuery)}` : "/find-salon");
  };

  const go = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
  };

  const FEATURES = [
    { icon: QrCode,       tag: "Queue",     title: "Smart digital queue",         desc: "Clients scan a QR, join instantly, and are called in order — no shouting names, no crowded waiting area." },
    { icon: Bell,         tag: "Alerts",    title: "Real-time WhatsApp alerts",   desc: "Automatic 'you're next' pings on WhatsApp so clients wait wherever they like." },
    { icon: Users,        tag: "CRM",       title: "Client history & notes",      desc: "Preferences, allergies, past visits and ratings — all in one profile your whole team can see." },
    { icon: BarChart3,    tag: "Team",      title: "Staff & commission tracking", desc: "Log every service per stylist, auto-calculate commissions — payroll day made painless." },
    { icon: Package,      tag: "Inventory", title: "Stock & inventory alerts",    desc: "Track product usage and get notified before you run out of essentials." },
    { icon: TrendingUp,   tag: "Insights",  title: "Revenue analytics",           desc: "Live dashboards on revenue, peak hours, and top services — backed by real numbers." },
  ];

  const STEPS = [
    { n: "01", title: "Print your QR codes",   desc: "Generate one per service — haircuts, spa, nails — in a few clicks." },
    { n: "02", title: "Clients scan & join",   desc: "They join the WhatsApp queue instantly from their own phone." },
    { n: "03", title: "Call next, get paid",   desc: "Staff tap 'Call Next'; billing and commissions update automatically." },
  ];

  const TESTIMONIALS = [
    { q: "Our Saturday rush used to feel like chaos. Now clients wait comfortably and we've cut walk-outs by half.", n: "Ritika Shah",  r: "Owner, Glow Studio, Mumbai" },
    { q: "Commission tracking alone paid for itself. Payroll used to take me a whole evening — now it's instant.", n: "Arjun Nair",   r: "Owner, The Fade Room, Bengaluru" },
    { q: "Clients love getting a WhatsApp instead of waiting inside. It genuinely feels premium now.",              n: "Meera Kapoor", r: "Manager, Bloom Salon, Delhi" },
  ];

  const BEFORE = [
    "Clients crowd the waiting area during peak hours",
    "Staff manually calls names — mistakes & confusion",
    "No record of services, preferences, or history",
    "Commission calculated on paper at month end",
    "Walk-outs because of long perceived wait times",
    "No system to collect Google Reviews",
  ];
  const AFTER = [
    "Clients wait anywhere — café, car, even home",
    "WhatsApp alert when their turn is near — zero confusion",
    "Full CRM with history, preferences and ratings",
    "Commissions auto-calculated in real time",
    "32% reduction in wait time → fewer walk-outs",
    "Automated Google Review requests after every visit",
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@500;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        .pg-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #FDF8F9;
          color: #1A1A1A;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        /* ── AMBIENT ── */
        .pg-bg {
          position: fixed; inset: 0; z-index: -1; pointer-events: none;
          background:
            radial-gradient(800px circle at 15% 10%,  rgba(209,77,114,0.08), transparent 55%),
            radial-gradient(700px circle at 85% 20%, rgba(245,163,190,0.12), transparent 55%),
            radial-gradient(1000px circle at 50% 95%, rgba(209,77,114,0.06), transparent 55%),
            #FDF8F9;
        }

        /* ── TOPBAR ── */
        .pg-topbar {
          background: linear-gradient(90deg, #C0405F, #D14D72, #C0405F);
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
        .pg-topbar a:hover { color: #FBEAEF; }

        /* ── NAV ── */
        .pg-nav {
          position: sticky; top: 0; z-index: 300;
          background: rgba(253,248,249,0.85);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(209,77,114,0.15);
          transition: box-shadow 0.3s, background 0.3s;
        }
        .pg-nav.scrolled { box-shadow: 0 6px 40px rgba(209,77,114,0.15); background: rgba(253,248,249,0.95); }
        .pg-nav-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 32px;
        }
        .pg-nav-links { display: flex; align-items: center; gap: 36px; }
        .pg-nl {
          color: #4B5563; font-weight: 600; font-size: 14.5px; cursor: pointer;
          transition: color 0.25s, transform 0.2s; position: relative; background: none; border: none;
          font-family: inherit; padding: 4px 0;
        }
        .pg-nl::after {
          content: ''; position: absolute; left: 0; bottom: 0;
          width: 0; height: 2px; background: #D14D72;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 2px;
        }
        .pg-nl:hover { color: #D14D72; transform: translateY(-1px); }
        .pg-nl:hover::after { width: 100%; }

        /* ── BUTTONS ── */
        .btn {
          display: inline-flex; align-items: center; gap: 10px;
          border: none; cursor: pointer; font-family: inherit; font-weight: 700;
          border-radius: 14px; transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          text-decoration: none; position: relative; overflow: hidden;
        }
        .btn-primary {
          background: linear-gradient(135deg, #D14D72, #C0405F);
          color: #fff; padding: 14px 26px; font-size: 14.5px;
          box-shadow: 0 10px 25px rgba(209,77,114,0.3);
        }
        .btn-primary::before {
          content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: skewX(-20deg); transition: 0.5s;
        }
        .btn-primary:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 16px 35px rgba(209,77,114,0.45); }
        .btn-primary:hover::before { left: 150%; }
        .btn-primary:active { transform: scale(0.97); }

        .btn-ghost {
          background: #fff; color: #1A1A1A; padding: 14px 26px; font-size: 14.5px;
          border: 1.5px solid #E5E5E5; box-shadow: 0 4px 10px rgba(0,0,0,0.03);
        }
        .btn-ghost:hover { border-color: #D14D72; color: #D14D72; transform: translateY(-3px); box-shadow: 0 8px 20px rgba(209,77,114,0.15); }
        .btn-lg { padding: 16px 36px !important; font-size: 15.5px !important; border-radius: 16px !important; }

        .pg-burger { display: none; background: none; border: none; cursor: pointer; color: #1A1A1A; transition: transform 0.2s; }
        .pg-burger:hover { transform: scale(1.1); color: #D14D72; }

        /* ── MOBILE MENU ── */
        .pg-mobile {
          position: fixed; inset: 0; z-index: 500; background: #FDF8F9;
          display: flex; flex-direction: column; padding: 24px 28px 48px;
        }
        .pg-mobile-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 50px; }
        .pg-mobile button.mm-link {
          display: block; width: 100%; text-align: left; background: none; border: none;
          font-family: inherit; font-size: 24px; font-weight: 700; color: #1A1A1A;
          padding: 20px 0; border-bottom: 1px solid #F5D6E2; cursor: pointer;
          transition: color 0.2s, padding-left 0.2s;
        }
        .pg-mobile button.mm-link:hover { color: #D14D72; padding-left: 10px; }

        /* ── HERO ── */
        .hero-outer { position: relative; overflow: hidden; padding-bottom: 40px; }
        .hero-wrap { position: relative; padding: 80px 32px 64px; max-width: 1280px; margin: 0 auto; z-index: 1; }
        .hero-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 60px; align-items: center; }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 10px;
          background: #FBEAEF; border: 1px solid #F5D6E2; color: #C0405F;
          padding: 10px 20px; border-radius: 100px; font-size: 13.5px; font-weight: 700; margin-bottom: 32px;
          box-shadow: 0 4px 15px rgba(209,77,114,0.1); cursor: default;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .hero-badge:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(209,77,114,0.2); }
        .badge-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #D14D72;
          animation: pulse-dot 1.5s infinite;
        }
        @keyframes pulse-dot {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.7); opacity: 0.5; }
        }

        .hero-h1 {
          font-family: 'Playfair Display', serif; font-size: 62px; font-weight: 700;
          line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 28px; color: #1A1A1A;
        }
        .hero-h1-grad {
          display: block;
          background: linear-gradient(120deg, #D14D72, #C0405F 40%, #F5A3BE);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        }
        .tw-wrap { display: inline-block; min-width: 260px; }
        .tw-cursor {
          display: inline-block; width: 3px; height: 0.85em; background: #D14D72;
          margin-left: 4px; border-radius: 2px; vertical-align: text-bottom;
          animation: blink 0.9s step-end infinite;
        }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

        .hero-sub { font-size: 18px; color: #4B5563; line-height: 1.75; margin-bottom: 40px; max-width: 520px; }

        .search-box {
          background: #fff; border: 1.5px solid #EBEBEB; border-radius: 18px;
          padding: 8px; display: flex; gap: 10px; max-width: 500px; margin-bottom: 32px;
          box-shadow: 0 12px 40px rgba(209,77,114,0.1); transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .search-box:hover { transform: translateY(-2px); box-shadow: 0 16px 50px rgba(209,77,114,0.15); }
        .search-box:focus-within { border-color: #D14D72; box-shadow: 0 16px 50px rgba(209,77,114,0.25); transform: translateY(-3px); }
        .search-inp {
          flex: 1; background: transparent; border: none; color: #1A1A1A;
          font-size: 15.5px; padding: 12px 8px 12px 16px; outline: none; font-family: inherit;
        }
        .search-inp::placeholder { color: #9CA3AF; }
        .search-go {
          background: linear-gradient(135deg,#D14D72,#C0405F); color: #fff; border: none;
          border-radius: 14px; padding: 0 26px; font-weight: 700; font-size: 14.5px;
          cursor: pointer; font-family: inherit; transition: transform 0.2s, box-shadow 0.2s;
        }
        .search-go:hover { transform: translateY(-1px); box-shadow: 0 6px 15px rgba(209,77,114,0.3); }

        .hero-cta { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin-bottom: 40px; }

        .trust-row { display: flex; align-items: center; gap: 16px; cursor: default; transition: transform 0.3s; }
        .trust-row:hover { transform: translateX(5px); }
        .trust-avatars { display: flex; }
        .trust-av {
          width: 38px; height: 38px; border-radius: 50%; border: 3px solid #FDF8F9;
          margin-left: -12px; display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #C0405F;
          background: linear-gradient(135deg,#FBEAEF,#F5D6E2); flex-shrink: 0;
          transition: transform 0.3s;
        }
        .trust-av:first-child { margin-left: 0; }
        .trust-avatars:hover .trust-av { transform: translateY(-4px); }
        .trust-text { font-size: 14px; color: #6B7280; }
        .trust-text b { color: #1A1A1A; }
        .stars { display: flex; gap: 3px; margin-bottom: 4px; }

        /* ── DEVICE ── */
        .hd-wrap { position: relative; display: flex; align-items: center; justify-content: center; min-height: 540px; perspective: 1000px; }
        .hd-glow { position: absolute; width: 400px; height: 400px; background: radial-gradient(circle, rgba(209,77,114,0.25), transparent 70%); filter: blur(20px); border-radius: 50%; }
        .hd-phone { position: relative; width: 280px; background: #1A1A1A; border-radius: 40px; padding: 14px; box-shadow: 0 40px 80px rgba(92,26,52,0.35), 0 10px 25px rgba(0,0,0,0.2); transform-style: preserve-3d; transition: transform 0.5s ease; }
        .hd-wrap:hover .hd-phone { transform: rotateY(-10deg) rotateX(5deg); }
        .hd-notch { width: 80px; height: 20px; background: #1A1A1A; border-radius: 0 0 16px 16px; margin: 0 auto 8px; }
        .hd-screen { background: #FDF8F9; border-radius: 28px; padding: 18px 16px 24px; min-height: 420px; }
        .hd-header { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: #1A1A1A; margin-bottom: 16px; }
        .hd-live { margin-left: auto; font-size: 11px; color: #1E9E5A; font-weight: 800; background: #DCF5E8; padding: 3px 8px; border-radius: 10px; }
        .hd-card { background: linear-gradient(135deg,#D14D72,#C0405F); border-radius: 18px; padding: 16px; display: flex; align-items: center; gap: 14px; margin-bottom: 18px; box-shadow: 0 15px 30px rgba(209,77,114,0.4); }
        .hd-token { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: #fff; font-weight: 800; font-size: 14px; border-radius: 12px; padding: 10px 12px; white-space: nowrap; }
        .hd-card-title { color: #fff; font-size: 14px; font-weight: 700; }
        .hd-card-sub { color: rgba(255,255,255,0.9); font-size: 11px; margin-top: 3px; }
        .hd-row { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 14px; margin-bottom: 6px; transition: transform 0.2s; }
        .hd-row:hover { transform: translateX(5px); }
        .hd-row.hi { background: #FBEAEF; border: 1px solid #F5D6E2; }
        .hd-av { width: 30px; height: 30px; border-radius: 50%; background: #F5D6E2; color: #C0405F; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .hd-av.active { background: linear-gradient(135deg,#D14D72,#C0405F); color: #fff; }
        .hd-line { height: 8px; background: #F5D6E2; border-radius: 4px; flex: 1; }
        .hd-st { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 100px; white-space: nowrap; margin-left: auto; }
        .hd-st.done    { background: #DCF5E8; color: #1E9E5A; display: flex; align-items: center; gap: 4px; }
        .hd-st.serving { background: #FBEAEF; color: #D14D72; }
        .hd-st.wait    { background: #FDF0D6; color: #B7791F; }
        .hd-toast { margin-top: 18px; background: #fff; color: #1A1A1A; padding: 10px 14px; border-radius: 16px; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); border: 1px solid rgba(0,0,0,0.04); }
        .hd-chip { position: absolute; background: #fff; border: 1.5px solid #F5D6E2; box-shadow: 0 15px 35px rgba(209,77,114,0.18); border-radius: 100px; padding: 12px 20px; font-size: 13.5px; font-weight: 700; display: flex; align-items: center; gap: 8px; transition: transform 0.3s, box-shadow 0.3s; cursor: default; }
        .hd-chip:hover { transform: scale(1.05) translateY(-5px) !important; box-shadow: 0 20px 45px rgba(209,77,114,0.25); }
        .chip-a { top: 8%;  left: -12%;  color: #D14D72; }
        .chip-b { bottom: 10%; right: -15%; color: #C0405F; }

        /* ── MARQUEE STRIP ── */
        .city-strip { background: #FBEAEF; border-top: 1px solid #F5D6E2; border-bottom: 1px solid #F5D6E2; padding: 20px 0; }
        .city-label { text-align: center; font-size: 12.5px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #C0405F; margin-bottom: 14px; }

        /* ── SECTIONS ── */
        .sec { padding: 110px 32px; max-width: 1280px; margin: 0 auto; }
        .sec-sm { padding: 80px 32px; max-width: 1280px; margin: 0 auto; }
        .sec-head { text-align: center; max-width: 680px; margin: 0 auto 64px; }
        .eyebrow { display: inline-block; font-size: 13px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #D14D72; margin-bottom: 16px; background: #FBEAEF; padding: 6px 16px; border-radius: 100px; border: 1px solid #F5D6E2; }
        .sec-title { font-family: 'Playfair Display', serif; font-size: 44px; font-weight: 700; margin-bottom: 18px; color: #1A1A1A; line-height: 1.25; }
        .sec-sub { font-size: 18px; color: #6B7280; line-height: 1.7; }

        /* ── STATS ── */
        .stats-band { background: linear-gradient(135deg,#2A0E1B,#5C1A34 50%,#C0405F); border-radius: 36px; padding: 64px 40px; max-width: 1220px; margin-inline: auto; box-shadow: 0 25px 60px rgba(92,26,52,0.25); }
        .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 30px; text-align: center; }
        .stat-num { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 700; color: #fff; text-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .stat-label { font-size: 14px; color: rgba(255,255,255,0.75); margin-top: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

        /* ── AI POWER CARDS ── */
        .power-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 28px; }
        .power-card {
          background: #fff; border: 1px solid #EFEFEF; border-radius: 28px; padding: 36px 32px;
          transition: all 0.4s cubic-bezier(.2,.8,.2,1);
          position: relative; overflow: hidden; cursor: crosshair;
        }
        .power-card:hover { transform: translateY(-12px); box-shadow: 0 35px 70px rgba(209,77,114,0.15); border-color: #F5D6E2; }
        .power-card-top { display: flex; align-items: center; gap: 16px; margin-bottom: 22px; }
        .power-icon { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg,#FBEAEF,#F5D6E2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.4s; }
        .power-card:hover .power-icon { transform: scale(1.1) rotate(5deg); }
        .power-tag { font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #D14D72; margin-bottom: 4px; }
        .power-title { font-size: 22px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.01em; }
        .power-desc { font-size: 15px; color: #4B5563; line-height: 1.7; margin-bottom: 26px; }
        .power-demo { background: #FDF8F9; border: 1px solid #F5D6E2; border-radius: 20px; padding: 20px; transition: background 0.3s; }
        .power-card:hover .power-demo { background: #FBEAEF; }
        .power-badge { display: inline-flex; align-items: center; gap: 8px; background: #FBEAEF; color: #C0405F; font-size: 13px; font-weight: 700; padding: 8px 16px; border-radius: 100px; margin-top: 20px; border: 1px solid #F5D6E2; }

        /* ── BEFORE / AFTER ── */
        .compare-wrap { max-width: 1220px; margin-inline: auto; padding: 0 32px 90px; }
        .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .compare-card { border-radius: 26px; padding: 36px; transition: transform 0.3s; }
        .compare-card:hover { transform: translateY(-5px); }
        .compare-before { background: #F7F7F7; border: 1px solid #E5E5E5; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
        .compare-after  { background: linear-gradient(135deg,#FBEAEF,#FDF8F9); border: 2px solid #F5D6E2; box-shadow: 0 15px 40px rgba(209,77,114,0.1); }
        .compare-head { display: flex; align-items: center; gap: 12px; margin-bottom: 26px; font-size: 18px; font-weight: 700; }
        .compare-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 15px; line-height: 1.6; }
        .compare-item:last-child { border-bottom: none; }
        .compare-after .compare-item:hover { background: rgba(255,255,255,0.4); border-radius: 8px; padding-left: 10px; cursor: default; }

        /* ── FEATURES GRID ── */
        .feat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
        .feat-card {
          background: #fff; border: 1px solid #EFEFEF; border-radius: 26px; padding: 32px 28px;
          transition: all 0.4s cubic-bezier(.2,.8,.2,1);
          position: relative; overflow: hidden; cursor: pointer;
        }
        .feat-card::before {
          content: ''; position: absolute; inset: 0; border-radius: 26px; padding: 2px;
          background: linear-gradient(135deg,#D14D72,#F5A3BE); opacity: 0;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          transition: opacity 0.4s; pointer-events: none;
        }
        .feat-card:hover { transform: translateY(-8px); box-shadow: 0 28px 55px rgba(209,77,114,0.15); }
        .feat-card:hover::before { opacity: 1; }
        .feat-icon { width: 52px; height: 52px; border-radius: 15px; background: linear-gradient(135deg,#FBEAEF,#F5D6E2); display: flex; align-items: center; justify-content: center; margin-bottom: 22px; transition: transform 0.4s, background 0.4s; }
        .feat-card:hover .feat-icon { transform: scale(1.15) rotate(-5deg); background: linear-gradient(135deg,#D14D72,#C0405F); color: #fff !important; }
        .feat-card:hover .feat-icon svg { stroke: #fff; }
        .feat-tag { font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #D14D72; margin-bottom: 10px; }
        .feat-title { font-size: 19px; font-weight: 700; color: #1A1A1A; margin-bottom: 12px; letter-spacing: -0.01em; }
        .feat-desc { font-size: 14.5px; color: #4B5563; line-height: 1.7; }

        /* ── HOW IT WORKS ── */
        .how-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 48px; position: relative; }
        .how-grid::before { content: ''; position: absolute; top: 32px; left: 16%; right: 16%; height: 2px; background: linear-gradient(90deg,#F5D6E2,#D14D72,#F5D6E2); z-index: 0; }
        .how-step { position: relative; z-index: 1; text-align: center; cursor: default; transition: transform 0.3s; }
        .how-step:hover { transform: translateY(-5px); }
        .how-n { width: 64px; height: 64px; background: linear-gradient(135deg,#D14D72,#C0405F); color: #fff; font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 28px; box-shadow: 0 0 0 10px #FDF8F9, 0 12px 30px rgba(209,77,114,0.35); transition: transform 0.4s, box-shadow 0.4s; }
        .how-step:hover .how-n { transform: scale(1.15) rotate(10deg); box-shadow: 0 0 0 12px #FDF8F9, 0 16px 40px rgba(209,77,114,0.45); }
        .how-h3 { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #1A1A1A; }
        .how-p { font-size: 15px; color: #4B5563; line-height: 1.7; max-width: 260px; margin-inline: auto; }

        /* ── LOGO MARQUEE ── */
        .logo-strip { background: #FBEAEF; border-top: 1px solid #F5D6E2; border-bottom: 1px solid #F5D6E2; padding: 32px 0; }
        .logo-label { text-align: center; font-size: 12.5px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #C0405F; margin-bottom: 20px; }
        .marquee-logo-card:hover { transform: scale(1.05); border-color: #D14D72; cursor: default; }

        /* ── TESTIMONIALS ── */
        .test-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 26px; }
        .test-card { background: #fff; border: 1px solid #EFEFEF; border-radius: 26px; padding: 32px 30px; transition: all 0.4s; cursor: default; }
        .test-card:hover { transform: translateY(-8px); box-shadow: 0 25px 55px rgba(209,77,114,0.15); border-color: #F5D6E2; }
        .test-q { font-size: 16px; color: #333; line-height: 1.7; margin: 16px 0 26px; font-style: italic; }
        .test-person { display: flex; align-items: center; gap: 14px; }
        .test-av { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg,#FBEAEF,#F5D6E2); color: #C0405F; font-weight: 700; font-size: 16px; display: flex; align-items: center; justify-content: center; border: 2px solid #F5D6E2; }
        .test-name { font-size: 15px; font-weight: 700; color: #1A1A1A; }
        .test-role { font-size: 13px; color: #9CA3AF; }

        /* ── CTA ── */
        .cta-outer { padding: 0 32px 90px; }
        .cta-sec {
          border-radius: 40px; padding: 110px 56px; text-align: center;
          position: relative; overflow: hidden; max-width: 1220px; margin-inline: auto;
          background: linear-gradient(135deg,#3A1023,#5C1A34 40%,#C0405F);
          box-shadow: 0 30px 70px rgba(92,26,52,0.3);
        }
        .cta-inner { position: relative; z-index: 2; pointer-events: none; }
        .cta-inner button { pointer-events: auto; }
        .cta-pill { display: inline-flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); color: #fff; padding: 8px 20px; border-radius: 100px; font-size: 14px; font-weight: 700; margin-bottom: 28px; backdrop-filter: blur(5px); }
        .cta-h2 { font-family: 'Playfair Display', serif; font-size: 52px; font-weight: 700; color: #fff; margin-bottom: 22px; line-height: 1.2; text-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .cta-p { font-size: 19px; color: rgba(255,255,255,0.85); margin-bottom: 46px; max-width: 520px; margin-inline: auto; line-height: 1.7; }
        .cta-btn { display: inline-flex; align-items: center; gap: 12px; padding: 20px 46px; font-size: 16px; background: #fff; color: #C0405F; border: none; border-radius: 16px; font-weight: 800; cursor: pointer; font-family: inherit; transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: 0 10px 25px rgba(0,0,0,0.2); position: relative; z-index: 10; }
        .cta-btn:hover { transform: translateY(-4px) scale(1.04); box-shadow: 0 20px 45px rgba(0,0,0,0.35); color: #D14D72; }
        .cta-btn:active { transform: translateY(0) scale(0.98); }
        .cta-note { margin-top: 22px; font-size: 14px; color: rgba(255,255,255,0.6); }

        /* ── FOOTER ── */
        .pg-footer { text-align: center; padding: 48px 20px 40px; color: #4B5563; font-size: 14px; border-top: 2px solid #F5D6E2; background: #FDF8F9; font-weight: 500; }
        .footer-links { display: flex; justify-content: center; gap: 24px; margin-top: 16px; flex-wrap: wrap; }
        .footer-links a { color: #D14D72; text-decoration: none; font-weight: 600; transition: color 0.25s; font-size: 14px; }
        .footer-links a:hover { color: #9E2A46; }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .hero-grid    { grid-template-columns: 1fr; }
          .hd-wrap      { order: -1; min-height: 380px; }
          .hero-h1      { font-size: 52px; }
          .power-grid   { grid-template-columns: 1fr; }
          .feat-grid    { grid-template-columns: repeat(2,1fr); }
          .test-grid    { grid-template-columns: repeat(2,1fr); }
          .stats-grid   { grid-template-columns: repeat(2,1fr); row-gap: 40px; }
          .compare-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .pg-nav-links  { display: none; }
          .pg-burger     { display: block; }
          .pg-nav-inner  { padding: 12px 16px; }
          .hero-outer    { overflow-x: hidden; }
          .hero-wrap     { padding: 32px 16px 20px; }
          .hero-grid     { gap: 28px; }
          .hero-h1       { font-size: 34px; line-height: 1.2; margin-bottom: 18px; }
          .tw-wrap       { min-width: 180px; }
          .hero-sub      { font-size: 14.5px; margin-bottom: 24px; }
          .sec, .sec-sm  { padding: 56px 16px; }
          .compare-wrap  { padding: 0 16px 56px; }
          .sec-title     { font-size: 28px; }
          .feat-grid     { grid-template-columns: 1fr; }
          .test-grid     { grid-template-columns: 1fr; }
          .how-grid      { grid-template-columns: 1fr; gap: 40px; }
          .how-grid::before { display: none; }
          .stats-grid    { grid-template-columns: repeat(2,1fr); }
          .stat-num      { font-size: 36px; }
          .cta-sec       { padding: 60px 20px; border-radius: 24px; }
          .cta-h2        { font-size: 30px; }
          .cta-p         { font-size: 16px; }
          .cta-btn       { padding: 16px 28px; font-size: 15px; }
          .hero-cta      { flex-direction: column; align-items: stretch; gap: 12px; margin-bottom: 28px; }
          .hero-cta .btn { justify-content: center; width: 100%; }
          .hd-wrap       { min-height: auto; margin-bottom: 8px; overflow: visible; }
          .hd-phone      { width: 220px; }
          .hd-screen     { min-height: 340px; padding: 14px 12px 18px; }
          .hd-glow       { width: 260px; height: 260px; }
          .chip-a,.chip-b{ display: none; }
          .hero-floating { display: none; }
          .power-grid    { grid-template-columns: 1fr; }
          .cta-outer     { padding: 0 16px 56px; }
          .compare-card  { padding: 24px 18px; }
          .compare-head  { font-size: 16px; }
          .feat-card     { padding: 24px 20px; }
          .power-card    { padding: 28px 22px; }
          .search-box    { max-width: 100%; }
          .search-inp    { font-size: 14px; }
          .test-card     { padding: 24px 20px; }
          .stats-band    { border-radius: 24px; padding: 48px 20px; }
          .hero-badge    { font-size: 12px; padding: 8px 14px; margin-bottom: 20px; }
          .trust-row     { flex-wrap: wrap; }
        }
        @media (max-width: 480px) {
          .pg-nav-inner  { padding: 10px 14px; }
          .hero-h1       { font-size: 28px; }
          .hero-sub      { font-size: 13.5px; }
          .hd-phone      { width: 200px; }
          .hd-screen     { min-height: 300px; }
          .stats-grid    { grid-template-columns: 1fr; row-gap: 24px; }
          .sec-title     { font-size: 24px; }
          .cta-h2        { font-size: 26px; }
          .cta-btn       { width: 100%; justify-content: center; }
          .footer-links  { gap: 16px; font-size: 13px; }
          .cta-outer     { padding: 0 12px 48px; }
          .search-box    { border-radius: 14px; }
          .search-go     { padding: 0 16px; font-size: 13.5px; }
        }
      `}</style>

      <div className="pg-root">
        <GradientDefs />
        <div className="pg-bg" />
        <ScrollProgressBar />

        {/* ── TOPBAR ── */}
        <div className="pg-topbar">
          🎉 Now live: Voice AI Agent &amp; WhatsApp Chatbot &nbsp;·&nbsp;{" "}
          <a href="mailto:tokenpe.online@gmail.com">Get early access →</a>
        </div>

        {/* ── NAV ── */}
        <nav className={`pg-nav${scrolled ? " scrolled" : ""}`}>
          <div className="pg-nav-inner">
            <img src="/logo-dark.svg" alt="TokenPe" style={{ height: 38, cursor: "pointer" }} onClick={() => router.push("/")} />
            <div className="pg-nav-links">
              <button className="pg-nl" onClick={() => go("features")}>Features</button>
              <button className="pg-nl" onClick={() => go("how")}>How it works</button>
              <button className="pg-nl" onClick={() => go("ai")}>AI Tools</button>
              <button className="pg-nl" onClick={() => router.push("/find-salon")}>Find salon</button>
              <button className="btn btn-primary" onClick={() => router.push("/salon-login?mode=register")}>
                Start 7-day free trial
              </button>
            </div>
            <button className="pg-burger" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={30} /></button>
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
                <img src="/logo-dark.svg" alt="TokenPe" style={{ height: 34 }} />
                <button className="pg-burger" onClick={() => setMenuOpen(false)} aria-label="Close"><X size={30} /></button>
              </div>
              <button className="mm-link" onClick={() => go("features")}>Features</button>
              <button className="mm-link" onClick={() => go("how")}>How it works</button>
              <button className="mm-link" onClick={() => go("ai")}>AI Tools</button>
              <button className="mm-link" onClick={() => { setMenuOpen(false); router.push("/find-salon"); }}>Find salon</button>
              <div style={{ marginTop: 44 }}>
                <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }} onClick={() => router.push("/salon-login?mode=register")}>
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
                    Built for salons &amp; spas across India
                  </div>
                </motion.div>

                <motion.h1 className="hero-h1" initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.1 }}>
                  Ditch the chaos.<br />
                  <span className="hero-h1-grad">
                    <span className="tw-wrap">{heroWord}</span>
                    <span className="tw-cursor" aria-hidden />
                  </span>
                </motion.h1>

                <motion.p className="hero-sub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }}>
                  No more crowded lobbies during peak hours. Clients scan a QR code, join a digital queue, and get called the moment their stylist is free — all on WhatsApp.
                </motion.p>

                <motion.form className="search-box" onSubmit={handleSearch} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.25 }}>
                  <Search size={20} color="#9CA3AF" style={{ margin: "auto 0 auto 10px", flexShrink: 0 }} />
                  <input className="search-inp" type="text" placeholder="Search salon by name or city..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <button type="submit" className="search-go">Find</button>
                </motion.form>

                <motion.div className="hero-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3 }}>
                  <button className="btn btn-primary btn-lg" onClick={() => router.push("/salon-login?mode=register")}>
                    Start 7-day free trial <ArrowRight size={18} />
                  </button>
                  <button className="btn btn-ghost btn-lg" onClick={() => go("how")}>See how it works</button>
                </motion.div>

                <motion.div className="trust-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, delay: 0.4 }}>
                  <div className="trust-avatars">
                    {["R","A","M","S","K"].map((l) => <div key={l} className="trust-av">{l}</div>)}
                  </div>
                  <div>
                    <div className="stars">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="#D14D72" stroke="none" />)}</div>
                    <div className="trust-text"><b>500+ salons</b> already streamlining their queue</div>
                  </div>
                </motion.div>

              </div>
              <HeroDevice />
            </div>
          </div>
        </div>

        {/* ── CITY MARQUEE ── */}
        <div className="city-strip">
          <div className="city-label">Salons live in</div>
          <CityMarquee />
        </div>

        {/* ── STATS ── */}
        <div style={{ padding: "64px 32px 0" }}>
          <Reveal className="stats-band">
            <div className="stats-grid">
              {[
                { t: 500,     s: "+",  d: 0, l: "Salons onboarded"    },
                { t: 1200000, s: "+",  d: 0, l: "Tokens served"       },
                { t: 32,      s: "%",  d: 0, l: "Avg. wait time cut"  },
                { t: 4.8,     s: "/5", d: 1, l: "Average salon rating"},
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
            <span className="eyebrow">New · Live AI Features</span>
            <h2 className="sec-title">Your salon, powered by AI</h2>
            <p className="sec-sub">TokenPe goes beyond a queue app — it's an intelligent front desk that works 24/7, so you don't have to.</p>
          </Reveal>

          <div className="power-grid">
            {/* ─ Voice AI ─ */}
            <Reveal delay={0} className="power-card">
              <div className="power-card-top">
                <div className="power-icon"><Phone size={26} color="#D14D72" /></div>
                <div>
                  <div className="power-tag">Voice AI</div>
                  <div className="power-title">AI Calling Agent</div>
                </div>
              </div>
              <p className="power-desc">
                Clients call your salon — our voice AI answers, books appointments, checks queue status, and sends confirmations. Zero staff effort.
              </p>
              <div className="power-demo">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#D14D72,#C0405F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Mic size={18} color="#fff" />
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "#1A1A1A" }}>AI Agent · Live call</span>
                  <span style={{ marginLeft: "auto", fontSize: 11.5, color: "#1E9E5A", fontWeight: 800, background: "#DCF5E8", padding: "2px 8px", borderRadius: 8 }}>● Active</span>
                </div>
                <Waveform />
                <div style={{ marginTop: 14, fontSize: 12.5, color: "#6B7280", fontStyle: "italic", lineHeight: 1.6 }}>
                  "Your slot is confirmed for 4:30pm. Token S-07 will arrive on WhatsApp shortly."
                </div>
              </div>
              <div className="power-badge"><Zap size={14} /> Handles 100+ calls/day automatically</div>
            </Reveal>

            {/* ─ WhatsApp Chatbot ─ */}
            <Reveal delay={0.15} className="power-card">
              <div className="power-card-top">
                <div className="power-icon"><MessageSquare size={26} color="#D14D72" /></div>
                <div>
                  <div className="power-tag">WhatsApp AI</div>
                  <div className="power-title">Smart Chatbot</div>
                </div>
              </div>
              <p className="power-desc">
                Auto-replies, queue tokens, feedback collection, and FAQs — all handled on WhatsApp, around the clock.
              </p>
              <div className="power-demo" style={{ padding: "0", border: "none", background: "transparent" }}>
                <WhatsAppChat />
              </div>
              <div className="power-badge"><Clock size={14} /> 24 / 7 instant responses</div>
            </Reveal>

            {/* ─ Google Reviews ─ */}
            <Reveal delay={0.3} className="power-card">
              <div className="power-card-top">
                <div className="power-icon"><ThumbsUp size={26} color="#D14D72" /></div>
                <div>
                  <div className="power-tag">Reputation</div>
                  <div className="power-title">Google Reviews</div>
                </div>
              </div>
              <p className="power-desc">
                After every visit, TokenPe sends a WhatsApp message requesting a Google Review — building your online reputation on autopilot.
              </p>
              <div className="power-demo">
                <div style={{ marginBottom: 16 }}><AnimatedStars /></div>
                <div style={{ fontSize: 13.5, color: "#333", lineHeight: 1.65, fontStyle: "italic", marginBottom: 16 }}>
                  "Amazing experience! The queue system is genius 🌟"
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#FBEAEF,#F5D6E2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#C0405F" }}>P</div>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>Priya M. · via Google</span>
                  <span style={{ marginLeft: "auto", fontSize: 11.5, background: "#FBEAEF", color: "#C0405F", padding: "3px 10px", borderRadius: 100, fontWeight: 700, border: "1px solid #F5D6E2" }}>Auto-sent</span>
                </div>
              </div>
              <div className="power-badge"><Star size={14} fill="#D14D72" stroke="none" /> Avg. 4.9★ rating after 90 days</div>
            </Reveal>
          </div>
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
                <X size={22} color="#9CA3AF" />
                <span style={{ color: "#6B7280" }}>Without TokenPe</span>
              </div>
              {BEFORE.map((item, i) => (
                <div key={i} className="compare-item">
                  <X size={18} style={{ color: "#D0D0D0", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: "#6B7280" }}>{item}</span>
                </div>
              ))}
            </Reveal>
            <Reveal delay={0.15} className="compare-card compare-after">
              <div className="compare-head">
                <CheckCircle2 size={22} color="#D14D72" />
                <span style={{ color: "#D14D72" }}>With TokenPe</span>
              </div>
              {AFTER.map((item, i) => (
                <div key={i} className="compare-item">
                  <CheckCircle2 size={18} style={{ color: "#D14D72", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: "#333" }}>{item}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </div>

        {/* ── FEATURES GRID ── */}
        <section className="sec" id="features" style={{ paddingTop: 0 }}>
          <Reveal className="sec-head">
            <span className="eyebrow">Everything, in one place</span>
            <h2 className="sec-title">Built for the way salons actually run</h2>
            <p className="sec-sub">From the front-desk queue to staff payouts — TokenPe replaces notebooks and spreadsheets with one clean dashboard.</p>
          </Reveal>
          <div className="feat-grid">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.1} className="feat-card">
                <div className="feat-icon"><f.icon size={26} color="#D14D72" /></div>
                <div className="feat-tag">{f.tag}</div>
                <h3 className="feat-title">{f.title}</h3>
                <p className="feat-desc">{f.desc}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="sec" id="how" style={{ paddingTop: 0 }}>
          <Reveal className="sec-head">
            <span className="eyebrow">Simple setup</span>
            <h2 className="sec-title">Live in under 10 minutes</h2>
            <p className="sec-sub">Zero hardware, zero training. If your staff can use WhatsApp, they can use TokenPe.</p>
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

        {/* ── LOGO MARQUEE ── */}
        <div className="logo-strip">
          <div className="logo-label">Trusted by salon owners across India</div>
          <LogoMarquee />
        </div>

        {/* ── TESTIMONIALS ── */}
        <section className="sec" style={{ paddingTop: 90 }}>
          <Reveal className="sec-head">
            <span className="eyebrow">Loved by salon owners</span>
            <h2 className="sec-title">Don&apos;t just take our word for it</h2>
          </Reveal>
          <div className="test-grid">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.n} delay={i * 0.15} className="test-card">
                <div className="stars">{Array.from({ length: 5 }).map((_, j) => <Star key={j} size={16} fill="#D14D72" stroke="none" />)}</div>
                <p className="test-q">&ldquo;{t.q}&rdquo;</p>
                <div className="test-person">
                  <div className="test-av">{t.n.split(" ").map((w) => w[0]).join("")}</div>
                  <div>
                    <div className="test-name">{t.n}</div>
                    <div className="test-role">{t.r}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
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
                background: `radial-gradient(450px circle at ${spotlight.x}% ${spotlight.y}%, rgba(245,163,190,0.25), transparent 60%)`,
                transition: "background 0.1s",
              }} />
              <div style={{ position: "absolute", inset: 0, borderRadius: 40, background: "radial-gradient(600px circle at 15% 20%, rgba(245,163,190,0.18), transparent 55%), radial-gradient(450px circle at 85% 80%, rgba(245,163,190,0.15), transparent 55%)", pointerEvents: "none" }} />

              <div className="cta-inner">
                <Reveal delay={0.05}>
                  <div className="cta-pill"><Sparkles size={16} /> 7-day free trial · No card required</div>
                </Reveal>
                <Reveal delay={0.15}>
                  <h2 className="cta-h2">Ready to modernize<br />your salon?</h2>
                </Reveal>
                <Reveal delay={0.25}>
                  <p className="cta-p">Join hundreds of salons across India running a smoother, more professional front desk with TokenPe.</p>
                </Reveal>
                <Reveal delay={0.35}>
                  <button className="cta-btn" onClick={() => router.push("/salon-login?mode=register")}>
                    Register your salon for free <ArrowRight size={18} />
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
          <div>© {new Date().getFullYear()} TokenPe · Made with ♥ for Indian salons</div>
          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="mailto:tokenpe.online@gmail.com">Contact Us</a>
            <a href="/find-salon">Find a Salon</a>
          </div>
        </footer>
      </div>
    </>
  );
}
