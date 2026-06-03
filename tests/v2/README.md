# v2 end-to-end tests (Playwright)

Browser-based integration / regression tests for the v2 app, run on **desktop
and mobile** web breakpoints. Screenshots + video + trace are captured for every
run (see `playwright.config.ts`).

## Run

The fastest path is the npm scripts (run from the repo root):

```bash
npm run test:e2e:install   # install the Chromium browser once
npm run test:e2e           # full suite (desktop + mobile) vs the seeded preview
npm run test:e2e:desktop   # just the desktop-web breakpoint
npm run test:e2e:mobile    # just the mobile-web breakpoint
npm run test:e2e:ui        # interactive UI mode — watch, pick, time-travel
npm run test:e2e:headed    # watch a real browser drive the app
npm run test:e2e:report    # open the HTML report (screenshots, video, trace)
```

Or call Playwright directly:

```bash
npx playwright install chromium
npx playwright test tests/v2
npx playwright test tests/v2 --project=desktop-web
npx playwright show-report
```

## CI (the reliable way to run the whole suite)

`.github/workflows/e2e-v2.yml` runs the full suite on a clean Ubuntu runner
with Playwright's bundled Chromium and uploads **two artifacts** per run:
`playwright-html-report` (the browsable report) and `e2e-artifacts` (every
screenshot, video, and trace). It triggers on pushes to the suite branch, on
PRs that touch `tests/v2/**` or `playwright.config.ts`, and via
`workflow_dispatch` (where you can point `base_url`/`api_base` at any deploy).

CI is the recommended way to get a clean green run + the full asset gallery —
see the caveat below for why local Mac runs can be flaky.

### ⚠️ Local browser caveat (macOS with many open Chrome windows)

The config uses `channel: 'chrome'` (your installed Chrome) rather than the
bundled browser. On a dev Mac with lots of open Chrome processes, Chrome's
remote-debugging channel gets starved and tests can **hang mid-run** (pages
render, but DOM queries stall) — this is environmental, not a test defect. If
you hit it locally:

- Run a **single spec at low concurrency**: `npx playwright test tests/v2/guest.spec.ts --workers=1`
- Or quit most Chrome windows first, or
- Just push and let **CI** run it (clean runner, no contention) — recommended.

## The failed-test → fix feedback loop

When a test fails, the loop is: read the failure → open the trace → fix → re-run
just that test.

```bash
npm run test:e2e:report                       # opens the report; click a failed
                                              # test to see the error, the
                                              # screenshot at failure, the video,
                                              # and a step-by-step trace
npx playwright test tests/v2/member.spec.ts -g "greets the member"   # re-run one test by name
npx playwright test tests/v2 --last-failed    # re-run only what failed last time
```

`vtext(page, /…/)` (see `helpers.ts`) is the assertion helper — it matches the
first *visible* text node, sidestepping RN-web's hidden responsive duplicates,
so failures point at real UI gaps rather than DOM noise.

## Targeting another environment

```bash
# Local dev (npm run dev) — frontend on :8081, point the API at your local worker
E2E_BASE_URL=http://localhost:8081 \
E2E_API_BASE=http://localhost:8787/api \
npx playwright test tests/v2
```

`E2E_PREVIEW_PW` overrides the seeded role password (default `PreviewTest2026!`).

## What's covered

- **guest.spec.ts** — intro carousel, auth value-prop, stripped guest Home,
  Feed ghost empty state + setup rail, guest Explore browsing.
- **member.spec.ts** — personalized Home, Explore center picker, populated Feed,
  Center board, combined Settings, Notification preferences. Auth is done via
  the API (`loginAs`) + JWT injection, not the UI, for stability.

## iOS / native (later)

These specs drive the **web** build. Native iOS coverage will use a separate
runner (Detox or Maestro against an EAS dev build / simulator) — the same flows,
the same seeded role logins. Tracked as a follow-up.
