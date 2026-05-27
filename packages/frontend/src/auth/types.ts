export type AuthStatus = 'booting' | 'authenticated' | 'unauthenticated'

export interface User {
  id?: string
  username: string
  email?: string | null
  firstName?: string
  lastName?: string
  dateOfBirth?: string | null
  phoneNumber?: string | null
  profileImage?: string | null
  bio?: string | null
  centerID?: string | null
  points?: number
  isVerified?: boolean
  verificationLevel?: number
  isActive?: boolean
  profileComplete?: boolean
  interests?: string[] | null
  // Minimal profile fields (#210)
  school?: string | null
  work?: string | null
  region?: string | null
  lookingFor?: string[] | null
  createdAt?: string
  updatedAt?: string
  // Cached original image for re-editing in the current session
  originalImage?: string | null
}

export interface AuthError {
  message: string
  code?: string
  status?: number
}

export interface LoginRequest {
  username: string
  password: string
}

export interface SignupRequest {
  username: string
  password: string
  inviteCode?: string
}

export interface CheckUserExistsRequest {
  username: string
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  email?: string
  centerID?: string
  profileComplete?: boolean
  profileImage?: string
  bio?: string
  phoneNumber?: string
  interests?: string[]
  dateOfBirth?: string
  // Minimal profile fields (#210)
  school?: string
  work?: string
  region?: string
  lookingFor?: string[]
}

export interface AuthSuccessResponse {
  token?: string
  refreshToken?: string
  user: User
}

export interface CheckUserExistsResponse {
  existence: boolean
}

export interface GenericSuccessResponse {
  success?: boolean
  message?: string
}

export type AsyncResult<T> = Promise<
  { success: true; data: T } | { success: false; error: AuthError }
>
