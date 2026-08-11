# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: clinic-dashboard.spec.js >> Clinic Dashboard � mobile (390px) >> [mobile (390px)] Mobile hamburger opens nav drawer with all key links
- Location: tests\e2e\clinic-dashboard.spec.js:428:11

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('button:has-text("Appointments"), button:has-text("Analytics")').first()
Expected: visible
Received: hidden
Timeout:  3000ms

Call log:
  - Expect "toBeVisible" with timeout 3000ms
  - waiting for locator('button:has-text("Appointments"), button:has-text("Analytics")').first()
    9 × locator resolved to <button class="jsx-e34df51e91e650cd sidebar-btn">…</button>
      - unexpected value "hidden"

```

```yaml
- main:
  - text: Q QUEUE DASHBOARD · MUMBAI
  - heading "QA Clinic 6725168822" [level=1]
  - button "Edit"
  - text: "Mon, Aug 10, 2026 LIVE QUEUE 06 : 37 : 37 PM"
  - button "Open Navigation Menu"
  - text: Total Today 01 Waiting 00 Done 01 Avg Waiting Time 00 m LIVE QUEUE CONTROL & BROADCAST CONSOLE
  - paragraph: Scan the clinic QR code to instantly join the live queue. Broadcast live public notices to all queued patients or manually manage check-in records.
  - button "DISPLAY CLINIC QR CODE"
  - button "MANUAL CHECK-IN"
  - button "NOTICE TO QUEUE"
  - button "PAUSE QUEUE"
  - text: WITH DOCTOR 0 IN CONSULTATION No patient inside consultation room NEXT IN QUEUE READY FOR ADMIT Queue is currently clear
  - button "Active Queue 0"
  - button "Completed 1"
  - button "Payments"
  - textbox "Search patient name, token or phone number..."
  - text: No patients currently waiting in queue Patients scanning the OPD QR code or added via Manual Check-in will appear here in real time.
- text: TokenPE QA Clinic 6725168822
- button
- text: NAVIGATION
- button "Live Queue"
- button "Manual Check-in"
- button "Notice to Queue"
- button "OPD QR Poster"
- button "Payments Ledger"
- button "Completed Consultations"
- text: MANAGEMENT
- button "Appointments & Analytics"
- button "Doctors & Patients"
- button "Settings & Billing"
- button "Logout"
- alert
- text: 🍪
- paragraph:
  - text: We use essential cookies for secure login & preferences. No ads or tracking.
  - link "Privacy Policy":
    - /url: /privacy
- button "Got it"
```

# Test source

```ts
  355 |       await seedLocalStorage(page, json.clinic)
  356 |       await page.goto('/dashboard/analytics')
  357 |       await page.waitForLoadState('domcontentloaded')
  358 |       await page.waitForTimeout(4000)
  359 |       const currentURL = page.url()
  360 |       expect(!currentURL.includes('/login'), `Analytics redirected to login: ${currentURL}`).toBeTruthy()
  361 |       const visible = await page.getByText(/Analytics|Patients|Total|Reports|Peak Hours|Avg Wait|OPD/i).first().isVisible({ timeout: 10000 }).catch(() => false)
  362 |       expect(visible, 'Analytics page content not visible within 10s').toBeTruthy()
  363 |       expect(failedApiCalls, `5xx on Analytics: ${failedApiCalls.join('\n')}`).toHaveLength(0)
  364 |       const hardErrors = consoleErrors.filter(e => !e.includes('Warning:') && !e.includes('hydration'))
  365 |       expect(hardErrors, `Hard console errors on Analytics: ${hardErrors.join('\n')}`).toHaveLength(0)
  366 |       await context.close()
  367 |     })
  368 | 
  369 |     test(`[${label}] Logout clears session and redirects to login`, async ({ browser, request, baseURL }) => {
  370 |       const suffix = qaSuffix()
  371 |       const { clinic } = await registerClinic(request, suffix)
  372 |       const { json, sessionCookie } = await loginClinic(request, clinic)
  373 |       const context = await contextWithSession(browser, baseURL, sessionCookie, viewportWidth)
  374 |       const page = await context.newPage()
  375 |       const consoleErrors = []
  376 |       page.on('pageerror', err => consoleErrors.push(err.message))
  377 |       await page.goto('/')
  378 |       await seedLocalStorage(page, json.clinic)
  379 |       await page.goto('/dashboard')
  380 |       await page.waitForFunction(
  381 |         () => !document.querySelector('.spinner-ring'),
  382 |         { timeout: 15000 }
  383 |       ).catch(() => {})
  384 |       await expect(page.getByText(/LIVE QUEUE CONTROL/i).first()).toBeVisible({ timeout: 12000 })
  385 | 
  386 |       if (viewportWidth < 768) {
  387 |         const hamburger = page.locator('.hamburger-btn, button[title="Open Navigation Menu"]').first()
  388 |         if (await hamburger.isVisible({ timeout: 3000 }).catch(() => false)) {
  389 |           await hamburger.click()
  390 |           await page.waitForTimeout(400)
  391 |           await page.locator('button:has-text("Logout")').last().click()
  392 |         } else {
  393 |           await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }))
  394 |           await page.goto('/login')
  395 |         }
  396 |       } else {
  397 |         const logoutBtn = page.locator('button:has-text("Exit Console"), button:has-text("Logout")').first()
  398 |         await logoutBtn.click()
  399 |         const confirmBtn = page.locator('button:has-text("Yes, Logout")').first()
  400 |         if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  401 |           await confirmBtn.click()
  402 |         }
  403 |       }
  404 | 
  405 |       await page.waitForTimeout(4000)
  406 |       const meResp = await page.request.get('/api/business-auth/me')
  407 |       const meJson = await meResp.json().catch(() => ({}))
  408 |       expect(meJson.authenticated, 'Session still valid after logout').toBeFalsy()
  409 |       expect(consoleErrors, `Console errors during logout: ${consoleErrors.join('\n')}`).toHaveLength(0)
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
> 455 |         ).toBeVisible({ timeout: 3000 })
      |           ^ Error: expect(locator).toBeVisible() failed
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
  510 |     const authedReq = await request.newContext({
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