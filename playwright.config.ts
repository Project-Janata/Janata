import { defineConfig, devices } from '@playwright/test'

// Default target is the isolated v2 preview (seeded with demo data + role
// logins). Override with E2E_BASE_URL to point at localhost (npm run dev) or
// any other deploy. The legacy v1 specs can target prod via E2E_BASE_URL.
const BASE_URL = process.env.E2E_BASE_URL || 'https://v2preview.project-janatha.pages.dev'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // Low concurrency: the default target is a SHARED remote preview (Cloudflare
  // Pages + one worker), so too many parallel sessions overwhelm it and every
  // test times out. 3 is a safe balance; bump it when running against localhost.
  workers: Number(process.env.E2E_WORKERS) || 3,
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 60_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: BASE_URL,
    // Capture artifacts for every run (goal: screenshots + videos wherever
    // possible), not just failures. Traces aid debugging regressions.
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  // Web on desktop + mobile breakpoints. We use `channel: 'chrome'` (the locally
  // installed Chrome) so no large browser download is needed. In CI the bundled
  // Chromium is installed instead (npx playwright install --with-deps chromium)
  // and runs clean. NOTE: on a dev Mac with many open Chrome windows, Chrome's
  // automation channel can get starved and hang tests mid-run — run a single
  // spec with --workers=1, or just let CI run the full suite (see
  // tests/v2/README.md → "Local browser caveat").
  // Each project runs the whole v2 suite; member specs log in per-test, guest
  // specs run logged-out. iOS comes later — see tests/v2/README.md.
  projects: [
    {
      name: 'desktop-web',
      use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'mobile-web',
      use: { ...devices['Pixel 5'], channel: 'chrome' }, // ~393x851 mobile emulation
    },
  ],
})
