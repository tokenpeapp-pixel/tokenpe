"use client";
import { useState, useEffect, useRef } from "react";

// ── Flow data ────────────────────────────────────────────────────────────────

const FLOW = [
  { side: "pat", type: "text", time: "9:56 AM", text: "JOIN CITYCLINIC", delay: 1000 },
  { side: "bot", type: "join-card", time: "9:56 AM", delay: 1200 },
  { side: "pat", type: "join-reply", time: "9:56 AM", delay: 1000 },
  { side: "bot", type: "text", time: "9:57 AM", text: "👤 Please enter your full name 👇", delay: 1500 },
  { side: "pat", type: "text", time: "9:57 AM", text: "Dipak Shah", delay: 1000 },
  { side: "bot", type: "lang-card", time: "9:57 AM", delay: 1500 },
  { side: "pat", type: "lang-reply", time: "9:57 AM", text: "हिंदी", delay: 1000 },
  { side: "bot", type: "text", time: "9:58 AM", text: "✅ *Queue Confirmed, Dipak Shah!*\n\n🏥 Clinic: CityClinic\n🎟 Your Token:  *T013*\n👥 People ahead: *12*\n⏳ Est. wait: ~22 mins\n\nWe'll alert you when you're close! 🔔\nSit back and relax 😊\n\n_Powered by TokenPe_", delay: 2500 },
  { side: "bot", type: "voice", time: "9:58 AM", lang: "हिंदी", dur: "0:12", delay: 1500 },
  { side: "bot", type: "text", time: "10:24 AM", text: "🔔 *Heads up, Dipak Shah!*\n\n📍 Now Serving: *T003*\n🎟 Your Token: *T013*\n🏥 CityClinic\n\nAbout *10 tokens* to go. Start making your way to the clinic! 🏃\n\n_Powered by TokenPe_", delay: 2500 },
  { side: "bot", type: "voice", time: "10:24 AM", lang: "हिंदी", dur: "0:09", delay: 1500 },
  { side: "bot", type: "text", time: "10:37 AM", text: "⚡ *Almost your turn, Dipak Shah!*\n\n📍 Now Serving: *T008*\n🎟 Your Token: *T013*\n🏥 CityClinic\n\nOnly *5 tokens* away — please be ready near the cabin! 🙏\n\n_Powered by TokenPe_", delay: 2500 },
  { side: "bot", type: "voice", time: "10:37 AM", lang: "हिंदी", dur: "0:08", delay: 1500 },
  { side: "bot", type: "text", time: "10:49 AM", text: "🚨 *It's YOUR turn, Dipak Shah!*\n\n🎟 Token *T013* — Please go now!\n🏥 CityClinic\n\nProceed to the doctor's cabin immediately! 🏥\nThank you for your patience 🙏\n\n_Powered by TokenPe_", delay: 2500 },
  { side: "bot", type: "voice", time: "10:49 AM", lang: "हिंदी", dur: "0:08", delay: 1500 },
  { side: "bot", type: "text", time: "11:04 AM", text: "✅ *Consultation Completed, Dipak Shah!*\n\nThank you for visiting *CityClinic*. We hope you feel better soon! 🌟\n\nPlease don't hesitate to reach out if you have any questions.\n\n_Powered by TokenPe_", delay: 2500 },
  { side: "bot", type: "voice", time: "11:04 AM", lang: "हिंदी", dur: "0:11", delay: 1500 },
  { side: "bot", type: "rating", time: "11:05 AM", delay: 2000 },
  { side: "pat", type: "rating-reply", time: "11:05 AM", text: "⭐⭐⭐⭐⭐ Excellent", delay: 1500 },
  { side: "bot", type: "text", time: "11:05 AM", text: "🙏 *Thank You, Dipak Shah!*\n\nWe have recorded your ⭐⭐⭐⭐⭐ rating.\nWe appreciate your feedback!", delay: 3500 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const WAVE_HEIGHTS = [30, 55, 70, 45, 85, 50, 65, 35, 78, 60, 42, 72, 55, 82, 45, 68, 30, 76, 52, 62, 40, 58];

function fmt(text) {
  return text.split("\n").map((line, i, arr) => {
    const parts = line.split(/(\*[^*]+\*|_[^_]+_)/g).map((p, j) => {
      if (p.startsWith("*") && p.endsWith("*")) return <strong key={j}>{p.slice(1, -1)}</strong>;
      if (p.startsWith("_") && p.endsWith("_")) return <em key={j} style={{ color: "#8696a0", fontSize: "10.5px" }}>{p.slice(1, -1)}</em>;
      return p;
    });
    return <span key={i}>{parts}{i < arr.length - 1 && <br />}</span>;
  });
}

// ── Small SVGs ───────────────────────────────────────────────────────────────

const CheckSvg = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ListSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#008069" strokeWidth="2.5" strokeLinecap="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

// ── Shared sub-components ────────────────────────────────────────────────────

const TS = ({ time, pat }) => (
  <div style={{ position: "absolute", bottom: "2px", right: "6px", fontSize: "9px", color: "#8696a0", whiteSpace: "nowrap" }}>
    {time}{pat && <span style={{ color: "#53bdeb" }}> ✓✓</span>}
  </div>
);

const LRQuote = ({ title, body }) => (
  <div style={{ borderLeft: "3px solid #25D366", background: "rgba(0,0,0,0.05)", borderRadius: "3px", padding: "4px 7px", marginBottom: "5px" }}>
    <div style={{ fontSize: "9px", color: "#008069", fontWeight: 700, marginBottom: "1px" }}>{title}</div>
    {body && <div style={{ fontSize: "10px", color: "#555" }}>{body}</div>}
  </div>
);

const CardDivider = () => <div style={{ height: "1px", background: "#e9edef" }} />;

const CardAction = ({ children, small }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", padding: "9px", color: "#008069", fontSize: small ? "11.5px" : "12px", fontWeight: 700, cursor: "pointer" }}>
    {children}
  </div>
);

const WaveBars = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "1.5px", height: "22px" }}>
    {WAVE_HEIGHTS.map((h, i) => (
      <div key={i} style={{ flex: 1, height: `${h}%`, minHeight: "2px", borderRadius: "1px", background: i < 6 ? "#31AEE7" : "#c8c8c8" }} />
    ))}
  </div>
);

// ── Bubble components ─────────────────────────────────────────────────────────

const S = {
  bubble: { maxWidth: "88%", padding: "5px 8px 17px", borderRadius: "8px", fontSize: "11.5px", color: "#111b21", position: "relative", boxShadow: "0 1px 2px rgba(0,0,0,0.10)", lineHeight: 1.5, wordBreak: "break-word", fontFamily: "sans-serif", marginTop: "2px", animation: "waPopIn 0.22s cubic-bezier(0.175,0.885,0.32,1.275) forwards" },
  bot: { background: "#fff", alignSelf: "flex-start", borderTopLeftRadius: 0 },
  green: { background: "#d9f5c8", alignSelf: "flex-start", borderTopLeftRadius: 0 },
  pat: { background: "#dcf8c6", alignSelf: "flex-end", borderTopRightRadius: 0 },
  card: { maxWidth: "225px", minWidth: "205px", background: "#fff", alignSelf: "flex-start", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.12)", marginTop: "2px", fontFamily: "sans-serif", animation: "waPopIn 0.22s cubic-bezier(0.175,0.885,0.32,1.275) forwards" },
};

function JoinCard() {
  return (
    <div style={S.card}>
      <div style={{ padding: "8px 10px 6px" }}>
        <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#111b21", marginBottom: "4px" }}>🏥 Welcome to our Clinic!</div>
        <div style={{ fontSize: "11px", color: "#111b21", lineHeight: 1.45 }}>You are about to join today's OPD queue.<br /><br />Tap the button below to confirm your spot 👇</div>
        <em style={{ fontSize: "9.5px", color: "#8696a0", fontStyle: "italic", marginTop: "4px", display: "block" }}>Powered by TokenPe</em>
      </div>
      <CardDivider /><CardAction><CheckSvg /> Join Queue</CardAction>
    </div>
  );
}

function JoinReply({ time }) {
  return (
    <div style={{ ...S.bubble, ...S.pat }} className="wa-pat-tail">
      <LRQuote title="🏥 Welcome to our Clinic!" body="You are about to join today's OPD queue..." />
      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px" }}><CheckSvg /><span style={{ color: "#008069", fontWeight: 700 }}>Join Queue</span></div>
      <TS time={time} pat />
    </div>
  );
}

function LangCard() {
  return (
    <div style={S.card}>
      <div style={{ padding: "8px 10px 6px" }}>
        <div style={{ fontSize: "11px", color: "#111b21", lineHeight: 1.45 }}>🌐 Choose your preferred language for voice updates:</div>
      </div>
      <CardDivider /><CardAction small><ListSvg /> Select Language 🌐</CardAction>
    </div>
  );
}

function LangReply({ text, time }) {
  return (
    <div style={{ ...S.bubble, ...S.pat }} className="wa-pat-tail">
      <LRQuote title="🌐 Choose your preferred language for voice updates:" />
      <div style={{ fontSize: "12px", marginTop: "2px" }}>{text}</div>
      <TS time={time} pat />
    </div>
  );
}

function VoiceNote({ green, lang, dur, time }) {
  return (
    <div style={{ ...S.bubble, ...(green ? S.green : S.bot), padding: "10px 12px", minWidth: "230px", maxWidth: "238px", borderRadius: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#008069", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
          <WaveBars />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "10px", color: "#8696a0" }}>{dur || "0:11"}</span>
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              {lang && <span style={{ fontSize: "8.5px", color: "white", background: "#008069", padding: "1.5px 5px", borderRadius: "4px", fontWeight: 700 }}>in {lang}</span>}
              <span style={{ fontSize: "10px", color: "#8696a0" }}>{time}</span>
            </div>
          </div>
        </div>
        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#E8951A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 3a9 9 0 0 0-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1a7 7 0 0 1 14 0v1h-4v8h4c1.1 0 2-.9 2-2v-7a9 9 0 0 0-9-9z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function RatingCard() {
  return (
    <div style={S.card}>
      <div style={{ padding: "8px 10px 6px" }}>
        <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#111b21", marginBottom: "4px" }}>Rate Your Visit</div>
        <div style={{ fontSize: "11px", color: "#111b21", lineHeight: 1.45 }}>How was your consultation at CityClinic?<br />Your feedback helps us improve! 🙏</div>
        <em style={{ fontSize: "9.5px", color: "#8696a0", fontStyle: "italic", marginTop: "4px", display: "block" }}>Powered by TokenPe</em>
      </div>
      <CardDivider /><CardAction><ListSvg /> Tap to Rate</CardAction>
    </div>
  );
}

function RatingReply({ text, time }) {
  return (
    <div style={{ ...S.bubble, ...S.pat }} className="wa-pat-tail">
      <LRQuote title="Rate Your Visit" body="How was your consultation at CityClinic?..." />
      <div style={{ fontSize: "12px", marginTop: "2px" }}>{text}</div>
      <TS time={time} pat />
    </div>
  );
}

function TextBubble({ msg }) {
  const style = msg.side === "pat" ? { ...S.bubble, ...S.pat } : msg.green ? { ...S.bubble, ...S.green } : { ...S.bubble, ...S.bot };
  const cls = msg.side === "pat" ? "wa-pat-tail" : msg.green ? "wa-green-tail" : "wa-bot-tail";
  return (
    <div style={style} className={cls}>
      <div style={{ lineHeight: 1.5, fontSize: "11.5px" }}>{fmt(msg.text)}</div>
      <TS time={msg.time} pat={msg.side === "pat"} />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ ...S.bubble, ...S.bot, display: "flex", gap: "4px", padding: "9px 13px", alignItems: "center" }} className="wa-bot-tail">
      {[0, 0.18, 0.36].map((d, i) => (
        <div key={i} style={{ width: "6px", height: "6px", background: "#8696a0", borderRadius: "50%", animation: `waBounce 1.3s ${d}s infinite`, flexShrink: 0 }} />
      ))}
    </div>
  );
}

function renderMsg(msg) {
  switch (msg.type) {
    case "join-card": return <JoinCard key={msg.id} />;
    case "join-reply": return <JoinReply key={msg.id} time={msg.time} />;
    case "lang-card": return <LangCard key={msg.id} />;
    case "lang-reply": return <LangReply key={msg.id} text={msg.text} time={msg.time} />;
    case "voice": return <VoiceNote key={msg.id} green={msg.green} lang={msg.lang} dur={msg.dur} time={msg.time} />;
    case "rating": return <RatingCard key={msg.id} />;
    case "rating-reply": return <RatingReply key={msg.id} text={msg.text} time={msg.time} />;
    default: return <TextBubble key={msg.id} msg={msg} />;
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WhatsAppDemo() {
  const [msgs, setMsgs] = useState([]);
  const [typing, setTyping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [headerStatus, setHeaderStatus] = useState("online");
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const aliveRef = useRef(true);

  const scroll = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: 99999,
          behavior: 'smooth'
        });
      }
    }, 150);
  };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  useEffect(() => {
    scroll();
  }, [msgs, typing]);

  useEffect(() => {
    aliveRef.current = true;
    (async () => {
      while (aliveRef.current) {
        setMsgs([]); setProgress(0); setHeaderStatus("online"); setTyping(false);
        await wait(1500);
        for (let i = 0; i < FLOW.length; i++) {
          if (!aliveRef.current) return;
          const msg = FLOW[i];
          if (msg.side === "bot") {
            setHeaderStatus("typing..."); setTyping(true);
            await wait(1200);
            if (!aliveRef.current) return;
            setTyping(false); setHeaderStatus("online");
          }
          setMsgs(prev => [...prev, { ...msg, id: i + "-" + Date.now() }]);
          setProgress(((i + 1) / FLOW.length) * 100);
          await wait(msg.delay || 2000);
        }
        await wait(8000);
      }
    })();
    return () => { aliveRef.current = false; };
  }, []);

  return (
    <>
      <style>{`
        @keyframes waPopIn  { from { opacity:0; transform:scale(0.85) translateY(4px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes waBounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }
        .wa-wrapper { zoom: 0.85; display: flex; justify-content: center; align-items: center; padding: 24px 16px 32px; }
        @media (max-width: 768px) { .wa-wrapper { zoom: 0.75; } }
        @media (max-width: 480px) { .wa-wrapper { zoom: 0.65; } }
        .wa-phone { transition:transform 0.5s cubic-bezier(0.16,1,0.3,1); transform:perspective(900px) rotateY(-5deg) rotateX(2deg); }
        .wa-phone:hover { transform:perspective(900px) rotateY(0deg) rotateX(0deg) translateY(-6px); }
        .wa-bot-tail::before   { content:''; position:absolute; top:0; left:-6px;  border:6px solid transparent; border-top-color:#fff;    border-right-color:#fff;    }
        .wa-green-tail::before { content:''; position:absolute; top:0; left:-6px;  border:6px solid transparent; border-top-color:#d9f5c8; border-right-color:#d9f5c8; }
        .wa-pat-tail::after    { content:''; position:absolute; top:0; right:-6px; border:6px solid transparent; border-top-color:#dcf8c6; border-left-color:#dcf8c6;  }
        .wa-chat::-webkit-scrollbar { display:none; }
      `}</style>

      <div className="wa-wrapper">
        <div className="wa-phone" style={{ width: "290px", height: "620px", background: "#1a1a1a", borderRadius: "40px", padding: "10px", flexShrink: 0, position: "relative", boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset,0 0 0 6px #1a1a1a,0 32px 80px rgba(0,0,0,0.55),0 8px 20px rgba(0,0,0,0.3)" }}>
          {/* Notch */}
          <div style={{ position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)", width: "90px", height: "22px", background: "#1a1a1a", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px", zIndex: 10 }} />

          <div style={{ width: "100%", height: "100%", borderRadius: "32px", overflow: "hidden", display: "flex", flexDirection: "column", background: "#efeae2", position: "relative" }}>
            {/* Wallpaper */}
            <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.13, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='2' fill='%23a09880'/%3E%3C/svg%3E")`, backgroundSize: "30px 30px" }} />

            {/* Header */}
            <div style={{ background: "#008069", padding: "34px 10px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 2, boxShadow: "0 1px 4px rgba(0,0,0,0.18)", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "rgba(255,255,255,0.2)", zIndex: 20 }}>
                <div style={{ height: "100%", background: "#25D366", width: `${progress}%`, transition: "width 0.5s ease", borderRadius: "0 1px 1px 0" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "20px", lineHeight: 1 }}>‹</span>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#fff", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: "4px" }}>
                  <img src="/logo-light.png" alt="TokenPe Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </div>
                <div>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: "white", display: "flex", alignItems: "center", gap: "4px" }}>
                    TokenPe
                    <span style={{ width: "13px", height: "13px", borderRadius: "50%", background: "#25D366", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: "white", fontWeight: 900 }}>✓</span>
                  </div>
                  <div style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.75)" }}>{headerStatus}</div>
                </div>
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "18px" }}>⋮</div>
            </div>

            {/* Chat */}
            <div ref={scrollRef} className="wa-chat" style={{ flex: 1, padding: "10px 8px 30px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px", zIndex: 1, position: "relative" }}>
              <div style={{ alignSelf: "center", background: "rgba(255,255,255,0.88)", color: "#54656f", fontSize: "10px", fontWeight: 500, padding: "3px 10px", borderRadius: "6px", marginBottom: "6px" }}>Today</div>
              {msgs.map(renderMsg)}
              {typing && <TypingIndicator />}
            </div>

            {/* Input bar */}
            <div style={{ background: "#f0f2f5", padding: "6px 8px", display: "flex", alignItems: "center", gap: "6px", zIndex: 2, position: "relative", flexShrink: 0 }}>
              <div style={{ flex: 1, background: "#fff", borderRadius: "20px", padding: "8px 14px", fontSize: "12px", color: "#8696a0" }}>Message</div>
              <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#008069", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}