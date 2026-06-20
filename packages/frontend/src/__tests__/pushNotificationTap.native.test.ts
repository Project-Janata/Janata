/**
 * pushNotificationTap.native.test.ts
 *
 * Regression tests for Janata #535 — "App hangs when opening from an iOS
 * notification tap".
 *
 * The native tap plumbing lives in utils/pushNotifications.native.ts. Its
 * `addNotificationResponseListener` is wired into the app on two channels at
 * once:
 *   1. the live `addNotificationResponseReceivedListener` (warm taps), and
 *   2. `getLastNotificationResponseAsync()` (the cold-start launch tap).
 *
 * `getLastNotificationResponseAsync()` keeps returning the SAME launch response
 * for the whole app session, and the routing effect in usePushNotifications
 * re-subscribes whenever the router / PostHog client identity settles during
 * cold start. The result on a real device: the launch tap is handled more than
 * once, the app re-navigates to the same deep link repeatedly, and the user
 * sees a freeze. A correct fix must process each notification tap exactly once,
 * regardless of how many channels report it or how often the listener
 * re-subscribes within a session — while still routing genuinely new taps.
 *
 * These tests assert that observable contract at the module seam. The
 * deep-link extraction (`actionUrl` lives in `notification.request.content.data`)
 * is pinned too, since "routes to the relevant screen" depends on it.
 *
 * Runs under vitest (node env). expo-notifications / expo-device /
 * expo-constants are mocked; the matching .web file is a no-op so we import the
 * .native module directly.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Shared, hoisted mock state so tests can drive the two delivery channels.
const nm = vi.hoisted(() => {
  const state: {
    listeners: Array<(resp: unknown) => void>
    lastResponse: null | (() => unknown)
  } = { listeners: [], lastResponse: null }
  return {
    state,
    // Simulate the OS delivering a warm tap to every live listener.
    emit(resp: unknown) {
      for (const cb of [...state.listeners]) cb(resp)
    },
    reset() {
      state.listeners = []
      state.lastResponse = null
    },
  }
})

vi.mock('expo-notifications', () => ({
  setNotificationHandler: vi.fn(),
  setNotificationChannelAsync: vi.fn().mockResolvedValue(undefined),
  getPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: vi.fn().mockResolvedValue({ data: 'ExponentPushToken[mock]' }),
  AndroidImportance: { DEFAULT: 3 },
  addNotificationResponseReceivedListener: (cb: (resp: unknown) => void) => {
    nm.state.listeners.push(cb)
    return {
      remove: () => {
        const i = nm.state.listeners.indexOf(cb)
        if (i >= 0) nm.state.listeners.splice(i, 1)
      },
    }
  },
  // Each call returns a FRESH object (as the real SDK can): a correct dedupe
  // must key on the notification identifier, not object identity.
  getLastNotificationResponseAsync: () =>
    Promise.resolve(nm.state.lastResponse ? nm.state.lastResponse() : null),
}))

vi.mock('expo-device', () => ({ isDevice: true }))
vi.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { eas: { projectId: 'mock-project' } } } },
}))

/** A notification-response shaped like expo-notifications delivers. */
function makeResponse(
  identifier: string,
  actionUrl: string | null,
  extraData: Record<string, unknown> = {},
) {
  return {
    actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
    notification: {
      request: {
        identifier,
        content: {
          data: {
            ...(actionUrl !== null ? { actionUrl } : {}),
            type: 'board_post',
            ...extraData,
          },
        },
      },
    },
  }
}

/** Let queued microtasks + the getLastNotificationResponseAsync chain settle. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

type PushModule = typeof import('../../utils/pushNotifications.native')
let push: PushModule

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  nm.reset()
  push = await import('../../utils/pushNotifications.native')
})

describe('addNotificationResponseListener (Janata #535)', () => {
  it('delivers a warm tap to the handler once, with the deep-link payload extracted', async () => {
    const handler = vi.fn()
    const unsubscribe = push.addNotificationResponseListener(handler)
    await flush() // no cold-start response queued

    nm.emit(makeResponse('warm-1', '/feed/post-123'))

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({
      actionUrl: '/feed/post-123',
      data: expect.objectContaining({ actionUrl: '/feed/post-123', type: 'board_post' }),
    })
    unsubscribe()
  })

  it('routes the launch tap on cold start via getLastNotificationResponseAsync, once', async () => {
    nm.state.lastResponse = () => makeResponse('launch-1', '/events/42')

    const handler = vi.fn()
    push.addNotificationResponseListener(handler)
    await flush()

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0]).toMatchObject({ actionUrl: '/events/42' })
  })

  it('handles a single tap reported by BOTH the live listener and the last-response API only once', async () => {
    // The launch tap that cold-started the app is also surfaced to the live
    // listener (distinct object, same notification identifier).
    nm.state.lastResponse = () => makeResponse('dup-1', '/feed/post-xyz')

    const handler = vi.fn()
    push.addNotificationResponseListener(handler)
    nm.emit(makeResponse('dup-1', '/feed/post-xyz'))
    await flush()

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not replay the launch tap when the listener re-subscribes within the same session', async () => {
    // usePushNotifications re-runs its routing effect (router / PostHog deps
    // settle during cold start), so the listener is torn down and re-created.
    // getLastNotificationResponseAsync still returns the launch tap each time.
    nm.state.lastResponse = () => makeResponse('launch-7', '/center/9')

    const handler = vi.fn()
    const unsubscribe1 = push.addNotificationResponseListener(handler)
    await flush()
    unsubscribe1()

    const unsubscribe2 = push.addNotificationResponseListener(handler)
    await flush()

    expect(handler).toHaveBeenCalledTimes(1)
    unsubscribe2()
  })

  it('still delivers genuinely different taps (dedupe is per-notification, not "only ever once")', async () => {
    const handler = vi.fn()
    push.addNotificationResponseListener(handler)
    await flush()

    nm.emit(makeResponse('tap-a', '/feed/a'))
    nm.emit(makeResponse('tap-b', '/feed/b'))

    expect(handler).toHaveBeenCalledTimes(2)
    expect(handler.mock.calls.map((c) => c[0].actionUrl)).toEqual(['/feed/a', '/feed/b'])
  })

  it('stops delivering taps after unsubscribe', async () => {
    const handler = vi.fn()
    const unsubscribe = push.addNotificationResponseListener(handler)
    await flush()

    unsubscribe()
    nm.emit(makeResponse('after-unsub', '/feed/late'))

    expect(handler).not.toHaveBeenCalled()
  })
})
