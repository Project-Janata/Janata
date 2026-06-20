/**
 * Tests for src/feedback/feedbackClient.ts
 *
 * Issue #542 — "Add simple user feedback capture path".
 *
 * These tests lock the DATA-LAYER contract behind the in-app feedback UI:
 * what gets sent to the backend when a beta tester submits feedback, and how
 * success / error / network-failure outcomes are reported back to the UI so it
 * can render loading / success / error states.
 *
 * Acceptance-criteria coverage:
 *   - "Feedback includes enough context to triage: user/contact, platform,
 *      page/flow, description, and optional screenshot." -> the submit payload
 *      must carry description, contact, page, screenshot, and an
 *      auto-captured platform.
 *
 * The feedback module is expected to mirror the existing client conventions
 * (see src/auth/authClient.ts and src/auth/inviteClient.ts): a thin client
 * that POSTs JSON via the global fetch and returns the project's AsyncResult
 * shape ({ success: true, data } | { success: false, error }).
 *
 * Expected module surface (to be implemented):
 *   export interface FeedbackInput {
 *     description: string
 *     contact?: string
 *     page?: string
 *     screenshot?: string | null
 *     platform?: string
 *   }
 *   export function validateFeedback(input: FeedbackInput): { valid: boolean; message?: string }
 *   export const feedbackClient: {
 *     submit(input: FeedbackInput): Promise<
 *       { success: true; data: unknown } | { success: false; error: { message: string } }
 *     >
 *   }
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { feedbackClient, validateFeedback } from '../feedback/feedbackClient'
import type { FeedbackInput } from '../feedback/feedbackClient'

// ── Global fetch mock (matches the convention in api.test.ts) ────────────
const mockFetch = vi.fn()
;(globalThis as any).fetch = mockFetch

function mockResponse(body: any, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockResolvedValue(mockResponse({ success: true, id: 'fb_1' }))
})

// ── validateFeedback ─────────────────────────────────────────────────────
// The UI uses this to gate the submit button / show inline validation, so the
// "description" field must be required.

describe('validateFeedback', () => {
  it('rejects an empty description', () => {
    const result = validateFeedback({ description: '' })
    expect(result.valid).toBe(false)
    expect(typeof result.message).toBe('string')
    expect(result.message!.length).toBeGreaterThan(0)
  })

  it('rejects a whitespace-only description', () => {
    const result = validateFeedback({ description: '   \n\t  ' })
    expect(result.valid).toBe(false)
  })

  it('accepts a non-empty description', () => {
    const result = validateFeedback({ description: 'The feed screen is blank' })
    expect(result.valid).toBe(true)
  })
})

// ── feedbackClient.submit ────────────────────────────────────────────────

describe('feedbackClient.submit', () => {
  it('POSTs the feedback to a /feedback endpoint as JSON', async () => {
    await feedbackClient.submit({ description: 'A bug report' })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, init] = mockFetch.mock.calls[0]
    expect(String(url)).toMatch(/\/feedback/)
    expect(init.method).toBe('POST')
    // Sent as JSON so the backend can parse a structured feedback record.
    expect(JSON.stringify(init.headers || {})).toMatch(/application\/json/i)
  })

  it('includes the full triage context in the request body', async () => {
    const input: FeedbackInput = {
      description: 'The map crashes when I tap a center pin',
      contact: 'beta-tester@example.com',
      page: '/explore',
      screenshot: 'data:image/png;base64,AAAA',
    }

    await feedbackClient.submit(input)

    const [, init] = mockFetch.mock.calls[0]
    const body = JSON.parse(init.body as string)

    expect(body.description).toBe(input.description)
    expect(body.contact).toBe(input.contact)
    expect(body.page).toBe(input.page)
    expect(body.screenshot).toBe(input.screenshot)
  })

  it('auto-captures the platform when the caller does not provide one', async () => {
    // setup.ts mocks react-native Platform.OS to "web"; the client should fill
    // the platform automatically so triage always knows where feedback came
    // from, even if the UI forgets to pass it.
    await feedbackClient.submit({ description: 'no platform supplied' })

    const [, init] = mockFetch.mock.calls[0]
    const body = JSON.parse(init.body as string)
    expect(body.platform).toBe('web')
  })

  it('resolves with success when the server accepts the feedback', async () => {
    mockFetch.mockResolvedValue(mockResponse({ success: true, id: 'fb_42' }, true, 201))

    const result = await feedbackClient.submit({ description: 'works' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBeTruthy()
    }
  })

  it('resolves with an error result when the server rejects the request', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'Server error' }, false, 500))

    const result = await feedbackClient.submit({ description: 'boom' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(typeof result.error.message).toBe('string')
      expect(result.error.message.length).toBeGreaterThan(0)
    }
  })

  it('resolves with an error result (does not throw) on network failure', async () => {
    const abort = new Error('aborted')
    // Named AbortError so the retry/withTimeout convention fails fast instead
    // of backing off; a plain try/catch implementation also returns an error.
    ;(abort as any).name = 'AbortError'
    mockFetch.mockRejectedValue(abort)

    const result = await feedbackClient.submit({ description: 'offline' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(typeof result.error.message).toBe('string')
    }
  }, 10000)
})
