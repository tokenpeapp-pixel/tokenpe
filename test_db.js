require('dotenv').config({path: '.env.local'});
const {createClient} = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
s.from('patients').select('id, rating, crm_rating').not('rating', 'is', null).limit(10).then(r => console.log('Rating:', r.data));
s.from('patients').select('id, rating, crm_rating').not('crm_rating', 'is', null).limit(10).then(r => console.log('CRM Rating:', r.data));
