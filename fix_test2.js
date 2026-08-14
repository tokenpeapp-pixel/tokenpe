const fs = require('fs');
let code = fs.readFileSync('tests/e2e/clinic-dashboard.spec.js', 'utf-8');
code = code.replace(/const btn = page\.locator\(`button\[type="submit"\]:has-text\("Add to Queue"\)`\)\.first\(\); await btn\.waitFor/g, 'let submitBtn = page.locator(`button[type="submit"]:has-text("Add to Queue")`).first(); await submitBtn.waitFor');
code = code.replace(/await btn\.click\(\{ force: true \}\)/g, 'await submitBtn.click({ force: true })');
fs.writeFileSync('tests/e2e/clinic-dashboard.spec.js', code);
