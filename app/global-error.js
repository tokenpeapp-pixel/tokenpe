'use client'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Global Error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Something went wrong!</h2>
          {process.env.NODE_ENV === 'development' && (
            <p style={{ color: 'red', marginBottom: '1rem', maxWidth: '80%', wordBreak: 'break-word' }}>{error.message}</p>
          )}
          <button
            onClick={() => reset()}
            style={{ padding: '0.5rem 1rem', background: '#0f172a', color: 'white', borderRadius: '0.375rem', cursor: 'pointer', border: 'none' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
