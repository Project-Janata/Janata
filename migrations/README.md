# Migrations — Project Janata

D1 schema changes for `chinmaya-janata-db`. Files are applied in lexical
order (`0001`, `0002`, ...). Apply with `npm run d1:migrate:all` — see
[Apply commands](#apply-commands) below.

## Two-tier table policy

This policy reflects the pre-launch reality: only `centers` and `events`
hold data we'd be sad to lose. Everything else is fair game to drop and
recreate as the feature evolves.

### Tier 1 — Canon (high cost to lose)

These tables hold data that's hand-curated or scraped and not trivially
regenerable. **Forward-only migrations** — additive ALTER TABLE only, no
DROP / no destructive column changes without an explicit data migration.

- `centers` — 91 Chinmaya Mission locations, hand-corrected (see `0008_add_chinmaya_centers.sql`)
- `events` — 2026 Chinmaya events scraped + corrected (see `0010_seed_chinmaya_events_2026.sql`, `0012_correct_event_data_2026.sql`)

Before any migration that ALTERs canon-tier tables, snapshot first:

```bash
npm run db:snapshot           # local D1
npm run db:snapshot -- --remote   # production D1 (read-only)
```

### Tier 2 — Disposable (fine to nuke)

Feature tables that are evolving and have negligible user data pre-launch.
Migrations may freely use `DROP TABLE IF EXISTS X; CREATE TABLE X ...`
patterns instead of incremental ALTERs. Cleaner schemas, smaller diffs,
no need to write idempotent migration ladders.

Current disposable tables (as of `0019`):
- `users`, `notifications`, `invite_codes`, `password_reset_codes`
- `board_*` (boards, posts, reactions)
- Future: `verifications`, `messages`, `connections`, `profiles_*`

**If you add a new feature table, default it to Tier 2.** Promote to Tier 1
only after the table holds real user data we'd hate to lose.

## Numbering

Files use the format `NNNN_short_description.sql`, zero-padded to four
digits. To find the next number:

```bash
ls migrations/0[0-9][0-9][0-9]_*.sql | tail -1
```

**Renumber on conflict.** If two PRs in flight both claim the same number,
the second to land bumps to the next free number and updates any
referencing issue title / PR body. Don't re-use a number — even if the
prior migration was reverted.

## Apply commands

### Local (always safe)

```bash
npm run d1:migrate:all              # applies every 00*.sql against --local
```

### Production (be deliberate)

```bash
npm run d1:migrate:all -- --remote  # applies against live chinmaya-janata-db
```

Per-migration application is also fine when troubleshooting:

```bash
npx wrangler d1 execute chinmaya-janata-db --local \
  --file=migrations/0019_boards.sql \
  --config packages/backend/wrangler.toml
```

Drop `--local` to hit production. **Prod and staging workers share the
same D1**, so applying once = both envs.

## Snapshot + restore

Before a canon-tier migration on prod:

```bash
npm run db:snapshot -- --remote
# → data/snapshots/<utc-stamp>/{centers,events}.sql
```

If the migration goes sideways, restore:

```bash
npm run db:restore -- --remote data/snapshots/<utc-stamp>
# requires typed confirmation when --remote
```

Local restore is safe and unprompted:

```bash
npm run db:restore -- data/snapshots/<utc-stamp>
```

## When you write a new migration

1. Pick the next free number: `ls migrations/0[0-9][0-9][0-9]_*.sql | tail -1`
2. Decide tier — Tier 1 (ALTER only) or Tier 2 (DROP+CREATE allowed)
3. If touching Tier 1, snapshot first: `npm run db:snapshot -- --remote`
4. Test the migration against `--local` first:
   ```bash
   npm run d1:migrate:all              # apply all up to and including yours
   npm run test:backend                # verify nothing broke
   ```
5. Include in the PR body:
   - Tier classification
   - The exact apply command (`npx wrangler d1 execute … --file=…`)
   - For Tier 1 migrations: the snapshot path
6. After merge, apply to prod manually — there's no auto-apply step in CI
   (deliberately, so no accidental schema changes ship without review)


## Pre-MSC ritual (~10 days before launch)

1. `npm run db:snapshot -- --remote` — known-good baseline
2. Drop every Tier 2 table on prod (TRUNCATE-style)
3. `npm run d1:migrate:all -- --remote` from scratch — clean schema
4. `npm run db:restore -- --remote data/snapshots/<latest>` — bring canon back
5. E2E smoke via `.ralph/bin/ralph-record-video` against the live deploy

## Future work

- **Phase 2** — separate `chinmaya-janata-db-dev` D1 + `chinmaya-janata-api-dev`
  Worker so PR previews can write freely without touching prod. Tracked in
  the runner runbook.
- **Phase 3** — adopt Wrangler's native `d1 migrations apply` system,
  including the `d1_migrations` tracking table. Defer until post-launch.
