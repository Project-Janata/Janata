/**
 * inviteClient.ts
 *
 * Client for the v2 user-issued invite code endpoints.
 *
 *   - mintCode: verified user creates a single-use 30-day code to share
 *   - listMyCodes: list codes the current user has minted
 *   - redeem: an Unverified user redeems a code post-signup (the signup
 *     path itself takes the code in /auth/register)
 *
 * Matches the shape of authClient.ts (withTimeout retries, AsyncResult).
 *
 * See packages/backend docs/plans/2026-05-24-v2-verification-backend.md
 */

import { API_BASE_URL, API_TIMEOUTS } from '../config/api'
import type { AsyncResult, AuthError, GenericSuccessResponse, User } from './types'

const withTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
  retries = 2,
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
      return response
    } catch (error: any) {
      clearTimeout(timeoutId)
      lastError = error
      if (error?.name === 'AbortError' && attempt === 0) {
        throw error
      }
      if (attempt < retries) {
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

const buildUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`

const safeJson = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

export interface MintedInviteCode {
  code: string
  expiresAt: string
  shareUrl: string
}

export interface MintedCodeListEntry {
  code: string
  label: string
  verificationLevel: number
  isActive: boolean
  createdAt: string
  createdByUserId: string | null
  expiresAt: string | null
  maxUses: number | null
  usesCount: number
  isUsable: boolean
  shareUrl: string
}

export interface RedeemResponse extends GenericSuccessResponse {
  user: User
}

export const inviteClient = {
  /**
   * Mint a new single-use, 30-day-expiry invite code tied to the caller.
   * Requires verification_level >= NORMAL_USER (45) server-side.
   */
  async mintCode(token: string): AsyncResult<MintedInviteCode> {
    try {
      const response = await withTimeout(
        buildUrl('/auth/invite-codes'),
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
        API_TIMEOUTS.standard,
      )

      const data = await safeJson<MintedInviteCode & { message?: string }>(response)

      if (!response.ok || !data?.code) {
        return {
          success: false,
          error: toError(data?.message || 'Failed to mint invite code', response.status),
        }
      }

      return {
        success: true,
        data: { code: data.code, expiresAt: data.expiresAt, shareUrl: data.shareUrl },
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { success: false, error: toError('Request timeout. Please check your connection.') }
      }
      return { success: false, error: toError('Network error. Please try again.') }
    }
  },

  /**
   * List invite codes the current user has minted. Each entry includes
   * its share URL and an `isUsable` flag (active + not expired + has
   * remaining uses).
   */
  async listMyCodes(token: string): AsyncResult<{ codes: MintedCodeListEntry[] }> {
    try {
      const response = await withTimeout(
        buildUrl('/auth/invite-codes/mine'),
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        },
        API_TIMEOUTS.standard,
      )

      const data = await safeJson<{ codes?: MintedCodeListEntry[]; message?: string }>(response)

      if (!response.ok) {
        return {
          success: false,
          error: toError(data?.message || 'Failed to list invite codes', response.status),
        }
      }

      return { success: true, data: { codes: data?.codes ?? [] } }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { success: false, error: toError('Request timeout. Please check your connection.') }
      }
      return { success: false, error: toError('Network error. Please try again.') }
    }
  },

  /**
   * Redeem an invite code post-signup. If the user's email is already
   * verified, their verification_level is bumped immediately; otherwise
   * the code is recorded on the user and the bump applies at next
   * email-verify. The signup path (POST /auth/register with `inviteCode`)
   * handles the at-signup case directly — this is for users who signed
   * up without an invite and want to upgrade.
   */
  async redeem(token: string, code: string): AsyncResult<RedeemResponse> {
    try {
      const response = await withTimeout(
        buildUrl('/auth/redeem-invite'),
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ code }),
        },
        API_TIMEOUTS.standard,
      )

      const data = await safeJson<RedeemResponse>(response)

      if (!response.ok || !data?.user) {
        return {
          success: false,
          error: toError(data?.message || 'Failed to redeem invite code', response.status),
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
}
