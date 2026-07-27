import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient('https://tjqynkjwpmhyxhrqamjh.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcXlua2p3cG1oeXhocnFhbWpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkzMjIyMywiZXhwIjoyMDk0NTA4MjIzfQ.HvWsG-bj0EDF4MPAdU0MzXDhGalORQRYCW5tn6f_N6s');

async function run() {
    // get columns for clinics
    const res = await supabaseAdmin.rpc('get_table_info', { table_name: 'clinics' });
    console.log('clinics schema:', res);
}
run();
