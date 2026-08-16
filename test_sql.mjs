import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tjqynkjwpmhyxhrqamjh.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcXlua2p3cG1oeXhocnFhbWpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkzMjIyMywiZXhwIjoyMDk0NTA4MjIzfQ.HvWsG-bj0EDF4MPAdU0MzXDhGalORQRYCW5tn6f_N6s'

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabaseAdmin.rpc('exec_sql', { query: 'SELECT 1;' })
  if (error) {
    console.log('Error executing SQL via RPC:', error)
  } else {
    console.log('Success:', data)
  }
}

test()
