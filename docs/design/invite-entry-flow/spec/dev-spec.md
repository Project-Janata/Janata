# Dev spec — invite entry flow (build plan)

Companion to [`design-spec.md`](design-spec.md) (constructs, copy, redlines, states). This file is the build order, the file-by-file change list, and the end-to-end test matrix. Construct IDs (`new-XX`) refer to the design spec and to `data-ia-id` attributes in `hifi/mock-v2.html`.

## Sequencing

```
PR #440 (plumbing)  ──merge first──►  Phase 1 (#403)  ──►  Phase 2 (#404)  ──►  Phase 3 (polish)
```

1. **PR #440 merges first.** It carries the plumbing everything here builds on: `/i/[code]` + `/invite/[code]` routes, deep-link registration, `inviteCodes.ts`, register flips `NORMAL_USER` on a consumed invite. This design PR is docs-only and can land independently.
2. **Phase 1 = #403** (Door 1, account creation, invite edge states).
3. **Phase 2 = #404** (Door 2 landing, logged-out live Home/Feed, invite wall).
4. **Phase 3** = handoff + polish (get-the-app, orange unification, short-link fix).

Note: the landing is platform-split today — web `landing.web.tsx` (marketing page), native `landing.tsx` (redirect to `/auth`). Phase 2 replaces both with the logged-out Explore treatment. (An earlier deploy-trap warning here was wrong and is retracted; #444 filed + closed.)

## Phase 1 — #403: Door 1 + account creation

| File | Change | Constructs |
|---|---|---|
| `app/invite/[code].tsx` | Replace both redirects with the Door 1 screen: vouch banner, hero (reuse `/intro` art + copy), Accept, Already-a-member. Invalid code → recovery screen. Authed → already-member screen (kill the silent `/(tabs)` redirect). | new-01, new-01b, new-02, new-03, new-04, new-05 |
| `packages/backend/src/inviteCodes.ts` | Lookup endpoint returns `{ valid, inviterFirstName? }`. Name is optional; the UI must render nameless (new-01b) when absent. | new-01b |
| `app/auth.tsx` | Keep ONE-screen signup (email+password+confirm). Add the applied bar when `inviteCode` param present. Cut `form-03` (typed invite step). Add Terms/Privacy line under the CTA. On register 409 (email exists) flip to login mode with `inviteCode` + `returnTo` held; consumed invite upgrades a grandfathered account. | new-20/21, new-22, copy-03 |
| `components/onboarding/step3.tsx` | Empty-result state: "No centers near you yet" + Global/Online chip + Skip. | onb-3b |
| `app/events/[id]*.tsx` + backend | Guest RSVP sheet (name+email, `#191` + `event_guest_rsvps`). Dedupe by email → already-on-the-list. Confirmation email with cancel link. | new-11, new-11b |
| Shared | Neutral paste-invite screen; new-04 reuses it with error copy. Reachable from every "Have an invite?". | new-25 |

## Phase 2 — #404: Door 2 + logged-out live surfaces

| File | Change | Constructs |
|---|---|---|
| `app/landing.web.tsx` + `app/landing.tsx` | Render logged-out Explore (replaces marketing page on web, auth redirect on native) (reuse Explore internals, NOT a new page) + chrome: logo, Log in, Have an invite?, value strip. Location-unknown → "Popular this week". | new-10, new-13, new-14 |
| `app/(tabs)/index.tsx` | Guest Home goes live: Namaste (no name) + location pill + Happening near you + centers + ONE compact callout. First-run member: same layout, greeting gains name+center, callout becomes the RSVP nudge (invite ✓). One component, swappable callout slot. | new-30, new-32 |
| `components/ui/AuthPromptModal.tsx` | Signup tab becomes the invite wall: RSVP without account / Have an invite? Paste it / Log in. Login keeps `returnTo` resume. Gate behind the hard-gate flag until enforcement lands. | new-12, new-13 |
| `components/feed/FeedEmptyState.tsx` | Guest rail re-copy only (machinery stays): Log in primary, paste invite secondary, guest RSVP escape. joinCenter nudge becomes one-tap Join for the nearest center. | new-15, new-33 |
| `app.json` | Dedupe the duplicated `associatedDomains` entries. | — |

## Phase 3 — handoff + polish

| Change | Constructs |
|---|---|
| Web post-onboarding: "You're in / Get the app" + Continue on web. Native first open after web signup: plain login, email prefilled. No deferred deep linking anywhere. | new-23, new-24 |
| Orange unification: `#ea580c` (`onboarding.tsx:32`) and `#C2410C` (`auth.tsx:265,332`) → token `#E8862A`. | redline |
| Backend share URL `/join?code=` → `chinmayajanata.org/i/CODE` (#440 leftover) + reconcile #104. | — |

## Instrumentation (ship with Phase 1/2, not after)

PostHog: `door1_view`, `door2_view`, `invite_accept_tap`, `invite_wall_view`, `guest_rsvp_submit`, `signup_complete`, `onboarding_complete`. Two doors only pay off if we can compare them.

## End-to-end test matrix

Stack: isolated local QA (backend `:8788` on local D1 via `--local`, web `:8082` with `EXPO_PUBLIC_API_BASE_URL`) so nothing touches prod D1. Native: rebuild the dev client first (`npm run ios` from `packages/frontend`; the current sim binary is stale, `ExpoGlassEffect`).

| # | Scenario | Expected terminal |
|---|---|---|
| 1 | Invite link, logged out, new email → Accept → signup → onboarding | Member in app; `NORMAL_USER` at register; first-run Home shows live events + invite-✓ callout |
| 2 | Invite link where lookup has no inviter name | Nameless vouch (new-01b); never "undefined invited you" |
| 3 | Invite link while logged in | Already-a-member screen (new-05); no signup |
| 4 | Invite link, account exists, logged out | Flip to login with invite held (new-22); no dead end |
| 5 | Dead/expired code → paste a valid one | new-04 → recovery → Door 1 |
| 6 | Cold visit `/` logged out | Landing with real events at 0 taps; Home tab live (new-30) |
| 7 | Guest RSVP name+email; repeat same email | Confirmed; second attempt → already-on-the-list (new-11b); confirmation email has cancel link |
| 8 | Guest attempts member action | Invite wall (new-12); NO open-signup path anywhere |
| 9 | Existing member logs in mid-RSVP | RSVP completes after login (`returnTo`), no bounce to Home |
| 10 | Onboarding step 3, city with zero centers | onb-3b empty state, Global/Online selectable |
| 11 | Kill app mid-onboarding, relaunch | Resumes onboarding (`_layout` gate); Home never shows nameless member |
| 12 | Complete signup on web → open native app | Web ends at get-the-app (new-23); native first open is plain login (new-24) |

Visual gate: only `#E8862A` accent remains; Inclusive Sans headings; matches `hifi/mock-v2.html` (§A–F).

## Risks

- **Hard-gate enforcement is deferred** (#440 leftover): until it lands, build the invite wall behind the gate flag so open signup keeps working for the local seed.
- **Attribution (#413) not built:** every vouch surface must tolerate a missing inviter name from day one.
