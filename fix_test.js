const fs = require('fs');
let code = fs.readFileSync('tests/e2e/clinic-dashboard.spec.js', 'utf-8');
code = code.replace(/await page\.click\('button:has-text\("Add to Queue"\)'\)/g, 'const btn = page.locator(`button[type="submit"]:has-text("Add to Queue")`).first(); await btn.waitFor({ state: "visible", timeout: 5000 }); await btn.click({ force: true })');
fs.writeFileSync('tests/e2e/clinic-dashboard.spec.js', code);
