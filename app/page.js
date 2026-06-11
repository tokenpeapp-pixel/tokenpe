"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const go = (id) => { 
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); 
    setMenuOpen(false); 
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap');
        
        :root {
          --bg: #0F0D1E;
          --surface: #1E1B3A;
          --border: #2D2856;
          --green: #25D366;
          --purple: #7C3AED;
          --text: #F0F2F5;
          --muted: #7A7A9D;
        }

        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden}
        h1, h2, h3, h4, h5, h6, .sora {font-family:'Sora',sans-serif}
        
        .glow {position:absolute;width:600px;height:600px;border-radius:50%;filter:blur(140px);opacity:0.25;z-index:0;pointer-events:none}
        .glow-purple {background:var(--purple);top:-150px;left:-150px}
        .glow-green {background:var(--green);bottom:-150px;right:-150px}

        /* NAVBAR */
        .nav{position:fixed;top:0;left:0;right:0;z-index:200;padding:0 32px;height:72px;display:flex;align-items:center;justify-content:space-between;background:rgba(30, 27, 58, 0.6);backdrop-filter:blur(8px);border-bottom:1px solid transparent;transition:all 0.3s}
        .nav.scrolled{background:rgba(30, 27, 58, 0.85);backdrop-filter:blur(16px);border-bottom:1px solid var(--border)}
        
        .nav-links{display:flex;gap:36px;align-items:center}
        .nl{color:var(--text);font-size:14px;font-weight:600;cursor:pointer;position:relative;text-decoration:none}
        .nl::after{content:'';position:absolute;left:0;bottom:-4px;width:0%;height:2px;background:var(--green);transition:width 0.2s}
        .nl:hover::after{width:100%}
        
        .nav-btn{background:var(--green);color:#000;padding:10px 24px;border-radius:100px;font-size:14px;font-weight:700;cursor:pointer;border:none;transition:transform 0.15s, box-shadow 0.15s}
        .nav-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(37, 211, 102, 0.3)}
        
        .hamburger{display:none;background:none;border:none;color:var(--text);font-size:24px;cursor:pointer}
        
        .mmenu{display:none;flex-direction:column;position:fixed;top:72px;left:0;right:0;background:var(--surface);border-bottom:1px solid var(--border);z-index:199;padding-bottom:16px}
        .mmenu.open{display:flex}
        .mlink{padding:16px 32px;color:var(--text);font-size:15px;font-weight:600;cursor:pointer;border-bottom:1px solid var(--border)}

        /* HERO */
        .hero{min-height:100vh;display:flex;align-items:center;padding:140px 32px 80px;position:relative}
        .hero-inner{max-width:1200px;margin:0 auto;display:flex;align-items:center;gap:64px;width:100%}
        .hero-left{flex:1.2;max-width:640px}
        
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(124, 58, 237, 0.1);border:1px solid var(--purple);border-radius:100px;padding:6px 16px;font-size:13px;color:var(--text);margin-bottom:24px;font-weight:600}
        .hero-h1{font-size:clamp(48px, 6vw, 64px);font-weight:800;line-height:1.15;letter-spacing:-1px;color:var(--text);margin-bottom:20px}
        .hero-sub{color:var(--muted);font-size:18px;line-height:1.6;margin-bottom:40px}
        
        .hero-btns{display:flex;gap:16px;align-items:center;margin-bottom:20px}
        .btn-green{background:var(--green);color:#000;padding:16px 32px;border-radius:100px;font-size:16px;font-weight:700;cursor:pointer;border:none;transition:all 0.2s}
        .btn-green:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(37, 211, 102, 0.3)}
        .btn-ghost{background:transparent;color:var(--text);padding:16px 32px;border-radius:100px;font-size:16px;font-weight:600;cursor:pointer;border:1px solid var(--border);transition:all 0.2s}
        .btn-ghost:hover{background:var(--surface);border-color:var(--muted)}
        
        .hero-note{color:var(--muted);font-size:13px;font-weight:500;margin-bottom:40px}
        .hero-note span{margin:0 8px;color:var(--border)}

        .stat-row{display:flex;gap:16px;flex-wrap:wrap;margin-top:40px;margin-bottom:20px}
        .stat-badge{background:var(--surface);border:1px solid var(--border);padding:8px 16px;border-radius:100px;font-size:13px;font-weight:600;color:var(--text);display:flex;align-items:center;gap:8px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.15)}

        /* HERO MOCKUP */
        .hero-right{flex:0.8;display:flex;justify-content:flex-end}
        .mockup{background:var(--surface);border:1px solid var(--border);border-radius:24px;width:100%;max-width:400px;box-shadow:0 0 60px rgba(37, 211, 102, 0.15);overflow:hidden;position:relative}
        .mockup-header{background:#111;padding:16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px}
        .mockup-avatar{width:36px;height:36px;background:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#000;font-weight:700;font-size:18px}
        .mockup-body{padding:20px;height:400px;display:flex;flex-direction:column;gap:16px;position:relative}
        
        .bubble{max-width:88%;padding:12px 16px;border-radius:16px;font-size:14px;line-height:1.5;animation:bubbleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;opacity:0;transform:translateY(10px)}
        .bubble-in{background:#2A2A35;color:var(--text);align-self:flex-start;border-bottom-left-radius:4px}
        .bubble-out{background:#005C4B;color:var(--text);align-self:flex-end;border-bottom-right-radius:4px}
        .bubble-voice{background:#005C4B;color:var(--text);align-self:flex-end;border-bottom-right-radius:4px;display:flex;align-items:center;gap:10px}
        
        .anim-1{animation-delay:0.5s}
        .anim-2{animation-delay:2s}
        .anim-3{animation-delay:4s}
        .anim-4{animation-delay:6s}

        @keyframes bubbleIn {
          to { opacity: 1; transform: translateY(0); }
        }

        /* SECTIONS SHARED */
        .sec{padding:120px 32px}
        .sec-inner{max-width:1200px;margin:0 auto}
        .eyebrow{color:var(--purple);font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px}
        .sec-h2{font-size:clamp(32px, 4vw, 44px);font-weight:800;color:var(--text);margin-bottom:16px;line-height:1.2}
        .sec-sub{color:var(--muted);font-size:18px;line-height:1.6;max-width:600px;margin-bottom:64px}

        /* FEATURES */
        .bento{display:grid;grid-template-columns:repeat(auto-fit, minmax(340px, 1fr));gap:24px}
        .bento-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:32px;transition:all 0.3s ease}
        .bento-card:hover{transform:translateY(-4px);border-color:var(--purple);box-shadow:0 12px 32px rgba(124, 58, 237, 0.15)}
        .bento-icon{font-size:24px;margin-bottom:20px}
        .bento-title{font-family:'Sora',sans-serif;font-size:18px;font-weight:700;color:var(--text);margin-bottom:12px}
        .bento-desc{color:var(--muted);font-size:15px;line-height:1.6}

        /* HOW IT WORKS */
        .steps{display:grid;grid-template-columns:repeat(3, 1fr);gap:32px;position:relative}
        .steps-line{position:absolute;top:24px;left:40px;right:40px;height:2px;border-top:2px dotted var(--green);z-index:0;opacity:0.3}
        .step{position:relative;z-index:1}
        .step-num{width:48px;height:48px;background:var(--bg);border:2px solid var(--green);color:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;margin-bottom:24px}
        .step-title{font-family:'Sora',sans-serif;font-size:20px;font-weight:700;color:var(--text);margin-bottom:12px}
        .step-desc{color:var(--muted);font-size:15px;line-height:1.6}

        /* PRICING */
        .plans{display:grid;grid-template-columns:repeat(auto-fit, minmax(300px, 1fr));gap:24px;align-items:center}
        .plan{background:var(--surface);border:1px solid var(--border);border-radius:24px;padding:40px 32px;position:relative}
        .plan.pro{border:1px solid rgba(37, 211, 102, 0.5);box-shadow:0 0 40px rgba(37, 211, 102, 0.1);transform:scale(1.02);z-index:2}
        .plan-badge{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg, var(--purple), var(--green));color:#fff;padding:6px 20px;border-radius:100px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;box-shadow:0 4px 12px rgba(37, 211, 102, 0.3)}
        .plan-title{font-family:'Sora',sans-serif;font-size:24px;font-weight:700;color:var(--text)}
        .plan-tag{color:var(--muted);font-size:14px;margin-top:8px;min-height:40px}
        .plan-price{font-family:'Sora',sans-serif;font-size:42px;font-weight:800;color:var(--text);margin:24px 0}
        .plan-price span{font-size:16px;color:var(--muted);font-weight:500;font-family:'Inter',sans-serif}
        .plan-feats{margin:32px 0;display:flex;flex-direction:column;gap:16px}
        .pf{display:flex;align-items:center;gap:12px;color:var(--text);font-size:14px}
        .pf-check{color:var(--green);font-weight:800}
        .btn-outline{width:100%;padding:14px;border-radius:100px;border:1px solid var(--border);background:transparent;color:var(--text);font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s}
        .btn-outline:hover{background:rgba(255,255,255,0.05);border-color:var(--muted)}
        .btn-full-green{width:100%;padding:14px;border-radius:100px;border:none;background:var(--green);color:#000;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.2s}
        .btn-full-green:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(37, 211, 102, 0.3)}

        /* CTA */
        .cta-wrapper{text-align:center;position:relative;padding:120px 20px}
        .cta-glow{position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);width:600px;height:600px;background:radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%);pointer-events:none;z-index:0}
        .cta-content{position:relative;z-index:1}
        .pulse-ring{position:relative;display:inline-block}
        .pulse-ring::before{content:'';position:absolute;inset:-4px;border-radius:100px;background:var(--green);opacity:0.4;animation:pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;z-index:-1}
        
        @keyframes pulse {
          0%, 100% { opacity: 0; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }

        /* FOOTER */
        .footer{padding:64px 32px;border-top:1px solid var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:32px;max-width:1200px;margin:0 auto}
        .footer-links{display:flex;gap:32px;flex-wrap:wrap;justify-content:center}
        .footer-link{color:#60A5FA;font-size:15px;font-weight:600;text-decoration:none;transition:color 0.2s}
        .footer-link:hover{color:#93C5FD}
        .footer-bottom{display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--muted);font-size:14px}

        @media(max-width:960px){
          .hero-inner{flex-direction:column;text-align:center}
          .hero-left{max-width:100%}
          .hero-btns{justify-content:center}
          .stat-row{justify-content:center}
          .hero-right{width:100%;justify-content:center;margin-top:40px}
          .steps{grid-template-columns:1fr;gap:48px}
          .steps-line{display:none}
          .step{text-align:center}
          .step-num{margin:0 auto 24px}
        }
        @media(max-width:768px){
          .nav{padding:0 20px}
          .nav-links{display:none}
          .hamburger{display:block}
          .hero{padding:100px 20px 60px}
          .hero-h1{font-size:38px;line-height:1.15}
          .hero-sub{font-size:16px;margin-bottom:32px}
          .hero-btns{flex-direction:column;gap:12px;width:100%}
          .btn-green, .btn-ghost{width:100%}
          .stat-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:32px}
          .stat-badge{width:100%;justify-content:center;font-size:11px;padding:8px 4px;white-space:normal;text-align:center}
          .mockup{max-width:100%}
          .mockup-body{height:320px}
          .sec{padding:80px 20px}
          .sec-h2{font-size:32px}
          .sec-sub{font-size:16px;margin-bottom:32px}
          .bento{grid-template-columns:1fr}
          .plan{padding:32px 24px}
          .plan.pro{transform:none}
          .cta-wrapper{padding:80px 20px}
          .footer{padding:40px 20px;gap:24px}
          .footer-links{flex-direction:column;gap:16px;align-items:center}
        }
      `}</style>

      {/* NAVBAR */}
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <img src="/logo.png" alt="TokenPe" style={{ height: 32, width: "auto", cursor: "pointer" }} onClick={() => router.push("/")} />
        <div className="nav-links">
          <span className="nl" onClick={() => go("features")}>Features</span>
          <span className="nl" onClick={() => go("how")}>How it works</span>
          <span className="nl" onClick={() => go("pricing")}>Pricing</span>
          <button className="nav-btn" onClick={() => router.push("/login")}>Get Started →</button>
        </div>
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "✕" : "☰"}</button>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mmenu ${menuOpen ? "open" : ""}`}>
        <span className="mlink" onClick={() => go("features")}>Features</span>
        <span className="mlink" onClick={() => go("how")}>How it works</span>
        <span className="mlink" onClick={() => go("pricing")}>Pricing</span>
        <div style={{padding:'20px 32px'}}><button className="btn-green" style={{width:'100%'}} onClick={() => router.push("/login")}>Get Started →</button></div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="glow glow-purple"></div>
        <div className="glow glow-green"></div>
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-badge">
              <svg width="18" height="13" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 2, display: 'inline-block', flexShrink: 0 }}>
                <rect width="30" height="6.6" fill="#FF9933" />
                <rect y="6.6" width="30" height="6.6" fill="#FFFFFF" />
                <rect y="13.2" width="30" height="6.6" fill="#138808" />
                <circle cx="15" cy="10" r="2.5" fill="#000080" />
              </svg>
              Built for India's 6 lakh+ clinics
            </div>
            <h1 className="hero-h1">
              No more waiting.<br/>
              <span style={{ background: "linear-gradient(90deg, var(--green), #60A5FA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Queue smarter.</span>
            </h1>
            <p className="hero-sub">Replace your clinic's paper token chaos with a WhatsApp-based digital queue. Patients wait at home. Voice updates in 10 languages. Zero apps needed.</p>
            
            <div className="hero-btns">
              <button className="btn-green" onClick={() => router.push("/login")}>Start Free Trial →</button>
              <button className="btn-ghost" onClick={() => go("how")}>See how it works</button>
            </div>
            
            <div className="hero-note">No app for patients <span>·</span> Any phone <span>·</span> 2 min setup</div>
            
            <div className="stat-row">
              <div className="stat-badge">💬 100% WhatsApp Native</div>
              <div className="stat-badge">🇮🇳 Built for Indian Clinics</div>
              <div className="stat-badge">🎙️ 10 Languages</div>
              <div className="stat-badge">⚡ 2 min Setup</div>
            </div>
          </div>
          
          <div className="hero-right">
            <div className="mockup">
              <div className="mockup-header">
                <div className="mockup-avatar">TP</div>
                <div>
                  <div style={{color:'#fff',fontWeight:600,fontFamily:'Sora',fontSize:15}}>TokenPe Clinic</div>
                  <div style={{color:'#7A7A9D',fontSize:12}}>Official Business Account</div>
                </div>
              </div>
              <div className="mockup-body">
                <div className="bubble bubble-in anim-1">JOIN CITYHOSP</div>
                <div className="bubble bubble-out anim-2">
                  Welcome to TokenPe Clinic! Your token number is <strong>T12</strong>. There are 4 patients ahead of you. Please wait nearby.
                </div>
                <div className="bubble bubble-out anim-3">
                  Token <strong>T12</strong>, only 5 more tokens! Currently serving T07. Please get ready now.
                </div>
                <div className="bubble bubble-voice anim-4">
                  ▶️ 0:04 <div style={{flex:1,height:4,background:'rgba(255,255,255,0.3)',borderRadius:2}}><div style={{width:'40%',height:'100%',background:'#25D366',borderRadius:2}}></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="sec">
        <div className="sec-inner">
          <div className="eyebrow">Features</div>
          <h2 className="sec-h2">Everything your clinic needs</h2>
          <p className="sec-sub">One tool that replaces paper tokens, crowded waiting rooms, and manual calling — forever.</p>
          
          <div className="bento">
            {[
              { ico: "🎙️", title: "Voice in 10 Indian languages", desc: "Patients get WhatsApp voice updates in Hindi, Tamil, Telugu, Marathi, Gujarati and 5 more." },
              { ico: "💬", title: "WhatsApp — zero app needed", desc: "Scan QR → join queue. No downloads, no logins. Works on any phone, even a basic one." },
              { ico: "⚡", title: "Real-time live dashboard", desc: "See who's waiting, with doctor, and done — all updating live as patients move through." },
              { ico: "🔔", title: "Smart automatic alerts", desc: "10-away, 5-away, and your-turn alerts sent automatically. Zero manual effort needed." },
              { ico: "📅", title: "History by date", desc: "View complete patient records for any past date. Know daily volume at a glance." },
              { ico: "🔲", title: "QR code + print card", desc: "Generate your clinic's unique QR. Download PNG or print a ready-to-display card." },
            ].map(f => (
              <div key={f.title} className="bento-card">
                <div className="bento-icon">{f.ico}</div>
                <div className="bento-title">{f.title}</div>
                <div className="bento-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="sec">
        <div className="sec-inner">
          <div className="eyebrow">How it works</div>
          <h2 className="sec-h2">Up and running in 3 steps</h2>
          <p className="sec-sub">No IT team needed. No hardware. No complexity.</p>
          
          <div className="steps">
            <div className="steps-line"></div>
            {[
              { n: "1", t: "Register your clinic", d: "Sign up in 2 minutes with Google or your clinic code. Get your unique WhatsApp QR instantly." },
              { n: "2", t: "Display the QR at reception", d: "Print the card or show on a screen. Patients scan once and they're in the queue — no app needed." },
              { n: "3", t: "Call patients with one tap", d: "Press 'Call Next' on your dashboard. The patient gets a WhatsApp text + voice note in their language." },
            ].map(s => (
              <div key={s.n} className="step">
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.t}</div>
                <div className="step-desc">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="sec">
        <div className="sec-inner">
          <div style={{textAlign:'center'}}>
            <div className="eyebrow">Pricing</div>
            <h2 className="sec-h2">Simple. Affordable.</h2>
            <p className="sec-sub" style={{margin:'0 auto 64px'}}>Choose the plan that fits your clinic's needs.</p>
          </div>
          
          <div className="plans">
            {/* Starter */}
            <div className="plan">
              <div className="plan-title">Starter</div>
              <div className="plan-tag">Perfect for small clinics</div>
              <div className="plan-price">₹499<span>/mo</span></div>
              <div className="plan-feats">
                {["50 patients/day", "Standard WhatsApp Alerts", "Basic 7-day Analytics", "Auto-Generated Code"].map(f => (
                  <div key={f} className="pf"><span className="pf-check">✓</span> {f}</div>
                ))}
              </div>
              <button className="btn-outline" onClick={() => router.push("/login")}>Get started →</button>
            </div>

            {/* Pro */}
            <div className="plan pro">
              <div className="plan-badge">✦ Most Popular</div>
              <div className="plan-title">Pro</div>
              <div className="plan-tag">For busy clinics that want to look professional</div>
              <div className="plan-price">₹999<span>/mo</span></div>
              <div className="plan-feats">
                {["150 patients/day", "Branded WhatsApp Identity", "Multilingual Voice Alerts", "Queue Pause & Smart Wait Time", "30-Day History & Heatmap"].map(f => (
                  <div key={f} className="pf"><span className="pf-check">✓</span> {f}</div>
                ))}
              </div>
              <button className="btn-full-green" onClick={() => router.push("/login")}>Get started →</button>
            </div>

            {/* Elite */}
            <div className="plan">
              <div className="plan-title">Elite</div>
              <div className="plan-tag">For hospitals, polyclinics & top doctors</div>
              <div className="plan-price">₹1999<span>/mo</span></div>
              <div className="plan-feats">
                {["Unlimited patients", "Multi-Clinic Management", "Monthly PDF Reports", "VIP WhatsApp Support", "CRM Broadcasts"].map(f => (
                  <div key={f} className="pf"><span className="pf-check">✓</span> {f}</div>
                ))}
              </div>
              <button className="btn-outline" onClick={() => router.push("/login")}>Get started →</button>
            </div>
          </div>
          
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button onClick={() => setShowDetails(true)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "14px", fontWeight: "600", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 4 }}>
              📄 View Detailed Feature Breakdown & Terms
            </button>
          </div>
        </div>
      </section>

      {/* CTA BLOCK */}
      <section className="cta-wrapper">
        <div className="cta-glow"></div>
        <div className="cta-content">
          <h2 className="sec-h2" style={{color:'#fff'}}>Ready to transform your clinic?</h2>
          <p className="sec-sub" style={{margin:'0 auto 40px'}}>Join clinics across India already using TokenPe to manage queues and delight patients.</p>
          <div className="pulse-ring">
            <button className="btn-green" style={{padding:'20px 48px',fontSize:'18px'}} onClick={() => router.push("/login")}>Start your free trial →</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:'var(--bg)'}}>
        <div className="footer">
          <div className="footer-links">
            <a href="/privacy" className="footer-link">Privacy Policy</a>
            <a href="/terms" className="footer-link">Terms of Service</a>
            <a href="mailto:tokenpe.online@gmail.com" className="footer-link">Contact Support</a>
          </div>
          <div className="footer-bottom">
            <div>Made with ❤️ from TokenPe</div>
            <div>© {new Date().getFullYear()} TokenPe. All rights reserved.</div>
          </div>
        </div>
      </footer>

      {/* MODAL */}
      {showDetails && (
        <div onClick={() => setShowDetails(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", alignItems: "center", justifyItems: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--surface)", width: "100%", maxWidth: 800, maxHeight: "90vh", overflowY: "auto", borderRadius: 24, padding: "40px 32px", position: "relative", margin: "auto", border: "1px solid var(--border)" }}>
            <button onClick={() => setShowDetails(false)} style={{ position: "absolute", top: 20, right: 20, background: "var(--bg)", border: "1px solid var(--border)", width: 36, height: 36, borderRadius: "50%", fontSize: 20, cursor: "pointer", color: "var(--muted)" }}>×</button>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", marginBottom: 8, letterSpacing: "-1px", fontFamily: "Sora" }}>Detailed Feature Breakdown</h2>
            <p style={{ color: "var(--muted)", marginBottom: 32 }}>A comprehensive look at what's included in every TokenPe subscription tier.</p>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)" }}>
                    <th style={{ textAlign: "left", padding: "16px 8px", color: "var(--text)", width: "40%" }}>Feature</th>
                    <th style={{ textAlign: "center", padding: "16px 8px", color: "var(--muted)" }}>Starter</th>
                    <th style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 800 }}>Pro</th>
                    <th style={{ textAlign: "center", padding: "16px 8px", color: "var(--purple)", fontWeight: 800 }}>Elite</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: 14, color: "var(--text)" }}>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Daily Patient Limit</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>50</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 600 }}>150</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 700 }}>Unlimited</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>All WhatsApp Alerts</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Text Only</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Text + AI Voice</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Text + AI Voice</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>AI Voice Notes (10 languages)</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Clinic Code</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Auto-generated</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>Custom</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>Custom</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>QR Card</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Basic</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Name + Address</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Name + Address + Logo</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Queue Pause Button</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Patient Visit History</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>7 Days</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 600 }}>30 Days</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 700 }}>365 Days</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Smart Wait Time Prediction</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>✓</td>
                  </tr>

                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Busy Hour Heatmap</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Personalized Welcome Message</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Multi-Location (3 clinics)</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Patient Feedback & Star Rating</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>CRM Broadcasts</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Smart Patient Follow-ups</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>✓</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Monthly PDF Report</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", color: "var(--green)", fontWeight: 600 }}>✓</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Dashboard Analytics</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>7 Days</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>30 Days + Heatmap</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 600 }}>Unlimited + Excel Export</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "16px 8px", fontWeight: 600 }}>Support</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Email</td>
                    <td style={{ textAlign: "center", padding: "16px 8px" }}>Priority Email & Chat</td>
                    <td style={{ textAlign: "center", padding: "16px 8px", fontWeight: 600 }}>Dedicated WhatsApp Support</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--border)", fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
              <strong>Terms of Subscription:</strong> All plans automatically renew monthly. You can cancel your subscription at any time from the billing dashboard. The free trial is available for 14 days and provides full access to Elite features. After the trial, you must choose a plan to continue service.
            </div>
          </div>
        </div>
      )}
    </>
  );
}