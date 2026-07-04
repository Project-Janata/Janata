import { Platform } from 'react-native'

const DEV_API_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:8787/api'
  : 'http://localhost:8787/api'

const PROD_API_URL = 'https://api.chinmayajanata.org/api'

const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim()

export const API_BASE_URL =
  envBaseUrl && envBaseUrl.length > 0
    ? envBaseUrl
    : typeof __DEV__ !== 'undefined' && __DEV__
      ? DEV_API_URL
      : PROD_API_URL

export const API_TIMEOUTS = {
  auth: 60_000,
  logout: 30_000,
  standard: 60_000,
} as const

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/authenticate',
    register: '/auth/register',
    verify: '/auth/verify',
    logout: '/auth/deauthenticate',
    deleteAccount: '/auth/delete-account',
    sendVerificationEmail: '/auth/send-verification-email',
    verifyEmail: '/auth/verify-email',
  },
  invites: {
    mint: '/auth/invite-codes',
    listMine: '/auth/invite-codes/mine',
    redeem: '/auth/redeem-invite',
  },
  users: {
    exists: '/userExistence',
    profile: '/auth/update-profile',
  },
} as const

export const DEFAULT_FETCH_OPTIONS: RequestInit = {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
}

export const buildApiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
