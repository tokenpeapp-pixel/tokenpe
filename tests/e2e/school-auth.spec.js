import { expect, test } from '@playwright/test'

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

async function registerBusiness(request, payload) {
  const response = await request.post('/api/business-auth/register', {
    data: payload,
  })
  const json = await response.json().catch(() => ({}))
  expect(response.ok(), JSON.stringify(json)).toBeTruthy()
  expect(json.success).toBe(true)
  expect(json.clinic?.type).toBe(payload.vertical)
  expect(json.clinic?.pin).toBeUndefined()
  return { response, json, sessionCookie: sessionCookieFrom(response) }
}

async function loginBusiness(request, payload) {
  const response = await request.post('/api/business-auth/login', {
    data: payload,
  })
  const json = await response.json().catch(() => ({}))
  expect(response.ok(), JSON.stringify(json)).toBeTruthy()
  expect(json.success).toBe(true)
  expect(json.clinic?.pin).toBeUndefined()
  const sessionCookie = sessionCookieFrom(response)
  expect(sessionCookie).toBeTruthy()
  return { response, json, sessionCookie }
}

async function contextWithSession(browser, baseURL, sessionCookie) {
  const context = await browser.newContext()
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

test.describe('school auth isolation', () => {
  test('new school can register, login, and open dashboard', async ({ browser, request, baseURL }) => {
    const suffix = qaSuffix()
    const school = {
      name: `QA School ${suffix}`,
      phone: makePhone('98', suffix),
      email: `qa.school.${suffix}@example.com`,
      pin: '2468',
      specialty: 'School',
      city: 'Mumbai',
      lat: 19.076,
      lng: 72.8777,
      vertical: 'school',
    }

    await registerBusiness(request, school)
    const login = await loginBusiness(request, {
      email: school.email,
      phone: school.phone,
      pin: school.pin,
      vertical: 'school',
    })

    const context = await contextWithSession(browser, baseURL, login.sessionCookie)
    const page = await context.newPage()
    await page.goto('/school-dashboard')

    await expect(page).toHaveURL(/\/school-dashboard/)
    await expect(page.locator('body')).toContainText(/ARRIVALS|COMPLETED TODAY|Digital Gate/i)

    await context.close()
  })

  test('fresh incognito school dashboard redirects to school login', async ({ page }) => {
    await page.goto('/school-dashboard')

    await expect(page).toHaveURL(/\/school-login/)
    await expect(page.locator('body')).not.toContainText('Ashbourne Academy')
    await expect(page.locator('body')).not.toContainText('COMPLETED TODAY')
  })

  test('clinic session cannot hydrate or open school dashboard', async ({ browser, request, baseURL }) => {
    const suffix = qaSuffix()
    const clinic = {
      name: `QA Clinic ${suffix}`,
      phone: makePhone('97', suffix),
      email: `qa.clinic.${suffix}@example.com`,
      pin: '1357',
      specialty: 'General Physician',
      city: 'Mumbai',
      lat: 19.076,
      lng: 72.8777,
      vertical: 'clinic',
    }

    await registerBusiness(request, clinic)
    const login = await loginBusiness(request, {
      email: clinic.email,
      phone: clinic.phone,
      pin: clinic.pin,
      vertical: 'clinic',
    })

    const guarded = await request.get('/api/business-auth/me?vertical=school', {
      headers: {
        cookie: `tokenpe_unified_session=${login.sessionCookie}`,
      },
    })
    const guardedJson = await guarded.json().catch(() => ({}))
    expect(guarded.status()).toBe(401)
    expect(guardedJson.reason).toBe('vertical_mismatch')

    const context = await contextWithSession(browser, baseURL, login.sessionCookie)
    const page = await context.newPage()

    await page.goto('/')
    await page.evaluate((clinicData) => {
      localStorage.setItem('tokenpe_clinic', JSON.stringify(clinicData))
      localStorage.setItem('tokenpe_business', JSON.stringify(clinicData))
      localStorage.setItem('tokenpe_vertical', 'clinic')
    }, login.json.clinic)

    await page.goto('/school-login')
    await page.waitForTimeout(2500)

    await expect(page).toHaveURL(/\/school-login/)
    await expect(page.locator('body')).not.toContainText(clinic.name)

    const schoolStorage = await page.evaluate(() => localStorage.getItem('tokenpe_school_business'))
    expect(schoolStorage).toBeNull()

    await context.close()
  })
})
