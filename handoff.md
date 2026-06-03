# Session handoff — 2026-05-29

A long working session that took v2 from "ready to test" → tester feedback → fixes → merged. Plus a marketing-graphics skill + a starter IG set.

## TL;DR for Kish
1. **Review 2 open PRs** in the order: **#332** (PostHog provider + intro gate, root layout — screenshot already posted in Slack) → **#339** (sevak admin gating, the one I most want eyes on; couldn't auto-verify locally). All others merged.
2. **Trigger the v2preview redeploy** once you're happy → `gh workflow run deploy-v2preview.yml -f confirm=yes`. **It reseeds test data** — warn testers first. Tracked in **#317**.
3. Marketing graphics are in `~/Desktop/janata-marketing/` (5 IG-feed + earlier 3 hero/story). Skill `marketing-posts` is registered for next time.

## Open PRs (still to review)
| PR | What | Risk |
|---|---|---|
| [#332](https://github.com/Project-Janata/Janata/pull/332) | PostHog provider (no-op without key) + gate `/intro` to native | Root layout; verified live |
| [#339](https://github.com/Project-Janata/Janata/pull/339) | Sevak admin gating (Moderation-only) + real-admin check that ignores localhost | Auth/permission; not auto-verified locally |

## Merged to `v2` this session
- **From the first round** (PR review pass): #315 desktop detail panel · #316 feed search copy · #322 feed empty state · #323 explore sheet drag (touch→pointer)
- **From the second round** (local-testing pass): #333 settings `/preferences` 404 · #334 invite "link" + parse · #338 Home "See all" links

## Local stack still running
- Web: `http://localhost:8082` (Expo dev pointed at local backend)
- Backend: `http://localhost:8788/api` (wrangler dev, local D1 at `/tmp/janata-local-v2`)
- Seeded: 10 centers + 4 events + the 5 role logins (`<role>@chinmayajanata.org` / `PreviewTest2026!`) + sample board posts + a moderation report
- Stop: `lsof -ti :8788 :8082 | xargs kill` (leaves Lane B's :8081/:8787 alone)

## Issues queued (not started)
- **#337** Explore filter audit — *core filters work*; gaps documented (no past-events toggle UI, search doesn't match center name, dead WeekCalendar import, mobile/native map-list sync missing). Comment on the issue has the prioritized list.
- **#318** Admin telemetry sweep + invite-links admin table. **Full punch list on the issue** — coordinate w/ #314 (Abhiram's invite-link side).
- **#331** Dev-ergonomics epic. *Forward-only* migration fix (don't edit history — 0002 inserts `centers.website` before 0003 adds it; only survives because `seed_preview_data` overrides later). Plus a one-command local-dev script that captures what I did by hand.
- **#283** P1: board photo attachment · **#285** P1: center About admin edit · **#330** profile redesign (deferred)
- **#320** `feat/v2-onboarding` branch — Abhiram's; cherry-pick *only* the step refactor (`shared.tsx` + step1-4 — clean, conflict-free). Phosphor icon swap is a separate decision.

## What's in Notion (for testers + UAT)
- **Janata v2 — Testing Checklist** — `36fca4196e3081e08156e24f9aa96183`. Has the stale-preview banner + screenshot drop guide.
- **Janata v2 — Internal UAT (PRD acceptance)** — `36fca4196e30819a84cfc28471f73b7f`. PRD-traceable matrix, findings pre-flagged.
- Sprint Plan + PRD synced with the spec drifts (3-tab nav vs PRD's 4 + single-scroll detail vs tabs + multi-use invites).

## New skill (registered)
`~/.claude/skills/marketing-posts/SKILL.md` — combines `openai-image-gen` + `marketing:draft-content`. Triggers on "post", "social graphic", "marketing image", "IG content". Has a Janata example block with colors + tagline + asset path so next invocation already knows the brand.

## Marketing assets in `~/Desktop/janata-marketing/`
- **02** landscape 3-phones (Twitter / LinkedIn hero)
- **03** square hero · **04** portrait story
- **05–09** the 5 IG-feed direction set: Discovery / Belonging / Community / Invitation / Launch (MSC Aug 1)

Tagline borrowed verbatim from the app's `/intro`: *"Find your center. Grow together."* Each direction has its own headline (don't reuse).

## Context worth knowing for the next agent
- **Branch / merge gate**: Kish is the merge gate on every PR. Squash-merges, conventional commit titles with `(#NNN)` suffix.
- **`v2preview` deploy is manual** (`deploy-v2preview.yml`, workflow_dispatch or push to `deploy/v2preview`). Reseeds D1 → wipes tester-created data on every redeploy. Tell the team first.
- **`isSuperAdmin` is `true` on localhost** — masks the real admin check. For any *capability*-style gate (e.g. admin tabs), use `hasAdminCapability` from `utils/admin.ts` (added in #339), not `isSuperAdmin`.
- **Migration ordering quirk**: a fresh apply fails on `0002_seed_data` (centers.website inserted before `0003` adds the column). Preview survives because `_reset_preview.sql` runs first and `seed_preview_data.sql` overrides centers at the end. Don't try to "fix" 0002 in place — it's already in prod. Forward-only fix in #331.
- **Auth token storage** on web: `localStorage` key `@auth_token` (read at boot, so set-then-reload to inject).
- **Posting Slack as the team agent**: bot token + curl pattern in `~/.claude/projects/-Users-kishparikh-Code-Project-Janatha/memory/project_slack_bot.md`. The bot is the right voice for "from the dev agent" updates; Kish's MCP posts as Kish but doesn't push-notify.
- **Stray working tree change**: `.gitignore` has an unstaged `+.gstack/` line. Harmless; I excluded it from every commit by adding specific paths.

## Tasks left in the harness queue
Three still pending — see TaskList: #12 (#283 photo), #13 (#285 admin edit), #14 (#318 admin work). All "next round" candidates.
