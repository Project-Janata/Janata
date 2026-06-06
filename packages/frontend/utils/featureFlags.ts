/**
 * featureFlags.ts
 *
 * Single registry of PostHog feature-flag keys plus thin, typed hooks. Keeping
 * the keys here means flag names are greppable, autocomplete-able, and never
 * typo-drift between the dashboard and the code.
 *
 * Most flags below are SCAFFOLDING for engagement experiments we intend to run
 * (onboarding variants, feed ranking, compose-CTA copy). They default to off /
 * control until created + rolled out in the PostHog UI, so referencing them now
 * is safe — `useFlag` returns `undefined`/`false` for an unknown flag.
 */

import { useFeatureFlag, useFeatureFlagWithPayload } from 'posthog-react-native'

export const FLAGS = {
  // Experiments aimed at the north-star: more people creating real content.
  ONBOARDING_VARIANT: 'onboarding-variant',
  FEED_RANKING: 'feed-ranking',
  COMPOSE_CTA_COPY: 'compose-cta-copy',
  HOME_FIRST_RUN_LAYOUT: 'home-first-run-layout',
  SOCIAL_POST_NUDGE: 'social-post-nudge',
  // Gates for in-app surveys so we can target + throttle them without a release.
  ENGAGEMENT_SURVEY: 'engagement-survey-enabled',
  NPS_SURVEY: 'nps-survey-enabled',
  // Kill-switches / staged rollouts for heavier features.
  SESSION_REPLAY_SAMPLING: 'session-replay-sampling',
} as const

export type FlagKey = (typeof FLAGS)[keyof typeof FLAGS]

/** Boolean/multivariate flag value. `undefined` until flags resolve. */
export function useFlag(key: FlagKey) {
  return useFeatureFlag(key)
}

/** True only when a flag is explicitly enabled (treats undefined as off). */
export function useFlagEnabled(key: FlagKey): boolean {
  return useFeatureFlag(key) === true
}

/** Flag value plus its JSON payload, for config-carrying flags. */
export function useFlagWithPayload(key: FlagKey) {
  return useFeatureFlagWithPayload(key)
}
