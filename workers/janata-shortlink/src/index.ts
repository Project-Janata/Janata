// janata.app short-link / universal-link worker.
//
// Serves the janata.app zone. Two jobs:
//   1. Serve the iOS/Android app-association files so janata.app/<prefix>/<id>
//      links open the native app (universal links / app links).
//   2. For everyone else (web browsers, no app installed), 301 the short link
//      to the canonical chinmayajanata.org route.
//
// Invite links are the primary use case: janata.app/i/CODE.
//
// NOTE: this is the source of truth for the deployed `janata-shortlink` worker.
// It was previously deployed straight from the dashboard with placeholder
// values and was NOT tracked in git. Deploy with `wrangler deploy` from this dir.

const CANONICAL = 'https://chinmayajanata.org'

// short prefix -> canonical web path segment.
// `i` maps to `i` (Door 1, the canonical invite resolver) — not the legacy
// `/invite/` route, which only works via an extra in-app redirect hop.
const ROUTES: Record<string, string> = {
  i: 'i',
  e: 'events',
  c: 'center',
  f: 'feed',
  u: 'users',
}

// Apple team-id prefixed app id. Must match the app's signing team or iOS
// silently refuses to associate the domain. GN3TH9WD6W is the real team id
// (the dashboard worker shipped the literal placeholder "TEAMID").
const APP_ID = 'GN3TH9WD6W.org.chinmayamission.janata'
const ANDROID_PACKAGE = 'org.chinmayamission.janata'
// TODO: replace with the EAS Android upload-key SHA-256 before Android launch.
const ANDROID_SHA256 = 'REPLACE_WITH_EAS_ANDROID_SHA256_FINGERPRINT'

// Only /i/* (invites) deep-links into the app — it's the one short prefix with
// a matching native route (app/i/[code]). The other prefixes (e/c/f/u) still
// web-redirect below, but iOS/Android shouldn't open the app to a route it
// can't render, so they're intentionally excluded from the association paths.
const AASA = JSON.stringify({
  applinks: {
    apps: [],
    details: [
      {
        appID: APP_ID,
        paths: ['NOT /.well-known/*', '/i/*'],
      },
    ],
  },
})

const ASSET_LINKS = JSON.stringify([
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: ANDROID_PACKAGE,
      sha256_cert_fingerprints: [ANDROID_SHA256],
    },
  },
])

export default {
  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url)

    if (pathname === '/.well-known/apple-app-site-association') {
      return new Response(AASA, { headers: { 'Content-Type': 'application/json' } })
    }
    if (pathname === '/.well-known/assetlinks.json') {
      return new Response(ASSET_LINKS, { headers: { 'Content-Type': 'application/json' } })
    }

    const match = pathname.match(/^\/([a-z])\/(.+)$/)
    if (match) {
      const [, prefix, id] = match
      const canonical = ROUTES[prefix]
      if (canonical) {
        return Response.redirect(`${CANONICAL}/${canonical}/${id}`, 301)
      }
    }

    // Root and anything unrecognised -> canonical site.
    return Response.redirect(CANONICAL, 301)
  },
}
