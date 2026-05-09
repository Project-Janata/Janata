System.register(["react/jsx-runtime", "react", "react-native", "expo-router", "lucide-react-native", "../../hooks/useApiData", "../../hooks/useDetailColors", "../../components/ui/UnderlineTabBar", "../../components/connect", "../../components/contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, expo_router_1, lucide_react_native_1, useApiData_1, useDetailColors_1, UnderlineTabBar_1, connect_1, contexts_1;
    var __moduleName = context_1 && context_1.id;
    function CenterDetailWeb() {
        const { id: rawId } = expo_router_1.useLocalSearchParams();
        const id = Array.isArray(rawId) ? rawId[0] : rawId;
        const router = expo_router_1.useRouter();
        const { width } = react_native_1.useWindowDimensions();
        const isMobile = width < 768;
        const initiallyMobile = react_1.useRef(isMobile);
        react_1.useEffect(() => {
            if (!initiallyMobile.current && id) {
                router.replace(`/?detail=center&id=${id}`);
            }
            else if (!id) {
                router.replace('/');
            }
        }, [id, router]);
        if (!isMobile) {
            return (_jsx(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center' }, children: _jsx(react_native_1.ActivityIndicator, { size: "large", color: "#E8862A" }) }));
        }
        return _jsx(MobileCenterDetail, { centerId: id || '' });
    }
    exports_1("default", CenterDetailWeb);
    function formatDateCallout(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime()))
            return { month: '', day: '' };
        const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const day = String(d.getDate());
        return { month, day };
    }
    function MobileCenterDetail({ centerId }) {
        const router = expo_router_1.useRouter();
        const { user } = contexts_1.useUser();
        const { center, events, loading } = useApiData_1.useCenterDetail(centerId);
        const colors = useDetailColors_1.useDetailColors();
        const [activeTab, setActiveTab] = react_1.useState('About');
        const handleShare = () => {
            if (typeof navigator !== 'undefined' && navigator.share) {
                navigator.share({ title: center?.name || 'Center', text: `Check out ${center?.name} on Chinmaya Janata!` }).catch(() => { });
            }
            else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
            }
        };
        const handleAddressPress = () => {
            if (!center?.address)
                return;
            react_native_1.Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(center.address)}`);
        };
        const handleWebsitePress = () => {
            if (!center?.website)
                return;
            const url = center.website.startsWith('http') ? center.website : `https://${center.website}`;
            react_native_1.Linking.openURL(url);
        };
        const handlePhonePress = () => {
            if (!center?.phone)
                return;
            react_native_1.Linking.openURL(`tel:${center.phone}`);
        };
        const handleEventPress = (event) => {
            router.push(`/events/${event.id}`);
        };
        if (loading) {
            return (_jsx(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.panelBg }, children: _jsx(react_native_1.ActivityIndicator, { size: "large", color: "#E8862A" }) }));
        }
        if (!center) {
            return (_jsxs(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.panelBg }, children: [_jsx(react_native_1.Text, { style: { color: colors.textSecondary, fontSize: 16 }, children: "Center not found" }), _jsx(react_native_1.Pressable, { onPress: () => router.back(), style: { marginTop: 16 }, children: _jsx(react_native_1.Text, { style: { color: '#E8862A', fontSize: 16 }, children: "Go back" }) })] }));
        }
        const displayWebsite = (center.website ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '');
        const board = connect_1.buildCenterBoard({
            id: center.id,
            centerName: center.name,
            subtitle: `Ask about rides, seva, and announcements for ${center.name}.`,
        });
        const canPostToThread = !!user?.isVerified;
        return (_jsxs(react_native_1.View, { style: { flex: 1, backgroundColor: colors.panelBg }, children: [_jsxs(react_native_1.View, { style: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 10 }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs(react_native_1.Pressable, { onPress: () => router.back(), style: { flexDirection: 'row', alignItems: 'center', gap: 4 }, children: [_jsx(lucide_react_native_1.ChevronLeft, { size: 20, color: colors.textSecondary }), _jsx(react_native_1.Text, { style: { color: colors.textSecondary, fontSize: 16 }, children: "Back" })] }), _jsx(react_native_1.Pressable, { onPress: handleShare, style: { padding: 8 }, children: _jsx(lucide_react_native_1.Share2, { size: 18, color: colors.textSecondary }) })] }), _jsx(react_native_1.Text, { style: { fontSize: 22, fontWeight: 'bold', color: colors.text }, children: center.name }), (center.memberCount > 0 || center.isVerified) && (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }, children: [center.memberCount > 0 && (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 4 }, children: [_jsx(lucide_react_native_1.Users, { size: 13, color: colors.textSecondary }), _jsxs(react_native_1.Text, { style: { fontSize: 13, color: colors.textSecondary }, children: [center.memberCount, " ", center.memberCount === 1 ? 'member' : 'members'] })] })), center.memberCount > 0 && center.isVerified && (_jsx(react_native_1.Text, { style: { fontSize: 13, color: colors.textMuted }, children: "\u00B7" })), center.isVerified && (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 4 }, children: [_jsx(lucide_react_native_1.BadgeCheck, { size: 13, color: "#E8862A" }), _jsx(react_native_1.Text, { style: { fontSize: 13, color: '#E8862A' }, children: "Verified" })] }))] }))] }), _jsxs(react_native_1.ScrollView, { style: { flex: 1 }, contentContainerStyle: { paddingBottom: 40 }, children: [center.image ? (_jsx(react_native_1.Image, { source: { uri: center.image }, style: { width: '100%', height: 200 }, resizeMode: "cover" })) : null, _jsx(react_native_1.View, { style: { paddingTop: 8 }, children: _jsx(UnderlineTabBar_1.default, { tabs: ['About', 'Thread', 'Events'], activeTab: activeTab, onTabChange: setActiveTab, counts: { Thread: board.messages.length, Events: events.length } }) }), _jsxs(react_native_1.View, { style: { paddingHorizontal: 16, paddingTop: 20, gap: 16 }, children: [activeTab === 'About' && (_jsxs(_Fragment, { children: [center.pointOfContact ? (_jsxs(react_native_1.Text, { style: { color: colors.textSecondary, fontSize: 13 }, children: ["Point of Contact: ", center.pointOfContact] })) : null, center.address ? (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, children: [_jsx(lucide_react_native_1.MapPin, { size: 18, color: "#E8862A", style: { marginTop: 2 } }), _jsxs(react_native_1.View, { style: { flex: 1, gap: 8 }, children: [_jsx(react_native_1.Text, { style: { color: colors.text, fontSize: 15 }, children: center.address }), _jsx(react_native_1.Pressable, { onPress: handleAddressPress, style: { alignSelf: 'flex-start', paddingVertical: 4 }, accessibilityLabel: "Get directions", children: _jsx(react_native_1.Text, { style: { color: '#E8862A', fontSize: 14, fontWeight: '600', fontFamily: 'Inclusive Sans' }, children: "Get directions \u2192" }) })] })] })) : null, center.website ? (_jsxs(react_native_1.Pressable, { onPress: handleWebsitePress, style: { flexDirection: 'row', alignItems: 'center', gap: 10 }, children: [_jsx(lucide_react_native_1.Globe, { size: 18, color: "#E8862A" }), _jsx(react_native_1.Text, { style: { color: '#E8862A', fontSize: 15, flex: 1 }, numberOfLines: 1, children: displayWebsite })] })) : null, center.phone ? (_jsxs(react_native_1.Pressable, { onPress: handlePhonePress, style: { flexDirection: 'row', alignItems: 'center', gap: 10 }, children: [_jsx(lucide_react_native_1.Phone, { size: 18, color: "#E8862A" }), _jsx(react_native_1.Text, { style: { color: colors.text, fontSize: 15, flex: 1 }, children: center.phone })] })) : null, center.acharya ? (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 10 }, children: [_jsx(lucide_react_native_1.User, { size: 18, color: "#E8862A" }), _jsxs(react_native_1.View, { style: { flex: 1 }, children: [_jsx(react_native_1.Text, { style: { color: colors.text, fontSize: 15 }, children: center.acharya }), _jsx(react_native_1.Text, { style: { color: colors.textSecondary, fontSize: 13 }, children: "Resident Acharya" })] })] })) : null] })), activeTab === 'Thread' && (_jsx(connect_1.ThreadPanel, { messages: board.messages, colors: colors, emptyTitle: "Be the first to post", emptySubtitle: `Ask about rides, what to bring, or anything else for ${center.name}.`, composerPlaceholder: "Write to the board...", composerState: canPostToThread ? 'open' : 'locked' })), activeTab === 'Events' && (_jsx(_Fragment, { children: events.length > 0 ? (_jsx(react_native_1.View, { style: { gap: 8 }, children: events.map((event) => {
                                            const { month, day } = formatDateCallout(event.date);
                                            return (_jsxs(react_native_1.Pressable, { onPress: () => handleEventPress(event), style: {
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    backgroundColor: colors.cardBg,
                                                    borderRadius: 8,
                                                    paddingVertical: 12,
                                                    paddingHorizontal: 14,
                                                }, children: [_jsxs(react_native_1.View, { style: { width: 52, alignItems: 'center' }, children: [_jsx(react_native_1.Text, { style: { fontSize: 11, fontWeight: '600', color: '#E8862A', textTransform: 'uppercase' }, children: month }), _jsx(react_native_1.Text, { style: { fontSize: 22, fontWeight: '600', color: colors.text }, children: day })] }), _jsx(react_native_1.View, { style: { width: 1, backgroundColor: colors.border, alignSelf: 'stretch', marginHorizontal: 12 } }), _jsxs(react_native_1.View, { style: { flex: 1 }, children: [_jsx(react_native_1.Text, { style: { fontSize: 14, fontWeight: '600', color: colors.text }, numberOfLines: 2, children: event.title }), _jsxs(react_native_1.Text, { style: { fontSize: 12, color: colors.textSecondary, marginTop: 2 }, children: [event.time, event.attendees > 0 ? ` · ${event.attendees} attending` : ''] })] })] }, event.id));
                                        }) })) : (_jsx(react_native_1.View, { style: { alignItems: 'center', paddingVertical: 32 }, children: _jsx(react_native_1.Text, { style: { fontSize: 14, color: colors.textSecondary }, children: "No upcoming events yet" }) })) }))] })] })] }));
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
            function (useApiData_1_1) {
                useApiData_1 = useApiData_1_1;
            },
            function (useDetailColors_1_1) {
                useDetailColors_1 = useDetailColors_1_1;
            },
            function (UnderlineTabBar_1_1) {
                UnderlineTabBar_1 = UnderlineTabBar_1_1;
            },
            function (connect_1_1) {
                connect_1 = connect_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            }
        ],
        execute: function () {
        }
    };
});
