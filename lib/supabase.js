import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tjqynkjwpmhyxhrqamjh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcXlua2p3cG1oeXhocnFhbWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MzIyMjMsImV4cCI6MjA5NDUwODIyM30.Xjk8RR6V56EXTX7JrAf-6DQ-1Z0m-qa0lgC9pyHB7Zw'

const globalForSupabase = globalThis

export const supabase =
  globalForSupabase.supabase || createClient(supabaseUrl, supabaseKey)

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase
}

// Backend-only client to bypass RLS (requires service role key in env)
export const supabaseAdmin =
  globalForSupabase.supabaseAdmin ||
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey, // Fallback to anon if not set locally
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabaseAdmin = supabaseAdmin
}

export function getISTDateString() {
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }
  const formatter = new Intl.DateTimeFormat('en-CA', options)
  return formatter.format(new Date())
}

export function getISTYesterdayDateString() {
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }
  const formatter = new Intl.DateTimeFormat('en-CA', options)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return formatter.format(yesterday)
}