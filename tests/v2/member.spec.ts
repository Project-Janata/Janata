import { test, expect } from '@playwright/test'
import { gotoApp, loginAs, shot, vtext } from './helpers'

// Signed-in member regression flows. Small single-purpose tests so each shows
// up as its own line as it completes. Auth is per-test via loginAs (API JWT
// injection) — reliable, and cheap relative to the SPA load.
//
// Seeded member@ → Chinmaya Vrindavan, which has seeded events + a board.
const VRINDAVAN = 'c0000001-0000-0000-0000-000000000081'

test.describe('v2 member', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'member')
  })

  test('Home greets the member by name', async ({ page }, testInfo) => {
    await test.step('open Home', () => gotoApp(page, '/'))
    await expect(vtext(page, /Namaste/i)).toBeVisible()
    await shot(page, testInfo, 'home-greeting')
  })

  test('Home shows role + center personalization', async ({ page }, testInfo) => {
    await gotoApp(page, '/')
    // #370/#393 — greeting reflects role + home center.
    await expect(vtext(page, /Chinmaya Vrindavan/i)).toBeVisible()
    await shot(page, testInfo, 'home-personalized')
  })

  test('Explore picker defaults to the member center', async ({ page }, testInfo) => {
    await gotoApp(page, '/explore')
    await expect(vtext(page, /Chinmaya Vrindavan/i)).toBeVisible()
    await shot(page, testInfo, 'explore-picker')
  })

  test('Explore lists upcoming events', async ({ page }, testInfo) => {
    await gotoApp(page, '/explore')
    await expect(vtext(page, /Bala Vihar|Gita Study|Mahasamadhi/i)).toBeVisible()
    await shot(page, testInfo, 'explore-events')
  })

  test('Feed shows the populated board posts', async ({ page }, testInfo) => {
    await gotoApp(page, '/feed')
    // Seeded posts on the member's center board (#392).
    await expect(vtext(page, /Vrindavan board|satsang|South Bay/i)).toBeVisible()
    await shot(page, testInfo, 'feed-posts')
  })

  test('Center detail shows the center header', async ({ page }, testInfo) => {
    await gotoApp(page, `/center/${VRINDAVAN}`)
    await expect(vtext(page, /Chinmaya Vrindavan/i)).toBeVisible()
    await shot(page, testInfo, 'center-header')
  })

  test('Center detail renders the board posts', async ({ page }, testInfo) => {
    await gotoApp(page, `/center/${VRINDAVAN}`)
    await expect(vtext(page, /Vrindavan board|satsang|South Bay/i)).toBeVisible()
    await shot(page, testInfo, 'center-board')
  })

  test('Settings has the Profile section as the top item', async ({ page }, testInfo) => {
    await gotoApp(page, '/settings')
    await expect(vtext(page, /^Profile$/i)).toBeVisible()
    await expect(vtext(page, /Member Demo/i)).toBeVisible()
    await shot(page, testInfo, 'settings-profile')
  })

  test('Settings links to notification preferences (consolidated page)', async ({
    page,
  }, testInfo) => {
    await gotoApp(page, '/settings')
    await expect(vtext(page, /Notification preferences/i)).toBeVisible()
    await shot(page, testInfo, 'settings-notifications-link')
  })

  test('Notification preferences shows the channels', async ({ page }, testInfo) => {
    await gotoApp(page, '/settings/notifications')
    await expect(vtext(page, /Notification Channels/i)).toBeVisible()
    await shot(page, testInfo, 'notif-channels')
  })

  test('Notification preferences shows the per-type toggles', async ({ page }, testInfo) => {
    await gotoApp(page, '/settings/notifications')
    await expect(vtext(page, /Event Reminders/i)).toBeVisible()
    await shot(page, testInfo, 'notif-types')
  })
})
