# Analytics (PostHog) — configuration & verification

Single source of truth for how the app talks to PostHog and how to confirm
events are landing before a beta/admin rollout. Background: Janata #541.

## How the host is chosen

Host/key resolution lives in `utils/analyticsConfig.ts` (pure, unit-tested in
`src/__tests__/analyticsConfig.test.ts`) and is wired into the `PostHogProvider`
in `app/_layout.tsx`.

| Platform | Host the client talks to | Why |
| --- | --- | --- |
| **Web** | the app's own origin at `/ingest` (e.g. `https://chinmayajanata.org/ingest`) | A browser request to `us.i.posthog.com` is **cross-origin** → CORS preflight/failure, and ad-blockers drop known PostHog hosts. Same-origin avoids both. |
| **iOS / Android** | `https://us.i.posthog.com` (direct) | Native `fetch` has no CORS and can't resolve a relative path. |

`/ingest/*` is rewritten to PostHog at the edge by the Cloudflare Pages Function
in `public/functions/ingest/[[path]].js` (copied into `dist/` by `expo export`,
compiled by `wrangler pages deploy dist`).

### Keys
Only a **public project key** (`phc_…`) may ship in the client bundle;
`isSafeClientPostHogKey()` rejects personal/secret keys (`phx_…`/`phs_…`) so a
secret can never be inlined into a public build. The web build sets
`EXPO_PUBLIC_POSTHOG_KEY` (a `phc_` key) and **deliberately does not set
`EXPO_PUBLIC_POSTHOG_HOST`** (see `.github/workflows/deploy.yml`) — any
`*.posthog.com` value there would reintroduce the cross-origin request.

## Verifying web analytics (do this each beta check)

1. Open the live site (`https://chinmayajanata.org`) in a normal browser window.
2. DevTools → Console: there should be **no PostHog CORS / config errors**
   during normal usage.
3. DevTools → Network, filter `ingest`: capture/flags requests go to
   `…chinmayajanata.org/ingest/…` (same-origin) and return `200`, **not** to
   `us.i.posthog.com`.
4. In PostHog → Activity, confirm the fresh session's key events appear
   (app open, screen views, sign-in). Allow a minute for ingestion.

## Native / TestFlight

Native builds (EAS) set only `EXPO_PUBLIC_POSTHOG_KEY` and use the direct host,
so they were not affected by the web CORS issue. Verify a TestFlight session by
watching for its events in PostHog (filter `app_platform = ios`). If a native
gap surfaces during beta, file a follow-up issue and link it here.
