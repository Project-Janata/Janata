System.register(["react/jsx-runtime", "../../components/ui/EmptyState", "../../components/ui/Skeleton", "react", "react-native", "lucide-react-native", "expo-router", "../../components/contexts", "../../components/ui", "../../components/ui/FilterPickerModal", "../../components/MapPopover", "../../hooks/useApiData", "../../components/web/EventDetailPanel", "../../components/web/EventFormPanel", "../../components/web/CenterDetailPanel", "../../hooks/useDetailColors", "../../components/ui/AuthPromptModal", "../../utils/api", "../../utils/addressParsing", "../../utils/admin"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, EmptyState_1, Skeleton_1, react_1, react_native_1, lucide_react_native_1, expo_router_1, contexts_1, ui_1, FilterPickerModal_1, Map, MapPopover_1, useApiData_1, EventDetailPanel_1, EventFormPanel_1, CenterDetailPanel_1, useDetailColors_1, AuthPromptModal_1, api_1, addressParsing_1, admin_1, FILTERS, AVATAR_COLORS;
    var __moduleName = context_1 && context_1.id;
    function formatDatePill(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const day = String(d.getDate());
        return { month, day };
    }
    function isToday(dateStr) {
        const today = new Date();
        return dateStr === today.toISOString().split('T')[0];
    }
    function isValidMapCoord(lat, lng) {
        return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }
    /** Resolve lat/lng for the side panel selection so the map can fly there (list, marker, or URL). */
    function findCoordsForSelection(selectedItem, filteredPoints, allEvents, allCenters) {
        const targetType = selectedItem.type === 'center' ? 'center' : 'event';
        const pt = filteredPoints.find((p) => p.id === selectedItem.id && p.type === targetType);
        if (pt && isValidMapCoord(pt.latitude, pt.longitude)) {
            return { latitude: pt.latitude, longitude: pt.longitude };
        }
        if (selectedItem.type === 'event') {
            const e = allEvents.find((x) => x.id === selectedItem.id);
            if (e?.latitude != null &&
                e?.longitude != null &&
                isValidMapCoord(e.latitude, e.longitude)) {
                return { latitude: e.latitude, longitude: e.longitude };
            }
        }
        else {
            const c = allCenters.find((x) => x.id === selectedItem.id);
            if (c && isValidMapCoord(c.latitude, c.longitude)) {
                return { latitude: c.latitude, longitude: c.longitude };
            }
        }
        return null;
    }
    function AttendeeAvatars({ count, attendees }) {
        if (count <= 0)
            return null;
        const shown = Math.min(count, 4);
        return (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 4 }, children: [_jsx(react_native_1.View, { style: { flexDirection: 'row' }, children: attendees && attendees.length > 0
                        ? attendees.slice(0, shown).map((attendee, i) => (_jsx(ui_1.Avatar, { image: attendee.image, initials: attendee.initials, name: attendee.name, size: 18, style: {
                                marginLeft: i === 0 ? 0 : -6,
                                borderWidth: 1.5,
                                borderColor: 'white',
                            } }, i)))
                        : Array.from({ length: shown }).map((_, i) => (_jsx(react_native_1.View, { style: {
                                width: 18,
                                height: 18,
                                borderRadius: 9,
                                backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                                marginLeft: i === 0 ? 0 : -6,
                                borderWidth: 1.5,
                                borderColor: 'white',
                            } }, i))) }), _jsxs(react_native_1.Text, { className: "text-stone-400 dark:text-stone-500 font-sans text-xs", children: [count, " going"] })] }));
    }
    // ─── Event Item (Desktop) ───────────────────────────────
    function EventItem({ event, onPress, centerName, }) {
        const { month, day } = event.date ? formatDatePill(event.date) : { month: '', day: '' };
        return (_jsxs(react_native_1.Pressable, { onPress: onPress, className: `flex-row gap-4 p-4 rounded-2xl active:opacity-80 border border-transparent hover:border-stone-200 dark:hover:border-neutral-700 ${event.isRegistered
                ? 'bg-orange-50/80 dark:bg-orange-950/20'
                : 'bg-white dark:bg-neutral-900'}`, style: { minHeight: 72 }, children: [_jsxs(react_native_1.View, { className: "w-[52px] h-[60px] rounded-xl items-center justify-center bg-stone-100 dark:bg-neutral-800", children: [_jsx(react_native_1.Text, { className: "text-[10px] font-sans", style: { color: '#E8862A' }, children: month }), _jsx(react_native_1.Text, { className: "text-lg font-sans text-content dark:text-content-dark", children: day })] }), _jsxs(react_native_1.View, { className: "flex-1 gap-1", children: [_jsxs(react_native_1.View, { className: "flex-row items-center gap-2", children: [_jsx(react_native_1.Text, { className: "text-content dark:text-content-dark font-sans text-base leading-tight flex-1", numberOfLines: 2, children: event.title }), event.isRegistered && _jsx(ui_1.Badge, { label: "Going", variant: "going" })] }), _jsxs(react_native_1.Text, { className: "text-stone-500 dark:text-stone-400 font-sans text-sm", children: [event.date && isToday(event.date) ? 'Today · ' : '', event.time || ''] }), centerName && (_jsxs(react_native_1.Text, { className: "text-stone-500 dark:text-stone-400 font-sans text-sm", numberOfLines: 1, children: ["By ", centerName] })), _jsxs(react_native_1.View, { className: "flex-row items-center gap-1.5", children: [_jsx(lucide_react_native_1.MapPin, { size: 12, color: "#E8862A" }), _jsx(react_native_1.Text, { className: "text-stone-500 dark:text-stone-400 font-sans text-sm flex-1", numberOfLines: 1, children: event.location })] }), event.attendees > 0 && (_jsx(react_native_1.View, { style: { marginTop: 4 }, children: _jsx(AttendeeAvatars, { count: event.attendees, attendees: event.attendeesList }) }))] }), event.image && (_jsx(react_native_1.Image, { source: { uri: event.image }, style: { width: 84, height: 84, borderRadius: 12 }, resizeMode: "cover" }))] }));
    }
    // ─── Center Item (Desktop) ──────────────────────────────
    function CenterItem({ center, onPress, isMyCenter }) {
        return (_jsxs(react_native_1.Pressable, { onPress: onPress, className: `flex-row gap-4 p-4 rounded-2xl active:opacity-80 border border-transparent hover:border-stone-200 dark:hover:border-neutral-700 ${center.isMember || isMyCenter ? 'bg-orange-50/80 dark:bg-orange-950/20' : 'bg-white dark:bg-neutral-900'}`, style: { minHeight: 72 }, children: [_jsx(react_native_1.View, { className: "w-[52px] h-[60px] rounded-xl bg-orange-100 dark:bg-orange-900/30 items-center justify-center overflow-hidden", children: center.image ? (_jsx(react_native_1.Image, { source: { uri: center.image }, style: { width: 52, height: 60 }, resizeMode: "cover" })) : (_jsx(lucide_react_native_1.Building2, { size: 22, color: "#9A3412" })) }), _jsxs(react_native_1.View, { className: "flex-1 gap-1", children: [_jsxs(react_native_1.View, { className: "flex-row items-center gap-2", children: [_jsx(react_native_1.Text, { className: "text-content dark:text-content-dark font-sans text-base leading-tight flex-1", numberOfLines: 1, children: center.name }), isMyCenter && _jsx(ui_1.Badge, { label: "My Center", variant: "going" }), !isMyCenter && center.isMember && _jsx(ui_1.Badge, { label: "Member", variant: "member" })] }), _jsxs(react_native_1.Text, { className: "text-stone-500 dark:text-stone-400 font-sans text-sm", children: [addressParsing_1.extractCityState(center.address) || 'Center', center.distanceMi != null ? ` · ${center.distanceMi} mi` : ''] }), center.eventCount != null && center.eventCount > 0 && (_jsxs(react_native_1.Text, { className: "text-primary font-sans text-xs", children: [center.eventCount, " events this week"] }))] })] }));
    }
    // ─── Detail Panel Wrapper (for side panel) ──────────────
    function DetailPanelWrapper({ selectedItem, onClose, onEventPress, onEditEvent, onStatusChange, }) {
        if (selectedItem.type === 'event') {
            return (_jsx(EventPanelInner, { eventId: selectedItem.id, onClose: onClose, onEdit: onEditEvent, onStatusChange: onStatusChange }));
        }
        return (_jsx(CenterPanelInner, { centerId: selectedItem.id, onClose: onClose, onEventPress: onEventPress }));
    }
    function EventPanelInner({ eventId, onClose, onEdit, onStatusChange, }) {
        const { user } = contexts_1.useUser();
        const { event, attendees, loading, toggleRegistration, isToggling, isCreator } = useApiData_1.useEventDetail(eventId, user?.username, user?.id);
        const colors = useDetailColors_1.useDetailColors();
        const isAdmin = user?.email === admin_1.ADMIN_EMAIL || (user?.verificationLevel !== undefined && user.verificationLevel >= 107);
        const canEdit = isAdmin || isCreator;
        // Propogate registration status change back to discover list
        const prevRegisteredRef = react_1.useRef(undefined);
        react_1.useEffect(() => {
            if (!event)
                return;
            if (prevRegisteredRef.current === undefined) {
                prevRegisteredRef.current = event.isRegistered;
                return;
            }
            if (event.isRegistered !== prevRegisteredRef.current) {
                const attendeesList = attendees.map(({ name, image, initials }) => ({
                    name,
                    image,
                    initials,
                }));
                onStatusChange?.(event.id, event.isRegistered || false, event.attendees || 0, attendeesList);
                prevRegisteredRef.current = event.isRegistered;
            }
        }, [event?.isRegistered, event?.attendees, attendees, onStatusChange]);
        const [showAuthPrompt, setShowAuthPrompt] = react_1.useState(false);
        const handleToggleRegistration = async () => {
            if (!user) {
                setShowAuthPrompt(true);
                return;
            }
            if (!user.username)
                return;
            try {
                await toggleRegistration(user.username);
            }
            catch (err) {
                if (__DEV__)
                    console.warn('[EventPanel] toggleRegistration failed:', err?.message || err);
            }
        };
        if (loading || !event) {
            return (_jsx(react_native_1.View, { style: {
                    width: 440,
                    height: '100%',
                    backgroundColor: colors.panelBg,
                    borderLeftWidth: 1,
                    borderLeftColor: colors.border,
                    justifyContent: 'center',
                    alignItems: 'center',
                }, children: _jsx(react_native_1.ActivityIndicator, { size: "large", color: "#E8862A" }) }));
        }
        const isPast = event.date ? new Date(event.date + 'T23:59:59') < new Date() : false;
        return (_jsxs(_Fragment, { children: [_jsx(EventDetailPanel_1.default, { event: event, attendees: attendees, isPast: isPast, isAdmin: isAdmin, onClose: onClose, onToggleRegistration: handleToggleRegistration, isToggling: isToggling, onEdit: canEdit && !isPast ? onEdit : undefined, onDelete: canEdit
                        ? async (id) => {
                            if (typeof window === 'undefined')
                                return;
                            if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`))
                                return;
                            try {
                                await api_1.removeEvent(id);
                                onClose();
                            }
                            catch (err) {
                                window.alert(err?.message || 'Failed to delete event');
                            }
                        }
                        : undefined }), _jsx(AuthPromptModal_1.default, { visible: showAuthPrompt, onClose: () => setShowAuthPrompt(false), returnTo: `/?detail=event&id=${eventId}`, eventTitle: event.title })] }));
    }
    function CenterPanelInner({ centerId, onClose, onEventPress, }) {
        const { center, events, loading } = useApiData_1.useCenterDetail(centerId);
        const colors = useDetailColors_1.useDetailColors();
        if (loading || !center) {
            return (_jsx(react_native_1.View, { style: {
                    width: 440,
                    height: '100%',
                    backgroundColor: colors.panelBg,
                    borderLeftWidth: 1,
                    borderLeftColor: colors.border,
                    justifyContent: 'center',
                    alignItems: 'center',
                }, children: _jsx(react_native_1.ActivityIndicator, { size: "large", color: "#E8862A" }) }));
        }
        return (_jsx(CenterDetailPanel_1.default, { center: center, events: events, onClose: onClose, onEventPress: onEventPress }));
    }
    function MobileDiscoverFallback() {
        const router = expo_router_1.useRouter();
        const { isDark } = contexts_1.useTheme();
        const [activeFilter, setActiveFilter] = react_1.useState('Events');
        const [searchQuery, setSearchQuery] = react_1.useState('');
        const [selectedDate, setSelectedDate] = react_1.useState(null);
        const [showGoingOnly, setShowGoingOnly] = react_1.useState(false);
        const [showPastEvents, setShowPastEvents] = react_1.useState(false);
        const [selectedCenter, setSelectedCenter] = react_1.useState(null);
        const [showCenterModal, setShowCenterModal] = react_1.useState(false);
        const { user } = contexts_1.useUser();
        const { items, filteredPoints, loading, allEvents, allCenters, refresh } = useApiData_1.useDiscoverData(activeFilter, searchQuery, user?.id, showPastEvents, showGoingOnly, user?.interests ?? undefined, user?.centerID);
        expo_router_1.useFocusEffect(react_1.useCallback(() => {
            refresh();
        }, [refresh]));
        // Bottom sheet state
        const [sheetSnap, setSheetSnap] = react_1.useState('mid');
        const [sheetTranslateY, setSheetTranslateY] = react_1.useState(null);
        const dragStartY = react_1.useRef(0);
        const dragStartTranslate = react_1.useRef(0);
        const containerRef = react_1.useRef(null);
        // Sheet snap positions matching iOS native (4 stops):
        //   expanded  = 0          → 100% sheet visible (full)
        //   mid       = h * 0.2    → ~80% sheet visible
        //   collapsed = h * 0.6    → ~40% sheet visible
        //   peek      = h - 100    → 100px sheet visible (handle + search)
        const getSnapPositions = react_1.useCallback(() => {
            const h = containerRef.current?.clientHeight || window.innerHeight;
            return {
                expanded: 0,
                mid: h * 0.2,
                collapsed: h * 0.6,
                peek: Math.max(0, h - 100),
            };
        }, []);
        const getSnapY = react_1.useCallback((snap) => {
            const positions = getSnapPositions();
            return positions[snap];
        }, [getSnapPositions]);
        const currentTranslateY = sheetTranslateY ?? getSnapY(sheetSnap);
        // Touch handlers for bottom sheet drag
        const handleTouchStart = react_1.useCallback((e) => {
            dragStartY.current = e.touches[0].clientY;
            dragStartTranslate.current = currentTranslateY;
        }, [currentTranslateY]);
        const handleTouchMove = react_1.useCallback((e) => {
            const dy = e.touches[0].clientY - dragStartY.current;
            const positions = getSnapPositions();
            const next = Math.max(positions.expanded, Math.min(positions.peek, dragStartTranslate.current + dy));
            setSheetTranslateY(next);
        }, [getSnapPositions]);
        const handleTouchEnd = react_1.useCallback((e) => {
            if (sheetTranslateY === null)
                return;
            const positions = getSnapPositions();
            const dragDy = e.changedTouches[0].clientY - dragStartY.current;
            // Snap to nearest of 4 positions, biased by velocity
            let snapTo;
            if (dragDy > 40) {
                // Fast swipe down — go one stop down from current
                if (sheetSnap === 'expanded')
                    snapTo = 'mid';
                else if (sheetSnap === 'mid')
                    snapTo = 'collapsed';
                else
                    snapTo = 'peek';
            }
            else if (dragDy < -40) {
                // Fast swipe up — go one stop up from current
                if (sheetSnap === 'peek')
                    snapTo = 'collapsed';
                else if (sheetSnap === 'collapsed')
                    snapTo = 'mid';
                else
                    snapTo = 'expanded';
            }
            else {
                // Position-based snap to nearest
                const dExp = Math.abs(sheetTranslateY - positions.expanded);
                const dMid = Math.abs(sheetTranslateY - positions.mid);
                const dCol = Math.abs(sheetTranslateY - positions.collapsed);
                const dPeek = Math.abs(sheetTranslateY - positions.peek);
                const minD = Math.min(dExp, dMid, dCol, dPeek);
                snapTo =
                    minD === dExp ? 'expanded' : minD === dMid ? 'mid' : minD === dCol ? 'collapsed' : 'peek';
            }
            setSheetSnap(snapTo);
            setSheetTranslateY(null);
        }, [sheetTranslateY, sheetSnap, getSnapPositions]);
        const handlePointPress = react_1.useCallback((point) => {
            if (point.type === 'center') {
                router.push(`/center/${point.id}`);
            }
            else {
                router.push(`/events/${point.id}`);
            }
        }, [router]);
        const handleFilterPress = react_1.useCallback((f) => {
            setActiveFilter(f);
            setSelectedDate(null);
        }, []);
        const eventDates = react_1.useMemo(() => new Set(allEvents.filter((e) => e.date).map((e) => e.date)), [allEvents]);
        // "Coming up" hint shown when there's a real gap between today and the
        // next event. Bridges the dead air for users browsing an empty week.
        const comingUpHint = react_1.useMemo(() => {
            if (selectedDate || showPastEvents || activeFilter !== 'Events' || searchQuery.trim())
                return null;
            const todayStr = new Date().toISOString().split('T')[0];
            const upcoming = allEvents
                .filter((e) => e.date && e.date >= todayStr)
                .sort((a, b) => a.date.localeCompare(b.date));
            if (upcoming.length === 0)
                return null;
            const next = upcoming[0];
            const todayMs = Date.parse(todayStr + 'T00:00:00');
            const nextMs = Date.parse(next.date + 'T00:00:00');
            if (isNaN(todayMs) || isNaN(nextMs))
                return null;
            const days = Math.round((nextMs - todayMs) / 86400000);
            if (days < 7)
                return null; // only worth showing when there's a real gap
            return { days, title: next.title };
        }, [allEvents, selectedDate, showPastEvents, activeFilter, searchQuery]);
        const displayItems = react_1.useMemo(() => {
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
        const isExpanded = sheetSnap === 'expanded' && sheetTranslateY === null;
        const [collapsedSections, setCollapsedSections] = react_1.useState(new Set());
        // Default the Centers list to fully collapsed on first visit. The list
        // is long (state groupings across 90+ centers) and an all-expanded view
        // is overwhelming. Re-initializes when user toggles back from another tab.
        const collapsedInitFor = react_1.useRef(null);
        react_1.useEffect(() => {
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
        // Filter chip helpers — counts are computed over upcoming events
        // (past events are hidden by default, so the counts should match
        // what the user would actually see when picking that option).
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
        return (_jsxs("div", { ref: containerRef, style: {
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }, children: [_jsx(react_native_1.View, { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, children: _jsx(react_1.Suspense, { fallback: _jsx(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center' }, children: _jsx(react_native_1.ActivityIndicator, { size: "large", color: "#E8862A" }) }), children: _jsx(Map, { points: filteredPoints, onPointPress: handlePointPress, userCenterID: user?.centerID }) }) }), _jsx("div", { style: {
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        top: currentTranslateY,
                        transition: sheetTranslateY !== null ? 'none' : 'top 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 10,
                    }, children: _jsxs("div", { style: {
                            flex: 1,
                            backgroundColor: isDark ? '#171717' : '#FFFFFF',
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }, children: [_jsxs("div", { onTouchStart: handleTouchStart, onTouchMove: handleTouchMove, onTouchEnd: handleTouchEnd, style: {
                                    touchAction: 'none',
                                    cursor: 'grab',
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none',
                                }, children: [_jsx("div", { style: {
                                            display: 'flex',
                                            justifyContent: 'center',
                                            paddingTop: 10,
                                            paddingBottom: 8,
                                        }, children: _jsx("div", { style: {
                                                width: 40,
                                                height: 4,
                                                borderRadius: 2,
                                                backgroundColor: isDark ? '#525252' : '#D1D5DB',
                                            } }) }), _jsxs(react_native_1.View, { className: "flex-row items-center mx-3 mb-2 px-3 rounded-xl", style: {
                                            minHeight: 44,
                                            backgroundColor: isDark ? '#262626' : '#F3F4F6',
                                        }, children: [_jsx(lucide_react_native_1.Search, { size: 16, color: "#9CA3AF" }), _jsx(react_native_1.TextInput, { className: "flex-1 ml-2 text-sm font-sans", style: {
                                                    color: isDark ? '#E5E7EB' : '#1F2937',
                                                    paddingVertical: 10,
                                                    fontSize: 16,
                                                }, placeholder: "Search events and centers...", placeholderTextColor: "#9CA3AF", value: searchQuery, onChangeText: setSearchQuery, onFocus: () => setSheetSnap('expanded') })] }), _jsx(react_native_1.View, { style: { marginBottom: 4 }, children: _jsx(ui_1.UnderlineTabBar, { tabs: FILTERS.map((f) => f.label), activeTab: selectedDate ? '' : activeFilter, onTabChange: (tab) => handleFilterPress(tab), counts: { Events: allEvents.length, Centers: allCenters.length } }) }), activeFilter === 'Events' && (_jsxs(react_native_1.View, { style: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, gap: 8 }, children: [_jsx(ui_1.FilterChip, { label: "Today", variant: "outline", active: selectedDate === todayStr, onPress: () => setSelectedDate((prev) => (prev === todayStr ? null : todayStr)) }), _jsx(ui_1.FilterChip, { label: centerChipLabel, variant: "outline", active: selectedCenter !== null, onPress: () => setShowCenterModal(true) }), user && (_jsx(ui_1.FilterChip, { label: "Going", variant: "outline", active: showGoingOnly, onPress: () => setShowGoingOnly((prev) => !prev) }))] }))] }), loading && (_jsx(react_native_1.View, { style: { paddingHorizontal: 12 }, children: _jsx(Skeleton_1.DiscoverListSkeleton, { count: 4 }) })), _jsxs(react_native_1.ScrollView, { className: "flex-1", contentContainerStyle: { paddingHorizontal: 4, paddingTop: 12, paddingBottom: 32, gap: 4 }, showsVerticalScrollIndicator: false, scrollEnabled: sheetSnap !== 'collapsed' && sheetTranslateY === null, stickyHeaderIndices: stickyHeaderIndices, children: [!loading && comingUpHint && (_jsxs(react_native_1.View, { className: "border border-orange-100 dark:border-orange-900/40 rounded-2xl px-4 py-3 mb-3", style: { backgroundColor: 'rgba(232, 134, 42, 0.06)' }, children: [_jsx(react_native_1.Text, { className: "text-[10px] font-sans text-stone-500 dark:text-stone-400 uppercase", style: { letterSpacing: 0.6 }, children: "Coming up" }), _jsxs(react_native_1.Text, { className: "text-sm font-sans text-content dark:text-content-dark mt-1", children: ["Next event in ", comingUpHint.days, " days"] }), _jsx(react_native_1.Text, { className: "text-xs font-sans text-stone-500 dark:text-stone-400 mt-0.5", numberOfLines: 1, children: comingUpHint.title })] })), !loading && activeFilter === 'Seva' && (_jsx(EmptyState_1.EmptyState, { message: "Seva \u2014 coming soon", subtitle: "Service opportunities will be listed here." })), !loading && activeFilter !== 'Seva' && displayItems.length === 0 && (_jsx(EmptyState_1.EmptyState, { variant: selectedDate ? 'date' : searchQuery ? 'search' : 'events' })), activeFilter !== 'Seva' && displayItems.map((item, idx) => {
                                        if (item.type === 'section') {
                                            const label = item.data.label;
                                            const isCollapsed = collapsedSections.has(label);
                                            return (_jsx(react_native_1.Pressable, { onPress: () => toggleSection(label), className: `bg-white dark:bg-neutral-900 ${idx > 0 ? 'border-t border-stone-200 dark:border-neutral-800' : ''}`, children: _jsxs(react_native_1.View, { style: {
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 14,
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                    }, children: [_jsx(react_native_1.Text, { className: "text-xs font-sans text-stone-500 dark:text-stone-400 uppercase", style: { letterSpacing: 0.6 }, children: label }), isCollapsed ? _jsx(lucide_react_native_1.ChevronDown, { size: 14, color: "#a8a29e" }) : _jsx(lucide_react_native_1.ChevronUp, { size: 14, color: "#a8a29e" })] }) }, `section-${idx}`));
                                        }
                                        if (item.type === 'event') {
                                            return (_jsx(EventItem, { event: item.data, centerName: allCenters.find((c) => c.id === item.data.centerId)?.name, onPress: () => router.push(`/events/${item.data.id}`) }, `event-${item.data.id}`));
                                        }
                                        const sectionLabel = displayItems.slice(0, idx).reverse().find((i) => i.type === 'section')?.data?.label;
                                        if (sectionLabel && collapsedSections.has(sectionLabel))
                                            return null;
                                        return (_jsx(CenterItem, { center: item.data, isMyCenter: !!user?.centerID && item.data.id === user.centerID, onPress: () => router.push(`/center/${item.data.id}`) }, `center-${item.data.id}`));
                                    })] })] }) }), _jsx(FilterPickerModal_1.default, { visible: showCenterModal, title: "Center", options: centerOptions, selected: selectedCenter, onSelect: setSelectedCenter, onClear: () => setSelectedCenter(null), onClose: () => setShowCenterModal(false) })] }));
    }
    // ─── Desktop Discover Screen ────────────────────────────
    function DiscoverScreenWeb() {
        const { width } = react_native_1.useWindowDimensions();
        const isMobile = width < 768;
        const isTablet = width >= 768 && width < 1024;
        const panelWidth = isTablet ? 340 : 420;
        const router = expo_router_1.useRouter();
        const { isDark } = contexts_1.useTheme();
        const { user } = contexts_1.useUser();
        const isAdmin = user?.email === admin_1.ADMIN_EMAIL || (user?.verificationLevel !== undefined && user.verificationLevel >= 107);
        // Beta: any signed-in user can create events. Backend enforces auth-only;
        // post-beta this becomes a coordinator-tier gate (see issue tracker).
        const canCreate = !!user;
        const [activeFilter, setActiveFilter] = react_1.useState('Events');
        const [searchQuery, setSearchQuery] = react_1.useState('');
        const [selectedDate, setSelectedDate] = react_1.useState(null);
        const [showGoingOnly, setShowGoingOnly] = react_1.useState(false);
        const [showPastEvents, setShowPastEvents] = react_1.useState(false);
        const [selectedCenterDesktop, setSelectedCenterDesktop] = react_1.useState(null);
        const [showCenterModalDesktop, setShowCenterModalDesktop] = react_1.useState(false);
        const [selectedItem, setSelectedItem] = react_1.useState(null);
        const [autoOpenPoint, setAutoOpenPoint] = react_1.useState(null);
        const [mapFlyTo, setMapFlyTo] = react_1.useState(null);
        const lastFlownSelectionRef = react_1.useRef(null);
        // Event form panel: null = hidden, { id?: string } = open (id present = edit, absent = create)
        const [formPanel, setFormPanel] = react_1.useState(null);
        const { items, filteredPoints, loading, allEvents, allCenters, refresh, updateEventStatus } = useApiData_1.useDiscoverData(activeFilter, searchQuery, user?.id, showPastEvents, showGoingOnly, user?.interests ?? undefined, user?.centerID);
        // Get user's center for map initial location
        const { center: userCenter } = useApiData_1.useCenterDetail(user?.centerID || '');
        expo_router_1.useFocusEffect(react_1.useCallback(() => {
            refresh();
        }, [refresh]));
        const params = expo_router_1.useLocalSearchParams();
        // Clear query string without navigation
        const clearParams = react_1.useCallback(() => {
            if (typeof window !== 'undefined' && window.location.search) {
                window.history.replaceState(null, '', window.location.pathname);
            }
        }, []);
        // Support direct URL navigation (e.g. ?detail=event&id=123)
        react_1.useEffect(() => {
            if (params.detail && params.id) {
                setSelectedItem({ type: params.detail, id: params.id });
            }
        }, [params.detail, params.id]);
        // Pan/zoom the map when the user opens a center or event (list, map marker, popover, or URL).
        react_1.useEffect(() => {
            if (!selectedItem) {
                lastFlownSelectionRef.current = null;
                return;
            }
            const coords = findCoordsForSelection(selectedItem, filteredPoints, allEvents, allCenters);
            if (!coords)
                return;
            const sid = `${selectedItem.type}:${selectedItem.id}`;
            if (lastFlownSelectionRef.current === sid)
                return;
            lastFlownSelectionRef.current = sid;
            setMapFlyTo((prev) => ({
                latitude: coords.latitude,
                longitude: coords.longitude,
                key: (prev?.key ?? 0) + 1,
            }));
            // Tell the map to auto-open the popover for THIS exact point after the
            // fly-to settles. Disambiguates overlapping markers (e.g. multiple events
            // at the same center's coordinates) and serves as the requested
            // "popup opens after the map moves" UX.
            setAutoOpenPoint((prev) => ({
                id: selectedItem.id,
                type: selectedItem.type,
                key: (prev?.key ?? 0) + 1,
            }));
        }, [selectedItem, filteredPoints, allEvents, allCenters]);
        // Listen for create event from header nav button
        react_1.useEffect(() => {
            if (typeof window === 'undefined')
                return;
            const handler = () => {
                setSelectedItem(null);
                setFormPanel({});
            };
            window.addEventListener('open-event-form', handler);
            return () => window.removeEventListener('open-event-form', handler);
        }, []);
        // Fixed 440px width for both list and detail panels — no shift on selection
        const rightPanelWidth = 440;
        const eventDates = react_1.useMemo(() => new Set(allEvents.filter((e) => e.date).map((e) => e.date)), [allEvents]);
        // "Coming up" hint shown when there's a real gap between today and the
        // next event. Bridges the dead air for users browsing an empty week.
        const comingUpHint = react_1.useMemo(() => {
            if (selectedDate || showPastEvents || activeFilter !== 'Events' || searchQuery.trim())
                return null;
            const todayStr = new Date().toISOString().split('T')[0];
            const upcoming = allEvents
                .filter((e) => e.date && e.date >= todayStr)
                .sort((a, b) => a.date.localeCompare(b.date));
            if (upcoming.length === 0)
                return null;
            const next = upcoming[0];
            const todayMs = Date.parse(todayStr + 'T00:00:00');
            const nextMs = Date.parse(next.date + 'T00:00:00');
            if (isNaN(todayMs) || isNaN(nextMs))
                return null;
            const days = Math.round((nextMs - todayMs) / 86400000);
            if (days < 7)
                return null; // only worth showing when there's a real gap
            return { days, title: next.title };
        }, [allEvents, selectedDate, showPastEvents, activeFilter, searchQuery]);
        const displayItems = react_1.useMemo(() => {
            let result = items;
            if (selectedDate) {
                result = result.filter((item) => item.type === 'event' && item.data.date === selectedDate);
            }
            if (selectedCenterDesktop) {
                result = result.filter((item) => {
                    if (item.type !== 'event')
                        return true;
                    return item.data.centerId === selectedCenterDesktop;
                });
            }
            return result;
        }, [items, selectedDate, selectedCenterDesktop]);
        // Filter chip helpers — counts over upcoming events
        const todayStrDesktop = new Date().toISOString().split('T')[0];
        const eventsForCountsDesktop = react_1.useMemo(() => (showPastEvents ? allEvents : allEvents.filter((e) => !e.date || e.date >= todayStrDesktop)), [allEvents, showPastEvents, todayStrDesktop]);
        const centerOptionsDesktop = react_1.useMemo(() => {
            const counts = {};
            for (const e of eventsForCountsDesktop) {
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
        }, [allCenters, eventsForCountsDesktop, user?.centerID]);
        const centerChipLabelDesktop = selectedCenterDesktop
            ? centerOptionsDesktop.find((o) => o.value === selectedCenterDesktop)?.label ?? 'Center'
            : 'Center';
        const handleFilterPress = react_1.useCallback((f) => {
            setActiveFilter(f);
            setSelectedDate(null);
        }, []);
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
        // Map popover state
        const mapPanelRef = react_1.useRef(null);
        const [hoverPopover, setHoverPopover] = react_1.useState(null);
        const [clickPopover, setClickPopover] = react_1.useState(null);
        const viewportToContainer = react_1.useCallback((vx, vy) => {
            const el = mapPanelRef.current;
            if (el?.getBoundingClientRect) {
                const r = el.getBoundingClientRect();
                return { x: vx - r.left, y: vy - r.top };
            }
            return { x: vx, y: vy };
        }, []);
        const handlePointHover = react_1.useCallback((point, x, y) => {
            if (point && x != null && y != null) {
                const pos = viewportToContainer(x, y);
                setHoverPopover({ point, x: pos.x, y: pos.y });
            }
            else {
                setHoverPopover(null);
            }
        }, [viewportToContainer]);
        const handlePointClick = react_1.useCallback((point, x, y) => {
            setHoverPopover(null);
            if (x != null && y != null) {
                const pos = viewportToContainer(x, y);
                setClickPopover({ point, x: pos.x, y: pos.y });
            }
        }, [viewportToContainer]);
        const handlePopoverView = react_1.useCallback(() => {
            if (!clickPopover)
                return;
            const { point } = clickPopover;
            setSelectedItem({ type: point.type === 'center' ? 'center' : 'event', id: point.id });
            setClickPopover(null);
        }, [clickPopover]);
        // Look up details for popover from hook data (not sample constants)
        const clickEventDetail = react_1.useMemo(() => {
            if (!clickPopover || clickPopover.point.type !== 'event')
                return undefined;
            return allEvents.find((e) => e.id === clickPopover.point.id);
        }, [clickPopover, allEvents]);
        const clickCenterDetail = react_1.useMemo(() => {
            if (!clickPopover || clickPopover.point.type !== 'center')
                return undefined;
            return allCenters.find((c) => c.id === clickPopover.point.id);
        }, [clickPopover, allCenters]);
        const handlePointPress = react_1.useCallback((point) => {
            setSelectedItem({ type: point.type === 'center' ? 'center' : 'event', id: point.id });
        }, []);
        const handleMapMove = react_1.useCallback(() => {
            setClickPopover(null);
            setHoverPopover(null);
        }, []);
        if (isMobile) {
            return _jsx(MobileDiscoverFallback, {});
        }
        return (_jsxs(react_native_1.View, { className: "flex-1 bg-background dark:bg-background-dark", children: [_jsxs(react_native_1.View, { className: "flex-row flex-1", children: [_jsxs(react_native_1.View, { ref: mapPanelRef, className: "flex-1 relative", children: [_jsx(react_1.Suspense, { fallback: _jsx(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center' }, children: _jsx(react_native_1.ActivityIndicator, { size: "large", color: "#E8862A" }) }), children: _jsx(Map, { initialCenter: userCenter?.latitude && userCenter?.longitude ? [userCenter.latitude, userCenter.longitude] : undefined, points: filteredPoints, onPointPress: handlePointPress, onPointHover: handlePointHover, onPointClick: handlePointClick, onMapMove: handleMapMove, userCenterID: user?.centerID, flyTo: mapFlyTo, autoOpenPoint: autoOpenPoint }) }), hoverPopover && !clickPopover && (_jsx(MapPopover_1.default, { point: hoverPopover.point, mode: "hover", x: hoverPopover.x, y: hoverPopover.y })), clickPopover && (_jsx(MapPopover_1.default, { point: clickPopover.point, mode: "click", eventDetail: clickEventDetail, centerDetail: clickCenterDetail, x: clickPopover.x, y: clickPopover.y, onViewPress: handlePopoverView, onClose: () => setClickPopover(null) }))] }), formPanel ? (_jsx(EventFormPanel_1.default, { eventId: formPanel.id, onSaved: (savedId) => {
                                setFormPanel(null);
                                setSelectedItem({ type: 'event', id: savedId });
                            }, onClose: () => {
                                const editId = formPanel.id;
                                setFormPanel(null);
                                if (editId) {
                                    setSelectedItem({ type: 'event', id: editId });
                                }
                                else {
                                    clearParams();
                                }
                            } })) : selectedItem ? (_jsx(DetailPanelWrapper, { selectedItem: selectedItem, onClose: () => {
                                setSelectedItem(null);
                                clearParams();
                            }, onEventPress: (id) => setSelectedItem({ type: 'event', id }), onEditEvent: (id) => {
                                setSelectedItem(null);
                                setFormPanel({ id });
                            }, onStatusChange: updateEventStatus })) : (_jsxs(react_native_1.View, { style: { width: rightPanelWidth }, className: "border-l border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900", children: [_jsx(react_native_1.View, { style: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 0 }, children: _jsx(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8 }, children: _jsxs(react_native_1.View, { className: "flex-row items-center px-3 rounded-xl bg-stone-100 dark:bg-neutral-800", style: { minHeight: 40, flex: 1 }, children: [_jsx(lucide_react_native_1.Search, { size: 16, color: "#9CA3AF" }), _jsx(react_native_1.TextInput, { className: "flex-1 ml-2 text-sm font-sans text-content dark:text-content-dark outline-none", placeholder: "Search events and centers...", placeholderTextColor: "#9CA3AF", value: searchQuery, onChangeText: setSearchQuery, style: { paddingVertical: 8 } })] }) }) }), _jsx(react_native_1.View, { style: { paddingTop: 8, marginBottom: 12 }, children: _jsx(ui_1.UnderlineTabBar, { tabs: FILTERS.map((f) => f.label), activeTab: selectedDate ? '' : activeFilter, onTabChange: (tab) => handleFilterPress(tab), counts: { Events: allEvents.length, Centers: allCenters.length } }) }), activeFilter === 'Events' && (_jsxs(react_native_1.View, { style: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 6, gap: 8 }, children: [_jsx(ui_1.FilterChip, { label: "Today", variant: "outline", active: selectedDate === todayStrDesktop, onPress: () => setSelectedDate((prev) => (prev === todayStrDesktop ? null : todayStrDesktop)) }), _jsx(ui_1.FilterChip, { label: centerChipLabelDesktop, variant: "outline", active: selectedCenterDesktop !== null, onPress: () => setShowCenterModalDesktop(true) }), user && (_jsx(ui_1.FilterChip, { label: "Going", variant: "outline", active: showGoingOnly, onPress: () => setShowGoingOnly((prev) => !prev) }))] })), loading && (_jsx(react_native_1.View, { style: { paddingHorizontal: 16 }, children: _jsx(Skeleton_1.DiscoverListSkeleton, { count: 5 }) })), _jsxs(react_native_1.ScrollView, { className: "flex-1", contentContainerStyle: { paddingHorizontal: 4, paddingTop: 12, paddingBottom: 24, gap: 4 }, showsVerticalScrollIndicator: false, children: [!loading && activeFilter === 'Seva' && (_jsx(EmptyState_1.EmptyState, { message: "Seva \u2014 coming soon", subtitle: "Service opportunities will be listed here." })), !loading && activeFilter !== 'Seva' && displayItems.length === 0 && (_jsx(EmptyState_1.EmptyState, { variant: selectedDate ? 'date' : searchQuery ? 'search' : 'events' })), activeFilter !== 'Seva' && displayItems.map((item, idx) => {
                                            if (item.type === 'section') {
                                                const label = item.data.label;
                                                const isCollapsed = collapsedSections.has(label);
                                                return (_jsx(react_native_1.Pressable, { onPress: () => toggleSection(label), style: { marginTop: idx > 0 ? 16 : 0, marginBottom: 4 }, children: _jsxs(react_native_1.View, { className: "flex-row items-center gap-2 px-1", children: [_jsx(react_native_1.Text, { className: "text-xs font-sans text-stone-400 dark:text-stone-500 uppercase", style: { letterSpacing: 0.5 }, children: label }), _jsx(react_native_1.View, { className: "flex-1 h-px bg-stone-200 dark:bg-neutral-700" }), isCollapsed ? _jsx(lucide_react_native_1.ChevronDown, { size: 14, color: "#a8a29e" }) : _jsx(lucide_react_native_1.ChevronUp, { size: 14, color: "#a8a29e" })] }) }, `section-${idx}`));
                                            }
                                            if (item.type === 'event') {
                                                return (_jsx(EventItem, { event: item.data, centerName: allCenters.find((c) => c.id === item.data.centerId)?.name, onPress: () => setSelectedItem({ type: 'event', id: item.data.id }) }, `event-${item.data.id}`));
                                            }
                                            const sectionLabel = displayItems.slice(0, idx).reverse().find((i) => i.type === 'section')?.data?.label;
                                            if (sectionLabel && collapsedSections.has(sectionLabel))
                                                return null;
                                            return (_jsx(CenterItem, { center: item.data, isMyCenter: !!user?.centerID && item.data.id === user.centerID, onPress: () => setSelectedItem({ type: 'center', id: item.data.id }) }, `center-${item.data.id}`));
                                        })] })] }))] }), _jsx(FilterPickerModal_1.default, { visible: showCenterModalDesktop, title: "Center", options: centerOptionsDesktop, selected: selectedCenterDesktop, onSelect: setSelectedCenterDesktop, onClear: () => setSelectedCenterDesktop(null), onClose: () => setShowCenterModalDesktop(false) })] }));
    }
    exports_1("default", DiscoverScreenWeb);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (EmptyState_1_1) {
                EmptyState_1 = EmptyState_1_1;
            },
            function (Skeleton_1_1) {
                Skeleton_1 = Skeleton_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
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
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            },
            function (FilterPickerModal_1_1) {
                FilterPickerModal_1 = FilterPickerModal_1_1;
            },
            function (MapPopover_1_1) {
                MapPopover_1 = MapPopover_1_1;
            },
            function (useApiData_1_1) {
                useApiData_1 = useApiData_1_1;
            },
            function (EventDetailPanel_1_1) {
                EventDetailPanel_1 = EventDetailPanel_1_1;
            },
            function (EventFormPanel_1_1) {
                EventFormPanel_1 = EventFormPanel_1_1;
            },
            function (CenterDetailPanel_1_1) {
                CenterDetailPanel_1 = CenterDetailPanel_1_1;
            },
            function (useDetailColors_1_1) {
                useDetailColors_1 = useDetailColors_1_1;
            },
            function (AuthPromptModal_1_1) {
                AuthPromptModal_1 = AuthPromptModal_1_1;
            },
            function (api_1_1) {
                api_1 = api_1_1;
            },
            function (addressParsing_1_1) {
                addressParsing_1 = addressParsing_1_1;
            },
            function (admin_1_1) {
                admin_1 = admin_1_1;
            }
        ],
        execute: function () {
            Map = react_1.lazy(() => context_1.import('../../components/Map'));
            FILTERS = [
                { label: 'Events' },
                { label: 'Centers' },
                { label: 'Seva' },
            ];
            // ── Placeholder avatar dots for attendee count ──────────
            AVATAR_COLORS = ['#E8862A', '#78716C', '#A8A29E', '#D6D3D1'];
        }
    };
});
