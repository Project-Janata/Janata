System.register(["react/jsx-runtime", "react", "../../components/ui/EmptyState", "../../components/ui/Skeleton", "react-native", "lucide-react-native", "expo-router", "posthog-react-native", "../../components/contexts", "../../components/ui", "../../components/ui/FilterPickerModal", "../../components/contexts/UserContext", "../../hooks/useApiData", "../../utils/addressParsing"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, EmptyState_1, Skeleton_1, react_native_1, lucide_react_native_1, expo_router_1, posthog_react_native_1, contexts_1, ui_1, FilterPickerModal_1, UserContext_1, useApiData_1, addressParsing_1, Map, FILTERS, AVATAR_COLORS, styles;
    var __moduleName = context_1 && context_1.id;
    /**
     * Format a date string into a short display like "FEB 26"
     */
    function formatDatePill(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime()))
            return { month: '', day: '' };
        const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const day = String(d.getDate());
        return { month, day };
    }
    function isToday(dateStr) {
        const today = new Date();
        return dateStr === today.toISOString().split('T')[0];
    }
    function AttendeeAvatars({ count, attendees }) {
        if (count <= 0)
            return null;
        const shown = Math.min(count, 4);
        return (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }, children: [_jsx(react_native_1.View, { style: { flexDirection: 'row' }, children: attendees && attendees.length > 0 ? (attendees.slice(0, shown).map((attendee, i) => (_jsx(ui_1.Avatar, { image: attendee.image, initials: attendee.initials, name: attendee.name, size: 18, style: {
                            marginLeft: i === 0 ? 0 : -6,
                            borderWidth: 1.5,
                            borderColor: 'white',
                        } }, i)))) : (Array.from({ length: shown }).map((_, i) => (_jsx(react_native_1.View, { style: {
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                            marginLeft: i === 0 ? 0 : -6,
                            borderWidth: 1.5,
                            borderColor: 'white',
                        } }, i)))) }), _jsxs(react_native_1.Text, { className: "text-stone-400 dark:text-stone-500 font-sans text-xs", children: [count, " going"] })] }));
    }
    // ─── Event Item ─────────────────────────────────────────
    function EventItem({ event, onPress, centerName, }) {
        const { month, day } = event.date ? formatDatePill(event.date) : { month: '', day: '' };
        const todayLabel = event.date ? isToday(event.date) : false;
        return (_jsxs(react_native_1.Pressable, { onPress: onPress, className: `flex-row gap-3 p-3 rounded-2xl active:opacity-70 ${event.isRegistered
                ? 'bg-orange-50 dark:bg-orange-950/20'
                : 'bg-white dark:bg-neutral-900'}`, children: [_jsxs(react_native_1.View, { className: "w-12 h-14 rounded-xl items-center justify-center bg-stone-100 dark:bg-neutral-800", children: [_jsx(react_native_1.Text, { className: "text-[10px] font-sans", style: { color: '#E8862A' }, children: month }), _jsx(react_native_1.Text, { className: "text-base font-sans text-content dark:text-content-dark", children: day })] }), _jsxs(react_native_1.View, { className: "flex-1 gap-0.5", children: [_jsxs(react_native_1.View, { className: "flex-row items-center gap-1.5", children: [_jsx(react_native_1.Text, { className: "text-content dark:text-content-dark font-sans text-base leading-tight flex-1", numberOfLines: 2, children: event.title }), event.isRegistered && _jsx(ui_1.Badge, { label: "Going", variant: "going" })] }), _jsxs(react_native_1.Text, { className: "text-stone-500 dark:text-stone-400 font-sans text-sm", children: [todayLabel ? 'Today · ' : '', event.time || ''] }), centerName && (_jsxs(react_native_1.Text, { className: "text-stone-500 dark:text-stone-400 font-sans text-xs", numberOfLines: 1, children: ["By ", centerName] })), _jsxs(react_native_1.View, { className: "flex-row items-center gap-1 mt-0.5", children: [_jsx(lucide_react_native_1.MapPin, { size: 12, color: "#E8862A" }), _jsx(react_native_1.Text, { className: "text-stone-500 dark:text-stone-400 font-sans text-xs flex-1", numberOfLines: 1, children: event.location })] }), event.attendees > 0 && _jsx(AttendeeAvatars, { count: event.attendees, attendees: event.attendeesList })] }), event.image && (_jsx(react_native_1.Image, { source: { uri: event.image }, style: { width: 72, height: 72, borderRadius: 10 }, resizeMode: "cover" }))] }));
    }
    // ─── Center Item ────────────────────────────────────────
    function CenterItem({ center, onPress, isMyCenter }) {
        return (_jsxs(react_native_1.Pressable, { onPress: onPress, className: `flex-row gap-3 p-3 rounded-2xl active:opacity-70 ${center.isMember || isMyCenter
                ? 'bg-orange-50 dark:bg-orange-950/20'
                : 'bg-white dark:bg-neutral-900'}`, children: [_jsx(react_native_1.View, { className: "w-12 h-14 rounded-xl bg-orange-100 dark:bg-orange-900/30 items-center justify-center overflow-hidden", children: center.image ? (_jsx(react_native_1.Image, { source: { uri: center.image }, style: { width: 48, height: 56 }, resizeMode: "cover" })) : (_jsx(lucide_react_native_1.Building2, { size: 20, color: "#9A3412" })) }), _jsxs(react_native_1.View, { className: "flex-1 gap-0.5", children: [_jsxs(react_native_1.View, { className: "flex-row items-center gap-1.5", children: [_jsx(react_native_1.Text, { className: "text-content dark:text-content-dark font-sans text-base leading-tight flex-1", numberOfLines: 1, children: center.name }), isMyCenter && _jsx(ui_1.Badge, { label: "My Center", variant: "going" }), !isMyCenter && center.isMember && _jsx(ui_1.Badge, { label: "Member", variant: "member" })] }), _jsxs(react_native_1.Text, { className: "text-stone-500 dark:text-stone-400 font-sans text-sm", children: [addressParsing_1.extractCityState(center.address) || 'Center', center.distanceMi != null ? ` · ${center.distanceMi} mi` : ''] }), center.eventCount != null && center.eventCount > 0 && (_jsxs(react_native_1.Text, { className: "text-primary font-sans text-xs mt-0.5", children: [center.eventCount, " events this week"] }))] })] }));
    }
    // ─── Discover Screen ────────────────────────────────────
    function DiscoverScreen() {
        const router = expo_router_1.useRouter();
        const { isDark } = contexts_1.useTheme();
        const posthog = posthog_react_native_1.usePostHog();
        const [activeFilter, setActiveFilter] = react_1.useState('Events');
        const [searchQuery, setSearchQuery] = react_1.useState('');
        const [selectedDate, setSelectedDate] = react_1.useState(null);
        const [showGoingOnly, setShowGoingOnly] = react_1.useState(false);
        const [showPastEvents, setShowPastEvents] = react_1.useState(false);
        const [selectedCenter, setSelectedCenter] = react_1.useState(null);
        const [showCenterModal, setShowCenterModal] = react_1.useState(false);
        const { user } = UserContext_1.useUser();
        const { items, filteredPoints, loading, allEvents, allCenters, refresh, } = useApiData_1.useDiscoverData(activeFilter, searchQuery, user?.id, showPastEvents, showGoingOnly, user?.interests ?? undefined, user?.centerID);
        expo_router_1.useFocusEffect(react_1.useCallback(() => {
            refresh();
        }, [refresh]));
        // ── Sheet snap points ──────────────────────────────────
        // Four positions (as translateY values from the expanded state):
        //   expanded  = 0           → 100% sheet visible (full screen, header hidden)
        //   mid       = sheet * 0.2 → ~80% sheet visible (most content, map peeking)
        //   collapsed = sheet * 0.6 → ~40% sheet visible (peek + a few rows)
        //   peek      = sheet - 100 → just handle + search bar visible (100px)
        const EXPANDED_TOP = 60; // px from top of container when fully expanded
        const [containerHeight, setContainerHeight] = react_1.useState(0);
        const sheetHeight = containerHeight - EXPANDED_TOP; // total sheet height
        const SNAP_EXPANDED = 0;
        const SNAP_MID = Math.max(0, sheetHeight * 0.2); // ~80% sheet visible
        const SNAP_COLLAPSED = Math.max(0, sheetHeight * 0.6); // ~40% sheet visible
        const SNAP_PEEK = Math.max(0, sheetHeight - 100); // 100px sheet visible (handle + search)
        const snapsRef = react_1.useRef({ expanded: SNAP_EXPANDED, mid: SNAP_MID, collapsed: SNAP_COLLAPSED, peek: SNAP_PEEK });
        snapsRef.current = { expanded: SNAP_EXPANDED, mid: SNAP_MID, collapsed: SNAP_COLLAPSED, peek: SNAP_PEEK };
        const sheetY = react_1.useRef(new react_native_1.Animated.Value(0)).current;
        const offsetRef = react_1.useRef(0);
        const initializedRef = react_1.useRef(false);
        // Track expansion state for scroll behavior
        const [isSheetExpanded, setIsSheetExpanded] = react_1.useState(false);
        // Hide the nav header (with the profile-pic button) when the sheet is at
        // expanded snap so the sheet covers the full screen, including over where
        // the profile button sits. Restore when sheet leaves expanded.
        const navigation = expo_router_1.useNavigation();
        react_1.default.useEffect(() => {
            navigation.setOptions({ headerShown: !isSheetExpanded });
        }, [navigation, isSheetExpanded]);
        // Set initial sheet position to mid once we know the container height
        react_1.default.useEffect(() => {
            if (containerHeight > 0 && !initializedRef.current) {
                const mid = Math.max(0, (containerHeight - EXPANDED_TOP) * 0.2);
                sheetY.setValue(mid);
                offsetRef.current = mid;
                initializedRef.current = true;
            }
        }, [containerHeight, sheetY]);
        const panResponder = react_1.useRef(react_native_1.PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 8,
            onPanResponderGrant: () => { },
            onPanResponderMove: (_, gs) => {
                const max = snapsRef.current.peek;
                const next = Math.max(0, Math.min(max, offsetRef.current + gs.dy));
                sheetY.setValue(next);
            },
            onPanResponderRelease: (_, gs) => {
                const { expanded, mid, collapsed, peek } = snapsRef.current;
                const current = Math.max(0, Math.min(peek, offsetRef.current + gs.dy));
                // Find nearest snap, biased by velocity
                let snapTo;
                if (gs.vy > 1) {
                    // Fast swipe down — jump one stop down from current
                    if (offsetRef.current <= expanded + 10)
                        snapTo = mid;
                    else if (offsetRef.current <= mid + 10)
                        snapTo = collapsed;
                    else
                        snapTo = peek;
                }
                else if (gs.vy < -1) {
                    // Fast swipe up — jump one stop up from current
                    if (offsetRef.current >= peek - 10)
                        snapTo = collapsed;
                    else if (offsetRef.current >= collapsed - 10)
                        snapTo = mid;
                    else
                        snapTo = expanded;
                }
                else {
                    // Position-based: snap to nearest of 4
                    const dExp = Math.abs(current - expanded);
                    const dMid = Math.abs(current - mid);
                    const dCol = Math.abs(current - collapsed);
                    const dPeek = Math.abs(current - peek);
                    const minD = Math.min(dExp, dMid, dCol, dPeek);
                    snapTo =
                        minD === dExp ? expanded : minD === dMid ? mid : minD === dCol ? collapsed : peek;
                }
                offsetRef.current = snapTo;
                setIsSheetExpanded(snapTo === expanded);
                react_native_1.Animated.spring(sheetY, {
                    toValue: snapTo,
                    useNativeDriver: false,
                    damping: 28,
                    stiffness: 220,
                    mass: 0.8,
                }).start();
            },
        })).current;
        // ── Data ──────────────────────────────────────────────
        const displayItems = react_1.default.useMemo(() => {
            let result = items;
            if (selectedDate) {
                result = result.filter((item) => item.type === 'event' && item.data.date === selectedDate);
            }
            if (selectedCenter) {
                result = result.filter((item) => {
                    if (item.type !== 'event')
                        return true;
                    return item.data.centerId === selectedCenter;
                });
            }
            return result;
        }, [items, selectedDate, selectedCenter]);
        // Filter chip helpers — counts over upcoming events
        const todayStr = new Date().toISOString().split('T')[0];
        const eventsForCounts = react_1.useMemo(() => (showPastEvents ? allEvents : allEvents.filter((e) => !e.date || e.date >= todayStr)), [allEvents, showPastEvents, todayStr]);
        const centerOptions = react_1.useMemo(() => {
            const counts = {};
            for (const e of eventsForCounts) {
                if (e.centerId)
                    counts[e.centerId] = (counts[e.centerId] ?? 0) + 1;
            }
            return [...allCenters]
                .map((c) => ({ value: c.id, label: c.name, sublabel: c.address, count: counts[c.id] ?? 0 }))
                .filter((o) => (o.count ?? 0) > 0)
                .sort((a, b) => {
                if (user?.centerID && a.value === user.centerID)
                    return -1;
                if (user?.centerID && b.value === user.centerID)
                    return 1;
                return a.label.localeCompare(b.label);
            });
        }, [allCenters, eventsForCounts, user?.centerID]);
        const centerChipLabel = selectedCenter
            ? centerOptions.find((o) => o.value === selectedCenter)?.label ?? 'Center'
            : 'Center';
        const [collapsedSections, setCollapsedSections] = react_1.useState(new Set());
        const toggleSection = react_1.useCallback((label) => {
            setCollapsedSections((prev) => {
                const next = new Set(prev);
                if (next.has(label))
                    next.delete(label);
                else
                    next.add(label);
                return next;
            });
        }, []);
        // Default Centers list to fully collapsed on first visit (90+ centers,
        // an all-expanded view is overwhelming).
        const collapsedInitFor = react_1.useRef(null);
        react_1.default.useEffect(() => {
            if (activeFilter !== 'Centers') {
                collapsedInitFor.current = null;
                return;
            }
            if (collapsedInitFor.current === 'Centers')
                return;
            if (items.length === 0)
                return;
            const labels = new Set();
            let isFirst = true;
            for (const item of items) {
                if (item.type === 'section') {
                    if (!isFirst)
                        labels.add(item.data.label);
                    isFirst = false;
                }
            }
            setCollapsedSections(labels);
            collapsedInitFor.current = 'Centers';
        }, [activeFilter, items]);
        const stickyHeaderIndices = react_1.useMemo(() => displayItems.reduce((acc, item, idx) => {
            if (item.type === 'section')
                acc.push(idx);
            return acc;
        }, []), [displayItems]);
        const handleFilterPress = (f) => {
            posthog?.capture('discover_filter_changed', { filter: f });
            setActiveFilter(f);
            setSelectedDate(null);
        };
        const handlePointPress = (point) => {
            posthog?.capture('map_point_pressed', { type: point.type, id: point.id });
            if (point.type === 'center') {
                router.push(`/center/${point.id}`);
            }
            else {
                router.push(`/events/${point.id}`);
            }
        };
        return (_jsxs(react_native_1.View, { style: styles.container, onLayout: (e) => setContainerHeight(e.nativeEvent.layout.height), children: [_jsx(react_native_1.View, { style: react_native_1.StyleSheet.absoluteFill, children: _jsx(react_1.Suspense, { fallback: _jsx(react_native_1.View, { className: "flex-1 justify-center items-center bg-stone-100 dark:bg-neutral-800", children: _jsx(react_native_1.ActivityIndicator, { size: "large", color: "#9A3412" }) }), children: _jsx(Map, { points: filteredPoints, onPointPress: handlePointPress, userCenterID: user?.centerID, bottomPadding: 90 }) }) }), containerHeight > 0 && (_jsx(react_native_1.Animated.View, { style: [
                        styles.sheet,
                        { top: EXPANDED_TOP, transform: [{ translateY: sheetY }] },
                    ], children: _jsxs(react_native_1.View, { style: [
                            styles.sheetInner,
                            {
                                backgroundColor: isDark ? '#171717' : '#fff',
                                borderTopColor: isDark ? '#262626' : '#E5E7EB',
                            },
                        ], children: [_jsxs(react_native_1.View, { ...panResponder.panHandlers, children: [_jsx(react_native_1.View, { style: styles.handleRow, children: _jsx(react_native_1.View, { style: [
                                                styles.handle,
                                                { backgroundColor: isDark ? '#525252' : '#D1D5DB' },
                                            ] }) }), _jsxs(react_native_1.View, { className: "flex-row items-center mx-4 mb-3 px-3 rounded-xl", style: {
                                            minHeight: 44,
                                            backgroundColor: isDark ? '#262626' : '#F3F4F6',
                                        }, children: [_jsx(lucide_react_native_1.Search, { size: 16, color: "#9CA3AF" }), _jsx(react_native_1.TextInput, { className: "flex-1 ml-2 text-sm font-sans", style: { color: isDark ? '#E5E7EB' : '#1F2937', paddingVertical: 8 }, placeholder: "Search events and centers...", placeholderTextColor: "#9CA3AF", value: searchQuery, onChangeText: setSearchQuery, onEndEditing: () => {
                                                    if (searchQuery.trim()) {
                                                        posthog?.capture('discover_search', { query: searchQuery.trim() });
                                                    }
                                                } })] }), _jsx(react_native_1.View, { style: { marginBottom: 4 }, children: _jsx(ui_1.UnderlineTabBar, { tabs: FILTERS.map((f) => f.label), activeTab: selectedDate ? '' : activeFilter, onTabChange: (tab) => handleFilterPress(tab), counts: { Events: allEvents.length, Centers: allCenters.length } }) }), activeFilter === 'Events' && (_jsxs(react_native_1.View, { className: "flex-row flex-wrap items-center px-4 py-2 gap-2", children: [_jsx(ui_1.FilterChip, { label: "Today", variant: "outline", active: selectedDate === todayStr, onPress: () => {
                                                    setSelectedDate((prev) => {
                                                        const next = prev === todayStr ? null : todayStr;
                                                        if (next)
                                                            posthog?.capture('discover_date_selected', { date: next });
                                                        return next;
                                                    });
                                                } }), _jsx(ui_1.FilterChip, { label: centerChipLabel, variant: "outline", active: selectedCenter !== null, onPress: () => setShowCenterModal(true) }), user && (_jsx(ui_1.FilterChip, { label: "Going", variant: "outline", active: showGoingOnly, onPress: () => setShowGoingOnly((prev) => !prev) }))] }))] }), loading && (_jsx(react_native_1.View, { style: { paddingHorizontal: 16 }, children: _jsx(Skeleton_1.DiscoverListSkeleton, { count: 4 }) })), _jsxs(react_native_1.ScrollView, { style: { flex: 1 }, contentContainerStyle: { paddingHorizontal: 4, paddingTop: 12, paddingBottom: 40, gap: 4 }, showsVerticalScrollIndicator: false, scrollEnabled: true, stickyHeaderIndices: stickyHeaderIndices, children: [!loading && activeFilter === 'Seva' && (_jsx(EmptyState_1.EmptyState, { message: "Seva \u2014 coming soon", subtitle: "Service opportunities will be listed here." })), !loading && activeFilter !== 'Seva' && displayItems.length === 0 && (_jsx(EmptyState_1.EmptyState, { variant: selectedDate ? 'date' : searchQuery ? 'search' : 'events' })), activeFilter !== 'Seva' && displayItems.map((item, idx) => {
                                        if (item.type === 'section') {
                                            const label = item.data.label;
                                            const isCollapsed = collapsedSections.has(label);
                                            return (_jsx(react_native_1.Pressable, { onPress: () => toggleSection(label), className: `bg-white dark:bg-neutral-900 ${idx > 0 ? 'border-t border-stone-200 dark:border-neutral-800' : ''}`, children: _jsxs(react_native_1.View, { style: {
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 14,
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                    }, children: [_jsx(react_native_1.Text, { className: "text-xs font-sans text-stone-500 dark:text-stone-400 uppercase", style: { letterSpacing: 0.6 }, children: label }), isCollapsed ? _jsx(lucide_react_native_1.ChevronDown, { size: 16, color: "#a8a29e" }) : _jsx(lucide_react_native_1.ChevronUp, { size: 16, color: "#a8a29e" })] }) }, `section-${idx}`));
                                        }
                                        if (item.type === 'event') {
                                            return (_jsx(EventItem, { event: item.data, centerName: allCenters.find((c) => c.id === item.data.centerId)?.name, onPress: () => {
                                                    posthog?.capture('event_list_item_pressed', { eventId: item.data.id, source: 'discover' });
                                                    router.push(`/events/${item.data.id}`);
                                                } }, `event-${item.data.id}`));
                                        }
                                        const sectionLabel = displayItems.slice(0, idx).reverse().find((i) => i.type === 'section')?.data?.label;
                                        if (sectionLabel && collapsedSections.has(sectionLabel))
                                            return null;
                                        return (_jsx(CenterItem, { center: item.data, isMyCenter: !!user?.centerID && item.data.id === user.centerID, onPress: () => {
                                                posthog?.capture('center_list_item_pressed', { centerId: item.data.id, source: 'discover' });
                                                router.push(`/center/${item.data.id}`);
                                            } }, `center-${item.data.id}`));
                                    })] })] }) })), _jsx(FilterPickerModal_1.default, { visible: showCenterModal, title: "Center", options: centerOptions, selected: selectedCenter, onSelect: setSelectedCenter, onClear: () => setSelectedCenter(null), onClose: () => setShowCenterModal(false) })] }));
    }
    exports_1("default", DiscoverScreen);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (EmptyState_1_1) {
                EmptyState_1 = EmptyState_1_1;
            },
            function (Skeleton_1_1) {
                Skeleton_1 = Skeleton_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (posthog_react_native_1_1) {
                posthog_react_native_1 = posthog_react_native_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            },
            function (FilterPickerModal_1_1) {
                FilterPickerModal_1 = FilterPickerModal_1_1;
            },
            function (UserContext_1_1) {
                UserContext_1 = UserContext_1_1;
            },
            function (useApiData_1_1) {
                useApiData_1 = useApiData_1_1;
            },
            function (addressParsing_1_1) {
                addressParsing_1 = addressParsing_1_1;
            }
        ],
        execute: function () {
            // Lazy load Map to avoid loading heavy web dependencies on mobile web
            Map = react_1.default.lazy(() => context_1.import('../../components/Map'));
            FILTERS = [
                { label: 'Events' },
                { label: 'Centers' },
                { label: 'Seva' },
            ];
            // ── Placeholder avatar dots for attendee count ──────────
            AVATAR_COLORS = ['#E8862A', '#78716C', '#A8A29E', '#D6D3D1'];
            styles = react_native_1.StyleSheet.create({
                container: {
                    flex: 1,
                },
                sheet: {
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    // top is set dynamically via style prop
                },
                sheetInner: {
                    flex: 1,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    borderTopWidth: 1,
                    overflow: 'hidden',
                    // Shadow for visibility over the map
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -3 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 16,
                },
                handleRow: {
                    alignItems: 'center',
                    paddingTop: 10,
                    paddingBottom: 8,
                },
                handle: {
                    width: 36,
                    height: 5,
                    borderRadius: 2.5,
                },
            });
        }
    };
});
