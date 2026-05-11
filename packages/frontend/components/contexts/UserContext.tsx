/**
 * UserContext.tsx
 *
 * Om Sri Cinmaya Sadgurave Namaha. Om Sri Gurubyo Namaha.
 * @author Abhiram Ramachandran
 * @date September 5, 2025
 * @description
 *
 * This file exports a UserContext and UserProvider for managing user authentication state.
 *
 * Dependencies:
 * - @rnmapbox/maps: For rendering maps and handling map-related functionalities.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from 'react'
import { usePostHog } from 'posthog-react-native'
import { getStoredToken, removeStoredToken } from '../utils/tokenStorage'
import {
  clearOnboardingComplete,
  getOnboardingComplete,
  setOnboardingComplete,
} from '../utils/onboardingStorage'
import { authService } from '../../src/auth/authService'
import { API_BASE_URL, API_TIMEOUTS } from '../../src/config/api'
import type { AuthStatus, User, UpdateProfileRequest } from '../../src/auth/types'

interface UserContextType {
  user: User | null
  loading: boolean
  authStatus: AuthStatus
  onboardingComplete: boolean
  refreshUser: () => Promise<void>
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>
  signup: (username: string, password: string, inviteCode?: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  checkUserExists: (username: string) => Promise<boolean>
  setUser: (user: User | null) => void
  getToken: () => Promise<string | null>
  authenticatedFetch: (endpoint: string, options?: RequestInit) => Promise<Response>
  deleteAccount: () => Promise<{ success: boolean; message?: string }>
  updateProfile: (updates: UpdateProfileRequest) => Promise<{ success: boolean; message?: string }>
  setDevSession: (user: User, onboardingComplete: boolean) => Promise<void>
  getUserInitials: () => string
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// Helper function to get user initials
export const getUserInitials = (user: User | null): string => {
  if (!user) return '?'
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }
  if (user.firstName) return user.firstName[0].toUpperCase()
  if (user.username) return user.username[0].toUpperCase()
  return '?'
}

const resolveEndpointUrl = (endpoint: string): string => {
  // Already a full URL — use as-is
  if (/^https?:\/\//i.test(endpoint)) return endpoint

  const normalizedBase = API_BASE_URL.replace(/\/+$/, '')

  // Strip /api or /api/ prefix to avoid double-pathing since API_BASE_URL already includes /api
  const normalizedEndpoint = endpoint.replace(/^\/api(?=\/|$)/, '')

  // Ensure exactly one slash between base and endpoint
  if (normalizedEndpoint.startsWith('/')) {
    return `${normalizedBase}${normalizedEndpoint}`
  }
  if (normalizedEndpoint === '') {
    return normalizedBase
  }
  return `${normalizedBase}/${normalizedEndpoint}`
}

/** Helper to build the PostHog person properties from a User object */
const userTraits = (u: User) => ({
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName,
  profileComplete: u.profileComplete,
})

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const posthog = usePostHog()
  const [user, setUser] = useState<User | null>(null)
  const [authStatus, setAuthStatus] = useState<AuthStatus>('booting')
  const [onboardingComplete, setOnboardingCompleteState] = useState(false)
  const loading = authStatus === 'booting'

  const login = useCallback(async (username: string, password: string) => {
    const result = await authService.login(username, password)
    if (!result.success) {
      posthog?.capture('login_failed', { reason: result.message })
      return { success: false, message: result.message }
    }

    setUser(result.user || null)
    setAuthStatus('authenticated')
    if (result.user) {
      posthog?.identify(result.user.username, userTraits(result.user))
    }
    posthog?.capture('login_success')
    return { success: true }
  }, [posthog])

  const signup = useCallback(async (username: string, password: string, inviteCode?: string) => {
    const result = await authService.signup(username, password, inviteCode)
    if (!result.success || !result.user) {
      posthog?.capture('signup_failed', { reason: result.message })
      return { success: false, message: result.message || 'Signup failed. Please try again.' }
    }

    setUser(result.user)
    setAuthStatus('authenticated')
    posthog?.identify(result.user.username, userTraits(result.user))
    posthog?.capture('signup_success')
    return { success: true }
  }, [posthog])

  const logout = useCallback(async () => {
    posthog?.capture('logout')
    posthog?.reset()
    await authService.logout()
    await clearOnboardingComplete()
    setUser(null)
    setAuthStatus('unauthenticated')
    setOnboardingCompleteState(false)
  }, [posthog])

  const checkUserExists = useCallback(async (username: string) => {
    const result = await authService.checkUserExists(username)
    if (!result.success || typeof result.existence !== 'boolean') {
      throw new Error(result.message || 'Failed to check user existence')
    }
    return result.existence
  }, [])

  const authenticatedFetch = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = await getStoredToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.standard)

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      }

      const response = await fetch(resolveEndpointUrl(endpoint), {
        ...options,
        headers,
        signal: controller.signal,
        credentials: 'include',
      })

      if (response.status === 401 || response.status === 403) {
        await removeStoredToken()
        setUser(null)
        setAuthStatus('unauthenticated')
        throw new Error('Session expired. Please login again.')
      }

      return response
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.')
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }, [])

  const deleteAccount = useCallback(async () => {
    const result = await authService.deleteAccount()
    if (!result.success) {
      posthog?.capture('delete_account_failed', { reason: result.message })
      return { success: false, message: result.message || 'Failed to delete account' }
    }

    posthog?.capture('account_deleted')
    posthog?.reset()
    await clearOnboardingComplete()
    setUser(null)
    setAuthStatus('unauthenticated')
    setOnboardingCompleteState(false)
    return { success: true, message: result.message || 'Account deleted successfully' }
  }, [posthog])

  const updateProfile = useCallback(async (updates: UpdateProfileRequest) => {
    // Save previous user state for rollback on failure
    let previousUser: User | null = null
    setUser((prev) => {
      previousUser = prev
      return prev ? { ...prev, ...updates } : null
    })

    const result = await authService.updateProfile(updates)
    if (!result.success || !result.user) {
      // Rollback optimistic update on failure
      setUser(previousUser)
      posthog?.capture('profile_update_failed', { reason: result.message })
      return { success: false, message: result.message || 'Failed to update profile' }
    }

    setUser(result.user)
    posthog?.capture('profile_updated', { fields: Object.keys(updates) })
    if (updates.profileComplete || result.user.profileComplete) {
      await setOnboardingComplete(true)
      setOnboardingCompleteState(true)
    }
    return { success: true }
  }, [posthog])

  const setDevSession = useCallback(async (devUser: User, completed: boolean) => {
    setUser(devUser)
    setAuthStatus('authenticated')
    setOnboardingCompleteState(!!completed)
    if (completed) {
      await setOnboardingComplete(true)
    } else {
      await clearOnboardingComplete()
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      try {
        const token = await getStoredToken()
        if (!isMounted) return

        if (!token) {
          setUser(null)
          setAuthStatus('unauthenticated')
          return
        }

        const session = await authService.bootstrapSession()
        if (!isMounted) return

        setUser(session.user)
        setAuthStatus(session.authStatus)

        // Identify returning user in PostHog
        if (session.user && session.authStatus === 'authenticated') {
          posthog?.identify(session.user.username, userTraits(session.user))
        }

        const storedOnboarding = await getOnboardingComplete()
        const derivedComplete =
          session.user?.profileComplete === true ||
          (!!session.user?.firstName && !!session.user?.lastName && !!session.user?.email)
        const finalComplete = storedOnboarding || derivedComplete
        setOnboardingCompleteState(finalComplete)
        if (derivedComplete && !storedOnboarding) {
          await setOnboardingComplete(true)
        }
      } catch {
        if (!isMounted) return
        await removeStoredToken()
        setUser(null)
        setAuthStatus('unauthenticated')
        setOnboardingCompleteState(false)
      }
    }

    loadUser()

    return () => {
      isMounted = false
    }
  }, [posthog])

  const refreshUser = useCallback(async () => {
    const session = await authService.bootstrapSession()
    if (session.authStatus === 'authenticated' && session.user) {
      setUser(session.user)
    }
  }, [])

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      authStatus,
      onboardingComplete,
      refreshUser,
      login,
      signup,
      logout,
      checkUserExists,
      setUser,
      getToken: getStoredToken,
      authenticatedFetch,
      deleteAccount,
      updateProfile,
      setDevSession,
      getUserInitials: () => getUserInitials(user),
    }),
    [
      user,
      loading,
      authStatus,
      onboardingComplete,
      refreshUser,
      login,
      signup,
      logout,
      checkUserExists,
      authenticatedFetch,
      deleteAccount,
      updateProfile,
      setDevSession,
    ]
  )

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
}

export default UserContext
