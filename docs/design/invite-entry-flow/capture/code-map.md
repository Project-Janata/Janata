# code-map — invite-entry-flow

Both target screens barely render today. The real current entry experience is the `auth.tsx` funnel.

| UI region | Owns it | Notes |
|---|---|---|
| Landing (Door 2 today) | `packages/frontend/app/landing.tsx` | 17 lines, `router.replace('/auth')`. Stub. |
| Invite resolver (Door 1 today) | not in this worktree | PR #440 adds `app/invite/[code].tsx` (spinner → `/auth?mode=signup&inviteCode=`) + `app/i/[code].tsx` alias. |
| The funnel everyone lands in | `packages/frontend/app/auth.tsx` | 489 lines, steps `initial → login | invite-code → signup`. |
| Sender screen (already shipped) | `packages/frontend/app/settings/invite.tsx` | Done; reference for token/voice consistency. |
| Onboarding intro (to reuse on Door 1) | onboarding intro carousel (3 real slides + 3D art) | Microsoft Fluent Emoji 3D; see memory `reference_onboarding_3d_icons_source`. |
| Backend register / invite | `packages/backend/src/app.ts` (`/auth/register`, `/auth/validate-invite-code`) | PR #440 flips invited → `NORMAL_USER` (verified at inception). |

## Styling system
- **NativeWind 4** (Tailwind classes via `className`) + RN inline `style`. Token source: `tailwind.config.js`.
- Brand accent today in code: `#C2410C` (orange-700) for links/checks; surface `#FAFAF7`. PR #440 mock uses `--accent:#E8862A`. **Reconcile real token at hifi from `tailwind.config.js`, not the mock.**
- Fonts: display = `Inclusive Sans`; body/UI = `font-sans` (Inter). Mono = JetBrains Mono.
- **Gotcha (memory):** NativeWind Pressable function-style `style={({pressed})=>...}` is dropped — use `className` + `active:` variants.

## Reference artifacts in this session
- `capture/ref-pr440-invite-open.html` — PR #440's surface-2 exploration (vouch + carousel + create-account + profile + you're-in). Prior thinking, owned by #403. Good starting point for Door 1.
