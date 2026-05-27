# PostHog event taxonomy

Naming + property conventions for `posthog?.capture` calls across the app.
Single source of truth — add new events here when you ship them, and grep
this file before inventing a new name.

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
