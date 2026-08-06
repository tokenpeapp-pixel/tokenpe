"use client";
import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if user hasn't already accepted
    const accepted = localStorage.getItem("tokenpe_cookie_consent");
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem("tokenpe_cookie_consent", "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: 'rgba(8, 42, 32, 0.94)',
      backdropFilter: 'blur(16px)',
      border: '1.5px solid rgba(52, 211, 153, 0.3)',
      borderRadius: '20px',
      padding: '14px 22px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px',
      maxWidth: '680px',
      width: 'calc(100% - 32px)',
      boxShadow: '0 20px 48px rgba(0, 0, 0, 0.5), 0 0 24px rgba(52, 211, 153, 0.15)',
      animation: 'cookieSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      fontFamily: "inherit",
    }}>
      <style>{`
        @keyframes cookieSlideUp {
          from { transform: translate(-50%, 40px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '18px' }}>🍪</span>
        <p style={{
          color: 'rgba(241, 245, 249, 0.88)',
          fontSize: '13px',
          margin: 0,
          lineHeight: 1.5,
          fontWeight: 500,
        }}>
          We use essential cookies for secure login & preferences. No ads or tracking.{' '}
          <a href="/privacy" style={{ color: '#34d399', textDecoration: 'none', fontWeight: 700 }}>
            Privacy Policy
          </a>
        </p>
      </div>
      <button
        onClick={accept}
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          border: 'none',
          padding: '9px 20px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 800,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.35)';
        }}
      >
        Got it
      </button>
    </div>
  );
}
