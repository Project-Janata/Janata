# Janata Auth, Home, Feed Redesign Plan

Date: 2026-06-03
Workspace: `/Users/kishparikh/conductor/workspaces/Project-Janatha/nairobi`

## What Exists Today

The app is already close to the right model:

- Public browsing is allowed from `app/_layout.tsx`: guests can open Home, Explore, Feed, events, and center detail.
- Auth exists as duplicated screens:
  - `packages/frontend/app/auth.tsx`
  - `packages/frontend/app/auth.web.tsx`
- There is already an event-specific auth modal:
  - `packages/frontend/components/ui/AuthPromptModal.tsx`
  - It currently routes to `/auth` instead of completing auth in place.
- Center search is already shared:
  - `packages/frontend/components/center/CenterSearch.tsx`
  - Used in onboarding and feed setup.
- Feed already has state-aware setup components:
  - `FeedEmptyState`
  - `FeedSetupRail`
  - `GhostFeed`
- Home already has state-specific pieces:
  - `SignInCallout`
  - `WelcomeBanner`
  - `FirstRunOverview`
  - board peek and event sections.

The main problem is not missing UI primitives. The problem is that the product model is split across full-page auth, full-page onboarding, center picker, and feed/home empty states.

## Product Thesis

Janata should be browse-first, then unlock-in-context.

Users should first understand:

- There are real events.
- There are real centers.
- There are real boards/conversations.
- Picking a center makes the app personal.

Auth should not feel like a destination. Auth should feel like a sheet that appears when the user tries to do something meaningful.

## User State Model

Use these states everywhere:

1. `guest`
   - No user.
   - Can browse public content.
   - Locked actions open auth sheet.

2. `signedInNeedsName`
   - Has account, missing `firstName` or `lastName`.
   - Needs a short setup sheet.

3. `signedInNeedsCenter`
   - Has name, no `centerID`.
   - App is usable, but Home and Feed strongly lead to center selection.

4. `signedInReady`
   - Has name and `centerID`.
   - Home becomes dashboard.
   - Feed becomes boards from home center + RSVP events.

Avoid making `profileComplete` mean "finished a long onboarding tour." It should mean "has enough identity to use Janata."

## Auth Design

### Recommendation

Create one shared auth surface:

- `AuthFlowCore` or `useAuthFlow`
  - owns email check, login, invite-code validation, signup, errors, loading, button labels.
- `AuthSurface`
  - renders the shared flow.
  - supports `mode="sheet" | "page"`.
  - supports `intent`.
- `/auth`
  - remains a full-page wrapper around `AuthSurface`.
- `AuthPromptModal`
  - is replaced or upgraded to render `AuthSurface mode="sheet"`.

### Intents

Auth copy should be contextual:

- `generic`: "Sign in to Janata"
- `rsvp`: "Sign in to RSVP"
- `feed`: "Sign in to join the conversation"
- `center`: "Create your account to follow this center"
- `compose`: "Sign in to post"

Each intent still uses the same underlying flow.

### Platform Behavior

iOS:

- Bottom sheet.
- Max height about 88% of viewport.
- Drag/close optional, close button required.
- Keyboard avoiding behavior.

Mobile web:

- Bottom sheet.
- Same visual structure as iOS.

Desktop web:

- Centered modal over the current page.
- Width around 420-460px.
- Dimmed backdrop.

Fallback:

- Direct `/auth` still full-page on all platforms.
- Password reset stays route-based.

## Setup / Onboarding Design

### Current

`OnboardingProvider` has four required form steps:

- name
- birthday
- center
- interests
- complete

### Recommended

Keep the full setup flow, but reduce the feeling of obligation.

Required:

1. Name
2. Home center

Skippable:

3. Birthday
4. Interests

Make optional steps extremely simple:

- One screen each.
- One primary action: `Continue`.
- One secondary action: `Skip`.
- No explanatory paragraphs beyond one short sentence.
- No disabled primary button on optional steps.
- If skipped, persist null/empty values and continue.

Make center skippable too, but with honest copy:

- Primary: `Pick home center`
- Secondary: `Skip for now`
- Consequence: "You can still browse, but your Home and Feed will stay generic."

Use fewer 3D icons than the prototype:

- Use the 3D icon prominently in the intro and lightly in setup headers.
- Do not place 3D icons on every card, row, or empty state.
- Use the compass for center selection.
- Use the diya for welcome/account creation.
- Avoid adding new 3D imagery to Home/Feed unless it replaces an existing empty-state icon.

### Backend/API

No backend migration is required for the first pass.

Use existing profile update paths:

- `POST /api/auth/complete-onboarding`
- profile update through `authService.updateProfile`

Set `profileComplete: true` after the user completes or skips the final onboarding step. Also keep the existing derived-complete behavior in mind: `UserContext` already treats a user with first name, last name, and email as effectively onboarded.

## Home Redesign

### Guest Home

Goal: "I understand Janata before I sign up."

Recommended structure:

- Header: logo + `Sign in`.
- Greeting: `Namaste.`
- Section: `Happening near you`
  - show real event cards.
- Bottom callout/sheet:
  - eyebrow: `JOIN THE COMMUNITY`
  - title: `Find your center. Grow together.`
  - email field or direct `Create account`
  - secondary: `Browse as guest`

Avoid listing feature-tour bullets if events are visible. Real content does the teaching.

### Signed In, No Center

Goal: "Pick your center so the app makes sense."

Recommended structure:

- Header: logo + notifications + avatar.
- Greeting: `Welcome, [name]`
- Primary card: `Pick your home center`
  - 2-3 nearest centers.
  - `Join` buttons.
  - `Find on map`.
- Section: `While you decide`
  - one or two real events.

### Signed In, Center, No RSVPs

Goal: "Your account is set up; RSVP to fill your calendar and boards."

Recommended structure:

- Greeting: `Namaste, [name]`
- Subline: role + center.
- Primary card: `Your calendar is open`
- CTA: `Explore events`
- Section: `From your center this week`

### Returning Member

Goal: "Show me what is next and what changed."

Recommended structure:

- Up Next
- This Week
- Latest on your boards

## Feed Redesign

### Guest Feed

Goal: "I understand what Feed is before signing in."

Recommended structure:

- Show one or two read-only sample/real posts when available.
- Bottom auth callout:
  - eyebrow: `YOUR COMMUNITY FEED`
  - title: `See what your sangha is sharing.`
  - CTA: `Sign in to continue`
  - lock line: `Posts are read-only until you sign in`

### Signed In, No Center

Goal: "The feed is empty because I have not picked a center."

Recommended structure:

- Title: `Choose your center to start your feed`
- Inline `CenterSearch`
- Secondary: `Or RSVP to an event to see its board`

### Signed In, Has Boards, No Posts

Goal: "I have the right boards; now someone needs to post."

Recommended structure:

- Board list visible.
- Empty post area:
  - `No posts yet`
  - `Start the conversation`
- Compose CTA only if the user has at least one writable board.

### Active Feed

Goal: "Read and respond."

Recommended structure:

- Search.
- Post list.
- Context rail on desktop.
- Thread detail on selection.

## Navigation

Use three tabs:

- Home
- Explore
- Feed

Keep the visible label `Explore`. The code and tests already use this label, and the user preference is to keep it.

## Implementation Plan

### Phase 1: Shared Auth Surface

Files:

- Create `packages/frontend/components/auth/AuthSurface.tsx`.
- Create `packages/frontend/components/auth/useAuthFlow.ts`.
- Update `packages/frontend/app/auth.tsx`.
- Update `packages/frontend/app/auth.web.tsx`.
- Update `packages/frontend/components/ui/AuthPromptModal.tsx`.

Tasks:

- Move auth step state and handlers out of route files.
- Support `initialEmail`, `initialMode`, `inviteCode`, `returnTo`, and `intent`.
- Preserve existing analytics names.
- On success, call optional `onSuccess(user)` for modal use.
- Full-page `/auth` continues to navigate by `returnTo`.

Tests:

- Existing auth tests should still pass.
- Add modal flow coverage for existing user login and new user signup.

### Phase 2: Auth Invocation

Files:

- `app/events/[id].tsx`
- `app/events/[id].web.tsx`
- `app/(tabs)/feed.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/profile.tsx`
- `app/(tabs)/chat.tsx`

Tasks:

- Replace `router.push('/auth')` for locked actions with `openAuth(intent)`.
- Keep route fallback for deep links and screens outside the modal provider.
- For guest center selection, store the intended center and complete it after auth.

### Phase 3: Setup Simplification

Files:

- `components/contexts/OnboardingProvider.tsx`
- `app/onboarding.tsx`
- `components/onboarding/step1.tsx`
- `components/onboarding/step3.tsx`
- `components/onboarding/step2.tsx`
- `components/onboarding/step4.tsx`

Tasks:

- Keep four steps: name, birthday, center, interests.
- Make birthday, center, and interests skippable.
- Center remains the most important unlock and should still be visually emphasized.
- Birthday UX: plain date picker, `Continue`, `Skip`.
- Interests UX: reduce the chip list to clear categories, allow zero selections, `Continue`, `Skip`.
- Set `profileComplete: true` after final step complete/skip.
- Allow `centerID` null.

Tests:

- Signup redirects to setup.
- Skipping birthday/interests gets user into app.
- Skipping center gets user into generic Home/Feed.
- Picking center updates Home and Feed.

### Phase 4: Home State Resolver

Files:

- `app/(tabs)/index.tsx`
- Optional: `components/home/homeState.ts`

Tasks:

- Create a state resolver:
  - `guest`
  - `needsName`
  - `needsCenter`
  - `emptyCalendar`
  - `ready`
- Render one dominant primary card per state.
- Use real event data in guest and no-center states.

### Phase 5: Feed State Resolver

Files:

- `app/(tabs)/feed.tsx`
- `components/feed/FeedEmptyState.tsx`
- `components/feed/FeedSetupRail.tsx`
- Optional: `components/feed/feedState.ts`

Tasks:

- Create a state resolver:
  - `guest`
  - `needsCenter`
  - `needsBoards`
  - `emptyBoards`
  - `active`
- Guest feed should show read-only content preview before the auth callout.
- Compose action appears only when there is a writable board.

### Phase 6: Copy and Polish

Tasks:

- Standardize labels:
  - `Create account`
  - `Sign in`
  - `Pick home center`
  - `Explore events`
  - `RSVP`
- Keep `Explore` in UI nav.
- Remove generic feature-tour copy where real content is already visible.
- Keep card radius at 8-18 depending on existing component family. Avoid nested cards.

## Gaps Found In Final Check

1. `AuthPromptModal` is already used in event detail and web Explore, but it redirects to `/auth`. Replacing it with the shared auth surface is the cleanest first auth change.

2. Several guest CTAs still push `/auth` directly:
   - Home sign-in callout.
   - Feed setup sign-in.
   - Guest center pick from Feed.
   - Chat/profile sign-in prompts.
   These need an `openAuth(intent)` path, with route fallback.

3. `OnboardingProvider` currently makes birthday, center, and interests hard gates in normal signup. The `skipOnboarding` path only appears for `returnTo`, so optional steps need to become first-class for all signup flows.

4. `UserContext` derives onboarding completion from `profileComplete` or name + email. That means the setup changes should be careful not to trap users in `/onboarding` after they skip optional fields.

5. Backend profile update already supports null/empty `centerID`, optional `dateOfBirth`, and optional `interests`. No migration is needed for the UX changes.

## Open Decisions

1. Is Janata invite-only for all new accounts?
   - If yes, keep invite code in auth flow.
   - If no, make invite code conditional by center/verification path.

2. Does selecting a center mean `Join` or `Follow`?
   - Use `Join` only if the user becomes a member.
   - Use `Follow` if it only personalizes Home/Feed.

3. Is Feed mission-wide or personal?
   - Current code builds boards from home center and RSVP events.
   - Screens imply broader mission content may flow in.
   - Recommendation: personal feed first, with public preview for guests.

## HTML Concept

The accompanying HTML design board is saved under the gstack design artifacts directory:

`~/.gstack/projects/Project-Janatha-Project-Janatha/designs/auth-home-feed-redesign-20260603/finalized.html`
