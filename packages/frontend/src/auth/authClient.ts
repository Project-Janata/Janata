import { API_BASE_URL, API_TIMEOUTS } from '../config/api'
import type {
  AsyncResult,
  AuthError,
  AuthSuccessResponse,
  CheckUserExistsResponse,
  GenericSuccessResponse,
  LoginRequest,
  SignupRequest,
  UpdateProfileRequest,
  User,
} from './types'

const withTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
  retries = 2
): Promise<Response> => {
  let lastError: Error | undefined
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
      })
      clearTimeout(timeoutId)
      // Don't retry on client/server errors — only on network failures
      return response
    } catch (error: any) {
      clearTimeout(timeoutId)
      lastError = error
      // Don't retry if user intentionally aborted or it's not a network error
      if (error?.name === 'AbortError' && attempt === 0) {
        throw error // Timeout on first attempt — throw immediately
      }
      if (attempt < retries) {
        // Exponential backoff: 1s, 2s
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }
  throw lastError || new Error('Network request failed')
}

const toError = (message: string, status?: number, code?: string): AuthError => ({
  message,
  status,
  code,
})

const normalizeUsername = (username: string) => username.trim().toLowerCase()

const buildUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

const safeJson = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

export const authClient = {
  async login(payload: LoginRequest): AsyncResult<AuthSuccessResponse> {
    try {
      const normalizedPayload = {
        ...payload,
        username: normalizeUsername(payload.username),
      }
      const response = await withTimeout(
        buildUrl('/auth/authenticate'),
        {
          method: 'POST',
          body: JSON.stringify(normalizedPayload),
        },
        API_TIMEOUTS.auth
      )

      const data = await safeJson<AuthSuccessResponse & { message?: string }>(response)

      if (!response.ok || !data?.user) {
        return {
          success: false,
          error: toError(data?.message || 'Invalid credentials', response.status),
        }
      }

      return { success: true, data }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { success: false, error: toError('Request timeout. Please check your connection.') }
      }
      return { success: false, error: toError('Network error. Please try again.') }
    }
  },

  async signup(payload: SignupRequest): AsyncResult<GenericSuccessResponse> {
    try {
      const normalizedPayload = {
        ...payload,
        username: normalizeUsername(payload.username),
      }
      const response = await withTimeout(
        buildUrl('/auth/register'),
        {
          method: 'POST',
          body: JSON.stringify(normalizedPayload),
        },
        API_TIMEOUTS.auth
      )

      const data = await safeJson<GenericSuccessResponse>(response)

      if (!response.ok) {
        return {
          success: false,
          error: toError(data?.message || 'Signup failed. Please try again.', response.status),
        }
      }

      return { success: true, data: { success: true, message: data?.message } }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { success: false, error: toError('Request timeout. Please check your connection.') }
      }
      return { success: false, error: toError('Network error. Please try again.') }
    }
  },

  async verify(token: string): AsyncResult<{ user: User }> {
    try {
      const response = await withTimeout(
        buildUrl('/auth/verify'),
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        },
        API_TIMEOUTS.auth
      )

      const data = await safeJson<{ user: User; message?: string }>(response)

      if (!response.ok || !data?.user) {
        return {
          success: false,
          error: toError(data?.message || 'Session invalid', response.status),
        }
      }

      return { success: true, data: { user: data.user } }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { success: false, error: toError('Request timeout. Please check your connection.') }
      }
      return { success: false, error: toError('Network error. Please try again.') }
    }
  },

  async logout(token?: string): AsyncResult<GenericSuccessResponse> {
    try {
      const response = await withTimeout(
        buildUrl('/auth/deauthenticate'),
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
        API_TIMEOUTS.logout
      )

      const data = await safeJson<GenericSuccessResponse>(response)

      if (!response.ok) {
        return {
          success: false,
          error: toError(data?.message || 'Logout failed', response.status),
        }
      }

      return { success: true, data: { success: true, message: data?.message } }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { success: false, error: toError('Request timeout. Please check your connection.') }
      }
      return { success: false, error: toError('Network error. Please try again.') }
    }
  },

  async checkUserExists(username: string): AsyncResult<CheckUserExistsResponse> {
    try {
      const normalizedUsername = normalizeUsername(username)
      const response = await withTimeout(
        buildUrl('/userExistence'),
        {
          method: 'POST',
          body: JSON.stringify({ username: normalizedUsername, email: normalizedUsername }),
        },
        API_TIMEOUTS.standard
      )

      const data = await safeJson<CheckUserExistsResponse & { message?: string }>(response)

      if (!response.ok || typeof data?.existence !== 'boolean') {
        return {
          success: false,
          error: toError(data?.message || 'Failed to check user existence', response.status),
        }
      }

      return { success: true, data: { existence: data.existence } }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { success: false, error: toError('Request timeout. Please check your connection.') }
      }
      return { success: false, error: toError('Network error. Please try again.') }
    }
  },

  async updateProfile(token: string, updates: UpdateProfileRequest): AsyncResult<{ user: User }> {
    try {
      const response = await withTimeout(
        buildUrl('/auth/update-profile'),
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify(updates),
        },
        API_TIMEOUTS.standard
      )

      const data = await safeJson<User | { user: User; message?: string }>(response)

      if (!response.ok) {
        const message = (data as any)?.message || 'Failed to update profile'
        return { success: false, error: toError(message, response.status) }
      }

      // Supports either { user } or direct user response
      const user = (data as any)?.user ? (data as any).user : (data as User)
      return { success: true, data: { user } }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { success: false, error: toError('Request timeout. Please check your connection.') }
      }
      return { success: false, error: toError('Network error. Please try again.') }
    }
  },

  async uploadProfileImage(
    token: string,
    file: Blob,
    fileName = 'avatar.jpg'
  ): AsyncResult<{ imageUrl: string }> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.standard)

    try {
      const formData = new FormData()
      formData.append('file', file, fileName)

      const response = await fetch(buildUrl('/profile/uploadImage'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        signal: controller.signal,
        credentials: 'include',
      })

      const data = await safeJson<{ imageUrl?: string; message?: string }>(response)

      if (!response.ok || !data?.imageUrl) {
        return {
          success: false,
          error: toError(data?.message || 'Failed to upload profile image', response.status),
        }
      }

      return { success: true, data: { imageUrl: data.imageUrl } }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { success: false, error: toError('Upload timeout. Please check your connection.') }
      }
      return { success: false, error: toError('Network error. Please try again.') }
    } finally {
      clearTimeout(timeoutId)
    }
  },

  async refreshToken(refreshToken: string): AsyncResult<AuthSuccessResponse> {
    try {
      const response = await withTimeout(
        buildUrl('/auth/refresh'),
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        },
        API_TIMEOUTS.auth
      )

      const data = await safeJson<AuthSuccessResponse & { refreshToken?: string; message?: string }>(response)

      if (!response.ok || !data?.token) {
        return {
          success: false,
          error: toError(data?.message || 'Failed to refresh token', response.status),
        }
      }

      return { success: true, data }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { success: false, error: toError('Request timeout. Please check your connection.') }
      }
      return { success: false, error: toError('Network error. Please try again.') }
    }
  },

  /**
   * Request a new verification email be sent. The user must already be
   * authenticated (signup auto-sends one; this is the resend path).
   * Rate-limited server-side to 3/hour per user.
   */
  async sendVerificationEmail(token: string): AsyncResult<GenericSuccessResponse> {
    try {
      const response = await withTimeout(
        buildUrl('/auth/send-verification-email'),
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
        API_TIMEOUTS.standard,
      )

      const data = await safeJson<GenericSuccessResponse>(response)

      if (!response.ok) {
        return {
          success: false,
          error: toError(data?.message || 'Failed to send verification email', response.status),
        }
      }

      return { success: true, data: { success: true, message: data?.message } }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { success: false, error: toError('Request timeout. Please check your connection.') }
      }
      return { success: false, error: toError('Network error. Please try again.') }
    }
  },

  /**
   * Consume an email-verification token. Called by the /verify-email
   * frontend route after the user clicks the link in their inbox. No
   * auth required — the token itself is the credential.
   */
  async verifyEmail(verificationToken: string): AsyncResult<{ user: User }> {
    try {
      const response = await withTimeout(
        buildUrl(`/auth/verify-email?token=${encodeURIComponent(verificationToken)}`),
        { method: 'GET' },
        API_TIMEOUTS.standard,
      )

      const data = await safeJson<{ user: User; message?: string }>(response)

      if (!response.ok || !data?.user) {
        return {
          success: false,
          error: toError(data?.message || 'Email verification failed', response.status),
        }
      }

      return { success: true, data: { user: data.user } }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { success: false, error: toError('Request timeout. Please check your connection.') }
      }
      return { success: false, error: toError('Network error. Please try again.') }
    }
  },

  /**
   * Start the password-reset flow. Always returns success from the
   * server's perspective — we don't reveal whether the email is on file
   * (anti-enumeration). Rate-limited 5/min per IP server-side.
   */
  async requestPasswordReset(email: string): AsyncResult<GenericSuccessResponse> {
    try {
      const username = normalizeUsername(email)
      const response = await withTimeout(
        buildUrl('/auth/password-reset/request'),
        {
          method: 'POST',
          body: JSON.stringify({ username }),
        },
        API_TIMEOUTS.auth,
      )

      const data = await safeJson<GenericSuccessResponse & { ok?: boolean }>(response)

      if (!response.ok) {
        return {
          success: false,
          error: toError(data?.message || 'Failed to send reset code', response.status),
        }
      }

      return { success: true, data: { success: true, message: data?.message } }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { success: false, error: toError('Request timeout. Please check your connection.') }
      }
      return { success: false, error: toError('Network error. Please try again.') }
    }
  },

  /**
   * Submit the 6-digit code and the new password. On success the server
   * rotates users.password, which kills every live JWT for the user via
   * the tv-claim mechanism. Caller should treat that as a sign-out and
   * redirect to login.
   */
  async confirmPasswordReset(
    email: string,
    code: string,
    newPassword: string,
  ): AsyncResult<GenericSuccessResponse> {
    try {
      const username = normalizeUsername(email)
      const response = await withTimeout(
        buildUrl('/auth/password-reset/verify'),
        {
          method: 'POST',
          body: JSON.stringify({ username, code: code.trim(), newPassword }),
        },
        API_TIMEOUTS.auth,
      )

      const data = await safeJson<{ ok?: boolean; error?: string; message?: string }>(response)

      if (!response.ok || data?.ok === false) {
        return {
          success: false,
          error: toError(
            data?.error || data?.message || 'Code invalid or expired',
            response.status,
          ),
        }
      }

      return { success: true, data: { success: true, message: data?.message } }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { success: false, error: toError('Request timeout. Please check your connection.') }
      }
      return { success: false, error: toError('Network error. Please try again.') }
    }
  },

  async deleteAccount(token: string): AsyncResult<GenericSuccessResponse> {
    try {
      const response = await withTimeout(
        buildUrl('/auth/delete-account'),
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
        API_TIMEOUTS.standard
      )

      const data = await safeJson<GenericSuccessResponse>(response)

      if (!response.ok) {
        return {
          success: false,
          error: toError(data?.message || 'Failed to delete account', response.status),
        }
      }

      return { success: true, data: { success: true, message: data?.message } }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { success: false, error: toError('Request timeout. Please check your connection.') }
      }
      return { success: false, error: toError('Network error. Please try again.') }
    }
  },
}
