'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function SchoolDashboardError({ error, reset }) {
  useEffect(() => {
    console.error('School Dashboard Error:', error)
  }, [error])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#0f172a' }}>School Dashboard failed to load</h2>
      {process.env.NODE_ENV === 'development' && (
        <p style={{ color: 'red', marginBottom: '1rem', maxWidth: '80%', wordBreak: 'break-word' }}>{error.message}</p>
      )}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => reset()}
          style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', borderRadius: '0.375rem', cursor: 'pointer', border: 'none' }}
        >
          Try again
        </button>
        <Link href="/school-login" style={{ padding: '0.5rem 1rem', background: '#e2e8f0', color: '#0f172a', borderRadius: '0.375rem', textDecoration: 'none' }}>
          Back to login
        </Link>
      </div>
    </div>
  )
}
