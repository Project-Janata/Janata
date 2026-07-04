/**
 * email.ts
 *
 * Om Sri Chinmaya Sadgurave Namaha. Om Sri Gurubyo Namaha.
 *
 * Outbound email via Resend. Used for verification emails, password reset,
 * notifications. One HTTPS call per send. Throws on failure so callers can
 * decide whether to surface the error or swallow it.
 */

import type { Env } from './types'

const RESEND_API_URL = 'https://api.resend.com/emails'

interface SendArgs {
  to: string
  subject: string
  html: string
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
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  if (!env.RESEND_FROM_EMAIL) {
    throw new Error('RESEND_FROM_EMAIL is not configured')
  }

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: args.to,
      subject: args.subject,
      html: args.html,
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

  await sendEmail(env, {
    to: user.email,
    subject: 'Verify your Chinmaya Janata email',
    html,
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

  await sendEmail(env, {
    to: user.email,
    subject: 'Your Chinmaya Janata password reset code',
    html,
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

  await sendEmail(env, {
    to: user.email,
    subject: 'Your Chinmaya Janata password was changed',
    html,
  })
}
