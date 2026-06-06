import type { DiscoverCenter, EventDisplay, MapPoint } from '../../utils/api'

export type ExploreSelection = { type: 'event' | 'center'; id: string }

export function isToday(dateStr: string): boolean {
  const today = new Date()
  return dateStr === today.toISOString().split('T')[0]
}

export function formatDatePill(dateStr: string): { month: string; day: string } {
  const d = new Date(dateStr + 'T00:00:00')
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = String(d.getDate())
  return { month, day }
}

export function isValidMapCoord(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

// Great-circle miles between two lat/lng points. Used to rank/filter events
// nearest to the selected center, mirroring native explore.tsx.
export function milesBetween(
  a: { latitude?: number; longitude?: number },
  b: { latitude?: number; longitude?: number }
): number {
  if (
    !Number.isFinite(a.latitude) || !Number.isFinite(a.longitude) ||
    !Number.isFinite(b.latitude) || !Number.isFinite(b.longitude)
  ) {
    return Number.POSITIVE_INFINITY
  }
  const toRad = (v: number) => (v * Math.PI) / 180
  const dLat = toRad(b.latitude! - a.latitude!)
  const dLng = toRad(b.longitude! - a.longitude!)
  const lat1 = toRad(a.latitude!)
  const lat2 = toRad(b.latitude!)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/** Resolve lat/lng for the side panel selection so the map can fly there. */
export function findCoordsForSelection(
  selectedItem: ExploreSelection,
  filteredPoints: MapPoint[],
  allEvents: EventDisplay[],
  allCenters: DiscoverCenter[]
): { latitude: number; longitude: number } | null {
  const targetType = selectedItem.type === 'center' ? 'center' : 'event'
  const pt = filteredPoints.find((p) => p.id === selectedItem.id && p.type === targetType)
  if (pt && isValidMapCoord(pt.latitude, pt.longitude)) {
    return { latitude: pt.latitude, longitude: pt.longitude }
  }
  if (selectedItem.type === 'event') {
    const e = allEvents.find((x) => x.id === selectedItem.id)
    if (
      e?.latitude != null &&
      e?.longitude != null &&
      isValidMapCoord(e.latitude, e.longitude)
    ) {
      return { latitude: e.latitude, longitude: e.longitude }
    }
  } else {
    const c = allCenters.find((x) => x.id === selectedItem.id)
    if (c && isValidMapCoord(c.latitude, c.longitude)) {
      return { latitude: c.latitude, longitude: c.longitude }
    }
  }
  return null
}
