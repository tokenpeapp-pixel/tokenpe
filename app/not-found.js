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
      backgroundColor: '#050506',
      color: '#f9fafb',
      textAlign: 'center',
      fontFamily: "'Inter', sans-serif",
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
        
        @keyframes drift1 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes drift2 {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-30px, 50px) scale(0.9); }
          66% { transform: translate(20px, -20px) scale(1.1); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        .ghost-1 {
          position: absolute;
          width: 800px;
          height: 800px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 70%);
          top: -200px;
          left: -100px;
          animation: drift1 20s infinite ease-in-out;
          pointer-events: none;
          z-index: 0;
        }
        
        .ghost-2 {
          position: absolute;
          width: 700px;
          height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(45,212,167,0.15) 0%, rgba(45,212,167,0) 70%); /* secondaryAccent from landing */
          bottom: -150px;
          right: -100px;
          animation: drift2 25s infinite ease-in-out;
          pointer-events: none;
          z-index: 0;
        }

        .content-layer {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* ── ANIMATED QUEUE BACKGROUND ── */
        .queue-bg-container {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
          opacity: 0.15;
        }
        .queue-dot {
          position: absolute;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 10px rgba(255,255,255,0.5);
          animation: queue-drift 15s linear infinite;
        }
        @keyframes queue-drift {
          from { transform: translateX(-10vw); }
          to { transform: translateX(110vw); }
        }
      `}</style>

      <div className="ghost-1"></div>
      <div className="ghost-2"></div>
      
      <div className="queue-bg-container">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="queue-dot" 
            style={{ 
              top: `${5 + i * 8}%`, 
              animationDelay: `${-(i * 2.5)}s`,
              animationDuration: `${12 + (i % 4) * 4}s`,
              opacity: 0.3 + (i % 3) * 0.2
            }} 
          />
        ))}
      </div>
      
      <div className="content-layer">
      
      <img src="/logo.svg" alt="TokenPe" style={{ height: 48, marginBottom: 32 }} />
      
      <h1 style={{ fontSize: '120px', fontWeight: 900, margin: 0, color: '#ffffff', letterSpacing: '-0.02em' }}>
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
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            padding: '14px 28px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          Go to Home
        </button>

      </div>
      </div>
    </div>
  );
}
