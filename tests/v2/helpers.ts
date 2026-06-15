import { type Page, type Locator, type TestInfo, expect } from '@playwright/test'

// The v2 preview frontend talks to this isolated worker API. Override with
// E2E_API_BASE when pointing the suite at localhost or another deploy.
export const API_BASE =
  process.env.E2E_API_BASE ||
  'https://chinmaya-janata-api-v2preview.chinmayajanata.workers.dev/api'

// Seeded role logins on the preview (see scripts/ci/seed-preview-roles.sh).
export const PREVIEW_PW = process.env.E2E_PREVIEW_PW || 'PreviewTest2026!'

export type Role = 'unverified' | 'member' | 'sevak' | 'brahmachari' | 'admin'

// The web app reads its JWT from localStorage under this key
// (packages/frontend/src/storage/tokenStorage.web.ts).
const TOKEN_KEY = '@auth_token'
const tokenCache = new Map<Role, string>()

/**
 * Authenticate as a seeded role by calling the API directly and injecting the
 * JWT into localStorage — the reliable, UI-independent way to start a signed-in
 * session. Caller should navigate after this so the app boots with the token.
 */
export async function loginAs(page: Page, role: Role): Promise<string> {
  // Need a same-origin context before touching localStorage.
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const cached = tokenCache.get(role)
  if (cached) {
    await page.evaluate(
      ({ key, token }) => localStorage.setItem(key, token),
      { key: TOKEN_KEY, token: cached },
    )
    return cached
  }

  const token = await page.evaluate(
    async ({ api, username, pw, key }) => {
      const res = await fetch(`${api}/auth/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pw }),
      })
      if (!res.ok) return null
      const data = await res.json()
      const tok = data.token || data.accessToken
      if (tok) localStorage.setItem(key, tok)
      return tok || null
    },
    { api: API_BASE, username: `${role}@chinmayajanata.org`, pw: PREVIEW_PW, key: TOKEN_KEY }
  )
  expect(token, `login as ${role} should return a JWT`).toBeTruthy()
  tokenCache.set(role, token as string)
  return token as string
}

/**
 * First *visible* element matching the text. RN-web leaves hidden duplicate
 * text nodes in the DOM for responsive variants, so a plain `.first()` can
 * resolve to a hidden copy — always filter to visible for text assertions.
 */
export function vtext(page: Page, re: RegExp): Locator {
  return page.getByText(re).filter({ visible: true }).first()
}

/** Clear the session (guest). */
export async function logout(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.evaluate((key) => localStorage.removeItem(key), TOKEN_KEY)
}

/**
 * Go to an in-app route and wait for the SPA to settle. Expo Router web is a
 * client-rendered SPA, so we wait for network idle + a short paint settle.
 */
export async function gotoApp(page: Page, path: string): Promise<void> {
  // NOTE: do NOT wait for 'networkidle' — signed-in pages poll (notifications,
  // analytics) so the network never goes idle, which stalls every navigation
  // for the full timeout. A short settle + the per-assertion web-first retries
  // (expect.timeout) are enough for SPA hydration.
  await page.goto(path, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2500)
}

/**
 * Named, always-captured screenshot saved next to the run's artifacts AND
 * attached to the report (so screenshots show up per step, per breakpoint,
 * regardless of pass/fail — per the goal).
 */
export async function shot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  const file = `${testInfo.project.name}-${name}.png`
  const path = testInfo.outputPath(file)
  await page.screenshot({ path, fullPage: false })
  await testInfo.attach(name, { path, contentType: 'image/png' })
}
