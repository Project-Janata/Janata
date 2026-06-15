/**
 * types.ts
 *
 * Om Sri Chinmaya Sadgurave Namaha. Om Sri Gurubyo Namaha.
 *
 * Shared TypeScript types for the Chinmaya Janata backend.
 */

import { NORMAL_USER } from './constants'

// ── Cloudflare bindings ────────────────────────────────────────────────

export interface Env {
  DB: D1Database
  AVATARS: R2Bucket
  JWT_SECRET: string
  JWT_REFRESH_SECRET?: string
  /**
   * Local-dev escape hatch: when "true", adminMiddleware skips the auth/role
   * check so the admin UI can be exercised on localhost without a real admin
   * login. Set in .dev.vars only — never in wrangler.toml / wrangler.staging.toml,
   * so `wrangler deploy` cannot carry it to staging or prod.
   */
  DEV_BYPASS_ADMIN_AUTH?: string
  /** Resend API key for outbound email. Secret. */
  RESEND_API_KEY?: string
  /** From address for outbound email. Set in wrangler.toml [vars]. */
  RESEND_FROM_EMAIL?: string
  /** When "true", outbound email sends are skipped. Tests set this. */
  EMAIL_SEND_DISABLED?: string
  /**
   * Invite gate (#342 hard-gate follow-up). When "true", POST /auth/register
   * refuses signups that don't carry a valid invite code — Janata becomes
   * invite-only at the API, matching the invite-wall UI (#458). Developer
   * emails still bypass. Off (any other value / unset) keeps the legacy soft
   * path where a no-invite signup lands at UNVERIFIED_USER. Set in
   * wrangler.toml [vars] so prod/staging/preview enforce it; left unset in the
   * test config so the existing "no invite → unverified" test stays valid.
   */
  REQUIRE_INVITE_CODE?: string
}

// ── Database row types (mirrors D1 schema) ────────────────────────────

export interface UserRow {
  id: string
  username: string
  password: string
  email: string | null
  first_name: string
  last_name: string
  date_of_birth: string | null
  phone_number: string | null
  profile_image: string | null
  bio: string | null
  center_id: string | null
  points: number
  is_verified: number // 0 | 1
  verification_level: number
  is_active: number // 0 | 1
  profile_complete: number // 0 | 1
  interests: string | null // JSON array
  invite_code: string | null // Invite code used for signup
  invited_by_user_id: string | null // User who issued the invite, if user was invited
  email_verified_at: string | null // ISO timestamp; NULL until email verified
  // Minimal profile fields (#210, migration 0021)
  school: string | null
  work: string | null
  region: string | null
  looking_for: string | null // JSON array
  // Suspension (#209, migration 0024). suspended_at NULL = not suspended.
  // While suspended_at is set, the user is suspended until suspended_until
  // (NULL = indefinite); posting is gated, reads are not.
  suspended_at: string | null
  suspended_until: string | null
  suspended_reason: string | null
  suspended_by: string | null
  created_at: string
  updated_at: string
}

export interface CenterRow {
  id: string
  name: string
  latitude: number
  longitude: number
  address: string | null
  description: string | null
  website: string | null
  phone: string | null
  image: string | null
  acharya: string | null
  point_of_contact: string | null
  member_count: number
  is_verified: number // 0 | 1
  created_at: string
  updated_at: string
}

export interface EventRow {
  id: string
  title: string
  description: string
  date: string
  end_date: string | null
  is_recurring: number // 0 | 1
  latitude: number
  longitude: number
  address: string | null
  center_id: string | null
  tier: number
  people_attending: number
  point_of_contact: string | null
  image: string | null
  category: number | null
  created_by: string | null
  external_url: string | null
  signup_url: string | null
  allow_janata_signup: number // 0 | 1
  // Migration 0022 (#192): 1 when creator's verification_level was >= SEVAK
  // (54) at event creation. Frontend renders a verified-check badge.
  is_official: number // 0 | 1
  // Migration 0023 (#191): 1 when only NORMAL_USER+ can RSVP. Guest RSVP
  // (POST /attendEventGuest) is also rejected when this is 1.
  requires_verified: number // 0 | 1
  created_at: string
  updated_at: string
}

export interface EventGuestRsvpRow {
  event_id: string
  email: string
  name: string
  upgraded_user_id: string | null
  created_at: string
}

export interface EventAttendeeRow {
  event_id: string
  user_id: string
  created_at: string
}

export interface EventEndorserRow {
  event_id: string
  user_id: string
  created_at: string
}

export interface InviteCodeRow {
  code: string
  label: string
  verification_level: number
  is_active: number // 0 | 1
  created_at: string
  // v2 extensions for user-issued single-use links. Admin cohort codes
  // leave these NULL/0 and behave as before (multi-use, no expiry).
  created_by_user_id: string | null
  expires_at: string | null
  max_uses: number | null
  uses_count: number
}

export type BoardType = 'center' | 'event'
export type PostVisibility = 'board' | 'public_signed_in' | 'public_open'

export interface BoardRow {
  id: string
  type: BoardType
  parent_id: string
  created_at: string
}

export interface BoardPostRow {
  id: string
  board_id: string | null
  author_id: string
  body: string
  image_url: string | null
  visibility: PostVisibility
  created_at: string
  updated_at: string
  deleted_at: string | null
  pinned_at: string | null
  pinned_by: string | null
}

export interface BoardReactionCount {
  emoji: string
  count: number
}

// ── API response types ────────────────────────────────────────────────

export type SafeUser = Omit<UserRow, 'password'>

export interface UserApiResponse {
  id: string
  username: string
  email: string | null
  firstName: string
  lastName: string
  dateOfBirth: string | null
  phoneNumber: string | null
  profileImage: string | null
  bio: string | null
  centerID: string | null
  points: number
  isVerified: boolean
  verificationLevel: number
  isActive: boolean
  profileComplete: boolean
  interests: string[] | null
  // Minimal profile fields (#210)
  school: string | null
  work: string | null
  region: string | null
  lookingFor: string[] | null
  // Suspension (#209). isSuspended is computed against "now".
  isSuspended: boolean
  suspendedAt: string | null
  suspendedUntil: string | null
  suspendedReason: string | null
  createdAt: string
  updatedAt: string
}

export interface CenterApiResponse {
  centerID: string
  name: string
  latitude: number
  longitude: number
  address: string | null
  website: string | null
  phone: string | null
  image: string | null
  acharya: string | null
  pointOfContact: string | null
  memberCount: number
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface EventApiResponse {
  eventID: string
  title: string
  description: string
  date: string
  endDate: string | null
  isRecurring: boolean
  latitude: number
  longitude: number
  address: string | null
  centerID: string | null
  tier: number
  peopleAttending: number
  pointOfContact: string | null
  image: string | null
  category: number | null
  createdBy: string | null
  externalUrl: string | null
  signupUrl: string | null
  allowJanataSignup: boolean
  // Migration 0022 (#192): true when creator was at SEVAK or higher at create time.
  isOfficial: boolean
  // Migration 0023 (#191): when true, only verified users can RSVP.
  requiresVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface BoardApiResponse {
  id: string
  type: BoardType
  parentId: string
  createdAt: string
}

export interface BoardPostApiResponse {
  id: string
  boardId: string | null
  visibility: PostVisibility
  body: string
  imageUrl: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  pinnedAt: string | null
  pinnedBy: string | null
  author: UserApiResponse
  reactions: BoardReactionCount[]
  replyCount: number
}

// ── Utility helpers ───────────────────────────────────────────────────

function safeParseJsonArray(value: string | null): string[] | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

// ── Serialization helpers ─────────────────────────────────────────────

/**
 * Whether a user is currently suspended (#209). Lazily expiring: suspended
 * while suspended_at is set AND (suspended_until is NULL = indefinite OR
 * suspended_until is in the future).
 */
export function isUserSuspended(
  row: Pick<UserRow, 'suspended_at' | 'suspended_until'>,
  now: Date = new Date(),
): boolean {
  if (!row.suspended_at) return false
  if (!row.suspended_until) return true // indefinite
  return new Date(row.suspended_until) > now
}

export function userRowToApi(row: UserRow): UserApiResponse {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    phoneNumber: row.phone_number,
    profileImage: row.profile_image,
    bio: row.bio,
    centerID: row.center_id,
    points: row.points,
    // is_verified is derived from verification_level so v2 promotion paths
    // (email verify + invite redeem) don't have to remember to write it.
    isVerified: row.verification_level >= NORMAL_USER,
    verificationLevel: row.verification_level,
    isActive: row.is_active === 1,
    profileComplete: row.profile_complete === 1,
    interests: safeParseJsonArray(row.interests),
    school: row.school,
    work: row.work,
    region: row.region,
    lookingFor: safeParseJsonArray(row.looking_for),
    isSuspended: isUserSuspended(row),
    suspendedAt: row.suspended_at,
    suspendedUntil: row.suspended_until,
    suspendedReason: row.suspended_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function centerRowToApi(row: CenterRow): CenterApiResponse {
  return {
    centerID: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address,
    website: row.website,
    phone: row.phone,
    image: row.image,
    acharya: row.acharya,
    pointOfContact: row.point_of_contact,
    memberCount: row.member_count,
    isVerified: row.is_verified === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function eventRowToApi(row: EventRow): EventApiResponse {
  return {
    eventID: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    endDate: row.end_date,
    isRecurring: row.is_recurring === 1,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address,
    centerID: row.center_id,
    tier: row.tier,
    peopleAttending: row.people_attending,
    pointOfContact: row.point_of_contact,
    image: row.image,
    category: row.category,
    createdBy: row.created_by,
    externalUrl: row.external_url,
    signupUrl: row.signup_url,
    allowJanataSignup: row.allow_janata_signup === 1,
    isOfficial: row.is_official === 1,
    requiresVerified: row.requires_verified === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function boardRowToApi(row: BoardRow): BoardApiResponse {
  return {
    id: row.id,
    type: row.type,
    parentId: row.parent_id,
    createdAt: row.created_at,
  }
}

/**
 * Strips the password from a UserRow for safe API responses.
 */
export function sanitizeUser(row: UserRow): SafeUser {
  const { password: _, ...safe } = row
  return safe
}

// ── Moderation (#209) ──────────────────────────────────────────────────

export type ReportStatus = 'open' | 'actioned' | 'dismissed'

export interface PostReportRow {
  id: string
  post_id: string
  reporter_id: string
  reason: string | null
  status: ReportStatus
  created_at: string
  updated_at: string
}

export interface ModerationActionRow {
  id: string
  actor_id: string | null
  action: string
  target_post_id: string | null
  target_user_id: string | null
  reason: string | null
  metadata: string | null
  created_at: string
}

/** One row in the admin moderation queue: a reported post + its report stats. */
export interface ModerationQueueItem {
  post: BoardPostApiResponse
  reportCount: number
  openReportCount: number
  latestReportAt: string
  latestReason: string | null
  status: ReportStatus
}

export interface ModerationActionApiResponse {
  id: string
  actorId: string | null
  action: string
  targetPostId: string | null
  targetUserId: string | null
  reason: string | null
  metadata: unknown
  createdAt: string
}

export function moderationActionRowToApi(row: ModerationActionRow): ModerationActionApiResponse {
  let metadata: unknown = null
  if (row.metadata) {
    try {
      metadata = JSON.parse(row.metadata)
    } catch {
      metadata = row.metadata
    }
  }
  return {
    id: row.id,
    actorId: row.actor_id,
    action: row.action,
    targetPostId: row.target_post_id,
    targetUserId: row.target_user_id,
    reason: row.reason,
    metadata,
    createdAt: row.created_at,
  }
}
