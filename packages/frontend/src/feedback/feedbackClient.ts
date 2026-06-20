/**
 * feedbackClient.ts
 *
 * Client for the v2 beta user-feedback capture path (issue #542).
 *
 * Beta testers/admins need a low-friction way to submit bugs and product
 * feedback from inside the app. This is the thin data layer behind the
 * in-app feedback screen (app/feedback.tsx): it POSTs a structured feedback
 * record so the team has one place to triage incoming reports.
 *
 * Mirrors the shape of authClient.ts / inviteClient.ts (withTimeout retries,
 * AsyncResult). The submit payload carries everything needed to triage a
 * report — description, who sent it, the platform, the page/flow they were on,
 * and an optional screenshot.
 */

import { Platform } from 'react-native'
import { API_BASE_URL, API_TIMEOUTS } from '../config/api'
import type { AsyncResult, AuthError } from '../auth/types'

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

export interface FeedbackInput {
  /** What the tester is reporting — the only required field. */
  description: string
  /** How to reach them for follow-up (email/username). Pre-filled from the user. */
  contact?: string
  /** The page/flow they were on when they hit the issue (e.g. "/explore"). */
  page?: string
  /** Optional screenshot, as a data URI. */
  screenshot?: string | null
  /** Where the feedback came from. Auto-captured when omitted. */
  platform?: string
}

export interface FeedbackSubmitResponse {
  success?: boolean
  id?: string
  message?: string
}

/**
 * Gate for the submit button / inline validation. The description is the one
 * field we genuinely need to triage, so an empty (or whitespace-only) one is
 * rejected here before we touch the network.
 */
export function validateFeedback(input: FeedbackInput): { valid: boolean; message?: string } {
  if (!input.description || input.description.trim().length === 0) {
    return { valid: false, message: 'Please describe what happened before sending.' }
  }
  return { valid: true }
}

export const feedbackClient = {
  /**
   * Submit a beta feedback report. Auto-captures the platform when the caller
   * doesn't pass one so triage always knows where a report came from. Returns
   * the project's AsyncResult shape — never throws — so the UI can render
   * loading / success / error states.
   */
  async submit(input: FeedbackInput): AsyncResult<FeedbackSubmitResponse> {
    try {
      const payload = {
        description: input.description.trim(),
        contact: input.contact,
        page: input.page,
        screenshot: input.screenshot ?? null,
        platform: input.platform ?? Platform.OS,
      }

      const response = await withTimeout(
        buildUrl('/feedback'),
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        API_TIMEOUTS.standard,
      )

      const data = await safeJson<FeedbackSubmitResponse>(response)

      if (!response.ok) {
        return {
          success: false,
          error: toError(data?.message || 'Failed to send feedback', response.status),
        }
      }

      return { success: true, data: data ?? { success: true } }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return { success: false, error: toError('Request timeout. Please check your connection.') }
      }
      return { success: false, error: toError('Network error. Please try again.') }
    }
  },
}
