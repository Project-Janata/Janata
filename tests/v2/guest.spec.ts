import { test, expect } from '@playwright/test'
import { gotoApp, logout, shot, vtext } from './helpers'

// Logged-out (guest) regression flows. Runs on both desktop-web and mobile-web
// projects. Captures a screenshot per screen, per breakpoint.
test.describe('v2 guest flows', () => {
  test.beforeEach(async ({ page }) => {
    await logout(page)
  })

  test('intro carousel renders the first slide', async ({ page }, testInfo) => {
    await gotoApp(page, '/intro')
    // Slide 1 headline + a forward control.
    await expect(vtext(page, /Find your center/i)).toBeVisible()
    await expect(vtext(page, /Grow together/i)).toBeVisible()
    await expect(vtext(page, /^Next$/i)).toBeVisible()
    await shot(page, testInfo, 'intro')
  })

  test('auth screen shows the value proposition + email entry', async ({ page }, testInfo) => {
    await gotoApp(page, '/auth')
    // Heading by role (avoids matching hidden duplicate text nodes that RN-web
    // leaves in the DOM for responsive variants).
    await expect(page.getByRole('heading', { name: /Welcome/i })).toBeVisible()
    // The specific value-prop line (#373) — not the hidden SignInCallout copy
    // that also contains the word "RSVP".
    await expect(page.getByText(/RSVP in a tap/i)).toBeVisible()
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
    await shot(page, testInfo, 'auth')
  })

  test('guest Home is stripped to sign-in + Explore (no personalized lists)', async ({
    page,
  }, testInfo) => {
    await gotoApp(page, '/')
    // The sign-in nudge is present for guests.
    await expect(vtext(page, /Make Janata yours|Sign in/i)).toBeVisible()
    await shot(page, testInfo, 'home-guest')
    // #399: personalized event lists must NOT show for a logged-out visitor.
    await expect(page.getByText(/UP NEXT FOR YOU/i)).toHaveCount(0)
    await expect(page.getByText(/COMING UP/i)).toHaveCount(0)
  })

  test('guest Feed shows the ghost empty state + setup rail', async ({ page }, testInfo) => {
    await gotoApp(page, '/feed')
    // State-aware empty state (#391): the setup rail + the "what the feed is" card.
    await expect(vtext(page, /Finish setting up your feed/i)).toBeVisible()
    await expect(vtext(page, /Sign in/i)).toBeVisible()
    await expect(vtext(page, /Your community feed/i)).toBeVisible()
    await shot(page, testInfo, 'feed-guest-ghost')
  })

  test('guest can browse Explore (centers + events)', async ({ page }, testInfo) => {
    await gotoApp(page, '/explore')
    // Centers/events are browseable while logged out.
    await expect(vtext(page, /Chinmaya/i)).toBeVisible()
    await shot(page, testInfo, 'explore-guest')
  })
})
