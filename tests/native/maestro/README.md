# Native smoke tests (Maestro)

Maestro smoke flows for the real native app on iOS Simulator or Android
Emulator. These complement the Playwright web suite in `tests/v2`.

## Prerequisites

- Maestro installed: `curl -Ls https://get.maestro.mobile.dev | bash`
- A Java runtime/JDK installed
- An iOS Simulator or Android Emulator running
- A Janata build installed with app id `org.chinmayamission.janata`

For signed-in flows, install a preview/dev build pointed at the seeded preview
API. Production builds may not have the seeded `member@chinmayajanata.org`
account available.

## Run

```bash
npm run test:native        # all native Maestro flows on the connected device
npm run test:native:ios    # same flows, named for iOS workflow
npm run test:native:android
npm run test:native:guest
npm run test:native:member
```

Override defaults:

```bash
MAESTRO_DEVICE_ID=<device-id> npm run test:native
MAESTRO_APP_ID=org.chinmayamission.janata npm run test:native
E2E_MEMBER_EMAIL=member@chinmayajanata.org \
E2E_MEMBER_PASSWORD=PreviewTest2026! \
npm run test:native:member
```

## What these cover

- `guest-smoke.yaml`: launches the app, opens auth/explore/feed by deep link,
  and checks logged-out surfaces render.
- `member-smoke.yaml`: signs in through the UI, then checks Home, Explore,
  Feed, Settings, and Notification Preferences.

## Notes

- Video is not required. Maestro captures screenshots with `takeScreenshot`.
- These flows intentionally use visible text selectors first. If native UI text
  changes, update the flow assertions.
- If UI login becomes flaky or rate-limited, the next step is a dev/test-only
  deep link such as `janata://e2e-login?role=member`, gated behind a non-prod
  build flag.
