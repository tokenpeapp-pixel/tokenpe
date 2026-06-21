import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRLS() {
    const { data: tables, error } = await supabaseAdmin.rpc('get_table_rls_status');
    if (error) {
        console.log("Could not use RPC, querying pg_class directly");
        const { data, error: qErr } = await supabaseAdmin.rpc('query_rls');
        console.log("direct rls check error:", qErr?.message);
    } else {
        console.log("RLS Status:", tables);
    }
}
checkRLS();
