# Mobile web bottom-tab navigation + Create Event entry

**Date:** 2026-05-24
**Scope:** Web frontend only (`packages/frontend`). Native iOS/Android unchanged.

## Problem

On a narrow viewport, the web header (`WebHeader` in `app/(tabs)/_layout.tsx`) lays out
Logo + Home/Explore/Feed/Messages + the "Create Event" pill in a single horizontal row.
On mobile widths this overflows off the right edge (the "Create" pill is cut off).

We want mobile web to navigate like the native iOS app: a **bottom tab bar** plus a compact
per-screen header — and the bottom nav must stay visible even on the full-page Create Event form.

Separately (approved earlier as "Option A"): the desktop "Create Event" button should navigate to
the Explore page with the create form open, instead of firing a window event that only works when
already on Explore.

## Constraints / findings

- The native app already has the target pattern: a bottom tab bar (Tabs navigator) + a compact
  `TabHeader` (logo/title + one action icon). On web the Tabs bar is force-hidden
  (`tabBarStyle: isWeb ? { display: 'none' }`) and replaced by `WebHeader`.
- `/events/form` is a **root-level Stack route** (sibling of `(tabs)` in `app/_layout.tsx`), so the
  Tabs navigator's own tab bar can never render over it. A persistent bottom nav must live at the
  **root layout** level to appear on the form route.
- A full-page `/events/form` route already exists and is the current mobile-web create path.
- The Explore page (`explore.web.tsx`) already declares an unused `action` query param
  (`useLocalSearchParams<{ detail; id; action }>`) — the intended-but-unfinished design for
  navigate-to-explore-and-open-form.

## Design

### 1. New component — `components/ui/WebBottomNav.tsx`
A fixed bottom tab bar for mobile web. Items mirror the native tabs:
Home (`/`) · Explore (`/explore`) · Feed (`/feed`) · Messages (`/chat`) · Profile (`/profile`),
using the existing lucide icons (`House`, `Compass`, `Newspaper`, `MessageSquare`) and an `Avatar`
for Profile. Active state derived from `usePathname()` (same `isRouteActive` logic as the current
`WebHeader`); navigation via `router.push`. Safe-area-aware bottom padding. Theme-aware colors.

### 2. `app/_layout.tsx` (`RootLayoutNav`)
- Render `<WebBottomNav />` as a flex sibling **below** the `<Stack>`, inside the existing
  `Animated.View`. Because it takes its own height in a flex column, page content never hides behind
  it (no per-screen padding needed).
- Visibility gate — show only when **all** of:
  - `Platform.OS === 'web'`
  - viewport width `< 768` (via `useWindowDimensions`)
  - authenticated (`!!user`)
  - route is not landing/auth/onboarding (reuse the public-page checks already in this component).
- Because it sits above the Stack, it persists on every route, including `/events/form`. ✅

### 3. `app/(tabs)/_layout.tsx`
- Add `const { width } = useWindowDimensions()`; `isDesktopWeb = Platform.OS === 'web' && width >= 768`.
- Per-screen `header`: `isDesktopWeb ? <WebHeader/> : <TabHeader .../>` — i.e. mobile web now uses the
  same compact `TabHeader` config as native, removing the overflowing horizontal nav.
- Built-in Tabs `tabBarStyle` stays hidden on web (mobile web uses the new root-level bar; desktop
  web uses `WebHeader`). Desktop web behavior is unchanged.
- Explore screen's mobile `TabHeader` gets `action="create"` with an `onActionPress` that pushes
  `/events/form` on web. (Other screens keep their existing actions: Home → notifications,
  Feed/Chat → their create-post/create-chat, Profile → settings.)

### 4. Create Event behavior
- **Desktop web** (`WebHeader` pill): replace the `window.dispatchEvent('open-event-form')` branching
  with `router.push('/explore?action=create')`.
- **`explore.web.tsx` (`DiscoverScreenWeb`)**: add an effect — when `params.action === 'create'`,
  `setSelectedItem(null); setFormPanel({})`, then clear the query param so it doesn't reopen on
  refresh/back and repeat clicks re-trigger. Remove the now-dead `open-event-form` window listener.
- **Mobile web**: Explore header `+` → `router.push('/events/form')` (full-page form). Bottom nav
  remains visible via the root-level `WebBottomNav`.

## Out of scope
- Full responsive polish of the `/events/form` page and Explore mobile layout (tracked separately —
  user noted mobile web needs broader responsive work).
- Native iOS/Android navigation (untouched).
- Rendering the desktop side-panel form inside mobile Explore (explicitly dropped in favor of the
  full-page route).

## Verification
At desktop (≥768) and mobile (<768) widths, authenticated:
1. Desktop web nav and "Create Event" pill render as today; pill → Explore with side-panel form open;
   close returns cleanly; repeat clicks reopen.
2. Mobile web shows bottom tabs (Home/Explore/Feed/Messages/Profile) with no overflow; each tab
   navigates and shows active state.
3. Mobile web Explore shows a `+`; tapping it opens the full-page `/events/form` **with the bottom
   nav still visible**.
4. Bottom nav hidden on landing/auth/onboarding and on desktop web.
