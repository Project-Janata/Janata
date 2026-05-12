/**
 * onboardingStorage.ts
 *
 * Utility functions for storing onboarding completion state
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const ONBOARDING_KEY = '@onboarding_complete'

const setCookie = (name: string, value: string, days: number) => {
  if (typeof document === 'undefined') return
  let expires = ''
  if (days) {
    const date = new Date()
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
    expires = '; expires=' + date.toUTCString()
  }
  document.cookie = name + '=' + (value || '') + expires + '; path=/'
}

const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null
  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

const eraseCookie = (name: string) => {
  if (typeof document === 'undefined') return
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
}

export const setOnboardingComplete = async (value: boolean): Promise<void> => {
  try {
    const serialized = value ? '1' : '0'
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(ONBOARDING_KEY, serialized)
        } catch (e) {}
        setCookie(ONBOARDING_KEY, serialized, 30)
      }
    } else {
      await AsyncStorage.setItem(ONBOARDING_KEY, serialized)
    }
  } catch (error) {
    if (__DEV__) console.error('Error storing onboarding state:', error)
  }
}

export const getOnboardingComplete = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(ONBOARDING_KEY)
          if (stored) return stored === '1'
        } catch (e) {}
        const cookie = getCookie(ONBOARDING_KEY)
        return cookie === '1'
      }
      return false
    }
    const value = await AsyncStorage.getItem(ONBOARDING_KEY)
    return value === '1'
  } catch (error) {
    if (__DEV__) console.error('Error retrieving onboarding state:', error)
    return false
  }
}

export const clearOnboardingComplete = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(ONBOARDING_KEY)
        } catch (e) {}
        eraseCookie(ONBOARDING_KEY)
      }
    } else {
      await AsyncStorage.removeItem(ONBOARDING_KEY)
    }
  } catch (error) {
    if (__DEV__) console.error('Error clearing onboarding state:', error)
  }
}
