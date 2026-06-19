import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  "https://tjqynkjwpmhyxhrqamjh.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcXlua2p3cG1oeXhocnFhbWpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkzMjIyMywiZXhwIjoyMDk0NTA4MjIzfQ.HvWsG-bj0EDF4MPAdU0MzXDhGalORQRYCW5tn6f_N6s"
)

async function test() {
  const { data, error } = await supabase.from('clinics').select('id, name, location::text, is_public').not('location', 'is', null)
  console.log("Clinics:", data)
  console.log("Error:", error)
}
test()
