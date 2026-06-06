/**
 * Tests for components/utils/tokenStorage.web.ts
 *
 * We test the actual implementation, NOT the mocked version.
 * We mock localStorage and document.cookie, and ensure `window` is defined.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const TOKEN_KEY = '@auth_token'

// ── localStorage mock ──────────────────────────────────────────────────
let store: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value }),
  removeItem: vi.fn((key: string) => { delete store[key] }),
  clear: vi.fn(() => { store = {} }),
}

// ── document.cookie mock ───────────────────────────────────────────────
let cookieStore = ''
let lastCookieWrite = ''

// Save originals
const origWindow = (globalThis as any).window
const origDocument = (globalThis as any).document
const origLocalStorage = (globalThis as any).localStorage

beforeEach(() => {
  store = {}
  localStorageMock.getItem.mockImplementation((key: string) => store[key] ?? null)
  localStorageMock.setItem.mockImplementation((key: string, value: string) => { store[key] = value })
  localStorageMock.removeItem.mockImplementation((key: string) => { delete store[key] })
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  cookieStore = ''
  lastCookieWrite = ''

  // Define window so typeof window !== 'undefined' passes
  ;(globalThis as any).window = globalThis

  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
    configurable: true,
  })

  Object.defineProperty(globalThis, 'document', {
    value: {
      get cookie() {
        return cookieStore
      },
      set cookie(val: string) {
        lastCookieWrite = val
        const parts = val.split(';')
        const nameValue = parts[0].trim()
        const eqIdx = nameValue.indexOf('=')
        if (eqIdx === -1) return
        const name = nameValue.substring(0, eqIdx)
        const value = nameValue.substring(eqIdx + 1)

        // Check if this is an expiry/deletion cookie
        const expiresMatch = val.match(/Expires=([^;]+)/)
        if (expiresMatch) {
          const expDate = new Date(expiresMatch[1])
          if (expDate.getTime() < Date.now()) {
            // Remove cookie
            const cookies = cookieStore.split(';').filter((c) => {
              const cn = c.trim().split('=')[0]
              return cn !== name
            })
            cookieStore = cookies.filter(Boolean).join('; ')
            return
          }
        }

        // Add or update cookie
        const existing = cookieStore.split(';').filter((c) => {
          const cn = c.trim().split('=')[0]
          return cn !== name
        })
        existing.push(`${name}=${value}`)
        cookieStore = existing.filter(Boolean).map((s) => s.trim()).join('; ')
      },
    },
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  // Restore originals
  if (origWindow === undefined) {
    delete (globalThis as any).window
  } else {
    ;(globalThis as any).window = origWindow
  }
  if (origDocument === undefined) {
    delete (globalThis as any).document
  } else {
    ;(globalThis as any).document = origDocument
  }
  if (origLocalStorage === undefined) {
    // Can't really delete localStorage on globalThis, but configurable allows it
    try {
      Object.defineProperty(globalThis, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true,
      })
    } catch {}
  } else {
    Object.defineProperty(globalThis, 'localStorage', {
      value: origLocalStorage,
      writable: true,
      configurable: true,
    })
  }
})

// Dynamically import the actual web implementation, bypassing the setup.ts mock
async function getTokenStorage() {
  vi.resetModules()
  ;(globalThis as any).__DEV__ = true
  // Make sure window is still set after resetModules
  ;(globalThis as any).window = globalThis
  vi.doUnmock('../storage/tokenStorage')
  return await import('../storage/tokenStorage.web')
}

describe('setStoredToken', () => {
  it('stores token in localStorage and sets cookie', async () => {
    const { setStoredToken } = await getTokenStorage()
    await setStoredToken('my-token')

    expect(localStorageMock.setItem).toHaveBeenCalledWith(TOKEN_KEY, 'my-token')
    expect(cookieStore).toContain(`${TOKEN_KEY}=my-token`)
    expect(lastCookieWrite).toContain('Secure')
    expect(lastCookieWrite).toContain('SameSite=Lax')
  })
})

describe('getStoredToken', () => {
  it('reads from localStorage first', async () => {
    const { getStoredToken } = await getTokenStorage()
    store[TOKEN_KEY] = 'local-token'

    const token = await getStoredToken()
    expect(token).toBe('local-token')
  })

  it('falls back to cookie when localStorage has no token', async () => {
    const { getStoredToken } = await getTokenStorage()
    cookieStore = `${TOKEN_KEY}=cookie-token`

    const token = await getStoredToken()
    expect(token).toBe('cookie-token')
  })

  it('returns null when neither localStorage nor cookie has token', async () => {
    const { getStoredToken } = await getTokenStorage()

    const token = await getStoredToken()
    expect(token).toBeNull()
  })
})

describe('removeStoredToken', () => {
  it('removes from localStorage and erases cookie', async () => {
    const { removeStoredToken } = await getTokenStorage()
    store[TOKEN_KEY] = 'to-remove'
    cookieStore = `${TOKEN_KEY}=to-remove`

    await removeStoredToken()
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(TOKEN_KEY)
    expect(cookieStore).not.toContain(`${TOKEN_KEY}=to-remove`)
    expect(lastCookieWrite).toContain('Secure')
    expect(lastCookieWrite).toContain('SameSite=Lax')
  })
})

describe('hasStoredToken', () => {
  it('returns true when token exists in localStorage', async () => {
    const { hasStoredToken } = await getTokenStorage()
    store[TOKEN_KEY] = 'exists'

    const result = await hasStoredToken()
    expect(result).toBe(true)
  })

  it('returns true when token exists in cookie only', async () => {
    const { hasStoredToken } = await getTokenStorage()
    cookieStore = `${TOKEN_KEY}=cookie-token`

    const result = await hasStoredToken()
    expect(result).toBe(true)
  })

  it('returns false when no token exists', async () => {
    const { hasStoredToken } = await getTokenStorage()

    const result = await hasStoredToken()
    expect(result).toBe(false)
  })
})

describe('cookie fallback when localStorage throws', () => {
  it('setStoredToken still sets cookie when localStorage.setItem throws', async () => {
    const { setStoredToken } = await getTokenStorage()
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('localStorage disabled')
    })

    await setStoredToken('fallback-token')
    expect(cookieStore).toContain(`${TOKEN_KEY}=fallback-token`)
    expect(lastCookieWrite).toContain('Secure')
    expect(lastCookieWrite).toContain('SameSite=Lax')
  })

  it('getStoredToken falls back to cookie when localStorage.getItem throws', async () => {
    const { getStoredToken } = await getTokenStorage()
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error('localStorage disabled')
    })
    cookieStore = `${TOKEN_KEY}=cookie-fallback`

    const token = await getStoredToken()
    expect(token).toBe('cookie-fallback')
  })
})
