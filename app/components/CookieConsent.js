"use client";
import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if user hasn't already accepted
    const accepted = localStorage.getItem("tokenpe_cookie_consent");
    if (!accepted) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setVisible(true), 1500);
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
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.97)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(124, 58, 237, 0.3)',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      flexWrap: 'wrap',
      animation: 'slideUp 0.4s ease-out',
      fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <p style={{
        color: 'rgba(255,255,255,0.75)',
        fontSize: '13px',
        margin: 0,
        lineHeight: 1.5,
        maxWidth: 600,
      }}>
        🍪 We use essential cookies to keep you logged in and remember your preferences. No tracking or advertising cookies are used.{' '}
        <a href="/privacy" style={{ color: '#a78bfa', textDecoration: 'underline' }}>Privacy Policy</a>
      </p>
      <button
        onClick={accept}
        style={{
          background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
          color: '#fff',
          border: 'none',
          padding: '10px 24px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
          transition: 'opacity 0.2s',
        }}
        onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
        onMouseOut={e => e.currentTarget.style.opacity = '1'}
      >
        Got it
      </button>
    </div>
  );
}
