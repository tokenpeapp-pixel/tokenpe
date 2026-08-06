"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Search, CheckCircle2, Bell, Scissors, Sparkles, Menu, X, Star,
  ArrowRight, TrendingUp, Phone, MessageSquare, Mic, Zap, Clock,
  ThumbsUp, BarChart3, Users, Package, QrCode, Shield, CheckCheck,
  Calendar, ShieldCheck, FileText, UserCheck, Award, PartyPopper, Heart,
  Sparkle, Crown
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   TYPEWRITER HOOK
═══════════════════════════════════════════════════════════════ */
function useTypewriter(words, speed = 85, deleteSpeed = 48, pause = 2200) {
  const [text, setText] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIdx % words.length];
    let timer;

    if (!deleting) {
      if (text.length < currentWord.length) {
        timer = setTimeout(() => setText(currentWord.slice(0, text.length + 1)), speed);
      } else {
        timer = setTimeout(() => setDeleting(true), pause);
      }
    } else {
      if (text.length > 0) {
        timer = setTimeout(() => setText(currentWord.slice(0, text.length - 1)), deleteSpeed);
      } else {
        setDeleting(false);
        setWordIdx((prev) => prev + 1);
      }
    }
    return () => clearTimeout(timer);
  }, [text, deleting, wordIdx, words, speed, deleteSpeed, pause]);

  return text;
}

/* ═══════════════════════════════════════════════════════════════
   REVEAL WRAPPER
═══════════════════════════════════════════════════════════════ */
function Reveal({ children, delay = 0, className = "", style = {} }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 36 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ANIMATED FLOATING SALON SVG OBJECTS (REPLICATED FROM REFERENCE)
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
        <rect key={x} x={x} y="15" width="5.5" height="18" rx="2.8" fill="#D14D72" opacity="0.85" />
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
      <circle cx="33" cy="28" r="5" fill="#D14D72" opacity="0.65" />
      <path d="M74 23 L80 21 M74 30 L82 30 M74 37 L80 39" stroke="#E8829D" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SvgRazor() {
  return (
    <svg width="36" height="64" viewBox="0 0 36 64" fill="none">
      <rect x="8" y="2" width="20" height="30" rx="5" fill="#FBEAEF" stroke="#D14D72" strokeWidth="2" />
      <rect x="12" y="32" width="12" height="28" rx="4" fill="#F5D6E2" stroke="#D14D72" strokeWidth="1.8" />
      <rect x="10" y="9" width="16" height="4.5" rx="2.2" fill="#D14D72" opacity="0.55" />
      <rect x="10" y="16" width="16" height="4.5" rx="2.2" fill="#D14D72" opacity="0.55" />
      <rect x="10" y="23" width="16" height="4.5" rx="2.2" fill="#D14D72" opacity="0.55" />
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
        <rect x="4" y="10" width="22" height="9" fill="#D14D72" opacity="0.85" />
        <rect x="4" y="28" width="22" height="9" fill="#D14D72" opacity="0.85" />
        <rect x="4" y="46" width="22" height="9" fill="#D14D72" opacity="0.85" />
        <rect x="4" y="60" width="22" height="8" fill="#D14D72" opacity="0.85" />
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
      <ellipse cx="23" cy="24" rx="14" ry="16" fill="#fff" opacity="0.7" />
      <path d="M19 5 Q23 2 27 5" stroke="#D14D72" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <rect x="20" y="45" width="6" height="18" rx="3" fill="#FBEAEF" stroke="#D14D72" strokeWidth="1.8" />
      <rect x="11" y="61" width="24" height="5" rx="2.5" fill="#F5D6E2" stroke="#D14D72" strokeWidth="1.6" />
    </svg>
  );
}

function SvgNailPolish() {
  return (
    <svg width="28" height="64" viewBox="0 0 28 64" fill="none">
      <rect x="7" y="20" width="14" height="38" rx="5" fill="#FBEAEF" stroke="#D14D72" strokeWidth="2" />
      <rect x="9" y="25" width="10" height="28" rx="3.5" fill="#E8829D" opacity="0.6" />
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
      <ellipse cx="9" cy="56" rx="4.5" ry="9" fill="#E8829D" opacity="0.65" />
    </svg>
  );
}

function SvgHaircut() {
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
      <circle cx="34" cy="40" r="14" fill="#FBEAEF" stroke="#D14D72" strokeWidth="2" />
      <path d="M14 68 Q34 45 54 68" fill="#F5D6E2" stroke="#D14D72" strokeWidth="2" />
      <path d="M22 40 Q34 15 46 40" fill="#D14D72" opacity="0.15" stroke="#D14D72" strokeWidth="2" />
      <path d="M30 18 L44 10 M30 10 L44 18" stroke="#D14D72" strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="8" r="2.5" fill="#D14D72" />
      <circle cx="28" cy="20" r="2.5" fill="#D14D72" />
    </svg>
  );
}

const FLOAT_OBJECTS = [
  { Comp: SvgScissors, pos: { top: "6%", left: "2%" }, anim: { y: [-14, 12, -14], rotate: [-18, 10, -18] }, dur: 5.4, delay: 0 },
  { Comp: SvgComb, pos: { top: "12%", right: "3%" }, anim: { y: [8, -12, 8], rotate: [4, -7, 4] }, dur: 4.9, delay: 0.5 },
  { Comp: SvgHairDryer, pos: { top: "52%", left: "1%" }, anim: { y: [-9, 13, -9], rotate: [0, 7, 0] }, dur: 6.2, delay: 1.0 },
  { Comp: SvgRazor, pos: { top: "70%", right: "2%" }, anim: { y: [11, -13, 11], rotate: [14, -9, 14] }, dur: 5.6, delay: 0.3 },
  { Comp: SvgBarberPole, pos: { top: "33%", right: "1.5%" }, anim: { y: [-10, 9, -10], rotate: [0, 3, 0] }, dur: 7.1, delay: 0.8 },
  { Comp: SvgMirror, pos: { top: "36%", left: "1.5%" }, anim: { y: [7, -11, 7], rotate: [-6, 6, -6] }, dur: 6.4, delay: 1.3 },
  { Comp: SvgNailPolish, pos: { top: "80%", left: "3%" }, anim: { y: [-7, 11, -7], rotate: [8, -6, 8] }, dur: 5.1, delay: 0.6 },
  { Comp: SvgBrush, pos: { top: "85%", right: "3%" }, anim: { y: [9, -9, 9], rotate: [-12, 10, -12] }, dur: 4.7, delay: 0.2 },
  { Comp: SvgHaircut, pos: { top: "8%", left: "44%" }, anim: { y: [-15, 10, -15], rotate: [-5, 5, -5] }, dur: 6.5, delay: 0.4 },
];

function FloatingSalonSVGs() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {FLOAT_OBJECTS.map(({ Comp, pos, anim, dur, delay }, i) => (
        <motion.div
          key={i}
          style={{ position: "absolute", opacity: 0.3, ...pos }}
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
   HERO DEVICE MOCKUP — SALON CHAIR QUEUE
═══════════════════════════════════════════════════════════════ */
function HeroDeviceMockup() {
  return (
    <motion.div
      className="hd-wrap"
      initial={{ opacity: 0, scale: 0.92, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="hd-glow" />
      <div className="hd-phone">
        <div className="hd-notch" />
        <div className="hd-screen">
          <div className="hd-header">
            <Scissors size={15} color="#D14D72" />
            <span>GLAMOUR SALON &amp; SPA</span>
            <span className="hd-live">● LIVE</span>
          </div>

          <div className="hd-card">
            <div className="hd-token">T-04</div>
            <div>
              <div className="hd-card-title">Priya Sharma</div>
              <div className="hd-card-sub">Hair Spa &amp; Styling · Stylist Rahul</div>
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: "#6B4052", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Stylist Chair Queue (3 waiting)
          </div>

          <div className="hd-row hi">
            <div className="hd-av active">04</div>
            <div className="hd-line" />
            <span className="hd-st serving">In Chair</span>
          </div>
          <div className="hd-row">
            <div className="hd-av">05</div>
            <div className="hd-line" />
            <span className="hd-st wait">Next in line</span>
          </div>
          <div className="hd-row">
            <div className="hd-av">06</div>
            <div className="hd-line" />
            <span className="hd-st done"><CheckCircle2 size={12} /> Appointment Done</span>
          </div>

          <div className="hd-toast">
            <Bell size={16} color="#D14D72" />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#2C0917" }}>WhatsApp Alert Sent</div>
              <div style={{ fontSize: 10, color: "#6B4052" }}>"Your stylist is ready! Please step to Chair 2"</div>
            </div>
          </div>
        </div>
      </div>

      <motion.div className="hd-chip chip-a" animate={{ y: [0, -14, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
        <Sparkles size={14} color="#D14D72" /> 800+ Salons live
      </motion.div>
      <motion.div className="hd-chip chip-b" animate={{ y: [0, 14, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}>
        <TrendingUp size={14} color="#C0405F" /> 35% more weekend walk-ins
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
          style={{ width: 5, borderRadius: 3, background: "linear-gradient(180deg,#D14D72,#F5D6E2)", flexShrink: 0 }}
          animate={{ height: [h * 0.6, h * 2.8, h * 0.6] }}
          transition={{ duration: 0.7 + i * 0.05, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WHATSAPP CHATBOT — SALON CHAT UI
═══════════════════════════════════════════════════════════════ */
const CHAT = [
  { from: "client", text: "Hi! Looking for a Hair Spa & Color booking for today at 3 PM.", time: "11:20 AM" },
  { from: "bot", text: "Hello Priya! Request received for Hair Spa & Color. Reply 'CONFIRM' to lock your slot with Senior Stylist Rahul.", time: "11:20 AM" },
  { from: "client", text: "CONFIRM", time: "11:21 AM" },
  { from: "bot", text: "Booking Confirmed! Token: T-04. Valid for 3:00 PM today. We will ping you 10 mins before your turn!", time: "11:21 AM" },
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
            maxWidth: "84%", padding: "8px 12px", borderRadius: 12, fontSize: 12.5, lineHeight: 1.45,
            background: msg.from === "client" ? "#dcf8c6" : "#ffffff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.15)", color: "#111827",
            borderTopRightRadius: msg.from === "client" ? 2 : 12,
            borderTopLeftRadius: msg.from === "bot" ? 2 : 12,
          }}>
            <div>{msg.text}</div>
            <div style={{ fontSize: 9.5, color: "#888", textAlign: "right", marginTop: 4 }}>{msg.time}</div>
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
  const items = [...CITIES, ...CITIES, ...CITIES];
  return (
    <div style={{ overflow: "hidden" }}>
      <motion.div
        style={{ display: "inline-flex", gap: 70, whiteSpace: "nowrap", paddingRight: 70 }}
        animate={{ x: ["0%", "-33.333333%"] }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      >
        {items.map((c, i) => (
          <span key={i} style={{ fontSize: 15, fontWeight: 700, color: "#C0405F", letterSpacing: "0.04em", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Sparkle size={14} fill="#D14D72" color="#D14D72" /> {c}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE AUTO CAROUSEL WITH PROGRESS DOTS
═══════════════════════════════════════════════════════════════ */
function MobileAutoCarousel({ children, total, activeDotColor = "#D14D72" }) {
  const containerRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const getScrollEl = () => {
    if (!containerRef.current) return null;
    return containerRef.current.querySelector('.power-grid, .feat-grid, .test-grid') || containerRef.current;
  };

  const handleScroll = () => {
    const el = getScrollEl();
    if (!el) return;
    const scrollPos = el.scrollLeft;
    const firstCard = el.querySelector('.power-card, .feat-card, .test-card') || el.firstElementChild;
    const cardWidth = firstCard ? firstCard.offsetWidth + 16 : el.offsetWidth;
    const idx = Math.round(scrollPos / cardWidth);
    setActiveIdx(Math.min(Math.max(0, idx), total - 1));
  };

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    const interval = setInterval(() => {
      const el = getScrollEl();
      if (!el) return;
      setActiveIdx((prevIdx) => {
        const nextIdx = (prevIdx + 1) % total;
        const firstCard = el.querySelector('.power-card, .feat-card, .test-card') || el.firstElementChild;
        const cardWidth = firstCard ? firstCard.offsetWidth + 16 : el.offsetWidth;
        el.scrollTo({ left: nextIdx * cardWidth, behavior: "smooth" });
        return nextIdx;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [total]);

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
      <div ref={containerRef} onScroll={handleScroll} className="mobile-carousel-grid">
        {children}
      </div>
      <div className="carousel-dots-wrap">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIdx(i)}
            className={`carousel-dot ${activeIdx === i ? "active" : ""}`}
            style={{
              backgroundColor: activeIdx === i ? activeDotColor : "rgba(245, 214, 226, 0.6)",
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN SALON LANDING PAGE COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function SalonLandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const typewriterText = useTypewriter([
    "hair styling & cuts",
    "bridal makeup queues",
    "WhatsApp appointment bot",
    "VIP chair booking",
    "facial & spa scheduling"
  ]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/find-salon?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push("/find-salon");
    }
  };

  const go = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
  };

  const FEATURES = [
    { icon: QrCode, tag: "SCAN & JOIN", title: "Instant QR Code Queue", desc: "Clients simply scan the QR code at your salon entrance to instantly join the queue on WhatsApp — zero apps to download." },
    { icon: Bell, tag: "CHAIR QUEUE", title: "Real-time WhatsApp Queue Alerts", desc: "Automatic 'your turn next' pings on WhatsApp so clients shop or relax nearby without crowding waiting couches." },
    { icon: BarChart3, tag: "ANALYTICS & REPORTS", title: "Real-Time Queue Analytics", desc: "Track daily appointments, peak salon hours, stylist utilization, and revenue insights with live reports." },
    { icon: Users, tag: "CLIENT CRM", title: "Stylist & Client Records", desc: "Track preferred stylists, hair color codes, last visit dates, and VIP notes in one secure dashboard." },
    { icon: Package, tag: "INVENTORY", title: "Products & Beauty Supplies", desc: "Track salon retail products and shampoo bar inventory, receiving automated alerts before stock runs low." },
    { icon: TrendingUp, tag: "REVENUE", title: "Revenue & Re-visit Insights", desc: "Live dashboards on client retention, weekend peak hours, and repeat booking rates backed by real data." },
  ];

  const STEPS = [
    { n: "01", title: "Display your QR code", desc: "Place QR stands at your salon reception desk or waiting lounge." },
    { n: "02", title: "Clients scan & join", desc: "Clients pick their service and preferred stylist right from their phone." },
    { n: "03", title: "Stylists tap & notify", desc: "Staff tap 'Call Next'; clients get instant WhatsApp alerts to step to the chair." },
  ];

  const TESTIMONIALS = [
    { q: "Our Saturday weekend rush used to be chaos on the waiting couches. Now clients wait comfortably in nearby cafes until WhatsApp pings them.", n: "Ritu Mehra", r: "Owner, Lakmé Salon Bandra" },
    { q: "WhatsApp booking alerts and digital tokens made our salon experience 10x more premium and professional.", n: "Vikram Kapoor", r: "Founder, Hair & Care Studio, Delhi" },
    { q: "Clients love receiving WhatsApp updates instead of asking receptionist every 10 minutes when their turn is.", n: "Pooja Hegde", r: "Manager, Bodycraft Spa, Bengaluru" },
  ];

  const BEFORE = [
    "Clients crowd the waiting lounge during weekend peak hours",
    "Receptionist manually writes paper tokens — slow & error-prone",
    "No digital record of client service history or color formulas",
    "Clients get frustrated waiting without knowing estimated time",
    "High call volume asking about appointment availability",
    "No automated way to request Google reviews after service",
  ];
  const AFTER = [
    "Clients relax nearby or shop — lounge remains peaceful",
    "WhatsApp digital appointment tokens with instant confirmation",
    "100% digital history of preferred stylists & color records",
    "WhatsApp alert when chair is ready → 35% shorter wait times",
    "AI voice agent & WhatsApp bot answer booking queries 24/7",
    "Automated feedback & Google review requests after appointment",
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@500;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        .pg-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #FCE7F0;
          color: #2C0917;
          overflow-x: clip;
          -webkit-font-smoothing: antialiased;
        }

        /* ── AMBIENT BACKGROUND ── */
        .pg-bg {
          position: fixed; inset: 0; z-index: -1; pointer-events: none;
          background: #FCE7F0;
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
          background: rgba(252,231,240,0.92);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(209,77,114,0.2);
          transition: box-shadow 0.3s, background 0.3s;
        }
        .pg-nav.scrolled { box-shadow: 0 6px 40px rgba(209,77,114,0.2); background: rgba(252,231,240,0.97); }
        .pg-nav-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 32px;
        }
        .pg-nav-links { display: flex; align-items: center; gap: 36px; }
        .pg-nl {
          color: #6B4052; font-weight: 600; font-size: 14.5px; cursor: pointer;
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
          box-shadow: 0 10px 25px rgba(209,77,114,0.35);
        }
        .btn-primary::before {
          content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transform: skewX(-20deg); transition: 0.5s;
        }
        .btn-primary:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 16px 35px rgba(209,77,114,0.48); }
        .btn-primary:hover::before { left: 150%; }
        .btn-primary:active { transform: scale(0.97); }

        .btn-ghost {
          background: #fff; color: #2C0917; padding: 14px 26px; font-size: 14.5px;
          border: 1.5px solid #F5D6E2; box-shadow: 0 4px 10px rgba(0,0,0,0.03);
        }
        .btn-ghost:hover { border-color: #D14D72; color: #D14D72; transform: translateY(-3px); box-shadow: 0 8px 20px rgba(209,77,114,0.18); }
        .btn-lg { padding: 16px 36px !important; font-size: 15.5px !important; border-radius: 16px !important; }

        /* ── HERO ── */
        .hero-outer { position: relative; overflow: hidden; padding-bottom: 40px; }
        .hero-wrap { position: relative; padding: 80px 32px 64px; max-width: 1280px; margin: 0 auto; z-index: 1; }
        .hero-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 60px; align-items: center; }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 10px;
          background: #FBEAEF; border: 1px solid #F5D6E2; color: #C0405F;
          padding: 10px 20px; border-radius: 100px; font-size: 13.5px; font-weight: 700; margin-bottom: 32px;
          box-shadow: 0 4px 15px rgba(209,77,114,0.12); cursor: default;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .hero-badge:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(209,77,114,0.22); }
        .badge-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #D14D72;
          animation: pulse-dot 1.5s infinite;
        }
        @keyframes pulse-dot {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.7); opacity: 0.5; }
        }

        .hero-h1 {
          font-family: 'Playfair Display', serif; font-size: 60px; font-weight: 700;
          line-height: 1.15; letter-spacing: -0.02em; margin-bottom: 28px; color: #2C0917;
        }
        .hero-h1-grad {
          display: block;
          background: linear-gradient(120deg, #D14D72, #C0405F 40%, #E8829D);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        }
        .tw-wrap { display: inline-block; min-width: 260px; }
        .tw-cursor {
          display: inline-block; width: 3px; height: 0.85em; background: #D14D72;
          margin-left: 4px; border-radius: 2px; vertical-align: text-bottom;
          animation: blink 0.9s step-end infinite;
        }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

        .hero-sub { font-size: 18px; color: #6B4052; line-height: 1.75; margin-bottom: 40px; max-width: 520px; }

        .search-box {
          background: #fff; border: 1.5px solid #F5D6E2; border-radius: 18px;
          padding: 8px; display: flex; gap: 10px; max-width: 500px; margin-bottom: 32px;
          box-shadow: 0 12px 40px rgba(209,77,114,0.12); transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .search-box:hover { transform: translateY(-2px); box-shadow: 0 16px 50px rgba(209,77,114,0.18); }
        .search-box:focus-within { border-color: #D14D72; box-shadow: 0 16px 50px rgba(209,77,114,0.28); transform: translateY(-3px); }
        .search-inp {
          flex: 1; background: transparent; border: none; color: #2C0917;
          font-size: 15.5px; padding: 12px 8px 12px 16px; outline: none; font-family: inherit;
        }
        .search-inp::placeholder { color: #A88191; }
        .search-go {
          background: linear-gradient(135deg,#D14D72,#C0405F); color: #fff; border: none;
          border-radius: 14px; padding: 0 26px; font-weight: 700; font-size: 14.5px;
          cursor: pointer; font-family: inherit; transition: transform 0.2s, box-shadow 0.2s;
        }
        .search-go:hover { transform: translateY(-1px); box-shadow: 0 6px 15px rgba(209,77,114,0.35); }

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
        .trust-text { font-size: 14px; color: #6B4052; }
        .trust-text b { color: #2C0917; }

        /* ── DEVICE ── */
        .hd-wrap { position: relative; display: flex; align-items: center; justify-content: center; min-height: 540px; perspective: 1000px; }
        .hd-glow { position: absolute; width: 400px; height: 400px; background: radial-gradient(circle, rgba(209,77,114,0.22), transparent 70%); filter: blur(20px); border-radius: 50%; }
        .hd-phone { position: relative; width: 280px; background: #230512; border-radius: 40px; padding: 14px; box-shadow: 0 40px 80px rgba(92,26,52,0.4), 0 10px 25px rgba(0,0,0,0.25); transform-style: preserve-3d; transition: transform 0.5s ease; }
        .hd-wrap:hover .hd-phone { transform: rotateY(-10deg) rotateX(5deg); }
        .hd-notch { width: 80px; height: 20px; background: #230512; border-radius: 0 0 16px 16px; margin: 0 auto 8px; }
        .hd-screen { background: #FDF8F9; border-radius: 28px; padding: 18px 16px 24px; min-height: 420px; }
        .hd-header { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: #2C0917; margin-bottom: 16px; }
        .hd-live { margin-left: auto; font-size: 11px; color: #1E9E5A; font-weight: 800; background: #DCF5E8; padding: 3px 8px; border-radius: 10px; }
        .hd-card { background: linear-gradient(135deg,#D14D72,#C0405F); border-radius: 18px; padding: 16px; display: flex; align-items: center; gap: 14px; margin-bottom: 18px; box-shadow: 0 15px 30px rgba(209,77,114,0.45); }
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
        .hd-st.wait    { background: #FEF3C7; color: #D97706; }
        .hd-toast { margin-top: 18px; background: #fff; color: #2C0917; padding: 10px 14px; border-radius: 16px; display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.12); border: 1px solid rgba(0,0,0,0.04); }
        .hd-chip { position: absolute; background: #fff; border: 1.5px solid #F5D6E2; box-shadow: 0 15px 35px rgba(209,77,114,0.2); border-radius: 100px; padding: 12px 20px; font-size: 13.5px; font-weight: 700; display: flex; align-items: center; gap: 8px; transition: transform 0.3s, box-shadow 0.3s; cursor: default; }
        .hd-chip:hover { transform: scale(1.05) translateY(-5px) !important; box-shadow: 0 20px 45px rgba(209,77,114,0.28); }
        .chip-a { top: 8%;  left: -12%;  color: #D14D72; }
        .chip-b { bottom: 10%; right: -15%; color: #C0405F; }

        /* ── MARQUEE STRIP ── */
        .city-strip { background: #F9DFE7; border-top: 1px solid #F2C9D6; border-bottom: 1px solid #F2C9D6; padding: 20px 0; }
        .city-label { text-align: center; font-size: 12.5px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #D14D72; margin-bottom: 14px; }

        /* ── SECTIONS ── */
        .sec { padding: 110px 32px; max-width: 1280px; margin: 0 auto; }
        .sec-sm { padding: 80px 32px; max-width: 1280px; margin: 0 auto; }
        .sec-head { text-align: center; max-width: 680px; margin: 0 auto 64px; }
        .eyebrow { display: inline-block; font-size: 13px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #D14D72; margin-bottom: 16px; background: #FBEAEF; padding: 6px 16px; border-radius: 100px; border: 1px solid #F5D6E2; }
        .sec-title { font-family: 'Playfair Display', serif; font-size: 44px; font-weight: 700; margin-bottom: 18px; color: #2C0917; line-height: 1.25; }
        .sec-sub { font-size: 18px; color: #6B4052; line-height: 1.7; }

        /* ── STATS ── */
        .stats-band { background: linear-gradient(135deg,#230512,#5C1A34 50%,#D14D72); border-radius: 36px; padding: 64px 40px; max-width: 1220px; margin-inline: auto; box-shadow: 0 25px 60px rgba(92,26,52,0.3); }
        .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 30px; text-align: center; }
        .stats-grid > div { transition: transform 0.35s cubic-bezier(0.2,0.8,0.2,1); cursor: default; }
        .stats-grid > div:hover { transform: translateY(-8px) scale(1.08); }
        .stat-num { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 700; color: #fff; text-shadow: 0 4px 10px rgba(0,0,0,0.2); transition: text-shadow 0.3s; }
        .stats-grid > div:hover .stat-num { text-shadow: 0 0 25px rgba(245,214,226,0.9); }
        .stat-label { font-size: 14px; color: rgba(255,255,255,0.85); margin-top: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

        /* ── AI POWER CARDS ── */
        .power-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 28px; }
        .power-card {
          background: linear-gradient(135deg, #FFFFFF 0%, #FDF4F7 100%);
          border: 1.5px solid #F5D6E2;
          border-radius: 28px; padding: 36px 32px;
          box-shadow: 0 12px 35px rgba(209, 77, 114, 0.09), 0 2px 6px rgba(0, 0, 0, 0.04);
          transition: all 0.45s cubic-bezier(.16,1,.3,1);
          position: relative; overflow: hidden; cursor: pointer;
        }
        .power-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, #D14D72, #F5D6E2, #D14D72);
          opacity: 0; transition: opacity 0.4s ease;
        }
        .power-card:hover { transform: translateY(-14px) scale(1.02); box-shadow: 0 35px 85px rgba(209,77,114,0.22); border-color: #E8829D; }
        .power-card:hover::before { opacity: 1; }
        .power-card-top { display: flex; align-items: center; gap: 16px; margin-bottom: 22px; position: relative; z-index: 2; }
        .power-icon { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg,#FBEAEF,#F5D6E2); border: 1px solid #F5D6E2; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.4s, background 0.4s, color 0.4s; }
        .power-card:hover .power-icon { transform: scale(1.18) rotate(8deg); background: linear-gradient(135deg,#D14D72,#C0405F); color: #fff !important; }
        .power-card:hover .power-icon svg { stroke: #fff; }
        .power-tag { font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #D14D72; margin-bottom: 4px; }
        .power-title { font-size: 22px; font-weight: 700; color: #2C0917; letter-spacing: -0.01em; transition: color 0.3s; }
        .power-card:hover .power-title { color: #D14D72; }
        .power-desc { font-size: 15px; color: #6B4052; line-height: 1.7; margin-bottom: 26px; position: relative; z-index: 2; }
        .power-demo { background: #FFFFFF; border: 1.5px solid #F5D6E2; border-radius: 20px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); transition: background 0.35s, border-color 0.35s, transform 0.35s; position: relative; z-index: 2; }
        .power-card:hover .power-demo { background: #FBEAEF; border-color: #E8829D; transform: translateY(-2px); }
        .power-badge { display: inline-flex; align-items: center; gap: 8px; background: #FBEAEF; color: #C0405F; font-size: 13px; font-weight: 700; padding: 8px 16px; border-radius: 100px; margin-top: 20px; border: 1px solid #F5D6E2; transition: background 0.3s, border-color 0.3s, transform 0.3s; position: relative; z-index: 2; }
        .power-card:hover .power-badge { background: #F5D6E2; border-color: #E8829D; transform: scale(1.04); }

        /* Ghost watermark icon for cards */
        .card-ghost-icon {
          position: absolute;
          right: -15px;
          bottom: -15px;
          width: 145px;
          height: 145px;
          color: #D14D72;
          opacity: 0.12;
          pointer-events: none;
          z-index: 1;
          transition: transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.5s ease, color 0.5s ease;
        }
        .power-card:hover .card-ghost-icon,
        .feat-card:hover .card-ghost-icon {
          transform: scale(1.35) rotate(-12deg) translate(-10px, -10px);
          opacity: 0.28;
          color: #D14D72;
        }

        /* ── BEFORE / AFTER ── */
        .compare-wrap { max-width: 1220px; margin-inline: auto; padding: 0 32px 90px; }
        .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .compare-card { border-radius: 26px; padding: 36px; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s, border-color 0.4s; }
        .compare-before { background: linear-gradient(135deg, #FEF2F2 0%, #FFF5F5 100%); border: 2px solid #FECDD3; box-shadow: 0 12px 35px rgba(239, 68, 68, 0.08); }
        .compare-before:hover { transform: translateY(-10px) scale(1.01); border-color: #FCA5A5; box-shadow: 0 25px 60px rgba(239, 68, 68, 0.2); }
        .compare-after  { background: linear-gradient(135deg,#FBEAEF,#FDF8F9); border: 2px solid #F5D6E2; box-shadow: 0 15px 40px rgba(209,77,114,0.12); }
        .compare-after:hover { transform: translateY(-10px) scale(1.01); border-color: #E8829D; box-shadow: 0 25px 60px rgba(209,77,114,0.24); }
        .compare-head { display: flex; align-items: center; gap: 12px; margin-bottom: 26px; font-size: 18px; font-weight: 700; }
        .compare-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 15px; line-height: 1.6; transition: background 0.25s, padding-left 0.25s; }
        .compare-item:last-child { border-bottom: none; }
        .compare-item svg { transition: transform 0.25s ease, color 0.25s ease; }
        .compare-before .compare-item:hover { background: rgba(254, 226, 226, 0.7); border-radius: 8px; padding-left: 12px; cursor: default; }
        .compare-before .compare-item:hover svg { transform: scale(1.25) rotate(90deg); color: #DC2626; }
        .compare-after .compare-item:hover { background: rgba(255,255,255,0.7); border-radius: 8px; padding-left: 12px; cursor: default; }
        .compare-after .compare-item:hover svg { transform: scale(1.25) rotate(10deg); color: #D14D72; }

        /* ── FEATURES GRID ── */
        .feat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
        .feat-card {
          background: linear-gradient(135deg, #FFFFFF 0%, #FDF4F7 100%);
          border: 1.5px solid #F5D6E2;
          border-radius: 26px; padding: 36px 30px;
          box-shadow: 0 12px 35px rgba(209, 77, 114, 0.08), 0 2px 6px rgba(0,0,0,0.04);
          transition: all 0.45s cubic-bezier(.16,1,.3,1);
          position: relative; overflow: hidden; cursor: pointer;
        }
        .feat-card::before {
          content: ''; position: absolute; inset: 0; border-radius: 26px; padding: 2px;
          background: linear-gradient(135deg,#D14D72,#F5D6E2); opacity: 0;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          transition: opacity 0.4s; pointer-events: none;
        }
        .feat-card:hover { transform: translateY(-12px) scale(1.02); box-shadow: 0 35px 75px rgba(209,77,114,0.2); border-color: #E8829D; }
        .feat-card:hover::before { opacity: 1; }
        .feat-icon { width: 52px; height: 52px; border-radius: 15px; background: linear-gradient(135deg,#FBEAEF,#F5D6E2); border: 1px solid #F5D6E2; display: flex; align-items: center; justify-content: center; margin-bottom: 22px; transition: transform 0.4s, background 0.4s; position: relative; z-index: 2; }
        .feat-card:hover .feat-icon { transform: scale(1.2) rotate(-8deg); background: linear-gradient(135deg,#D14D72,#C0405F); color: #fff !important; }
        .feat-card:hover .feat-icon svg { stroke: #fff; }
        .feat-tag { font-size: 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #D14D72; margin-bottom: 10px; position: relative; z-index: 2; }
        .feat-title { font-size: 19px; font-weight: 700; color: #2C0917; margin-bottom: 12px; letter-spacing: -0.01em; transition: color 0.3s; position: relative; z-index: 2; }
        .feat-card:hover .feat-title { color: #D14D72; }
        .feat-desc { font-size: 14.5px; color: #6B4052; line-height: 1.7; position: relative; z-index: 2; }

        /* ── HOW IT WORKS ── */
        .how-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 48px; position: relative; }
        .how-grid::before { content: ''; position: absolute; top: 32px; left: 16%; right: 16%; height: 2px; background: linear-gradient(90deg,#F5D6E2,#D14D72,#F5D6E2); z-index: 0; }
        .how-step { position: relative; z-index: 1; text-align: center; cursor: default; transition: transform 0.35s cubic-bezier(0.16,1,0.3,1); }
        .how-step:hover { transform: translateY(-8px); }
        .how-n { width: 64px; height: 64px; background: linear-gradient(135deg,#D14D72,#C0405F); color: #fff; font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 28px; box-shadow: 0 0 0 10px #FDF8F9, 0 12px 30px rgba(209,77,114,0.35); transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s; }
        .how-step:hover .how-n { transform: scale(1.22) rotate(12deg); box-shadow: 0 0 0 14px #FDF8F9, 0 20px 45px rgba(209,77,114,0.5); }
        .how-h3 { font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #2C0917; transition: color 0.3s; }
        .how-step:hover .how-h3 { color: #D14D72; }
        .how-p { font-size: 15px; color: #6B4052; line-height: 1.7; max-width: 260px; margin-inline: auto; }

        /* ── TESTIMONIALS ── */
        .test-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 26px; }
        .test-card { background: #fff; border: 1.5px solid #F5D6E2; border-radius: 26px; padding: 32px 30px; transition: all 0.45s cubic-bezier(.16,1,.3,1); cursor: default; }
        .test-card:hover { transform: translateY(-10px) scale(1.02); box-shadow: 0 30px 65px rgba(209,77,114,0.18); border-color: #E8829D; }
        .test-q { font-size: 16px; color: #4A2031; line-height: 1.7; margin: 16px 0 26px; font-style: italic; }
        .test-person { display: flex; align-items: center; gap: 14px; }
        .test-av { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg,#FBEAEF,#F5D6E2); color: #C0405F; font-weight: 700; font-size: 16px; display: flex; align-items: center; justify-content: center; border: 2px solid #F5D6E2; transition: transform 0.35s, border-color 0.35s; }
        .test-card:hover .test-av { transform: scale(1.15) rotate(5deg); border-color: #D14D72; }
        .test-name { font-size: 15px; font-weight: 700; color: #2C0917; }
        .test-role { font-size: 13px; color: #A88191; }

        /* ── CTA ── */
        .cta-outer { padding: 0 32px 90px; }
        .cta-sec {
          border-radius: 40px; padding: 110px 56px; text-align: center;
          position: relative; overflow: hidden; max-width: 1220px; margin-inline: auto;
          background: linear-gradient(135deg,#230512,#5C1A34 40%,#D14D72);
          box-shadow: 0 30px 70px rgba(92,26,52,0.35);
        }
        .cta-inner { position: relative; z-index: 2; pointer-events: none; }
        .cta-inner button { pointer-events: auto; }
        .cta-pill { display: inline-flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); color: #fff; padding: 8px 20px; border-radius: 100px; font-size: 14px; font-weight: 700; margin-bottom: 28px; backdrop-filter: blur(5px); }
        .cta-h2 { font-family: 'Playfair Display', serif; font-size: 52px; font-weight: 700; color: #fff; margin-bottom: 22px; line-height: 1.2; text-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .cta-p { font-size: 19px; color: rgba(255,255,255,0.88); margin-bottom: 46px; max-width: 520px; margin-inline: auto; line-height: 1.7; }
        .cta-btn { display: inline-flex; align-items: center; gap: 12px; padding: 20px 46px; font-size: 16px; background: #fff; color: #C0405F; border: none; border-radius: 16px; font-weight: 800; cursor: pointer; font-family: inherit; transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: 0 10px 25px rgba(0,0,0,0.2); position: relative; z-index: 10; }
        .cta-btn:hover { transform: translateY(-4px) scale(1.04); box-shadow: 0 20px 45px rgba(0,0,0,0.35); color: #D14D72; }
        .cta-btn:active { transform: translateY(0) scale(0.98); }
        .cta-note { margin-top: 22px; font-size: 14px; color: rgba(255,255,255,0.65); }

        /* ── FOOTER ── */
        .pg-footer { text-align: center; padding: 48px 20px 40px; color: #6B4052; font-size: 14px; border-top: 2px solid #F5D6E2; background: #FDF8F9; font-weight: 500; }
        .footer-links { display: flex; justify-content: center; gap: 24px; margin-top: 16px; flex-wrap: wrap; }
        .footer-links a { color: #D14D72; text-decoration: none; font-weight: 600; transition: color 0.25s; font-size: 14px; }
        .footer-links a:hover { color: #5C1A34; }

        
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
          .hero-wrap     { padding: 40px 16px 24px; }
          .hero-h1       { font-size: 36px; }
          .hero-sub      { font-size: 15px; }
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
          .hero-cta      { flex-direction: column; align-items: stretch; }
          .hero-cta .btn { justify-content: center; }
          .hd-wrap       { display: none !important; }
          .hd-phone      { width: 220px; }
          .hd-screen     { min-height: 340px; padding: 14px 12px 18px; }
          .hd-glow       { width: 260px; height: 260px; }
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
            flex: 0 0 88% !important;
            min-width: 88% !important;
            max-width: 88% !important;
            scroll-snap-align: center !important;
            padding: 28px 22px !important;
            border-radius: 24px !important;
          }
          .cta-outer     { padding: 0 16px 56px; }
          .compare-card  { padding: 24px 18px; }
          .compare-head  { font-size: 16px; }
          .search-box    { max-width: 100%; }
          .stats-band    { border-radius: 24px; padding: 48px 20px; }
          .hero-badge    { font-size: 12px; padding: 8px 14px; }
        }
      `}</style>

      <div className="pg-root">
        <div className="pg-bg" />

        {/* ── TOPBAR ── */}
        <div className="pg-topbar">
          <PartyPopper size={15} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }} />
          Now live: Salon Voice AI Assistant &amp; WhatsApp Chair Booking Bot &nbsp;·&nbsp;{" "}
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
              <button className="pg-nl" onClick={() => router.push("/find-salon")}>Find salon</button>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button className="btn btn-primary" onClick={() => router.push("/salon-login")}>
                Start 7-day free trial <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="hero-outer">
          <FloatingSalonSVGs />
          <div className="hero-wrap">
            <div className="hero-grid">
              <div>
                <motion.div
                  className="hero-badge"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="badge-dot" />
                  <span>Built for salons &amp; spas across India</span>
                </motion.div>

                <motion.h1
                  className="hero-h1"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                >
                  Zero waiting lounge chaos for{" "}
                  <span className="hero-h1-grad">
                    <span className="tw-wrap">{typewriterText}</span>
                    <span className="tw-cursor" />
                  </span>
                </motion.h1>

                <motion.p
                  className="hero-sub"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  Replace paper token slips and crowded waiting couches with instant WhatsApp booking, AI receptionist calls, and digital chair queues.
                </motion.p>

                <motion.form
                  onSubmit={handleSearch}
                  className="search-box"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.25 }}
                >
                  <Search size={20} color="#A88191" style={{ alignSelf: "center", marginLeft: 8 }} />
                  <input
                    type="text"
                    className="search-inp"
                    placeholder="Search salon by city, area, or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="search-go">Search Salon</button>
                </motion.form>

                <motion.div
                  className="hero-cta"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                >
                  <button className="btn btn-primary btn-lg" onClick={() => router.push("/salon-login")}>
                    Get Started Free <ArrowRight size={18} />
                  </button>
                  <button className="btn btn-ghost btn-lg" onClick={() => go("features")}>
                    Explore Features
                  </button>
                </motion.div>

                <motion.div
                  className="trust-row"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <div className="trust-avatars">
                    <div className="trust-av">L</div>
                    <div className="trust-av">G</div>
                    <div className="trust-av">J</div>
                    <div className="trust-av">B</div>
                  </div>
                  <div className="trust-text">
                    Joined by <b>800+ top salons</b> across Mumbai, Delhi NCR, Bengaluru &amp; Pune
                  </div>
                </motion.div>
              </div>

              <HeroDeviceMockup />
            </div>
          </div>
        </section>

        {/* ── CITY MARQUEE ── */}
        <div className="city-strip">
          <div className="city-label">Salons live in</div>
          <CityMarquee />
        </div>

        {/* ── STATS BAND ── */}
        <section className="sec-sm">
          <div className="stats-band">
            <div className="stats-grid">
              <div>
                <div className="stat-num">800+</div>
                <div className="stat-label">Salons &amp; Spas Live</div>
              </div>
              <div>
                <div className="stat-num">3.5M+</div>
                <div className="stat-label">Clients Served</div>
              </div>
              <div>
                <div className="stat-num">35%</div>
                <div className="stat-label">More Walk-ins</div>
              </div>
              <div>
                <div className="stat-num">4.9</div>
                <div className="stat-label">Client Rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── AI POWER FEATURES ── */}
        <section className="sec" id="ai">
          <Reveal className="sec-head">
            <span className="eyebrow">New · Salon AI Features</span>
            <h2 className="sec-title">Your salon front desk, powered by AI</h2>
            <p className="sec-sub">TokenPe acts as an intelligent receptionist for your salon chair booking, phone calls, and customer records — working 24/7.</p>
          </Reveal>

          <MobileAutoCarousel total={3} activeDotColor="#D14D72"><div className="power-grid">
            {/* ─ Voice AI ─ */}
            <Reveal delay={0} className="power-card">
              <Phone className="card-ghost-icon" aria-hidden />
              <div className="power-card-top">
                <div className="power-icon"><Phone size={26} color="#D14D72" /></div>
                <div>
                  <div className="power-tag">Voice AI</div>
                  <div className="power-title">AI Salon Receptionist</div>
                </div>
              </div>
              <p className="power-desc">
                Clients call your salon — our Voice AI answers, checks stylist availability, books appointments, and issues WhatsApp booking passes automatically.
              </p>
              <div className="power-demo">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#D14D72,#C0405F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Mic size={18} color="#fff" />
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: "#2C0917" }}>AI Assistant · Live Call</span>
                  <span style={{ marginLeft: "auto", fontSize: 11.5, color: "#1E9E5A", fontWeight: 800, background: "#DCF5E8", padding: "2px 8px", borderRadius: 8 }}>● Active</span>
                </div>
                <Waveform />
                <div style={{ marginTop: 14, fontSize: 12.5, color: "#6B4052", fontStyle: "italic", lineHeight: 1.6 }}>
                  "Hair Spa appointment for Priya S. at 3:00 PM is confirmed. Stylist Rahul assigned."
                </div>
              </div>
              <div className="power-badge"><Zap size={14} /> Handles 300+ client calls/day</div>
            </Reveal>

            {/* ─ WhatsApp Chatbot ─ */}
            <Reveal delay={0.15} className="power-card">
              <MessageSquare className="card-ghost-icon" aria-hidden />
              <div className="power-card-top">
                <div className="power-icon"><MessageSquare size={26} color="#D14D72" /></div>
                <div>
                  <div className="power-tag">WhatsApp AI</div>
                  <div className="power-title">Chair Booking Chatbot</div>
                </div>
              </div>
              <p className="power-desc">
                Instant digital chair passes, appointment tokens, price lists, and hair service reminders — delivered directly on WhatsApp.
              </p>
              <div className="power-demo" style={{ padding: "0", border: "none", background: "transparent" }}>
                <WhatsAppChat />
              </div>
              <div className="power-badge"><Clock size={14} /> 24 / 7 instant responses</div>
            </Reveal>

            {/* ─ Google Reviews ─ */}
            <Reveal delay={0.3} className="power-card">
              <ThumbsUp className="card-ghost-icon" aria-hidden />
              <div className="power-card-top">
                <div className="power-icon"><ThumbsUp size={26} color="#D14D72" /></div>
                <div>
                  <div className="power-tag">Reputation</div>
                  <div className="power-title">Client Reviews &amp; Feedback</div>
                </div>
              </div>
              <p className="power-desc">
                After hair styling or spa treatments, TokenPe automatically requests feedback from clients — building your salon&apos;s 5-star rating online.
              </p>
              <div className="power-demo">
                <div style={{ marginBottom: 16 }}><AnimatedStars /></div>
                <div style={{ fontSize: 13.5, color: "#333", lineHeight: 1.65, fontStyle: "italic", marginBottom: 16 }}>
                  "Amazing hair transformation! Zero waiting time on the couch thanks to WhatsApp alerts."
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#FBEAEF,#F5D6E2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#C0405F" }}>S</div>
                  <span style={{ fontSize: 13, color: "#6B4052" }}>Sneha K. · Client</span>
                  <span style={{ marginLeft: "auto", fontSize: 11.5, background: "#FBEAEF", color: "#C0405F", padding: "3px 10px", borderRadius: 100, fontWeight: 700, border: "1px solid #F5D6E2" }}>Auto-sent</span>
                </div>
              </div>
              <div className="power-badge"><Star size={14} fill="#D14D72" stroke="none" /> Avg. 4.9 rating from clients</div>
            </Reveal>
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
                <CheckCircle2 size={22} color="#D14D72" />
                <span style={{ color: "#D14D72" }}>With TokenPe</span>
              </div>
              {AFTER.map((item, i) => (
                <div key={i} className="compare-item">
                  <CheckCircle2 size={18} style={{ color: "#D14D72", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: "#2C0917" }}>{item}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </div>

        {/* ── FEATURES GRID ── */}
        <section className="sec" id="features" style={{ paddingTop: 0 }}>
          <Reveal className="sec-head">
            <span className="eyebrow">Everything, in one place</span>
            <h2 className="sec-title">Built for the way salons &amp; spas operate</h2>
            <p className="sec-sub">From reception QR tokens to stylist chair queues — TokenPe replaces paper registers with one smart digital dashboard.</p>
          </Reveal>
          <MobileAutoCarousel total={FEATURES.length} activeDotColor="#D14D72"><div className="feat-grid">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.1} className="feat-card">
                <f.icon className="card-ghost-icon" aria-hidden />
                <div className="feat-icon"><f.icon size={26} color="#D14D72" /></div>
                <div className="feat-tag">{f.tag}</div>
                <h3 className="feat-title">{f.title}</h3>
                <p className="feat-desc">{f.desc}</p>
              </Reveal>
            ))}
          </div></MobileAutoCarousel>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="sec" id="how" style={{ paddingTop: 0 }}>
          <Reveal className="sec-head">
            <span className="eyebrow">Simple setup</span>
            <h2 className="sec-title">Live in under 10 minutes</h2>
            <p className="sec-sub">Zero hardware, zero training. If your stylists and receptionists can use WhatsApp, they can use TokenPe.</p>
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
        <section className="sec" style={{ paddingTop: 90 }}>
          <Reveal className="sec-head">
            <span className="eyebrow">Loved by salon owners</span>
            <h2 className="sec-title">Don&apos;t just take our word for it</h2>
          </Reveal>
          <MobileAutoCarousel total={TESTIMONIALS.length} activeDotColor="#D14D72"><div className="test-grid">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.n} delay={i * 0.1} className="test-card">
                <AnimatedStars n={5} />
                <div className="test-q">&quot;{t.q}&quot;</div>
                <div className="test-person">
                  <div className="test-av">{t.n[0]}</div>
                  <div>
                    <div className="test-name">{t.n}</div>
                    <div className="test-role">{t.r}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div></MobileAutoCarousel>
        </section>

        {/* ── CTA ── */}
        <div className="cta-outer">
          <div className="cta-sec">
            <div className="cta-inner">
              <div className="cta-pill">
                <Scissors size={16} /> Ready to modernize your salon?
              </div>
              <h2 className="cta-h2">Start your 7-day free trial today</h2>
              <p className="cta-p">Setup takes 5 minutes. Zero credit card required. Experience peaceful waiting lounges and happier clients this weekend.</p>
              <button className="cta-btn" onClick={() => router.push("/salon-login")}>
                Claim Your Free Salon Trial <ArrowRight size={18} />
              </button>
              <div className="cta-note">Instant setup · Cancel anytime · Dedicated support</div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="pg-footer">
          <div>© {new Date().getFullYear()} TokenPe · Made with <Heart size={14} color="#EF4444" fill="#EF4444" style={{ display: "inline-block", verticalAlign: "middle", margin: "0 2px" }} /> for Indian salons &amp; spas</div>
          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="mailto:tokenpe.online@gmail.com">Contact Us</a>
          </div>
        </footer>
      </div>
    </>
  );
}
