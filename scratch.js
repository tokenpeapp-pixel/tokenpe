const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const env = fs.readFileSync('.env.local', 'utf8')
const getEnv = (key) => env.split('\n').find(l => l.startsWith(key))?.split('=')[1]?.trim()

const supabase = createClient(
  getEnv('NEXT_PUBLIC_SUPABASE_URL'),
  getEnv('SUPABASE_SERVICE_ROLE_KEY')
)

async function fix() {
  const { data, error } = await supabase
    .from('clinics')
    .update({ subscription_status: 'trialing' })
    .is('current_period_end', null)
    .eq('subscription_status', 'active')
    
  console.log('Fixed:', data, error)
}

fix()
