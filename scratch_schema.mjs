import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient('https://tjqynkjwpmhyxhrqamjh.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcXlua2p3cG1oeXhocnFhbWpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkzMjIyMywiZXhwIjoyMDk0NTA4MjIzfQ.HvWsG-bj0EDF4MPAdU0MzXDhGalORQRYCW5tn6f_N6s');

async function run() {
    const { data, error } = await supabaseAdmin.from('clinics').select('id').limit(1);
    if (error) console.error(error);
    else console.log("Clinic ID example:", data[0]?.id);
}
run();
