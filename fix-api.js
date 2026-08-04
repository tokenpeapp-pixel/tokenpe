const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) results = results.concat(walk(full));
    else results.push(full);
  }
  return results;
}

const files = walk('app/api').filter(f => f.endsWith('.js'));
for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Table renames
  if (c.includes("from('patients')")) {
    c = c.replace(/from\('patients'\)/g, "from('queue_entries')");
    modified = true;
  }
  
  if (c.includes("from('crm_ratings')")) {
     c = c.replace(/from\('crm_ratings'\)/g, "from('crm_customers')");
     modified = true;
  }

  // clinic_id -> business_id column references
  if (c.includes('.eq("clinic_id"') || c.includes("eq('clinic_id'")) {
    c = c.replace(/\.eq\("clinic_id"/g, '.eq("business_id"');
    c = c.replace(/\.eq\('clinic_id'/g, ".eq('business_id'");
    modified = true;
  }

  if (c.includes('clinic_id:') && !c.includes('business_id:')) {
    c = c.replace(/clinic_id:/g, 'business_id:');
    modified = true;
  }

  // clinicId -> businessId parameter passing
  if (c.includes("clinicId")) {
    c = c.replace(/clinicId/g, 'businessId');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, c);
    console.log('Updated API file: ' + file);
  }
}
