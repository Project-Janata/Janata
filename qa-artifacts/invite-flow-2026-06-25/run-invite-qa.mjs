import { chromium } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const repoRoot = resolve(new URL('../..', import.meta.url).pathname)
const outDir = resolve(new URL('.', import.meta.url).pathname)
const API = 'http://localhost:8787/api'
const WEB = 'http://localhost:8081'
const password = process.env.QA_PASSWORD

if (!password) {
  throw new Error('Set QA_PASSWORD for the local QA accounts')
}

const inviterEmail = 'me@sahastasai.com'
const recipientEmail = 'sahanavsairamesh@gmail'
const centerId = 'c0000001-0000-0000-0000-000000000008'

const shotPaths = []
const assertions = []

function record(name, ok, detail = {}) {
  assertions.push({ name, ok, ...detail })
  if (!ok) throw new Error(`${name} failed: ${JSON.stringify(detail)}`)
}

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

async function pauseAfterSql() {
  await new Promise((resolvePause) => setTimeout(resolvePause, 750))
}

async function api(path, options = {}) {
  let response
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      response = await fetch(`${API}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      })
      if (response.status !== 503) break
    } catch (error) {
      if (attempt === 3) throw error
    }
    await new Promise((resolveRetry) => setTimeout(resolveRetry, 500 * (attempt + 1)))
  }
  if (!response) throw new Error(`No response for ${path}`)
  const text = await response.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { text }
  }
  return { response, body }
}

async function register(email) {
  await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username: email, password, inviteCode: 'QA-TEST' }),
  })
}

async function login(email) {
  const { response, body } = await api('/auth/authenticate', {
    method: 'POST',
    body: JSON.stringify({ username: email, password }),
  })
  record(`login ${email}`, response.ok && !!body?.token, { status: response.status })
  return body
}

async function verify(token) {
  const { response, body } = await api('/auth/verify', {
    headers: { Authorization: `Bearer ${token}` },
  })
  record('verify token', response.ok && !!body?.user, { status: response.status })
  return body.user
}

async function resetAccounts() {
  await register(inviterEmail)
  await register(recipientEmail)
  sql(`
DELETE FROM invite_codes
 WHERE created_by_user_id IN (SELECT id FROM users WHERE username IN ('${inviterEmail}', '${recipientEmail}'));
UPDATE users
   SET verification_level=110,
       is_verified=1,
       first_name='Sahasta',
       last_name='Admin',
       profile_complete=1,
       center_id='${centerId}',
       invite_code=NULL,
       invited_by_user_id=NULL
 WHERE username='${inviterEmail}';
UPDATE users
   SET verification_level=30,
       is_verified=0,
       first_name='Sahanav',
       last_name='Invitee',
       profile_complete=1,
       center_id='${centerId}',
       invite_code=NULL,
       invited_by_user_id=NULL,
       email_verified_at=NULL
 WHERE username='${recipientEmail}';
`)
  await pauseAfterSql()
}

async function resetRecipientUnverified() {
  sql(`
UPDATE users
   SET verification_level=30,
       is_verified=0,
       invite_code=NULL,
       invited_by_user_id=NULL,
       email_verified_at=NULL
 WHERE username='${recipientEmail}';
`)
  await pauseAfterSql()
}

async function newAuthedPage(browser, auth) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    permissions: ['clipboard-read', 'clipboard-write'],
  })
  await context.addInitScript(({ token, refreshToken }) => {
    localStorage.setItem('@auth_token', token)
    if (refreshToken) localStorage.setItem('@refresh_token', refreshToken)
  }, auth)
  const page = await context.newPage()
  return { context, page }
}

async function screenshot(page, name) {
  const file = `${outDir}/${name}.png`
  await page.screenshot({ path: file, fullPage: false })
  shotPaths.push(file)
  return file
}

async function waitForInviteCode(page) {
  await page.waitForFunction(() => /janata\.app\/i\/[0-9A-F]{12}/.test(document.body.innerText), null, {
    timeout: 30000,
  })
  const code = await page.evaluate(() => {
    const match = document.body.innerText.match(/janata\.app\/i\/([0-9A-F]{12})/)
    return match?.[1] || null
  })
  record('invite code visible', !!code, { code })
  return code
}

async function localInviteUrl(code) {
  return `${WEB}/i/${encodeURIComponent(code)}`
}

await resetAccounts()
const inviterAuth = await login(inviterEmail)
const recipientInitialAuth = await login(recipientEmail)
const browser = await chromium.launch({ headless: true })

try {
  const { context: inviterContext, page: inviterPage } = await newAuthedPage(browser, inviterAuth)
  await inviterPage.goto(`${WEB}/settings/invite`, { waitUntil: 'domcontentloaded' })
  await inviterPage.waitForTimeout(2500)
  await screenshot(inviterPage, '02-inviter-member-link')
  const memberCode = await waitForInviteCode(inviterPage)

  await inviterPage.getByText('Admin', { exact: true }).click()
  await inviterPage.waitForTimeout(2500)
  await screenshot(inviterPage, '03-inviter-admin-link-warning')
  const adminCode = await waitForInviteCode(inviterPage)

  await inviterPage.getByText('Copy link', { exact: true }).click()
  await inviterPage.waitForTimeout(750)
  await screenshot(inviterPage, '04-admin-link-copied')
  await inviterContext.close()

  const mine = await api('/auth/invite-codes/mine', {
    headers: { Authorization: `Bearer ${inviterAuth.token}` },
  })
  const memberRow = mine.body.codes.find((row) => row.code === memberCode)
  const adminRow = mine.body.codes.find((row) => row.code === adminCode)
  record('member link default cap', memberRow?.maxUses === 25, { maxUses: memberRow?.maxUses })
  record('admin link one use', adminRow?.maxUses === 1, { maxUses: adminRow?.maxUses })
  const adminTtlHours = (new Date(adminRow.expiresAt).getTime() - Date.now()) / (60 * 60 * 1000)
  record('admin link one day expiry', adminTtlHours > 23 && adminTtlHours <= 25, { adminTtlHours })

  const elevatedTooMany = await api('/auth/invite-codes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${inviterAuth.token}` },
    body: JSON.stringify({ role: 'admin', maxUses: 25 }),
  })
  record('elevated maxUses rejected', elevatedTooMany.response.status === 400, {
    status: elevatedTooMany.response.status,
    message: elevatedTooMany.body?.message,
  })

  const { context: recipientContext, page: recipientPage } = await newAuthedPage(
    browser,
    recipientInitialAuth,
  )
  await recipientPage.goto(await localInviteUrl(memberCode), { waitUntil: 'domcontentloaded' })
  await recipientPage.waitForTimeout(900)
  await screenshot(recipientPage, '05-recipient-member-invite-applying')
  await recipientPage.waitForTimeout(2500)
  await screenshot(recipientPage, '06-recipient-member-invite-applied')
  const memberRecipient = await verify(recipientInitialAuth.token)
  record('recipient promoted to member', memberRecipient.verificationLevel === 45, {
    verificationLevel: memberRecipient.verificationLevel,
  })

  await recipientPage.goto(await localInviteUrl(memberCode), { waitUntil: 'domcontentloaded' })
  await recipientPage.waitForTimeout(3000)
  await screenshot(recipientPage, '07-recipient-already-member')
  await recipientContext.close()

  await resetRecipientUnverified()
  const recipientAdminAuth = await login(recipientEmail)
  const { context: adminApplyContext, page: adminApplyPage } = await newAuthedPage(
    browser,
    recipientAdminAuth,
  )
  await adminApplyPage.goto(await localInviteUrl(adminCode), { waitUntil: 'domcontentloaded' })
  await adminApplyPage.waitForTimeout(3000)
  await screenshot(adminApplyPage, '08-recipient-admin-invite-applied')
  const adminRecipient = await verify(recipientAdminAuth.token)
  record('recipient promoted by admin invite', adminRecipient.verificationLevel >= 108, {
    verificationLevel: adminRecipient.verificationLevel,
  })
  await adminApplyContext.close()

  const { context: loggedOutContext, page: loggedOutPage } = await browser.newContext({
    viewport: { width: 1440, height: 950 },
  }).then(async (context) => ({ context, page: await context.newPage() }))
  await loggedOutPage.goto(await localInviteUrl(adminCode), { waitUntil: 'domcontentloaded' })
  await loggedOutPage.waitForTimeout(3000)
  await screenshot(loggedOutPage, '09-exhausted-admin-link-invalid')
  await loggedOutContext.close()

  const assertionHtml = `<!doctype html><html><head><title>Invite QA assertions</title>
    <style>body{font:16px system-ui;margin:40px;background:#f8fafc;color:#111827}
    table{border-collapse:collapse;width:100%;background:white}td,th{border:1px solid #d1d5db;padding:10px;text-align:left}
    .ok{color:#047857;font-weight:700}.fail{color:#b91c1c;font-weight:700}</style></head>
    <body><h1>Invite QA API assertions</h1><p>Inviter: ${inviterEmail}<br>Recipient: ${recipientEmail}</p>
    <table><thead><tr><th>Check</th><th>Status</th><th>Detail</th></tr></thead><tbody>
    ${assertions
      .map(
        (a) =>
          `<tr><td>${a.name}</td><td class="${a.ok ? 'ok' : 'fail'}">${a.ok ? 'PASS' : 'FAIL'}</td><td><code>${JSON.stringify(a)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')}</code></td></tr>`,
      )
      .join('')}</tbody></table></body></html>`
  const { context: assertionContext, page: assertionPage } = await browser.newContext({
    viewport: { width: 1440, height: 950 },
  }).then(async (context) => ({ context, page: await context.newPage() }))
  await assertionPage.setContent(assertionHtml)
  await screenshot(assertionPage, '10-api-assertions')
  await assertionContext.close()

  await writeFile(
    `${outDir}/api-assertions.json`,
    JSON.stringify({ inviterEmail, recipientEmail, screenshots: shotPaths, assertions }, null, 2),
  )
} finally {
  await browser.close()
}

console.log(JSON.stringify({ screenshots: shotPaths, assertions }, null, 2))
