# janata-shortlink

Cloudflare Worker that powers the **janata.app** short-link / universal-link domain.

- `janata.app/i/CODE` → invite link (Door 1). Web fallback 301s to
  `chinmayajanata.org/i/CODE`; on iOS/Android with the app installed it opens
  the app directly via the association files below.
- `janata.app/e|c|f|u/<id>` → events / center / feed / users short links.
- Serves `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json`.

## Source of truth

This directory is the source of truth. The live worker was originally deployed
from the Cloudflare dashboard (2026-06-08) with placeholder values and was not
tracked in git. Re-deploying from here corrects:

- Apple `appID` team prefix: `TEAMID` → `GN3TH9WD6W`.
- Invite redirect target: legacy `/invite/CODE` → canonical `/i/CODE`.

## Deploy

```sh
cd workers/janata-shortlink
CLOUDFLARE_ACCOUNT_ID=<account-id> npx wrangler deploy
```

## Still TODO for iOS universal links to actually open the app

This worker is only the **server** half. The **app** half is also required:

1. Add `applinks:janata.app` to `associatedDomains` in
   `packages/frontend/app.json` (currently only `chinmayajanata.org` + `www`).
2. Ship a new native build (EAS) so the entitlement is re-signed.

Until both ship, janata.app invite links open Safari and ride the web 301
instead of deep-linking into the app.

## Android (not launch-blocking)

`ANDROID_SHA256` is still a placeholder here **and** in
`packages/frontend/public/.well-known/assetlinks.json`. Fill in the EAS Android
upload-key SHA-256 before Android launch.
