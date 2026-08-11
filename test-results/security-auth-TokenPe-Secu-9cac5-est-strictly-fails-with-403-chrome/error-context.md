# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security-auth.spec.js >> TokenPe Security & Auth - Tenant Isolation >> Cross-tenant API request strictly fails with 403
- Location: tests\e2e\security-auth.spec.js:23:3

# Error details

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not 200
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test.describe('TokenPe Security & Auth - Tenant Isolation', () => {
  4  | 
  5  |   test('Unauthenticated user is redirected to login from protected route', async ({ page }) => {
  6  |     // Attempt to hit the dashboard directly
  7  |     await page.goto('/dashboard');
  8  |     
  9  |     // Should be redirected to /login
  10 |     await expect(page).toHaveURL(/.*\/login/);
  11 |   });
  12 | 
  13 |   test('Unauthenticated API call returns 401', async ({ request }) => {
  14 |     // Attempt to hit queue API without session
  15 |     const response = await request.post('/api/queue/add', {
  16 |       data: { name: 'Hacker', phone: '9999999999' }
  17 |     });
  18 |     
  19 |     // Ensure it strictly fails
  20 |     expect(response.status()).toBe(401);
  21 |   });
  22 | 
  23 |   test('Cross-tenant API request strictly fails with 403', async ({ request }) => {
  24 |     // Simulate updating a clinic (ID 123) with mismatched credentials
  25 |     // We expect the API to strictly check permissions
  26 |     const response = await request.post('/api/clinics/update', {
  27 |       data: { 
  28 |         clinicId: '00000000-0000-0000-0000-000000000000', // Random UUID
  29 |         botTimings: 'Hacked Timings'
  30 |       }
  31 |     });
  32 | 
  33 |     const json = await response.json();
  34 |     console.log('Cross-tenant response:', response.status(), json);
  35 |     
  36 |     // It should fail early or return 401/403/400
> 37 |     expect(response.status()).not.toBe(200);
     |                                   ^ Error: expect(received).not.toBe(expected) // Object.is equality
  38 |   });
  39 | 
  40 |   test('XSS Payload in Search Query is sanitized', async ({ page }) => {
  41 |     const xssPayload = '<script>alert("XSS")</script>';
  42 |     // Hit the find clinic page with an XSS query string
  43 |     await page.goto(`/find?q=${encodeURIComponent(xssPayload)}`);
  44 |     
  45 |     // We expect the script tag NOT to be rendered functionally,
  46 |     // usually Next.js handles this natively via React escaping.
  47 |     // Check if an alert was triggered
  48 |     page.on('dialog', dialog => {
  49 |       // If a dialog pops up, our test will fail
  50 |       expect(dialog.type()).not.toBe('alert');
  51 |       dialog.dismiss();
  52 |     });
  53 | 
  54 |     // Wait for network idle
  55 |     await page.waitForLoadState('networkidle');
  56 |   });
  57 | 
  58 | });
  59 | 
```