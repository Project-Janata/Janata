# Invite Flow QA Report - 2026-06-25

## Scope

Tested the local `v2` working tree for the invite-code changes:

- Inviter: `me@sahastasai.com`
- Recipient: `sahanavsairamesh@gmail`
- Local API: `http://localhost:8787/api`
- Local web app: `http://localhost:8081`

No production or preview data was modified. The Cloudflare/R2 values in `~/KEYS` were inspected but not printed into this report or used for production writes.

## Chrome Tool Status

The Chrome extension connected and captured:

- `01-auth-entry.png`
- `02-login-prefilled-me.png`

After that, the Chrome extension transport repeatedly disconnected (`Browser is not available`, then native pipe closed). Health checks showed Chromium was running and the native host manifest was valid, but extension communication was unstable. I completed the deterministic browser QA using Playwright Chromium against the same local app.

## Repro Procedure

1. Ensure local backend secrets exist:

   ```bash
   cat > packages/backend/.dev.vars <<'EOF'
   JWT_SECRET=local-jwt-secret-for-invite-qa
   JWT_REFRESH_SECRET=local-jwt-refresh-secret-for-invite-qa
   EMAIL_SEND_DISABLED=true
   EOF
   ```

2. Start the local backend:

   ```bash
   cd packages/backend
   npm run dev
   ```

3. Start the local web app:

   ```bash
   cd packages/frontend
   npm run web -- --port 8081
   ```

4. Install Playwright Chromium if missing:

   ```bash
   npx playwright install chromium
   ```

5. Run the QA capture:

   ```bash
   QA_PASSWORD='PreviewTest2026!' node qa-artifacts/invite-flow-2026-06-25/run-invite-qa.mjs
   ```

## Assertions

All assertions passed. See `api-assertions.json`.

- `me@sahastasai.com` logged in successfully.
- `sahanavsairamesh@gmail` logged in successfully.
- Member invite link rendered and defaulted to `25` uses.
- Admin invite link rendered with `1` use.
- Admin invite link expiry was approximately `24` hours.
- Server rejected elevated invite with `maxUses: 25`.
- Recipient was promoted to member level `45` after member invite.
- Recipient was promoted to admin-capable level `108` after admin invite.
- Exhausted admin link showed inactive-invite recovery.

## Screenshots

1. `01-auth-entry.png` - Chrome auth entry baseline.
2. `02-login-prefilled-me.png` - Chrome login attempt for inviter.
3. `02-inviter-member-link.png` - Inviter sees member link.
4. `03-inviter-admin-link-warning.png` - Inviter sees admin role warning and `1 of 1`.
5. `04-admin-link-copied.png` - Copy interaction state.
6. `05-recipient-member-invite-applying.png` - Recipient opens member invite while signed in.
7. `06-recipient-member-invite-applied.png` - Recipient member invite applied.
8. `07-recipient-already-member.png` - Already-member state.
9. `08-recipient-admin-invite-applied.png` - Recipient admin invite applied.
10. `09-exhausted-admin-link-invalid.png` - Exhausted elevated link recovery.
11. `10-api-assertions.png` - Visual assertion table.
