"use client";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#080818',
      color: '#fff',
      textAlign: 'center',
      fontFamily: "'Inter', sans-serif",
      padding: '24px'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
      `}</style>
      
      <img src="/logo.svg" alt="TokenPe" style={{ height: 48, marginBottom: 32 }} />
      
      <h1 style={{ fontSize: '120px', fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #7C3AED, #06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        404
      </h1>
      <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>Page not found</h2>
      
      <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 400, lineHeight: 1.6, marginBottom: 32 }}>
        Sorry, we couldn't find the page you're looking for. It might have been removed or the link might be broken.
      </p>

      <div style={{ display: 'flex', gap: 16 }}>
        <button 
          onClick={() => router.push('/')}
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            color: '#fff',
            padding: '14px 28px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(124,58,237,0.4)',
            transition: 'transform 0.15s, opacity 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          Go to Home
        </button>
        <button 
          onClick={() => router.push('/login')}
          style={{
            background: 'rgba(255,255,255,0.07)',
            color: '#fff',
            padding: '14px 28px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.15)',
            cursor: 'pointer',
            transition: 'background 0.15s'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
        >
          Login to Clinic
        </button>
      </div>
    </div>
  );
}
