import { test, expect } from '@playwright/test'
import { gotoApp, logout, shot, vtext } from './helpers'

// Logged-out (guest) regression flows. Runs on guest-desktop + guest-mobile.
// Small single-purpose tests so each shows up as its own line as it completes.
test.describe('v2 guest', () => {
  test.beforeEach(async ({ page }) => {
    await logout(page)
  })

  test('intro carousel renders the first slide', async ({ page }, testInfo) => {
    await test.step('open /intro', () => gotoApp(page, '/intro'))
    await expect(vtext(page, /Find your center/i)).toBeVisible()
    await expect(vtext(page, /Grow together/i)).toBeVisible()
    await expect(vtext(page, /^Next$/i)).toBeVisible()
    await shot(page, testInfo, 'intro')
  })

  test('auth screen shows the welcome heading + invite affordance', async ({ page }, testInfo) => {
    await gotoApp(page, '/auth')
    await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible()
    // The value-prop bullet list was removed (#488); the invite-only entry now
    // leads with the email field + a "Have an invite? Paste it" affordance (#491).
    await expect(vtext(page, /Have an invite/i)).toBeVisible()
    await shot(page, testInfo, 'auth-welcome')
  })

  test('auth screen has the email entry', async ({ page }, testInfo) => {
    await gotoApp(page, '/auth')
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
    await shot(page, testInfo, 'auth-email')
  })

  test('guest Home shows the sign-in nudge', async ({ page }, testInfo) => {
    await gotoApp(page, '/')
    await expect(vtext(page, /Log in to make Janata yours|Make Janata yours/i)).toBeVisible()
    await shot(page, testInfo, 'home-guest')
  })

  test('guest Home hides personalized event lists (#399)', async ({ page }) => {
    await gotoApp(page, '/')
    // Personalized section headers must NOT be VISIBLE to a logged-out visitor.
    // RN-web leaves hidden duplicate text nodes (responsive variants + the
    // off-screen AuthPromptModal copy "…see what is coming up"), so filter to
    // visible — a plain getByText would count those hidden copies.
    await expect(page.getByText(/UP NEXT FOR YOU/i).filter({ visible: true })).toHaveCount(0)
    await expect(page.getByText(/COMING UP/i).filter({ visible: true })).toHaveCount(0)
  })

  test('guest Feed shows the setup rail', async ({ page }, testInfo) => {
    await gotoApp(page, '/feed')
    await expect(vtext(page, /Log in to see your feed/i)).toBeVisible()
    await expect(vtext(page, /Log in/i)).toBeVisible()
    await shot(page, testInfo, 'feed-setup-rail')
  })

  test('guest Feed keeps the preview quiet', async ({ page }, testInfo) => {
    await gotoApp(page, '/feed')
    // The welcome ghost card is hidden for desktop guests; assert no VISIBLE
    // copy (RN-web keeps the hidden mobile-variant node in the DOM).
    await expect(page.getByText(/Your community feed/i).filter({ visible: true })).toHaveCount(0)
    await shot(page, testInfo, 'feed-ghost-card')
  })

  test('guest can browse Explore (centers + events)', async ({ page }, testInfo) => {
    await gotoApp(page, '/explore')
    await expect(vtext(page, /Chinmaya/i)).toBeVisible()
    await shot(page, testInfo, 'explore-guest')
  })
})
