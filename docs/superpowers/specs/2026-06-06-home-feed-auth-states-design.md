# Browse-first Home & Feed states + unified auth surface — design

**Date:** 2026-06-06
**Branch:** `KishParikh13/plan-empty-logged-out-states` (target `origin/v2`)
**Issues:** #403 (unify auth into an in-context modal/sheet surface), #404 (complete browse-first Home and Feed state redesign)
**Design source:** Claude Design bundle `project-janata-design-system` (chat6 "Homepage & Feed Redesign"); iterated in `.context/home-feed-auth-mockups.html` and `~/.gstack/projects/Project-Janatha-Project-Janatha/designs/` (guest-simplify-20260606, firsttime-ia-20260606).

## Summary

Two PRs, sequenced. PR 1 extracts one auth surface (#403) and is the foundation. PR 2 rebuilds Home and Feed across every login/membership state on top of it (#404). A third PR polishes desktop. The product model is browse-first with two decoupled tiers: **anyone can RSVP to an event account-free** (name + email, + birthdate when age-gated), while **a full account is invite-gated and requires the complete profile**. Guests roam real content and only commit when they act.

## Locked decisions

1. **Sequencing:** PR 1 (#403 auth surface) first, then PR 2 (#404 states). Separate PRs.
2. **Platform scope:** phone + mobile-web built faithfully now; desktop functionally correct in PR 2; desktop visual polish is a later PR 3.
3. **Auth architecture:** one headless `AuthFlowCore` lifted from today's `AuthPromptModal`/`auth.tsx`, hosted four ways — **sheet** (mobile interrupt), **modal** (desktop interrupt), **page** (`/auth` deep-link/fallback), **inline** is NOT used on mobile (see #5).
4. **Guest model:** the tab bar/nav stays for guests; auth is mandatory only at a locked action. *What* a guest sees diverges by platform (decision 13).
5. **No standing auth cards on mobile (native).** On the native app, guest Home shows real content with "Sign in" in the nav slot; auth appears solely as the bottom **sheet**. The website uses a marketing Landing page + a right-rail/CTA model instead (decision 13).
6. **Information architecture:** **Explore** is the real public browse surface (events, map, RSVP) — on the website it is the default logged-out app surface; on native it is a tab. **Home** is events-first (a carousel) but ghosts for website guests; **Feed** is a personalized surface that **ghosts for all logged-out users** (no public feed shown to guests anywhere). Rejected: center-first guest Home (duplicates Explore), unified Home+Feed stream (#404 keeps them separate), public-stream guest Feed (dropped — see decision 13).
7. **One event format:** a single flyer **event card** (photo + date chip + title + city + optional going-faces + RSVP→Going state), shown in a horizontal **carousel** on Home and stacked/gridded elsewhere. No second event presentation.
8. **Center rows show the center photo** (with initials fallback), not a pin icon.
9. **Sign in lives in the nav slot** where the profile avatar sits: avatar when signed in, "Sign in" pill when signed out, on both Home and Feed.
10. **Invite links** are handled by the same `AuthFlowCore` with an invite intent (see PR 1).
11. **Two decoupled tiers: account-less RSVP vs HARD invite-gated account.**
    - **RSVP is account-less and minimal.** Anyone 18+ can RSVP with name + email. No password, no account, no invite. Recorded against the email; auto-links to an account later if one is created. **Already supported by the backend** (`POST /attendEventGuest` + `event_guest_rsvps` + `upgradeGuestRsvpsForUser`, #191) — the frontend just needs to call it instead of showing a sign-in wall (`events/[id].tsx:638`).
    - **A full account is HARD invite-gated.** No valid invite → no account (not the soft/optional gate in `app.ts:361` today). Invite **link is the common path** (pre-fills code + center); **manual invite-code entry is the fallback**. Account creation requires the complete profile (name, birthdate, home center, interests). Membership unlocks posting, replying, boards, following a center, the full feed. Returning members log in normally.
    - This supersedes any "deferred onboarding" idea: onboarding is full and required *for account creation*; RSVP simply does not need an account.
12. **First-launch intro carousel (`/intro`, `IntroPager`) stays as-is** — the native first-run explainer is unchanged and out of scope for these PRs. It is separate from profile onboarding.
13. **Logged-out experience diverges: website vs native app.**
    - **Website (desktop web + mobile web):** a cold/root open lands on the **marketing Landing page** (`app/landing.tsx` re-wired to render the existing `components/landing/*`: hero + a few real upcoming events + CTA). **Explore** is the default browse surface and the Landing CTA target — guests see real events and RSVP there. **Home** shows a few real upcoming events, then **ghost** cards + a clear CTA. **Feed** is **pure ghost + CTA**. Shared **event/center deep links open directly** (RSVP in one tap); Landing only intercepts the bare root.
    - **Native app (iOS/Android):** unchanged from the browse-first design — intro carousel → **browse-first Home** (real events carousel). No marketing Landing on native. **Explore** is a tab. **Feed still ghosts for guests** (no public feed on native either).
    - The marketing Landing components already exist in the repo but `app/landing.tsx` was gutted to a redirect; this re-wires it. This intentionally breaks the earlier "equivalent across all surfaces" goal: the website is a shareable, SEO-indexed marketing+browse surface; the native app is an installed browse-first app.
14. **Global 18+ age gate, asked once.** 18+ is required to RSVP or to create a profile (not per-event). Date of birth is asked **once**: at profile onboarding (the `users.date_of_birth` column already exists), or on the account-less RSVP sheet **only if there is no profile to read it from**. A guest RSVP's DOB carries to the profile on upgrade, so it is never asked twice. No per-event age field.

## User journeys (two decoupled paths)

**Where a guest enters (decision 13):** on the **website**, a cold root open hits the **Landing** page (understand + value), whose CTA leads to **Explore** (real events + RSVP); Home shows a few real events then ghosts, Feed is ghost. On **native**, the intro carousel leads to the **browse-first Home** (real events carousel), with Explore as a tab. Feed ghosts for guests on both. Shared event/center links open directly on every surface. From any of these, the two action paths below are the same, and the auth tiers kick in when a guest acts.

### Path 1 — Attend (account-less RSVP)
1. Guest taps **RSVP** on an event → a **short RSVP sheet** (not the auth flow): name + email, plus date of birth only when the event is age-gated.
2. Submit → **RSVP confirmed**, no account. The guest keeps browsing; their RSVP'd events show on Home as "Going."
3. To do anything social (post, reply, follow a center, join a board), they hit the account path. A light cue explains membership is invite-based.

### Path 2 — Join (invite-gated account)
1. Guest taps a member action (post / reply / join board / follow center) or opens an **invite link** → the **auth surface** opens.
2. **Invite required:** an invite link pre-fills the code (and inviting center); otherwise they enter an invite code. No invite → they can request one, but cannot create an account.
3. Email → set password → **full onboarding** (name, birthdate, home center, interests). An invite link pre-sets the center step.
4. Account created → land on Home as a member; any pending action resumes. Returning members: Sign in → password → resume (no onboarding).

## PR 1 — #403: the shared auth surface

**Goal:** one auth flow, four hosts, opened from anywhere by a single call. Remove per-screen modal wiring.

### Two surfaces, deliberately separate
Because RSVP and account creation are decoupled (decision 11), there are two entry surfaces, not one:

**A. `RsvpSheet`** (new, lightweight, account-less). The fast path. Fields: name + email, plus date of birth only when the event is age-gated. Submits an account-less RSVP keyed by email. NOT the auth state machine — no password, no invite, no login. Hosts as a sheet (mobile) / modal (desktop). This is what an event's RSVP button opens.

**B. `AuthFlowCore`** (new, headless + form) — account creation + login only. Lifted from `components/ui/AuthPromptModal.tsx` and `app/auth.tsx`. States: `initial(email) → login | signup`, with `email/password/confirm`, validation, `useUser().login/signup`, and `checkUserExists` to auto-route returning vs new. **Signup requires an invite code** (drop the open `PUBLIC-EXPLORE` default); new accounts then run the **full onboarding** (name, birthdate, center, interests) and only complete once the profile is done. Renders form + copy; framing-agnostic.

- **Hosts** wrapping the core (shared by both surfaces):
  - **Sheet** — mobile + mobile-web. Bottom sheet using the plain RN `Modal` slide-up pattern `components/boards/CreatePostSheet.tsx` already uses (no new dependency).
  - **Modal** — desktop. The existing two-pane centered overlay (Swami image + form) from `AuthPromptModal`, kept.
  - **Page** — `app/auth.tsx` refactored to host `AuthFlowCore`, preserving deep links and route guards.
- **`AuthPromptProvider` + `openAuth(intent, opts)`** mounted once in `app/_layout.tsx`. Picks sheet vs modal by platform/width. `intent: 'rsvp'` opens `RsvpSheet`; all other intents open `AuthFlowCore`. `opts`: `returnTo`, `pendingAction`, `inviteCode`, `event` (for RSVP age-gate + record).
- **Intents** → copy map: `rsvp` (RsvpSheet, "Save your spot.") · `compose | reply | feed | center | generic` (AuthFlowCore account path, invite-gated, "Join your sangha.") · `invite` (AuthFlowCore with invite chip + pre-filled code/center).

### Account = invite-gated
`signup` now demands a valid invite code: pre-filled by an invite link, or entered in the flow. No invite → a "membership is invite-only" state with a way to request one; no account is created. Returning members log in normally. This formalizes the codebase's existing invite-code path (`extractInviteCode`, the `invite-code` step in `auth.tsx`).

### Pending action + resume
Generalize the existing `utils/centerPickerStore` pattern into a `pendingAction` carried through the account path: `{ kind: 'join-center' | 'compose' | 'reply', payload }`. On account-created/login success (after full onboarding for new accounts), the pending action runs. RSVP is not a pending action — it completes inline in `RsvpSheet` without an account.

### Invite links
An invite link (`/auth?inviteCode=…` / deep link) drives `AuthFlowCore` with `intent: 'invite'` and a pre-filled code:
- **Signed out:** sheet shows the invite chip (inviting center photo + "Anand R invited you to join"), runs email → password, validates the code via `signup(email, password, inviteCode)`, then runs full onboarding with the **center step pre-filled** from the invite.
- **Signed in:** no auth — a one-tap "Join this center?" confirm that applies membership (and any verification the invite grants) via `updateProfile`.
- Password reset stays route-based (`/auth/forgot`).

### Migration
Move these from local `AuthPromptModal` + `useState` to `openAuth(intent)`: `app/(tabs)/index.tsx`, `app/(tabs)/feed.tsx`, `app/(tabs)/explore.web.tsx`, `app/events/[id].tsx`, `app/events/[id].web.tsx`. Leave the ~10 whole-route guards that `router.replace('/auth')` (settings, profile, onboarding, notifications, layout) as-is — those gate protected routes, not ordinary locked actions.

### Acceptance (#403)
- Tapping an event's RSVP opens the **account-less `RsvpSheet`** (name + email, + DOB when age-gated); submitting confirms the RSVP with no account, no invite.
- Account creation is **invite-gated**: no valid invite → no account; an invite link pre-fills the code. New accounts run full onboarding before completing.
- Login/account flows complete in place: modal on desktop, sheet on mobile/mobile-web.
- `/auth` still works for deep links and route guards; password reset stays route-based.
- No duplicated auth state machines remain in separate prompt components.
- Invite links: signed-out runs the flow with the code + center pre-filled in onboarding; signed-in is a one-tap join.

## PR 2 — #404: browse-first Home and Feed states

Built on PR 1's surface. One stable Home spine across states; one event card; persistent feed hint; card-free mobile guest.

### Home spine (every state, same order)
`nav (Sign in / avatar) → greeting → setup card (only when there is a step) → Up next (event carousel) → From the feed (peek)`. The setup card adapts and disappears once the user is settled.

- **Guest, browsing — native app:** display headline "Find your center. Grow together." → "Near you" real event carousel → "From the feed" locked peek. Tab bar present. Tapping RSVP → `RsvpSheet`.
- **Guest, browsing — website:** a few real upcoming events, then **ghost** event cards + one clear CTA ("Explore all events" / "Get an invite"). The website's real browse surface is **Explore**, not Home; the root cold open is **Landing** (decision 13).
- **Guest who has RSVP'd (account-less):** same Home, but RSVP'd events read "✓ Going"; the social cue reads "Membership is invite-only" with a request-an-invite affordance (no center setup card — they have no account).
- **Member, has center, calendar empty:** setup card = "Your calendar is open" hero (first-RSVP nudge) → "From your center" carousel (with going-faces) → feed peek.
- **Member, settled:** no setup card → carousel (RSVP flips to "✓ Going") → feed peek.
- **Member, no center:** rare — only if onboarding's center step was skipped. Setup card = "Pick your home center" with **center rows (center photo, name, city·distance, Join)**. Since account onboarding requires the full profile, most members already have a center.

### Event card (the one format)
Photo (real event image) + white date chip (`AUG 15`) + title (2-line clamp) + city line + optional going-faces ("12 going") + trailing RSVP pill that becomes a green "✓ Going". Carousel on Home; stacks on desktop (2-up grid). Reuse/refactor `components/home/FeaturedEventCard`, `MiniEventRow` into this single card.

### Feed states
- **Guest (signed out), all surfaces:** **pure ghost + CTA.** No public feed is shown to logged-out users anywhere. Ghost post skeletons behind a clear "Join with an invite to see your sangha's feed" CTA (and on the website, this is mostly reached only by direct navigation, since Explore is the browse surface).
- **Signed in, warming up:** compose bar → "Your feed is warming up" hero → real cross-mission posts so it is never blank.
- **Signed in, active:** existing feed (posts from every center + boards for RSVP'd events). Polish post cards: group chip with colored icon, event-post flyer image, reaction pills, reply affordance.

### Landing (website, decision 13)
Re-wire `app/landing.tsx` to render the existing `components/landing/*` (Hero, ProblemSection, AppPreview, CommunitySection, FinalCTA, Footer), refreshed to: hero + a few **real** upcoming events + primary CTA "Explore events" (→ `/explore`) + secondary "Get an invite / Sign in". Route the bare logged-out root to it; leave deep links (`/events/:id`, `/center/:id`) opening directly.

### Data / behavior
- **No public feed for guests** — guest Feed renders ghosts only; do not fetch posts when logged out.
- Home/Explore/Landing guest event lists use `useDiscoverData` events near the user (no auth required).
- Account-less RSVPs are keyed by email (see RSVP feasibility section); Home/Explore reflect "Going" for the guest's RSVP'd events. Center is required in account onboarding, so member "no center" is a rare fallback.

### Platform (decision 13)
- **Native (iOS/Android):** browse-first Home (real carousel), Explore tab, Feed ghost for guests, auth sheet. Built faithfully now.
- **Website (desktop + mobile web):** Landing at root → Explore default browse → Home (few real + ghost + CTA) → Feed ghost. Functionally correct now; desktop pixel polish in PR 3.

### Acceptance (#404)
- **Native:** guest Home is the real browse-first carousel; guest Feed is ghost + CTA; locked actions open the sheet/RsvpSheet, not `/auth`.
- **Website:** root cold open shows Landing; Explore is the default browse surface with account-less RSVP; Home shows a few real events then ghost + CTA; Feed is ghost + CTA.
- Shared event/center deep links open directly on every surface.
- No public feed is shown to any logged-out user.
- No heavy 3D icon use beyond onboarding/welcome/landing.

## PR 3 — desktop visual polish (later)
Pixel-level desktop refinement of Home and Feed across states once phone is locked.

## Non-goals
- No Home/Feed merge (keep the tabs separate).
- No center-discovery on guest Home (that is Discover + the setup card).
- No redesign of Discover, event detail, or onboarding internals beyond what the auth/invite resume requires.
- No new color or icon system; warm palette, one terracotta orange (#C2410C), Lucide icons, pill buttons per the design system.

## Backend feasibility (verified against `packages/backend/src`)
- **Account-less RSVP — already built.** `POST /attendEventGuest` (#191, rate-limited, no auth), table `event_guest_rsvps(event_id, email, name)`, and `upgradeGuestRsvpsForUser` (backfills `event_attendees` + stamps `upgraded_user_id` on signup). The open-RSVP funnel and the link-on-join are done. **Gap: the frontend doesn't use it** — `events/[id].tsx:638` shows a sign-in wall for guests. PR 2 wires `RsvpSheet` → `/attendEventGuest`.
- **Invite system — exists, but gate is currently SOFT.** `inviteCodes.ts` (validate/consume/mint/admin) + verification levels (`UNVERIFIED_USER 30 → NORMAL_USER 45 → SEVAK 54`) are built and wired into `/auth/register`, but **signup is invite-optional today** (`app.ts:361`); invite only bumps the tier at email-verify. **Change for hard gate:** require a valid invite in `/auth/register` (reject otherwise), drop the `PUBLIC-EXPLORE` open default, and decide what happens to existing open-signup accounts. Small, well-supported change.
- **Age gate — net-new but small.** `users.date_of_birth` exists; events have no age field and guest RSVP captures only name+email. Add: a DOB column on the guest-RSVP path + a global 18+ validation at RSVP (when no profile) and at onboarding. No per-event age field.

## Other risks / open items
- Sheet host on native must handle the keyboard (KeyboardAvoidingView) like `CreatePostSheet`.
- `pendingAction` resume after full onboarding needs the store to survive the onboarding round-trip, same mechanism as `centerPickerStore` today.
- "Request an invite" path so guests who RSVP'd but have no invite are not dead-ended.
- Existing open-signup accounts (created under the soft gate) need a migration/grandfather decision when the hard gate lands.

## Growth loop (from the approved journey map)
Vetting and spread are one loop: account-less RSVP is the wide top of funnel (events spread to anyone, captured by email, auto-linked on join), while accounts stay curated (hard invite gate). Every member mints/shares invites, so membership grows only through vetted people. Design principle from the emotion curve: **the RSVP peak stays wall-free** (account-less); invite + profile friction sits in the valley *after* the payoff. Strongest growth spark to consider: a **post-RSVP "invite who's coming with you"** nudge. Journey artifact: `~/.gstack/projects/Project-Janatha-Project-Janatha/refine/*-onboarding-spread-journey/journey/journey-map.html`.
