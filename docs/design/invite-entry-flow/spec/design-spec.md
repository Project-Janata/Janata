# Design spec — invite-entry-flow (the two doors)

**Session:** `~/.gstack/projects/Project-Janatha-Project-Janatha/refine/20260609-invite-entry-flow/`
**Platform:** React Native Expo (iOS) + web (expo-router)
**Repo:** `packages/frontend` (macau worktree, off `v2`)
**Owns the build:** #403 (invite intent / AuthFlowCore / RSVP), #404 (browse-first logged-out), #342 (hard gate), #104 (short-link). This spec is the design source of truth those issues implement against.

## 1. Summary

The receiving side of the invite growth loop — what a person sees from the landing page into the app. IA principle: **door-routed (intent-first)**. The link picks the door; auth is summoned just-in-time at the commit moment, never as a wall at the entrance.

What changes structurally:
- **Two purpose-built doors replace one funnel.** Door 1 = invite landing (vouch + one strong screen). Door 2 = browse-first landing. Today everyone funnels into `auth.tsx` (email → invite-code → signup).
- **The invite becomes the door, not a typed code.** `form-03` (invite-code step) is cut. A valid invite link lands on a vouch screen and pre-applies the code.
- **`landing.tsx` renders logged-out Explore — reuse, not a new page.** Home is personalized (useless logged-out); Explore is already guest-browsable; Feed stays gated. The landing = Explore's map + events + centers with logged-out chrome (logo, Log in, Have an invite?) + a one-line value strip.
- **Auth fires only at Accept / RSVP / Log in.** The cold visitor sees real events at zero taps; account-less RSVP (name+email, backed by `#191`) is the low-friction funnel; the invited get a verified account at inception.
- **Four user states each get a purpose-built path** (invited / not-invited / has-account-not-logged-in / auto-logged-in) — see the flow diagram in `ia/ia-options-flow.html`.

## 2. Before / after

- **Before:** `capture/inventory-board.html` — no landing (blank redirect), no vouch, everyone in one `auth.tsx` funnel.
- **After (core):** `hifi/mock-v1.png` — the two doors with real tokens.
- **After (full flow):** `hifi/mock-v2.png` — account creation, full onboarding, landing-vs-Home/Explore, desktop.
- Notice: the vouch moment ("Anand invited you") at the top of Door 1, and Door 2 leading with real events under a location pill instead of an email field.

## 3. Approved IA tree

```
root · entry routing
├─ Door 1 · invite landing (chinmayajanata.org/i/CODE)        states: invited, auto-logged-in
│  ├─ new-01  vouch banner — "Anand invited you to Janata"
│  │            └─ new-01b fallback "You're invited to Janata" (resolver has no inviter name pre-#413)
│  ├─ new-02  one strong hero (3D art + one-line what-Janata-is; extra slides optional)
│  ├─ new-03  Accept invite (primary) + Already a member? Log in (ghost)
│  ├─ create-account → new-20/21 ONE screen: email + password + confirm + strength (matches auth.tsx signup; invite pre-applied, verified at inception)
│  │            ├─ new-22 email already registered → flip to login, invite + returnTo held
│  │            ├─ onb-1 name · onb-2 birthday · onb-3 center (onb-3b empty state) · onb-4 interests · onb-5 complete → Home
│  │            └─ web only: new-23 get-the-app handoff → App Store → new-24 first native open = plain login
│  ├─ new-04  invalid/expired → paste a link / request one (error-copy variant of new-25)
│  └─ new-05  auto-logged-in → one-tap Join / open app (NO signup; replaces invite/[code].tsx silent redirect)
└─ Door 2 · browse-first landing = logged-out Explore (chinmayajanata.org)   states: cold, not-invited, existing-not-logged-in
   ├─ new-14  one-line value strip ("Find Chinmaya events & centers near you")
   ├─ new-10  real events + centers near you + location pill (Explore's map/list/pill, logged-out)
   ├─ new-11  tap event → detail → RSVP → name+email only (account-less; #191 backing)
   │            └─ new-11b same email again → "You're already on the list" (dedupe, cancel via email)
   ├─ new-12  tries member account → invite wall = AuthPromptModal state (RSVP / paste invite / log in)
   ├─ new-13  Log in (existing member) → in-context login → resume pending action
   ├─ new-15  feed logged out → FeedEmptyState guest variant, hard-gate rail copy (route public, content ghosted)
   ├─ new-25  Have an invite? → neutral paste screen (shared UI with new-04)
   └─ new-30  logged out, tabs stay → Home = LIVE events near location + compact callout · Feed = ghost feed + guest rail (new-15)
      └─ after join: new-32 Home Get-connected checklist · new-33 feed joinCenter (existing states, re-copy)
```

## 4. Change table

| ID | Label | Verdict | From | To |
|---|---|---|---|---|
| state-01 | landing blank redirect → /auth | **move** → new-10 | `app/landing.tsx:9` | `landing.tsx` renders logged-out Explore |
| blk-01 | auth funnel container | **keep** (restructured) | `app/auth.tsx:31` | retained for login + create-account steps only |
| nav-01 | Janata wordmark | keep | `auth.tsx:303` | both doors' headers |
| nav-02 | "Discover →" link | **merge** → new-10/new-13 | `auth.tsx:259` | replaced by browse-first landing + Log in/Have-invite |
| act-01 | Back | keep | `auth.tsx:285` | step navigation |
| copy-01 | heading (swaps per step) | keep | `auth.tsx:313` | per-screen headings |
| blk-02 | 3 generic benefit bullets | **cut** | `auth.tsx:325` | replaced by door-specific heroes (new-02) |
| copy-02 | subtitle | keep | `auth.tsx:339` | per-screen sublines |
| form-01 | email field | keep | `auth.tsx:366` | login detection + new-20 |
| form-02 | password (login) | keep | `auth.tsx:375` | new-13 login |
| form-03 | invite-code typed step | **cut** | `auth.tsx:387` | invite is the door (new-01..03) |
| form-04 | password+confirm+strength | **move** → new-21 | `auth.tsx:400` | create-account password step |
| act-02 | primary button | keep | `auth.tsx:427` | all CTAs |
| act-03 | Forgot password? | keep | `auth.tsx:443` | new-13 login |
| copy-03 | Terms / Privacy footer | keep | `auth.tsx:454` | account-creation footer |
| state-02 | error block | keep | `auth.tsx:354` | all forms |
| state-03 | loading on button | keep | `auth.tsx:429` | all CTAs |
| act-04 | dev/demo tools | keep (out of scope) | `auth.tsx:474` | unchanged |
| new-01 | vouch banner | **add** | — | Door 1 + create-account + auto-logged-in (#403) |
| new-02 | one strong hero (3D art) | **add** | — | Door 1 (#403); reuse onboarding intro art |
| new-03 | Accept + Already-a-member | **add** | — | Door 1 (#403) |
| new-04 | invalid/expired invite | **add** | — | invite resolver (#403, extends `app/invite/[code].tsx`) |
| new-05 | auto-logged-in → join/open | **add** | — | invite resolver (#403; #440 has the base redirect) |
| new-10 | browse-first events/centers | **add** | — | `landing.tsx` = logged-out Explore (#404) |
| new-11 | account-less RSVP | **add** | — | event detail (#403; backend `#191` + `event_guest_rsvps` exist) |
| new-12 | invite wall | **add** | — | triggered when a guest attempts a member account (#404) |
| new-13 | Log in / Have an invite? | **add** | — | landing footer + bar (#403/#404) |
| new-14 | value strip | **add** | — | landing top (#404) |
| new-20 | create-account email step | **add** | — | account creation (#403) — ONE screen with new-21, matching `auth.tsx` signup; mock-v2 §A's two-step split is superseded |
| new-21 | password + confirm + strength | **add** (absorbs form-04) | — | same screen as new-20 |
| onb-1..5 | onboarding 5 steps | **keep** (re-skin to token) | `app/onboarding.tsx` + `components/onboarding/*` | existing screens, unify orange |
| new-01b | vouch banner, no inviter name | **add** | — | Door 1 fallback until #413 attribution returns a name (#403) |
| new-12 | invite wall | **redefine** | `components/ui/AuthPromptModal.tsx` | NOT a new page — replaces the modal's open-signup tab under the hard gate (#404) |
| new-15 | logged-out feed = FeedEmptyState guest variant, hard-gate copy | **redefine** | `components/feed/FeedEmptyState.tsx` (guest) | route stays public (`_layout.tsx:231`); keep GhostFeed + setup rail; the sign-up step becomes Log in / paste an invite (#404) |
| new-22 | email-collision → login | **add** | — | new-20 email matches existing account → flip to login, invite + returnTo held (#403) |
| new-23 | get-the-app handoff (web) | **add** | — | after onb-5 on web; makes deferred deep linking unnecessary (#403) |
| new-24 | first-native-open login | **add** | — | app's first open after web signup = plain login, email prefill if possible (#403) |
| new-25 | neutral paste-invite screen | **add** | — | target of every "Have an invite?"; new-04 is its error-copy variant (#403/#404) |
| new-11b | guest RSVP dedupe | **add** | — | same email RSVPs again → already-on-the-list state (#403; backend `#191`) |
| onb-3b | center step empty state | **add** | `components/onboarding/step3.tsx` | no centers near typed city (true for all of India) → Global/Online chip + skip |
| home-guest | guest Home (Namaste + `SignInCallout` + stripped content) | **keep — goes live** (becomes new-30) | `app/(tabs)/index.tsx:188` | logged-out Home shows REAL events near the picked location, not stripped content (#404) |
| new-30 | logged-out live Home | **add** | — | Namaste (no name) + location pill + Happening near you + centers + ONE compact log-in callout; tabs stay. Also the App Store reviewer's first screen (#404) |
| new-32 | Home first-run | **keep** (re-copy) | `app/(tabs)/index.tsx:154` (isNewUser) | SAME live layout as new-30 — greeting gains name + center, callout becomes the RSVP nudge ("You're in through Anand's invite ✓"). No checklist dashboard, no empty Up Next |
| new-33 | feed joinCenter + firstPost states | **keep** (reskin) | `components/feed/FeedEmptyState.tsx` | same ghost-feed treatment as new-15; the rail nudge becomes one-tap Join for the nearest center |

## 5. Copy table (NEW-COPY)

| ID | New copy | Where |
|---|---|---|
| new-01 | "Anand invited you to Janata" | vouch banner (inviter name dynamic) |
| new-02 | "Find your center. Grow together." / "Discover events near you and connect with your sangha beyond the group chat." | Door 1 hero (reuses onboarding intro slide copy) |
| create-account | "Anand's invite applied. You're a member the moment you finish." | applied bar |
| new-20 | "What's your email?" / "We'll use it to sign you in." | email step |
| new-21 | "Create a password" / "At least 8 characters." | password step |
| new-04 | "This invite isn't active" / "The link may have expired. Paste a fresh invite, or ask a member for one." | invalid state |
| new-05 | "You're already a member" / "No need to sign up again." | auto-logged-in |
| new-11 | "You're going to [event]" / "Just your name and email. No account needed." | quick RSVP |
| new-11 nudge | "Want the full app? Members join Janata by invite. Ask a member to send you one." | post-RSVP nudge |
| new-12 | "Janata is invite-only" / "Members join through a friend's invite." + "RSVP to events without an account" (primary) / "Have an invite? Paste it" (secondary) / "Already a member? Log in" (ghost) | invite wall |
| new-14 | "Find Chinmaya events & centers near you." | landing value strip |
| onb-* | (verbatim, unchanged) "Welcome to Janata!" · "When's your birthday?" · "Choose your center" · "What are your interests?" · "Begin your spiritual journey now" | onboarding |
| new-01b | "You're invited to Janata" | vouch fallback, no inviter name |
| new-22 | "You already have an account" / "Log in and we'll apply the invite to it." + applied bar "Anand's invite applied. Held while you log in." | email collision |
| new-23 | "You're in" / "Janata lives on your phone. Get the app and log in." + "Continue on web" | web post-onboarding |
| new-24 | "Welcome back" / "Log in with the account you just created." | first native open |
| new-25 | "Have an invite?" / "Paste your invite link or code." + "No invite? Browse events" | paste screen (neutral) |
| new-11b | "You're already on the list" / "We sent your confirmation to [email]. Can't make it? Cancel from that email." | guest RSVP dedupe |
| new-15 | "Join the conversation" + steps "1 Log in — or paste a friend's invite · 2 Join your center's boards · 3 Say hello" + "Or RSVP to events without an account" | logged-out feed (guest rail) |
| new-32 | "Namaste, Priya" + "Happening near you" + callout "You're in, through Anand's invite" / "RSVP to your first event, then say hello on your center board." | Home first-run (same live layout as new-30) |
| new-33 | "Join a center to unlock its boards" / "[Center] · 2.3 mi · 142 members" + Join + "Not now — browse events instead" | feed joinCenter (same ghost-feed layout as new-15) |
| new-30 | "Namaste" (no name) + "Happening near you" + callout "Make Janata yours" / "Log in or paste an invite to RSVP and join boards." | logged-out live Home |
| onb-3b | "No centers near you yet. Janata is growing. Pick Global for now, or skip." + chip "Global / Online" | center empty state |
| copy-03 | "By continuing you agree to the Terms and Privacy Policy." | under every create-account CTA (was missing from round-1 mocks) |

## 6. Redlines (tokens — source: `packages/frontend/tailwind.config.js`)

When in doubt, match `hifi/mock-v2.html`.

- **Accent (primary):** `#E8862A`, press `#D97520`, soft `#FFF7ED`. Primary buttons: solid `#E8862A`, white text, radius 13, shadow `0 6px 16px rgba(232,134,42,.28)`.
- **Surfaces:** bg `#F5F5F4`, card `#FFFFFF`, panel `#F7F4EF`, bgStrong `#F0EDE8`. Border `#E7E5E4`, outline `#D6D3D1`.
- **Text:** `#1C1917` / soft `#44403C` / muted `#78716C` / faint `#A8A29E`.
- **Success:** `#059669` (the "you're in" check).
- **Type:** display = Inclusive Sans (headings, hero, section labels); UI = Inter (body, buttons, fields); mono = ui-monospace (URL bar).
- **Vouch banner:** soft `#FFF7ED` bg, border `#F4DEBE`, avatar gradient `#FBB36A→#D97520`.
- **3D art:** Microsoft Fluent Emoji (compass = Door 1 hero, diya = auto-logged-in, worldmap = invite wall) — `hifi/assets/`. Reuse the real onboarding intro art in code.
- **Icons:** Lucide (`map-pin`, `chevron-down`, `calendar`, `search`, `building`, `check`). No emoji as icons.
- **Touch targets ≥44px; field height 46–47px; card radius 14–16; pill radius 20.**
- **⚠ Orange unification:** code uses three oranges — onboarding `#ea580c` (`onboarding.tsx:32`), auth inline `#C2410C` (`auth.tsx:265,332`), token `#E8862A`. Unify all on the token `#E8862A`.
- **⚠ Contrast:** white 15px text on `#E8862A` is ≈2.5:1 (the deleted `#C2410C` passed AA). Conscious call: token stays for fills; keep button labels ≥600 weight, and prefer `#D97520` (press) for any text-bearing surface where AA matters. Body text on orange is banned.
- **Hero dots:** Door 1 keeps the 3 intro slides (swipeable) — universal links skip `/intro`, so Door 1 is the only place an invited user ever sees the pitch. If slides 2–3 are cut at build time, drop the dots too.
- **onb-2 birthday + minors:** Bala Vihar's audience includes kids. Before collecting DOB, decide a minimum age and the under-age behavior. Step stays optional (right default); don't make it required without that decision.

## 7. States

- **state-02 error / state-03 loading:** keep current behavior on every form (red error block, button spinner).
- **new-04 invalid/expired invite:** resolver detects dead code → recovery screen with paste-a-link field; never dumps silently into signup.
- **new-05 auto-logged-in:** resolver detects session → no signup ever; one-tap join if there's something to redeem, else open app.
- **Door 2 empty/location-unknown:** if location can't be resolved, the pill falls back to "Popular this week" rather than an empty list.
- **RSVP resume (Condition 3):** a pending RSVP must survive the in-context login and complete after — don't bounce to Home. (`AuthPromptModal` already carries `returnTo`; reuse it.)
- **new-22 email collision:** new-20 email matches an existing account → flip to login with `inviteCode` + `returnTo` held; never a dead-end error. If the existing account is a grandfathered open-signup account, a consumed invite upgrades it to `NORMAL_USER`.
- **new-01b no inviter name:** if the invite lookup can't return `inviterFirstName`, every vouch surface (Door 1, applied bar, new-05) drops to the nameless copy. Door 1 must not render "undefined invited you".
- **Invite link, account exists, logged out:** re-clicking a consumed invite when its account already exists routes to login ("You already joined. Log in."), not new-04's dead-invite copy.
- **Onboarding resume:** already enforced — `_layout.tsx:248` forces any authed incomplete profile back to `/onboarding`. Name (step 1) is the gate; steps 2–4 stay skippable.
- **onb-3b no centers:** empty result on the city search → "No centers near you yet" + Global/Online chip + skip. Never a bare empty list.
- **new-11b guest dedupe:** same email RSVPs to the same event → already-on-the-list response; cancel happens via the confirmation email (guests have no session).
- **new-15 logged-out feed:** route stays public; the GHOST FEED is the content (no real post text readable). Reuse `FeedEmptyState`'s guest state; only the rail copy changes (no open signup). Primary = Log in (the likeliest logged-out feed visitor is an existing member), secondary = paste invite, escape = guest RSVP. Compact rail, never a full-screen wall.
- **new-30 Home logged out (web + iOS):** as close to live as possible. Tabs stay. Home renders real events + centers near the visitor — location from the pill or geo, "Popular this week" fallback shared with Door 2 — plus ONE compact log-in callout. Personalized rows (Up Next, greeting name, role) need login; everything else is live. Web logged-out ENTRY stays the landing (locked decision); the live Home is the native Home tab.
- **new-32 Home first-run:** identical layout to new-30 — live "Happening near you" events immediately. Only deltas: greeting gains name + center, and the compact callout becomes the RSVP nudge with the invite pre-checked ("You're in, through Anand's invite ✓"). No checklist dashboard, no dashed empty card; the events ARE the call to action. Callout self-dismisses after first RSVP (existing isNewUser behavior).
- **new-33 feed joinCenter / firstPost:** same ghost-feed treatment as new-15; the rail nudge becomes one-tap Join for the nearest center (inherits onb-3b's no-centers fallback). firstPost unchanged.

## 8. Acceptance criteria

- [ ] Structural: invite link → Door 1 vouch screen (not the generic funnel); cold open → Door 2 browse landing with events visible at 0 taps.
- [ ] `landing.tsx` renders logged-out Explore (map + events + centers), NOT a separate marketing page; logged-out Home is the LIVE guest Home (new-30), never a wall or a redirect loop.
- [ ] Invite-code typed step (`form-03`) is gone; a valid link pre-applies the code and the account is `NORMAL_USER` at register (verified at inception — #440 backend).
- [ ] Account-less RSVP works name+email with no password/account (uses `#191` guest RSVP + `event_guest_rsvps`).
- [ ] All four user states reach the correct terminal: member-in-app / RSVP-confirmed / resume-after-login / open-app-no-signup.
- [ ] Behavioral: vouch felt at 0 taps; events at 0 taps; get-in ≤ 3 taps after Accept.
- [ ] Visual: only `#E8862A` accent (no `#ea580c` / `#C2410C` left); Inclusive Sans headings; Lucide icons; matches `hifi/mock-v2.html`.
- [ ] No construct lost: every change-table row implemented or explicitly deferred.
- [ ] Invite wall ships as an `AuthPromptModal` state; the modal's open-signup tab is gone under the hard gate.
- [ ] new-22: registering an already-registered email flips to login with the invite held — no dead end.
- [ ] Door 1 renders correctly with no inviter name (new-01b); "undefined invited you" is impossible.
- [ ] Web signup ends in new-23 (get the app); first native open is plain login (new-24). No deferred deep linking anywhere.
- [ ] onb-3b: a city with zero nearby centers shows the empty state + Global/Online, never a bare list.
- [ ] Guest re-RSVP with the same email returns new-11b, and the confirmation email contains a cancel link.
- [ ] PostHog instrumented: `door1_view`, `door2_view`, `invite_accept_tap`, `invite_wall_view`, `guest_rsvp_submit`, `signup_complete`, `onboarding_complete` — the whole point of two doors is comparing them.
- [ ] Logged out: Home and Feed render live-ish — new-30 shows real events near the location, feed shows the ghost feed + compact guest rail; tabs stay; NO open-signup path anywhere.
- [ ] First-run Home is the SAME live layout as logged-out Home (events at zero taps); the only deltas are the personalized greeting and the RSVP-nudge callout with invite pre-checked.

## 9. Out of scope / deferred

- **Hard-gate enforcement** — retiring `PUBLIC-EXPLORE` + grandfather migration for existing open-signup accounts is deferred in #440 (breaks the local seed). Until it lands, account-less RSVP and invite-only accounts coexist by design.
- **#104 short-link reconciliation** — `janata.app/CODE` vs `chinmayajanata.org/i/CODE`. PR #440 standardizes on `chinmayajanata.org/i/CODE`; #104 must be reconciled.
- **Server-side attribution** (inviter→invitee vouch tracking) — post-launch (#413).
- **`act-04` dev tools** — unchanged.
- The hifi map/list on Door 2 is Explore's existing UI; this spec does not redesign Explore internals, only its logged-out chrome.
- **"Anand will see you joined"** (mock-v1's success frame) — cut until #413 attribution exists; don't promise what the backend can't show.
- **Guest-RSVP claim-on-join** (attach past guest RSVPs by email match when the guest later becomes a member) — post-launch, pairs with #413.

## 10. Code reconciliation (round 2 — what PR #440 + v2 already settle)

Read these before building; they change where constructs live.

| Fact | Source | Consequence |
|---|---|---|
| `/i/[code]` → `/invite/[code]` → `/auth?mode=signup&inviteCode=` plumbing exists | PR #440 | Door 1 replaces the redirect *target*, not the plumbing |
| `invite/[code].tsx` silently redirects authed users to tabs | PR #440 | #403 must replace that line with new-05 — two lines a builder will miss |
| `auth.tsx` signup = ONE screen (email+password+confirm); `mode=signup&inviteCode` skips the typed-code step | `auth.tsx:48` | new-20/21 stay one screen; mock-v2 §A's two-step is superseded |
| `AuthPromptModal` (login/signup, `returnTo`) is wired into home, explore.web, feed, both event details | `components/ui/AuthPromptModal.tsx` | new-12 invite wall + new-13 in-context login are modal STATES, not pages; Condition 3 resume rides the existing `returnTo` |
| `/feed`, `/explore`, `/events/*`, `/center/*` are public ROUTES | `_layout.tsx:223-237` | "Feed gated" = content-level wall (new-15), not route removal |
| Onboarding resume enforced: authed + incomplete profile → `/onboarding` | `_layout.tsx:248-253` | No resume design needed; name is the gate |
| `/intro` is native-only first-run; universal links skip it | `_layout.tsx:214-221` | Invited users never see intro slides → Door 1 keeps them (optional swipe) |
| Universal links registered for `chinmayajanata.org` (note: entries duplicated) | `app.json:148` | Native Door 1 needed; dedupe the `associatedDomains` array while there |
| PR #440 leftovers: web fallback for `/i/CODE`, share URL still mints `/join?code=` | PR #440 body | The web fallback IS Door 1; fix the share URL before any of this matters |
| Attribution (inviter name at resolve time) not built; #413 post-launch | PR #440 body | new-01b nameless variant is the launch default unless the lookup adds `inviterFirstName` |
| **Prod today (2026-06-09):** web `/` logged out ALREADY renders a live explore-ish guest Home — map + sheet, Events 55 / Centers 92 / Seva, real cards | `capture/today-2026-06-09/` | new-30 formalizes what exists; what's missing today: location pill, "Happening near you" curation, Log in / Have an invite? chrome, the compact callout |
| **Prod today:** `/explore` and `/feed` logged out both redirect to `/landing`, the MARKETING page (hero "Find your center. Grow together." + Start Exploring) | `capture/today-2026-06-09/web-feed-redirects-to-landing.png` | platform split: web = `landing.web.tsx` (marketing, in v2 source), native = `landing.tsx` (redirect → /auth). No deploy risk (#444 retracted). #404 replaces BOTH with logged-out Explore |
| iOS sim dev-client is stale (`ExpoGlassEffect` missing) against this branch's JS | `capture/today-2026-06-09/ios-devclient-blocked.png` | rebuild via `npm run ios` from `packages/frontend` before any native QA of this flow |
