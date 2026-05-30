"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard ErrorBoundary caught error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a',
      color: '#fff',
      padding: '24px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
      `}</style>
      
      <div style={{
        background: '#1e293b',
        padding: '40px',
        borderRadius: '24px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Something went wrong!</h2>
        <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
          We encountered an unexpected error while loading your dashboard. Please try reloading the page.
        </p>
        <button
          onClick={() => reset()}
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            color: 'white',
            border: 'none',
            padding: '14px 28px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.3)',
            transition: 'transform 0.15s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
