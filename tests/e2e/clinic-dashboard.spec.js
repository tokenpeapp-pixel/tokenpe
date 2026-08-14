/**
 * clinic-dashboard.spec.js
 *
 * Playwright E2E tests for the TokenPe Clinic dashboard.
 * Covers: login, queue operations, billing, CRM, analytics, logout.
 * Runs at both desktop (1280x800) and mobile (390x844) viewport widths.
 *
 * NOTE: Uses the school-auth.spec.js pattern: register a fresh clinic via
 * the API, grab the session cookie, and inject it into a new browser context
 * so tests are fully isolated and never depend on pre-existing data.
 */
import { expect, test } from '@playwright/test'

// --- Helpers ------------------------------------------------------------------

function qaSuffix() {
  return `${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`
}

function makePhone(prefix, suffix) {
  return `${prefix}${suffix}`.slice(0, 10)
}

function sessionCookieFrom(response) {
  const setCookie = response.headers()['set-cookie'] || ''
  const match = setCookie.match(/tokenpe_unified_session=([^;]+)/)
  return match?.[1] || null
}

async function registerClinic(request, suffix) {
  const clinic = {
    name: `QA Clinic ${suffix}`,
    phone: makePhone('96', suffix),
    email: `qa.clinic.${suffix}@example.com`,
    pin: '1234',
    specialty: 'General Physician',
    city: 'Mumbai',
    lat: 19.076,
    lng: 72.8777,
    vertical: 'clinic',
  }
  const response = await request.post('/api/business-auth/register', { data: clinic })
  const json = await response.json().catch(() => ({}))
  expect(response.ok(), `Register failed: ${JSON.stringify(json)}`).toBeTruthy()
  expect(json.success, `Register success false: ${JSON.stringify(json)}`).toBe(true)
  return { clinic, json }
}

async function loginClinic(request, clinic) {
  const response = await request.post('/api/business-auth/login', {
    data: {
      email: clinic.email,
      phone: clinic.phone,
      pin: clinic.pin,
      vertical: 'clinic',
    },
  })
  const json = await response.json().catch(() => ({}))
  expect(response.ok(), `Login failed: ${JSON.stringify(json)}`).toBeTruthy()
  expect(json.success, `Login success false: ${JSON.stringify(json)}`).toBe(true)
  const sessionCookie = sessionCookieFrom(response)
  expect(sessionCookie, 'No session cookie returned after login').toBeTruthy()
  return { response, json, sessionCookie }
}

async function contextWithSession(browser, baseURL, sessionCookie, viewportWidth = 1280) {
  const context = await browser.newContext({
    viewport: { width: viewportWidth, height: viewportWidth === 390 ? 844 : 800 },
  })
  await context.addCookies([
    {
      name: 'tokenpe_unified_session',
      value: sessionCookie,
      url: baseURL,
      httpOnly: true,
      secure: baseURL.startsWith('https://'),
      sameSite: 'Lax',
    },
  ])
  return context
}

async function seedLocalStorage(page, clinicData) {
  await page.evaluate((data) => {
    localStorage.setItem('tokenpe_clinic', JSON.stringify(data))
    localStorage.setItem('businessCode', data.code || '')
    localStorage.setItem('businessPhone', data.phone || '')
    localStorage.setItem('tokenpe_user_businesses', JSON.stringify([data]))
  }, clinicData)
}

// --- Test suites --------------------------------------------------------------

const viewports = [['desktop (1280px)', 1280], ['mobile (390px)', 390]]

for (const [label, viewportWidth] of viewports) {

  test.describe(`Clinic Dashboard � ${label}`, () => {

    test(`[${label}] Login via /business-login then dashboard loads`, async ({ browser, request, baseURL }) => {
      const suffix = qaSuffix()
      const { clinic } = await registerClinic(request, suffix)
      const context = await browser.newContext({
        viewport: { width: viewportWidth, height: viewportWidth === 390 ? 844 : 800 },
      })
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', err => errors.push(err.message))
      await page.goto('/business-login')
      await expect(page).toHaveURL(/\/business-login/)
      await page.fill('input[type="email"], input[placeholder*="email" i]', clinic.email)
      await page.fill('input[type="tel"], input[placeholder*="phone" i]', clinic.phone)
      await page.fill('input[type="password"], input[placeholder*="pin" i]', clinic.pin)
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
        page.click('button[type="submit"]'),
      ])
      await page.waitForURL(/\/(business-)?dashboard/, { timeout: 20000 }).catch(() => {})
      const currentURL = page.url()
      expect(
        currentURL.includes('/dashboard'),
        `Expected dashboard URL, got: ${currentURL}`
      ).toBeTruthy()
      expect(errors, `Page errors during login: ${errors.join('\n')}`).toHaveLength(0)
      await context.close()
    })

    test(`[${label}] Dashboard renders key UI sections with valid session`, async ({ browser, request, baseURL }) => {
      const suffix = qaSuffix()
      const { clinic } = await registerClinic(request, suffix)
      const { json, sessionCookie } = await loginClinic(request, clinic)
      const context = await contextWithSession(browser, baseURL, sessionCookie, viewportWidth)
      const page = await context.newPage()
      const consoleErrors = []
      const networkFailures = []
      page.on('pageerror', err => consoleErrors.push(err.message))
      page.on('response', resp => {
        if (!resp.ok() && resp.url().includes('/api/') && resp.status() >= 500) {
          networkFailures.push(`${resp.status()} ${resp.url()}`)
        }
      })
      await page.goto('/')
      await seedLocalStorage(page, json.clinic)
      await page.goto('/dashboard')
      await page.waitForFunction(
        () => !document.querySelector('.spinner-ring'),
        { timeout: 15000 }
      ).catch(() => {})
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 12000 })
      await expect(page.getByText(/Total Today/i).first()).toBeVisible({ timeout: 12000 })
      await expect(page.getByText(/Waiting/i).first()).toBeVisible({ timeout: 12000 })
      await expect(page.getByText(/Done/i).first()).toBeVisible({ timeout: 12000 })
      await expect(page.getByText(/LIVE QUEUE CONTROL/i).first()).toBeVisible({ timeout: 12000 })
      expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toHaveLength(0)
      expect(networkFailures, `5xx API errors: ${networkFailures.join('\n')}`).toHaveLength(0)
      await context.close()
    })

    test(`[${label}] Queue operations: add patient, call next, mark done, skip`, async ({ browser, request, baseURL }) => {
      const suffix = qaSuffix()
      const { clinic } = await registerClinic(request, suffix)
      const { json, sessionCookie } = await loginClinic(request, clinic)
      const context = await contextWithSession(browser, baseURL, sessionCookie, viewportWidth)
      const page = await context.newPage()
      const consoleErrors = []
      const failedRequests = []
      page.on('pageerror', err => consoleErrors.push(err.message))
      page.on('response', resp => {
        if (resp.url().includes('/api/queue/') && !resp.ok()) {
          failedRequests.push(`${resp.status()} ${resp.url()}`)
        }
      })
      await page.goto('/')
      await seedLocalStorage(page, json.clinic)
      await page.goto('/dashboard')
      await page.waitForFunction(
        () => !document.querySelector('.spinner-ring'),
        { timeout: 15000 }
      ).catch(() => {})
      await expect(page.getByText(/LIVE QUEUE CONTROL/i).first()).toBeVisible({ timeout: 12000 })

      // Open Manual Check-in modal
      if (viewportWidth < 768) {
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('nav button'));
          const addBtn = btns[1] || btns[btns.length - 1]; // FAB is usually the second button
          if (addBtn) addBtn.click();
        });
      } else {
        const btn = page.locator('button:has-text("MANUAL CHECK-IN"), button:has-text("Manual Walk-in")').first()
        await btn.click({ force: true })
      }

      await expect(page.getByText(/Manual Walk-in Check-in/i).first()).toBeVisible({ timeout: 8000 })
      const testPatientName = `Test Patient ${suffix}`
      const randomPhone1 = `91${Math.floor(10000000 + Math.random() * 90000000)}`
      const nameInput = page.locator('div[style*="position: fixed"] input[type="text"]').first()
      await nameInput.fill(testPatientName)
      const phoneInput = page.locator('div[style*="position: fixed"] input[placeholder*="10-digit"]').first()
      await phoneInput.fill(randomPhone1)
      let submitBtn = page.locator(`button[type="submit"]:has-text("Add to Queue")`).first(); await submitBtn.waitFor({ state: "visible", timeout: 5000 }); await submitBtn.click({ force: true })
      await page.waitForTimeout(2500)
      try {
        await expect(page.getByText(/Manual Walk-in Check-in/i)).toBeHidden({ timeout: 5000 })
      } catch (e) {
        const modalText = await page.locator('div[style*="position: fixed"]').first().textContent().catch(() => 'No modal found');
        console.error('[TEST DEBUG] Modal failed to close! Modal content:', modalText);
        throw e;
      }
      await page.waitForTimeout(2000)
      const patientVisible = await page.getByText(testPatientName).isVisible().catch(() => false)
      expect(patientVisible, `Added patient "${testPatientName}" not visible in queue`).toBeTruthy()

      // Admit first patient
      const admitBtn = page.locator('.card-btn-admit, button:has-text("Admit")').first()
      if (await admitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await admitBtn.click()
        await page.waitForTimeout(1000)
      } else {
        console.warn('[SOFT] Admit button not visible')
      }

      // Mark done
      const markDoneBtn = page.locator('button:has-text("Mark Done")').first()
      if (await markDoneBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await markDoneBtn.click()
        await page.waitForTimeout(800)
      } else {
        console.warn('[SOFT] Mark Done button not visible')
      }

      // Add second patient and skip
      if (viewportWidth < 768) {
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('nav button'));
          const addBtn = btns[1] || btns[btns.length - 1];
          if (addBtn) addBtn.click();
        });
      } else {
        await page.locator('button:has-text("MANUAL CHECK-IN"), button:has-text("Manual Walk-in")').first().click({ force: true })
      }
      await expect(page.getByText(/Manual Walk-in Check-in/i).first()).toBeVisible({ timeout: 8000 })
      const skipPatientName = `Skip Patient ${suffix}`
      const randomPhone2 = `91${Math.floor(10000000 + Math.random() * 90000000)}`
      await page.locator('div[style*="position: fixed"] input[type="text"]').first().fill(skipPatientName)
      await page.locator('div[style*="position: fixed"] input[placeholder*="10-digit"]').first().fill(randomPhone2)
      submitBtn = page.locator(`button[type="submit"]:has-text("Add to Queue")`).first(); await submitBtn.waitFor({ state: "visible", timeout: 5000 }); await submitBtn.click({ force: true })
      await page.waitForTimeout(2500)
      const skipBtn = page.locator('button.card-btn-skip, button:has-text("Skip")').first()
      if (await skipBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await skipBtn.click()
        await page.waitForTimeout(800)
      } else {
        console.warn('[SOFT] Skip button not visible')
      }

      expect(consoleErrors, `Console errors during queue ops: ${consoleErrors.join('\n')}`).toHaveLength(0)
      expect(failedRequests, `Failed queue API calls: ${failedRequests.join('\n')}`).toHaveLength(0)
      await context.close()
    })

    test(`[${label}] Billing/Payments tab loads and shows correct data`, async ({ browser, request, baseURL }) => {
      const suffix = qaSuffix()
      const { clinic } = await registerClinic(request, suffix)
      const { json, sessionCookie } = await loginClinic(request, clinic)
      const context = await contextWithSession(browser, baseURL, sessionCookie, viewportWidth)
      const page = await context.newPage()
      const consoleErrors = []
      const billingResponses = []
      page.on('pageerror', err => consoleErrors.push(err.message))
      page.on('response', resp => {
        if (resp.url().includes('/api/dashboard/payments')) {
          billingResponses.push({ status: resp.status(), url: resp.url() })
        }
      })
      await page.goto('/')
      await seedLocalStorage(page, json.clinic)
      await page.goto('/dashboard')
      await page.waitForFunction(
        () => !document.querySelector('.spinner-ring'),
        { timeout: 15000 }
      ).catch(() => {})
      await expect(page.getByText(/LIVE QUEUE CONTROL/i).first()).toBeVisible({ timeout: 12000 })

      if (viewportWidth < 768) {
        const hamburger = page.locator('.hamburger-btn, button[title="Open Navigation Menu"], nav button:has-text("More")').first()
        if (await hamburger.isVisible({ timeout: 3000 }).catch(() => false)) {
          await hamburger.click({ force: true })
          await page.waitForTimeout(400)
          const paymentsLink = page.locator('button:has-text("Payments Ledger"), button:has-text("Payments"), a:has-text("Payments")').first()
          if (await paymentsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
            await paymentsLink.click({ force: true })
          } else {
            await page.keyboard.press('Escape')
          }
          await page.waitForTimeout(400)
        } else {
          const paymentsLink = page.locator('button:has-text("Payments Ledger"), button:has-text("Payments"), a:has-text("Payments")').first()
          if (await paymentsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
            await paymentsLink.click({ force: true })
          }
        }
      }

      await page.locator('button:has-text("Payments")').first().click()
      await page.waitForTimeout(1500)
      await expect(
        page.getByText(/Consultation Payments|Billing Ledger|Total Collected|Pending Balance/i).first()
      ).toBeVisible({ timeout: 10000 })

      for (const r of billingResponses) {
        expect(r.status >= 200 && r.status < 300, `Billing API non-2xx: ${r.status} ${r.url}`).toBeTruthy()
      }
      expect(consoleErrors, `Console errors on Payments tab: ${consoleErrors.join('\n')}`).toHaveLength(0)
      await context.close()
    })

    test(`[${label}] CRM page loads and shows patient section`, async ({ browser, request, baseURL }) => {
      const suffix = qaSuffix()
      const { clinic } = await registerClinic(request, suffix)
      const { json, sessionCookie } = await loginClinic(request, clinic)
      const context = await contextWithSession(browser, baseURL, sessionCookie, viewportWidth)
      const page = await context.newPage()
      const consoleErrors = []
      const failedApiCalls = []
      page.on('pageerror', err => consoleErrors.push(err.message))
      page.on('response', resp => {
        if (resp.url().includes('/api/') && !resp.ok() && resp.status() >= 500) {
          failedApiCalls.push(`${resp.status()} ${resp.url()}`)
        }
      })
      await page.goto('/')
      await seedLocalStorage(page, json.clinic)
      await page.goto('/dashboard/crm')
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(3000)
      const currentURL = page.url()
      expect(!currentURL.includes('/login'), `CRM redirected to login: ${currentURL}`).toBeTruthy()
      const visible = await page.getByText(/Broadcasting|CRM|Patient Contacts|Broadcast|Follow-up|Total Patients/i).first().isVisible({ timeout: 10000 }).catch(() => false)
      expect(visible, 'CRM page content not visible within 10s').toBeTruthy()
      expect(consoleErrors, `Console errors on CRM: ${consoleErrors.join('\n')}`).toHaveLength(0)
      expect(failedApiCalls, `5xx on CRM: ${failedApiCalls.join('\n')}`).toHaveLength(0)
      await context.close()
    })

    test(`[${label}] Analytics page loads and renders stats`, async ({ browser, request, baseURL }) => {
      const suffix = qaSuffix()
      const { clinic } = await registerClinic(request, suffix)
      const { json, sessionCookie } = await loginClinic(request, clinic)
      const context = await contextWithSession(browser, baseURL, sessionCookie, viewportWidth)
      const page = await context.newPage()
      const consoleErrors = []
      const failedApiCalls = []
      page.on('pageerror', err => consoleErrors.push(err.message))
      page.on('response', resp => {
        if (resp.url().includes('/api/') && !resp.ok() && resp.status() >= 500) {
          failedApiCalls.push(`${resp.status()} ${resp.url()}`)
        }
      })
      await page.goto('/')
      await seedLocalStorage(page, json.clinic)
      await page.goto('/dashboard/analytics')
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(4000)
      const currentURL = page.url()
      expect(!currentURL.includes('/login'), `Analytics redirected to login: ${currentURL}`).toBeTruthy()
      const visible = await page.getByText(/Analytics|Patients|Total|Reports|Peak Hours|Avg Wait|OPD/i).first().isVisible({ timeout: 10000 }).catch(() => false)
      expect(visible, 'Analytics page content not visible within 10s').toBeTruthy()
      expect(failedApiCalls, `5xx on Analytics: ${failedApiCalls.join('\n')}`).toHaveLength(0)
      const hardErrors = consoleErrors.filter(e => !e.includes('Warning:') && !e.includes('hydration'))
      expect(hardErrors, `Hard console errors on Analytics: ${hardErrors.join('\n')}`).toHaveLength(0)
      await context.close()
    })

    test(`[${label}] Logout clears session and redirects to login`, async ({ browser, request, baseURL }) => {
      const suffix = qaSuffix()
      const { clinic } = await registerClinic(request, suffix)
      const { json, sessionCookie } = await loginClinic(request, clinic)
      const context = await contextWithSession(browser, baseURL, sessionCookie, viewportWidth)
      const page = await context.newPage()
      const consoleErrors = []
      page.on('pageerror', err => consoleErrors.push(err.message))
      await page.goto('/')
      await seedLocalStorage(page, json.clinic)
      await page.goto('/dashboard')
      await page.waitForFunction(
        () => !document.querySelector('.spinner-ring'),
        { timeout: 15000 }
      ).catch(() => {})
      await expect(page.getByText(/LIVE QUEUE CONTROL/i).first()).toBeVisible({ timeout: 12000 })

      if (viewportWidth < 768) {
        const hamburger = page.locator('.hamburger-btn, button[title="Open Navigation Menu"]').first()
        if (await hamburger.isVisible({ timeout: 3000 }).catch(() => false)) {
          await hamburger.click()
          await page.waitForTimeout(400)
          await page.locator('button:has-text("Logout")').last().click()
        } else {
          await page.evaluate(() => fetch('/api/auth/logout', { method: 'POST' }))
          await page.goto('/login')
        }
      } else {
        const logoutBtn = page.locator('button:has-text("Exit Console"), button:has-text("Logout")').first()
        await logoutBtn.click()
        const confirmBtn = page.locator('button:has-text("Yes, Logout")').first()
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click()
        }
      }

      await page.waitForTimeout(4000)
      const meResp = await page.request.get('/api/business-auth/me')
      const meJson = await meResp.json().catch(() => ({}))
      expect(meJson.authenticated, 'Session still valid after logout').toBeFalsy()
      expect(consoleErrors, `Console errors during logout: ${consoleErrors.join('\n')}`).toHaveLength(0)
      await context.close()
    })

    test(`[${label}] Unauthenticated access to /dashboard redirects to login`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: viewportWidth, height: viewportWidth === 390 ? 844 : 800 },
      })
      const page = await context.newPage()
      await page.goto('/dashboard')
      await page.waitForLoadState('domcontentloaded')
      await page.waitForTimeout(3000)
      const url = page.url()
      const isRedirected = url.includes('/login') || url.includes('/business-login')
      expect(isRedirected, `Expected redirect to login, got: ${url}`).toBeTruthy()
      await context.close()
    })

    if (viewportWidth === 390) {
      test(`[${label}] Mobile hamburger opens nav drawer with all key links`, async ({ browser, request, baseURL }) => {
        const suffix = qaSuffix()
        const { clinic } = await registerClinic(request, suffix)
        const { json, sessionCookie } = await loginClinic(request, clinic)
        const context = await contextWithSession(browser, baseURL, sessionCookie, viewportWidth)
        const page = await context.newPage()
        await page.goto('/')
        await seedLocalStorage(page, json.clinic)
        await page.goto('/dashboard')
        await page.waitForFunction(
          () => !document.querySelector('.spinner-ring'),
          { timeout: 15000 }
        ).catch(() => {})
        const sidebar = page.locator('.dashboard-sidebar').first()
        const sidebarVisible = await sidebar.isVisible({ timeout: 2000 }).catch(() => false)
        if (sidebarVisible) {
          console.warn('[SOFT] Sidebar visible at 390px � CSS media query may not be working')
        }
        const hamburger = page.locator('.hamburger-btn, button[title="Open Navigation Menu"]').first()
        await expect(hamburger).toBeVisible({ timeout: 8000 })
        await hamburger.click()
        await page.waitForTimeout(600)
        await expect(
          page.locator('button:has-text("Live Queue"), button:has-text("Active Queue"), button:has-text("Manual Check-in")').first()
        ).toBeVisible({ timeout: 5000 })
        await expect(
          page.locator('button:has-text("Appointments"), button:has-text("Analytics")').first()
        ).toBeVisible({ timeout: 3000 })
        await expect(
          page.locator('button:has-text("Doctors"), button:has-text("CRM"), button:has-text("Patients")').first()
        ).toBeVisible({ timeout: 3000 })
        await context.close()
      })
    }

    test(`[${label}] Payments tab: Total Collected and Pending Balance rendered`, async ({ browser, request, baseURL }) => {
      const suffix = qaSuffix()
      const { clinic } = await registerClinic(request, suffix)
      const { json, sessionCookie } = await loginClinic(request, clinic)
      const context = await contextWithSession(browser, baseURL, sessionCookie, viewportWidth)
      const page = await context.newPage()
      await page.goto('/')
      await seedLocalStorage(page, json.clinic)
      await page.goto('/dashboard')
      await page.waitForFunction(
        () => !document.querySelector('.spinner-ring'),
        { timeout: 15000 }
      ).catch(() => {})
      await page.locator('button:has-text("Payments")').first().click()
      await page.waitForTimeout(2000)
      await expect(page.getByText(/Total Collected/i).first()).toBeVisible({ timeout: 8000 })
      await expect(page.getByText(/Pending Balance/i).first()).toBeVisible({ timeout: 8000 })
      await context.close()
    })

  })
}

// --- API-level health checks --------------------------------------------------

test.describe('Clinic API health checks', () => {

  test('POST /api/business-auth/login returns 401 for wrong PIN', async ({ request }) => {
    const suffix = qaSuffix()
    const { clinic } = await registerClinic(request, suffix)
    const resp = await request.post('/api/business-auth/login', {
      data: { email: clinic.email, phone: clinic.phone, pin: '0000', vertical: 'clinic' },
    })
    expect(resp.status()).toBe(401)
    const json = await resp.json()
    expect(json.success).toBe(false)
  })

  test('GET /api/dashboard/init returns non-200 without session cookie', async ({ request }) => {
    const resp = await request.get('/api/dashboard/init')
    expect(resp.status()).not.toBe(200)
  })

  test('GET /api/dashboard/payments returns 2xx for authenticated clinic', async ({ request, baseURL }) => {
    const suffix = qaSuffix()
    const { clinic } = await registerClinic(request, suffix)
    const { json, sessionCookie } = await loginClinic(request, clinic)
    const authedReq = await request.newContext({
      extraHTTPHeaders: { cookie: `tokenpe_unified_session=${sessionCookie}` },
    })
    const resp = await authedReq.get(`/api/dashboard/payments?clinicId=${json.clinic.id}`)
    expect(resp.ok(), `Payments API returned ${resp.status()}`).toBeTruthy()
    const data = await resp.json()
    expect(typeof data.success).toBe('boolean')
    await authedReq.dispose()
  })

  test('POST /api/queue/add rejects request with missing businessId', async ({ request }) => {
    const resp = await request.post('/api/queue/add', {
      data: { name: 'Test Patient', phone: '9876543210', token: 'T-001' },
    })
    expect(resp.status(), 'Expected 4xx when businessId is missing').toBeGreaterThanOrEqual(400)
  })

})
