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

  test('auth screen shows the value proposition', async ({ page }, testInfo) => {
    await gotoApp(page, '/auth')
    await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible()
    // The value list that gives new users insight before signing in (#373).
    await expect(vtext(page, /RSVP in a tap/i)).toBeVisible()
    await shot(page, testInfo, 'auth-value-prop')
  })

  test('auth screen has the email entry', async ({ page }, testInfo) => {
    await gotoApp(page, '/auth')
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
    await shot(page, testInfo, 'auth-email')
  })

  test('guest Home shows the sign-in nudge', async ({ page }, testInfo) => {
    await gotoApp(page, '/')
    await expect(vtext(page, /Make Janata yours|Sign in/i)).toBeVisible()
    await shot(page, testInfo, 'home-guest')
  })

  test('guest Home hides personalized event lists (#399)', async ({ page }) => {
    await gotoApp(page, '/')
    // Personalized lists must NOT show for a logged-out visitor.
    await expect(page.getByText(/UP NEXT FOR YOU/i)).toHaveCount(0)
    await expect(page.getByText(/COMING UP/i)).toHaveCount(0)
  })

  test('guest Feed shows the setup rail', async ({ page }, testInfo) => {
    await gotoApp(page, '/feed')
    await expect(vtext(page, /Finish setting up your feed/i)).toBeVisible()
    await expect(vtext(page, /Sign in/i)).toBeVisible()
    await shot(page, testInfo, 'feed-setup-rail')
  })

  test('guest Feed previews what the feed is (ghost card)', async ({ page }, testInfo) => {
    await gotoApp(page, '/feed')
    await expect(vtext(page, /Your community feed/i)).toBeVisible()
    await shot(page, testInfo, 'feed-ghost-card')
  })

  test('guest can browse Explore (centers + events)', async ({ page }, testInfo) => {
    await gotoApp(page, '/explore')
    await expect(vtext(page, /Chinmaya/i)).toBeVisible()
    await shot(page, testInfo, 'explore-guest')
  })
})
