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

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('outbound email', () => {
  it('sends verification email through the Sahasta Mail App API from janataverify@sahasta.com', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            'Set-Cookie': 'session=test-session-token; Path=/; HttpOnly; Secure',
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, delivered: ['sahanavsairamesh@gmail.com'] }), {
          status: 200,
        }),
      )
    vi.stubGlobal('fetch', fetchMock)
    const env = makeEnv({
      MAIL_APP_BASE_URL: 'https://mail.sahasta.com',
      MAIL_APP_EMAIL: 'janata-service@sahasta.com',
      MAIL_APP_PASSWORD: 'mail-app-password',
    })

    await sendVerificationEmail(
      env,
      { email: 'sahanavsairamesh@gmail.com' },
      'token with spaces',
    )

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://mail.sahasta.com/api/auth/login')
    const loginInit = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(loginInit.method).toBe('POST')
    expect(loginInit.headers).toMatchObject({
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(loginInit.body as string)).toEqual({
      email: 'janata-service@sahasta.com',
      password: 'mail-app-password',
    })

    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://mail.sahasta.com/api/send')
    const sendInit = fetchMock.mock.calls[1]?.[1] as RequestInit
    expect(sendInit.method).toBe('POST')
    expect(sendInit.headers).toMatchObject({
      'Content-Type': 'application/json',
      Cookie: 'session=test-session-token',
    })
    const message = JSON.parse(sendInit.body as string) as {
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

  it('honors a configured Mail App base URL and verification sender', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            'Set-Cookie': 'session=custom-session; Path=/; HttpOnly; Secure',
          },
        }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const env = makeEnv({
      MAIL_APP_BASE_URL: 'https://mail.example.test/base/',
      MAIL_APP_EMAIL: 'sender@example.test',
      MAIL_APP_PASSWORD: 'secret',
      VERIFICATION_FROM_EMAIL: 'custom-verify@sahasta.com',
    })

    await sendVerificationEmail(env, { email: 'user@example.com' }, 'abc123')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://mail.example.test/api/auth/login')
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://mail.example.test/api/send')
    const init = fetchMock.mock.calls[1]?.[1] as RequestInit
    const body = JSON.parse(init.body as string)
    expect(body).toMatchObject({
      from: 'custom-verify@sahasta.com',
      to: 'user@example.com',
      subject: 'Verify your Chinmaya Janata email',
    })
  })

  it('skips verification sends when outbound email is disabled', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const env = makeEnv({
      MAIL_APP_EMAIL: 'sender@example.test',
      MAIL_APP_PASSWORD: 'secret',
      EMAIL_SEND_DISABLED: 'true',
    })

    await sendVerificationEmail(env, { email: 'user@example.com' }, 'abc123')

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails verification sends when Mail App credentials are missing', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const env = makeEnv()

    await expect(
      sendVerificationEmail(env, { email: 'user@example.com' }, 'abc123'),
    ).rejects.toThrow('MAIL_APP_EMAIL and MAIL_APP_PASSWORD are not configured')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps password reset email on Resend when Resend is configured', async () => {
    const fetchMock = vi.fn(
      async () => new Response('', { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const env = makeEnv({
      MAIL_APP_EMAIL: 'sender@example.test',
      MAIL_APP_PASSWORD: 'secret',
      RESEND_API_KEY: 'resend_test_key',
      RESEND_FROM_EMAIL: 'noreply@chinmayajanata.org',
    })

    await sendPasswordResetEmail(
      env,
      { email: 'reset@example.com' },
      '123456',
    )

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
