/**
 * Tests for src/auth/authClient.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock the config/api module ─────────────────────────────────────────
vi.mock('../config/api', () => ({
  API_BASE_URL: 'http://localhost:8787/api',
  API_TIMEOUTS: {
    auth: 60_000,
    logout: 30_000,
    standard: 60_000,
  },
  API_ENDPOINTS: {
    auth: {
      login: '/auth/authenticate',
      register: '/auth/register',
      verify: '/auth/verify',
      logout: '/auth/deauthenticate',
      deleteAccount: '/auth/delete-account',
    },
    users: {
      exists: '/userExistence',
      profile: '/auth/update-profile',
    },
  },
  DEFAULT_FETCH_OPTIONS: {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  },
  buildApiUrl: (path: string) =>
    `http://localhost:8787/api${path.startsWith('/') ? path : `/${path}`}`,
}))

// ── Global fetch mock ──────────────────────────────────────────────────
const mockFetch = vi.fn()
;(globalThis as any).fetch = mockFetch

import { authClient } from '../auth/authClient'

function mockResponse(body: any, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    headers: new Headers(),
    redirected: false,
    statusText: ok ? 'OK' : 'Error',
    type: 'basic' as ResponseType,
    url: '',
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    formData: vi.fn(),
    bytes: vi.fn(),
  } as unknown as Response
}

beforeEach(() => {
  mockFetch.mockReset()
})

// ── Login ──────────────────────────────────────────────────────────────

describe('authClient.login', () => {
  it('returns user and token on success', async () => {
    const user = { username: 'testuser', firstName: 'Test', lastName: 'User' }
    mockFetch.mockResolvedValue(mockResponse({ user, token: 'abc123' }))

    const result = await authClient.login({ username: 'TestUser', password: 'pass' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.user).toEqual(user)
      expect(result.data.token).toBe('abc123')
    }
  })

  it('normalizes username (trim + lowercase)', async () => {
    const user = { username: 'testuser' }
    mockFetch.mockResolvedValue(mockResponse({ user, token: 'tok' }))

    await authClient.login({ username: '  TestUser  ', password: 'pass' })
    const call = mockFetch.mock.calls[0]
    const body = JSON.parse(call[1].body)
    expect(body.username).toBe('testuser')
  })

  it('returns error on invalid credentials', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'Invalid credentials' }, false, 401))

    const result = await authClient.login({ username: 'bad', password: 'wrong' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toBe('Invalid credentials')
      expect(result.error.status).toBe(401)
    }
  })

  it('returns error when response has no user', async () => {
    mockFetch.mockResolvedValue(mockResponse({ token: 'tok' }))

    const result = await authClient.login({ username: 'test', password: 'pass' })
    expect(result.success).toBe(false)
  })

  it('returns network error on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('fetch failed'))

    const result = await authClient.login({ username: 'test', password: 'pass' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toBe('Network error. Please try again.')
    }
  })

  it('returns timeout error on AbortError', async () => {
    const abortError = new DOMException('Aborted', 'AbortError')
    mockFetch.mockRejectedValue(abortError)

    const result = await authClient.login({ username: 'test', password: 'pass' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toContain('timeout')
    }
  })
})

// ── Signup ─────────────────────────────────────────────────────────────

describe('authClient.signup', () => {
  it('returns success on valid signup', async () => {
    mockFetch.mockResolvedValue(mockResponse({ success: true, message: 'User created' }))

    const result = await authClient.signup({ username: 'newuser', password: 'pass123' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.success).toBe(true)
    }
  })

  it('normalizes username', async () => {
    mockFetch.mockResolvedValue(mockResponse({ success: true }))

    await authClient.signup({ username: '  NewUser  ', password: 'pass' })
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.username).toBe('newuser')
  })

  it('returns error on duplicate username (409)', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'Username already exists' }, false, 409))

    const result = await authClient.signup({ username: 'existing', password: 'pass' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toBe('Username already exists')
      expect(result.error.status).toBe(409)
    }
  })

  it('returns error on validation error', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'Password too short' }, false, 400))

    const result = await authClient.signup({ username: 'test', password: 'x' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toBe('Password too short')
    }
  })

  it('returns network error on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('network'))

    const result = await authClient.signup({ username: 'test', password: 'pass' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toBe('Network error. Please try again.')
    }
  })

  it('returns timeout error on AbortError', async () => {
    const abortError = new DOMException('Aborted', 'AbortError')
    mockFetch.mockRejectedValue(abortError)

    const result = await authClient.signup({ username: 'test', password: 'pass' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toContain('timeout')
    }
  })
})

// ── Verify ─────────────────────────────────────────────────────────────

describe('authClient.verify', () => {
  it('returns user on valid token', async () => {
    const user = { username: 'test', firstName: 'A', lastName: 'B' }
    mockFetch.mockResolvedValue(mockResponse({ user }))

    const result = await authClient.verify('valid-token')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.user).toEqual(user)
    }
  })

  it('sends Authorization header', async () => {
    const user = { username: 'test' }
    mockFetch.mockResolvedValue(mockResponse({ user }))

    await authClient.verify('my-token')
    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers.Authorization).toBe('Bearer my-token')
  })

  it('returns error on invalid token', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'Session invalid' }, false, 401))

    const result = await authClient.verify('bad-token')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toBe('Session invalid')
    }
  })

  it('returns error when response has no user', async () => {
    mockFetch.mockResolvedValue(mockResponse({ something: 'else' }))

    const result = await authClient.verify('token')
    expect(result.success).toBe(false)
  })

  it('returns network error on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('network'))

    const result = await authClient.verify('token')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toBe('Network error. Please try again.')
    }
  })
})

// ── Logout ─────────────────────────────────────────────────────────────

describe('authClient.logout', () => {
  it('returns success on ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse({ success: true, message: 'Logged out' }))

    const result = await authClient.logout('tok')
    expect(result.success).toBe(true)
  })

  it('sends Authorization header when token provided', async () => {
    mockFetch.mockResolvedValue(mockResponse({ success: true }))

    await authClient.logout('my-token')
    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers.Authorization).toBe('Bearer my-token')
  })

  it('works without token', async () => {
    mockFetch.mockResolvedValue(mockResponse({ success: true }))

    const result = await authClient.logout()
    expect(result.success).toBe(true)
  })

  it('returns error on failure', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'Logout failed' }, false, 500))

    const result = await authClient.logout('tok')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toBe('Logout failed')
    }
  })
})

// ── Check User Exists ──────────────────────────────────────────────────

describe('authClient.checkUserExists', () => {
  it('returns true when user exists', async () => {
    mockFetch.mockResolvedValue(mockResponse({ existence: true }))

    const result = await authClient.checkUserExists('existinguser')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.existence).toBe(true)
    }
  })

  it('returns false when user does not exist', async () => {
    mockFetch.mockResolvedValue(mockResponse({ existence: false }))

    const result = await authClient.checkUserExists('newuser')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.existence).toBe(false)
    }
  })

  it('normalizes username', async () => {
    mockFetch.mockResolvedValue(mockResponse({ existence: true }))

    await authClient.checkUserExists('  TestUser  ')
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.username).toBe('testuser')
    expect(body.email).toBe('testuser')
  })

  it('returns error on failure', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'Server error' }, false, 500))

    const result = await authClient.checkUserExists('user')
    expect(result.success).toBe(false)
  })
})

// ── Update Profile ─────────────────────────────────────────────────────

describe('authClient.updateProfile', () => {
  it('returns user from { user } response shape', async () => {
    const user = { username: 'test', firstName: 'Updated' }
    mockFetch.mockResolvedValue(mockResponse({ user }))

    const result = await authClient.updateProfile('tok', { firstName: 'Updated' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.user).toEqual(user)
    }
  })

  it('returns user from direct user response shape', async () => {
    const user = { username: 'test', firstName: 'Direct' }
    mockFetch.mockResolvedValue(mockResponse(user))

    const result = await authClient.updateProfile('tok', { firstName: 'Direct' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.user).toEqual(user)
    }
  })

  it('sends PUT with auth header', async () => {
    const user = { username: 'test' }
    mockFetch.mockResolvedValue(mockResponse({ user }))

    await authClient.updateProfile('my-token', { firstName: 'A' })
    const call = mockFetch.mock.calls[0]
    expect(call[1].method).toBe('PUT')
    expect(call[1].headers.Authorization).toBe('Bearer my-token')
  })

  it('returns error on failure', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'Validation failed' }, false, 400))

    const result = await authClient.updateProfile('tok', { firstName: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toBe('Validation failed')
    }
  })
})

// ── Delete Account ─────────────────────────────────────────────────────

describe('authClient.deleteAccount', () => {
  it('returns success on ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse({ success: true, message: 'Deleted' }))

    const result = await authClient.deleteAccount('tok')
    expect(result.success).toBe(true)
  })

  it('sends DELETE with auth header', async () => {
    mockFetch.mockResolvedValue(mockResponse({ success: true }))

    await authClient.deleteAccount('my-token')
    const call = mockFetch.mock.calls[0]
    expect(call[1].method).toBe('DELETE')
    expect(call[1].headers.Authorization).toBe('Bearer my-token')
  })

  it('returns error on failure', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'Cannot delete' }, false, 403))

    const result = await authClient.deleteAccount('tok')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toBe('Cannot delete')
    }
  })
})

// ── Password reset ────────────────────────────────────────────────────

describe('authClient.requestPasswordReset', () => {
  it('returns success when server says ok', async () => {
    mockFetch.mockResolvedValue(mockResponse({ ok: true }))

    const result = await authClient.requestPasswordReset('user@example.com')
    expect(result.success).toBe(true)
  })

  it('normalizes the email (trim + lowercase) before posting', async () => {
    mockFetch.mockResolvedValue(mockResponse({ ok: true }))

    await authClient.requestPasswordReset('  USER@Example.com  ')
    const call = mockFetch.mock.calls[0]
    const body = JSON.parse(call[1].body)
    expect(body.username).toBe('user@example.com')
  })

  it('returns error when the server rejects (e.g. rate limit)', async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ message: 'Too many requests' }, false, 429),
    )

    const result = await authClient.requestPasswordReset('user@example.com')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.status).toBe(429)
    }
  })

  it('returns network error on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('fetch failed'))

    const result = await authClient.requestPasswordReset('user@example.com')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toBe('Network error. Please try again.')
    }
  })
})

describe('authClient.confirmPasswordReset', () => {
  it('returns success when server confirms', async () => {
    mockFetch.mockResolvedValue(mockResponse({ ok: true }))

    const result = await authClient.confirmPasswordReset(
      'user@example.com',
      '123456',
      'newSecret99',
    )
    expect(result.success).toBe(true)
  })

  it('posts the trimmed code and the new password', async () => {
    mockFetch.mockResolvedValue(mockResponse({ ok: true }))

    await authClient.confirmPasswordReset(
      '  USER@Example.com  ',
      '  123456 ',
      'newSecret99',
    )
    const call = mockFetch.mock.calls[0]
    const body = JSON.parse(call[1].body)
    expect(body.username).toBe('user@example.com')
    expect(body.code).toBe('123456')
    expect(body.newPassword).toBe('newSecret99')
  })

  it('returns the server error when ok=false (e.g. wrong code)', async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ ok: false, error: 'Code invalid or expired' }, false, 400),
    )

    const result = await authClient.confirmPasswordReset(
      'user@example.com',
      '999999',
      'newSecret99',
    )
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.message).toMatch(/invalid or expired/i)
    }
  })

  it('treats a 200 with ok:false as failure', async () => {
    // Defensive: server should always pair ok:false with 400, but if it
    // ever returns 200 + ok:false we should still surface the error.
    mockFetch.mockResolvedValue(
      mockResponse({ ok: false, error: 'something went wrong' }, true, 200),
    )

    const result = await authClient.confirmPasswordReset(
      'user@example.com',
      '000000',
      'newSecret99',
    )
    expect(result.success).toBe(false)
  })

  it('returns network error on fetch failure', async () => {
    mockFetch.mockRejectedValue(new Error('fetch failed'))

    const result = await authClient.confirmPasswordReset(
      'user@example.com',
      '123456',
      'newSecret99',
    )
    expect(result.success).toBe(false)
  })
})
