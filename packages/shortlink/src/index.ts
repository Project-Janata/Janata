const CANONICAL = 'https://chinmayajanata.org'

// Short prefix on janata.app → canonical path segment on chinmayajanata.org.
// Add a line here to support new resource types.
const ROUTES: Record<string, string> = {
  i: 'invite',
  e: 'events',
  c: 'center',
  f: 'feed',
  u: 'users',
}

// Served at janata.app/.well-known/ — tells iOS which paths open the app.
// Replace TEAMID with the real Apple Team ID before shipping.
const AASA = JSON.stringify({
  applinks: {
    apps: [],
    details: [
      {
        appID: 'TEAMID.org.chinmayamission.janata',
        paths: ['NOT /.well-known/*', ...Object.keys(ROUTES).map((p) => `/${p}/*`)],
      },
    ],
  },
})

// Served at janata.app/.well-known/ — tells Android which paths open the app.
// Replace the fingerprint placeholder with the real EAS release SHA-256 before shipping.
const ASSET_LINKS = JSON.stringify([
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'org.chinmayamission.janata',
      sha256_cert_fingerprints: ['REPLACE_WITH_EAS_ANDROID_SHA256_FINGERPRINT'],
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

    // /prefix/id  →  chinmayajanata.org/canonical/id
    const match = pathname.match(/^\/([a-z])\/(.+)$/)
    if (match) {
      const [, prefix, id] = match
      const canonical = ROUTES[prefix]
      if (canonical) {
        return Response.redirect(`${CANONICAL}/${canonical}/${id}`, 301)
      }
    }

    return Response.redirect(CANONICAL, 301)
  },
}
