/**
 * tokenStorage.ts
 *
 * Native-only token storage using expo-secure-store (iOS Keychain / Android Keystore).
 * Web uses tokenStorage.web.ts (resolved automatically by Metro/webpack).
 */

import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export const setStoredToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
  } catch (error) {
    if (__DEV__) console.error('Error storing token:', error)
  }
}

export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY)
  } catch (error) {
    if (__DEV__) console.error('Error retrieving token:', error)
    return null
  }
}

export const removeStoredToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
  } catch (error) {
    if (__DEV__) console.error('Error removing token:', error)
  }
}

export const hasStoredToken = async (): Promise<boolean> => {
  try {
    const token = await getStoredToken()
    return token !== null && token.length > 0
  } catch (error) {
    if (__DEV__) console.error('Error checking for token:', error)
    return false
  }
}

export const setStoredRefreshToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token)
  } catch (error) {
    if (__DEV__) console.error('Error storing refresh token:', error)
  }
}

export const getStoredRefreshToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
  } catch (error) {
    if (__DEV__) console.error('Error retrieving refresh token:', error)
    return null
  }
}
