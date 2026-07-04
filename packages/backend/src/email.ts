/**
 * email.ts
 *
 * Om Sri Chinmaya Sadgurave Namaha. Om Sri Gurubyo Namaha.
 *
 * Outbound email. Verification email goes through mail.sahasta.com so Sahasta
 * domain ownership stays in the Sahasta Cloudflare account; other transactional
 * email keeps the existing Resend path. Throws on failure so callers can decide
 * whether to surface the error or swallow it.
 */

import type { Env } from './types'

const RESEND_API_URL = 'https://api.resend.com/emails'
const DEFAULT_MAIL_APP_BASE_URL = 'https://mail.sahasta.com'
const DEFAULT_VERIFICATION_FROM_EMAIL = 'janataverify@sahasta.com'

interface SendArgs {
  to: string
  from?: string
  subject: string
  html: string
  text?: string
  preferMailApp?: boolean
}

/**
 * Low-level send. Most callers should use a higher-level helper
 * (sendVerificationEmail, etc.) rather than this directly.
 */
async function sendEmail(env: Env, args: SendArgs): Promise<void> {
  // Test escape hatch: skip the real send. Tests set EMAIL_SEND_DISABLED=true
  // in wrangler.test.toml so signups don't make 11 real Resend calls per run.
  if (env.EMAIL_SEND_DISABLED === 'true') {
    return
  }

  const from = args.from ?? env.RESEND_FROM_EMAIL
  if (!from) {
    throw new Error('Email sender is not configured')
  }

  if (args.preferMailApp) {
    await sendViaMailApp(env, args, from)
    return
  }

  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  await sendViaResend(env, args, from)
}

async function sendViaMailApp(env: Env, args: SendArgs, from: string): Promise<void> {
  const authEmail = env.MAIL_APP_EMAIL?.trim()
  const authPassword = env.MAIL_APP_PASSWORD
  if (!authEmail || !authPassword) {
    throw new Error('MAIL_APP_EMAIL and MAIL_APP_PASSWORD are not configured')
  }

  const baseUrl = env.MAIL_APP_BASE_URL || DEFAULT_MAIL_APP_BASE_URL
  const loginRes = await fetch(mailAppUrl(baseUrl, '/api/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: authEmail,
      password: authPassword,
    }),
  })
  if (!loginRes.ok) {
    const body = await loginRes.text().catch(() => '')
    throw new Error(`Mail App login failed: ${loginRes.status} ${body}`)
  }

  const headersWithCookies = loginRes.headers as Headers & {
    getSetCookie?: () => string[]
  }
  const setCookies = headersWithCookies.getSetCookie?.() ?? []
  const session = sessionCookie(
    setCookies.length > 0 ? setCookies : [loginRes.headers.get('Set-Cookie') ?? ''],
  )
  if (!session) {
    throw new Error('Mail App login did not return a session cookie')
  }

  const sendRes = await fetch(mailAppUrl(baseUrl, '/api/send'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `session=${session}`,
    },
    body: JSON.stringify({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  })

  if (!sendRes.ok) {
    const body = await sendRes.text().catch(() => '')
    throw new Error(`Mail App send failed: ${sendRes.status} ${body}`)
  }
}

function mailAppUrl(baseUrl: string, path: string): string {
  return new URL(path, baseUrl).toString()
}

function sessionCookie(setCookies: string[]): string | null {
  for (const setCookie of setCookies) {
    const match = /\bsession=([^;,\s]+)/.exec(setCookie)
    if (match?.[1]) return match[1]
  }
  return null
}

async function sendViaResend(env: Env, args: SendArgs, from: string): Promise<void> {
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend send failed: ${res.status} ${body}`)
  }
}

/**
 * Send the verification email after signup or on user request.
 * Link points at the web verify-email route which calls
 * GET /api/auth/verify-email?token=... to consume the token.
 */
export async function sendVerificationEmail(
  env: Env,
  user: { email: string },
  token: string,
): Promise<void> {
  const url = `https://chinmayajanata.org/verify-email?token=${encodeURIComponent(token)}`
  const html = [
    '<p>Hari Om,</p>',
    '<p>Verify your email to start using Chinmaya Janata:</p>',
    `<p><a href="${url}">${url}</a></p>`,
    '<p>This link expires in 24 hours.</p>',
    '<p>If you didn\'t sign up, you can ignore this email.</p>',
  ].join('\n')
  const text = [
    'Hari Om,',
    '',
    'Verify your email to start using Chinmaya Janata:',
    url,
    '',
    'This link expires in 24 hours.',
    "If you didn't sign up, you can ignore this email.",
  ].join('\n')

  await sendEmail(env, {
    to: user.email,
    from: env.VERIFICATION_FROM_EMAIL ?? DEFAULT_VERIFICATION_FROM_EMAIL,
    subject: 'Verify your Chinmaya Janata email',
    html,
    text,
    preferMailApp: true,
  })
}

/**
 * Send a 6-digit password-reset code to the user. Called from the
 * /auth/password-reset/request handler.
 */
export async function sendPasswordResetEmail(
  env: Env,
  user: { email: string },
  code: string,
): Promise<void> {
  const html = [
    '<p>Hari Om,</p>',
    '<p>Use this code to reset your Chinmaya Janata password:</p>',
    `<p style="font-size:28px; font-weight:bold; letter-spacing:6px; font-family:monospace;">${code}</p>`,
    '<p>This code expires in 15 minutes.</p>',
    '<p>If you didn\'t request a password reset, you can safely ignore this email — your password is unchanged.</p>',
    '<p>We will never ask you for this code. Do not share it with anyone.</p>',
  ].join('\n')
  const text = [
    'Hari Om,',
    '',
    'Use this code to reset your Chinmaya Janata password:',
    code,
    '',
    'This code expires in 15 minutes.',
    "If you didn't request a password reset, you can safely ignore this email - your password is unchanged.",
    'We will never ask you for this code. Do not share it with anyone.',
  ].join('\n')

  await sendEmail(env, {
    to: user.email,
    subject: 'Your Chinmaya Janata password reset code',
    html,
    text,
  })
}

/**
 * Confirmation email after a successful password reset. Sent fire-and-forget.
 */
export async function sendPasswordChangedEmail(
  env: Env,
  user: { email: string },
): Promise<void> {
  const html = [
    '<p>Hari Om,</p>',
    '<p>Your Chinmaya Janata password was just changed.</p>',
    '<p>If this was you, no further action is needed.</p>',
    '<p>If you did not change your password, please reply to this email immediately — your account may be compromised.</p>',
  ].join('\n')
  const text = [
    'Hari Om,',
    '',
    'Your Chinmaya Janata password was just changed.',
    'If this was you, no further action is needed.',
    'If you did not change your password, please reply to this email immediately - your account may be compromised.',
  ].join('\n')

  await sendEmail(env, {
    to: user.email,
    subject: 'Your Chinmaya Janata password was changed',
    html,
    text,
  })
}
