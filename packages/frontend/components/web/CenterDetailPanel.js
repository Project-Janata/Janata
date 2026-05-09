System.register(["react/jsx-runtime", "react", "react-native", "lucide-react-native", "../ui/CopyLinkButton", "../ui/UnderlineTabBar", "../../hooks/useDetailColors", "../../components/connect", "../../components/contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, lucide_react_native_1, CopyLinkButton_1, UnderlineTabBar_1, useDetailColors_1, connect_1, contexts_1;
    var __moduleName = context_1 && context_1.id;
    // ── Date helper ──────────────────────────────────────────────────────────
    function formatDateCallout(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        const month = d
            .toLocaleDateString('en-US', { month: 'short' })
            .toUpperCase();
        const day = String(d.getDate());
        return { month, day };
    }
    // ── Component ────────────────────────────────────────────────────────────
    function CenterDetailPanel({ center, events, onClose, onEventPress, }) {
        const colors = useDetailColors_1.useDetailColors();
        const { user } = contexts_1.useUser();
        const [activeTab, setActiveTab] = react_1.useState('About');
        const handleAddressPress = () => {
            const query = encodeURIComponent(center.address);
            react_native_1.Linking.openURL(`https://maps.google.com/?q=${query}`);
        };
        const handleWebsitePress = () => {
            const url = center.website.startsWith('http')
                ? center.website
                : `https://${center.website}`;
            react_native_1.Linking.openURL(url);
        };
        const handlePhonePress = () => {
            react_native_1.Linking.openURL(`tel:${center.phone}`);
        };
        // Strip protocol for display
        const displayWebsite = center.website
            .replace(/^https?:\/\//, '')
            .replace(/\/$/, '');
        const board = connect_1.buildCenterBoard({
            id: center.id,
            centerName: center.name,
            subtitle: `Ask about rides, seva, and announcements for ${center.name}.`,
        });
        const canPostToThread = !!user?.isVerified;
        return (_jsxs(react_native_1.View, { style: {
                maxWidth: 440,
                width: '100%',
                height: '100%',
                backgroundColor: colors.panelBg,
                borderLeftWidth: 1,
                borderLeftColor: colors.border,
                flexDirection: 'column',
            }, children: [_jsxs(react_native_1.View, { style: {
                        paddingHorizontal: 16,
                        paddingTop: 14,
                        paddingBottom: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        gap: 10,
                    }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs(react_native_1.Pressable, { onPress: onClose, style: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8, minHeight: 44, minWidth: 44 }, accessibilityLabel: "Close panel", children: [_jsx(lucide_react_native_1.ChevronLeft, { size: 20, color: colors.iconHeader }), _jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 14,
                                                color: colors.iconHeader,
                                            }, children: "Back" })] }), _jsx(CopyLinkButton_1.default, { path: `/center/${center.id}`, color: colors.iconHeader })] }), _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans',
                                fontSize: 20,
                                color: colors.text,
                                lineHeight: 26,
                            }, children: center.name }), (center.memberCount > 0 || center.isVerified) && (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }, children: [center.memberCount > 0 && (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 4 }, children: [_jsx(lucide_react_native_1.Users, { size: 13, color: colors.textSecondary }), _jsxs(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 13,
                                                color: colors.textSecondary,
                                            }, children: [center.memberCount, " ", center.memberCount === 1 ? 'member' : 'members'] })] })), center.memberCount > 0 && center.isVerified && (_jsx(react_native_1.Text, { style: { fontSize: 13, color: colors.textMuted }, children: "\u00B7" })), center.isVerified && (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 4 }, children: [_jsx(lucide_react_native_1.BadgeCheck, { size: 13, color: "#E8862A" }), _jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 13,
                                                color: '#E8862A',
                                            }, children: "Verified" })] }))] }))] }), _jsxs(react_native_1.ScrollView, { style: { flex: 1 }, showsVerticalScrollIndicator: false, children: [_jsx(react_native_1.Image, { source: { uri: center.image }, style: { width: '100%', height: 200 }, resizeMode: "cover" }), _jsx(react_native_1.View, { style: { paddingTop: 8 }, children: _jsx(UnderlineTabBar_1.default, { tabs: ['About', 'Thread', 'Events'], activeTab: activeTab, onTabChange: setActiveTab, counts: { Thread: board.messages.length, Events: events.length } }) }), _jsxs(react_native_1.View, { style: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 }, children: [activeTab === 'About' && (_jsxs(_Fragment, { children: [center.pointOfContact ? (_jsxs(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 13,
                                                color: colors.textSecondary,
                                                marginBottom: 16,
                                            }, children: ["Point of Contact: ", center.pointOfContact] })) : null, _jsxs(react_native_1.View, { style: { gap: 16 }, children: [center.address ? (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, children: [_jsx(react_native_1.View, { style: {
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: 8,
                                                                backgroundColor: colors.iconBoxBg,
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0,
                                                            }, children: _jsx(lucide_react_native_1.MapPin, { size: 16, color: "#E8862A" }) }), _jsxs(react_native_1.View, { style: { flex: 1, gap: 8 }, children: [_jsx(react_native_1.Text, { style: {
                                                                        fontFamily: 'Inclusive Sans',
                                                                        fontSize: 14,
                                                                        color: colors.text,
                                                                        lineHeight: 20,
                                                                    }, children: center.address }), _jsx(react_native_1.Pressable, { onPress: handleAddressPress, style: { alignSelf: 'flex-start', paddingVertical: 4 }, accessibilityLabel: "Get directions", children: _jsx(react_native_1.Text, { style: {
                                                                            fontFamily: 'Inclusive Sans',
                                                                            fontSize: 14,
                                                                            color: '#E8862A',
                                                                        }, children: "Get directions \u2192" }) })] })] })) : null, center.website ? (_jsxs(react_native_1.Pressable, { onPress: handleWebsitePress, style: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }, children: [_jsx(react_native_1.View, { style: {
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: 8,
                                                                backgroundColor: colors.iconBoxBg,
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0,
                                                            }, children: _jsx(lucide_react_native_1.Globe, { size: 16, color: "#E8862A" }) }), _jsx(react_native_1.Text, { style: {
                                                                fontFamily: 'Inclusive Sans',
                                                                fontSize: 14,
                                                                color: '#E8862A',
                                                                lineHeight: 20,
                                                                flex: 1,
                                                            }, numberOfLines: 1, children: displayWebsite })] })) : null, center.phone ? (_jsxs(react_native_1.Pressable, { onPress: handlePhonePress, style: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }, children: [_jsx(react_native_1.View, { style: {
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: 8,
                                                                backgroundColor: colors.iconBoxBg,
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0,
                                                            }, children: _jsx(lucide_react_native_1.Phone, { size: 16, color: "#E8862A" }) }), _jsx(react_native_1.Text, { style: {
                                                                fontFamily: 'Inclusive Sans',
                                                                fontSize: 14,
                                                                color: colors.text,
                                                                lineHeight: 20,
                                                                flex: 1,
                                                            }, children: center.phone })] })) : null, center.acharya ? (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, children: [_jsx(react_native_1.View, { style: {
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: 8,
                                                                backgroundColor: colors.iconBoxBg,
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0,
                                                            }, children: _jsx(lucide_react_native_1.User, { size: 16, color: "#E8862A" }) }), _jsxs(react_native_1.View, { style: { flex: 1, justifyContent: 'center' }, children: [_jsx(react_native_1.Text, { style: {
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
                                            return (_jsxs(react_native_1.Pressable, { onPress: () => onEventPress(event.id), style: {
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
                                                                }, children: [event.time, " ", event.attendees > 0 ? `\u00B7 ${event.attendees} attending` : ''] })] })] }, event.id));
                                        }) })) : (_jsx(react_native_1.View, { style: { alignItems: 'center', paddingVertical: 32 }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.textSecondary }, children: "No upcoming events yet" }) })) }))] })] })] }));
    }
    exports_1("default", CenterDetailPanel);
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
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            },
            function (CopyLinkButton_1_1) {
                CopyLinkButton_1 = CopyLinkButton_1_1;
            },
            function (UnderlineTabBar_1_1) {
                UnderlineTabBar_1 = UnderlineTabBar_1_1;
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
