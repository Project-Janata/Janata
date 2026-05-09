System.register(["react/jsx-runtime", "react", "../../components/ui/Skeleton", "react-native", "react-native-safe-area-context", "expo-router", "lucide-react-native", "posthog-react-native", "../../hooks/useApiData", "../../components/ui", "../../hooks/useDetailColors", "../../components/connect", "../../components/contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, Skeleton_1, react_native_1, react_native_safe_area_context_1, expo_router_1, lucide_react_native_1, posthog_react_native_1, useApiData_1, ui_1, useDetailColors_1, connect_1, contexts_1;
    var __moduleName = context_1 && context_1.id;
    // ── Helpers ─────────────────────────────────────────────────────────────
    function formatDateCallout(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime()))
            return { month: '', day: '' };
        const month = d
            .toLocaleDateString('en-US', { month: 'short' })
            .toUpperCase();
        const day = String(d.getDate());
        return { month, day };
    }
    // ── Sub-components ──────────────────────────────────────────────────────
    function MetaIcon({ icon: Icon, color, colors, }) {
        return (_jsx(react_native_1.View, { style: {
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.iconBoxBg,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }, children: _jsx(Icon, { size: 18, color: color }) }));
    }
    // ── Header ──────────────────────────────────────────────────────────────
    function HeaderBar({ title, onBack, onShare, colors, memberCount = 0, isVerified = false, }) {
        return (_jsxs(react_native_1.View, { style: {
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                gap: 10,
            }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs(react_native_1.Pressable, { onPress: onBack, style: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8, minHeight: 44, minWidth: 44 }, children: [_jsx(lucide_react_native_1.ChevronLeft, { size: 20, color: colors.iconHeader }), _jsx(react_native_1.Text, { style: {
                                        fontFamily: 'Inclusive Sans',
                                        fontSize: 14,
                                        color: colors.iconHeader,
                                    }, children: "Back" })] }), _jsx(react_native_1.Pressable, { onPress: onShare, style: { padding: 8, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }, children: _jsx(lucide_react_native_1.Share2, { size: 18, color: colors.iconHeader }) })] }), _jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: 20,
                        color: colors.text,
                        lineHeight: 26,
                    }, children: title }), (memberCount > 0 || isVerified) && (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }, children: [memberCount > 0 && (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 4 }, children: [_jsx(lucide_react_native_1.Users, { size: 13, color: colors.textSecondary }), _jsxs(react_native_1.Text, { style: {
                                        fontFamily: 'Inclusive Sans',
                                        fontSize: 13,
                                        color: colors.textSecondary,
                                    }, children: [memberCount, " ", memberCount === 1 ? 'member' : 'members'] })] })), memberCount > 0 && isVerified && (_jsx(react_native_1.Text, { style: { fontSize: 13, color: colors.textMuted }, children: "\u00B7" })), isVerified && (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 4 }, children: [_jsx(lucide_react_native_1.BadgeCheck, { size: 13, color: "#E8862A" }), _jsx(react_native_1.Text, { style: {
                                        fontFamily: 'Inclusive Sans',
                                        fontSize: 13,
                                        color: '#E8862A',
                                    }, children: "Verified" })] }))] }))] }));
    }
    // ── Main page component ─────────────────────────────────────────────────
    function CenterDetailPage() {
        const { id: rawId } = expo_router_1.useLocalSearchParams();
        const id = Array.isArray(rawId) ? rawId[0] : rawId;
        const router = expo_router_1.useRouter();
        const posthog = posthog_react_native_1.usePostHog();
        const { user } = contexts_1.useUser();
        const { center, events, loading } = useApiData_1.useCenterDetail(id);
        const colors = useDetailColors_1.useDetailColors();
        const [activeTab, setActiveTab] = react_1.useState('About');
        react_1.useEffect(() => {
            if (!loading && center) {
                posthog?.capture('center_viewed', { centerId: id, name: center.name });
            }
        }, [loading, center, id, posthog]);
        const handleEventPress = (event) => {
            posthog?.capture('center_event_pressed', { centerId: id, eventId: event.id });
            router.push(`/events/${event.id}`);
        };
        const handleShare = async () => {
            posthog?.capture('center_shared', { centerId: id });
            try {
                const url = id ? `https://chinmayajanata.org/center/${id}` : 'https://chinmayajanata.org';
                await react_native_1.Share.share({
                    message: center ? `Check out ${center.name} on Chinmaya Janata! ${url}` : `Check out this center on Chinmaya Janata! ${url}`,
                    url,
                });
            }
            catch {
                // Share cancelled or failed
            }
        };
        const handleAddressPress = () => {
            if (!center?.address)
                return;
            posthog?.capture('center_address_pressed', { centerId: id });
            react_native_1.Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(center.address)}`);
        };
        const handleWebsitePress = () => {
            if (!center?.website)
                return;
            posthog?.capture('center_website_pressed', { centerId: id });
            const url = center.website.startsWith('http')
                ? center.website
                : `https://${center.website}`;
            react_native_1.Linking.openURL(url);
        };
        const handlePhonePress = () => {
            if (!center?.phone)
                return;
            posthog?.capture('center_phone_pressed', { centerId: id });
            react_native_1.Linking.openURL(`tel:${center.phone}`);
        };
        if (loading) {
            return (_jsx(react_native_safe_area_context_1.SafeAreaView, { style: { flex: 1, backgroundColor: colors.panelBg }, edges: ['top'], children: _jsx(Skeleton_1.DetailSkeleton, {}) }));
        }
        if (!center) {
            return (_jsx(react_native_safe_area_context_1.SafeAreaView, { style: { flex: 1, backgroundColor: colors.panelBg }, edges: ['top'], children: _jsxs(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }, children: [_jsx(react_native_1.Text, { style: { fontSize: 22, fontFamily: 'Inclusive Sans', color: colors.text, marginBottom: 16 }, children: "Center not found" }), _jsx(react_native_1.Pressable, { onPress: () => router.back(), style: { marginTop: 8, minHeight: 44, justifyContent: 'center' }, children: _jsx(react_native_1.Text, { style: { fontSize: 16, fontFamily: 'Inclusive Sans', color: '#E8862A' }, children: "Go Back" }) })] }) }));
        }
        // Strip protocol for website display
        const displayWebsite = (center.website ?? '')
            .replace(/^https?:\/\//, '')
            .replace(/\/$/, '');
        const board = connect_1.buildCenterBoard({
            id: center.id,
            centerName: center.name,
            subtitle: `Ask about rides, seva, and announcements for ${center.name}.`,
        });
        const canPostToThread = !!user?.isVerified;
        return (_jsxs(react_native_safe_area_context_1.SafeAreaView, { style: { flex: 1, backgroundColor: colors.panelBg }, edges: ['top'], children: [_jsx(HeaderBar, { title: center.name, onBack: () => router.back(), onShare: handleShare, colors: colors, memberCount: center.memberCount, isVerified: center.isVerified }), _jsxs(react_native_1.ScrollView, { style: { flex: 1 }, contentContainerStyle: { paddingBottom: 40 }, showsVerticalScrollIndicator: false, children: [center.image ? (_jsx(react_native_1.Image, { source: { uri: center.image }, style: { width: '100%', height: 200 }, resizeMode: "cover" })) : null, _jsx(react_native_1.View, { style: { paddingTop: 8 }, children: _jsx(ui_1.UnderlineTabBar, { tabs: ['About', 'Thread', 'Events'], activeTab: activeTab, onTabChange: setActiveTab, counts: { Thread: board.messages.length, Events: events.length } }) }), _jsxs(react_native_1.View, { style: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }, children: [activeTab === 'About' && (_jsxs(_Fragment, { children: [center.pointOfContact ? (_jsxs(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 13,
                                                color: colors.textSecondary,
                                                marginBottom: 16,
                                            }, children: ["Point of Contact: ", center.pointOfContact] })) : null, _jsxs(react_native_1.View, { style: { gap: 16 }, children: [center.address ? (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, children: [_jsx(MetaIcon, { icon: lucide_react_native_1.MapPin, color: "#E8862A", colors: colors }), _jsxs(react_native_1.View, { style: { flex: 1, gap: 8 }, children: [_jsx(react_native_1.Text, { style: {
                                                                        fontFamily: 'Inclusive Sans',
                                                                        fontSize: 14,
                                                                        color: colors.text,
                                                                        lineHeight: 20,
                                                                    }, children: center.address }), _jsx(react_native_1.Pressable, { onPress: handleAddressPress, style: { alignSelf: 'flex-start', paddingVertical: 4 }, accessibilityLabel: "Get directions", children: _jsx(react_native_1.Text, { style: {
                                                                            fontFamily: 'Inclusive Sans',
                                                                            fontSize: 14,
                                                                            color: '#E8862A',
                                                                        }, children: "Get directions \u2192" }) })] })] })) : null, center.website ? (_jsxs(react_native_1.Pressable, { onPress: handleWebsitePress, style: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }, children: [_jsx(MetaIcon, { icon: lucide_react_native_1.Globe, color: "#E8862A", colors: colors }), _jsx(react_native_1.Text, { style: {
                                                                fontFamily: 'Inclusive Sans',
                                                                fontSize: 14,
                                                                color: '#E8862A',
                                                                lineHeight: 20,
                                                                flex: 1,
                                                            }, numberOfLines: 1, children: displayWebsite })] })) : null, center.phone ? (_jsxs(react_native_1.Pressable, { onPress: handlePhonePress, style: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }, children: [_jsx(MetaIcon, { icon: lucide_react_native_1.Phone, color: "#E8862A", colors: colors }), _jsx(react_native_1.Text, { style: {
                                                                fontFamily: 'Inclusive Sans',
                                                                fontSize: 14,
                                                                color: colors.text,
                                                                lineHeight: 20,
                                                                flex: 1,
                                                            }, children: center.phone })] })) : null, center.acharya ? (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, children: [_jsx(MetaIcon, { icon: lucide_react_native_1.User, color: "#E8862A", colors: colors }), _jsxs(react_native_1.View, { style: { flex: 1, justifyContent: 'center' }, children: [_jsx(react_native_1.Text, { style: {
                                                                        fontFamily: 'Inclusive Sans',
                                                                        fontSize: 14,
                                                                        color: colors.text,
                                                                        lineHeight: 20,
                                                                    }, children: center.acharya }), _jsx(react_native_1.Text, { style: {
                                                                        fontFamily: 'Inclusive Sans',
                                                                        fontSize: 13,
                                                                        color: colors.textSecondary,
                                                                        lineHeight: 18,
                                                                        marginTop: 2,
                                                                    }, children: "Resident Acharya" })] })] })) : null] })] })), activeTab === 'Thread' && (_jsx(connect_1.ThreadPanel, { messages: board.messages, colors: colors, emptyTitle: "Be the first to post", emptySubtitle: `Ask about rides, what to bring, or anything else for ${center.name}.`, composerPlaceholder: "Write to the board...", composerState: canPostToThread ? 'open' : 'locked' })), activeTab === 'Events' && (_jsx(_Fragment, { children: events.length > 0 ? (_jsx(react_native_1.View, { style: { gap: 8 }, children: events.map((event) => {
                                            const { month, day } = formatDateCallout(event.date);
                                            return (_jsxs(react_native_1.Pressable, { onPress: () => handleEventPress(event), style: {
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    backgroundColor: colors.cardBg,
                                                    borderRadius: 8,
                                                    paddingVertical: 12,
                                                    paddingHorizontal: 14,
                                                    minHeight: 44,
                                                }, children: [_jsxs(react_native_1.View, { style: {
                                                            width: 52,
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0,
                                                        }, children: [_jsx(react_native_1.Text, { style: {
                                                                    fontFamily: 'Inclusive Sans',
                                                                    fontSize: 11,
                                                                    color: '#E8862A',
                                                                    textTransform: 'uppercase',
                                                                    lineHeight: 14,
                                                                }, children: month }), _jsx(react_native_1.Text, { style: {
                                                                    fontFamily: 'Inclusive Sans',
                                                                    fontSize: 22,
                                                                    color: colors.text,
                                                                    lineHeight: 28,
                                                                }, children: day })] }), _jsx(react_native_1.View, { style: {
                                                            width: 1,
                                                            backgroundColor: colors.border,
                                                            alignSelf: 'stretch',
                                                            marginHorizontal: 12,
                                                        } }), _jsxs(react_native_1.View, { style: { flex: 1 }, children: [_jsx(react_native_1.Text, { style: {
                                                                    fontFamily: 'Inclusive Sans',
                                                                    fontSize: 14,
                                                                    color: colors.text,
                                                                    lineHeight: 20,
                                                                }, numberOfLines: 2, children: event.title }), _jsxs(react_native_1.Text, { style: {
                                                                    fontFamily: 'Inclusive Sans',
                                                                    fontSize: 12,
                                                                    color: colors.textSecondary,
                                                                    lineHeight: 16,
                                                                    marginTop: 2,
                                                                }, children: [event.time, event.attendees > 0 ? ` \u00B7 ${event.attendees} attending` : ''] })] })] }, event.id));
                                        }) })) : (_jsx(react_native_1.View, { style: { alignItems: 'center', paddingVertical: 32 }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.textSecondary }, children: "No upcoming events yet" }) })) }))] })] })] }));
    }
    exports_1("default", CenterDetailPage);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (Skeleton_1_1) {
                Skeleton_1 = Skeleton_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (react_native_safe_area_context_1_1) {
                react_native_safe_area_context_1 = react_native_safe_area_context_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            },
            function (posthog_react_native_1_1) {
                posthog_react_native_1 = posthog_react_native_1_1;
            },
            function (useApiData_1_1) {
                useApiData_1 = useApiData_1_1;
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            },
            function (useDetailColors_1_1) {
                useDetailColors_1 = useDetailColors_1_1;
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
