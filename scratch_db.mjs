import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  const { data: row, error: err2 } = await supabase.from('crm_ratings').select('*').limit(1)
  console.log("crm_ratings data/error:", row, err2)
  
  const { data: pRow, error: pErr } = await supabase.from('patients').select('*').limit(1)
  console.log("patients columns:", pRow && pRow.length > 0 ? Object.keys(pRow[0]) : "no data", "err:", pErr)
}
test()
