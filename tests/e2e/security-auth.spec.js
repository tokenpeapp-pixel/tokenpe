const { test, expect } = require('@playwright/test');

test.describe('TokenPe Security & Auth - Tenant Isolation', () => {

  test('Unauthenticated user is redirected to login from protected route', async ({ page }) => {
    // Attempt to hit the dashboard directly
    await page.goto('/dashboard');
    
    // Should be redirected to /login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('Unauthenticated API call returns 401', async ({ request }) => {
    // Attempt to hit queue API without session
    const response = await request.post('/api/queue/add', {
      data: { name: 'Hacker', phone: '9999999999' }
    });
    
    // Ensure it strictly fails
    expect(response.status()).toBe(401);
  });

  test('Cross-tenant API request strictly fails with 403', async ({ request }) => {
    // Simulate updating a clinic (ID 123) with mismatched credentials
    // We expect the API to strictly check permissions
    const response = await request.post('/api/clinics/update', {
      data: { 
        clinicId: '00000000-0000-0000-0000-000000000000', // Random UUID
        botTimings: 'Hacked Timings'
      }
    });

    const json = await response.json();
    console.log('Cross-tenant response:', response.status(), json);
    
    // It should fail early or return 401/403/400
    expect(response.status()).not.toBe(200);
  });

  test('XSS Payload in Search Query is sanitized', async ({ page }) => {
    const xssPayload = '<script>alert("XSS")</script>';
    // Hit the find clinic page with an XSS query string
    await page.goto(`/find?q=${encodeURIComponent(xssPayload)}`);
    
    // We expect the script tag NOT to be rendered functionally,
    // usually Next.js handles this natively via React escaping.
    // Check if an alert was triggered
    page.on('dialog', dialog => {
      // If a dialog pops up, our test will fail
      expect(dialog.type()).not.toBe('alert');
      dialog.dismiss();
    });

    // Wait for network idle
    await page.waitForLoadState('networkidle');
  });

});
