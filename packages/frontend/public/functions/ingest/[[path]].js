// Cloudflare Pages Function — PostHog reverse proxy (Janata #541).
//
// The web build sends analytics to the app's OWN origin at `/ingest/*` (see
// utils/analyticsConfig.ts) so the browser never makes a cross-origin request:
// no CORS preflight/failure, and ad-blockers that only block known PostHog
// hostnames can't silently drop events. This edge function rewrites those
// same-origin requests to PostHog's ingestion + asset hosts.
//
// Lives in packages/frontend/public/ so `expo export` copies it into `dist/`,
// where `wrangler pages deploy dist` compiles it as a Pages Function.

const API_HOST = 'us.i.posthog.com'
const ASSET_HOST = 'us-assets.i.posthog.com'

export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)

  // Strip the `/ingest` prefix; forward the remaining path + query upstream.
  const path = url.pathname.replace(/^\/ingest/, '') || '/'
  const upstreamHost = path.startsWith('/static/') ? ASSET_HOST : API_HOST

  const upstreamUrl = new URL(request.url)
  upstreamUrl.protocol = 'https:'
  upstreamUrl.hostname = upstreamHost
  upstreamUrl.port = ''
  upstreamUrl.pathname = path

  const headers = new Headers(request.headers)
  headers.set('host', upstreamHost)

  return fetch(upstreamUrl.toString(), {
    method: request.method,
    headers,
    body: request.body,
    redirect: 'follow',
  })
}
