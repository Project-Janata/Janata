System.register(["react/jsx-runtime", "react", "react-native", "react-native-maps", "react-native-safe-area-context", "lucide-react-native", "../utils", "./contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, react_native_maps_1, react_native_safe_area_context_1, lucide_react_native_1, utils_1, contexts_1, DEFAULT_REGION, isValidCoord, PIN_COLORS, Map, styles;
    var __moduleName = context_1 && context_1.id;
    function MapControls({ top, buttonBg, iconColor, isDark, onZoomIn, onZoomOut, onLocate, }) {
        const [pressedId, setPressedId] = react_1.useState(null);
        const makeBg = (id) => (pressedId === id ? (isDark ? '#3D2E1E' : '#FDE8D0') : buttonBg);
        return (_jsxs(react_native_1.View, { style: [styles.controls, { top }], pointerEvents: "box-none", children: [_jsxs(react_native_1.View, { style: styles.zoomGroup, children: [_jsx(react_native_1.Pressable, { onPress: onZoomIn, onPressIn: () => setPressedId('in'), onPressOut: () => setPressedId(null), style: [styles.zoomButton, { backgroundColor: makeBg('in') }], accessibilityLabel: "Zoom in", children: _jsx(lucide_react_native_1.Plus, { size: 18, color: iconColor, strokeWidth: 2 }) }), _jsx(react_native_1.View, { style: { height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' } }), _jsx(react_native_1.Pressable, { onPress: onZoomOut, onPressIn: () => setPressedId('out'), onPressOut: () => setPressedId(null), style: [styles.zoomButton, { backgroundColor: makeBg('out') }], accessibilityLabel: "Zoom out", children: _jsx(lucide_react_native_1.Minus, { size: 18, color: iconColor, strokeWidth: 2 }) })] }), _jsx(react_native_1.Pressable, { onPress: onLocate, onPressIn: () => setPressedId('loc'), onPressOut: () => setPressedId(null), style: [styles.locateButton, { backgroundColor: makeBg('loc'), borderColor: isDark ? '#404040' : '#D6D3D1' }], accessibilityLabel: "Show my location", children: _jsx(lucide_react_native_1.Navigation, { size: 18, color: iconColor, strokeWidth: 2 }) })] }));
    }
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (react_native_maps_1_1) {
                react_native_maps_1 = react_native_maps_1_1;
            },
            function (react_native_safe_area_context_1_1) {
                react_native_safe_area_context_1 = react_native_safe_area_context_1_1;
            },
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            },
            function (utils_1_1) {
                utils_1 = utils_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            }
        ],
        execute: function () {
            DEFAULT_REGION = {
                latitude: 37.7749,
                longitude: -122.4194,
                latitudeDelta: 0.5,
                longitudeDelta: 0.5,
            };
            isValidCoord = (lat, lng) => typeof lat === 'number' &&
                typeof lng === 'number' &&
                !isNaN(lat) &&
                !isNaN(lng) &&
                lat >= -90 &&
                lat <= 90 &&
                lng >= -180 &&
                lng <= 180;
            PIN_COLORS = {
                center: '#dc2626',
                event: '#2563eb',
            };
            Map = react_1.memo(function Map({ points = [], onPointPress, onPointHover, onPointClick, initialRegion, showUserLocation = true, userCenterID, bottomPadding = 0, showControls = true, }) {
                const mapRef = react_1.useRef(null);
                // Compute initial region synchronously — user's center > SF default
                const computeInitialRegion = () => {
                    if (initialRegion)
                        return initialRegion;
                    const homeCenter = userCenterID
                        ? points.find((p) => p.id === userCenterID && p.type === 'center')
                        : undefined;
                    if (homeCenter && isValidCoord(homeCenter.latitude, homeCenter.longitude)) {
                        return {
                            latitude: homeCenter.latitude,
                            longitude: homeCenter.longitude,
                            latitudeDelta: 0.2,
                            longitudeDelta: 0.2,
                        };
                    }
                    return DEFAULT_REGION;
                };
                const [region] = react_1.useState(computeInitialRegion);
                const currentRegionRef = react_1.useRef(region);
                const insets = react_native_safe_area_context_1.useSafeAreaInsets();
                const { isDark } = contexts_1.useTheme();
                const buttonBg = isDark ? '#171717' : '#ffffff';
                const iconColor = isDark ? '#fafafa' : '#1a1a1a';
                // Track whether we've already moved away from the SF default. Once true,
                // neither the GPS nor the home-center effect fires again.
                const animatedOnceRef = react_1.useRef(false);
                // Async: try to get device location and fly to it
                react_1.useEffect(() => {
                    let mounted = true;
                    utils_1.getCurrentPosition()
                        .then((position) => {
                        if (!mounted || !position || !Array.isArray(position) || position.length !== 2)
                            return;
                        const [longitude, latitude] = position;
                        if (!isValidCoord(latitude, longitude))
                            return;
                        animatedOnceRef.current = true;
                        mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.1, longitudeDelta: 0.1 }, 500);
                    })
                        .catch(() => { });
                    return () => {
                        mounted = false;
                    };
                }, []);
                // Fallback when GPS hasn't fired (denied, slow, or logged-out). Priorities:
                //   1. user's home center if it's in `points`
                //   2. otherwise fit a bounding box around all valid points
                // Solves "always starts in SF" — the previous SF default only applied when
                // both GPS and home-center lookups failed at mount.
                react_1.useEffect(() => {
                    if (animatedOnceRef.current)
                        return;
                    if (points.length === 0)
                        return;
                    // Home center first (logged-in users with a center set)
                    if (userCenterID) {
                        const homeCenter = points.find((p) => p.id === userCenterID && p.type === 'center');
                        if (homeCenter && isValidCoord(homeCenter.latitude, homeCenter.longitude)) {
                            animatedOnceRef.current = true;
                            mapRef.current?.animateToRegion({
                                latitude: homeCenter.latitude,
                                longitude: homeCenter.longitude,
                                latitudeDelta: 0.2,
                                longitudeDelta: 0.2,
                            }, 500);
                        }
                        // If user has a center but it's not in points yet, wait for the next
                        // points update rather than jumping to fit-all.
                        return;
                    }
                    // Logged-out / no home center: frame all valid points
                    const valid = points.filter((p) => isValidCoord(p.latitude, p.longitude));
                    if (valid.length === 0)
                        return;
                    const lats = valid.map((p) => p.latitude);
                    const lngs = valid.map((p) => p.longitude);
                    const minLat = Math.min(...lats);
                    const maxLat = Math.max(...lats);
                    const minLng = Math.min(...lngs);
                    const maxLng = Math.max(...lngs);
                    const latDelta = Math.max(0.5, (maxLat - minLat) * 1.2);
                    const lngDelta = Math.max(0.5, (maxLng - minLng) * 1.2);
                    animatedOnceRef.current = true;
                    mapRef.current?.animateToRegion({
                        latitude: (minLat + maxLat) / 2,
                        longitude: (minLng + maxLng) / 2,
                        latitudeDelta: latDelta,
                        longitudeDelta: lngDelta,
                    }, 500);
                }, [userCenterID, points]);
                const handleMarkerPress = react_1.useCallback((point) => {
                    if (onPointPress) {
                        onPointPress(point);
                    }
                }, [onPointPress]);
                const getPinColor = react_1.useCallback((type) => {
                    return PIN_COLORS[type] || PIN_COLORS.event;
                }, []);
                // Zoom by adjusting region delta. Camera.zoom is Google-Maps-only;
                // on iOS Apple Maps the camera object doesn't expose zoom, which is
                // why a getCamera/setZoom path was a no-op on iOS.
                // factor < 1 → zoom in (smaller delta); factor > 1 → zoom out.
                const handleZoom = react_1.useCallback((factor) => {
                    const r = currentRegionRef.current;
                    if (!r)
                        return;
                    mapRef.current?.animateToRegion({
                        latitude: r.latitude,
                        longitude: r.longitude,
                        latitudeDelta: Math.max(0.0005, Math.min(180, r.latitudeDelta * factor)),
                        longitudeDelta: Math.max(0.0005, Math.min(180, r.longitudeDelta * factor)),
                    }, 200);
                }, []);
                // Recenter to device location. iOS's `showsMyLocationButton` is
                // Android-only, so we wire our own button to getCurrentPosition.
                const handleLocate = react_1.useCallback(async () => {
                    const position = await utils_1.getCurrentPosition().catch(() => null);
                    if (!position || !Array.isArray(position) || position.length !== 2)
                        return;
                    const [longitude, latitude] = position;
                    if (!isValidCoord(latitude, longitude))
                        return;
                    mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 500);
                }, []);
                return (_jsxs(react_native_1.View, { style: styles.container, children: [_jsx(react_native_maps_1.default, { ref: mapRef, style: styles.map, provider: react_native_1.Platform.OS === 'android' ? react_native_maps_1.PROVIDER_GOOGLE : undefined, initialRegion: region, onRegionChangeComplete: (r) => {
                                currentRegionRef.current = r;
                            }, showsUserLocation: showUserLocation, showsMyLocationButton: showControls, showsCompass: showControls, showsScale: showControls, scrollEnabled: true, zoomEnabled: true, pitchEnabled: true, rotateEnabled: true, loadingEnabled: true, loadingIndicatorColor: "#dc2626", loadingBackgroundColor: "#ffffff", moveOnMarkerPress: false, toolbarEnabled: false, minZoomLevel: 2, maxZoomLevel: 20, mapPadding: { top: 0, right: 0, bottom: bottomPadding, left: 0 }, children: points
                                .filter((p) => isValidCoord(p.latitude, p.longitude))
                                .map((point) => (_jsx(react_native_maps_1.Marker, { coordinate: { latitude: point.latitude, longitude: point.longitude }, title: point.name, description: point.description || point.type, pinColor: getPinColor(point.type), onPress: () => handleMarkerPress(point), identifier: point.id, 
                                // iOS performance: without this, every marker re-renders its
                                // view on each map gesture, which is what causes the "frozen
                                // map" symptom on iOS with 100+ markers.
                                tracksViewChanges: false }, point.id))) }), showControls && (_jsx(MapControls, { top: insets.top + 64, buttonBg: buttonBg, iconColor: iconColor, isDark: isDark, onZoomIn: () => handleZoom(0.5), onZoomOut: () => handleZoom(2), onLocate: handleLocate }))] }));
            });
            exports_1("default", Map);
            styles = react_native_1.StyleSheet.create({
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
            });
        }
    };
});
