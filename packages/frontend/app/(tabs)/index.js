System.register(["react/jsx-runtime", "react", "react-native", "expo-router", "lucide-react-native", "react-native-svg", "posthog-react-native", "../../components/ui", "../../components/contexts", "../../hooks/useApiData", "../../components/connect"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, expo_router_1, lucide_react_native_1, react_native_svg_1, posthog_react_native_1, ui_1, contexts_1, useApiData_1, connect_1, FALLBACK_WEEK_ITEMS;
    var __moduleName = context_1 && context_1.id;
    function formatDatePill(dateStr) {
        const parsed = new Date(`${dateStr}T00:00:00`);
        if (Number.isNaN(parsed.getTime()))
            return { month: '', day: '' };
        return {
            month: parsed.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
            day: String(parsed.getDate()),
        };
    }
    function isToday(dateStr) {
        return dateStr === new Date().toISOString().split('T')[0];
    }
    function daysUntil(dateStr) {
        if (!dateStr)
            return null;
        const parsed = new Date(`${dateStr}T00:00:00`);
        if (Number.isNaN(parsed.getTime()))
            return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = Math.round((parsed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    }
    function countdownLabel(dateStr) {
        const days = daysUntil(dateStr);
        if (days == null)
            return null;
        if (days < 0)
            return null;
        if (days === 0)
            return 'Today';
        if (days === 1)
            return 'Tomorrow';
        if (days < 7)
            return `In ${days} days`;
        if (days < 30)
            return `In ${Math.round(days / 7)} weeks`;
        return `In ${days} days`;
    }
    function sortUpcomingEvents(events) {
        const today = new Date().toISOString().split('T')[0];
        return [...events]
            .filter((event) => !event.date || event.date >= today)
            .sort((a, b) => {
            if (!a.date && !b.date)
                return 0;
            if (!a.date)
                return 1;
            if (!b.date)
                return -1;
            return a.date.localeCompare(b.date);
        });
    }
    function liveEventToWeekItem(event, onPress) {
        const { month, day } = event.date ? formatDatePill(event.date) : { month: '', day: '' };
        const today = event.date ? isToday(event.date) : false;
        const subtitleParts = [today ? 'Today' : event.time || 'TBD', event.location || event.address];
        return {
            id: event.id,
            month,
            day,
            title: event.title,
            subtitle: subtitleParts.filter(Boolean).join(' · '),
            highlight: today,
            onPress,
        };
    }
    function HomeScreen() {
        const router = expo_router_1.useRouter();
        const { width } = react_native_1.useWindowDimensions();
        const posthog = posthog_react_native_1.usePostHog();
        const { user } = contexts_1.useUser();
        const { isDark } = contexts_1.useTheme();
        const { events: myEvents, loading: myEventsLoading } = useApiData_1.useMyEvents(user?.username);
        const { allEvents, allCenters, loading: discoverLoading, } = useApiData_1.useDiscoverData('Events', '', user?.id, false, false, user?.interests ?? undefined, user?.centerID);
        const isDesktop = width >= 860;
        const pageBg = isDark ? '#1A1A1A' : '#F5F5F4';
        const cardBg = isDark ? '#262626' : '#FFFFFF';
        const surfaceBg = isDark ? '#262626' : '#F5F0EB';
        const borderColor = isDark ? '#262626' : '#ECE7DE';
        const dividerColor = isDark ? '#262626' : '#F1ECE3';
        const textColor = isDark ? '#FAFAFA' : '#1C1917';
        const bodyColor = isDark ? '#D6D3D1' : '#44403C';
        const mutedColor = isDark ? '#A8A29E' : '#78716C';
        const faintColor = isDark ? '#737373' : '#A8A29E';
        const accentColor = '#E8862A';
        const signedUpEvents = react_1.useMemo(() => {
            const fromDiscover = sortUpcomingEvents(allEvents.filter((event) => event.isRegistered));
            if (fromDiscover.length > 0)
                return fromDiscover;
            return sortUpcomingEvents(myEvents.map((event) => ({ ...event, isRegistered: true })));
        }, [allEvents, myEvents]);
        const upcomingExploreEvents = react_1.useMemo(() => sortUpcomingEvents(allEvents.filter((event) => !event.isRegistered)), [allEvents]);
        const featured = react_1.useMemo(() => {
            const source = signedUpEvents[0] || upcomingExploreEvents[0];
            if (source) {
                const centerName = allCenters.find((item) => item.id === source.centerId)?.name;
                return { kind: 'live', event: source, centerName };
            }
            return { kind: 'mock', event: connect_1.featuredHomeEvent };
        }, [allCenters, signedUpEvents, upcomingExploreEvents]);
        const weekItems = react_1.useMemo(() => {
            const featuredId = featured.kind === 'live' ? featured.event.id : null;
            const pool = (signedUpEvents.length > 0 ? signedUpEvents : upcomingExploreEvents).filter((event) => event.id !== featuredId);
            if (pool.length === 0)
                return FALLBACK_WEEK_ITEMS;
            return pool.slice(0, 4).map((event) => liveEventToWeekItem(event, () => {
                posthog?.capture('home_event_pressed', {
                    eventId: event.id,
                    source: 'this_week',
                });
                router.push(`/events/${event.id}`);
            }));
        }, [featured, posthog, router, signedUpEvents, upcomingExploreEvents]);
        const latestBoardPosts = react_1.useMemo(() => {
            const eventPosts = connect_1.eventBoards.flatMap((board) => board.messages.map((message) => ({
                ...message,
                sourceTitle: board.title,
                sourceKind: 'event',
            })));
            const centerPosts = connect_1.centerBoards.flatMap((board) => board.messages.map((message) => ({
                ...message,
                sourceTitle: board.centerName,
                sourceKind: 'center',
            })));
            const ordered = [eventPosts[0], centerPosts[0]].filter(Boolean);
            return ordered.length > 0 ? ordered : [...eventPosts, ...centerPosts].slice(0, 2);
        }, []);
        const isLoading = discoverLoading || (user ? myEventsLoading : false);
        const greetingName = user?.firstName || user?.username || 'friend';
        const todayLabel = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        });
        if (isLoading) {
            return (_jsx(react_native_1.View, { style: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: pageBg }, children: _jsx(react_native_1.ActivityIndicator, { size: "large", color: accentColor }) }));
        }
        return (_jsx(react_native_1.ScrollView, { style: { flex: 1, backgroundColor: pageBg }, contentContainerStyle: {
                paddingHorizontal: isDesktop ? 24 : 16,
                paddingTop: react_native_1.Platform.OS === 'web' ? 20 : 14,
                paddingBottom: react_native_1.Platform.OS === 'web' ? 40 : 112,
            }, showsVerticalScrollIndicator: false, children: _jsxs(react_native_1.View, { style: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: 22 }, children: [_jsx(Greeting, { dateLabel: todayLabel, name: user ? `Namaste, ${greetingName}` : 'Namaste', textColor: textColor, mutedColor: mutedColor }), _jsx(Section, { eyebrow: "UP NEXT FOR YOU", trailing: "See all", mutedColor: faintColor, accentColor: accentColor, onTrailingPress: () => router.push('/'), children: _jsx(FeaturedEventCard, { featured: featured, cardBg: cardBg, borderColor: borderColor, dividerColor: dividerColor, textColor: textColor, bodyColor: bodyColor, mutedColor: mutedColor, faintColor: faintColor, isDark: isDark, onPress: () => {
                                if (featured.kind === 'live') {
                                    posthog?.capture('home_featured_event_pressed', {
                                        eventId: featured.event.id,
                                    });
                                    router.push(`/events/${featured.event.id}`);
                                }
                            } }) }), latestBoardPosts.length > 0 ? (_jsx(Section, { eyebrow: "LATEST ON YOUR BOARDS", trailing: "Open Feed", mutedColor: faintColor, accentColor: accentColor, onTrailingPress: () => router.push('/(tabs)/connect'), children: _jsx(react_native_1.View, { style: {
                                borderRadius: 18,
                                borderWidth: 1,
                                borderColor,
                                backgroundColor: cardBg,
                                overflow: 'hidden',
                            }, children: latestBoardPosts.map((post, index) => (_jsx(BoardPeekRow, { post: post, showDivider: index < latestBoardPosts.length - 1, textColor: textColor, bodyColor: bodyColor, mutedColor: mutedColor, faintColor: faintColor, dividerColor: dividerColor, accentColor: accentColor, onPress: () => {
                                    posthog?.capture('home_board_peek_pressed', {
                                        sourceTitle: post.sourceTitle,
                                    });
                                    router.push('/(tabs)/connect');
                                } }, `${post.sourceTitle}-${post.id}`))) }) })) : null, _jsx(Section, { eyebrow: signedUpEvents.length > 0 ? 'THIS WEEK' : 'COMING UP', trailing: "See all", mutedColor: faintColor, accentColor: accentColor, onTrailingPress: () => router.push('/'), children: weekItems.length > 0 ? (_jsx(react_native_1.View, { style: { gap: 8 }, children: weekItems.map((item) => (_jsx(MiniEventRow, { item: item, cardBg: cardBg, surfaceBg: surfaceBg, borderColor: borderColor, textColor: textColor, mutedColor: mutedColor, accentColor: accentColor, isDark: isDark }, item.id))) })) : (_jsxs(react_native_1.View, { style: {
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor,
                                backgroundColor: cardBg,
                                padding: 16,
                                gap: 4,
                            }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 16, color: textColor }, children: "No events yet" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, lineHeight: 20, color: mutedColor }, children: "Upcoming events from Explore will appear here as they are added." })] })) })] }) }));
    }
    exports_1("default", HomeScreen);
    function Greeting({ dateLabel, name, textColor, mutedColor, }) {
        return (_jsxs(react_native_1.View, { style: { gap: 4 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12.5, color: mutedColor, letterSpacing: 0.2 }, children: dateLabel }), _jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: 30,
                        lineHeight: 34,
                        letterSpacing: -0.5,
                        color: textColor,
                    }, numberOfLines: 1, children: name })] }));
    }
    function Section({ eyebrow, trailing, mutedColor, accentColor, onTrailingPress, children, }) {
        return (_jsxs(react_native_1.View, { style: { gap: 10 }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }, children: [_jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans',
                                fontSize: 11,
                                letterSpacing: 0.9,
                                color: mutedColor,
                            }, children: eyebrow }), trailing ? (_jsx(react_native_1.Pressable, { onPress: onTrailingPress, hitSlop: 8, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: accentColor }, children: trailing }) })) : null] }), children] }));
    }
    function FeaturedEventCard({ featured, cardBg, borderColor, dividerColor, textColor, bodyColor, mutedColor, faintColor, isDark, onPress, }) {
        const event = featured.kind === 'live' ? featured.event : null;
        const mock = featured.kind === 'mock' ? featured.event : null;
        const title = event?.title ?? mock.title;
        const dateLabel = event
            ? event.date
                ? new Date(`${event.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'TBD'
            : mock.dateLabel;
        const timeLabel = event?.time || mock?.timeLabel || 'TBD';
        const locationLabel = event ? event.location || event.address || 'Location TBA' : mock.locationLabel;
        const goingPill = event ? event.isRegistered : mock.going;
        const countdown = event ? countdownLabel(event.date) : mock?.countdownLabel ?? null;
        const attendeesGoingLabel = event
            ? event.attendees > 0
                ? `${event.attendees} going`
                : null
            : mock.attendeesGoingLabel;
        const attendeesList = event?.attendeesList?.slice(0, 4);
        const fallbackAttendees = mock?.attendees ?? [];
        const heroImage = event?.image;
        const isLive = featured.kind === 'live';
        return (_jsxs(react_native_1.Pressable, { onPress: onPress, disabled: !isLive, style: {
                borderRadius: 22,
                borderWidth: 1,
                borderColor,
                backgroundColor: cardBg,
                overflow: 'hidden',
            }, children: [_jsxs(react_native_1.View, { style: { height: 124, position: 'relative' }, children: [heroImage ? (_jsx(react_native_1.Image, { source: { uri: heroImage }, style: { width: '100%', height: '100%' }, resizeMode: "cover" })) : (_jsx(GradientHero, { isDark: isDark })), _jsxs(react_native_1.View, { style: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 }, children: [countdown ? _jsx(InkPill, { label: countdown }) : null, goingPill ? _jsx(GoingPill, { label: "You're going" }) : null] })] }), _jsxs(react_native_1.View, { style: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 }, children: [_jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans',
                                fontSize: 18,
                                lineHeight: 23,
                                letterSpacing: -0.2,
                                color: textColor,
                            }, numberOfLines: 2, children: title }), _jsxs(react_native_1.View, { style: { flexDirection: 'column', gap: 4, marginTop: 8 }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 6 }, children: [_jsx(lucide_react_native_1.Clock3, { size: 13, color: faintColor }), _jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: bodyColor }, numberOfLines: 1, children: [dateLabel, " \u00B7 ", timeLabel] })] }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 6 }, children: [_jsx(lucide_react_native_1.MapPin, { size: 13, color: faintColor }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: bodyColor }, numberOfLines: 1, children: locationLabel })] })] }), attendeesGoingLabel || fallbackAttendees.length > 0 ? (_jsxs(react_native_1.View, { style: {
                                marginTop: 12,
                                paddingTop: 12,
                                borderTopWidth: 1,
                                borderTopColor: dividerColor,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 10,
                            }, children: [_jsx(AttendeeStack, { attendees: attendeesList, fallback: fallbackAttendees }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12.5, color: mutedColor, lineHeight: 17 }, numberOfLines: 1, children: attendeesGoingLabel })] })) : null] })] }));
    }
    function GradientHero({ isDark }) {
        return (_jsx(react_native_1.View, { style: { flex: 1 }, children: _jsxs(react_native_svg_1.default, { width: "100%", height: "100%", viewBox: "0 0 300 124", preserveAspectRatio: "none", children: [_jsx(react_native_svg_1.Defs, { children: _jsxs(react_native_svg_1.LinearGradient, { id: "featGrad", x1: "0", y1: "0", x2: "1", y2: "1", children: [_jsx(react_native_svg_1.Stop, { offset: "0", stopColor: isDark ? '#7C2D12' : '#FFF1E5' }), _jsx(react_native_svg_1.Stop, { offset: "0.6", stopColor: isDark ? '#C2410C' : '#FED7AA' }), _jsx(react_native_svg_1.Stop, { offset: "1", stopColor: isDark ? '#9A3412' : '#FB923C' })] }) }), _jsx(react_native_svg_1.Rect, { x: "0", y: "0", width: "300", height: "124", fill: "url(#featGrad)" }), _jsx(react_native_svg_1.Circle, { cx: "248", cy: "62", r: "14", stroke: "#7C2D12", strokeOpacity: "0.18", strokeWidth: "0.8", fill: "none" }), _jsx(react_native_svg_1.Circle, { cx: "248", cy: "62", r: "26", stroke: "#7C2D12", strokeOpacity: "0.16", strokeWidth: "0.8", fill: "none" }), _jsx(react_native_svg_1.Circle, { cx: "248", cy: "62", r: "38", stroke: "#7C2D12", strokeOpacity: "0.14", strokeWidth: "0.8", fill: "none" }), _jsx(react_native_svg_1.Circle, { cx: "248", cy: "62", r: "50", stroke: "#7C2D12", strokeOpacity: "0.12", strokeWidth: "0.8", fill: "none" }), _jsx(react_native_svg_1.Circle, { cx: "248", cy: "62", r: "62", stroke: "#7C2D12", strokeOpacity: "0.10", strokeWidth: "0.8", fill: "none" }), [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                        const rad = (deg * Math.PI) / 180;
                        const x2 = 248 + 70 * Math.cos(rad);
                        const y2 = 62 + 70 * Math.sin(rad);
                        return (_jsx(react_native_svg_1.Line, { x1: "248", y1: "62", x2: x2, y2: y2, stroke: "#7C2D12", strokeOpacity: "0.11", strokeWidth: "0.8" }, deg));
                    })] }) }));
    }
    function InkPill({ label }) {
        return (_jsx(react_native_1.View, { style: {
                backgroundColor: '#1C1917',
                borderRadius: 999,
                paddingHorizontal: 9,
                paddingVertical: 4,
            }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: '#FAFAF7', letterSpacing: 0.2 }, children: label }) }));
    }
    function GoingPill({ label }) {
        return (_jsxs(react_native_1.View, { style: {
                backgroundColor: '#DCFCE7',
                borderRadius: 999,
                paddingHorizontal: 9,
                paddingVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
            }, children: [_jsx(react_native_1.View, { style: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#15803D' } }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: '#15803D', letterSpacing: 0.2 }, children: label })] }));
    }
    function AttendeeStack({ attendees, fallback, }) {
        const max = 4;
        const items = attendees && attendees.length > 0
            ? attendees.slice(0, max).map((a) => ({ name: a.name, initials: a.initials, image: a.image }))
            : fallback.slice(0, max).map((p) => ({ name: p.name, initials: p.initials, accentColor: p.accentColor }));
        return (_jsx(react_native_1.View, { style: { flexDirection: 'row' }, children: items.map((item, index) => (_jsx(react_native_1.View, { style: {
                    marginLeft: index === 0 ? 0 : -7,
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                    borderRadius: 14,
                }, children: _jsx(ui_1.Avatar, { name: item.name, initials: item.initials, image: item.image, backgroundColor: item.accentColor, size: 22 }) }, `${item.name}-${index}`))) }));
    }
    function BoardPeekRow({ post, showDivider, textColor, bodyColor, mutedColor, faintColor, dividerColor, accentColor, onPress, }) {
        return (_jsxs(react_native_1.Pressable, { onPress: onPress, style: {
                flexDirection: 'row',
                gap: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderBottomWidth: showDivider ? 1 : 0,
                borderBottomColor: dividerColor,
            }, children: [_jsx(ui_1.Avatar, { name: post.author.name, initials: post.author.initials, size: 32, backgroundColor: post.author.accentColor }), _jsxs(react_native_1.View, { style: { flex: 1, minWidth: 0, gap: 4 }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: textColor }, numberOfLines: 1, children: post.author.name }), post.author.verification === 'sevak' ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 10.5, color: '#C2410C', letterSpacing: 0.4 }, children: "SEVAK" })) : null, _jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: mutedColor }, numberOfLines: 1, children: ["\u00B7 in ", post.sourceTitle] }), _jsx(react_native_1.Text, { style: { marginLeft: 'auto', fontFamily: 'Inclusive Sans', fontSize: 11, color: faintColor }, children: post.timestamp })] }), _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans',
                                fontSize: 13,
                                lineHeight: 18,
                                color: bodyColor,
                            }, numberOfLines: 2, children: post.body }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }, children: [_jsx(lucide_react_native_1.MessageCircle, { size: 12, color: accentColor, strokeWidth: 2.3 }), _jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: accentColor }, children: [post.replyCount ?? 1, " ", (post.replyCount ?? 1) === 1 ? 'reply' : 'replies'] })] })] })] }));
    }
    function MiniEventRow({ item, cardBg, surfaceBg, borderColor, textColor, mutedColor, accentColor, isDark, }) {
        const highlightBg = isDark ? 'rgba(124,45,18,0.28)' : '#FFF7ED';
        const highlightBorder = isDark ? '#7C2D12' : '#FFE0C2';
        const pillBg = item.highlight ? (isDark ? '#1F1F1F' : '#FFFFFF') : surfaceBg;
        return (_jsxs(react_native_1.Pressable, { onPress: item.onPress, style: {
                flexDirection: 'row',
                gap: 12,
                padding: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: item.highlight ? highlightBorder : borderColor,
                backgroundColor: item.highlight ? highlightBg : cardBg,
            }, children: [_jsxs(react_native_1.View, { style: {
                        width: 44,
                        height: 50,
                        borderRadius: 10,
                        backgroundColor: pillBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 9.5, color: accentColor, letterSpacing: 0.6 }, children: item.month }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 18, lineHeight: 20, color: textColor }, children: item.day })] }), _jsxs(react_native_1.View, { style: { flex: 1, minWidth: 0, justifyContent: 'center', gap: 2 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: textColor }, numberOfLines: 1, children: item.title }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: mutedColor }, numberOfLines: 1, children: item.subtitle })] })] }));
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
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            },
            function (react_native_svg_1_1) {
                react_native_svg_1 = react_native_svg_1_1;
            },
            function (posthog_react_native_1_1) {
                posthog_react_native_1 = posthog_react_native_1_1;
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (useApiData_1_1) {
                useApiData_1 = useApiData_1_1;
            },
            function (connect_1_1) {
                connect_1 = connect_1_1;
            }
        ],
        execute: function () {
            FALLBACK_WEEK_ITEMS = [
                {
                    id: 'mock-week-1',
                    month: 'MAY',
                    day: '8',
                    title: 'Gurudev Jayanti, Annual Music',
                    subtitle: '5:00 PM · Chinmaya-Saaket',
                    highlight: false,
                },
                {
                    id: 'mock-week-2',
                    month: 'MAY',
                    day: '9',
                    title: 'Chinmaya Gita Samarpanam',
                    subtitle: '9:00 AM · Online',
                    highlight: true,
                },
                {
                    id: 'mock-week-3',
                    month: 'MAY',
                    day: '10',
                    title: "Mother's Day Celebration",
                    subtitle: '9:20 AM · Chinmaya Mission',
                    highlight: false,
                },
            ];
        }
    };
});
