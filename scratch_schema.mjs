import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    // Get a single row to check columns
    const { data, error } = await supabaseAdmin.from('patients').select('*').limit(1);
    if (error) console.error(error);
    else if (data && data.length > 0) console.log("Columns:", Object.keys(data[0]));
    else console.log("Table is empty, can't infer schema this way.");
}
run();
