'use client'
import { useEffect, useState } from 'react'
import { Scissors, Search } from 'lucide-react'

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '917977075721'

export default function SRedirectClient({ salon, code }) {
  const [countdown, setCountdown] = useState(2)
  const waLink = `https://wa.me/${WA_NUMBER}?text=JOIN%20${encodeURIComponent(code)}`

  useEffect(() => {
    // Countdown tick
    const tick = setInterval(() => {
      setCountdown(n => Math.max(0, n - 1))
    }, 1000)

    // Actual redirect after 1.8s
    const redirectTimer = setTimeout(() => {
      window.location.href = waLink
    }, 1800)

    return () => {
      clearInterval(tick)
      clearTimeout(redirectTimer)
    }
  }, [waLink])

  const salonName = salon?.name || 'the salon'
  const notFound = !salon

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #2e1026; color: #fff; }

        .s-page {
          min-height: 100vh;
          background: #2e1026;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        /* Grid */
        .s-page::before {
          content: '';
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(236,72,153,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(236,72,153,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .s-orb1 { position: absolute; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%); top: -120px; left: -120px; pointer-events: none; animation: sfloat1 9s ease-in-out infinite; }
        .s-orb2 { position: absolute; width: 400px; height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%); bottom: -80px; right: -80px; pointer-events: none; animation: sfloat2 11s ease-in-out infinite; }
        @keyframes sfloat1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-28px)} }
        @keyframes sfloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(20px)} }

        .s-card {
          position: relative; z-index: 1;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 28px;
          padding: 48px 40px;
          max-width: 440px;
          width: 100%;
          text-align: center;
          backdrop-filter: blur(16px);
          box-shadow: 0 32px 80px rgba(0,0,0,0.4);
        }

        .s-logo { height: 44px; width: auto; margin-bottom: 32px; }

        /* WhatsApp pulse icon */
        .wa-icon-wrap {
          width: 80px; height: 80px;
          border-radius: 24px;
          background: linear-gradient(135deg, #25D366, #128C7E);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
          box-shadow: 0 8px 32px rgba(37,211,102,0.4);
          animation: waPulse 2s ease-in-out infinite;
          position: relative;
        }
        @keyframes waPulse {
          0%,100% { box-shadow: 0 8px 32px rgba(37,211,102,0.4); transform: scale(1); }
          50% { box-shadow: 0 12px 48px rgba(37,211,102,0.65); transform: scale(1.06); }
        }

        .s-title {
          font-size: 22px; font-weight: 800; color: #f8fafc;
          margin-bottom: 10px; line-height: 1.3; letter-spacing: -0.5px;
        }
        .s-salon-name {
          background: linear-gradient(135deg, #ec4899, #db2777);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .s-sub {
          font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.65; margin-bottom: 32px;
        }

        /* Progress bar */
        .s-progress-wrap {
          background: rgba(255,255,255,0.06);
          border-radius: 100px;
          height: 4px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .s-progress-bar {
          height: 100%;
          border-radius: 100px;
          background: linear-gradient(90deg, #db2777, #ec4899, #10B981);
          animation: progressFill 1.8s linear forwards;
        }
        @keyframes progressFill { from { width: 0%; } to { width: 100%; } }

        .s-redirect-note {
          font-size: 12px; color: rgba(255,255,255,0.4); font-weight: 500;
        }

        .s-manual-link {
          display: inline-flex; align-items: center; gap: 8px;
          margin-top: 24px;
          background: linear-gradient(135deg, #25D366, #128C7E);
          color: #fff; padding: 13px 28px; border-radius: 14px;
          font-size: 14px; font-weight: 700; text-decoration: none;
          box-shadow: 0 6px 24px rgba(37,211,102,0.35);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .s-manual-link:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(37,211,102,0.5); }

        /* Not found */
        .s-notfound { font-size: 64px; margin-bottom: 20px; }
        .s-notfound-title { font-size: 22px; font-weight: 800; color: #f87171; margin-bottom: 10px; }
        .s-notfound-sub { font-size: 14px; color: rgba(255,255,255,0.45); margin-bottom: 28px; line-height: 1.65; }
        .s-find-link {
          display: inline-flex; align-items: center; gap: 7px;
          background: linear-gradient(135deg, #db2777, #ec4899);
          color: #fff; padding: 12px 28px; border-radius: 12px;
          font-size: 14px; font-weight: 700; text-decoration: none;
          box-shadow: 0 4px 20px rgba(236,72,153,0.35);
        }

        @media (max-width: 480px) {
          .s-card { padding: 36px 24px; border-radius: 20px; }
        }
      `}</style>

      <div className="s-page">
        <div className="s-orb1" />
        <div className="s-orb2" />

        <div className="s-card">
          <img src="/logo.svg" alt="TokenPe" className="s-logo" />

          {notFound ? (
            <>
              <div className="s-notfound" style={{ display: 'flex', justifyContent: 'center', color: '#f87171', marginBottom: 20 }}>
                <Scissors size={64} />
              </div>
              <div className="s-notfound-title">Salon not found</div>
              <p className="s-notfound-sub">
                The salon code <strong style={{ color: '#f8fafc' }}>{code}</strong> doesn't match any registered salon. It may have been deactivated.
              </p>
              <a href="/find-salon" className="s-find-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Search size={16} /> Find another salon
              </a>
            </>
          ) : (
            <>
              {/* WhatsApp icon */}
              <div className="wa-icon-wrap">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>

              <div className="s-title">
                Connecting you to<br />
                <span className="s-salon-name">{salonName}</span>
                <br />on WhatsApp
              </div>
              <p className="s-sub">
                You'll be redirected to WhatsApp in a moment.<br />
                Send the message to join the waitlist.
              </p>

              {/* Progress bar */}
              <div className="s-progress-wrap">
                <div className="s-progress-bar" />
              </div>
              <div className="s-redirect-note">Redirecting automatically...</div>

              {/* Manual fallback */}
              <a href={waLink} className="s-manual-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Open WhatsApp now
              </a>
            </>
          )}
        </div>
      </div>
    </>
  )
}
