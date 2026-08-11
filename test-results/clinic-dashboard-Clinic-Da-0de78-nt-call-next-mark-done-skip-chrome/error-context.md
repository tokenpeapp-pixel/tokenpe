# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: clinic-dashboard.spec.js >> Clinic Dashboard � desktop (1280px) >> [desktop (1280px)] Queue operations: add patient, call next, mark done, skip
- Location: tests\e2e\clinic-dashboard.spec.js:159:9

# Error details

```
Error: expect(locator).toBeHidden() failed

Locator:  getByText(/Manual Walk-in Check-in/i)
Expected: hidden
Received: visible
Timeout:  8000ms

Call log:
  - Expect "toBeHidden" with timeout 8000ms
  - waiting for getByText(/Manual Walk-in Check-in/i)
    19 × locator resolved to <h3>Manual Walk-in Check-in</h3>
       - unexpected value "visible"

```

```yaml
- heading "Manual Walk-in Check-in" [level=3]
```

# Test source

```ts
  107 |       const errors = []
  108 |       page.on('pageerror', err => errors.push(err.message))
  109 |       await page.goto('/business-login')
  110 |       await expect(page).toHaveURL(/\/business-login/)
  111 |       await page.fill('input[type="email"], input[placeholder*="email" i]', clinic.email)
  112 |       await page.fill('input[type="tel"], input[placeholder*="phone" i]', clinic.phone)
  113 |       await page.fill('input[type="password"], input[placeholder*="pin" i]', clinic.pin)
  114 |       await Promise.all([
  115 |         page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
  116 |         page.click('button[type="submit"]'),
  117 |       ])
  118 |       await page.waitForURL(/\/(business-)?dashboard/, { timeout: 20000 }).catch(() => {})
  119 |       const currentURL = page.url()
  120 |       expect(
  121 |         currentURL.includes('/dashboard'),
  122 |         `Expected dashboard URL, got: ${currentURL}`
  123 |       ).toBeTruthy()
  124 |       expect(errors, `Page errors during login: ${errors.join('\n')}`).toHaveLength(0)
  125 |       await context.close()
  126 |     })
  127 | 
  128 |     test(`[${label}] Dashboard renders key UI sections with valid session`, async ({ browser, request, baseURL }) => {
  129 |       const suffix = qaSuffix()
  130 |       const { clinic } = await registerClinic(request, suffix)
  131 |       const { json, sessionCookie } = await loginClinic(request, clinic)
  132 |       const context = await contextWithSession(browser, baseURL, sessionCookie, viewportWidth)
  133 |       const page = await context.newPage()
  134 |       const consoleErrors = []
  135 |       const networkFailures = []
  136 |       page.on('pageerror', err => consoleErrors.push(err.message))
  137 |       page.on('response', resp => {
  138 |         if (!resp.ok() && resp.url().includes('/api/') && resp.status() >= 500) {
  139 |           networkFailures.push(`${resp.status()} ${resp.url()}`)
  140 |         }
  141 |       })
  142 |       await page.goto('/')
  143 |       await seedLocalStorage(page, json.clinic)
  144 |       await page.goto('/dashboard')
  145 |       await page.waitForFunction(
  146 |         () => !document.querySelector('.spinner-ring'),
  147 |         { timeout: 15000 }
  148 |       ).catch(() => {})
  149 |       await expect(page.locator('h1').first()).toBeVisible({ timeout: 12000 })
  150 |       await expect(page.getByText(/Total Today/i).first()).toBeVisible({ timeout: 12000 })
  151 |       await expect(page.getByText(/Waiting/i).first()).toBeVisible({ timeout: 12000 })
  152 |       await expect(page.getByText(/Done/i).first()).toBeVisible({ timeout: 12000 })
  153 |       await expect(page.getByText(/LIVE QUEUE CONTROL/i).first()).toBeVisible({ timeout: 12000 })
  154 |       expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toHaveLength(0)
  155 |       expect(networkFailures, `5xx API errors: ${networkFailures.join('\n')}`).toHaveLength(0)
  156 |       await context.close()
  157 |     })
  158 | 
  159 |     test(`[${label}] Queue operations: add patient, call next, mark done, skip`, async ({ browser, request, baseURL }) => {
  160 |       const suffix = qaSuffix()
  161 |       const { clinic } = await registerClinic(request, suffix)
  162 |       const { json, sessionCookie } = await loginClinic(request, clinic)
  163 |       const context = await contextWithSession(browser, baseURL, sessionCookie, viewportWidth)
  164 |       const page = await context.newPage()
  165 |       const consoleErrors = []
  166 |       const failedRequests = []
  167 |       page.on('pageerror', err => consoleErrors.push(err.message))
  168 |       page.on('response', resp => {
  169 |         if (resp.url().includes('/api/queue/') && !resp.ok()) {
  170 |           failedRequests.push(`${resp.status()} ${resp.url()}`)
  171 |         }
  172 |       })
  173 |       await page.goto('/')
  174 |       await seedLocalStorage(page, json.clinic)
  175 |       await page.goto('/dashboard')
  176 |       await page.waitForFunction(
  177 |         () => !document.querySelector('.spinner-ring'),
  178 |         { timeout: 15000 }
  179 |       ).catch(() => {})
  180 |       await expect(page.getByText(/LIVE QUEUE CONTROL/i).first()).toBeVisible({ timeout: 12000 })
  181 | 
  182 |       // Open Manual Check-in modal
  183 |       if (viewportWidth < 768) {
  184 |         const hamburger = page.locator('.hamburger-btn, button[title="Open Navigation Menu"]').first()
  185 |         if (await hamburger.isVisible({ timeout: 3000 }).catch(() => false)) {
  186 |           await hamburger.click()
  187 |           await page.waitForTimeout(500)
  188 |           const menuBtn = page.locator('button:has-text("Manual Check-in")').first()
  189 |           if (await menuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
  190 |             await menuBtn.click()
  191 |           }
  192 |           await page.waitForTimeout(400)
  193 |         }
  194 |       } else {
  195 |         const btn = page.locator('button:has-text("MANUAL CHECK-IN"), button:has-text("Manual Walk-in")').first()
  196 |         await btn.click()
  197 |       }
  198 | 
  199 |       await expect(page.getByText(/Manual Walk-in Check-in/i).first()).toBeVisible({ timeout: 8000 })
  200 |       const testPatientName = `Test Patient ${suffix}`
  201 |       const nameInput = page.locator('input[placeholder*="Arush"], input[placeholder*="Patient"], input[placeholder*="name" i]').first()
  202 |       await nameInput.fill(testPatientName)
  203 |       const phoneInput = page.locator('input[placeholder*="10-digit"], input[placeholder*="mobile"]').first()
  204 |       await phoneInput.fill('9876543210')
  205 |       await page.click('button:has-text("Add to Queue")')
  206 |       await page.waitForTimeout(2500)
> 207 |       await expect(page.getByText(/Manual Walk-in Check-in/i)).toBeHidden({ timeout: 8000 })
      |                                                                ^ Error: expect(locator).toBeHidden() failed
  208 |       await page.waitForTimeout(2000)
  209 |       const patientVisible = await page.getByText(testPatientName).isVisible().catch(() => false)
  210 |       expect(patientVisible, `Added patient "${testPatientName}" not visible in queue`).toBeTruthy()
  211 | 
  212 |       // Admit first patient
  213 |       const admitBtn = page.locator('.card-btn-admit, button:has-text("Admit")').first()
  214 |       if (await admitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  215 |         await admitBtn.click()
  216 |         await page.waitForTimeout(1000)
  217 |       } else {
  218 |         console.warn('[SOFT] Admit button not visible')
  219 |       }
  220 | 
  221 |       // Mark done
  222 |       const markDoneBtn = page.locator('button:has-text("Mark Done")').first()
  223 |       if (await markDoneBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  224 |         await markDoneBtn.click()
  225 |         await page.waitForTimeout(800)
  226 |       } else {
  227 |         console.warn('[SOFT] Mark Done button not visible')
  228 |       }
  229 | 
  230 |       // Add second patient and skip
  231 |       if (viewportWidth < 768) {
  232 |         const hamburger = page.locator('.hamburger-btn, button[title="Open Navigation Menu"]').first()
  233 |         if (await hamburger.isVisible({ timeout: 3000 }).catch(() => false)) {
  234 |           await hamburger.click()
  235 |           await page.waitForTimeout(400)
  236 |           await page.locator('button:has-text("Manual Check-in")').first().click()
  237 |           await page.waitForTimeout(400)
  238 |         }
  239 |       } else {
  240 |         await page.locator('button:has-text("MANUAL CHECK-IN"), button:has-text("Manual Walk-in")').first().click()
  241 |       }
  242 |       await expect(page.getByText(/Manual Walk-in Check-in/i).first()).toBeVisible({ timeout: 8000 })
  243 |       const skipPatientName = `Skip Patient ${suffix}`
  244 |       await page.locator('input[placeholder*="Arush"], input[placeholder*="Patient"], input[placeholder*="name" i]').first().fill(skipPatientName)
  245 |       await page.locator('input[placeholder*="10-digit"], input[placeholder*="mobile"]').first().fill('9123456789')
  246 |       await page.click('button:has-text("Add to Queue")')
  247 |       await page.waitForTimeout(2500)
  248 |       const skipBtn = page.locator('button.card-btn-skip, button:has-text("Skip")').first()
  249 |       if (await skipBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
  250 |         await skipBtn.click()
  251 |         await page.waitForTimeout(800)
  252 |       } else {
  253 |         console.warn('[SOFT] Skip button not visible')
  254 |       }
  255 | 
  256 |       expect(consoleErrors, `Console errors during queue ops: ${consoleErrors.join('\n')}`).toHaveLength(0)
  257 |       expect(failedRequests, `Failed queue API calls: ${failedRequests.join('\n')}`).toHaveLength(0)
  258 |       await context.close()
  259 |     })
  260 | 
  261 |     test(`[${label}] Billing/Payments tab loads and shows correct data`, async ({ browser, request, baseURL }) => {
  262 |       const suffix = qaSuffix()
  263 |       const { clinic } = await registerClinic(request, suffix)
  264 |       const { json, sessionCookie } = await loginClinic(request, clinic)
  265 |       const context = await contextWithSession(browser, baseURL, sessionCookie, viewportWidth)
  266 |       const page = await context.newPage()
  267 |       const consoleErrors = []
  268 |       const billingResponses = []
  269 |       page.on('pageerror', err => consoleErrors.push(err.message))
  270 |       page.on('response', resp => {
  271 |         if (resp.url().includes('/api/dashboard/payments')) {
  272 |           billingResponses.push({ status: resp.status(), url: resp.url() })
  273 |         }
  274 |       })
  275 |       await page.goto('/')
  276 |       await seedLocalStorage(page, json.clinic)
  277 |       await page.goto('/dashboard')
  278 |       await page.waitForFunction(
  279 |         () => !document.querySelector('.spinner-ring'),
  280 |         { timeout: 15000 }
  281 |       ).catch(() => {})
  282 |       await expect(page.getByText(/LIVE QUEUE CONTROL/i).first()).toBeVisible({ timeout: 12000 })
  283 | 
  284 |       if (viewportWidth < 768) {
  285 |         const hamburger = page.locator('.hamburger-btn, button[title="Open Navigation Menu"]').first()
  286 |         if (await hamburger.isVisible({ timeout: 3000 }).catch(() => false)) {
  287 |           await hamburger.click()
  288 |           await page.waitForTimeout(400)
  289 |           const paymentsLink = page.locator('button:has-text("Payments Ledger"), button:has-text("Payments")').first()
  290 |           if (await paymentsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
  291 |             await paymentsLink.click()
  292 |           } else {
  293 |             await page.keyboard.press('Escape')
  294 |           }
  295 |           await page.waitForTimeout(400)
  296 |         }
  297 |       }
  298 | 
  299 |       await page.locator('button:has-text("Payments")').first().click()
  300 |       await page.waitForTimeout(1500)
  301 |       await expect(
  302 |         page.getByText(/Consultation Payments|Billing Ledger|Total Collected|Pending Balance/i).first()
  303 |       ).toBeVisible({ timeout: 10000 })
  304 | 
  305 |       for (const r of billingResponses) {
  306 |         expect(r.status >= 200 && r.status < 300, `Billing API non-2xx: ${r.status} ${r.url}`).toBeTruthy()
  307 |       }
```