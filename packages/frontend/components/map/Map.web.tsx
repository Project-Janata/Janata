/**
 * Map.web.tsx
 *
 * Om Sri Cinmaya Sadgurave Namaha. Om Sri Gurubyo Namaha.
 * Author: Abhiram Ramachandran
 * Date Authored: September 2, 2025
 * Last Date Modified: January 1, 2026
 *
 * Web-only map component using react-map-gl with OpenStreetMap tiles.
 * Native platforms (iOS/Android) use Map.tsx with react-native-maps.
 */
import React, { useState, useCallback, memo, useRef, useMemo, useEffect } from 'react'
import Map, { Marker, MapRef, AttributionControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTheme } from '../contexts'
import { getLocationAccess, getCurrentPosition } from '../../utils/locationServices'

// Type definitions
export interface MapPoint {
  id: string
  type: 'center' | 'event'
  name: string
  latitude: number
  longitude: number
  description?: string
}

export interface MapProps {
  points?: MapPoint[]
  onPointPress?: (point: MapPoint) => void
  onPointHover?: (point: MapPoint | null, x?: number, y?: number) => void
  onPointClick?: (point: MapPoint, x?: number, y?: number) => void
  onMapMove?: () => void
  initialCenter?: [number, number]
  initialZoom?: number
  showUserLocation?: boolean
  /** ID of the user's home center — map falls back to this center's location when device location is unavailable */
  userCenterID?: string | null
  /** Extra bottom padding so controls stay above a bottom sheet (native only, ignored on web) */
  bottomPadding?: number
  showControls?: boolean
  /**
   * Programmatic fly-to (e.g. list selection). `key` must change each time you want a new animation,
   * including re-selecting the same place.
   */
  flyTo?: { latitude: number; longitude: number; key: number; zoom?: number } | null
  /**
   * After the next fly-to settles, simulate a click on the matching marker so
   * the popover opens for THIS specific point. Necessary when several events
   * share a center's coordinates and the visible top marker may not be the
   * one the user picked from the list. `key` must change to retrigger.
   */
  autoOpenPoint?: { id: string; type: 'center' | 'event'; key: number } | null
}

// Default center - San Francisco Bay Area
const DEFAULT_CENTER = { latitude: 37.7749, longitude: -122.4194 }
const DEFAULT_ZOOM = 10

/**
 * Validate coordinate values
 */
const isValidCoordinate = (lat: number, lng: number): boolean => {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

/**
 * Custom Map Controls - Leaflet-style controls using pure React
 */
interface CustomControlsProps {
  mapRef: React.RefObject<MapRef | null>
  isDark: boolean
}

const CustomControls = memo<CustomControlsProps>(({ mapRef, isDark }) => {
  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn()
  }, [mapRef])

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut()
  }, [mapRef])

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapRef.current?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 16,
          duration: 2000,
        })
      },
      (error) => {
        if (error.code === 1) {
          alert('Location access denied. Please enable location permissions.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [mapRef])

  // One cohesive control stack (zoom in / zoom out / locate) instead of two
  // detached floating groups. On mobile the transparent header (create + profile
  // avatar) owns the top-right, so the controls sit top-LEFT to avoid overlap;
  // on desktop the header is a solid bar above the map, so they go bottom-right.
  const btnClass = `w-9 h-9 border-none cursor-pointer flex items-center justify-center transition-all duration-150 outline-none
    ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'}
    active:bg-orange-500/15`
  const divider = <div className={`h-px ${isDark ? 'bg-white/10' : 'bg-black/[0.08]'}`} />
  return (
    <div className="absolute top-2.5 left-4 md:top-auto md:left-auto md:bottom-2.5 md:right-4 z-[1000] pointer-events-auto">
      <div className="flex flex-col rounded-lg overflow-hidden shadow-[0_2px_6px_rgba(0,0,0,0.2)]">
        <button className={btnClass} onClick={handleZoomIn} title="Zoom in" aria-label="Zoom in">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        {divider}
        <button className={btnClass} onClick={handleZoomOut} title="Zoom out" aria-label="Zoom out">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        {divider}
        <button className={btnClass} onClick={handleLocate} title="Show my location" aria-label="Show my location">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
        </button>
      </div>
    </div>
  )
})

CustomControls.displayName = 'CustomControls'

/**
 * Map Component for Web using react-map-gl with OpenStreetMap
 */
const MapComponent = memo<MapProps>(
  ({
    points = [],
    onPointPress,
    onPointHover,
    onPointClick,
    onMapMove,
    initialCenter,
    initialZoom = DEFAULT_ZOOM,
    showUserLocation = false,
    userCenterID,
    flyTo,
    autoOpenPoint,
    showControls = true,
  }) => {
    const { isDark } = useTheme()
    const mapRef = useRef<MapRef>(null)
    const pointsRef = useRef(points)
    pointsRef.current = points

    // Disable cooperative gestures on mobile so pinch-to-zoom works
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

    const defaultCenter = initialCenter
      ? { longitude: initialCenter[1], latitude: initialCenter[0] }
      : { longitude: DEFAULT_CENTER.longitude, latitude: DEFAULT_CENTER.latitude }

    const [viewState, setViewState] = useState({
      ...defaultCenter,
      zoom: initialZoom,
    })

    // Once we've moved away from the default, lock further auto-moves so the
    // home-center / fit-all effect below doesn't overwrite a granted GPS fix.
    const animatedToTargetRef = useRef(false)

    useEffect(() => {
      const storedLocation = localStorage.getItem('userLocation')
      if (storedLocation) {
        try {
          const { latitude, longitude } = JSON.parse(storedLocation)
          // Reject stale default (Saandeepany, India) that was cached before the fix
          const isOldDefault = Math.abs(latitude - 32.1765) < 0.01 && Math.abs(longitude - 76.3595) < 0.01
          if (latitude && longitude && !isOldDefault) {
            setViewState({ latitude, longitude, zoom: initialZoom })
            animatedToTargetRef.current = true
            return
          }
          if (isOldDefault) localStorage.removeItem('userLocation')
        } catch {}
      }

      const fallbackToCenter = () => {
        const homeCenter = userCenterID
          ? pointsRef.current.find((p) => p.id === userCenterID && p.type === 'center')
          : undefined
        if (homeCenter && isValidCoordinate(homeCenter.latitude, homeCenter.longitude)) {
          setViewState({
            latitude: homeCenter.latitude,
            longitude: homeCenter.longitude,
            zoom: initialZoom,
          })
          animatedToTargetRef.current = true
        }
        // Otherwise let the points-loaded effect below handle fit-all / retry.
      }

      getCurrentPosition().then((coords) => {
        if (coords && coords.length === 2) {
          const [longitude, latitude] = coords
          if (isValidCoordinate(latitude, longitude)) {
            setViewState({ latitude, longitude, zoom: initialZoom })
            localStorage.setItem('userLocation', JSON.stringify({ latitude, longitude }))
            animatedToTargetRef.current = true
            return
          }
        }
        // Location unavailable or denied — fall back to user's home center.
        fallbackToCenter()
      })
    }, [initialZoom, userCenterID])

    // Fallback when GPS hasn't fired and points eventually load: fly to user's
    // home center if known, otherwise frame all valid points. Solves the
    // "always starts in SF" feedback for logged-out users and for logged-in
    // users whose home center wasn't in `points` at mount time.
    useEffect(() => {
      if (animatedToTargetRef.current) return
      if (points.length === 0) return

      if (userCenterID) {
        const homeCenter = points.find((p) => p.id === userCenterID && p.type === 'center')
        if (homeCenter && isValidCoordinate(homeCenter.latitude, homeCenter.longitude)) {
          animatedToTargetRef.current = true
          mapRef.current?.flyTo({
            center: [homeCenter.longitude, homeCenter.latitude],
            zoom: initialZoom,
            duration: 1200,
          })
        }
        // If userCenterID is set but the center isn't in points yet, wait for
        // the next points update — don't fall through to fit-all and risk
        // overriding their home center later.
        return
      }

      // Logged-out / no home center — frame all valid points
      const valid = points.filter((p) => isValidCoordinate(p.latitude, p.longitude))
      if (valid.length === 0) return
      const lats = valid.map((p) => p.latitude)
      const lngs = valid.map((p) => p.longitude)
      animatedToTargetRef.current = true
      mapRef.current?.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 60, duration: 1200 }
      )
    }, [userCenterID, points, initialZoom])

    useEffect(() => {
      if (!flyTo) return
      const { latitude, longitude } = flyTo
      if (!isValidCoordinate(latitude, longitude)) return
      mapRef.current?.flyTo({
        center: [longitude, latitude],
        zoom: flyTo.zoom ?? 15,
        duration: 1200,
      })
    }, [flyTo?.key, flyTo?.latitude, flyTo?.longitude, flyTo?.zoom])

    // After fly-to settles, programmatically open the popover for the
    // requested point. Solves the "click event A in list, see event B's
    // popup" overlap bug — the popup is keyed on the specific MapPoint id,
    // not whichever marker happens to be on top.
    useEffect(() => {
      if (!autoOpenPoint) return
      const map = mapRef.current
      if (!map) return
      const point = pointsRef.current.find(
        (p) => p.id === autoOpenPoint.id && p.type === autoOpenPoint.type
      )
      if (!point) return

      const fire = () => {
        const m = mapRef.current
        if (!m || !onPointClick) return
        const projected = m.project([point.longitude, point.latitude])
        const canvas = m.getCanvas()
        const rect = canvas.getBoundingClientRect()
        // Marker pin's tip sits ~8px above the projected coordinate.
        const x = rect.left + projected.x
        const y = rect.top + projected.y - 8
        onPointClick(point, x, y)
      }

      // Wait for the fly-to animation to finish so the projected coords
      // reflect the final viewport. moveend fires once when animation ends.
      let cancelled = false
      const onMoveEnd = () => {
        if (cancelled) return
        cancelled = true
        map.off('moveend', onMoveEnd)
        // One frame of breathing room so the marker DOM is in place.
        requestAnimationFrame(fire)
      }
      map.on('moveend', onMoveEnd)

      // Safety net: if no flyTo was scheduled (e.g. the point is already on
      // screen), moveend won't fire — fire after a short delay.
      const timer = setTimeout(() => {
        if (cancelled) return
        cancelled = true
        map.off('moveend', onMoveEnd)
        fire()
      }, 1500)

      return () => {
        cancelled = true
        map.off('moveend', onMoveEnd)
        clearTimeout(timer)
      }
    }, [autoOpenPoint?.key, autoOpenPoint?.id, autoOpenPoint?.type, onPointClick])

    const handleMove = useCallback((evt: any) => {
      setViewState(evt.viewState)
      onMapMove?.()
    }, [onMapMove])

    const getMarkerViewportCoords = useCallback(
      (domEvent: MouseEvent | undefined) => {
        if (!domEvent) {
          return { x: 0, y: 0 }
        }
        const target = domEvent.target as HTMLElement | null
        const markerEl = target?.closest('.maplibregl-marker') as HTMLElement | null
        if (markerEl) {
          const mRect = markerEl.getBoundingClientRect()
          return {
            x: mRect.left + mRect.width / 2,
            y: mRect.top,
          }
        }
        return { x: domEvent.clientX, y: domEvent.clientY }
      },
      []
    )

    const handleMarkerClick = useCallback(
      (point: MapPoint) => (e: any) => {
        e.originalEvent?.stopPropagation()
        if (onPointClick) {
          const { x, y } = getMarkerViewportCoords(e.originalEvent)
          onPointClick(point, x, y)
        } else {
          onPointPress?.(point)
        }
      },
      [onPointPress, onPointClick, getMarkerViewportCoords]
    )

    const handleMarkerMouseEnter = useCallback(
      (point: MapPoint) => (e: any) => {
        const { x, y } = getMarkerViewportCoords(e.originalEvent)
        onPointHover?.(point, x, y)
      },
      [onPointHover, getMarkerViewportCoords]
    )

    const handleMarkerMouseLeave = useCallback(() => {
      onPointHover?.(null)
    }, [onPointHover])

    const validPoints = useMemo(
      () => points.filter((point) => isValidCoordinate(point.latitude, point.longitude)),
      [points]
    )

    const mapStyle = useMemo(
      () =>
        isDark
          ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
          : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      [isDark]
    )

    const markers = useMemo(
      () =>
        validPoints.map((point) => (
          <Marker
            key={point.id}
            longitude={point.longitude}
            latitude={point.latitude}
            anchor="bottom"
            onClick={handleMarkerClick(point)}
          >
            <div
              className={`w-[30px] h-[30px] rounded-[50%_50%_50%_0] -rotate-45 border-2 border-white shadow-[0_2px_4px_rgba(0,0,0,0.3)] cursor-pointer
                ${point.type === 'center' ? 'bg-red-500' : 'bg-blue-500'}`}
              title={point.name}
              onMouseEnter={handleMarkerMouseEnter(point) as any}
              onMouseLeave={handleMarkerMouseLeave as any}
            />
          </Marker>
        )),
      [validPoints, handleMarkerClick, handleMarkerMouseEnter, handleMarkerMouseLeave]
    )

    return (
      <div className="w-full h-full relative">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={handleMove}
          mapStyle={mapStyle}
          style={{ width: '100%', height: '100%' }}
          reuseMaps
          attributionControl={false}
          cooperativeGestures={!isMobile}
        >
          {markers}
          <AttributionControl
            compact={true}
            position="bottom-left"
            style={{
              marginBottom: '10px',
              marginLeft: '10px',
            }}
          />
        </Map>
        {showControls && <CustomControls mapRef={mapRef} isDark={isDark} />}
      </div>
    )
  }
)

MapComponent.displayName = 'Map'

export default MapComponent
