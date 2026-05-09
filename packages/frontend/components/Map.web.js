System.register(["react/jsx-runtime", "react", "react-map-gl/maplibre", "maplibre-gl/dist/maplibre-gl.css", "./contexts", "../utils/locationServices"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, maplibre_1, contexts_1, locationServices_1, DEFAULT_CENTER, DEFAULT_ZOOM, isValidCoordinate, CustomControls, MapComponent;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (maplibre_1_1) {
                maplibre_1 = maplibre_1_1;
            },
            function (_1) {
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (locationServices_1_1) {
                locationServices_1 = locationServices_1_1;
            }
        ],
        execute: function () {
            // Default center - San Francisco Bay Area
            DEFAULT_CENTER = { latitude: 37.7749, longitude: -122.4194 };
            DEFAULT_ZOOM = 10;
            /**
             * Validate coordinate values
             */
            isValidCoordinate = (lat, lng) => {
                return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
            };
            CustomControls = react_1.memo(({ mapRef, isDark }) => {
                const handleZoomIn = react_1.useCallback(() => {
                    mapRef.current?.zoomIn();
                }, [mapRef]);
                const handleZoomOut = react_1.useCallback(() => {
                    mapRef.current?.zoomOut();
                }, [mapRef]);
                const handleLocate = react_1.useCallback(() => {
                    if (!navigator.geolocation) {
                        alert('Geolocation is not supported by your browser');
                        return;
                    }
                    navigator.geolocation.getCurrentPosition((position) => {
                        mapRef.current?.flyTo({
                            center: [position.coords.longitude, position.coords.latitude],
                            zoom: 16,
                            duration: 2000,
                        });
                    }, (error) => {
                        if (error.code === 1) {
                            alert('Location access denied. Please enable location permissions.');
                        }
                    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
                }, [mapRef]);
                return (_jsxs(_Fragment, { children: [_jsx("div", { className: "absolute top-2.5 md:top-auto md:bottom-[52px] right-2.5 z-[1000] pointer-events-auto", children: _jsxs("div", { className: "flex flex-col rounded-lg overflow-hidden shadow-[0_2px_6px_rgba(0,0,0,0.2)]", children: [_jsx("button", { className: `w-9 h-9 border-none cursor-pointer flex items-center justify-center transition-all duration-150 outline-none
              ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'}
              active:bg-orange-500/15`, onClick: handleZoomIn, title: "Zoom in", "aria-label": "Zoom in", children: _jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("line", { x1: "12", y1: "5", x2: "12", y2: "19" }), _jsx("line", { x1: "5", y1: "12", x2: "19", y2: "12" })] }) }), _jsx("div", { className: `h-px ${isDark ? 'bg-white/10' : 'bg-black/[0.08]'}` }), _jsx("button", { className: `w-9 h-9 border-none cursor-pointer flex items-center justify-center transition-all duration-150 outline-none
              ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'}
              active:bg-orange-500/15`, onClick: handleZoomOut, title: "Zoom out", "aria-label": "Zoom out", children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("line", { x1: "5", y1: "12", x2: "19", y2: "12" }) }) })] }) }), _jsx("div", { className: "absolute top-[92px] md:top-auto md:bottom-2.5 right-2.5 z-[1000] pointer-events-auto", children: _jsx("button", { className: `w-9 h-9 border-none rounded-lg cursor-pointer flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-all duration-150 outline-none
            ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-700'}
            active:bg-orange-500/15`, onClick: handleLocate, title: "Show my location", "aria-label": "Show my location", children: _jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("polygon", { points: "3 11 22 2 13 21 11 13 3 11" }) }) }) })] }));
            });
            CustomControls.displayName = 'CustomControls';
            /**
             * Map Component for Web using react-map-gl with OpenStreetMap
             */
            MapComponent = react_1.memo(({ points = [], onPointPress, onPointHover, onPointClick, onMapMove, initialCenter, initialZoom = DEFAULT_ZOOM, showUserLocation = false, userCenterID, flyTo, autoOpenPoint, showControls = true, }) => {
                const { isDark } = contexts_1.useTheme();
                const mapRef = react_1.useRef(null);
                const pointsRef = react_1.useRef(points);
                pointsRef.current = points;
                // Disable cooperative gestures on mobile so pinch-to-zoom works
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                const defaultCenter = initialCenter
                    ? { longitude: initialCenter[1], latitude: initialCenter[0] }
                    : { longitude: DEFAULT_CENTER.longitude, latitude: DEFAULT_CENTER.latitude };
                const [viewState, setViewState] = react_1.useState({
                    ...defaultCenter,
                    zoom: initialZoom,
                });
                // Once we've moved away from the default, lock further auto-moves so the
                // home-center / fit-all effect below doesn't overwrite a granted GPS fix.
                const animatedToTargetRef = react_1.useRef(false);
                react_1.useEffect(() => {
                    const storedLocation = localStorage.getItem('userLocation');
                    if (storedLocation) {
                        try {
                            const { latitude, longitude } = JSON.parse(storedLocation);
                            // Reject stale default (Saandeepany, India) that was cached before the fix
                            const isOldDefault = Math.abs(latitude - 32.1765) < 0.01 && Math.abs(longitude - 76.3595) < 0.01;
                            if (latitude && longitude && !isOldDefault) {
                                setViewState({ latitude, longitude, zoom: initialZoom });
                                animatedToTargetRef.current = true;
                                return;
                            }
                            if (isOldDefault)
                                localStorage.removeItem('userLocation');
                        }
                        catch { }
                    }
                    const fallbackToCenter = () => {
                        const homeCenter = userCenterID
                            ? pointsRef.current.find((p) => p.id === userCenterID && p.type === 'center')
                            : undefined;
                        if (homeCenter && isValidCoordinate(homeCenter.latitude, homeCenter.longitude)) {
                            setViewState({
                                latitude: homeCenter.latitude,
                                longitude: homeCenter.longitude,
                                zoom: initialZoom,
                            });
                            animatedToTargetRef.current = true;
                        }
                        // Otherwise let the points-loaded effect below handle fit-all / retry.
                    };
                    locationServices_1.getCurrentPosition().then((coords) => {
                        if (coords && coords.length === 2) {
                            const [longitude, latitude] = coords;
                            if (isValidCoordinate(latitude, longitude)) {
                                setViewState({ latitude, longitude, zoom: initialZoom });
                                localStorage.setItem('userLocation', JSON.stringify({ latitude, longitude }));
                                animatedToTargetRef.current = true;
                                return;
                            }
                        }
                        // Location unavailable or denied — fall back to user's home center.
                        fallbackToCenter();
                    });
                }, [initialZoom, userCenterID]);
                // Fallback when GPS hasn't fired and points eventually load: fly to user's
                // home center if known, otherwise frame all valid points. Solves the
                // "always starts in SF" feedback for logged-out users and for logged-in
                // users whose home center wasn't in `points` at mount time.
                react_1.useEffect(() => {
                    if (animatedToTargetRef.current)
                        return;
                    if (points.length === 0)
                        return;
                    if (userCenterID) {
                        const homeCenter = points.find((p) => p.id === userCenterID && p.type === 'center');
                        if (homeCenter && isValidCoordinate(homeCenter.latitude, homeCenter.longitude)) {
                            animatedToTargetRef.current = true;
                            mapRef.current?.flyTo({
                                center: [homeCenter.longitude, homeCenter.latitude],
                                zoom: initialZoom,
                                duration: 1200,
                            });
                        }
                        // If userCenterID is set but the center isn't in points yet, wait for
                        // the next points update — don't fall through to fit-all and risk
                        // overriding their home center later.
                        return;
                    }
                    // Logged-out / no home center — frame all valid points
                    const valid = points.filter((p) => isValidCoordinate(p.latitude, p.longitude));
                    if (valid.length === 0)
                        return;
                    const lats = valid.map((p) => p.latitude);
                    const lngs = valid.map((p) => p.longitude);
                    animatedToTargetRef.current = true;
                    mapRef.current?.fitBounds([
                        [Math.min(...lngs), Math.min(...lats)],
                        [Math.max(...lngs), Math.max(...lats)],
                    ], { padding: 60, duration: 1200 });
                }, [userCenterID, points, initialZoom]);
                react_1.useEffect(() => {
                    if (!flyTo)
                        return;
                    const { latitude, longitude } = flyTo;
                    if (!isValidCoordinate(latitude, longitude))
                        return;
                    mapRef.current?.flyTo({
                        center: [longitude, latitude],
                        zoom: 15,
                        duration: 1200,
                    });
                }, [flyTo?.key, flyTo?.latitude, flyTo?.longitude]);
                // After fly-to settles, programmatically open the popover for the
                // requested point. Solves the "click event A in list, see event B's
                // popup" overlap bug — the popup is keyed on the specific MapPoint id,
                // not whichever marker happens to be on top.
                react_1.useEffect(() => {
                    if (!autoOpenPoint)
                        return;
                    const map = mapRef.current;
                    if (!map)
                        return;
                    const point = pointsRef.current.find((p) => p.id === autoOpenPoint.id && p.type === autoOpenPoint.type);
                    if (!point)
                        return;
                    const fire = () => {
                        const m = mapRef.current;
                        if (!m || !onPointClick)
                            return;
                        const projected = m.project([point.longitude, point.latitude]);
                        const canvas = m.getCanvas();
                        const rect = canvas.getBoundingClientRect();
                        // Marker pin's tip sits ~8px above the projected coordinate.
                        const x = rect.left + projected.x;
                        const y = rect.top + projected.y - 8;
                        onPointClick(point, x, y);
                    };
                    // Wait for the fly-to animation to finish so the projected coords
                    // reflect the final viewport. moveend fires once when animation ends.
                    let cancelled = false;
                    const onMoveEnd = () => {
                        if (cancelled)
                            return;
                        cancelled = true;
                        map.off('moveend', onMoveEnd);
                        // One frame of breathing room so the marker DOM is in place.
                        requestAnimationFrame(fire);
                    };
                    map.on('moveend', onMoveEnd);
                    // Safety net: if no flyTo was scheduled (e.g. the point is already on
                    // screen), moveend won't fire — fire after a short delay.
                    const timer = setTimeout(() => {
                        if (cancelled)
                            return;
                        cancelled = true;
                        map.off('moveend', onMoveEnd);
                        fire();
                    }, 1500);
                    return () => {
                        cancelled = true;
                        map.off('moveend', onMoveEnd);
                        clearTimeout(timer);
                    };
                }, [autoOpenPoint?.key, autoOpenPoint?.id, autoOpenPoint?.type, onPointClick]);
                const handleMove = react_1.useCallback((evt) => {
                    setViewState(evt.viewState);
                    onMapMove?.();
                }, [onMapMove]);
                const getMarkerViewportCoords = react_1.useCallback((domEvent) => {
                    if (!domEvent) {
                        return { x: 0, y: 0 };
                    }
                    const target = domEvent.target;
                    const markerEl = target?.closest('.maplibregl-marker');
                    if (markerEl) {
                        const mRect = markerEl.getBoundingClientRect();
                        return {
                            x: mRect.left + mRect.width / 2,
                            y: mRect.top,
                        };
                    }
                    return { x: domEvent.clientX, y: domEvent.clientY };
                }, []);
                const handleMarkerClick = react_1.useCallback((point) => (e) => {
                    e.originalEvent?.stopPropagation();
                    if (onPointClick) {
                        const { x, y } = getMarkerViewportCoords(e.originalEvent);
                        onPointClick(point, x, y);
                    }
                    else {
                        onPointPress?.(point);
                    }
                }, [onPointPress, onPointClick, getMarkerViewportCoords]);
                const handleMarkerMouseEnter = react_1.useCallback((point) => (e) => {
                    const { x, y } = getMarkerViewportCoords(e.originalEvent);
                    onPointHover?.(point, x, y);
                }, [onPointHover, getMarkerViewportCoords]);
                const handleMarkerMouseLeave = react_1.useCallback(() => {
                    onPointHover?.(null);
                }, [onPointHover]);
                const validPoints = react_1.useMemo(() => points.filter((point) => isValidCoordinate(point.latitude, point.longitude)), [points]);
                const mapStyle = react_1.useMemo(() => isDark
                    ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
                    : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', [isDark]);
                const markers = react_1.useMemo(() => validPoints.map((point) => (_jsx(maplibre_1.Marker, { longitude: point.longitude, latitude: point.latitude, anchor: "bottom", onClick: handleMarkerClick(point), children: _jsx("div", { className: `w-[30px] h-[30px] rounded-[50%_50%_50%_0] -rotate-45 border-2 border-white shadow-[0_2px_4px_rgba(0,0,0,0.3)] cursor-pointer
                ${point.type === 'center' ? 'bg-red-500' : 'bg-blue-500'}`, title: point.name, onMouseEnter: handleMarkerMouseEnter(point), onMouseLeave: handleMarkerMouseLeave }) }, point.id))), [validPoints, handleMarkerClick, handleMarkerMouseEnter, handleMarkerMouseLeave]);
                return (_jsxs("div", { className: "w-full h-full relative", children: [_jsxs(maplibre_1.default, { ref: mapRef, ...viewState, onMove: handleMove, mapStyle: mapStyle, style: { width: '100%', height: '100%' }, reuseMaps: true, attributionControl: false, cooperativeGestures: !isMobile, children: [markers, _jsx(maplibre_1.AttributionControl, { compact: true, position: "bottom-left", style: {
                                        marginBottom: '10px',
                                        marginLeft: '10px',
                                    } })] }), showControls && _jsx(CustomControls, { mapRef: mapRef, isDark: isDark })] }));
            });
            MapComponent.displayName = 'Map';
            exports_1("default", MapComponent);
        }
    };
});
