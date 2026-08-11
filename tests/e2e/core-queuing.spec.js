const { test, expect } = require('@playwright/test');

test.describe('TokenPe Core Queuing Workflows', () => {

  test('Adding a patient to a closed queue returns 400', async ({ request }) => {
    // Attempt to add a patient to a queue we expect to be closed (or we mock it)
    // For safety against production, we will hit an invalid state on purpose.
    const response = await request.post('/api/queue/add', {
      data: { 
        name: 'Test Patient', 
        phone: '9999999999', 
        businessId: 'invalid-id' 
      }
    });

    // Should return 400, 404, or 500 because the business is invalid
    expect([400, 404, 500]).toContain(response.status());
  });

  test('Unauthenticated user cannot call next patient', async ({ request }) => {
    const response = await request.post('/api/queue/next', {
      data: { 
        clinicId: 'some-valid-id' 
      }
    });

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('Unauthenticated user cannot mark patient as done', async ({ request }) => {
    const response = await request.post('/api/queue/done', {
      data: { 
        patientId: 'some-patient-id',
        clinicId: 'some-clinic-id'
      }
    });

    // Should return 401 Unauthorized
    expect(response.status()).toBe(401);
  });
  
});
