# Design spec — Invite Friends (invite links, v1)

**Session:** `~/.gstack/projects/Project-Janatha-Project-Janatha/refine/20260607-191425-invite-links-flow`
**Platform:** React Native Expo (shared code, runs iOS + web; no `.web.tsx` split today)
**Status:** approved through hifi · 2026-06-08
**Related issues:** #342 (this work; updated to the hard-gate model), #314, #104 (chinmayajanata.org plumbing), #403 / #404 (invite landing + logged-out states — own surfaces 2/3)
**Visual source of truth:** `hifi/mock-v3.html` (when a value is ambiguous, match the mock).

---

## 1. Summary

The Invite Friends screen is the one surface this work owns. Today it is a dead end: a placeholder link (`chinmayajanata.org/i/your-code-here`), hardcoded "Expires in 7 days • 8 uses left", and a Share button that is disabled for real users because the working mint/list client (`inviteClient.ts`) is wired to nothing.

IA principle chosen: **A — minimal, share-first.** One real link, one primary action, nothing else.

What changes structurally:
- **The link and its data are real.** Mint/fetch via `inviteClient`; the member always has one stable, ready link. No "generate" step, no placeholder.
- **Limits and expiry leave the UI.** No "X uses left / N days" line. Backend keeps `maxUses` / `expiresAt`, but mints with an effectively unlimited, non-expiring link and an **invisible cap (~100 uses) + silent rate-limit** as a leaked-link backstop.
- **Share collapses to one action.** The native share sheet already offers every channel, so the Messages/WhatsApp/Email/Other tiles are removed. Primary = **Share link** (native) / **Copy link** (web).
- **Single header** (was a doubled "Settings" / "Invite Friends"). **Desktop is a centered card**, not a full-bleed stretch.
- **Copy is center-agnostic and drops "verified."** In a hard-invite-gate world every account is verified by definition, so the word carries no contrast. The value is "they get in instantly."

---

## 2. Before / after

![Before — current screen](../capture/screenshot.png)

![After — hifi v3](../hifi/mock-v3.png)

- **Before:** fake link, fake "8 uses left", four share tiles, double header, full-bleed on desktop.
- **After:** real link, one Share button, no fake meta, single header, centered desktop card; loading shimmer + copied toast as honest states.

---

## 3. Approved IA tree

```
Invite Friends                         nav-01 (single header; nav-02 merged in)
├─ Hero gradient badge                 blk-01
├─ "Bring a friend"                    copy-01
├─ "They get in instantly."            copy-02  (center-agnostic; "verified" dropped)
├─ Invite link block                   blk-02
│   ├─ "YOUR INVITE LINK"              copy-03
│   ├─ chinmayajanata.org/i/{realCode}         blk-03  (real, via inviteClient)
│   └─ Share link / Copy (web)         act-01  (single primary action)
└─ States
    ├─ Loading shimmer                 new-01
    └─ Copied confirmation             state-01
```

Deferred to other issues: invite landing/welcome + gate (#403), logged-out/guest states (#404), `chinmayajanata.org` universal-link plumbing (#104).

---

## 4. Change table

| ID | Label | Verdict | From | To | Notes |
|---|---|---|---|---|---|
| nav-01 | Settings (outer header) | merge | settings/_layout.tsx | single `StackHeader` "Invite Friends" | Collapse the doubled header to one. |
| nav-02 | Invite Friends (StackHeader) | merge → nav-01 | settings/invite.tsx:92 | single header | — |
| blk-01 | Hero gradient badge | keep | settings/invite.tsx:102 | unchanged (`GradientIconBadge`, UserPlus) | — |
| copy-01 | "Bring a friend" | keep | settings/invite.tsx:105 | unchanged | — |
| copy-02 | subtitle | keep (reword) | settings/invite.tsx:108 | center-agnostic, no "verified" | see copy table |
| blk-02 | Invite link card | merge | settings/invite.tsx:124 | link block (linkbox) | Card chrome simplified to the linkbox. |
| copy-03 | "YOUR INVITE LINK" | keep | settings/invite.tsx:125 | unchanged | — |
| blk-03 | Link value | keep + **fix** | settings/invite.tsx:139 | real minted link from `inviteClient.listMyCodes`/`mintCode` | Stop reading `user.inviteCode`; one canonical `chinmayajanata.org/i/CODE` format. |
| act-01 | Share / Copy | keep | settings/invite.tsx:147 | single primary button; Share→native sheet, Copy→clipboard(web) | — |
| copy-04 | "Expires in 7 days • 8 uses left" | **cut** | settings/invite.tsx:169 | — | Removed from UI (v1). Backend keeps `expiresAt`/`maxUses`. |
| copy-05 | "SHARE VIA" | **cut** | settings/invite.tsx:177 | — | Native share sheet covers channels. |
| act-02 | Share via Messages | **cut** | settings/invite.tsx:191 | — | native sheet |
| act-03 | Share via WhatsApp | **cut** | settings/invite.tsx:201 | — | native sheet |
| act-04 | Share via Email | **cut** | settings/invite.tsx:211 | — | native sheet |
| act-05 | Share via Other | **cut** | settings/invite.tsx:226 | — | native sheet |
| state-01 | Copied confirmation | keep | settings/invite.tsx:160 | toast/inline check | — |
| state-02 | Disabled/no-link default | **cut** | settings/invite.tsx:151 | — | No longer reachable once the link is always real. |
| state-03 | (missing) real minted state | **resolved** | inviteClient.ts:111-228 | becomes the default | This is the screen's normal state now. |
| new-01 | Loading shimmer | **add** | — | link area while fetching/minting | Brief; link auto-loads. |

---

## 5. Copy table

| ID | Old | New | Where |
|---|---|---|---|
| copy-02 | "They'll see your name and skip verification at {center}." | "They get in instantly." | subtitle |
| blk-03 | chinmayajanata.org/i/your-code-here (placeholder) | chinmayajanata.org/i/{realCode} | link value |
| act-01 | "Copy" / "Share" | "Share link" (native) · "Copy link" (web) | primary button |
| copy-04 | "Expires in 7 days • 8 uses left" | (removed) | — |
| desktop hint | (none) | "Anyone with this link gets right in." | desktop card, under link (NEW-COPY) |

---

## 6. Redlines (from `hifi/tokens.json` → `tokens/colors.ts` LIGHT)

- **Background** `#F5F5F4`; **card/surface** `#FFFFFF`; **border** `#E7E5E4`.
- **Accent** `#E8862A` (button fill), pressed `#D97520`; white label (matches app convention; slightly under WCAG AA — darken to `accentPress` for the label if accessibility is enforced).
- **Hero badge** gradient `#fb923c → #c2410c`, radius 22-24, soft orange shadow.
- **Text**: primary `#1C1917`, muted `#78716C`, faint `#A8A29E`.
- **Type**: display `Inclusive Sans` (title 30-31 / 700; subtitle 15-16 / 400 muted; eyebrow label 11 / 600 / +0.10em / faint). Link in `JetBrains Mono` 14. Button `Inter` 15 / 600.
- **Radii**: card 16-20, input/link 12, button 12.
- **Desktop**: centered card width ~440px on the page background; account breadcrumb bar on top. Not full-bleed.
- When in doubt, match `hifi/mock-v3.html`.

---

## 7. States

- **Loading (new-01):** link row + button render as a shimmer while `inviteClient` fetches/mints. The member always ends with a link (auto-minted on first open if none exists) — there is no user-facing "generate" action.
- **Copied (state-01):** web Copy → "Link copied" toast (~2s); the button may flip to a check briefly. Native uses the OS share sheet (no toast needed).
- **No empty/disabled state:** the old always-disabled state is gone. If a fetch genuinely fails, show a quiet retry inline (not a dead disabled button).

---

## 8. Acceptance criteria

- [ ] Screen shows a **real** `chinmayajanata.org/i/CODE` link from `inviteClient` (no `user.inviteCode`, no placeholder), one canonical format.
- [ ] **No** expiry/uses text anywhere in the UI.
- [ ] **One** primary action: Share (native sheet) on device, Copy (clipboard + toast) on web. No share-via tiles.
- [ ] **Single** header; the doubled header is gone.
- [ ] Subtitle is center-agnostic and contains no "verified" / "verification" wording.
- [ ] Desktop renders a centered card (~440px), not a full-bleed column.
- [ ] Loading shimmer shows while the link resolves; member always lands with a usable link.
- [ ] Every change-table row implemented; no cut construct still rendering.

---

## 9. Out of scope / deferred (owned elsewhere)

- **Invite-open landing + welcome + gate** → #403 (`AuthFlowCore`, invite intent). See the alignment mock `hifi/mock-invite-open-v3.html`: vouch banner + reused onboarding intro (3 slides) → email/password → onboarding → "you're in." Center-agnostic, "verified" dropped. This spec does **not** build it; it documents the intended shape so #403 stays consistent.
- **Logged-out / guest states** → #404.
- **`chinmayajanata.org` universal-link plumbing** (iOS associatedDomains + Android intentFilters + `/i/CODE` route → `openAuth('invite', { inviteCode })`, web fallback when app not installed) → #104.
- **Regenerate / "reset my link"** (link revocation) — deferred; no UI in v1.

### Engineering flags (for #342, not design)
- **Leaked-link backstop:** invisible per-link cap (~100) + silent rate-limit; keep `maxUses`/`expiresAt` columns.
- **Attribution:** persist the inviter→invitee graph server-side (for the post-MSC vouching system + abuse tracing) even though the UI shows none.
- **Hard gate:** require a valid invite at `/auth/register`; retire `PUBLIC-EXPLORE`; promote to NORMAL_USER at register on a valid link.
- **Grandfather** existing open-signup / unverified accounts when the hard gate lands.
- **Center-agnostic model:** invite grants Janata membership, not a specific center; redemption sets level, not `center_id`.
- **Web fallback** for `chinmayajanata.org/i/CODE` when the app isn't installed (most invitees).
- **Share message copy:** define what the native sheet pre-fills (e.g. "Join me on Janata: chinmayajanata.org/i/CODE").
