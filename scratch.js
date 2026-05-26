const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl, supabaseKey;
for (const line of env.split('\n')) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
}
fetch(`${supabaseUrl}/rest/v1/clinics?select=*&limit=1`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
}).then(res => res.json()).then(data => console.log(Object.keys(data[0] || {})));
