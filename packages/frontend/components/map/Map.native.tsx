import React, { useEffect, useState, useRef, useCallback, memo } from 'react'
import { StyleSheet, View, Pressable, Platform, Text } from 'react-native'
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { Plus, Minus, Navigation } from 'lucide-react-native'
import { getCurrentPosition } from '../../utils'
import { useTheme } from '../contexts'

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
  /** Imperatively pan/zoom the map to a point. Bump `key` to re-trigger on the
   * same coordinates. `zoom` follows the web Map's slippy-tile convention. */
  flyTo?: { latitude: number; longitude: number; key: number; zoom?: number } | null
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

const hasAndroidGoogleMapsApiKey = (): boolean => {
  if (Platform.OS !== 'android') return true
  const extra = Constants.expoConfig?.extra as { googleMapsAndroidApiKeyPresent?: boolean } | undefined
  return Boolean(extra?.googleMapsAndroidApiKeyPresent || process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY)
}

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
          accessibilityRole="button"
          accessibilityLabel="Zoom in"
          accessibilityHint="Zooms the map in one step"
        >
          <Plus size={18} color={iconColor} strokeWidth={2} />
        </Pressable>
        <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }} />
        <Pressable
          onPress={onZoomOut}
          onPressIn={() => setPressedId('out')}
          onPressOut={() => setPressedId(null)}
          style={[styles.zoomButton, { backgroundColor: makeBg('out') }]}
          accessibilityRole="button"
          accessibilityLabel="Zoom out"
          accessibilityHint="Zooms the map out one step"
        >
          <Minus size={18} color={iconColor} strokeWidth={2} />
        </Pressable>
      </View>
      <Pressable
        onPress={onLocate}
        onPressIn={() => setPressedId('loc')}
        onPressOut={() => setPressedId(null)}
        style={[styles.locateButton, { backgroundColor: makeBg('loc'), borderColor: isDark ? '#404040' : '#D6D3D1' }]}
        accessibilityRole="button"
        accessibilityLabel="Show my location"
        accessibilityHint="Centers the map on your current location"
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
  flyTo,
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
  const nativeGoogleMapsAvailable = hasAndroidGoogleMapsApiKey()

  // Track whether we've already moved away from the SF default. Once true,
  // neither the GPS nor the home-center effect fires again.
  const animatedOnceRef = useRef(false)

  // Async: try to get device location and fly to it
  useEffect(() => {
    if (!nativeGoogleMapsAvailable) return
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
  }, [nativeGoogleMapsAvailable])

  // Fallback when GPS hasn't fired (denied, slow, or logged-out). Priorities:
  //   1. user's home center if it's in `points`
  //   2. otherwise fit a bounding box around all valid points
  // Solves "always starts in SF" — the previous SF default only applied when
  // both GPS and home-center lookups failed at mount.
  useEffect(() => {
    if (!nativeGoogleMapsAvailable) return
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
  }, [nativeGoogleMapsAvailable, userCenterID, points])

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

  // Imperative pan/zoom (e.g. picking a center in Discover). Keyed on flyTo.key
  // so re-selecting the same center re-pans. Converts the web zoom level to a
  // region delta (360 / 2^zoom ≈ the slippy-tile span); defaults to a ~city
  // view. Marks animatedOnceRef so the auto-fit effects don't fight it.
  useEffect(() => {
    if (!nativeGoogleMapsAvailable) return
    if (!flyTo) return
    if (!isValidCoord(flyTo.latitude, flyTo.longitude)) return
    const delta = flyTo.zoom ? 360 / Math.pow(2, flyTo.zoom) : 0.35
    animatedOnceRef.current = true
    mapRef.current?.animateToRegion(
      {
        latitude: flyTo.latitude,
        longitude: flyTo.longitude,
        latitudeDelta: delta,
        longitudeDelta: delta,
      },
      500
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nativeGoogleMapsAvailable, flyTo?.key])

  if (!nativeGoogleMapsAvailable) {
    const isDevBuild = typeof __DEV__ !== 'undefined' && __DEV__
    const fallbackPoints = points.filter((p) => isValidCoord(p.latitude, p.longitude)).slice(0, 6)

    return (
      <View style={[styles.container, styles.fallback, { backgroundColor: isDark ? '#0F0F0F' : '#FAFAF7' }]}>
        <View
          style={[
            styles.fallbackPanel,
            {
              backgroundColor: isDark ? '#171717' : '#FFFFFF',
              borderColor: isDark ? '#2A2A2A' : '#E7E5E4',
            },
          ]}
        >
          <Text style={[styles.fallbackTitle, { color: isDark ? '#FAFAFA' : '#1C1917' }]}>
            {isDevBuild ? 'Map unavailable in this Android build' : 'Map temporarily unavailable'}
          </Text>
          <Text style={[styles.fallbackBody, { color: isDark ? '#A8A29E' : '#57534E' }]}>
            {isDevBuild
              ? 'Add a Google Maps Android API key and rebuild to enable the live map.'
              : 'Explore centers and events in the list below.'}
          </Text>

          {fallbackPoints.length > 0 && (
            <View style={styles.fallbackList}>
              {fallbackPoints.map((point) => (
                <Pressable
                  key={point.id}
                  onPress={() => handleMarkerPress(point)}
                  style={[
                    styles.fallbackRow,
                    {
                      backgroundColor: isDark ? '#1F1F1F' : '#FAFAF7',
                      borderColor: isDark ? '#333333' : '#E7E5E4',
                    },
                  ]}
                >
                  <View style={[styles.fallbackDot, { backgroundColor: getPinColor(point.type) }]} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={[styles.fallbackName, { color: isDark ? '#FAFAFA' : '#1C1917' }]}>
                      {point.name}
                    </Text>
                    <Text style={[styles.fallbackType, { color: isDark ? '#A8A29E' : '#78716C' }]}>
                      {point.type === 'center' ? 'Center' : 'Event'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    )
  }

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

      {/* Custom controls in the top-right, sitting BELOW the profile avatar
          (TabHeader renders a 32px avatar at top=insets.top). Offset by the
          avatar zone (~44) so the zoom group clears it instead of overlapping.
          react-native-maps' built-in user-location button is Android-only,
          and zoom buttons aren't built in at all. */}
      {showControls && (
        <MapControls
          top={Math.max(insets.top, 8) + 44}
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
    right: 16,
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
  fallback: {
    justifyContent: 'center',
    padding: 16,
  },
  fallbackPanel: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    gap: 10,
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  fallbackBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  fallbackList: {
    gap: 8,
    marginTop: 4,
  },
  fallbackRow: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fallbackDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  fallbackName: {
    fontSize: 14,
    fontWeight: '600',
  },
  fallbackType: {
    fontSize: 12,
    marginTop: 2,
  },
})
