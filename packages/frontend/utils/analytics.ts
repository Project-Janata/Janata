/**
 * analytics.ts
 *
 * Typed PostHog analytics foundation. Wraps posthog-react-native so the app
 * captures events through a single tiny, dependency-free helper that works
 * identically on native and web.
 *
 * - `useAnalytics()` -> `{ track }` is the import surface for instrumenting
 *   components. `track(event, props)` is a null-safe no-op when PostHog is not
 *   configured (e.g. EXPO_PUBLIC_POSTHOG_KEY unset), so callers never need to
 *   guard themselves.
 * - `AnalyticsScreenTracker` fires one screen view per distinct pathname and is
 *   rendered once inside the PostHogProvider in app/_layout.tsx.
 */

import { useEffect, useRef } from 'react'
import { usePathname } from 'expo-router'
import { usePostHog } from 'posthog-react-native'
import { resolveFirstSession, buildSuperProperties, readWebAcquisition } from './analyticsEnv'

export { usePostHog }

/**
 * Known, already-used event names. Seeded from the events captured across the
 * app/ and components/ trees. Kept here purely for autocomplete — see
 * AnalyticsEvent below, which still accepts any string so parallel work can
 * introduce new event names without editing this file.
 */
export type KnownAnalyticsEvent =
  | '$exception'
  | 'account_deleted'
  | 'admin_tab_changed'
  | 'auth_back_pressed'
  | 'auth_back_to_home_pressed'
  | 'auth_check_failed'
  | 'auth_create_account_pressed'
  | 'auth_discover_pressed'
  | 'auth_email_submitted'
  | 'auth_forgot_password_pressed'
  | 'auth_invite_code_check_failed'
  | 'auth_invite_code_invalid'
  | 'auth_invite_code_submitted'
  | 'auth_invite_code_valid'
  | 'auth_logo_pressed'
  | 'auth_user_exists'
  | 'auth_user_new'
  | 'board_group_picker_opened'
  | 'board_group_selected'
  | 'board_post_create_failed'
  | 'board_post_created'
  | 'board_post_dismissed'
  | 'center_address_pressed'
  | 'center_back_pressed'
  | 'center_board_post_created'
  | 'center_board_post_opened'
  | 'center_board_thread_closed'
  | 'center_event_pressed'
  | 'center_list_item_pressed'
  | 'center_not_found_back_pressed'
  | 'center_phone_pressed'
  | 'center_picker_searched'
  | 'center_picker_selected'
  | 'center_shared'
  | 'center_viewed'
  | 'center_website_pressed'
  | 'chat_back_pressed'
  | 'chat_not_found_back_pressed'
  | 'connect_conversation_closed'
  | 'connect_conversation_selected'
  | 'connect_empty_board_opened'
  | 'connect_explore_pressed'
  | 'connect_feed_post_selected'
  | 'connect_signin_pressed'
  | 'cookie_policy_viewed'
  | 'delete_account_cancelled'
  | 'delete_account_failed'
  | 'delete_account_started'
  | 'discover_center_filter_opened'
  | 'discover_date_selected'
  | 'discover_filter_changed'
  | 'discover_going_filter_toggled'
  | 'discover_search'
  | 'discover_section_toggled'
  | 'event_auth_prompt_shown'
  | 'event_board_post_created'
  | 'event_board_post_opened'
  | 'event_board_thread_closed'
  | 'event_create_failed'
  | 'event_created'
  | 'event_deleted'
  | 'event_edit_opened'
  | 'event_external_signup_pressed'
  | 'event_form_advanced_toggled'
  | 'event_form_back_pressed'
  | 'event_form_category_selected'
  | 'event_form_center_picker_opened'
  | 'event_form_center_selected'
  | 'event_form_date_picker_opened'
  | 'event_form_janata_signup_toggled'
  | 'event_form_time_picker_opened'
  | 'event_list_item_pressed'
  | 'event_list_refreshed'
  | 'event_registered'
  | 'event_registration_failed'
  | 'event_shared'
  | 'event_unregistered'
  | 'event_updated'
  | 'event_viewed'
  | 'feed_create_post_dismissed'
  | 'feed_post_back_pressed'
  | 'feed_post_create_failed'
  | 'feed_post_created'
  | 'feed_post_delete_cancelled'
  | 'feed_post_delete_confirm_shown'
  | 'feed_post_delete_failed'
  | 'feed_post_deleted'
  | 'feed_post_detail_closed'
  | 'feed_post_edit_cancelled'
  | 'feed_post_edit_failed'
  | 'feed_post_edit_opened'
  | 'feed_post_edited'
  | 'feed_post_menu_opened'
  | 'feed_post_pin_toggled'
  | 'feed_post_reacted'
  | 'feed_post_reaction_picker_opened'
  | 'feed_reply_failed'
  | 'feed_reply_sent'
  | 'feed_searched'
  | 'forgot_password_back_pressed'
  | 'forgot_password_code_resent'
  | 'forgot_password_code_submitted'
  | 'forgot_password_email_failed'
  | 'forgot_password_email_submitted'
  | 'forgot_password_logo_pressed'
  | 'forgot_password_resend_failed'
  | 'forgot_password_reset_failed'
  | 'forgot_password_signin_pressed'
  | 'home_board_peek_pressed'
  | 'home_event_pressed'
  | 'home_explore_fallback_pressed'
  | 'home_featured_event_pressed'
  | 'home_first_run_center_opened'
  | 'home_first_run_center_pressed'
  | 'home_first_run_explore_pressed'
  | 'home_first_run_feed_pressed'
  | 'home_open_feed_pressed'
  | 'home_see_all_pressed'
  | 'invite_link_shared'
  | 'landing_ask_pressed'
  | 'landing_cta_pressed'
  | 'landing_signin_pressed'
  | 'login_failed'
  | 'login_success'
  | 'logout'
  | 'map_point_pressed'
  | 'nav_create_event'
  | 'nav_create_pressed'
  | 'nav_logo_pressed'
  | 'nav_logout'
  | 'nav_menu_opened'
  | 'nav_profile_opened'
  | 'nav_settings_opened'
  | 'nav_tab_pressed'
  | 'onboarding_completed'
  | 'onboarding_failed'
  | 'onboarding_skipped'
  | 'onboarding_step_completed'
  | 'privacy_policy_viewed'
  | 'profile_avatar_crop_cancelled'
  | 'profile_avatar_cropped'
  | 'profile_avatar_edit_opened'
  | 'profile_avatar_file_selected'
  | 'profile_center_picker_opened'
  | 'profile_center_selected'
  | 'profile_edit_cancelled'
  | 'profile_edit_opened'
  | 'profile_edit_started'
  | 'profile_interest_toggled'
  | 'profile_looking_for_toggled'
  | 'profile_photo_changed'
  | 'profile_shared'
  | 'profile_update_failed'
  | 'profile_updated'
  | 'settings_admin_dashboard_opened'
  | 'settings_invite_pressed'
  | 'settings_panel_dismissed'
  | 'signup_failed'
  | 'signup_success'
  | 'terms_viewed'
  // --- Funnel completeness (wired in the analytics-instrumentation pass) ---
  | 'onboarding_started'
  | 'profile_completed'
  // --- Engagement / content-creation scaffolding (north-star events) ---
  // Some of these are not wired yet; named here so future work uses the
  // canonical name and dashboards can be pre-built. See docs/analytics-events.md.
  | 'activation_reached'
  | 'compose_opened'
  | 'compose_submitted'
  | 'content_created'
  | 'draft_saved'
  | 'media_attached'
  | 'first_post_created'
  | 'first_reaction_added'
  | 'first_event_registered'
  // Social graph + content interactions
  | 'feed_post_shared'
  | 'feed_post_saved'
  | 'feed_post_reported'
  | 'feed_post_link_opened'
  | 'feed_post_impression'
  | 'feed_refreshed'
  | 'board_followed'
  | 'board_unfollowed'
  | 'board_opened'
  | 'profile_viewed'
  | 'user_followed'
  | 'user_unfollowed'
  | 'connection_requested'
  | 'connection_accepted'
  // Direct messages (Connect/Chat surface)
  | 'dm_thread_opened'
  | 'dm_sent'
  | 'dm_reaction_added'
  // Growth / invites
  | 'invite_sent'
  | 'invite_link_copied'
  | 'invite_accepted'
  | 'invite_redeemed'
  // Notifications / push
  | 'notification_opened'
  | 'push_permission_granted'
  | 'push_permission_denied'
  | 'notification_settings_changed'
  // Search / discovery
  | 'search_performed'
  | 'search_result_pressed'
  // In-app surveys (SDK also emits its own "survey shown/sent" events)
  | 'survey_shown'
  | 'survey_dismissed'
  | 'survey_completed'

/**
 * LiteralUnion: known event names autocomplete, but ANY string is still a valid
 * event. `string & {}` defeats TypeScript's union-collapsing so the literals
 * survive in editor suggestions while the type stays open.
 */
export type AnalyticsEvent = KnownAnalyticsEvent | (string & {})

/**
 * Returns a tiny `{ track }` API backed by the active PostHog client.
 *
 * `track` is null-safe: when PostHog is not configured (`usePostHog()` returns
 * undefined) it is a silent no-op, so callers never have to check.
 */
export function useAnalytics(): {
  track: (event: AnalyticsEvent, props?: Record<string, unknown>) => void
} {
  const posthog = usePostHog()
  const track = (event: AnalyticsEvent, props?: Record<string, unknown>) => {
    // The public `props` type is intentionally loose (Record<string, unknown>)
    // so callers don't fight the SDK's JsonType; PostHog serialises values to
    // JSON at send time, so a cast here is safe.
    posthog?.capture(event, props as Record<string, unknown> as never)
  }
  return { track }
}

/**
 * Coarse product area for a route, so screen views (and any event) can be
 * sliced by section without enumerating every path. Keyed off the first
 * non-empty URL segment (expo-router route groups like `(tabs)` are
 * transparent, so `/` is Home and `/feed` `/explore` `/profile` are tabs).
 */
export type ScreenCategory =
  | 'home'
  | 'feed'
  | 'explore'
  | 'events'
  | 'centers'
  | 'messages'
  | 'profile'
  | 'settings'
  | 'auth'
  | 'onboarding'
  | 'landing'
  | 'notifications'
  | 'admin'
  | 'legal'
  | 'other'

const CATEGORY_BY_PREFIX: Record<string, ScreenCategory> = {
  '': 'home',
  feed: 'feed',
  explore: 'explore',
  events: 'events',
  center: 'centers',
  'center-picker': 'centers',
  chat: 'messages',
  profile: 'profile',
  'edit-profile': 'profile',
  settings: 'settings',
  auth: 'auth',
  verification: 'auth',
  onboarding: 'onboarding',
  intro: 'onboarding',
  landing: 'landing',
  notifications: 'notifications',
  admin: 'admin',
  privacy: 'legal',
  terms: 'legal',
  cookies: 'legal',
}

/** Looks like an opaque id segment (uuid, long hash, numeric, or long token). */
function isIdSegment(seg: string): boolean {
  return (
    /^[0-9]+$/.test(seg) ||
    /^[0-9a-f]{8,}$/i.test(seg) ||
    /^[A-Za-z0-9_-]{16,}$/.test(seg)
  )
}

/**
 * Turns a live pathname into a stable screen name + category. Dynamic id
 * segments collapse to `:id` so `/events/abc123` and `/events/def456` group as
 * one screen (`/events/:id`) instead of fragmenting the dashboard.
 */
export function classifyScreen(pathname: string): { name: string; category: ScreenCategory } {
  if (!pathname || pathname === '/') return { name: '/', category: 'home' }
  const segments = pathname.split('/').filter(Boolean)
  const prefix = segments[0] ?? ''
  const category = CATEGORY_BY_PREFIX[prefix] ?? 'other'
  const name = '/' + segments.map((seg) => (isIdSegment(seg) ? ':id' : seg)).join('/')
  return { name, category }
}

/**
 * Central screen-view tracker. Renders nothing; on each distinct pathname it
 * fires a single screen view with a stable name + product category. Works on
 * native and web because it reads expo-router's `usePathname()` rather than any
 * platform-specific navigation container. Render once inside the PostHogProvider.
 *
 * Prefers the SDK's `screen(name, props)` method; falls back to a manual
 * `$screen` capture if that method is unavailable.
 */
export function AnalyticsScreenTracker(): null {
  const posthog = usePostHog()
  const pathname = usePathname()
  const lastPathname = useRef<string | null>(null)

  useEffect(() => {
    if (!posthog) return
    if (!pathname) return
    if (lastPathname.current === pathname) return
    lastPathname.current = pathname

    const { name, category } = classifyScreen(pathname)
    const props = { $screen_name: name, screen_category: category, path: pathname }

    if (typeof posthog.screen === 'function') {
      posthog.screen(name, props)
    } else {
      posthog.capture('$screen', props)
    }
  }, [posthog, pathname])

  return null
}

/**
 * Registers session-wide super properties (environment, release channel,
 * platform, new-vs-returning) once the PostHog client is ready, so every
 * subsequent event is filterable by where it came from. Renders nothing; mount
 * once inside the PostHogProvider alongside AnalyticsScreenTracker.
 *
 * Device facts ($os, $device_type, $app_version, …) are auto-added by the SDK,
 * so this only registers what the SDK can't infer.
 */
export function AnalyticsBootstrap(): null {
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog) return
    let active = true
    void (async () => {
      const isFirstSession = await resolveFirstSession()
      if (!active || !posthog) return
      void posthog.register(buildSuperProperties(isFirstSession))
      // #413: web acquisition attribution. Register utm_*/referrer as super
      // properties for this session, and stamp first-touch person properties
      // via $set_once so signup/content_created break down by channel.
      const acq = readWebAcquisition()
      if (acq) {
        void posthog.register(acq.superProps)
        posthog.capture('web_acquisition', { ...acq.superProps, $set_once: acq.setOnce })
      }
    })()
    return () => {
      active = false
    }
  }, [posthog])

  return null
}

/**
 * Pre-existing centralised event-name constants. Retained so existing callers
 * that import `AnalyticsEvents` keep working alongside the typed `track` API.
 */
export const AnalyticsEvents = {
  // Auth
  AUTH_EMAIL_SUBMITTED: 'auth_email_submitted',
  AUTH_USER_EXISTS: 'auth_user_exists',
  AUTH_USER_NEW: 'auth_user_new',
  AUTH_CHECK_FAILED: 'auth_check_failed',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  SIGNUP_SUCCESS: 'signup_success',
  SIGNUP_FAILED: 'signup_failed',
  LOGOUT: 'logout',

  // Onboarding
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_FAILED: 'onboarding_failed',

  // Profile
  PROFILE_UPDATED: 'profile_updated',
  PROFILE_UPDATE_FAILED: 'profile_update_failed',
  PROFILE_EDIT_STARTED: 'profile_edit_started',
  PROFILE_EDIT_SAVED: 'profile_edit_saved',
  PROFILE_EDIT_CANCELLED: 'profile_edit_cancelled',

  // Discover / Home
  DISCOVER_FILTER_CHANGED: 'discover_filter_changed',
  DISCOVER_SEARCH: 'discover_search',
  DISCOVER_DATE_SELECTED: 'discover_date_selected',
  MAP_POINT_PRESSED: 'map_point_pressed',

  // Events
  EVENT_VIEWED: 'event_viewed',
  EVENT_REGISTERED: 'event_registered',
  EVENT_UNREGISTERED: 'event_unregistered',
  EVENT_REGISTRATION_FAILED: 'event_registration_failed',
  EVENT_SHARED: 'event_shared',
  EVENT_TAB_CHANGED: 'event_tab_changed',
  EVENT_CREATED: 'event_created',
  EVENT_UPDATED: 'event_updated',
  EVENT_CREATE_FAILED: 'event_create_failed',
  EVENT_EDIT_OPENED: 'event_edit_opened',
  EVENT_LIST_VIEWED: 'event_list_viewed',
  EVENT_LIST_ITEM_PRESSED: 'event_list_item_pressed',

  // Centers
  CENTER_VIEWED: 'center_viewed',
  CENTER_SHARED: 'center_shared',
  CENTER_ADDRESS_PRESSED: 'center_address_pressed',
  CENTER_WEBSITE_PRESSED: 'center_website_pressed',
  CENTER_PHONE_PRESSED: 'center_phone_pressed',
  CENTER_EVENT_PRESSED: 'center_event_pressed',

  // Settings
  SETTINGS_OPENED: 'settings_opened',
  THEME_CHANGED: 'theme_changed',
  PRIVACY_POLICY_VIEWED: 'privacy_policy_viewed',
  TERMS_VIEWED: 'terms_viewed',
  COOKIE_POLICY_VIEWED: 'cookie_policy_viewed',
  DELETE_ACCOUNT_STARTED: 'delete_account_started',
  ACCOUNT_DELETED: 'account_deleted',
  DELETE_ACCOUNT_FAILED: 'delete_account_failed',

  // Navigation
  NAV_PROFILE_OPENED: 'nav_profile_opened',
  NAV_SETTINGS_OPENED: 'nav_settings_opened',
  NAV_CREATE_EVENT: 'nav_create_event',
} as const
