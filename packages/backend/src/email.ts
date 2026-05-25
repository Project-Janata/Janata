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
