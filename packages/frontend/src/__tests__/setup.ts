/**
 * Test setup for frontend unit tests.
 * Provides mocks for React Native, AsyncStorage, and global constants.
 */
import { vi } from 'vitest'

// Mock __DEV__ global (Expo/Metro defines this)
;(globalThis as any).__DEV__ = true

// Mock React Native Platform
vi.mock('react-native', () => ({
  Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
}))

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock tokenStorage (web version) — individual tests can override
vi.mock('../storage/tokenStorage', () => ({
  getStoredToken: vi.fn().mockResolvedValue(null),
  setStoredToken: vi.fn().mockResolvedValue(undefined),
  removeStoredToken: vi.fn().mockResolvedValue(undefined),
  hasStoredToken: vi.fn().mockResolvedValue(false),
}))

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSegments: () => [],
  Slot: 'Slot',
  Stack: 'Stack',
  SplashScreen: {
    preventAutoHideAsync: vi.fn(),
    hideAsync: vi.fn(),
  },
}))
