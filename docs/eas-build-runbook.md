# EAS Build runbook

How to get a build out the door. Covers the **automated** pieces (CI, eas.json) and the **human-only** pieces (`eas login`, `eas submit`).

> **Why this exists:** the agent that built this can write configs and workflows all day, but it can never log into your Expo account, never sign a build, never submit to TestFlight. That's you. This doc draws the line cleanly.

---

## One-time setup (human, ~10 min)

### 1. `eas login`

On the Mac mini (or wherever the dev environment lives):

```bash
cd ~/Code/Project-Janatha/packages/frontend
npx eas login
# Browser opens → log in to expo.dev → confirm
```

Confirms with `npx eas whoami` → should print your Expo username.

### 2. Create an EAS access token for CI

For the GitHub Actions workflow to drive builds:

1. Open https://expo.dev/accounts/[your-account]/settings/access-tokens
2. **Create token** → give it a name like `github-actions-janata`
3. Copy the token (one-time view).
4. GitHub: repo → Settings → Secrets and variables → Actions → **New repository secret**:
   - Name: `EXPO_TOKEN`
   - Value: paste the token

### 3. App Store Connect API key (only needed when you `eas submit`)

For `eas submit` to upload to TestFlight non-interactively:

1. App Store Connect → Users and Access → Keys → **+** to create a new API key with **App Manager** role.
2. Download the `.p8` file (one-time download, **never re-downloadable**).
3. Note the **Issuer ID** (header of the Keys page) and **Key ID** (next to the key name).
4. Either:
   - **(Recommended)** Run `eas credentials` and paste them in when prompted — EAS stores them remotely.
   - **(CI path)** Add them as GitHub secrets: `ASC_API_KEY_P8`, `ASC_API_KEY_ID`, `ASC_API_KEY_ISSUER_ID`. The submit step in the runbook below references these.

You only need this once. Re-build, re-submit, re-build again all use the same key.

### 4. iOS distribution certificate + provisioning profile

Two options:

- **(Recommended)** Let EAS manage them. First `eas build` will prompt: "EAS doesn't have credentials for this project — would you like EAS to generate them?" → Yes. EAS creates the cert and profile in your Apple Developer account on your behalf. Stored remotely; no `.p12` to lose.
- **(Manual)** Use existing cert via `eas credentials`. Only if you need to keep your existing CCMT cert.

Per Notion 5/26 — we're shipping under CCMT's existing org account. So when EAS asks "Apple Developer Team," pick CCMT's team, not your personal one.

---

## Daily flow

### Trigger a build via GitHub Actions (recommended)

Tag the commit you want to ship:

```bash
git checkout main          # or v2 if pre-launch
git pull
git tag ios-v0.2.0         # the tag scopes the platform
git push origin ios-v0.2.0
```

The `.github/workflows/eas-build.yml` workflow:
- Resolves platform from the tag prefix (`ios-v*` → iOS; `android-v*` → Android)
- Runs `eas build --platform ios --profile production --non-interactive --no-wait`
- Reports back with a link to the build in the EAS dashboard

Or manually via GitHub UI:

1. Actions tab → **EAS Build** → Run workflow
2. Pick platform + profile
3. Run

Track the actual build on https://expo.dev — the GitHub job exits as soon as the EAS job kicks off (`--no-wait`).

### Local build (debugging)

```bash
cd packages/frontend
eas build --profile preview --platform ios       # for a real-device test build
eas build --profile production --platform ios    # for a TestFlight-ready build
```

`preview` profile = internal distribution. `production` = needs `eas submit` to ship to TestFlight.

### Submit to TestFlight (human-only step)

After the build finishes (you'll get an email from EAS):

```bash
cd packages/frontend
eas submit --profile production --platform ios --latest
```

`--latest` grabs the most recent production iOS build. EAS uses the ASC API key you set up in step 3 above.

Then in App Store Connect:
1. Wait ~15-30 min for Apple to process the build.
2. TestFlight tab → Internal Testing → Add the build to your test group.
3. Internal testers get a push notification within minutes.

---

## What the agent can and cannot do for you

| Task | Agent? |
|---|---|
| Write/maintain `eas.json` | ✅ |
| Add/modify the GitHub Actions workflow | ✅ |
| Bump version numbers in `app.json` | ✅ |
| Write release notes | ✅ |
| `eas login` | ❌ — needs your browser auth |
| `eas submit` to TestFlight | ❌ — per Kish 5/27, human-only |
| Apple Developer portal config (certs, AASA, push keys) | ❌ — needs Apple account credentials |
| Diagnose a failed EAS build by reading logs | ✅ |

---

## Common gotchas

### "Project not configured for EAS" on first build

You haven't run `eas login` (step 1) — or your token expired. Re-run `eas login`.

### "Could not find a project linked to this EAS account"

Run `eas init --id` from `packages/frontend/` to bind this repo to an EAS project. EAS picks the project from your account. If you have multiple Expo accounts → log out and back in as the right one.

### CI build fails with "Authentication required"

`EXPO_TOKEN` secret missing or expired in GitHub Actions. Re-generate at expo.dev and re-add to the repo secrets.

### Build succeeds but bundle is wrong

Most likely `EXPO_PUBLIC_*` env vars are missing from the EAS build environment. EAS doesn't read your local `.env` — set them via:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_POSTHOG_KEY --value "phc_..."
```

These get injected into every `eas build` automatically.

The vars to set right now (per `packages/frontend/.env.example`):
- `EXPO_PUBLIC_POSTHOG_KEY` — required
- `EXPO_PUBLIC_API_BASE_URL` — defaults to local, override to `https://api.chinmayajanata.org/api` for prod builds
- `EXPO_PUBLIC_SHOW_DEBUG_DETAILS` — explicitly `false` for prod builds (or unset, same effect)

### "App Store Connect API request failed: Authentication failed"

ASC API key wrong / expired / wrong role. Re-do step 3 above.

---

## What's NOT in this runbook (yet)

- **OTA updates via EAS Update** — separate from EAS Build. Lets you push JS-only changes without a new TestFlight build. Worth setting up post-launch for fast iteration.
- **Android Play Store path** — same workflow shape, different submit endpoint. Add when we cross the bridge.
- **Build version bumping** — `app.json` has `ios.buildNumber` which `eas build --profile production` auto-increments via `autoIncrement: true` in eas.json. No manual step.

---

## Related

- `packages/frontend/eas.json` — build profile config
- `.github/workflows/eas-build.yml` — CI workflow
- `packages/frontend/app.json` — iOS bundle identifier, version, permissions
- `local-notes/kish-todos.md` — pre-launch human-only steps
