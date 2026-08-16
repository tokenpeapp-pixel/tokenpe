import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const potentialKeys = [
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ]
  const key = potentialKeys.find(k => k && k.startsWith('sb_publishable_')) || potentialKeys.find(k => k)

  const isReal = Boolean(url && key && !url.includes('placeholder'))
  const finalUrl = isReal ? url : 'https://placeholder.supabase.co'
  const finalKey = isReal ? key : 'placeholder-key'

  if (globalThis._supabaseClient && globalThis._supabaseIsReal === isReal) {
    return globalThis._supabaseClient
  }

  const client = createClient(finalUrl, finalKey)
  if (isReal) {
    globalThis._supabaseClient = client
    globalThis._supabaseIsReal = true
  }
  return client
}

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const potentialAdminKeys = [
    process.env.SUPABASE_SECRET_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ]
  const potentialAnonKeys = [
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ]
  const adminKey = potentialAdminKeys.find(k => k && k.startsWith('sb_secret_')) || 
                   potentialAdminKeys.find(k => k) || 
                   potentialAnonKeys.find(k => k && k.startsWith('sb_publishable_')) || 
                   potentialAnonKeys.find(k => k)

  const isReal = Boolean(url && adminKey && !url.includes('placeholder'))
  const finalUrl = isReal ? url : 'https://placeholder.supabase.co'
  const finalKey = isReal ? adminKey : 'placeholder-key'

  if (globalThis._supabaseAdminClient && globalThis._supabaseAdminIsReal === isReal) {
    return globalThis._supabaseAdminClient
  }

  const client = createClient(finalUrl, finalKey, { auth: { autoRefreshToken: false, persistSession: false } })
  if (isReal) {
    globalThis._supabaseAdminClient = client
    globalThis._supabaseAdminIsReal = true
  }
  return client
}

export const supabase = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseClient()
    const val = Reflect.get(client, prop)
    return typeof val === 'function' ? val.bind(client) : val
  }
})

export const supabaseAdmin = new Proxy({}, {
  get(target, prop) {
    const client = getSupabaseAdminClient()
    const val = Reflect.get(client, prop)
    return typeof val === 'function' ? val.bind(client) : val
  }
})

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
