# Plan: 4 logged-out / image UX fixes (v2)

Four small, independent-ish frontend fixes. Ship as 4 PRs, one at a time, each branched off `v2`.
Issues: #379 (landing icon), #380 (avatar fallback), #381 (logged-out dropdown), #382 (image fit + lightbox).

Stack: Expo / React Native + react-native-web, `packages/frontend`. Icon lib: `lucide-react-native`.

---

## PR 1 — #379 Landing: remove profile icon for logged-out visitors

**File:** `components/landing/NavBar.tsx`

- NavBar has no auth awareness today; the right side is just one person-icon `Pressable` → `/auth`.
- Add `useUser()`. Logged-out → render nothing in that slot. Logged-in → render the shared `Avatar` (image + name) that routes to `/` (into the app).
- `NAV_LINKS` is empty, so logged-out right side becomes empty — that's intended.

**Risk:** none. Landing is the logged-out marketing page; `/auth` is still reachable via Hero / FinalCTA.

**Verify:** load `/landing` logged-out → no icon. (Logged-in landing visit is rare; smoke only.)

---

## PR 2 — #380 App header: replace "?" avatar fallback with a person icon

**Files:** `components/ui/Avatar.tsx`, `app/(tabs)/_layout.tsx` (WebHeader)

- `Avatar.tsx`: when there's no image AND no initials/name, render a centered lucide `User` icon (white) instead of the `'?'` Text. Keep initials behavior when a name exists. Icon size ∝ avatar size.
- `_layout.tsx` WebHeader (lines ~141-158): replace the inline image/initials block with the shared `<Avatar image={user?.profileImage} name={...} size={36} />` so the `?` path is gone and there's one source of truth. Drop the now-dead inline `getInitials()`.

**Risk:** Avatar fallback changes everywhere it's used name-less (feed authors, etc.) — desired consistency. Confirm `User` icon import doesn't bloat (already used across app).

**Verify:** logged-out web header shows person icon, not `?`. Logged-in with initials still shows initials. Dark + light.

---

## PR 3 — #381 Logged-out dropdown: Log in CTA + appearance only

**File:** `components/settings/SettingsPanel.tsx` (already calls `useUser()`)

- Branch on `user`:
  - **Logged out:** panel shows a heading/short line, a primary "Log in" CTA → `onClose()` + `router.push('/auth')`, a separator, and the existing Appearance `ThemeSelector`. No profile info row, Profile, Preferences, Admin, or Log Out.
  - **Logged in:** unchanged.
- Keep animations/backdrop as-is. Track an analytics event on the Log in press (e.g. `settings_panel_login_pressed`).

**Risk:** low. Make sure panel height/layout looks right with fewer items.

**Verify:** logged-out, click header avatar → minimal panel (Log in + Appearance). Log in routes to `/auth`. Appearance toggle still switches theme. Logged-in panel unchanged.

---

## PR 4 — #382 Board/feed images: fit + lightbox

**Files:** `components/boards/ThreadPanel.tsx` (~445), `components/feed/FeedPostCard.tsx` (~78), new `components/ui/ImageLightbox.tsx`. Consider `components/feed/PostThread.tsx` (image not rendered in detail view) — fold in only if low-risk.

- **Fit:** images use `width: '100%'`, remove fixed height in favor of `aspectRatio` (default ~16/9 or 4/3) with a `maxHeight` cap; ensure the parent clips (`borderRadius` + `overflow: 'hidden'`) and the image respects card padding (no overflow past the card). ThreadPanel already has `maxWidth: 360`; FeedPostCard lacks a cap.
- **Lightbox:** new reusable `ImageLightbox` using RN `Modal` (works on web via react-native-web): dark backdrop, centered image at `resizeMode="contain"`, dismiss on backdrop tap and Escape (web). Wrap each post image in a `Pressable` that opens it with the image uri.
- Single `imageUrl` per post today — keep the component simple (one image) but shape the API so multiple could be added later.

**Risk:** medium (most surface). Aspect-ratio sizing on RN-web vs native can differ; test both web layouts. Modal stacking with existing modals (CreatePostSheet) — open from a closed state only.

**Verify:** board thread image fits the card (no overflow), click → lightbox, Escape/tap closes. Feed card image fits. Mobile + desktop web.

---

## Review refinements (from eng-review + codex outside voice)

Decisions (Kish): PR4 = fit + lightbox everywhere **including** rendering the image in the feed post detail (`PostThread.tsx`); Avatar fallback = **app-wide** in shared `Avatar`.

Apply to the PRs:
- **PR1:** handle auth-loading (hide the slot until `useUser()` resolves, no flicker); confirm landing renders inside `UserProvider`; remove dead `menuOpen` state in NavBar. Logged-in landing nav routing to `/` is a deliberate product behavior, not a no-op.
- **PR2:** `Avatar` fallback → centered lucide `User` icon (size ∝ avatar) when no image AND no usable name; **trim** name before deriving initials (whitespace-only name must hit the icon fallback); covers broken-image case too. Remove now-dead `Image`/`Text`/`getInitials` paths in WebHeader after switching to shared `Avatar`.
- **PR3:** branch on `user` **structurally** at the top of `SettingsPanel` — do not compute the authenticated `displayName`/username UI for logged-out. Logged-out panel = "Log in" CTA + Appearance only. Preserve return path on login if `/auth` supports a `returnTo`/redirect param (check the route; otherwise plain `/auth`).
- **PR4:** reuse the existing cross-platform overlay pattern from `components/ui/AuthPromptModal.tsx` (web = `position:fixed` overlay at high z-index, native = RN `Modal` with `onRequestClose`). Wrap the image in a press target that **stops propagation** so it doesn't trigger the parent card/nav press. Fit = clipping wrapper (`overflow:hidden`, `minWidth:0`, real maxWidth) + `aspectRatio` + `maxHeight`. Render image in `PostThread` detail too. Verify on **native** (iOS) as well as web — iOS is the launch surface.

## Process
- Each PR: branch off latest `v2` → implement (subagent) → `/codex review` the diff → fix → typecheck → push + open PR → test in running web app → merge to `v2`.
- Do #380 then #381 back-to-back (same logged-out web header).
- Kish verifies anything flagged; otherwise merge once green + visually confirmed.
