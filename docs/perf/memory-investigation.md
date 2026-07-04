# Memory & perf investigation (#125)

Investigation log + status. Where the 1.96 GB figure comes from and what's been done about it.

## What we still need a human for

- [ ] **Identify the actual Cloudflare dashboard metric** reporting 1.96 GB. Currently unknown which metric this is (aggregate across PoPs? worker memory total? worker CPU?). Without this baseline we're optimizing blindly.
  - Kish: open the CF dashboard → `chinmaya-janata` Pages project → Metrics. Screenshot the section that showed 1.96 GB so we know what we're chasing.

## What this PR shipped (small slice — backend half of the optimizations)

### Rate-limit map size cap

`middleware.ts` was unbounded — sustained diverse-IP traffic between the 60s cleanup interval could grow the map without limit inside a long-lived isolate. Added a `MAX_RATE_LIMIT_ENTRIES = 10_000` safety valve: if cleanup runs and the map is still oversize, clear it. One window of allowed-when-it-shouldn't-be requests is the worst case — acceptable vs. OOM.

10K entries × ~80 bytes ≈ 800 KB worst case, well under the 128 MB isolate limit but bounded.

### GET aliases for high-traffic read endpoints

Cloudflare only edge-caches `GET`. The 9 read-only `POST` endpoints in the issue all bypass edge cache, meaning every request spins up a Worker isolate. Added GET aliases for the top 3 high-impact ones (kept POST for backward compat):

| GET alias | Cache | What it serves |
|---|---|---|
| `GET /fetchCenter?centerID=…` | 30s | Single center |
| `GET /fetchEvent?id=…` | 30s | Single event |
| `GET /fetchEventsByCenter?centerID=…` | 30s | Events at a center |

Why only 3 of 9 — the other 6 (`userExistence`, `getUserEvents`, `getEventUsers`, `listUsers`, `getUserById/:id`, `fetchAllCenters`) involve auth/user data or were judged less hot. Next PR can add aliases for those.

**No client changes in this PR.** The frontend still calls the POST endpoints. Once these GET aliases are in prod, a follow-up PR can switch the API client to prefer GET, and at that point the edge cache wins land. Splitting the work this way keeps the PR small + lets us verify the GET endpoints work before tearing up clients.

## What's deferred (out of scope for this PR)

### Frontend bundle bloat — separate concern, not the 1.96 GB figure

Per the issue, these affect browser perf, not Workers memory:

- Lucide tree-shaking — 4,917 icon components bundled, ~40 used
- Code splitting — `web.output: "single"` produces an 8.5 MB JS bundle
- Image optimization — landing page images up to 3840×5670 displayed at 220px
- `assetBundlePatterns: ["**/*"]` bundles everything

Each of these is its own PR. Notable: the SEO PR #213's switch to `web.output: "static"` (deferred there too) would also enable code splitting. Two birds.

### Switching backend clients to GET

Once the GET aliases prove out in prod, update `packages/frontend/utils/api.ts` to prefer GET for `fetchCenter`, `fetchEvent`, `fetchEventsByCenter`. Drop the POST request bodies, switch to query params. Follow-up PR.

### Backend Sentry (`@sentry/cloudflare-workers`)

Out of scope here. Frontend error capture went to PostHog `$exception` per #105/#261. Backend exceptions surface in CF dashboard logs already; deciding whether to add a structured forwarder is its own discussion.

## Observed metrics (to be filled in once Kish identifies the dashboard)

- Per-isolate baseline (local profiling): ~80-90 MB
- CF dashboard "memory usage": **1.96 GB** ← what metric exactly?
- Worker invocations / day (last 7d): _TBD_
- POST-vs-GET ratio: _TBD_

## Acceptance criteria (from #125) — status

- [x] Rate limit map capped
- [x] GET aliases added for top 3 read endpoints
- [ ] Identify exact CF dashboard metric (human)
- [ ] GET aliases for remaining 6 endpoints (follow-up PR)
- [ ] Frontend uses GET (follow-up PR)
- [ ] Frontend bundle bloat addressed (separate issue/PR)
