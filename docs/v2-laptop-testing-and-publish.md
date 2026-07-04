# v2 — Laptop testing & publishing the team preview

Everything for MSC v2 is merged into the **`v2`** branch. This guide gets you
testing locally on **web + iOS**, then publishing the **isolated** team preview
(never touches prod).

---

## 0. Prerequisites (laptop)
- Node 22, npm
- Xcode + an iOS Simulator (for the iOS test)
- `gh` (optional), `git`
- For publishing only: a Cloudflare account that owns the `project-janatha` Pages
  project / chinmayajanata.org (you'll `wrangler login` once).

---

## 1. Get the code
```bash
git clone https://github.com/Project-Janata/Janata.git   # or: git fetch origin
cd Janata
git checkout v2 && git pull origin v2
```

## 2. Local test setup (one command — no Cloudflare login)
```bash
bash scripts/dev/setup-local-demo.sh
```
This installs deps, migrates a **local** D1, and seeds 10 centers, 4 events, and
**5 role accounts**. Nothing remote is touched.

Then start the stack:
```bash
npm run dev          # backend :8787 + Metro (web :8081)
```
- **Web:** open http://localhost:8081
- **iOS:** press **`i`** in the Metro terminal (boots the simulator), or run `npm run ios`.

## 3. Switch roles — Developer Mode
On the **sign-in screen**, tap the **discreet circle button, bottom-left** →
**Dev / Demo tools**:
- **Sign in as** → Unverified · Member · Sevak · Brahmachari · Admin (one tap, real session, lands on Home)
- **New user — full walkthrough** → explainer → signup → onboarding
- **Sign out**

Manual login also works — `（role)@chinmayajanata.org` / `PreviewTest2026!`
(roles: `unverified`, `member`, `sevak`, `brahmachari`, `admin`).

## 4. What to verify
- **First-timer:** "What is Janata" explainer shows on first launch → signup → onboarding
- **Boards:** post / reply / react; **pin** works as Sevak, 403 as Member
- **Moderation:** report a post → **Sevak** sees the queue + can remove; **Admin** can also suspend; Member blocked
- **Feed** populated; **Explore** has **no Seva tab** (Events / Centers only)
- **Guest RSVP** blocked on the verified-gated event ("Members Only — Leadership Retreat")
- **iOS:** no crashes, 4-tab nav (Chat hidden), profile fields render

---

## 5. Publish the isolated team preview (when ready)
Fully isolated: own worker + own D1 + Pages preview branch. **Prod is never touched.**

```bash
npx wrangler login           # pick the account that owns project-janatha / chinmayajanata.org
npx wrangler whoami          # confirm the right account
bash scripts/ci/deploy-v2preview.sh
```
The script: resolves/creates the isolated `chinmaya-janata-db-v2preview` D1 **on
your account**, applies all migrations, seeds the 5 roles + sample boards,
deploys the worker, builds the frontend (with the role-switcher enabled), and
deploys to:

**https://v2preview.project-janatha.pages.dev** — same 5 role logins as above.

> Why this is needed: the CI `CLOUDFLARE_API_TOKEN` has Workers+Pages but **no D1
> permission** (`d1 list` → auth error 10000), and the original preview D1 was on
> a different account. Your interactive `wrangler login` resolves it. After this
> works once locally, you can also fix the CI token's D1 scope to make the
> `Deploy v2 Preview` GitHub workflow (push to `deploy/v2preview`) fully headless.

**Do not announce** to the team until you've shared the link yourself.

---

## Still manual (inherent — not blockers to testing)
- **Push notifications (#102):** APNs key + a physical device / TestFlight. Out of scope this cycle.
- **App Store (#273):** config is submission-ready; remaining = Apple account decision
  (CCMT vs personal) + screenshots/metadata. Not submitting this cycle.

## What's in this v2 train
Boards (center + event: posts/replies/reactions/pin/edit/delete/feed), moderation
(report→queue→remove→suspend→audit; **admin + sevak**), invites & verification,
profiles, SEO, universal links, first-timer explainer, **Seva tab removed**, and
the **Developer Mode role switcher**. 1:1 Chat is deferred to v3 (cut from MSC).
