import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    // get columns for clinics
    const res = await supabaseAdmin.rpc('get_table_info', { table_name: 'clinics' });
    console.log('clinics schema:', res);
}
run();
