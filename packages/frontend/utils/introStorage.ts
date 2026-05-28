/**
 * introStorage.ts
 *
 * Utility functions for storing first-timer intro explainer "seen" state.
 * Mirrors onboardingStorage.ts: dual web (localStorage + cookie) / native
 * (AsyncStorage) persistence so the explainer is shown exactly once per device.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const INTRO_KEY = '@intro_shown'

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

export const setIntroShown = async (value: boolean): Promise<void> => {
  try {
    const serialized = value ? '1' : '0'
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(INTRO_KEY, serialized)
        } catch (e) {}
        setCookie(INTRO_KEY, serialized, 365)
      }
    } else {
      await AsyncStorage.setItem(INTRO_KEY, serialized)
    }
  } catch (error) {
    if (__DEV__) console.error('Error storing intro state:', error)
  }
}

export const getIntroShown = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem(INTRO_KEY)
          if (stored) return stored === '1'
        } catch (e) {}
        const cookie = getCookie(INTRO_KEY)
        return cookie === '1'
      }
      return false
    }
    const value = await AsyncStorage.getItem(INTRO_KEY)
    return value === '1'
  } catch (error) {
    if (__DEV__) console.error('Error retrieving intro state:', error)
    return false
  }
}

export const clearIntroShown = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(INTRO_KEY)
        } catch (e) {}
        eraseCookie(INTRO_KEY)
      }
    } else {
      await AsyncStorage.removeItem(INTRO_KEY)
    }
  } catch (error) {
    if (__DEV__) console.error('Error clearing intro state:', error)
  }
}
