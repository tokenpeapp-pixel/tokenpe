import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  "https://tjqynkjwpmhyxhrqamjh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcXlua2p3cG1oeXhocnFhbWpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkzMjIyMywiZXhwIjoyMDk0NTA4MjIzfQ.HvWsG-bj0EDF4MPAdU0MzXDhGalORQRYCW5tn6f_N6s"
)

async function test() {
  const { data: row, error: err2 } = await supabase.from('crm_ratings').select('*').limit(1)
  console.log("crm_ratings data/error:", row, err2)
  
  const { data: pRow, error: pErr } = await supabase.from('patients').select('*').limit(1)
  console.log("patients columns:", pRow && pRow.length > 0 ? Object.keys(pRow[0]) : "no data", "err:", pErr)
}
test()
