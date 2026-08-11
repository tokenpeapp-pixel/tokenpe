const { test, expect } = require('@playwright/test');

test.describe('TokenPe Webhook & Chatbot Infrastructure', () => {

  test('Webhook strictly returns 200 OK for valid QR Code Join payload to prevent MSG91 retries', async ({ request }) => {
    // Simulate a payload sent by MSG91 when a user scans the QR code
    const payload = {
      "contacts": [{ "wa_id": "919999999999" }],
      "messages": [{
        "type": "text",
        "text": { "body": "JOIN TEST12" }
      }]
    };

    const response = await request.post('/api/webhooks/msg91', {
      data: payload
    });

    // The webhook must return 200 OK extremely fast so MSG91 doesn't retry
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.status).toBe('received');
  });

  test('Webhook strictly returns 200 OK for Interactive List rating to prevent MSG91 retries', async ({ request }) => {
    // Simulate a patient tapping "5 - Excellent" on the "Rate Your Visit" message
    const payload = {
      "sender": { "phone": "919999999999" },
      "type": "interactive",
      "interactive": {
        "type": "list_reply",
        "list_reply": { "id": "R5", "title": "5 - Excellent" }
      }
    };

    const response = await request.post('/api/webhooks/msg91', {
      data: payload
    });

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.status).toBe('received');
  });

  test('Chaos Testing: Webhook handles malformed payload gracefully without crashing', async ({ request }) => {
    // Send a totally malformed junk payload
    const payload = {
      "junk": "data",
      "messages": [{ "type": "unknown", "text": null }]
    };

    const response = await request.post('/api/webhooks/msg91', {
      data: payload
    });

    // Our webhook should ignore it and return 200 OK (with status 'ignored') 
    // to prevent infinite retry loops from the provider.
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.status).toBe('ignored');
  });

});
