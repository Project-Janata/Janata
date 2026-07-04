# PostHog event taxonomy

Naming + property conventions for `posthog?.capture` calls across the app.
Single source of truth — add new events here when you ship them, and grep
this file before inventing a new name.

> **Platform setup, super/person properties, session replay, surveys, feature
> flags, and the live dashboards are documented at the bottom of this file under
> [Instrumentation platform](#instrumentation-platform).** Read that first if
> you're setting analytics up or wiring a new experiment.

## Naming rules

- **`snake_case`** for both event names and property keys.
- **`<surface>_<noun>_<verb>`** — `landing_cta_pressed`, `center_viewed`,
  `event_registration_failed`. Past-tense verbs (`pressed`, `viewed`,
  `created`, `failed`).
- **One event per user action.** Don't fire `home_visited` AND
  `home_session_started` for the same render.
- **Source as a property, not a name suffix.** Prefer
  `landing_cta_pressed { variant: 'hero' }` over `landing_hero_pressed`.
  Keeps the dashboard slice-able.

## Standard properties

| Key | When to include |
|---|---|
| `source` | when the same event can fire from multiple places (`home`, `discover`, `web_detail`) |
| `variant` | when the same CTA has multiple visual flavors (`hero`, `final`, `final_compact`) |
| `centerId` / `eventId` | always for entity-scoped events |
| `referrer` | when the user landed from outside the app (URL referrer if available) |
| `error` | short string on `*_failed` events |

## Pre-auth / public surface

The marketing-funnel events. PostHog dashboards built on these answer
"who clicks what on the landing page and converts?"

| Event | Properties | Where it fires |
|---|---|---|
| `landing_cta_pressed` | `variant`, `label` | `Hero.tsx` Start Exploring, `FinalCTA.tsx` Browse events nearby |
| `landing_signin_pressed` | `source` | `NavBar.tsx` user icon |
| `landing_ask_pressed` | `audience: 'coordinator'\|'contributor'\|'acharya'` | `FinalCTA.tsx` AskCard CTAs |
| `center_viewed` | `centerId`, `name`, `source` | `app/center/[id].tsx` + `.web.tsx` |
| `center_shared` | `centerId`, `source` | center detail share button |
| `center_address_pressed` | `centerId`, `source` | tap address row |
| `center_website_pressed` | `centerId`, `source` | tap website row |
| `center_phone_pressed` | `centerId`, `source` | tap phone row |
| `center_event_pressed` | `centerId`, `eventId`, `source` | tap event row in center detail |

## In-app (post-auth)

The product-funnel events. Already wired pre-session; documented here for
the source-of-truth pass.

| Event | Properties | Where |
|---|---|---|
| `discover_filter_changed` | `filter` | Explore tab tab switch |
| `discover_search` | `query` | Explore tab search submit |
| `discover_date_selected` | `date` | Explore tab calendar pick |
| `map_point_pressed` | `type`, `id` | map pin tap |
| `event_list_item_pressed` | `eventId`, `source` | Explore tab list tap |
| `center_list_item_pressed` | `centerId`, `source` | Explore tab list tap |
| `event_viewed` | `eventId`, `title`, `isPast` | event detail mount |
| `event_tab_changed` | `tab`, `eventId` | event detail tab switch |
| `event_registered` / `event_unregistered` | `eventId` | RSVP toggle |
| `event_registration_failed` | `eventId`, `error` | RSVP error |
| `event_edit_opened` | `eventId` | event detail pencil |
| `event_deleted` | `eventId` | event detail trash |
| `event_created` | `title`, `centerID` | events/form submit (create) |
| `event_updated` | `eventId`, `title` | events/form submit (edit) |
| `event_create_failed` | `error`, `isEdit` | events/form submit error |
| `home_featured_event_pressed` | `eventId` | Home featured card tap |
| `home_event_pressed` | `eventId`, `source: 'this_week'` | Home this-week row tap |
| `nav_logout` | — | tab header menu |
| `nav_create_event` | — | tab header + button |
| `nav_menu_opened` | — | tab header menu |
| `connect_conversation_selected` | `conversationId` | (deferred surface — Chat tab is hidden post-5/26) |
| `connect_signin_pressed` | — | signed-out chat tab |

## Dashboards to build in PostHog

These are the obvious cuts to build once events land:

1. **Landing → Signup funnel**
   - `landing_cta_pressed` (any variant) → `signup_completed` (placeholder — not yet wired)
   - Conversion rate, time to convert, drop-off step
2. **SEO entry → engagement**
   - `center_viewed { source: web_detail }` → any `event_*` event in same session
   - Tells us if Google-search arrivals are sticking
3. **CTA variant test (free A/B)**
   - `landing_cta_pressed` grouped by `variant` (hero vs final)
   - Whichever wins, we can prune the loser
4. **Center engagement heat**
   - `center_viewed` count + breakdown by `centerId`
   - Which centers attract attention via SEO vs in-app

## Privacy

- No PII in any property. **No** emails, phone numbers, addresses,
  full names.
- `centerId` / `eventId` are opaque UUIDs — safe.
- Don't add a `userId` prop on capture; PostHog identifies via
  `posthog.identify(userId)` once on login (already wired in `_layout.tsx`).
- For pre-auth events, PostHog stores anonymous device IDs only — no PII.

## Adding a new event

1. Add a row to the table above with the event name, properties, and
   where it fires.
2. Use `usePostHog()` + `posthog?.capture('event_name', { ...props })`.
   The `?.` is intentional — PostHog is null in tests and on devices
   that didn't get the env var set.
3. If the event is for a CTA, add a `variant` prop instead of inventing
   a new event name per CTA placement.

---

## Instrumentation platform

PostHog is wired through `<PostHogProvider>` in `app/_layout.tsx` (no
`posthog.init()` — it's declarative) and the `utils/analytics*` helpers. When
`EXPO_PUBLIC_POSTHOG_KEY` is unset the client is `disabled` (no network,
`capture()` is a no-op), so dev machines without a key never send events.

PostHog project: **Janata org → "Default project" (id 361140)**. Read it via the
claude.ai PostHog connector (not the other PostHog MCP, which is a sandbox).

### Super properties (every event)

Registered once per session by `<AnalyticsBootstrap />` (`utils/analyticsEnv.ts`).
The SDK already auto-adds device facts (`$os`, `$os_version`, `$device_type`,
`$device_name`, `$app_version`, `$app_build`, `$locale`), so we only add what it
can't infer:

| Super property | Values | Use |
|---|---|---|
| `environment` | `development` / `production` (`__DEV__`) | filter dev noise out of analytics |
| `release_channel` | `development` / `preview` / `production` (expo-updates) | separate TestFlight/preview from store |
| `app_platform` | `ios` / `android` / `web` | platform splits |
| `is_native` | bool | native app vs web build |
| `is_first_session` | bool | new vs returning on this device |

### Person properties (set on every `identify`)

Built by `buildUserTraits()` in `utils/analyticsIdentity.ts`; applied at all three
identify sites (login, signup, session restore) via `UserContext`. `$set` unless
noted. PII (`email`, `firstName`, `lastName`) is person-level only — never put it
on event properties.

`$internal_or_test_user` (bool), `profileComplete`, `is_verified`,
`verification_level`, `center_id` / `has_center`, `has_photo`, `has_bio`,
`interests_count` / `has_interests`, `looking_for_count` / `has_looking_for`,
`region`, `points`. `$set_once`: `first_identified_at`, `signup_at`.

**Internal/test filtering.** `$internal_or_test_user` is true for `@chinmayajanata.org`
+ `@janata.app` emails, the hardcoded test emails, the `qa-admin-local` username,
and tell-tale tokens (`walkthrough`, `tester`, `qa-admin`, `demo-`, `e2e`,
`smoke-test`) — matched on email AND username. The project's "internal & test
users" filter is set to exclude this flag and new insights default to excluding
it. Caveat: events from internal users that were ingested **before** this shipped
won't carry the flag until those users next identify.

### Canonical content-creation event

`content_created` is the single north-star event for "someone made real content,"
fired once per successful post/reply across every surface (feed composer, center
board, event board, reply thread) with `{ content_type, surface, board_kind?,
parent_id, character_count, has_image? }`. The surface-specific events
(`board_post_created`, `center_board_post_created`, `event_board_post_created`,
`feed_reply_sent`) still fire for back-compat — use `content_created` for the
funnel/metric so you don't double-count. The old `feed_post_created` was removed:
it fired 1:1 with `board_post_created` for the same feed-composer action.

`*_create_failed` events now carry `error` so post failures are diagnosable.

### Onboarding

`onboarding_started` (top of funnel) → `onboarding_step_completed` (with
`step` numeric + `step_name`: name/birthdate/center/interests + `step_index` +
`total_steps`) → `profile_completed` (canonical completion, fires on both the
complete and skip paths) / `onboarding_completed` (long-path only). `onboarding_failed`
carries `error` + `source`.

### Screen views

`<AnalyticsScreenTracker />` fires one `$screen` per distinct route with a stable
`$screen_name` (dynamic ids collapsed to `:id`), a `screen_category` (home, feed,
explore, events, centers, messages, profile, settings, auth, onboarding, landing,
notifications, admin, legal), and the raw `path`.

### Session replay

Mobile replay (iOS/Android) is on via provider `enableSessionReplay` +
`sessionReplayConfig` (text inputs masked, images visible, logs + network
telemetry captured). Project setting `session_recording_opt_in` is on, sampled at
**50%** with a 3s minimum duration to stay inside the free quota. Tune the sample
rate in Project settings → Replay, or gate via the `session-replay-sampling` flag.
Replay does not run on the web build (that needs posthog-js).

### Error tracking

Provider `errorTracking.autocapture` captures uncaught JS errors + unhandled
promise rejections (console off). Complements the React `ErrorBoundary`, which
captures `$exception` for render errors.

### Surveys

`surveys_opt_in` is on and the app is wrapped in `<PostHogSurveyProvider>`. One
draft survey exists — **"Engagement — what would make you post more?"** — a popover
targeted at `profileComplete = true` users, 30-day re-show throttle. Launch it from
the PostHog UI after review. Gate future surveys with the `engagement-survey-enabled`
/ `nps-survey-enabled` flags.

### Feature flags

Keys live in `utils/featureFlags.ts` (`FLAGS` + `useFlag`/`useFlagEnabled`). Eight
inactive scaffolding flags exist for engagement experiments: `onboarding-variant`,
`feed-ranking`, `compose-cta-copy`, `home-first-run-layout`, `social-post-nudge`,
`engagement-survey-enabled`, `nps-survey-enabled`, `session-replay-sampling`.

### Live dashboard

**Engagement & Content Creation** (project 361140, dashboard 1676435, pinned) —
content created/week, unique creators/week, content-creation funnel
(compose → created), activation funnel (signup → profile → first content),
onboarding funnel, social actions/week, weekly active users, and new-vs-returning
lifecycle. All tiles exclude internal/test users.
