import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../email'
import type { Env } from '../types'

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: {} as D1Database,
    AVATARS: {} as R2Bucket,
    JWT_SECRET: 'test-jwt-secret',
    ...overrides,
  } as Env
}

function makeCloudflareEmail() {
  const send = vi.fn(async () => ({ messageId: 'test-message-id' }))
  return {
    send,
    binding: { send } as unknown as SendEmail,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('outbound email', () => {
  it('sends verification email through Cloudflare Email Sending from janataverify@sahasta.com', async () => {
    const { send, binding } = makeCloudflareEmail()
    const env = makeEnv({ EMAIL: binding })

    await sendVerificationEmail(
      env,
      { email: 'sahanavsairamesh@gmail.com' },
      'token with spaces',
    )

    expect(send).toHaveBeenCalledTimes(1)
    const message = send.mock.calls[0]?.[0] as {
      from: string
      to: string
      subject: string
      html: string
      text: string
    }
    expect(message.from).toBe('janataverify@sahasta.com')
    expect(message.to).toBe('sahanavsairamesh@gmail.com')
    expect(message.subject).toBe('Verify your Chinmaya Janata email')
    expect(message.html).toContain('token=token%20with%20spaces')
    expect(message.text).toContain('token=token%20with%20spaces')
  })

  it('falls back to Resend for verification when the Cloudflare binding is unavailable', async () => {
    const fetchMock = vi.fn(
      async () => new Response('', { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const env = makeEnv({
      RESEND_API_KEY: 'resend_test_key',
      VERIFICATION_FROM_EMAIL: 'janataverify@sahasta.com',
    })

    await sendVerificationEmail(env, { email: 'user@example.com' }, 'abc123')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    const body = JSON.parse(init.body as string)
    expect(body).toMatchObject({
      from: 'janataverify@sahasta.com',
      to: 'user@example.com',
      subject: 'Verify your Chinmaya Janata email',
    })
  })

  it('skips verification sends when outbound email is disabled', async () => {
    const { send, binding } = makeCloudflareEmail()
    const env = makeEnv({
      EMAIL: binding,
      EMAIL_SEND_DISABLED: 'true',
    })

    await sendVerificationEmail(env, { email: 'user@example.com' }, 'abc123')

    expect(send).not.toHaveBeenCalled()
  })

  it('keeps password reset email on Resend when Resend is configured', async () => {
    const { send, binding } = makeCloudflareEmail()
    const fetchMock = vi.fn(
      async () => new Response('', { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const env = makeEnv({
      EMAIL: binding,
      RESEND_API_KEY: 'resend_test_key',
      RESEND_FROM_EMAIL: 'noreply@chinmayajanata.org',
    })

    await sendPasswordResetEmail(
      env,
      { email: 'reset@example.com' },
      '123456',
    )

    expect(send).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://api.resend.com/emails')

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer resend_test_key',
      'Content-Type': 'application/json',
    })
    const body = JSON.parse(init.body as string)
    expect(body).toMatchObject({
      from: 'noreply@chinmayajanata.org',
      to: 'reset@example.com',
      subject: 'Your Chinmaya Janata password reset code',
    })
    expect(body.html).toContain('123456')
    expect(body.text).toContain('123456')
  })
})
