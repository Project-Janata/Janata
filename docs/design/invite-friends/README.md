# Invite links — design + decisions (handoff to @theabhiramr)

This folder is the full context for the invite-links feature: the design we landed on, the decisions behind it, what's already built in this PR, and what's left. Owner going forward: **@theabhiramr**. Tracking issue: **#342** (updated to match these decisions).

## Artifacts (open the HTML in a browser)

| File | What it is |
|---|---|
| `design-spec.md` | The implementation spec for the Invite Friends screen (change table, copy, redlines, acceptance). |
| `mock-invite-friends.html` / `02-invite-friends-hifi.png` | Hifi mock of the Invite Friends screen (surface 1) — mobile states + desktop card. |
| `mock-invite-open-flow.html` / `03-invite-open-flow.png` | Hifi mock of what a friend sees after tapping a link (surface 2). Alignment reference for #403, **not built here**. |
| `01-before.png` | The screen before (fake link + fake "8 uses left"). |
| `04-built-mobile.png` / `05-built-desktop.png` | The screen as built in this PR, captured live (real minted link). |

## The model we locked (2026-06-07, Kish + design pass)

1. **Hard invite gate.** The invite link is the door — no valid invite, no account. Retire `PUBLIC-EXPLORE`. (Low-friction path is account-less RSVP, already built; we don't need an unverified-account tier.)
2. **Invited = verified at inception** (Bluesky/Clubhouse). A valid invite promotes the new user to `NORMAL_USER` at register, not at email-verify.
3. **Drop the word "verified" in UI.** In a hard gate every account is verified, so the word has no contrast. Copy is "they get in instantly."
4. **Center-agnostic.** An invite grants **Janata** membership, not membership of a specific center. Redemption sets the level, not `center_id`; the member picks centers normally.
5. **Canonical domain = `chinmayajanata.org`** (path `/i/CODE`) — the link we mint, display, and store. It's already registered for universal links and is the backend's domain. **`janata.app` is a short-link layer on top, not a competing domain:** `janata.app/CODE` links are shareable and behave like a `t.co` wrapper — on mobile they act as a deep link straight into the app; on web they expand/redirect to the matching `chinmayajanata.org/i/CODE` link. So a member can hand out either form and both land in the right place. *Reconcile #104 to this split (canonical = chinmayajanata.org, janata.app = short redirect).*
6. **Surface 1 is minimal:** hero + center-agnostic subtitle + one real link + one Share (Copy on web). No share-via tiles (the native share sheet covers channels). No "generate" step (the member always has one ready link). No invite limit/expiry in the UI (backend keeps the fields).
7. **Leaked-link backstop:** keep an invisible cap (~100 uses) + silent rate-limit — the gate is only as strong as the link's secrecy.
8. **Entry point:** Invite Friends stays in Settings/Account for v1 (expand entry points, e.g. a post-RSVP nudge, later).

## What's built in this PR

- **Invite Friends screen** (`app/settings/invite.tsx`): real minted link via `inviteClient` (`chinmayajanata.org/i/CODE`), single Share/Copy action, no tiles, no fake meta, single header, desktop-centered card, loading + copied states. Verified live (see `04`/`05`).
- **`/i/[code]` route** (`app/i/[code].tsx`): the canonical link target — normalizes the code and hands off into signup with the invite applied (web fallback + the deep-link target).
- **Deep-link path** registered in `app.json` (Android `/i` intent filters; iOS `associatedDomains` already cover the domain).
- **Backend — verified at inception** (`packages/backend/src/app.ts`): a valid invite at `/auth/register` now sets `NORMAL_USER` immediately.

## What's left (for the owner)

- **Hard-gate enforcement:** reject `/auth/register` with no valid invite. Deliberately NOT done here — it would break the local seed script (registers role accounts without codes) and needs a **grandfather migration** for existing open-signup / unverified accounts. Retire `PUBLIC-EXPLORE` as part of this.
- **Invite landing UI (surface 2):** the vouch + reused onboarding intro + signup → owned by **#403** (`AuthFlowCore` invite intent). See `mock-invite-open-flow.html`.
- **No-link / logged-out states (surface 3):** owned by **#404**.
- **`/i/CODE` web landing page** for people without the app installed (currently the route serves the app's web build; confirm the fallback).
- **Canonical share URL alignment:** backend currently mints `chinmayajanata.org/join?code=`; align it to `/i/CODE` so screen, share, and backend agree.
- **Server-side attribution:** persist inviter→invitee for the post-MSC vouching system + abuse tracing.
- **Native share message copy:** define what the share sheet pre-fills.
- **Short-link layer (`janata.app`):** wire `janata.app/CODE` as a redirect/deep-link wrapper over the canonical `chinmayajanata.org/i/CODE` link (t.co-style) — deep link on mobile, 301/expand to the full link on web. Shareable in its own right.
- **Reconcile #104** to the canonical/short-link split: canonical = chinmayajanata.org, janata.app = short redirect (the issue still treats janata.app as the primary domain).

Full session artifacts (sketches, IA options, all mock versions): `~/.gstack/projects/Project-Janatha-Project-Janatha/refine/20260607-191425-invite-links-flow/`.
