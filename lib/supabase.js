import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const potentialKeys = [
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  process.env.SUPABASE_PUBLISHABLE_KEY,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
]
const supabaseKey = potentialKeys.find(k => k && k.startsWith('sb_publishable_')) || potentialKeys.find(k => k)

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[supabase] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY) must be set in your .env file')
}

const globalForSupabase = globalThis

export const supabase =
  globalForSupabase.supabase || createClient(supabaseUrl, supabaseKey)

globalForSupabase.supabase = supabase

// Backend-only client to bypass RLS (requires service role key in env)
const potentialAdminKeys = [
  process.env.SUPABASE_SECRET_KEY,
  process.env.SUPABASE_SERVICE_ROLE_KEY
]
const adminKey = potentialAdminKeys.find(k => k && k.startsWith('sb_secret_')) || potentialAdminKeys.find(k => k) || supabaseKey

export const supabaseAdmin =
  globalForSupabase.supabaseAdmin ||
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || supabaseUrl,
    adminKey, // Fallback to anon if not set locally
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

globalForSupabase.supabaseAdmin = supabaseAdmin

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