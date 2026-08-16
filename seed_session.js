require('dotenv').config({ path: '.env.local' });
const { supabaseAdmin } = require('./lib/supabase');

async function seedSession() {
    const { data: clinic } = await supabaseAdmin.from('clinics').select('id, code').limit(1).single();
    if (!clinic) {
        console.error('No clinic found');
        process.exit(1);
    }
    
    await supabaseAdmin.from('whatsapp_sessions').upsert({
        phone: '911234567890',
        state: 'idle',
        data: {
            mode: 'clinic',
            clinic_id: clinic.id,
            businessCode: clinic.code,
            history: []
        }
    }, { onConflict: 'phone' });
    
    console.log(`Seeded session for clinic ${clinic.code}`);
    process.exit(0);
}
seedSession();
