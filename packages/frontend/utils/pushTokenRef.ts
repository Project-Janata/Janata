/**
 * pushTokenRef.ts
 *
 * Tiny in-memory holder for the active device push token. Lets the logout
 * flow unregister the token from the backend BEFORE the JWT is cleared,
 * without UserContext having to import the native push module (web-safe).
 */
let current: string | null = null

export function setActivePushToken(token: string | null): void {
  current = token
}

export function getActivePushToken(): string | null {
  return current
}
