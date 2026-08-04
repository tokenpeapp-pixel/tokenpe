const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

const files = walk('app/api/business-auth').filter(f => f.endsWith('.js'));
const replacements = [
    [/from\('clinics'\)/g, "from('businesses')"],
    [/tokenpe_session/g, "tokenpe_unified_session"],
    [/tokenpe_clinic/g, "tokenpe_business"],
    [/clinicId/g, "businessId"],
    [/clinic_id/g, "business_id"],
    [/clinicCode/g, "businessCode"],
    [/clinic\.id/g, "business.id"],
    [/clinic\.code/g, "business.code"],
    [/clinic\.phone/g, "business.phone"],
    [/getSession/g, "getUnifiedSession"],
    [/tableName = vertical === 'salon' \? 'salons' : 'clinics'/g, "tableName = 'businesses'"],
    [/const tableName = 'clinics'/g, "const tableName = 'businesses'"]
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
    }
    
    // Custom payload replacement for token sign
    content = content.replace(/businessId: data\.id,\s*businessCode: data\.code,\s*phone: data\.phone,\s*role: activeRole/g, 
        'businessId: data.id, businessCode: data.code, phone: data.phone, type: data.type, role: activeRole');
        
    content = content.replace(/businessId: data\.id,\s*businessCode: data\.code,\s*phone: data\.phone/g, 
        'businessId: data.id, businessCode: data.code, phone: data.phone, type: data.type');
        
    // In register, set type for insert
    // 'vertical: vertical' -> 'type: vertical'
    content = content.replace(/vertical:\s*vertical/g, 'type: vertical');
    
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
}
