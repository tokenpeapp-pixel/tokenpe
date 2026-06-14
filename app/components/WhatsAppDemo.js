"use client";
import { useState, useEffect, useRef } from "react";

export default function WhatsAppDemo() {
  const [step, setStep] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    // 0: Initial wait
    // 1: Typing
    // 2: Msg 1
    // 3: Typing
    // 4: Msg 2 (Warning)
    // 5: Audio
    // 6: Typing
    // 7: Msg 3 (Your Turn)
    const sequence = [
      { step: 1, delay: 600 },
      { step: 2, delay: 2000 },
      { step: 3, delay: 4000 },
      { step: 4, delay: 5500 },
      { step: 5, delay: 7500 },
      { step: 6, delay: 10000 },
      { step: 7, delay: 11000 },
      { step: 0, delay: 18000 }, // Loop
    ];

    let currentTimeout;
    const runSequence = (index) => {
      if (index >= sequence.length) return;
      currentTimeout = setTimeout(() => {
        setStep(sequence[index].step);
        if (scrollRef.current) {
          // Smooth scroll to bottom
          setTimeout(() => {
            if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }, 50);
        }
        runSequence(index + 1);
      }, sequence[index].delay - (index > 0 ? sequence[index - 1].delay : 0));
    };

    if (step === 0) runSequence(0);

    return () => clearTimeout(currentTimeout);
  }, [step]);

  return (
    <div className="wa-phone">
      <div className="wa-notch"></div>
      
      <div className="wa-screen">
        {/* Header */}
        <div className="wa-header">
          <div className="wa-header-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <div className="wa-avatar">
              <img src="/logo.svg" alt="TokenPe" style={{ width: "24px", height: "24px" }} onError={(e) => e.target.style.display='none'} />
            </div>
            <div className="wa-title-wrap">
              <div className="wa-name">TokenPe Alerts <span className="wa-verified">✓</span></div>
              <div className="wa-status">Online</div>
            </div>
          </div>
          <div className="wa-header-icons">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </div>
        </div>

        {/* Chat Area */}
        <div className="wa-chat" ref={scrollRef}>
          <div className="wa-date">Today</div>
          
          {step >= 2 && (
            <div className="wa-msg wa-bot">
              🏥 Welcome to <strong>City Hospital</strong>!<br/>
              You have successfully joined the digital queue.<br/><br/>
              🎫 Your Token No: <strong>42</strong><br/>
              ⏳ Current Token: <strong>38</strong><br/>
              Wait time: ~15 mins
              <div className="wa-time">10:42 AM</div>
            </div>
          )}

          {step >= 4 && (
            <div className="wa-msg wa-bot">
              🔔 <strong>Alert!</strong> Your turn is approaching. Please be ready in the waiting area.
              <div className="wa-time">10:55 AM</div>
            </div>
          )}

          {step >= 5 && (
            <div className="wa-msg wa-bot wa-audio">
              <div className="wa-audio-ui">
                <div className="wa-play-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </div>
                <div className="wa-waveform">
                   <span style={{height:'30%'}}></span><span style={{height:'60%'}}></span><span style={{height:'100%'}}></span><span style={{height:'40%'}}></span><span style={{height:'70%'}}></span><span style={{height:'50%'}}></span><span style={{height:'80%'}}></span><span style={{height:'40%'}}></span><span style={{height:'20%'}}></span><span style={{height:'90%'}}></span><span style={{height:'50%'}}></span><span style={{height:'30%'}}></span>
                </div>
                <div className="wa-duration">0:08</div>
              </div>
              <div className="wa-time">10:55 AM</div>
            </div>
          )}

          {step >= 7 && (
            <div className="wa-msg wa-bot wa-highlight">
              ✅ <strong>It's your turn!</strong><br/>
              Please proceed to Doctor's Cabin 2.
              <div className="wa-time">10:58 AM</div>
            </div>
          )}

          {(step === 1 || step === 3 || step === 6) && (
            <div className="wa-msg wa-bot wa-typing">
              <span></span><span></span><span></span>
            </div>
          )}
        </div>
        
        {/* Fake Input Area */}
        <div className="wa-input-area">
          <div className="wa-input-box">Message</div>
          <div className="wa-mic">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          </div>
        </div>
      </div>

      <style jsx>{`
        .wa-phone {
          width: 320px;
          height: 620px;
          background: #000;
          border-radius: 40px;
          padding: 12px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1) inset;
          position: relative;
          transform: perspective(1000px) rotateY(-8deg) rotateX(4deg);
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }
        .wa-phone:hover {
          transform: perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(-10px);
        }
        .wa-notch {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 26px;
          background: #000;
          border-bottom-left-radius: 14px;
          border-bottom-right-radius: 14px;
          z-index: 10;
        }
        .wa-screen {
          width: 100%;
          height: 100%;
          background: #efeae2;
          border-radius: 30px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .wa-screen::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px);
          background-size: 16px 16px;
          opacity: 0.6;
          z-index: 0;
        }
        .wa-header {
          background: #008069;
          color: #fff;
          padding: 42px 14px 12px; /* Pad top for notch */
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 1;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .wa-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .wa-avatar {
          width: 38px;
          height: 38px;
          background: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .wa-name {
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .wa-verified {
          background: #25D366;
          color: #fff;
          border-radius: 50%;
          font-size: 8px;
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .wa-status {
          font-size: 12px;
          color: rgba(255,255,255,0.8);
        }
        .wa-chat {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          z-index: 1;
          scrollbar-width: none;
          scroll-behavior: smooth;
        }
        .wa-chat::-webkit-scrollbar { display: none; }
        .wa-date {
          text-align: center;
          background: rgba(255,255,255,0.9);
          color: #54656f;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 8px;
          align-self: center;
          margin-bottom: 8px;
          box-shadow: 0 1px 1px rgba(0,0,0,0.05);
        }
        .wa-msg {
          background: #fff;
          padding: 8px 10px 22px 10px;
          border-radius: 8px;
          font-size: 14.5px;
          color: #111b21;
          max-width: 85%;
          position: relative;
          box-shadow: 0 1px 1px rgba(0,0,0,0.1);
          line-height: 1.45;
          animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          transform-origin: top left;
        }
        .wa-msg.wa-bot {
          align-self: flex-start;
          border-top-left-radius: 0;
        }
        .wa-msg.wa-bot::before {
          content: '';
          position: absolute;
          top: 0;
          left: -8px;
          width: 0;
          height: 0;
          border: 8px solid transparent;
          border-top-color: #fff;
          border-right-color: #fff;
        }
        .wa-msg.wa-highlight {
          background: #dcf8c6;
        }
        .wa-msg.wa-highlight::before {
          border-top-color: #dcf8c6;
          border-right-color: #dcf8c6;
        }
        .wa-time {
          font-size: 10px;
          color: #667781;
          position: absolute;
          bottom: 4px;
          right: 8px;
        }
        .wa-typing {
          display: flex;
          gap: 4px;
          padding: 12px 14px;
          width: fit-content;
        }
        .wa-typing span {
          width: 6px;
          height: 6px;
          background: #8696a0;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }
        .wa-typing span:nth-child(2) { animation-delay: 0.2s; }
        .wa-typing span:nth-child(3) { animation-delay: 0.4s; }

        .wa-audio-ui {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .wa-play-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #128c7e;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .wa-waveform {
          display: flex;
          align-items: center;
          gap: 2px;
          height: 24px;
          flex: 1;
        }
        .wa-waveform span {
          width: 3px;
          background: #8696a0;
          border-radius: 4px;
        }
        .wa-duration {
          font-size: 12px;
          color: #8696a0;
        }

        .wa-input-area {
          background: #f0f2f5;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 1;
        }
        .wa-input-box {
          flex: 1;
          background: #fff;
          border-radius: 20px;
          padding: 10px 16px;
          color: #8696a0;
          font-size: 15px;
        }
        .wa-mic {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #008069;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes typing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @media(max-width: 768px){
          .wa-phone {
            width: 100%;
            max-width: 320px;
            height: 600px;
            transform: none;
            margin: 0 auto;
          }
          .wa-phone:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
