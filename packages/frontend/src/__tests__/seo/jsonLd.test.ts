import { describe, it, expect } from 'vitest'

import {
  buildCenterJsonLd,
  buildEventJsonLd,
  buildOrganizationJsonLd,
  SITE_URL,
} from '../../../components/seo/jsonLd'

const validCenter = {
  centerID: 'ctr_123',
  name: 'Chinmaya Mission Boston',
  latitude: 42.36,
  longitude: -71.06,
  address: '123 Vedanta Way, Boston, MA 02101',
  website: 'https://chinmayaboston.org',
  phone: '+1-555-123-4567',
  image: 'https://chinmayaboston.org/logo.png',
  memberCount: 240,
}

const validEvent = {
  eventID: 'evt_42',
  title: 'Gita Jayanti Satsang',
  description: 'An evening of chanting, discourse, and prasadam.',
  date: '2026-07-15',
  endDate: '2026-07-15',
  latitude: 37.77,
  longitude: -122.42,
  address: '1 Krishna Lane, San Francisco, CA',
  image: 'https://example.com/event.jpg',
}

describe('buildCenterJsonLd', () => {
  it('builds a valid LocalBusiness JSON-LD for a full center', () => {
    const raw = buildCenterJsonLd(validCenter)
    expect(raw).not.toBeNull()
    const ld = JSON.parse(raw!)
    expect(ld['@context']).toBe('https://schema.org')
    expect(ld['@type']).toContain('ReligiousOrganization')
    expect(ld['@type']).toContain('LocalBusiness')
    expect(ld.name).toBe('Chinmaya Mission Boston')
    expect(ld['@id']).toBe(`${SITE_URL}/center/ctr_123`)
    expect(ld.url).toBe(`${SITE_URL}/center/ctr_123`)
    expect(ld.geo.latitude).toBe(42.36)
    expect(ld.geo.longitude).toBe(-71.06)
    expect(ld.address.streetAddress).toContain('Boston')
    expect(ld.telephone).toBe('+1-555-123-4567')
    expect(ld.numberOfEmployees).toBe(240)
    expect(ld.sameAs).toEqual(['https://chinmayaboston.org'])
  })

  it('returns null for missing name', () => {
    expect(buildCenterJsonLd({ ...validCenter, name: undefined } as any)).toBeNull()
  })

  it('returns null for non-numeric coordinates', () => {
    expect(buildCenterJsonLd({ ...validCenter, latitude: NaN } as any)).toBeNull()
    expect(buildCenterJsonLd({ ...validCenter, longitude: undefined } as any)).toBeNull()
  })

  it('returns null for missing id (no centerID, no id)', () => {
    const { centerID, ...rest } = validCenter as any
    expect(buildCenterJsonLd(rest)).toBeNull()
  })

  it('accepts the hook display shape (id instead of centerID)', () => {
    const display = { ...validCenter, id: validCenter.centerID, centerID: undefined } as any
    delete display.centerID
    const raw = buildCenterJsonLd(display)
    expect(raw).not.toBeNull()
    const ld = JSON.parse(raw!)
    expect(ld['@id']).toContain('/center/ctr_123')
  })

  it('omits optional fields gracefully when absent', () => {
    const minimal = {
      centerID: 'ctr_min',
      name: 'Minimal Center',
      latitude: 0,
      longitude: 0,
    }
    const ld = JSON.parse(buildCenterJsonLd(minimal as any)!)
    expect(ld.address).toBeUndefined()
    expect(ld.telephone).toBeUndefined()
    expect(ld.image).toBeUndefined()
    expect(ld.sameAs).toBeUndefined()
    expect(ld.numberOfEmployees).toBeUndefined()
  })
})

describe('buildEventJsonLd', () => {
  it('builds a valid Event JSON-LD for a full event', () => {
    const ld = JSON.parse(buildEventJsonLd(validEvent)!)
    expect(ld['@type']).toBe('Event')
    expect(ld.name).toBe('Gita Jayanti Satsang')
    expect(ld['@id']).toBe(`${SITE_URL}/events/evt_42`)
    expect(ld.startDate).toBe('2026-07-15')
    expect(ld.endDate).toBe('2026-07-15')
    expect(ld.eventAttendanceMode).toContain('OfflineEvent')
    expect(ld.location['@type']).toBe('Place')
    expect(ld.location.geo.latitude).toBe(37.77)
    expect(ld.location.address.streetAddress).toContain('Krishna Lane')
    expect(ld.description).toContain('chanting')
  })

  it('returns null without title or date', () => {
    expect(buildEventJsonLd({ ...validEvent, title: '' } as any)).toBeNull()
    expect(buildEventJsonLd({ ...validEvent, date: undefined } as any)).toBeNull()
  })

  it('attaches organizer when centerName option is provided', () => {
    const ld = JSON.parse(
      buildEventJsonLd(validEvent, { centerName: 'CM Boston', centerWebsite: 'https://chinmayaboston.org' })!,
    )
    expect(ld.organizer.name).toBe('CM Boston')
    expect(ld.organizer.url).toBe('https://chinmayaboston.org')
  })

  it('attaches Offer when signupUrl is set', () => {
    const ld = JSON.parse(buildEventJsonLd({ ...validEvent, signupUrl: 'https://signup.com/abc' })!)
    expect(ld.offers.url).toBe('https://signup.com/abc')
    expect(ld.offers.availability).toContain('InStock')
  })
})

describe('buildOrganizationJsonLd', () => {
  it('emits an Organization block with the canonical site URL', () => {
    const ld = JSON.parse(buildOrganizationJsonLd())
    expect(ld['@type']).toBe('Organization')
    expect(ld.url).toBe(SITE_URL)
    expect(ld.logo).toContain('logo.png')
    expect(ld.alternateName).toBe('Chinmaya Mission Janata')
  })
})
