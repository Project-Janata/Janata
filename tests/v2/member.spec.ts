import { test, expect } from '@playwright/test'
import { gotoApp, loginAs, shot, vtext } from './helpers'

// Signed-in member regression flows (seeded member@ → Chinmaya Vrindavan, which
// has seeded events + a populated board). Runs on desktop-web + mobile-web.
const VRINDAVAN = 'c0000001-0000-0000-0000-000000000081'

test.describe('v2 member flows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'member')
  })

  test('Home is personalized by role + center', async ({ page }, testInfo) => {
    await gotoApp(page, '/')
    await expect(vtext(page, /Namaste/i)).toBeVisible()
    // Role + home-center personalization (#370/#393).
    await expect(vtext(page, /Chinmaya Vrindavan/i)).toBeVisible()
    await shot(page, testInfo, 'home-member')
  })

  test('Explore defaults the picker to the member center + lists events', async ({
    page,
  }, testInfo) => {
    await gotoApp(page, '/explore')
    await expect(vtext(page, /Chinmaya Vrindavan/i)).toBeVisible()
    // A seeded event in the list.
    await expect(vtext(page, /Bala Vihar|Gita Study|Mahasamadhi/i)).toBeVisible()
    await shot(page, testInfo, 'explore-member')
  })

  test('Feed shows the populated board posts', async ({ page }, testInfo) => {
    await gotoApp(page, '/feed')
    // Seeded posts on the member's center board (#392).
    await expect(vtext(page, /Vrindavan board|satsang|South Bay/i)).toBeVisible()
    await shot(page, testInfo, 'feed-member')
  })

  test('Center detail renders details, events, and the board', async ({ page }, testInfo) => {
    await gotoApp(page, `/center/${VRINDAVAN}`)
    await expect(vtext(page, /Chinmaya Vrindavan/i)).toBeVisible()
    // Board section with a seeded post.
    await expect(vtext(page, /Vrindavan board|satsang|South Bay/i)).toBeVisible()
    await shot(page, testInfo, 'center-detail')
  })

  test('Settings is the combined account page (Profile is the top section)', async ({
    page,
  }, testInfo) => {
    await gotoApp(page, '/settings')
    await expect(vtext(page, /^Profile$/i)).toBeVisible()
    await expect(vtext(page, /Member Demo/i)).toBeVisible()
    // Consolidation: account + notification + appearance sections in one page.
    await expect(vtext(page, /Notification preferences/i)).toBeVisible()
    await shot(page, testInfo, 'settings')
  })

  test('Notification preferences renders channels + types (push now live)', async ({
    page,
  }, testInfo) => {
    await gotoApp(page, '/settings/notifications')
    await expect(vtext(page, /Notification Channels/i)).toBeVisible()
    await expect(vtext(page, /Event Reminders/i)).toBeVisible()
    await shot(page, testInfo, 'notification-prefs')
  })
})
