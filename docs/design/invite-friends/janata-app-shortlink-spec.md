# Spec — `janata.app` short links (t.co-style), ready for build + test

**Owner:** @theabhiramr · **Tracking issue:** #104 · **Related:** #342 / PR #440 (invite-friends), #403 / #404 (invite landing + logged-out states)
**Status:** spec locked 2026-06-07 (Kish). The domain is already on Cloudflare. This doc is the build + test checklist.

---

## The model (locked)

`janata.app` is a **pure short-link domain** that wraps the canonical invite link, exactly like `t.co` wraps a URL.

- **Canonical link** (minted, stored, the expansion target): `https://chinmayajanata.org/i/CODE`
- **Short link** (what members actually share): `https://janata.app/CODE` — the code sits at the **root**, no `/i/`, as concise as possible.

One short link, two behaviors:

- **On a phone with the app:** `janata.app/CODE` opens the app directly on the invite screen (universal link / app link). The browser never appears.
- **On web, or a phone without the app:** `janata.app/CODE` redirects (301) to `https://chinmayajanata.org/i/CODE`, which is the existing web landing / signup (the `/i/[code]` route, with App Store fallback for testers).

The code itself is unchanged: the 12-character invite code already minted by the backend (`USER_INVITE_CODE_BYTES = 6`, uppercased). `janata.app/AB12CD34EF56`.

> This supersedes two earlier notes: (1) the "#104 = chinmayajanata.org, NOT janata.app" banner, and (2) the original #104 "app-only, never renders a web page" framing. The final model is the t.co split above: web **does** expand to the chinmayajanata.org landing.

---

## What to build

### 1. The short-link service on `janata.app` (Cloudflare)
A tiny edge worker bound to the `janata.app` route (recommended over folding it into the existing Pages project, whose `_redirects`/`_headers` are shared with chinmayajanata.org and would collide). It does three things:

- `GET /.well-known/apple-app-site-association` → serve the iOS association JSON (below), `Content-Type: application/json`, no redirect.
- `GET /.well-known/assetlinks.json` → serve the Android association JSON (below).
- `GET /:code` (any other path) → `301` to `https://chinmayajanata.org/i/<code>` (pass the code through verbatim; the landing route normalizes/uppercases it).
- `GET /` (bare domain) → `301` to `https://chinmayajanata.org`.

No-code alternative if preferred: a Cloudflare **Redirect Rule** on the `janata.app` zone for the path redirect, plus the two `.well-known` files served as static assets. Either is fine; the worker keeps it all in one testable place.

### 2. iOS — make `janata.app/CODE` open the app
- **`apple-app-site-association`** served from `janata.app/.well-known/` with the real Apple Team ID and bundle id `org.chinmayamission.janata`, matching every path except `.well-known`:
  ```json
  {
    "applinks": {
      "apps": [],
      "details": [
        { "appID": "<APPLE_TEAM_ID>.org.chinmayamission.janata", "paths": ["NOT /.well-known/*", "/*"] }
      ]
    }
  }
  ```
- **`app.json`** → add `applinks:janata.app` to `ios.associatedDomains`. (While here, drop the duplicated `chinmayajanata.org` entries — the list currently repeats them.)
- Confirm the Associated Domains entitlement is present (it already is for chinmayajanata.org).

### 3. Android — make `janata.app/CODE` open the app
- **`assetlinks.json`** served from `janata.app/.well-known/` with the real release SHA-256 fingerprint and package `org.chinmayamission.janata`.
- **`app.json`** → add an `android.intentFilters` block for host `janata.app`, `scheme: https`, `autoVerify: true`, matching the root path (no `pathPrefix`, so all codes match).

### 4. App routing — map `janata.app/CODE` to the invite flow
The app must treat a `janata.app/CODE` open the same as `chinmayajanata.org/i/CODE`. Add `https://janata.app` as a linking prefix and route a root-level `:code` to the existing invite handler (`app/i/[code].tsx` → `/auth?mode=signup&inviteCode=CODE`). Easiest: a deep-link/native-intent mapping that rewrites `janata.app/<code>` → the `/i/[code]` route so there is one landing screen.

### 5. Backend + screen — share the short link
- **Backend:** change the minted `shareUrl` from `https://chinmayajanata.org/join?code=CODE` to `https://janata.app/CODE` (`INVITE_SHARE_URL_BASE` in `app.ts`). This also resolves the older "align /join?code to /i/CODE" task — the member-facing link is now the short one; the canonical `/i/CODE` is purely the expansion target.
- **Invite Friends screen + share copy:** display and share `janata.app/CODE` (concise). The pre-filled share message becomes e.g. *"Join me on Janata: janata.app/CODE"*.
- The link normalizer already tolerates a pasted link, but it currently matches `janata.app/i/<code>`; update it to also accept the root form `janata.app/<code>` (and keep `chinmayajanata.org/i/<code>`).

---

## Known gaps this work must close (found 2026-06-07)
- The existing chinmayajanata.org `apple-app-site-association` is **missing the `/i/*` path** (it lists `/center`, `/events`, `/feed`, `/auth` only) — so invite links don't open the app even on the current domain. The new janata.app file fixes this for short links; consider also adding `/i/*` to the chinmayajanata.org file.
- `apple-app-site-association` still has a literal `TEAMID` placeholder → needs the real Apple Team ID.
- `assetlinks.json` still has `REPLACE_WITH_EAS_ANDROID_SHA256_FINGERPRINT` → needs the real release fingerprint.
- `ios.associatedDomains` has duplicate chinmayajanata.org entries → de-dupe.

## Values needed before testing (fill these in)
- **Apple Team ID** for `org.chinmayamission.janata` (from the CCMT Apple Developer account the app ships under).
- **Android release SHA-256** fingerprint (`eas credentials` / Play Console).
- App Store Connect app id for the uninstalled fallback is already known: `6761746513`.

---

## Acceptance criteria
- [ ] A minted invite shows and shares as `janata.app/CODE` (short, root path) on both native and web.
- [ ] `janata.app/.well-known/apple-app-site-association` and `assetlinks.json` return valid JSON with the correct content-type and real team/fingerprint values.
- [ ] On an iPhone **with** the app: tapping `janata.app/CODE` opens the app on the invite screen, no browser.
- [ ] On an iPhone **without** the app (and on desktop web): `janata.app/CODE` lands on `chinmayajanata.org/i/CODE` (signup with the code applied / web fallback).
- [ ] Android with the app: same direct-open behavior.
- [ ] Pasting either `janata.app/CODE` or `chinmayajanata.org/i/CODE` into the code field still validates.
- [ ] Bare `janata.app` redirects to `chinmayajanata.org`.

## Real-device test plan
1. Mint a link from Invite Friends; confirm it reads `janata.app/CODE`.
2. iPhone with the app installed: open the link from Messages/Notes → app opens to the invite screen.
3. iPhone without the app (or toggle off the associated domain): same link → Safari → redirects to `chinmayajanata.org/i/CODE` → signup with code applied.
4. Android with the app: open the link → app opens.
5. Desktop browser: open the link → redirects to the canonical landing.
6. Verify the share sheet pre-fills the short link, and that a pasted short link redeems at signup.
