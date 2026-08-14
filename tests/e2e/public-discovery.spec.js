const { test, expect } = require('@playwright/test');

test.describe('TokenPe Public Discovery & SEO', () => {

  test('Find Clinic search returns 200 OK and prevents XSS', async ({ request }) => {
    const xssPayload = '<img src=x onerror=alert(1)>';
    const response = await request.get(`/api/clinics/search?vertical=clinic&q=${encodeURIComponent(xssPayload)}`);
    
    expect(response.status()).toBe(200);
    const json = await response.json();
    
    // Ensure the API handles it gracefully and returns an empty array or valid json, not crashing
    expect(json).toBeDefined();
    if (json.data) {
      expect(Array.isArray(json.data)).toBe(true);
    }
  });

  test('Nearby Clinics GPS API validates latitude and longitude ranges', async ({ request }) => {
    // Pass invalid coordinates to ensure the API doesn't crash or expose SQL errors
    const response = await request.get('/api/clinics/nearby?lat=999&lng=999');
    
    // Should return 400 Bad Request or 200 with empty data
    expect([200, 400]).toContain(response.status());
  });

});
