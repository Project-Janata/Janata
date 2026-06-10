# Invite entry flow — the two doors

Design artifacts for the **receiving side** of the invite growth loop: what a person sees from the landing page into the app, across four user states (invited / not-invited / has-account-not-logged-in / auto-logged-in). Sibling to the shipped sender screen in [`../invite-friends/`](../invite-friends/).

Produced via `/refine-design` (capture → IA → lofi → hifi → spec). Start here:

| File | What it is |
|---|---|
| [`spec/design-spec.md`](spec/design-spec.md) | **The handoff spec** — IA tree, change table, copy, redlines, acceptance criteria |
| [`spec/dev-spec.md`](spec/dev-spec.md) | **The build plan** — sequencing vs #440, file-by-file phases, e2e test matrix |
| [`hifi/mock-v2.html`](hifi/mock-v2.html) | **Full-flow hifi** — account creation, 5-step onboarding, landing-vs-Home/Explore, desktop |
| [`hifi/mock-v1.html`](hifi/mock-v1.html) | Core hifi — the two doors + edge states |
| [`ia/ia-options-flow.html`](ia/ia-options-flow.html) | The three IA options as routing diagrams |
| [`capture/inventory-board.html`](capture/inventory-board.html) | What exists today (the baseline) |

## Decisions locked (2026-06-09)

- **Door-routed (intent-first).** The link picks the door; auth is summoned just-in-time at Accept / RSVP / Log in — never a wall at the entrance.
- **Door 1 = one strong screen** (vouch + one-line what-it-is + Accept; extra intro slides optional, not a forced carousel).
- **Door 2 = browse-first, and `landing.tsx` renders logged-out Explore** — reuse, not a new duplicate page. Home stays members-only; Feed stays gated.
- **Invite is the door, not a typed code** — `auth.tsx`'s invite-code step is cut.
- **Account-less RSVP** (name+email) is the low-friction funnel for the not-invited; backed by existing `#191` guest RSVP + `event_guest_rsvps`.
- **Verified at inception** — a valid invite makes you a `NORMAL_USER` at register (backend in #440).
- **Unify the orange** — code uses three (`#ea580c` onboarding, `#C2410C` auth, `#E8862A` token); standardize on the token `#E8862A`.

## Round 2 (2026-06-09, grounded in PR #440 + v2 code)

Eight edge states added as **mock-v2 §E** + spec §10 (code reconciliation). The calls:

- **Invite wall = `AuthPromptModal` state**, not a new page — its open-signup tab dies under the hard gate.
- **Signup stays ONE screen** (matches `auth.tsx`); mock-v2 §A's two-step split is superseded.
- **No deferred deep linking.** Web signup ends in "Get the app" (new-23); first native open is plain login (new-24).
- **new-01b nameless vouch** is the launch default — attribution (#413) isn't built, "undefined invited you" must be impossible.
- **Feed stays a public route, content gets the wall** (new-15); resume + intro behavior already live in `_layout.tsx`.
- One success moment: onb-5. mock-v1's "Welcome, Priya" frame is cut (name doesn't exist yet at that point).
- **Home & Feed logged-out + empty (mock-v2 §F): logged out = live, not walled.** Tabs stay. Home shows REAL events near the picked location + one compact log-in callout (new-30); Feed shows the ghost feed via the existing `FeedEmptyState` — only the guest rail re-copies under the hard gate (new-15). Web logged-out entry stays the landing. First-run Home = SAME live layout, greeting + RSVP-nudge callout are the only deltas (new-32); feed joinCenter = same ghost-feed treatment with one-tap Join (new-33).

## Owns the build

#403 (invite intent / AuthFlowCore / RSVP) · #404 (browse-first logged-out) · #342 (hard gate) · #104 (short-link). This is the design source of truth those issues implement against.

## Tokens

Real values from `packages/frontend/tailwind.config.js` → [`hifi/tokens.json`](hifi/tokens.json). 3D art = Microsoft Fluent Emoji (reuse the onboarding intro art in code).
