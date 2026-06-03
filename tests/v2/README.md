# v2 end-to-end tests (Playwright)

Browser-based integration / regression tests for the v2 app, run on **desktop
and mobile** web breakpoints. Screenshots + video + trace are captured for every
run (see `playwright.config.ts`).

## Run

```bash
# Install the browser once
npx playwright install chromium

# Run the v2 suite against the seeded preview (default target)
npx playwright test tests/v2

# Just one breakpoint
npx playwright test tests/v2 --project=desktop-web
npx playwright test tests/v2 --project=mobile-web

# View the HTML report (screenshots, video, trace per test)
npx playwright show-report
```

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
