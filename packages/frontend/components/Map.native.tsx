import React, { useEffect, useState, useRef, useCallback, memo } from 'react'
import { StyleSheet, View, Pressable, Platform } from 'react-native'
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Plus, Minus, Navigation } from 'lucide-react-native'
import { getCurrentPosition } from '../utils'
import { useTheme } from './contexts'

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
  initialRegion?: Region
  showUserLocation?: boolean
  /** ID of the user's home center — map falls back to this center's location when device location is unavailable */
  userCenterID?: string | null
  /** Extra bottom padding so controls stay above a bottom sheet (native only, ignored on web) */
  bottomPadding?: number
  showControls?: boolean
}

const DEFAULT_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
}

const isValidCoord = (lat: number, lng: number): boolean =>
  typeof lat === 'number' &&
  typeof lng === 'number' &&
  !isNaN(lat) &&
  !isNaN(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180

const PIN_COLORS = {
  center: '#dc2626',
  event: '#2563eb',
} as const

function MapControls({
  top,
  buttonBg,
  iconColor,
  isDark,
  onZoomIn,
  onZoomOut,
  onLocate,
}: {
  top: number
  buttonBg: string
  iconColor: string
  isDark: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onLocate: () => void
}) {
  const [pressedId, setPressedId] = useState<string | null>(null)

  const makeBg = (id: string) => (pressedId === id ? (isDark ? '#3D2E1E' : '#FDE8D0') : buttonBg)

  return (
    <View style={[styles.controls, { top }]} pointerEvents="box-none">
      <View style={styles.zoomGroup}>
        <Pressable
          onPress={onZoomIn}
          onPressIn={() => setPressedId('in')}
          onPressOut={() => setPressedId(null)}
          style={[styles.zoomButton, { backgroundColor: makeBg('in') }]}
          accessibilityLabel="Zoom in"
        >
          <Plus size={18} color={iconColor} strokeWidth={2} />
        </Pressable>
        <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
        <Pressable
          onPress={onZoomOut}
          onPressIn={() => setPressedId('out')}
          onPressOut={() => setPressedId(null)}
          style={[styles.zoomButton, { backgroundColor: makeBg('out') }]}
          accessibilityLabel="Zoom out"
        >
          <Minus size={18} color={iconColor} strokeWidth={2} />
        </Pressable>
      </View>
      <Pressable
        onPress={onLocate}
        onPressIn={() => setPressedId('loc')}
        onPressOut={() => setPressedId(null)}
        style={[styles.locateButton, { backgroundColor: makeBg('loc'), borderColor: isDark ? '#404040' : '#D6D3D1' }]}
        accessibilityLabel="Show my location"
      >
        <Navigation size={18} color={iconColor} strokeWidth={2} />
      </Pressable>
    </View>
  )
}

const Map = memo<MapProps>(function Map({
  points = [],
  onPointPress,
  onPointHover,
  onPointClick,
  initialRegion,
  showUserLocation = true,
  userCenterID,
  bottomPadding = 0,
  showControls = true,
}) {
  const mapRef = useRef<MapView>(null)

  // Compute initial region synchronously — user's center > SF default
  const computeInitialRegion = (): Region => {
    if (initialRegion) return initialRegion
    const homeCenter = userCenterID
      ? points.find((p) => p.id === userCenterID && p.type === 'center')
      : undefined
    if (homeCenter && isValidCoord(homeCenter.latitude, homeCenter.longitude)) {
      return {
        latitude: homeCenter.latitude,
        longitude: homeCenter.longitude,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      }
    }
    return DEFAULT_REGION
  }

  const [region] = useState<Region>(computeInitialRegion)
  const currentRegionRef = useRef<Region>(region)
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const buttonBg = isDark ? '#171717' : '#ffffff'
  const iconColor = isDark ? '#fafafa' : '#1a1a1a'

  // Track whether we've already moved away from the SF default. Once true,
  // neither the GPS nor the home-center effect fires again.
  const animatedOnceRef = useRef(false)

  // Async: try to get device location and fly to it
  useEffect(() => {
    let mounted = true

    getCurrentPosition()
      .then((position) => {
        if (!mounted || !position || !Array.isArray(position) || position.length !== 2) return
        const [longitude, latitude] = position
        if (!isValidCoord(latitude, longitude)) return

        animatedOnceRef.current = true
        mapRef.current?.animateToRegion(
          { latitude, longitude, latitudeDelta: 0.1, longitudeDelta: 0.1 },
          500
        )
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [])

  // Fallback when GPS hasn't fired (denied, slow, or logged-out). Priorities:
  //   1. user's home center if it's in `points`
  //   2. otherwise fit a bounding box around all valid points
  // Solves "always starts in SF" — the previous SF default only applied when
  // both GPS and home-center lookups failed at mount.
  useEffect(() => {
    if (animatedOnceRef.current) return
    if (points.length === 0) return

    // Home center first (logged-in users with a center set)
    if (userCenterID) {
      const homeCenter = points.find((p) => p.id === userCenterID && p.type === 'center')
      if (homeCenter && isValidCoord(homeCenter.latitude, homeCenter.longitude)) {
        animatedOnceRef.current = true
        mapRef.current?.animateToRegion(
          {
            latitude: homeCenter.latitude,
            longitude: homeCenter.longitude,
            latitudeDelta: 0.2,
            longitudeDelta: 0.2,
          },
          500
        )
      }
      // If user has a center but it's not in points yet, wait for the next
      // points update rather than jumping to fit-all.
      return
    }

    // Logged-out / no home center: frame all valid points
    const valid = points.filter((p) => isValidCoord(p.latitude, p.longitude))
    if (valid.length === 0) return
    const lats = valid.map((p) => p.latitude)
    const lngs = valid.map((p) => p.longitude)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const latDelta = Math.max(0.5, (maxLat - minLat) * 1.2)
    const lngDelta = Math.max(0.5, (maxLng - minLng) * 1.2)
    animatedOnceRef.current = true
    mapRef.current?.animateToRegion(
      {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      },
      500
    )
  }, [userCenterID, points])

  const handleMarkerPress = useCallback(
    (point: MapPoint) => {
      if (onPointPress) {
        onPointPress(point)
      }
    },
    [onPointPress]
  )

  const getPinColor = useCallback((type: MapPoint['type']): string => {
    return PIN_COLORS[type] || PIN_COLORS.event
  }, [])

  // Zoom by adjusting region delta. Camera.zoom is Google-Maps-only;
  // on iOS Apple Maps the camera object doesn't expose zoom, which is
  // why a getCamera/setZoom path was a no-op on iOS.
  // factor < 1 → zoom in (smaller delta); factor > 1 → zoom out.
  const handleZoom = useCallback((factor: number) => {
    const r = currentRegionRef.current
    if (!r) return
    mapRef.current?.animateToRegion(
      {
        latitude: r.latitude,
        longitude: r.longitude,
        latitudeDelta: Math.max(0.0005, Math.min(180, r.latitudeDelta * factor)),
        longitudeDelta: Math.max(0.0005, Math.min(180, r.longitudeDelta * factor)),
      },
      200
    )
  }, [])

  // Recenter to device location. iOS's `showsMyLocationButton` is
  // Android-only, so we wire our own button to getCurrentPosition.
  const handleLocate = useCallback(async () => {
    const position = await getCurrentPosition().catch(() => null)
    if (!position || !Array.isArray(position) || position.length !== 2) return
    const [longitude, latitude] = position
    if (!isValidCoord(latitude, longitude)) return
    mapRef.current?.animateToRegion(
      { latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 },
      500
    )
  }, [])

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        onRegionChangeComplete={(r) => {
          currentRegionRef.current = r
        }}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={showControls}
        showsCompass={showControls}
        showsScale={showControls}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        loadingEnabled={true}
        loadingIndicatorColor="#dc2626"
        loadingBackgroundColor="#ffffff"
        moveOnMarkerPress={false}
        toolbarEnabled={false}
        minZoomLevel={2}
        maxZoomLevel={20}
        mapPadding={{ top: 0, right: 0, bottom: bottomPadding, left: 0 }}
      >
        {points
          .filter((p) => isValidCoord(p.latitude, p.longitude))
          .map((point) => (
            <Marker
              key={point.id}
              coordinate={{ latitude: point.latitude, longitude: point.longitude }}
              title={point.name}
              description={point.description || point.type}
              pinColor={getPinColor(point.type)}
              onPress={() => handleMarkerPress(point)}
              identifier={point.id}
              // iOS performance: without this, every marker re-renders its
              // view on each map gesture, which is what causes the "frozen
              // map" symptom on iOS with 100+ markers.
              tracksViewChanges={false}
            />
          ))}
      </MapView>

      {/* Custom controls in the top-right, sitting under the profile icon.
          react-native-maps' built-in user-location button is Android-only,
          and zoom buttons aren't built in at all. */}
      {showControls && (
        <MapControls
          top={insets.top + 64}
          buttonBg={buttonBg}
          iconColor={iconColor}
          isDark={isDark}
          onZoomIn={() => handleZoom(0.5)}
          onZoomOut={() => handleZoom(2)}
          onLocate={handleLocate}
        />
      )}
    </View>
  )
})

export default Map

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  controls: {
    position: 'absolute',
    right: 12,
    gap: 8,
    alignItems: 'flex-end',
  },
  zoomGroup: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  zoomButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
})
