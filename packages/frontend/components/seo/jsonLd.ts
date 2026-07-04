/**
 * JSON-LD builders for SEO structured data.
 *
 * Emit one `<script type="application/ld+json">` per detail page so Google
 * can render rich results (centers as religious organizations, events with
 * date/location/organizer).
 *
 * Pure functions — no React. Tested in src/__tests__/seo/jsonLd.test.ts.
 */

/**
 * Structural input types — accept either the raw API shape (`centerID`, `eventID`)
 * or the hook's display shape (`id`). Builders normalize internally.
 */
export interface CenterJsonLdInput {
  id?: string
  centerID?: string
  name?: string
  latitude?: number
  longitude?: number
  address?: string | null
  website?: string | null
  phone?: string | null
  image?: string | null
  memberCount?: number
}

export interface EventJsonLdInput {
  id?: string
  eventID?: string
  title?: string
  description?: string
  date?: string
  endDate?: string | null
  latitude?: number
  longitude?: number
  address?: string | null
  image?: string | null
  signupUrl?: string | null
}

/**
 * Canonical base URL of the deployed app. Prefer the env var so previews can
 * point sitemap + JSON-LD at the right host; default to the prod custom domain.
 */
export const SITE_URL =
  (typeof process !== 'undefined' && process.env.EXPO_PUBLIC_SITE_URL) ||
  'https://chinmayajanata.org'

const SITE_NAME = 'Chinmaya Janata'

/**
 * Build a LocalBusiness / ReligiousOrganization JSON-LD block for a center.
 *
 * Returns `null` when the center lacks the minimum required fields (name +
 * latitude/longitude) — emitting a malformed block hurts SEO worse than not
 * emitting one.
 */
export function buildCenterJsonLd(center: CenterJsonLdInput | null | undefined): string | null {
  if (!center || !center.name) return null
  if (!Number.isFinite(center.latitude) || !Number.isFinite(center.longitude)) return null

  const centerId = center.centerID ?? center.id
  if (!centerId) return null
  const url = `${SITE_URL}/center/${encodeURIComponent(centerId)}`
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['ReligiousOrganization', 'LocalBusiness'],
    '@id': url,
    name: center.name,
    url,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: center.latitude,
      longitude: center.longitude,
    },
  }

  if (center.address) {
    // We don't have parsed address components — emit the freeform string only.
    // Google accepts a `streetAddress` only LocalBusiness in practice.
    node.address = {
      '@type': 'PostalAddress',
      streetAddress: center.address,
    }
  }

  if (center.website) node.sameAs = [center.website]
  if (center.phone) node.telephone = center.phone
  if (center.image) node.image = center.image
  if (typeof center.memberCount === 'number' && center.memberCount > 0) {
    node.numberOfEmployees = center.memberCount
  }

  return JSON.stringify(node)
}

/**
 * Build an Event JSON-LD block. Past events get `eventStatus: EventScheduled`
 * with the original date; Google handles "past" via the date itself.
 *
 * Returns `null` if the event lacks a title or date.
 */
export function buildEventJsonLd(
  event: EventJsonLdInput | null | undefined,
  options: { centerName?: string | null; centerWebsite?: string | null } = {},
): string | null {
  if (!event || !event.title || !event.date) return null

  const eventId = event.eventID ?? event.id
  if (!eventId) return null
  const url = `${SITE_URL}/events/${encodeURIComponent(eventId)}`
  const isPast = !!event.date && new Date(event.date).getTime() < Date.now() - 24 * 3600_000

  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    '@id': url,
    name: event.title,
    url,
    startDate: event.date,
    // Schema.org expects ISO 8601; the API returns 'YYYY-MM-DD' which is valid.
    // If we have an endDate use it; otherwise omit (Google then treats as
    // single-day from startDate).
    ...(event.endDate ? { endDate: event.endDate } : {}),
    eventStatus: isPast
      ? 'https://schema.org/EventScheduled'
      : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    description: event.description || `${event.title} — find more on Chinmaya Janata.`,
  }

  // Location: schema.org Place requires name + address OR geo. Use whatever
  // we have — geo coords always, address when present.
  const place: Record<string, unknown> = {
    '@type': 'Place',
    name: event.address || event.title || SITE_NAME,
  }
  if (event.address) {
    place.address = {
      '@type': 'PostalAddress',
      streetAddress: event.address,
    }
  }
  if (Number.isFinite(event.latitude) && Number.isFinite(event.longitude)) {
    place.geo = {
      '@type': 'GeoCoordinates',
      latitude: event.latitude,
      longitude: event.longitude,
    }
  }
  node.location = place

  // Organizer — the center hosting the event, if known.
  if (options.centerName) {
    const organizer: Record<string, unknown> = {
      '@type': 'Organization',
      name: options.centerName,
    }
    if (options.centerWebsite) organizer.url = options.centerWebsite
    node.organizer = organizer
  }

  if (event.image) node.image = event.image
  if (event.signupUrl) node.offers = {
    '@type': 'Offer',
    url: event.signupUrl,
    availability: 'https://schema.org/InStock',
  }

  return JSON.stringify(node)
}

/**
 * Build an Organization JSON-LD block for the landing page — establishes the
 * sameAs / brand surface so Google groups all centers/events under one
 * organization knowledge panel.
 */
export function buildOrganizationJsonLd(): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    alternateName: 'Chinmaya Mission Janata',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      'Chinmaya Janata connects the worldwide Chinmaya Mission community: discover nearby centers, find events, and stay connected with fellow members.',
  })
}
