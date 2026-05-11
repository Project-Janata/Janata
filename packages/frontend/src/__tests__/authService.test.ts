/**
 * Tests for src/auth/authService.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock authClient ────────────────────────────────────────────────────
vi.mock('../auth/authClient', () => ({
  authClient: {
    login: vi.fn(),
    signup: vi.fn(),
    verify: vi.fn(),
    logout: vi.fn(),
    checkUserExists: vi.fn(),
    updateProfile: vi.fn(),
    deleteAccount: vi.fn(),
  },
}))

// tokenStorage is already mocked in setup.ts, but we import for overriding
import { getStoredToken, setStoredToken, removeStoredToken } from '../storage/tokenStorage'
import { authClient } from '../auth/authClient'
import { authService } from '../auth/authService'

const mockedAuthClient = vi.mocked(authClient)
const mockedGetToken = vi.mocked(getStoredToken)
const mockedSetToken = vi.mocked(setStoredToken)
const mockedRemoveToken = vi.mocked(removeStoredToken)

beforeEach(() => {
  vi.clearAllMocks()
  mockedGetToken.mockResolvedValue(null)
  mockedSetToken.mockResolvedValue(undefined)
  mockedRemoveToken.mockResolvedValue(undefined)
})

// ── bootstrapSession ───────────────────────────────────────────────────

describe('authService.bootstrapSession', () => {
  it('returns unauthenticated when no token exists', async () => {
    mockedGetToken.mockResolvedValue(null)

    const result = await authService.bootstrapSession()
    expect(result.authStatus).toBe('unauthenticated')
    expect(result.user).toBeNull()
  })

  it('returns authenticated with user when token is valid', async () => {
    const user = { username: 'test', firstName: 'A', lastName: 'B' }
    mockedGetToken.mockResolvedValue('valid-token')
    mockedAuthClient.verify.mockResolvedValue({ success: true, data: { user } })

    const result = await authService.bootstrapSession()
    expect(result.authStatus).toBe('authenticated')
    expect(result.user).toEqual(user)
  })

  it('clears token and returns unauthenticated when token is invalid', async () => {
    mockedGetToken.mockResolvedValue('invalid-token')
    mockedAuthClient.verify.mockResolvedValue({
      success: false,
      error: { message: 'Session invalid', status: 401 },
    })

    const result = await authService.bootstrapSession()
    expect(result.authStatus).toBe('unauthenticated')
    expect(result.user).toBeNull()
    expect(mockedRemoveToken).toHaveBeenCalled()
  })

  it('clears token and returns unauthenticated on verify error', async () => {
    mockedGetToken.mockResolvedValue('token')
    mockedAuthClient.verify.mockRejectedValue(new Error('network'))

    const result = await authService.bootstrapSession()
    expect(result.authStatus).toBe('unauthenticated')
    expect(result.user).toBeNull()
    expect(mockedRemoveToken).toHaveBeenCalled()
  })
})

// ── login ──────────────────────────────────────────────────────────────

describe('authService.login', () => {
  it('stores token and returns user on success', async () => {
    const user = { username: 'test' }
    mockedAuthClient.login.mockResolvedValue({
      success: true,
      data: { user, token: 'new-token' },
    })

    const result = await authService.login('test', 'password')
    expect(result.success).toBe(true)
    expect(result.user).toEqual(user)
    expect(mockedSetToken).toHaveBeenCalledWith('new-token')
  })

  it('does not store token when no token in response', async () => {
    const user = { username: 'test' }
    mockedAuthClient.login.mockResolvedValue({
      success: true,
      data: { user },
    })

    const result = await authService.login('test', 'password')
    expect(result.success).toBe(true)
    expect(mockedSetToken).not.toHaveBeenCalled()
  })

  it('returns error message on failure', async () => {
    mockedAuthClient.login.mockResolvedValue({
      success: false,
      error: { message: 'Invalid credentials' },
    })

    const result = await authService.login('bad', 'wrong')
    expect(result.success).toBe(false)
    expect(result.message).toBe('Invalid credentials')
  })
})

// ── signup ─────────────────────────────────────────────────────────────

describe('authService.signup', () => {
  it('calls register then login on success', async () => {
    mockedAuthClient.signup.mockResolvedValue({
      success: true,
      data: { success: true, message: 'Created' },
    })
    const user = { username: 'newuser' }
    mockedAuthClient.login.mockResolvedValue({
      success: true,
      data: { user, token: 'tok' },
    })

    const result = await authService.signup('newuser', 'pass123')
    expect(mockedAuthClient.signup).toHaveBeenCalledWith({ username: 'newuser', password: 'pass123' })
    expect(mockedAuthClient.login).toHaveBeenCalledWith({ username: 'newuser', password: 'pass123' })
    expect(result.success).toBe(true)
    expect(result.user).toEqual(user)
  })

  it('returns error when register fails', async () => {
    mockedAuthClient.signup.mockResolvedValue({
      success: false,
      error: { message: 'Username taken' },
    })

    const result = await authService.signup('taken', 'pass')
    expect(result.success).toBe(false)
    expect(result.message).toBe('Username taken')
    expect(mockedAuthClient.login).not.toHaveBeenCalled()
  })
})

// ── logout ─────────────────────────────────────────────────────────────

describe('authService.logout', () => {
  it('calls authClient.logout and removes token', async () => {
    mockedGetToken.mockResolvedValue('tok')
    mockedAuthClient.logout.mockResolvedValue({
      success: true,
      data: { success: true },
    })

    await authService.logout()
    expect(mockedAuthClient.logout).toHaveBeenCalledWith('tok')
    expect(mockedRemoveToken).toHaveBeenCalled()
  })

  it('removes token even when authClient.logout fails', async () => {
    mockedGetToken.mockResolvedValue('tok')
    mockedAuthClient.logout.mockRejectedValue(new Error('fail'))

    // try/finally re-throws, so we catch it but verify removeStoredToken was still called
    await expect(authService.logout()).rejects.toThrow('fail')
    expect(mockedRemoveToken).toHaveBeenCalled()
  })

  it('passes undefined when no token stored', async () => {
    mockedGetToken.mockResolvedValue(null)
    mockedAuthClient.logout.mockResolvedValue({
      success: true,
      data: { success: true },
    })

    await authService.logout()
    expect(mockedAuthClient.logout).toHaveBeenCalledWith(undefined)
  })
})

// ── checkUserExists ────────────────────────────────────────────────────

describe('authService.checkUserExists', () => {
  it('delegates to authClient and returns existence', async () => {
    mockedAuthClient.checkUserExists.mockResolvedValue({
      success: true,
      data: { existence: true },
    })

    const result = await authService.checkUserExists('testuser')
    expect(result.success).toBe(true)
    expect(result.existence).toBe(true)
    expect(mockedAuthClient.checkUserExists).toHaveBeenCalledWith('testuser')
  })

  it('returns error message on failure', async () => {
    mockedAuthClient.checkUserExists.mockResolvedValue({
      success: false,
      error: { message: 'Server error' },
    })

    const result = await authService.checkUserExists('testuser')
    expect(result.success).toBe(false)
    expect(result.message).toBe('Server error')
  })
})

// ── updateProfile ──────────────────────────────────────────────────────

describe('authService.updateProfile', () => {
  it('returns updated user on success', async () => {
    const user = { username: 'test', firstName: 'Updated' }
    mockedGetToken.mockResolvedValue('tok')
    mockedAuthClient.updateProfile.mockResolvedValue({
      success: true,
      data: { user },
    })

    const result = await authService.updateProfile({ firstName: 'Updated' })
    expect(result.success).toBe(true)
    expect(result.user).toEqual(user)
  })

  it('returns error when no token exists', async () => {
    mockedGetToken.mockResolvedValue(null)

    const result = await authService.updateProfile({ firstName: 'A' })
    expect(result.success).toBe(false)
    expect(result.message).toBe('No authentication token found')
  })

  it('returns error when authClient fails', async () => {
    mockedGetToken.mockResolvedValue('tok')
    mockedAuthClient.updateProfile.mockResolvedValue({
      success: false,
      error: { message: 'Validation failed' },
    })

    const result = await authService.updateProfile({ firstName: '' })
    expect(result.success).toBe(false)
    expect(result.message).toBe('Validation failed')
  })
})

// ── deleteAccount ──────────────────────────────────────────────────────

describe('authService.deleteAccount', () => {
  it('removes token on success', async () => {
    mockedGetToken.mockResolvedValue('tok')
    mockedAuthClient.deleteAccount.mockResolvedValue({
      success: true,
      data: { success: true, message: 'Deleted' },
    })

    const result = await authService.deleteAccount()
    expect(result.success).toBe(true)
    expect(result.message).toBe('Deleted')
    expect(mockedRemoveToken).toHaveBeenCalled()
  })

  it('returns error when no token exists', async () => {
    mockedGetToken.mockResolvedValue(null)

    const result = await authService.deleteAccount()
    expect(result.success).toBe(false)
    expect(result.message).toBe('No authentication token found')
  })

  it('returns error when authClient fails', async () => {
    mockedGetToken.mockResolvedValue('tok')
    mockedAuthClient.deleteAccount.mockResolvedValue({
      success: false,
      error: { message: 'Cannot delete' },
    })

    const result = await authService.deleteAccount()
    expect(result.success).toBe(false)
    expect(result.message).toBe('Cannot delete')
    // Should NOT remove token on failure
    expect(mockedRemoveToken).not.toHaveBeenCalled()
  })
})

// ── toAuthStatus ───────────────────────────────────────────────────────

describe('authService.toAuthStatus', () => {
  it('returns "authenticated" for true', () => {
    expect(authService.toAuthStatus(true)).toBe('authenticated')
  })

  it('returns "unauthenticated" for false', () => {
    expect(authService.toAuthStatus(false)).toBe('unauthenticated')
  })
})
