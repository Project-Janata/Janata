System.register(["react/jsx-runtime", "react", "react-native", "expo-router", "lucide-react-native", "../../components/contexts", "../../hooks/useApiData", "../../utils/api", "../../utils/admin", "../../components/ui/Avatar", "../../components/ui/Badge", "../../components/ui/UnderlineTabBar", "../../components/ui/buttons/PrimaryButton", "../../components/ui/buttons/DestructiveButton", "../../components/ui/AuthPromptModal", "../../hooks/useDetailColors", "../../components/connect"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, expo_router_1, lucide_react_native_1, contexts_1, useApiData_1, api_1, admin_1, Avatar_1, Badge_1, UnderlineTabBar_1, PrimaryButton_1, DestructiveButton_1, AuthPromptModal_1, useDetailColors_1, connect_1;
    var __moduleName = context_1 && context_1.id;
    function formatEventDateLabel(dateStr) {
        const d = new Date(`${dateStr}T00:00:00`);
        if (isNaN(d.getTime()))
            return dateStr.toUpperCase();
        const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        return `${weekday}, ${month} ${d.getDate()}`;
    }
    function EventDetailWeb() {
        const { id: rawId } = expo_router_1.useLocalSearchParams();
        const id = Array.isArray(rawId) ? rawId[0] : rawId;
        const router = expo_router_1.useRouter();
        const { width } = react_native_1.useWindowDimensions();
        const isMobile = width < 768;
        const initiallyMobile = react_1.useRef(isMobile);
        react_1.useEffect(() => {
            if (!initiallyMobile.current && id) {
                router.replace(`/?detail=event&id=${id}`);
            }
            else if (!id) {
                router.replace('/');
            }
        }, [id, router]);
        // On desktop, show loading while redirecting
        if (!isMobile) {
            return (_jsx(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center' }, children: _jsx(react_native_1.ActivityIndicator, { size: "large", color: "#E8862A" }) }));
        }
        // On mobile web, render full-screen event detail
        return _jsx(MobileEventDetail, { eventId: id || '' });
    }
    exports_1("default", EventDetailWeb);
    function MobileEventDetail({ eventId }) {
        const router = expo_router_1.useRouter();
        const { user } = contexts_1.useUser();
        const { event, loading, toggleRegistration, isToggling, attendees, isCreator } = useApiData_1.useEventDetail(eventId, user?.username, user?.id);
        const colors = useDetailColors_1.useDetailColors();
        const [activeTab, setActiveTab] = react_1.useState('Details');
        const [showAuthPrompt, setShowAuthPrompt] = react_1.useState(false);
        const [isDeleting, setIsDeleting] = react_1.useState(false);
        const isPast = event?.date ? new Date(event.date + 'T23:59:59') < new Date() : false;
        const canEdit = !!user && (admin_1.isSuperAdmin(user) || isCreator);
        const canPostToThread = !!user?.isVerified;
        const handleDelete = async () => {
            if (!event)
                return;
            const ok = typeof window !== 'undefined' && window.confirm(`Delete "${event.title}"? This cannot be undone.`);
            if (!ok)
                return;
            try {
                setIsDeleting(true);
                await api_1.removeEvent(event.id);
                router.replace('/');
            }
            catch (err) {
                window.alert(err?.message || 'Failed to delete event');
                setIsDeleting(false);
            }
        };
        if (loading) {
            return (_jsx(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.panelBg }, children: _jsx(react_native_1.ActivityIndicator, { size: "large", color: "#E8862A" }) }));
        }
        if (!event) {
            return (_jsxs(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.panelBg }, children: [_jsx(react_native_1.Text, { style: { color: colors.textSecondary, fontSize: 16 }, children: "Event not found" }), _jsx(react_native_1.Pressable, { onPress: () => router.back(), style: { marginTop: 16 }, children: _jsx(react_native_1.Text, { style: { color: '#E8862A', fontSize: 16 }, children: "Go back" }) })] }));
        }
        const eventBoard = connect_1.buildEventBoard({
            id: event.id,
            title: event.title,
            dateLabel: formatEventDateLabel(event.date),
            centerLabel: event.location,
            attendeesLabel: `${event.attendees} going`,
        });
        return (_jsxs(react_native_1.View, { style: { flex: 1, backgroundColor: colors.panelBg }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }, children: [_jsxs(react_native_1.Pressable, { onPress: () => router.back(), style: { flexDirection: 'row', alignItems: 'center', gap: 4 }, children: [_jsx(lucide_react_native_1.ChevronLeft, { size: 20, color: colors.textSecondary }), _jsx(react_native_1.Text, { style: { color: colors.textSecondary, fontSize: 16 }, children: "Back" })] }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 4 }, children: [canEdit && !isPast && (_jsx(react_native_1.Pressable, { onPress: () => router.push(`/events/form?id=${event.id}`), style: { padding: 8 }, accessibilityLabel: "Edit event", children: _jsx(lucide_react_native_1.Pencil, { size: 18, color: colors.textSecondary }) })), canEdit && (_jsx(react_native_1.Pressable, { onPress: handleDelete, disabled: isDeleting, style: { padding: 8, opacity: isDeleting ? 0.5 : 1 }, accessibilityLabel: "Delete event", children: _jsx(lucide_react_native_1.Trash2, { size: 18, color: "#DC2626" }) })), _jsx(react_native_1.Pressable, { onPress: () => {
                                        if (typeof navigator !== 'undefined' && navigator.share) {
                                            navigator.share({ title: event.title, text: `Check out ${event.title} on Chinmaya Janata!` }).catch(() => { });
                                        }
                                        else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                            navigator.clipboard.writeText(window.location.href);
                                        }
                                    }, style: { padding: 8 }, children: _jsx(lucide_react_native_1.Share2, { size: 18, color: colors.textSecondary }) })] })] }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 }, children: [_jsx(react_native_1.Text, { style: { fontSize: 22, fontWeight: 'bold', color: colors.text, flex: 1 }, children: event.title }), event.isRegistered && _jsx(Badge_1.default, { label: "Going", variant: "going" })] }), _jsx(UnderlineTabBar_1.default, { tabs: ['Details', 'Thread', 'People'], activeTab: activeTab, onTabChange: setActiveTab, counts: { Thread: eventBoard.messages.length } }), _jsx(react_native_1.ScrollView, { style: { flex: 1 }, contentContainerStyle: { padding: 16, gap: 16 }, children: activeTab === 'Details' ? (_jsxs(_Fragment, { children: [event.date && (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 10 }, children: [_jsx(lucide_react_native_1.Clock, { size: 18, color: colors.textSecondary }), _jsxs(react_native_1.Text, { style: { color: colors.text, fontSize: 15 }, children: [new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }), event.time ? ` · ${event.time}` : ''] })] })), event.address && (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 10 }, children: [_jsx(lucide_react_native_1.MapPin, { size: 18, color: "#E8862A" }), _jsx(react_native_1.Text, { style: { color: colors.text, fontSize: 15 }, children: event.address })] })), !(event.signupUrl && !event.allowJanataSignup) && (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 10 }, children: [_jsx(lucide_react_native_1.Users, { size: 18, color: colors.textSecondary }), _jsxs(react_native_1.Text, { style: { color: colors.text, fontSize: 15 }, children: [event.attendees, " ", event.attendees === 1 ? 'person' : 'people', " attending"] })] })), event.pointOfContact && (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 10 }, children: [_jsx(lucide_react_native_1.User, { size: 18, color: colors.textSecondary }), _jsxs(react_native_1.Text, { style: { color: colors.text, fontSize: 15 }, children: ["Contact: ", event.pointOfContact] })] })), event.description && (_jsxs(react_native_1.View, { style: { marginTop: 8 }, children: [_jsx(react_native_1.Text, { style: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }, children: "ABOUT" }), _jsx(react_native_1.Text, { style: { color: colors.text, fontSize: 15, lineHeight: 22 }, children: event.description })] }))] })) : activeTab === 'Thread' ? (_jsx(connect_1.ThreadPanel, { messages: eventBoard.messages, colors: colors, emptyTitle: "Be the first to post", emptySubtitle: `Ask about carpooling, what to bring, or anything else for the ${event.attendees} people going.`, composerPlaceholder: "Write to the group...", composerState: canPostToThread ? 'open' : 'locked' })) : (_jsxs(_Fragment, { children: [_jsxs(react_native_1.Text, { style: { color: colors.textSecondary, fontSize: 14 }, children: [attendees.length, " ", attendees.length === 1 ? 'person' : 'people', " attending"] }), attendees.map((a) => (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }, children: [_jsx(Avatar_1.default, { name: a.name, size: 40, image: a.image }), _jsx(react_native_1.Text, { style: { color: colors.text, fontSize: 16, flex: 1 }, children: a.name })] }, a.name)))] })) }), !isPast && (_jsx(react_native_1.View, { style: { padding: 16, gap: 8 }, children: event.signupUrl && event.allowJanataSignup ? (_jsxs(_Fragment, { children: [event.isRegistered ? (_jsx(DestructiveButton_1.default, { onPress: () => user?.username && toggleRegistration(user.username), disabled: isToggling, loading: isToggling, children: "Cancel Registration" })) : (_jsx(PrimaryButton_1.default, { onPress: () => {
                                    if (!user) {
                                        setShowAuthPrompt(true);
                                    }
                                    else if (user.username) {
                                        toggleRegistration(user.username);
                                    }
                                }, disabled: isToggling, loading: isToggling, children: "Attend on Janata" })), _jsx(react_native_1.Pressable, { onPress: () => react_native_1.Linking.openURL(event.signupUrl), style: { paddingVertical: 12, alignItems: 'center' }, accessibilityLabel: `Sign up at ${hostnameOf(event.signupUrl)}`, children: _jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: '#E8862A' }, children: ["Or sign up at ", hostnameOf(event.signupUrl)] }) })] })) : event.signupUrl ? (_jsxs(_Fragment, { children: [_jsxs(PrimaryButton_1.default, { onPress: () => react_native_1.Linking.openURL(event.signupUrl), children: ["Sign up at ", hostnameOf(event.signupUrl)] }), _jsx(react_native_1.Text, { style: {
                                    fontFamily: 'Inclusive Sans',
                                    fontSize: 12,
                                    color: colors.textSecondary,
                                    textAlign: 'center',
                                    marginTop: 4,
                                }, children: "Registration handled on the official site" })] })) : event.isRegistered ? (_jsx(DestructiveButton_1.default, { onPress: () => user?.username && toggleRegistration(user.username), disabled: isToggling, loading: isToggling, children: "Cancel Registration" })) : (_jsx(PrimaryButton_1.default, { onPress: () => {
                            if (!user) {
                                setShowAuthPrompt(true);
                            }
                            else if (user.username) {
                                toggleRegistration(user.username);
                            }
                        }, disabled: isToggling, loading: isToggling, children: "Register" })) })), _jsx(AuthPromptModal_1.default, { visible: showAuthPrompt, onClose: () => setShowAuthPrompt(false), returnTo: `/events/${eventId}`, eventTitle: event?.title })] }));
    }
    function hostnameOf(url) {
        try {
            return new URL(url).hostname.replace(/^www\./, '');
        }
        catch {
            return url;
        }
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
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (useApiData_1_1) {
                useApiData_1 = useApiData_1_1;
            },
            function (api_1_1) {
                api_1 = api_1_1;
            },
            function (admin_1_1) {
                admin_1 = admin_1_1;
            },
            function (Avatar_1_1) {
                Avatar_1 = Avatar_1_1;
            },
            function (Badge_1_1) {
                Badge_1 = Badge_1_1;
            },
            function (UnderlineTabBar_1_1) {
                UnderlineTabBar_1 = UnderlineTabBar_1_1;
            },
            function (PrimaryButton_1_1) {
                PrimaryButton_1 = PrimaryButton_1_1;
            },
            function (DestructiveButton_1_1) {
                DestructiveButton_1 = DestructiveButton_1_1;
            },
            function (AuthPromptModal_1_1) {
                AuthPromptModal_1 = AuthPromptModal_1_1;
            },
            function (useDetailColors_1_1) {
                useDetailColors_1 = useDetailColors_1_1;
            },
            function (connect_1_1) {
                connect_1 = connect_1_1;
            }
        ],
        execute: function () {
        }
    };
});
