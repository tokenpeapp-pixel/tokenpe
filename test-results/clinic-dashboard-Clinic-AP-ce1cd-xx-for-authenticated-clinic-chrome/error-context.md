# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: clinic-dashboard.spec.js >> Clinic API health checks >> GET /api/dashboard/payments returns 2xx for authenticated clinic
- Location: tests\e2e\clinic-dashboard.spec.js:506:7

# Error details

```
TypeError: request.newContext is not a function
```

# Test source

```ts
  410 |       await context.close()
  411 |     })
  412 | 
  413 |     test(`[${label}] Unauthenticated access to /dashboard redirects to login`, async ({ browser }) => {
  414 |       const context = await browser.newContext({
  415 |         viewport: { width: viewportWidth, height: viewportWidth === 390 ? 844 : 800 },
  416 |       })
  417 |       const page = await context.newPage()
  418 |       await page.goto('/dashboard')
  419 |       await page.waitForLoadState('domcontentloaded')
  420 |       await page.waitForTimeout(3000)
  421 |       const url = page.url()
  422 |       const isRedirected = url.includes('/login') || url.includes('/business-login')
  423 |       expect(isRedirected, `Expected redirect to login, got: ${url}`).toBeTruthy()
  424 |       await context.close()
  425 |     })
  426 | 
  427 |     if (viewportWidth === 390) {
  428 |       test(`[${label}] Mobile hamburger opens nav drawer with all key links`, async ({ browser, request, baseURL }) => {
  429 |         const suffix = qaSuffix()
  430 |         const { clinic } = await registerClinic(request, suffix)
  431 |         const { json, sessionCookie } = await loginClinic(request, clinic)
  432 |         const context = await contextWithSession(browser, baseURL, sessionCookie, viewportWidth)
  433 |         const page = await context.newPage()
  434 |         await page.goto('/')
  435 |         await seedLocalStorage(page, json.clinic)
  436 |         await page.goto('/dashboard')
  437 |         await page.waitForFunction(
  438 |           () => !document.querySelector('.spinner-ring'),
  439 |           { timeout: 15000 }
  440 |         ).catch(() => {})
  441 |         const sidebar = page.locator('.dashboard-sidebar').first()
  442 |         const sidebarVisible = await sidebar.isVisible({ timeout: 2000 }).catch(() => false)
  443 |         if (sidebarVisible) {
  444 |           console.warn('[SOFT] Sidebar visible at 390px � CSS media query may not be working')
  445 |         }
  446 |         const hamburger = page.locator('.hamburger-btn, button[title="Open Navigation Menu"]').first()
  447 |         await expect(hamburger).toBeVisible({ timeout: 8000 })
  448 |         await hamburger.click()
  449 |         await page.waitForTimeout(600)
  450 |         await expect(
  451 |           page.locator('button:has-text("Live Queue"), button:has-text("Active Queue"), button:has-text("Manual Check-in")').first()
  452 |         ).toBeVisible({ timeout: 5000 })
  453 |         await expect(
  454 |           page.locator('button:has-text("Appointments"), button:has-text("Analytics")').first()
  455 |         ).toBeVisible({ timeout: 3000 })
  456 |         await expect(
  457 |           page.locator('button:has-text("Doctors"), button:has-text("CRM"), button:has-text("Patients")').first()
  458 |         ).toBeVisible({ timeout: 3000 })
  459 |         await context.close()
  460 |       })
  461 |     }
  462 | 
  463 |     test(`[${label}] Payments tab: Total Collected and Pending Balance rendered`, async ({ browser, request, baseURL }) => {
  464 |       const suffix = qaSuffix()
  465 |       const { clinic } = await registerClinic(request, suffix)
  466 |       const { json, sessionCookie } = await loginClinic(request, clinic)
  467 |       const context = await contextWithSession(browser, baseURL, sessionCookie, viewportWidth)
  468 |       const page = await context.newPage()
  469 |       await page.goto('/')
  470 |       await seedLocalStorage(page, json.clinic)
  471 |       await page.goto('/dashboard')
  472 |       await page.waitForFunction(
  473 |         () => !document.querySelector('.spinner-ring'),
  474 |         { timeout: 15000 }
  475 |       ).catch(() => {})
  476 |       await page.locator('button:has-text("Payments")').first().click()
  477 |       await page.waitForTimeout(2000)
  478 |       await expect(page.getByText(/Total Collected/i).first()).toBeVisible({ timeout: 8000 })
  479 |       await expect(page.getByText(/Pending Balance/i).first()).toBeVisible({ timeout: 8000 })
  480 |       await context.close()
  481 |     })
  482 | 
  483 |   })
  484 | }
  485 | 
  486 | // --- API-level health checks --------------------------------------------------
  487 | 
  488 | test.describe('Clinic API health checks', () => {
  489 | 
  490 |   test('POST /api/business-auth/login returns 401 for wrong PIN', async ({ request }) => {
  491 |     const suffix = qaSuffix()
  492 |     const { clinic } = await registerClinic(request, suffix)
  493 |     const resp = await request.post('/api/business-auth/login', {
  494 |       data: { email: clinic.email, phone: clinic.phone, pin: '0000', vertical: 'clinic' },
  495 |     })
  496 |     expect(resp.status()).toBe(401)
  497 |     const json = await resp.json()
  498 |     expect(json.success).toBe(false)
  499 |   })
  500 | 
  501 |   test('GET /api/dashboard/init returns non-200 without session cookie', async ({ request }) => {
  502 |     const resp = await request.get('/api/dashboard/init')
  503 |     expect(resp.status()).not.toBe(200)
  504 |   })
  505 | 
  506 |   test('GET /api/dashboard/payments returns 2xx for authenticated clinic', async ({ request, baseURL }) => {
  507 |     const suffix = qaSuffix()
  508 |     const { clinic } = await registerClinic(request, suffix)
  509 |     const { json, sessionCookie } = await loginClinic(request, clinic)
> 510 |     const authedReq = await request.newContext({
      |                                     ^ TypeError: request.newContext is not a function
  511 |       extraHTTPHeaders: { cookie: `tokenpe_unified_session=${sessionCookie}` },
  512 |     })
  513 |     const resp = await authedReq.get(`/api/dashboard/payments?clinicId=${json.clinic.id}`)
  514 |     expect(resp.ok(), `Payments API returned ${resp.status()}`).toBeTruthy()
  515 |     const data = await resp.json()
  516 |     expect(typeof data.success).toBe('boolean')
  517 |     await authedReq.dispose()
  518 |   })
  519 | 
  520 |   test('POST /api/queue/add rejects request with missing businessId', async ({ request }) => {
  521 |     const resp = await request.post('/api/queue/add', {
  522 |       data: { name: 'Test Patient', phone: '9876543210', token: 'T-001' },
  523 |     })
  524 |     expect(resp.status(), 'Expected 4xx when businessId is missing').toBeGreaterThanOrEqual(400)
  525 |   })
  526 | 
  527 | })
  528 | 
```