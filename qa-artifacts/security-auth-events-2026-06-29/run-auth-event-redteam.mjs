import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const repoRoot = resolve(new URL('../..', import.meta.url).pathname)
const outDir = resolve(new URL('.', import.meta.url).pathname)
const API = 'http://127.0.0.1:8787/api'
const password = process.env.QA_PASSWORD || 'PreviewTest2026!'
const qaCode = 'QA-TEST-AUTH-EVENT'
const adminEmail = 'chinmayajanata@gmail.com'
const developerEmail = 'sahanavasairamesh@gmail.com'
const nowTag = Date.now()

const definitions = new Map()
const controls = []
const screenshots = []
const createdEventIds = new Set()

function sql(command) {
  execFileSync(
    'bunx',
    [
      'wrangler',
      'd1',
      'execute',
      'chinmaya-janata-db',
      '--local',
      '--config',
      'packages/backend/wrangler.toml',
      '--command',
      command,
    ],
    { cwd: repoRoot, stdio: 'pipe' },
  )
}

function sqlJson(command) {
  const raw = execFileSync(
    'bunx',
    [
      'wrangler',
      'd1',
      'execute',
      'chinmaya-janata-db',
      '--local',
      '--config',
      'packages/backend/wrangler.toml',
      '--command',
      command,
      '--json',
    ],
    { cwd: repoRoot, stdio: 'pipe', encoding: 'utf8' },
  )
  return JSON.parse(raw)[0]?.results || []
}

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      Connection: 'close',
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { text }
  }
  return { status: response.status, ok: response.ok, body }
}

const auth = (token) => ({ Authorization: `Bearer ${token}` })

function spoofIpHeaders(ip) {
  return { 'CF-Connecting-IP': ip, 'X-Forwarded-For': ip }
}

function ip(seed, host = 20) {
  return `10.${host}.${Math.floor(seed / 240)}.${10 + (seed % 240)}`
}

function escapeSql(value) {
  return String(value).replaceAll("'", "''")
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function shortJson(value, max = 4200) {
  return JSON.stringify(value, null, 2)
    .replaceAll(/eyJ[a-zA-Z0-9._-]+/g, '[JWT_REDACTED]')
    .slice(0, max)
}

function define(id, meta) {
  definitions.set(id, { id, ...meta })
}

function record(findingId, title, confirmed, details) {
  const c = {
    id: `AE-C${String(controls.length + 1).padStart(3, '0')}`,
    findingId,
    title,
    confirmed: Boolean(confirmed),
    ...details,
  }
  controls.push(c)
  return c
}

async function screenshotHtml(browser, filename, title, sections) {
  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: Inter, system-ui, sans-serif; margin: 32px; color: #111827; background: #f8fafc; }
        h1 { font-size: 28px; margin: 0 0 6px; }
        .meta { color: #4b5563; margin-bottom: 22px; }
        section { background: #fff; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
        h2 { font-size: 16px; margin: 0 0 10px; }
        pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #111827; color: #f9fafb; padding: 14px; border-radius: 6px; font-size: 12px; line-height: 1.42; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #d1d5db; padding: 6px 8px; vertical-align: top; text-align: left; }
        th { background: #111827; color: #fff; }
        .yes { color: #991b1b; font-weight: 700; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">Local auth/events red-team proof. Tokens redacted. Generated ${new Date().toISOString()}.</div>
      ${sections
        .map((section) => {
          if (section.kind === 'table') {
            return `<section><h2>${escapeHtml(section.heading)}</h2><table><thead><tr>${section.columns.map((col) => `<th>${escapeHtml(col)}</th>`).join('')}</tr></thead><tbody>${section.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></section>`
          }
          return `<section><h2>${escapeHtml(section.heading)}</h2><pre>${escapeHtml(shortJson(section.data))}</pre></section>`
        })
        .join('')}
    </body>
  </html>`
  const page = await browser.newPage({ viewport: { width: 1440, height: 1150 } })
  await page.setContent(html, { waitUntil: 'domcontentloaded' })
  const path = `${outDir}/${filename}`
  await page.screenshot({ path, fullPage: true })
  await page.close()
  screenshots.push(path)
  return filename
}

async function register(email, inviteCode = qaCode) {
  return api('/auth/register', {
    method: 'POST',
    headers: spoofIpHeaders(ip(Math.abs(hash(email)) % 200, 31)),
    body: JSON.stringify({ username: email, password, inviteCode }),
  })
}

async function login(email, loginPassword = password) {
  const result = await api('/auth/authenticate', {
    method: 'POST',
    headers: spoofIpHeaders(ip(Math.abs(hash(email)) % 200, 41)),
    body: JSON.stringify({ username: email, password: loginPassword }),
  })
  if (!result.body?.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(result)}`)
  }
  return result.body
}

function hash(value) {
  let acc = 0
  for (const ch of String(value)) acc = ((acc << 5) - acc + ch.charCodeAt(0)) | 0
  return acc
}

function getUserId(email) {
  const row = sqlJson(`SELECT id FROM users WHERE lower(username)='${escapeSql(email.toLowerCase())}' LIMIT 1;`)[0]
  if (!row?.id) throw new Error(`Missing user ${email}`)
  return row.id
}

async function fetchEvent(id) {
  return api('/fetchEvent', { method: 'POST', body: JSON.stringify({ id }) })
}

async function createEvent(token, fields = {}) {
  const result = await api('/addEvent', {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({
      title: `AE event ${nowTag}`,
      description: 'Local auth/events proof',
      latitude: 37.3349,
      longitude: -121.8881,
      address: 'Local red-team proof',
      date: '2026-09-01T12:00:00.000Z',
      centerID: ids.centerA,
      category: 91,
      ...fields,
    }),
  })
  if (result.body?.id) createdEventIds.add(result.body.id)
  return result
}

async function updateEvent(token, eventId, eventJSON) {
  return api('/updateEvent', {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({ eventJSON: { id: eventId, ...eventJSON } }),
  })
}

async function adminUpdateEvent(token, eventId, body) {
  return api(`/admin/events/${encodeURIComponent(eventId)}`, {
    method: 'PUT',
    headers: auth(token),
    body: JSON.stringify(body),
  })
}

const ids = {
  centerA: 'ae-center-a',
  centerB: 'ae-center-b',
  centerUnverified: 'ae-center-unverified',
}

const emails = {
  attacker: 'ae.attacker@janata.local',
  target: 'ae.target@janata.local',
  memberA: 'ae.membera@janata.local',
  memberB: 'ae.memberb@janata.local',
  unverified: 'ae.unverified@janata.local',
  sevakA: 'ae.sevaka@janata.local',
  sevakB: 'ae.sevakb@janata.local',
  inactiveSevak: 'ae.inactive.sevak@janata.local',
  suspendedSevak: 'ae.suspended.sevak@janata.local',
  admin: 'ae.numeric.admin@janata.local',
  guestVictim: 'ae.guest.victim@example.test',
}

function installDefinitions() {
  define('AE-F001', {
    title: 'Mutable email is used as an admin credential',
    severity: 'Critical',
    cvss: '9.8',
    affected: 'PUT /api/auth/update-profile, POST /api/auth/authenticate, adminMiddleware',
    cwe: 'CWE-266 Incorrect Privilege Assignment',
    rootCause: 'Admin status trusts users.email, while users can update email without ownership proof or uniqueness.',
    fix: 'Remove email-string admin checks. Store immutable admin assignments server-side and require verified email-change workflow.',
  })
  define('AE-F002', {
    title: 'Developer-email registration bypass grants admin-capable role',
    severity: 'Critical',
    cvss: '9.1',
    affected: 'POST /api/auth/register',
    cwe: 'CWE-287 Improper Authentication',
    rootCause: 'Public registration grants BRAHMACHARI when username matches DEVELOPER_EMAILS, without proving email ownership.',
    fix: 'Disable the bypass outside local dev and provision developer roles through an authenticated admin flow.',
  })
  define('AE-F003', {
    title: 'Inactive and suspended users remain fully authenticated',
    severity: 'High',
    cvss: '8.3',
    affected: 'POST /api/auth/authenticate, GET /api/auth/verify, POST /api/auth/refresh, event write routes',
    cwe: 'CWE-285 Improper Authorization',
    rootCause: 'authMiddleware and login/refresh flows do not reject is_active=0 or suspended accounts.',
    fix: 'Enforce active and non-suspended state on login, refresh, and every authenticated request.',
  })
  define('AE-F004', {
    title: 'Auth and event abuse throttles trust spoofable IP headers',
    severity: 'High',
    cvss: '8.2',
    affected: 'rateLimit middleware on auth and event RSVP routes',
    cwe: 'CWE-348 Use of Less Trusted Source',
    rootCause: 'The rate limiter uses request-supplied CF-Connecting-IP and X-Forwarded-For headers.',
    fix: 'Use trusted platform request metadata only and add per-account/per-event throttles.',
  })
  define('AE-F005', {
    title: 'Malformed JSON exposes internal parser errors across auth/event routes',
    severity: 'Low',
    cvss: '3.7',
    affected: 'Global error handler plus routes using c.req.json without local catch',
    cwe: 'CWE-209 Information Exposure Through Error Message',
    rootCause: 'app.onError returns exception messages to the client.',
    fix: 'Return generic error bodies externally and keep detailed parser errors in logs only.',
  })
  define('AE-F006', {
    title: 'Profile mutation lets users rewrite security-sensitive identity fields',
    severity: 'Critical',
    cvss: '9.0',
    affected: 'PUT /api/auth/update-profile, POST /api/auth/complete-onboarding',
    cwe: 'CWE-639 Authorization Bypass Through User-Controlled Key',
    rootCause: 'Self-service profile routes write email, center_id, and profile trust fields directly.',
    fix: 'Split profile display fields from trust fields; require verified workflows or admin approval for email and center membership.',
  })
  define('AE-F007', {
    title: 'Session lifecycle is stateless and logout does not revoke tokens',
    severity: 'High',
    cvss: '8.1',
    affected: 'POST /api/auth/deauthenticate, POST /api/auth/refresh',
    cwe: 'CWE-613 Insufficient Session Expiration',
    rootCause: 'Logout is a no-op and refresh tokens can be replayed until expiry or password rotation.',
    fix: 'Store refresh-token identifiers, rotate on use, revoke on logout, and rate-limit refresh attempts.',
  })
  define('AE-F008', {
    title: 'Unauthenticated account and invite state can be enumerated',
    severity: 'Medium',
    cvss: '5.3',
    affected: 'POST /api/userExistence, POST /api/auth/validate-invite-code',
    cwe: 'CWE-203 Observable Discrepancy',
    rootCause: 'Public endpoints return exact existence and invite-state differences.',
    fix: 'Remove user existence endpoint and normalize invite validation responses where possible.',
  })
  define('AE-F009', {
    title: 'Email verification and password reset can be spammed per account',
    severity: 'Medium',
    cvss: '6.8',
    affected: 'POST /api/auth/send-verification-email, POST /api/auth/password-reset/request',
    cwe: 'CWE-770 Allocation of Resources Without Limits',
    rootCause: 'Flows are throttled only by spoofable IP, not by account/email, and create multiple server-side tokens.',
    fix: 'Add per-account cooldowns, invalidate or reuse email-verification tokens, and alert on repeated reset requests.',
  })
  define('AE-F010', {
    title: 'Event creation is role-gated but not center-scoped',
    severity: 'High',
    cvss: '8.3',
    affected: 'POST /api/addEvent',
    cwe: 'CWE-863 Incorrect Authorization',
    rootCause: 'A sevak can create official events for any center without proving local coordinator scope.',
    fix: 'Scope event creation to centers the coordinator manages, or require admin approval for cross-center events.',
  })
  define('AE-F011', {
    title: 'Event creation accepts unsafe or nonsensical field values',
    severity: 'High',
    cvss: '8.0',
    affected: 'POST /api/addEvent',
    cwe: 'CWE-20 Improper Input Validation',
    rootCause: 'Create validation checks only a subset of fields and treats URL fields as length-bounded strings.',
    fix: 'Use a strict shared event schema with URL scheme allowlists, date validation, category enum checks, and bounded optional fields.',
  })
  define('AE-F012', {
    title: 'Event owner update path bypasses create-time validation',
    severity: 'High',
    cvss: '8.5',
    affected: 'POST /api/updateEvent',
    cwe: 'CWE-20 Improper Input Validation',
    rootCause: 'updateEvent writes fields directly, parses coordinates loosely, and validates almost none of the create constraints.',
    fix: 'Route all event mutations through one strict schema and validate ownership scope before applying changes.',
  })
  define('AE-F013', {
    title: 'Admin event update path has a separate validation bypass',
    severity: 'High',
    cvss: '8.0',
    affected: 'PUT /api/admin/events/:id',
    cwe: 'CWE-20 Improper Input Validation',
    rootCause: 'Admin update duplicates event mutation logic and omits URL/date/length/category validation.',
    fix: 'Share the same event schema for admin and owner updates; make admin override explicit and audited.',
  })
  define('AE-F014', {
    title: 'Legacy or downgraded creators retain event-management power',
    severity: 'High',
    cvss: '8.4',
    affected: 'POST /api/updateEvent, POST /api/removeEvent, GET /api/events/:id/roster',
    cwe: 'CWE-863 Incorrect Authorization',
    rootCause: 'Event management checks created_by/null-owner state, not current coordinator authorization.',
    fix: 'Require current coordinator/admin authority for edit/delete/roster, and backfill or admin-lock null-owner events.',
  })
  define('AE-F015', {
    title: 'Event RSVP endpoints bypass frontend-only signup constraints',
    severity: 'High',
    cvss: '8.1',
    affected: 'POST /api/attendEvent, POST /api/attendEventGuest',
    cwe: 'CWE-862 Missing Authorization',
    rootCause: 'RSVP APIs ignore signup_url and allow_janata_signup, so hidden/alternate signup controls are only enforced in UI.',
    fix: 'Enforce per-event signup policy server-side for both authenticated and guest RSVP routes.',
  })
  define('AE-F016', {
    title: 'Guest RSVP accepts unverified third-party identity claims',
    severity: 'Medium',
    cvss: '6.9',
    affected: 'POST /api/attendEventGuest, GET /api/events/:id/roster',
    cwe: 'CWE-287 Improper Authentication',
    rootCause: 'Guest RSVP stores arbitrary email/name as attendee-like data without confirming mailbox control.',
    fix: 'Require email confirmation before counting or exposing guest RSVPs, and de-duplicate by verified identity.',
  })
  define('AE-F017', {
    title: 'Event attendance and profile history are visible by username',
    severity: 'Medium',
    cvss: '6.5',
    affected: 'POST /api/getUserEvents, GET /api/profile/:username/events, GET /api/profile/:username/groups',
    cwe: 'CWE-359 Exposure of Private Personal Information',
    rootCause: 'Authenticated users can query another user by username and receive event attendance or center group history.',
    fix: 'Limit to self/admin or expose only explicitly public profile data through non-email identifiers.',
  })
  define('AE-F018', {
    title: 'Public event reads are unbounded and expose management identifiers',
    severity: 'Medium',
    cvss: '5.9',
    affected: 'GET /api/fetchAllEvents, POST /api/fetchEventsByCenter, GET /api/fetchEvent',
    cwe: 'CWE-200 Exposure of Sensitive Information',
    rootCause: 'Legacy public event read paths default to full unpaginated responses and include createdBy IDs.',
    fix: 'Require pagination, remove management identifiers from public payloads, and add cache-safe response shaping.',
  })
}

async function setup() {
  await mkdir(outDir, { recursive: true })
  await api('/health')
  sql(`
    INSERT OR IGNORE INTO centers (id, name, latitude, longitude, address, is_verified)
    VALUES ('${ids.centerA}', 'AE Center A', 37.3349, -121.8881, 'Local Center A', 1);
    INSERT OR IGNORE INTO centers (id, name, latitude, longitude, address, is_verified)
    VALUES ('${ids.centerB}', 'AE Center B', 40.7128, -74.0060, 'Local Center B', 1);
    INSERT OR IGNORE INTO centers (id, name, latitude, longitude, address, is_verified)
    VALUES ('${ids.centerUnverified}', 'AE Unverified Center', 34.0522, -118.2437, 'Local Unverified Center', 0);
    INSERT OR IGNORE INTO invite_codes (code, label, verification_level, is_active, max_uses)
    VALUES ('${qaCode}', 'Auth/events local red-team', 45, 1, NULL);
    UPDATE invite_codes SET is_active=1, verification_level=45, max_uses=NULL WHERE code='${qaCode}';
  `)
  const allEmails = [...Object.values(emails), developerEmail, adminEmail]
  sql(`DELETE FROM users WHERE lower(username) IN (${allEmails.map((e) => `'${escapeSql(e.toLowerCase())}'`).join(',')}) OR lower(email) IN (${allEmails.map((e) => `'${escapeSql(e.toLowerCase())}'`).join(',')});`)
  for (const email of Object.values(emails)) {
    await register(email)
  }
  sql(`
    UPDATE users SET verification_level=45, is_verified=1, is_active=1, center_id='${ids.centerA}', email_verified_at=created_at, first_name='Member', last_name='A', profile_complete=1 WHERE username='${emails.memberA}';
    UPDATE users SET verification_level=45, is_verified=1, is_active=1, center_id='${ids.centerB}', email_verified_at=created_at, first_name='Member', last_name='B', profile_complete=1 WHERE username='${emails.memberB}';
    UPDATE users SET verification_level=30, is_verified=0, is_active=1, center_id=NULL, invite_code=NULL, email_verified_at=NULL, first_name='Unverified', last_name='AE', profile_complete=1 WHERE username='${emails.unverified}';
    UPDATE users SET verification_level=54, is_verified=1, is_active=1, center_id='${ids.centerA}', email_verified_at=created_at, first_name='Sevak', last_name='A', profile_complete=1 WHERE username='${emails.sevakA}';
    UPDATE users SET verification_level=54, is_verified=1, is_active=1, center_id='${ids.centerB}', email_verified_at=created_at, first_name='Sevak', last_name='B', profile_complete=1 WHERE username='${emails.sevakB}';
    UPDATE users SET verification_level=54, is_verified=1, is_active=0, center_id='${ids.centerA}', email_verified_at=created_at, first_name='Inactive', last_name='Sevak', profile_complete=1 WHERE username='${emails.inactiveSevak}';
    UPDATE users SET verification_level=54, is_verified=1, is_active=1, center_id='${ids.centerA}', email_verified_at=created_at, suspended_at=datetime('now'), suspended_until=NULL, suspended_reason='local proof', first_name='Suspended', last_name='Sevak', profile_complete=1 WHERE username='${emails.suspendedSevak}';
    UPDATE users SET verification_level=110, is_verified=1, is_active=1, center_id='${ids.centerA}', email_verified_at=created_at, first_name='Numeric', last_name='Admin', profile_complete=1 WHERE username='${emails.admin}';
    UPDATE users SET verification_level=45, is_verified=1, is_active=1, center_id='${ids.centerA}', email_verified_at=created_at, first_name='Target', last_name='AE', profile_complete=1 WHERE username='${emails.target}';
    UPDATE users SET verification_level=45, is_verified=1, is_active=1, center_id='${ids.centerA}', email_verified_at=created_at, first_name='Attacker', last_name='AE', profile_complete=1 WHERE username='${emails.attacker}';
  `)
}

async function runRateLimitControl(path, baseOptions, maxRequests, findingId, label) {
  const same = []
  const varied = []
  const fixed = ip(Math.abs(hash(label)) % 200, 101)
  for (let i = 0; i < maxRequests + 1; i += 1) {
    same.push(await api(path, { ...baseOptions(i), headers: { ...(baseOptions(i).headers || {}), ...spoofIpHeaders(fixed) } }))
  }
  for (let i = 0; i < maxRequests + 3; i += 1) {
    varied.push(await api(path, { ...baseOptions(i), headers: { ...(baseOptions(i).headers || {}), ...spoofIpHeaders(ip(i + Math.abs(hash(label)), 111)) } }))
  }
  const confirmed = same.some((r) => r.status === 429) && varied.every((r) => r.status !== 429)
  record(findingId, `${label} limiter bypassed with varied forwarding headers`, confirmed, {
    endpoint: path,
    severity: 'High',
    cvss: '8.2',
    expected: 'Limiter should key on trusted client identity and continue blocking with spoofed forwarding headers.',
    observed: { sameIpStatuses: same.map((r) => r.status), variedIpStatuses: varied.map((r) => r.status) },
  })
}

async function main() {
  installDefinitions()
  await setup()

  const auths = {
    attacker: await login(emails.attacker),
    target: await login(emails.target),
    memberA: await login(emails.memberA),
    memberB: await login(emails.memberB),
    unverified: await login(emails.unverified),
    sevakA: await login(emails.sevakA),
    sevakB: await login(emails.sevakB),
    inactiveSevak: await login(emails.inactiveSevak),
    suspendedSevak: await login(emails.suspendedSevak),
    admin: await login(emails.admin),
  }

  const attackerBefore = await api('/admin/users?limit=1', { headers: auth(auths.attacker.token) })
  const spoofAdmin = await api('/auth/update-profile', {
    method: 'PUT',
    headers: auth(auths.attacker.token),
    body: JSON.stringify({ email: adminEmail }),
  })
  const attackerAfter = await api('/admin/users?limit=1', { headers: auth(auths.attacker.token) })
  const aliasLogin = await login(adminEmail, password)
  const aliasAdmin = await api('/admin/users?limit=1', { headers: auth(aliasLogin.token) })
  record('AE-F001', 'Normal user becomes admin by setting email to ADMIN_EMAIL', attackerBefore.status === 403 && spoofAdmin.status === 200 && attackerAfter.status === 200, {
    endpoint: 'PUT /api/auth/update-profile -> GET /api/admin/users',
    severity: 'Critical',
    cvss: '9.8',
    expected: 'Users must not be able to alter their own admin trust attribute.',
    observed: { attackerBefore, spoofAdmin, attackerAfter },
  })
  record('AE-F001', 'Login by spoofed admin email returns attacker-controlled admin session', aliasAdmin.status === 200, {
    endpoint: 'POST /api/auth/authenticate',
    severity: 'Critical',
    cvss: '9.8',
    expected: 'Email aliases must not let an attacker create an admin-recognized principal.',
    observed: { aliasUser: aliasLogin.user, aliasAdmin },
  })
  await api('/auth/update-profile', {
    method: 'PUT',
    headers: auth(auths.attacker.token),
    body: JSON.stringify({ email: emails.attacker }),
  })

  const devRegister = await api('/auth/register', {
    method: 'POST',
    headers: spoofIpHeaders(ip(1, 121)),
    body: JSON.stringify({ username: developerEmail, password }),
  })
  const devLogin = await login(developerEmail)
  const devVerify = await api('/auth/verify', { headers: auth(devLogin.token) })
  const devAdmin = await api('/admin/users?limit=1', { headers: auth(devLogin.token) })
  record('AE-F002', 'Invite-only registration still allows listed developer email without invite', devRegister.status === 201, {
    endpoint: 'POST /api/auth/register',
    severity: 'Critical',
    cvss: '9.1',
    expected: 'Invite-only mode should block public role-bearing registration without invite and email proof.',
    observed: devRegister,
  })
  record('AE-F002', 'Developer self-registration receives admin-capable verificationLevel', devVerify.body?.user?.verificationLevel >= 107, {
    endpoint: 'GET /api/auth/verify',
    severity: 'Critical',
    cvss: '9.1',
    expected: 'Self-registered users should not receive admin-capable role solely from email string.',
    observed: devVerify,
  })
  record('AE-F002', 'Developer self-registration can call admin endpoint', devAdmin.status === 200, {
    endpoint: 'GET /api/admin/users',
    severity: 'Critical',
    cvss: '9.1',
    expected: 'New public signup should not be able to read admin data.',
    observed: devAdmin,
  })

  const inactiveVerify = await api('/auth/verify', { headers: auth(auths.inactiveSevak.token) })
  const inactiveRefresh = await api('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: auths.inactiveSevak.refreshToken }),
  })
  const inactiveCreate = await createEvent(auths.inactiveSevak.token, { title: 'AE inactive sevak create' })
  const suspendedVerify = await api('/auth/verify', { headers: auth(auths.suspendedSevak.token) })
  const suspendedRefresh = await api('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: auths.suspendedSevak.refreshToken }),
  })
  const suspendedCreate = await createEvent(auths.suspendedSevak.token, { title: 'AE suspended sevak create' })
  record('AE-F003', 'Inactive user token verifies successfully', inactiveVerify.status === 200 && inactiveVerify.body?.user?.isActive === false, {
    endpoint: 'GET /api/auth/verify',
    severity: 'High',
    cvss: '8.3',
    expected: 'Inactive accounts should be rejected by auth middleware.',
    observed: inactiveVerify,
  })
  record('AE-F003', 'Inactive user can refresh session', inactiveRefresh.status === 200, {
    endpoint: 'POST /api/auth/refresh',
    severity: 'High',
    cvss: '8.3',
    expected: 'Inactive accounts should not receive fresh tokens.',
    observed: inactiveRefresh,
  })
  record('AE-F003', 'Inactive sevak can create event', inactiveCreate.status === 200, {
    endpoint: 'POST /api/addEvent',
    severity: 'High',
    cvss: '8.3',
    expected: 'Inactive coordinator account should not write events.',
    observed: inactiveCreate,
  })
  record('AE-F003', 'Suspended user token verifies successfully', suspendedVerify.status === 200 && suspendedVerify.body?.user?.isSuspended === true, {
    endpoint: 'GET /api/auth/verify',
    severity: 'High',
    cvss: '8.3',
    expected: 'Suspended accounts should be rejected by auth middleware or high-risk writes.',
    observed: suspendedVerify,
  })
  record('AE-F003', 'Suspended user can refresh session', suspendedRefresh.status === 200, {
    endpoint: 'POST /api/auth/refresh',
    severity: 'High',
    cvss: '8.3',
    expected: 'Suspended accounts should not receive fresh tokens.',
    observed: suspendedRefresh,
  })
  record('AE-F003', 'Suspended sevak can create event', suspendedCreate.status === 200, {
    endpoint: 'POST /api/addEvent',
    severity: 'High',
    cvss: '8.3',
    expected: 'Suspended coordinator account should not write events.',
    observed: suspendedCreate,
  })

  await runRateLimitControl('/auth/authenticate', () => ({
    method: 'POST',
    body: JSON.stringify({ username: 'missing-ae@janata.local', password: 'bad-password' }),
  }), 5, 'AE-F004', 'Login')
  await runRateLimitControl('/auth/register', (i) => ({
    method: 'POST',
    body: JSON.stringify({ username: `ae-rate-${nowTag}-${i}@janata.local`, password }),
  }), 5, 'AE-F004', 'Register')
  await runRateLimitControl('/auth/password-reset/request', () => ({
    method: 'POST',
    body: JSON.stringify({ username: emails.target }),
  }), 5, 'AE-F004', 'Password reset request')
  await runRateLimitControl('/auth/password-reset/verify', () => ({
    method: 'POST',
    body: JSON.stringify({ username: emails.target, code: '000000', newPassword: 'PreviewTest2027!' }),
  }), 10, 'AE-F004', 'Password reset verify')
  await runRateLimitControl('/auth/validate-invite-code', () => ({
    method: 'POST',
    body: JSON.stringify({ code: 'NOT-A-REAL-CODE' }),
  }), 60, 'AE-F004', 'Invite-code validation')
  sql(`UPDATE users SET email_verified_at=NULL WHERE username='${emails.target}';`)
  await runRateLimitControl('/auth/send-verification-email', () => ({
    method: 'POST',
    headers: auth(auths.target.token),
  }), 3, 'AE-F004', 'Email verification send')

  const malformedTargets = [
    ['POST /auth/register', '/auth/register', { method: 'POST' }],
    ['POST /auth/authenticate', '/auth/authenticate', { method: 'POST' }],
    ['POST /auth/refresh', '/auth/refresh', { method: 'POST' }],
    ['PUT /auth/update-profile', '/auth/update-profile', { method: 'PUT', headers: auth(auths.memberA.token) }],
    ['POST /addEvent', '/addEvent', { method: 'POST', headers: auth(auths.sevakA.token) }],
    ['POST /updateEvent', '/updateEvent', { method: 'POST', headers: auth(auths.sevakA.token) }],
    ['POST /removeEvent', '/removeEvent', { method: 'POST', headers: auth(auths.sevakA.token) }],
    ['POST /attendEvent', '/attendEvent', { method: 'POST', headers: auth(auths.memberA.token) }],
    ['POST /unattendEvent', '/unattendEvent', { method: 'POST', headers: auth(auths.memberA.token) }],
    ['PUT /admin/events/:id', `/admin/events/${inactiveCreate.body?.id || 'missing'}`, { method: 'PUT', headers: auth(auths.admin.token) }],
    ['POST /admin/users/:id/verify', `/admin/users/${getUserId(emails.target)}/verify`, { method: 'POST', headers: auth(auths.admin.token) }],
  ]
  for (const [label, path, init] of malformedTargets) {
    const result = await api(path, {
      ...init,
      headers: { ...(init.headers || {}), 'Content-Type': 'application/json' },
      body: '{"broken":',
    })
    record('AE-F005', `${label} leaks parser/internal error on malformed JSON`, result.status === 500 && typeof result.body?.error === 'string', {
      endpoint: label,
      severity: 'Low',
      cvss: '3.7',
      expected: 'Malformed JSON should return a generic 400 without internals.',
      observed: result,
    })
  }

  const duplicateEmail = await api('/auth/update-profile', {
    method: 'PUT',
    headers: auth(auths.memberA.token),
    body: JSON.stringify({ email: emails.target }),
  })
  const invalidEmail = await api('/auth/update-profile', {
    method: 'PUT',
    headers: auth(auths.memberB.token),
    body: JSON.stringify({ email: 'not-an-email' }),
  })
  const centerSelfUpdate = await api('/auth/update-profile', {
    method: 'PUT',
    headers: auth(auths.unverified.token),
    body: JSON.stringify({ centerID: ids.centerB }),
  })
  const centerOnboarding = await api('/auth/complete-onboarding', {
    method: 'POST',
    headers: auth(auths.unverified.token),
    body: JSON.stringify({ centerID: ids.centerA, profileComplete: true }),
  })
  const hugeProfile = await api('/auth/update-profile', {
    method: 'PUT',
    headers: auth(auths.memberA.token),
    body: JSON.stringify({ firstName: 'A'.repeat(5000), bio: 'B'.repeat(10000), profileImage: "javascript:alert('profile')" }),
  })
  const duplicateRows = sqlJson(`SELECT username, email FROM users WHERE lower(email)='${escapeSql(emails.target)}' ORDER BY username;`)
  record('AE-F006', 'Duplicate email can be assigned without verification', duplicateEmail.status === 200 && duplicateRows.length >= 2, {
    endpoint: 'PUT /api/auth/update-profile',
    severity: 'High',
    cvss: '8.1',
    expected: 'Email changes should require ownership proof and uniqueness.',
    observed: { duplicateEmail, duplicateRows },
  })
  record('AE-F006', 'Invalid email string can be assigned to account', invalidEmail.status === 200, {
    endpoint: 'PUT /api/auth/update-profile',
    severity: 'Medium',
    cvss: '6.4',
    expected: 'Email fields should be syntactically valid and verified.',
    observed: invalidEmail,
  })
  record('AE-F006', 'Unverified user can self-assign center through update-profile', centerSelfUpdate.status === 200 && centerSelfUpdate.body?.user?.centerID === ids.centerB, {
    endpoint: 'PUT /api/auth/update-profile',
    severity: 'Critical',
    cvss: '9.0',
    expected: 'Center membership should be server-controlled.',
    observed: centerSelfUpdate,
  })
  record('AE-F006', 'Unverified user can self-assign center through complete-onboarding', centerOnboarding.status === 200 && centerOnboarding.body?.user?.centerID === ids.centerA, {
    endpoint: 'POST /api/auth/complete-onboarding',
    severity: 'Critical',
    cvss: '9.0',
    expected: 'Onboarding should not establish trusted membership without approval.',
    observed: centerOnboarding,
  })
  record('AE-F006', 'Profile route stores oversized display fields and javascript image URL', hugeProfile.status === 200 && hugeProfile.body?.user?.profileImage?.startsWith('javascript:'), {
    endpoint: 'PUT /api/auth/update-profile',
    severity: 'High',
    cvss: '8.0',
    expected: 'Profile fields should use length limits and URL scheme allowlists.',
    observed: hugeProfile,
  })

  const logout = await api('/auth/deauthenticate', { method: 'POST', headers: auth(auths.memberA.token) })
  const verifyAfterLogout = await api('/auth/verify', { headers: auth(auths.memberA.token) })
  const refreshOne = await api('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: auths.memberA.refreshToken }) })
  const refreshTwo = await api('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: auths.memberA.refreshToken }) })
  const refreshSpam = []
  for (let i = 0; i < 16; i += 1) {
    refreshSpam.push(await api('/auth/refresh', {
      method: 'POST',
      headers: spoofIpHeaders(ip(200 + i, 131)),
      body: JSON.stringify({ refreshToken: `bad-${i}` }),
    }))
  }
  record('AE-F007', 'Logout/deauthenticate does not invalidate access token', logout.status === 200 && verifyAfterLogout.status === 200, {
    endpoint: 'POST /api/auth/deauthenticate -> GET /api/auth/verify',
    severity: 'High',
    cvss: '8.1',
    expected: 'Logout should revoke the current session.',
    observed: { logout, verifyAfterLogout },
  })
  record('AE-F007', 'Same refresh token can be replayed multiple times', refreshOne.status === 200 && refreshTwo.status === 200, {
    endpoint: 'POST /api/auth/refresh',
    severity: 'High',
    cvss: '8.1',
    expected: 'Refresh token rotation should invalidate the previous token on use.',
    observed: { refreshOne, refreshTwo },
  })
  record('AE-F007', 'Refresh endpoint has no visible rate limit', refreshSpam.every((r) => r.status !== 429), {
    endpoint: 'POST /api/auth/refresh',
    severity: 'Medium',
    cvss: '6.5',
    expected: 'Refresh attempts should be throttled.',
    observed: refreshSpam.map((r) => r.status),
  })

  const enumKnown = await api('/userExistence', { method: 'POST', body: JSON.stringify({ username: emails.target }) })
  const enumUnknown = await api('/userExistence', { method: 'POST', body: JSON.stringify({ username: `missing-${nowTag}@janata.local` }) })
  sql(`
    INSERT OR REPLACE INTO invite_codes (code, label, verification_level, is_active, expires_at, max_uses, uses_count)
    VALUES ('AE-INACTIVE', 'inactive proof', 45, 0, NULL, NULL, 0);
    INSERT OR REPLACE INTO invite_codes (code, label, verification_level, is_active, expires_at, max_uses, uses_count)
    VALUES ('AE-EXPIRED', 'expired proof', 45, 1, '2000-01-01T00:00:00.000Z', NULL, 0);
    INSERT OR REPLACE INTO invite_codes (code, label, verification_level, is_active, expires_at, max_uses, uses_count)
    VALUES ('AE-EXHAUSTED', 'exhausted proof', 45, 1, NULL, 1, 1);
  `)
  const inviteStates = {}
  for (const code of ['AE-INACTIVE', 'AE-EXPIRED', 'AE-EXHAUSTED', 'AE-MISSING']) {
    inviteStates[code] = await api('/auth/validate-invite-code', {
      method: 'POST',
      headers: spoofIpHeaders(ip(Math.abs(hash(code)) % 200, 141)),
      body: JSON.stringify({ code }),
    })
  }
  record('AE-F008', 'Public userExistence distinguishes valid accounts from missing accounts', enumKnown.body?.existence === true && enumUnknown.body?.existence === false, {
    endpoint: 'POST /api/userExistence',
    severity: 'Medium',
    cvss: '5.3',
    expected: 'Public auth flow should not reveal account existence.',
    observed: { enumKnown, enumUnknown },
  })
  record('AE-F008', 'Invite validation reveals inactive/expired/exhausted/not-found states', new Set(Object.values(inviteStates).map((r) => r.body?.reason)).size >= 3, {
    endpoint: 'POST /api/auth/validate-invite-code',
    severity: 'Low',
    cvss: '3.9',
    expected: 'Invite validation should avoid unnecessarily precise state disclosure.',
    observed: inviteStates,
  })

  const targetId = getUserId(emails.target)
  const resetBefore = sqlJson(`SELECT COUNT(*) AS count FROM password_reset_codes WHERE user_id='${targetId}';`)[0]?.count ?? 0
  const resetRequests = []
  for (let i = 0; i < 8; i += 1) {
    resetRequests.push(await api('/auth/password-reset/request', {
      method: 'POST',
      headers: spoofIpHeaders(ip(20 + i, 151)),
      body: JSON.stringify({ username: emails.target }),
    }))
  }
  const resetAfter = sqlJson(`SELECT COUNT(*) AS count, SUM(CASE WHEN used_at IS NULL THEN 1 ELSE 0 END) AS active FROM password_reset_codes WHERE user_id='${targetId}';`)[0]
  sql(`UPDATE users SET email_verified_at=NULL WHERE username='${emails.target}';`)
  const emailTokensBefore = sqlJson(`SELECT COUNT(*) AS count FROM email_verification_tokens WHERE user_id='${targetId}';`)[0]?.count ?? 0
  const emailSends = []
  for (let i = 0; i < 6; i += 1) {
    emailSends.push(await api('/auth/send-verification-email', {
      method: 'POST',
      headers: { ...auth(auths.target.token), ...spoofIpHeaders(ip(40 + i, 151)) },
    }))
  }
  const emailTokensAfter = sqlJson(`SELECT COUNT(*) AS count, SUM(CASE WHEN consumed_at IS NULL THEN 1 ELSE 0 END) AS active FROM email_verification_tokens WHERE user_id='${targetId}';`)[0]
  record('AE-F009', 'Password reset request spam creates repeated reset-code rows for one account', resetRequests.every((r) => r.status === 200) && Number(resetAfter?.count ?? 0) >= Number(resetBefore) + 6, {
    endpoint: 'POST /api/auth/password-reset/request',
    severity: 'Medium',
    cvss: '6.8',
    expected: 'Per-account cooldown should prevent repeated reset issuance.',
    observed: { resetBefore, statuses: resetRequests.map((r) => r.status), resetAfter },
  })
  record('AE-F009', 'Email verification resend creates multiple simultaneously valid tokens', Number(emailTokensAfter?.active ?? 0) >= 2, {
    endpoint: 'POST /api/auth/send-verification-email',
    severity: 'Medium',
    cvss: '6.5',
    expected: 'Resend should reuse or invalidate prior tokens and enforce per-account cooldown.',
    observed: { emailTokensBefore, statuses: emailSends.map((r) => ({ status: r.status, body: r.body })), emailTokensAfter },
  })

  const crossCenter = await createEvent(auths.sevakA.token, { title: 'AE cross-center create', centerID: ids.centerB })
  const crossFetch = crossCenter.body?.id ? await fetchEvent(crossCenter.body.id) : null
  const unverifiedCenter = await createEvent(auths.sevakA.token, { title: 'AE unverified center create', centerID: ids.centerUnverified })
  const unverifiedCenterFetch = unverifiedCenter.body?.id ? await fetchEvent(unverifiedCenter.body.id) : null
  record('AE-F010', 'Sevak for center A can create official event under center B', crossCenter.status === 200 && crossFetch?.body?.event?.centerID === ids.centerB && crossFetch?.body?.event?.isOfficial === true, {
    endpoint: 'POST /api/addEvent',
    severity: 'High',
    cvss: '8.3',
    expected: 'Coordinator should only create events for managed centers.',
    observed: { crossCenter, crossFetch },
  })
  record('AE-F010', 'Sevak can create official event under unverified center', unverifiedCenter.status === 200 && unverifiedCenterFetch?.body?.event?.centerID === ids.centerUnverified && unverifiedCenterFetch?.body?.event?.isOfficial === true, {
    endpoint: 'POST /api/addEvent',
    severity: 'High',
    cvss: '8.0',
    expected: 'Unverified centers should not host official events without admin approval.',
    observed: { unverifiedCenter, unverifiedCenterFetch },
  })

  const schemes = ['javascript:alert(1)', 'data:text/html,<h1>AE</h1>', 'file:///etc/passwd', 'vbscript:msgbox(1)']
  const createCases = [
    ['empty title', { title: '' }, (event) => event?.title === '', 'Medium', '6.5'],
    ['missing title', { title: undefined }, (event) => event?.title === '', 'Medium', '6.5'],
    ['invalid date string', { date: 'not-a-date' }, (event) => event?.date === 'not-a-date', 'Medium', '6.2'],
    ['impossible calendar date', { date: '2026-99-99T25:61:00Z' }, (event) => event?.date === '2026-99-99T25:61:00Z', 'Medium', '6.2'],
    ['past event date', { date: '2000-01-01T00:00:00Z' }, (event) => event?.date === '2000-01-01T00:00:00Z', 'Medium', '5.9'],
    ['huge pointOfContact', { pointOfContact: 'P'.repeat(9000) }, (event) => String(event?.pointOfContact || '').length >= 9000, 'Medium', '6.5'],
    ['negative category', { category: -999 }, (event) => event?.category === -999, 'Medium', '5.8'],
    ['huge category', { category: 999999 }, (event) => event?.category === 999999, 'Medium', '5.8'],
    ['string category', { category: 'admin-role' }, (event) => event?.category === 'admin-role', 'Medium', '5.8'],
    ['boolean category', { category: true }, (event) => event?.category === true || event?.category === 1, 'Low', '3.9'],
    ['numeric string latitude rejected on create bypass attempt', { latitude: '37.5' }, (_event, create) => create.status === 400, 'Info', '0.0'],
  ]
  for (const scheme of schemes) {
    createCases.push([`externalUrl scheme ${scheme.split(':')[0]}`, { externalUrl: scheme }, (event) => event?.externalUrl === scheme, 'High', '8.0'])
    createCases.push([`signupUrl scheme ${scheme.split(':')[0]}`, { signupUrl: scheme }, (event) => event?.signupUrl === scheme, 'High', '8.0'])
    createCases.push([`image scheme ${scheme.split(':')[0]}`, { image: scheme }, (event) => event?.image === scheme, 'High', '8.0'])
  }
  for (const [label, fields, predicate, severity, cvss] of createCases) {
    const create = await createEvent(auths.sevakA.token, { title: `AE create ${label}`, ...fields })
    const fetched = create.body?.id ? await fetchEvent(create.body.id) : null
    const confirmed = severity === 'Info' ? false : create.status === 200 && predicate(fetched?.body?.event, create)
    record('AE-F011', `Create accepts ${label}`, confirmed, {
      endpoint: 'POST /api/addEvent',
      severity,
      cvss,
      expected: 'Create route should reject unsafe or nonsensical event field values.',
      observed: { create, fetched },
    })
  }

  const updateBase = await createEvent(auths.sevakA.token, { title: 'AE update base' })
  const updateId = updateBase.body.id
  const long = {
    title: 'T'.repeat(1200),
    description: 'D'.repeat(9000),
    address: 'A'.repeat(1500),
    pointOfContact: 'C'.repeat(9000),
  }
  const updateCases = [
    ['cross-center move', { centerID: ids.centerB }, (event) => event?.centerID === ids.centerB, 'High', '8.5'],
    ['invalid date string', { date: 'not-a-date' }, (event) => event?.date === 'not-a-date', 'Medium', '6.2'],
    ['impossible calendar date', { date: '2026-99-99T25:61:00Z' }, (event) => event?.date === '2026-99-99T25:61:00Z', 'Medium', '6.2'],
    ['past date', { date: '2000-01-01T00:00:00Z' }, (event) => event?.date === '2000-01-01T00:00:00Z', 'Medium', '5.9'],
    ['empty title', { title: '' }, (event) => event?.title === '', 'Medium', '6.5'],
    ['huge title', { title: long.title }, (event) => String(event?.title || '').length >= 1200, 'High', '8.0'],
    ['huge description', { description: long.description }, (event) => String(event?.description || '').length >= 9000, 'High', '8.0'],
    ['huge address', { address: long.address }, (event) => String(event?.address || '').length >= 1500, 'Medium', '6.8'],
    ['huge pointOfContact', { pointOfContact: long.pointOfContact }, (event) => String(event?.pointOfContact || '').length >= 9000, 'Medium', '6.8'],
    ['latitude 999', { latitude: 999 }, (event) => event?.latitude === 999, 'High', '8.0'],
    ['longitude -999', { longitude: -999 }, (event) => event?.longitude === -999, 'High', '8.0'],
    ['partial numeric latitude string', { latitude: '37abc' }, (event) => event?.latitude === 37, 'Medium', '6.4'],
    ['partial numeric longitude string', { longitude: '-122abc' }, (event) => event?.longitude === -122, 'Medium', '6.4'],
    ['negative category', { category: -999 }, (event) => event?.category === -999, 'Medium', '5.8'],
    ['huge category', { category: 999999 }, (event) => event?.category === 999999, 'Medium', '5.8'],
    ['string category', { category: 'admin-role' }, (event) => event?.category === 'admin-role', 'Medium', '5.8'],
    ['allowJanataSignup string false coerces true', { allowJanataSignup: 'false' }, (event) => event?.allowJanataSignup === true, 'Medium', '6.1'],
  ]
  for (const scheme of schemes) {
    updateCases.push([`externalUrl scheme ${scheme.split(':')[0]}`, { externalUrl: scheme }, (event) => event?.externalUrl === scheme, 'High', '8.5'])
    updateCases.push([`signupUrl scheme ${scheme.split(':')[0]}`, { signupUrl: scheme }, (event) => event?.signupUrl === scheme, 'High', '8.5'])
    updateCases.push([`image scheme ${scheme.split(':')[0]}`, { image: scheme }, (event) => event?.image === scheme, 'High', '8.0'])
  }
  for (const [label, eventJSON, predicate, severity, cvss] of updateCases) {
    const update = await updateEvent(auths.sevakA.token, updateId, eventJSON)
    const fetched = await fetchEvent(updateId)
    record('AE-F012', `Owner update accepts ${label}`, update.status === 200 && predicate(fetched.body?.event), {
      endpoint: 'POST /api/updateEvent',
      severity,
      cvss,
      expected: 'Update route should enforce the same schema as event creation.',
      observed: { update, fetched },
    })
  }

  const adminBase = await createEvent(auths.sevakA.token, { title: 'AE admin update base' })
  const adminEventId = adminBase.body.id
  const adminCases = [
    ['invalid date string', { date: 'not-a-date' }, (event) => event?.date === 'not-a-date', 'Medium', '6.2'],
    ['past date', { date: '2000-01-01T00:00:00Z' }, (event) => event?.date === '2000-01-01T00:00:00Z', 'Medium', '5.9'],
    ['empty title', { title: '' }, (event) => event?.title === '', 'Medium', '6.5'],
    ['huge title', { title: long.title }, (event) => String(event?.title || '').length >= 1200, 'High', '8.0'],
    ['huge description', { description: long.description }, (event) => String(event?.description || '').length >= 9000, 'High', '8.0'],
    ['huge address', { address: long.address }, (event) => String(event?.address || '').length >= 1500, 'Medium', '6.8'],
    ['huge pointOfContact', { pointOfContact: long.pointOfContact }, (event) => String(event?.pointOfContact || '').length >= 9000, 'Medium', '6.8'],
    ['negative category', { category: -999 }, (event) => event?.category === -999, 'Medium', '5.8'],
    ['huge category', { category: 999999 }, (event) => event?.category === 999999, 'Medium', '5.8'],
    ['string category', { category: 'admin-role' }, (event) => event?.category === 'admin-role', 'Medium', '5.8'],
    ['allowJanataSignup string false coerces true', { allowJanataSignup: 'false' }, (event) => event?.allowJanataSignup === true, 'Medium', '6.1'],
  ]
  for (const scheme of schemes) {
    adminCases.push([`externalUrl scheme ${scheme.split(':')[0]}`, { externalUrl: scheme }, (event) => event?.externalUrl === scheme, 'High', '8.0'])
    adminCases.push([`signupUrl scheme ${scheme.split(':')[0]}`, { signupUrl: scheme }, (event) => event?.signupUrl === scheme, 'High', '8.0'])
    adminCases.push([`image scheme ${scheme.split(':')[0]}`, { image: scheme }, (event) => event?.image === scheme, 'High', '8.0'])
  }
  for (const [label, body, predicate, severity, cvss] of adminCases) {
    const update = await adminUpdateEvent(auths.admin.token, adminEventId, body)
    const fetched = await fetchEvent(adminEventId)
    record('AE-F013', `Admin update accepts ${label}`, update.status === 200 && predicate(fetched.body?.event), {
      endpoint: 'PUT /api/admin/events/:id',
      severity,
      cvss,
      expected: 'Admin event update should use strict schema validation.',
      observed: { update, fetched },
    })
  }

  const legacyId = `ae-null-owner-${nowTag}`
  sql(`INSERT OR REPLACE INTO events (id, title, description, date, latitude, longitude, address, center_id, created_by, created_at, updated_at)
       VALUES ('${legacyId}', 'AE null-owner event', 'local proof', '2026-09-04T12:00:00Z', 37, -122, 'Legacy', '${ids.centerA}', NULL, datetime('now'), datetime('now'));`)
  createdEventIds.add(legacyId)
  const legacyEdit = await updateEvent(auths.memberA.token, legacyId, { title: 'AE null owner edited by member' })
  const legacyFetch = await fetchEvent(legacyId)
  const downgradedBase = await createEvent(auths.sevakA.token, { title: 'AE downgrade base' })
  const downgradedId = downgradedBase.body.id
  const guest = await api('/attendEventGuest', {
    method: 'POST',
    headers: spoofIpHeaders(ip(77, 171)),
    body: JSON.stringify({ eventID: downgradedId, email: 'downgraded-guest@example.test', name: 'Downgraded Guest' }),
  })
  sql(`UPDATE users SET verification_level=45 WHERE username='${emails.sevakA}';`)
  const downgradedUpdate = await updateEvent(auths.sevakA.token, downgradedId, { title: 'AE downgraded creator edit' })
  const downgradedRoster = await api(`/events/${encodeURIComponent(downgradedId)}/roster`, { headers: auth(auths.sevakA.token) })
  const downgradedDelete = await api('/removeEvent', {
    method: 'POST',
    headers: auth(auths.sevakA.token),
    body: JSON.stringify({ id: downgradedId }),
  })
  sql(`UPDATE users SET verification_level=54 WHERE username='${emails.sevakA}';`)
  record('AE-F014', 'Normal member can edit null-owner legacy event', legacyEdit.status === 200 && legacyFetch.body?.event?.title === 'AE null owner edited by member', {
    endpoint: 'POST /api/updateEvent',
    severity: 'High',
    cvss: '8.4',
    expected: 'Null-owner legacy events should be admin-locked or backfilled.',
    observed: { legacyEdit, legacyFetch },
  })
  record('AE-F014', 'Downgraded creator can still edit event', downgradedUpdate.status === 200, {
    endpoint: 'POST /api/updateEvent',
    severity: 'High',
    cvss: '8.4',
    expected: 'Current coordinator authorization should be required for edits.',
    observed: downgradedUpdate,
  })
  record('AE-F014', 'Downgraded creator can still view guest roster PII', guest.status === 200 && downgradedRoster.status === 200 && downgradedRoster.body?.guests?.some((g) => g.email === 'downgraded-guest@example.test'), {
    endpoint: 'GET /api/events/:id/roster',
    severity: 'High',
    cvss: '8.4',
    expected: 'Roster PII should require current coordinator/admin authority.',
    observed: { guest, downgradedRoster },
  })
  record('AE-F014', 'Downgraded creator can still delete event', downgradedDelete.status === 200, {
    endpoint: 'POST /api/removeEvent',
    severity: 'High',
    cvss: '8.4',
    expected: 'Delete should require current coordinator/admin authority.',
    observed: downgradedDelete,
  })

  const externalOnly = await createEvent(auths.sevakA.token, {
    title: 'AE external-only event',
    signupUrl: 'https://example.test/signup',
    allowJanataSignup: false,
  })
  const externalId = externalOnly.body.id
  const authedRsvp = await api('/attendEvent', {
    method: 'POST',
    headers: auth(auths.memberA.token),
    body: JSON.stringify({ eventID: externalId }),
  })
  const guestRsvp = await api('/attendEventGuest', {
    method: 'POST',
    headers: spoofIpHeaders(ip(88, 181)),
    body: JSON.stringify({ eventID: externalId, email: 'external-guest@example.test', name: 'External Guest' }),
  })
  const externalFetch = await fetchEvent(externalId)
  record('AE-F015', 'Authenticated RSVP succeeds for external-only event with allowJanataSignup=false', authedRsvp.status === 200, {
    endpoint: 'POST /api/attendEvent',
    severity: 'High',
    cvss: '8.1',
    expected: 'Server should reject native RSVP when event policy says external signup only.',
    observed: { externalOnly, authedRsvp, externalFetch },
  })
  record('AE-F015', 'Guest RSVP succeeds for external-only event with allowJanataSignup=false', guestRsvp.status === 200, {
    endpoint: 'POST /api/attendEventGuest',
    severity: 'High',
    cvss: '8.1',
    expected: 'Guest API should enforce the same signup policy as the UI.',
    observed: { externalOnly, guestRsvp, externalFetch },
  })

  const spoofGuest = await api('/attendEventGuest', {
    method: 'POST',
    headers: spoofIpHeaders(ip(99, 191)),
    body: JSON.stringify({ eventID: externalId, email: emails.guestVictim, name: 'Victim Name' }),
  })
  const externalRoster = await api(`/events/${encodeURIComponent(externalId)}/roster`, { headers: auth(auths.sevakA.token) })
  const spamGuest = []
  for (let i = 0; i < 10; i += 1) {
    spamGuest.push(await api('/attendEventGuest', {
      method: 'POST',
      headers: spoofIpHeaders(ip(i, 201)),
      body: JSON.stringify({ eventID: externalId, email: `spam-${nowTag}-${i}@example.test`, name: `Spam ${i}` }),
    }))
  }
  record('AE-F016', 'Guest RSVP can store someone else email/name without mailbox proof', spoofGuest.status === 200 && externalRoster.body?.guests?.some((g) => g.email === emails.guestVictim), {
    endpoint: 'POST /api/attendEventGuest -> GET /api/events/:id/roster',
    severity: 'Medium',
    cvss: '6.9',
    expected: 'Guest identity should not be trusted or exposed until email ownership is confirmed.',
    observed: { spoofGuest, externalRoster },
  })
  record('AE-F016', 'Guest RSVP spam bypasses nominal limiter with varied headers', spamGuest.filter((r) => r.status === 200).length >= 8, {
    endpoint: 'POST /api/attendEventGuest',
    severity: 'High',
    cvss: '8.0',
    expected: 'Public RSVP should use trusted-IP plus event/account abuse controls.',
    observed: spamGuest.map((r) => ({ status: r.status, body: r.body })),
  })

  const privateRsvp = await api('/attendEvent', {
    method: 'POST',
    headers: auth(auths.target.token),
    body: JSON.stringify({ eventID: externalId }),
  })
  const userEventsPost = await api('/getUserEvents', {
    method: 'POST',
    headers: auth(auths.memberB.token),
    body: JSON.stringify({ username: emails.target }),
  })
  const userEventsGet = await api(`/profile/${encodeURIComponent(emails.target)}/events`, {
    headers: auth(auths.memberB.token),
  })
  const userGroupsGet = await api(`/profile/${encodeURIComponent(emails.target)}/groups`, {
    headers: auth(auths.memberB.token),
  })
  record('AE-F017', 'Any authenticated user can fetch another username event attendance via legacy POST', privateRsvp.status === 200 || userEventsPost.body?.events?.length >= 1, {
    endpoint: 'POST /api/getUserEvents',
    severity: 'Medium',
    cvss: '6.5',
    expected: 'Event attendance history should be self/admin or intentionally public only.',
    observed: { privateRsvp, userEventsPost },
  })
  record('AE-F017', 'Any authenticated user can fetch another username event attendance via profile route', userEventsGet.status === 200 && Array.isArray(userEventsGet.body?.events), {
    endpoint: 'GET /api/profile/:username/events',
    severity: 'Medium',
    cvss: '6.5',
    expected: 'Profile event history should not be queryable by email-like username.',
    observed: userEventsGet,
  })
  record('AE-F017', 'Any authenticated user can fetch another username center group', userGroupsGet.status === 200 && Array.isArray(userGroupsGet.body?.groups), {
    endpoint: 'GET /api/profile/:username/groups',
    severity: 'Medium',
    cvss: '6.0',
    expected: 'Center membership should be exposed only through explicit public profile policy.',
    observed: userGroupsGet,
  })

  const fetchAllNoLimit = await api('/fetchAllEvents')
  const fetchByCenterNoLimit = await api('/fetchEventsByCenter', {
    method: 'POST',
    body: JSON.stringify({ centerID: ids.centerA }),
  })
  const fetchOne = await fetchEvent(externalId)
  const missingRegistration = await api('/events/not-a-real-event/registration', {
    headers: auth(auths.memberA.token),
  })
  record('AE-F018', 'fetchAllEvents defaults to unbounded public event dump', fetchAllNoLimit.status === 200 && Array.isArray(fetchAllNoLimit.body?.events) && fetchAllNoLimit.body?.total === undefined, {
    endpoint: 'GET /api/fetchAllEvents',
    severity: 'Medium',
    cvss: '5.9',
    expected: 'Public event listing should require bounded pagination by default.',
    observed: { count: fetchAllNoLimit.body?.events?.length, sample: fetchAllNoLimit.body?.events?.slice(0, 3) },
  })
  record('AE-F018', 'fetchEventsByCenter POST defaults to unbounded public event dump', fetchByCenterNoLimit.status === 200 && Array.isArray(fetchByCenterNoLimit.body?.events) && fetchByCenterNoLimit.body?.total === undefined, {
    endpoint: 'POST /api/fetchEventsByCenter',
    severity: 'Medium',
    cvss: '5.9',
    expected: 'Center event listing should require bounded pagination by default.',
    observed: { count: fetchByCenterNoLimit.body?.events?.length, sample: fetchByCenterNoLimit.body?.events?.slice(0, 3) },
  })
  record('AE-F018', 'Public event payload exposes createdBy management user id', fetchOne.body?.event?.createdBy, {
    endpoint: 'POST /api/fetchEvent',
    severity: 'Low',
    cvss: '4.2',
    expected: 'Public event payload should not expose internal management identifiers unless needed.',
    observed: fetchOne,
  })
  record('AE-F018', 'Registration state endpoint returns 200 for nonexistent event id', missingRegistration.status === 200 && missingRegistration.body?.isRegistered === false, {
    endpoint: 'GET /api/events/:id/registration',
    severity: 'Low',
    cvss: '3.5',
    expected: 'Registration endpoint should 404 nonexistent events to avoid misleading state.',
    observed: missingRegistration,
  })

  const browser = await chromium.launch({ headless: true })
  try {
    const findings = []
    for (const def of definitions.values()) {
      const confirmedControls = controls.filter((c) => c.findingId === def.id && c.confirmed)
      if (confirmedControls.length === 0) continue
      const rows = confirmedControls.map((c) => [
        c.id,
        c.severity,
        c.cvss,
        c.endpoint,
        c.title,
      ])
      const screenshot = await screenshotHtml(
        browser,
        `${def.id.toLowerCase()}-${def.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png`,
        `${def.id}: ${def.title}`,
        [
          {
            kind: 'table',
            heading: `${confirmedControls.length} confirmed control failures`,
            columns: ['Control', 'Severity', 'CVSS', 'Endpoint', 'Observed failure'],
            rows,
          },
          { heading: 'Representative evidence', data: confirmedControls.slice(0, 6).map((c) => ({ id: c.id, title: c.title, observed: c.observed })) },
        ],
      )
      findings.push({ ...def, controls: confirmedControls, screenshot })
    }

    const result = {
      generatedAt: new Date().toISOString(),
      scope: 'Authentication plus event creation/management local red-team pass',
      apiBase: API,
      counts: {
        definitions: definitions.size,
        confirmedFindings: findings.length,
        confirmedControls: controls.filter((c) => c.confirmed).length,
        attemptedControls: controls.length,
        highOrCriticalControls: controls.filter((c) => c.confirmed && Number(c.cvss) >= 8.0).length,
      },
      findings,
      controls,
      screenshots: screenshots.map((p) => p.replace(`${outDir}/`, '')),
    }
    await writeFile(`${outDir}/auth-event-findings.json`, JSON.stringify(result, null, 2))
    console.log(JSON.stringify(result.counts, null, 2))
  } finally {
    await browser.close()
  }

  if (createdEventIds.size > 0) {
    sql(`DELETE FROM events WHERE id IN (${[...createdEventIds].map((id) => `'${escapeSql(id)}'`).join(',')});`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
