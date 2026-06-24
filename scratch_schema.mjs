import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient('https://tjqynkjwpmhyxhrqamjh.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcXlua2p3cG1oeXhocnFhbWpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkzMjIyMywiZXhwIjoyMDk0NTA4MjIzfQ.HvWsG-bj0EDF4MPAdU0MzXDhGalORQRYCW5tn6f_N6s');

async function run() {
    const res = await supabaseAdmin.from('pg_views').select('definition').eq('viewname', 'public_clinics').eq('schemaname', 'public');
    if (res.error) console.error('pg_views error:', res.error.message);
    else console.log('View def:', res.data?.[0]?.definition);
}
run();
