# Security Red-Team Report - 2026-06-25

## Scope

Targeted the local `v2` working tree only:

- API: `http://127.0.0.1:8787/api`
- Web: `http://localhost:8081`
- Database: local Wrangler D1 sandbox for `chinmaya-janata-db`

No production, preview, or third-party systems were attacked or modified.

## Reproduction

Start local services:

```bash
cd packages/backend
npm run dev
```

```bash
cd packages/frontend
npm run web -- --port 8081
```

Run the exploit suite:

```bash
QA_PASSWORD='PreviewTest2026!' node qa-artifacts/security-redteam-2026-06-25/run-redteam.mjs
```

Raw machine-readable output:

- `findings.json`
- `run-redteam.mjs`

## Findings

### RT-001 - Critical - Any authenticated user can become admin by changing email

Confirmed.

Impact: a normal member can call `PUT /api/auth/update-profile` with `email: "chinmayajanata@gmail.com"`. The backend admin check trusts that mutable email field, so the same token can immediately access `/api/admin/users` and the web admin dashboard.

Evidence:

- Before exploit: `/api/admin/users` returned `403`.
- Exploit request: `/api/auth/update-profile` returned `200`.
- After exploit: `/api/admin/users` and `/api/admin/stats` returned `200`.

Root cause:

- `packages/backend/src/app.ts:56` treats `email === ADMIN_EMAIL` as admin.
- `packages/backend/src/app.ts:973` allows users to update their own `email`.

Screenshot: `01-email-spoof-admin-escalation.png`, `02-admin-ui-after-email-spoof.png`

### RT-002 - Critical - Developer email self-provisions admin-capable access

Confirmed.

Impact: any unclaimed address listed in `DEVELOPER_EMAILS` can register with no invite and immediately receive `verificationLevel: 108`, which passes the admin cutoff.

Evidence:

- Registered `sahanavasairamesh@gmail.com` locally with no invite.
- Login succeeded.
- `/api/auth/verify` returned `verificationLevel: 108`.
- `/api/admin/users` returned `200`.

Root cause:

- `packages/backend/src/constants.ts:14` lists privileged developer emails.
- `packages/backend/src/app.ts:395` detects developer emails during public registration.
- `packages/backend/src/app.ts:404` grants `BRAHMACHARI`.

Screenshot: `03-developer-email-self-provision.png`

### RT-003 - High - Any member can edit legacy events with `created_by IS NULL`

Confirmed.

Impact: seeded/legacy events with no creator can be modified by any authenticated user.

Evidence:

- Selected local legacy event `e0000001-0000-0000-0000-000000000001` with `created_by: null`.
- A normal member called `/api/updateEvent`.
- The public event fetch returned the red-team modified title.
- The runner restored the original title after capture.

Root cause:

- `packages/backend/src/app.ts:2196` explicitly allows any logged-in user for events without a creator.
- `packages/backend/src/app.ts:2199` includes `existing.created_by === null` in `isEditable`.

Screenshot: `04-legacy-event-takeover.png`

### RT-004 - Medium - Any authenticated user can create center records

Confirmed.

Impact: any member can add arbitrary center records. That is a spam/data-integrity risk unless intentionally community-submitted and separately moderated.

Evidence:

- Normal member called `/api/addCenter`.
- API returned `200` with a new center id.
- Public `/api/fetchCenter` confirmed the inserted center.
- The runner deleted the local proof center after capture.

Root cause:

- `packages/backend/src/app.ts:1075` protects `/addCenter` with authentication only, not admin/sevak/moderator authorization.

Screenshot: `05-member-center-creation.png`

### RT-005 - Low - Unauthenticated account enumeration

Confirmed.

Impact: unauthenticated callers can distinguish existing from non-existing accounts.

Evidence:

- `/api/userExistence` returned `{"existence": true}` for a known local account.
- Same endpoint returned `{"existence": false}` for a random missing account.

Root cause:

- `packages/backend/src/app.ts:308` exposes the existence lookup publicly.

Screenshot: `06-unauthenticated-user-enumeration.png`

### RT-006 - Low - Internal exception messages are returned to clients

Confirmed.

Impact: malformed requests can receive internal parser error detail. This is minor for the captured case but broadens reconnaissance and should be cleaned up.

Evidence:

- Malformed JSON to `/api/auth/register` returned `500` with `error: "Unexpected end of JSON input"`.

Root cause:

- `packages/backend/src/app.ts:212` global error handler includes `error: errorMessage` in client responses.

Screenshot: `07-error-detail-leak.png`

## Additional Audit-Only Risks

These were found by static/dependency audit, not independently exploited in the local app flow.

### AUD-001 - Critical dependency advisory in `shell-quote`

`npm audit --omit=dev --json` reported `shell-quote` `>=1.1.0 <=1.8.3` with GHSA `GHSA-w7jw-789q-3m8p`, a command-injection class advisory. It is transitive in the installed tree. Confirm whether it ships in production bundles or only local tooling; update/override if present in any server/runtime path.

### AUD-002 - High dependency advisories in `ws`

`npm audit --omit=dev --json` reported `ws` advisories including `GHSA-96hv-2xvq-fx4p` for memory exhaustion DoS and `GHSA-58qx-3vcg-4xpx` for memory disclosure. Instances appear under Metro/React Native/dev tooling paths and top-level `node_modules/ws`; verify whether any deployed Worker/runtime path includes it.

### AUD-003 - Browser token storage increases XSS blast radius

Web tokens are stored in `localStorage` and readable cookies in `packages/frontend/src/storage/tokenStorage.web.ts`. I did not confirm a stored XSS path in this pass, but any future XSS would immediately expose access and refresh tokens. Prefer HttpOnly Secure cookies or a backend-for-frontend session pattern if feasible.

### AUD-004 - Production CORS allowlist accepts all `http://localhost:*`

`packages/backend/src/app.ts:243` accepts any `http://localhost:*` origin while `credentials: true` is enabled. This is convenient for dev but should be environment-gated so production only allows exact deployed origins.

## Immediate Fix Order

1. Remove email-based admin trust or make email immutable/verified before privilege checks. Prefer role/level-only admin checks backed by server-controlled fields.
2. Delete the public developer-email bypass from production registration. Seed/dev elevation should be environment-gated and unavailable in production/preview.
3. Remove `existing.created_by === null` from event edit authorization. Backfill legacy events to an owner or require admin for null-owner events.
4. Gate center creation to admin/sevak or make it an explicit pending-submission workflow.
5. Remove public user-existence differences or rate-limit and normalize responses.
6. Return generic 500s to clients; keep stack/error details in logs only.
