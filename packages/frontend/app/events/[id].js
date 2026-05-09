System.register(["react/jsx-runtime", "react", "react-native", "../../components/ui/Skeleton", "react-native-safe-area-context", "expo-router", "lucide-react-native", "posthog-react-native", "../../hooks/useApiData", "../../components/contexts", "../../components/ui", "../../hooks/useDetailColors", "../../utils/api", "../../components/connect"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, Skeleton_1, react_native_safe_area_context_1, expo_router_1, lucide_react_native_1, posthog_react_native_1, useApiData_1, contexts_1, ui_1, useDetailColors_1, api_1, connect_1, ADMIN_EMAIL;
    var __moduleName = context_1 && context_1.id;
    // ── Helpers ──────────────────────────────────────────────────────────────
    /** Format date + time into "In X hours · 2/27 7:45 PM PST" */
    function formatRelativeDateTime(dateStr, timeStr) {
        const startTime = timeStr.split(' - ')[0] || timeStr;
        const match = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        let eventDate;
        if (match) {
            let hours = parseInt(match[1], 10);
            const minutes = parseInt(match[2], 10);
            const ampm = match[3].toUpperCase();
            if (ampm === 'PM' && hours !== 12)
                hours += 12;
            if (ampm === 'AM' && hours === 12)
                hours = 0;
            eventDate = new Date(dateStr + 'T00:00:00');
            eventDate.setHours(hours, minutes, 0, 0);
        }
        else {
            eventDate = new Date(dateStr + 'T12:00:00');
        }
        const now = new Date();
        const diffMs = eventDate.getTime() - now.getTime();
        const absDiffMs = Math.abs(diffMs);
        const isFuture = diffMs > 0;
        let relative;
        const mins = Math.floor(absDiffMs / 60000);
        const hrs = Math.floor(absDiffMs / 3600000);
        const days = Math.floor(absDiffMs / 86400000);
        if (mins < 1) {
            relative = 'Now';
        }
        else if (mins < 60) {
            relative = isFuture ? `In ${mins}m` : `${mins}m ago`;
        }
        else if (hrs < 24) {
            relative = isFuture ? `In ${hrs}h` : `${hrs}h ago`;
        }
        else {
            relative = isFuture ? `In ${days}d` : `${days}d ago`;
        }
        const month = eventDate.getMonth() + 1;
        const day = eventDate.getDate();
        const timeFormatted = eventDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short',
        });
        const absolute = `${month}/${day} ${timeFormatted}`;
        if (relative === 'Now')
            return `Now · ${absolute}`;
        return `${relative} · ${absolute}`;
    }
    function formatEventDateLabel(dateStr) {
        const d = new Date(`${dateStr}T00:00:00`);
        if (Number.isNaN(d.getTime()))
            return dateStr.toUpperCase();
        const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        return `${weekday}, ${month} ${d.getDate()}`;
    }
    // ── Sub-components ───────────────────────────────────────────────────────
    function MetaIcon({ icon: Icon, color, colors, }) {
        return (_jsx(react_native_1.View, { style: {
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.iconBoxBg,
                justifyContent: 'center',
                alignItems: 'center',
            }, children: _jsx(Icon, { size: 18, color: color }) }));
    }
    function AvatarStack({ attendees, colors, }) {
        const shown = attendees.slice(0, 3);
        return (_jsx(react_native_1.View, { style: { flexDirection: 'row', marginLeft: 4 }, children: shown.map((a, i) => (_jsx(ui_1.Avatar, { image: a.image, initials: a.initials, name: a.name, size: 24, style: {
                    borderWidth: 2,
                    borderColor: colors.avatarBorder,
                    marginLeft: i === 0 ? 0 : -8,
                } }, i))) }));
    }
    // ── Header ───────────────────────────────────────────────────────────────
    function HeaderBar({ title, isPast, isRegistered, isAdmin, eventId, onBack, onEdit, onDelete, colors, }) {
        const router = expo_router_1.useRouter();
        return (_jsxs(react_native_1.View, { style: {
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 12,
                borderBottomWidth: isRegistered ? 0 : 1,
                borderBottomColor: colors.border,
                gap: 10,
            }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs(react_native_1.Pressable, { onPress: onBack, style: {
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                padding: 8,
                                minHeight: 44,
                                minWidth: 44,
                            }, children: [_jsx(lucide_react_native_1.ChevronLeft, { size: 20, color: colors.iconHeader }), _jsx(react_native_1.Text, { style: {
                                        fontFamily: 'Inclusive Sans',
                                        fontSize: 14,
                                        color: colors.iconHeader,
                                    }, children: "Back" })] }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 4 }, children: [eventId && !isPast && isAdmin && (_jsx(react_native_1.Pressable, { onPress: () => {
                                        onEdit?.();
                                        router.push(`/events/form?id=${eventId}`);
                                    }, style: {
                                        padding: 8,
                                        minHeight: 44,
                                        minWidth: 44,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }, accessibilityLabel: "Edit event", children: _jsx(lucide_react_native_1.Pencil, { size: 18, color: colors.iconHeader }) })), eventId && isAdmin && onDelete && (_jsx(react_native_1.Pressable, { onPress: onDelete, style: {
                                        padding: 8,
                                        minHeight: 44,
                                        minWidth: 44,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }, accessibilityLabel: "Delete event", children: _jsx(lucide_react_native_1.Trash2, { size: 18, color: "#DC2626" }) })), !isPast && (_jsx(react_native_1.Pressable, { onPress: () => {
                                        const url = eventId ? `https://chinmayajanata.org/events/${eventId}` : 'https://chinmayajanata.org';
                                        react_native_1.Share.share({
                                            message: `Check out ${title} on Chinmaya Janata! ${url}`,
                                            url,
                                        }).catch(() => { });
                                    }, style: {
                                        padding: 8,
                                        minHeight: 44,
                                        minWidth: 44,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }, children: _jsx(lucide_react_native_1.Share2, { size: 18, color: colors.iconHeader }) }))] })] }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, children: [_jsx(react_native_1.Text, { style: {
                                flex: 1,
                                fontFamily: 'Inclusive Sans',
                                fontSize: 20,
                                color: colors.text,
                                lineHeight: 26,
                            }, children: title }), isRegistered && (_jsx(react_native_1.View, { style: { marginTop: 3 }, children: _jsx(ui_1.Badge, { label: "Going", variant: "going" }) }))] })] }));
    }
    // ── Meta section ─────────────────────────────────────────────────────────
    function MetaSection({ event, attendees, isPast, colors, }) {
        const iconColor = isPast ? colors.textMuted : '#E8862A';
        const attendLabel = `${event.attendees} on Janata`;
        return (_jsxs(react_native_1.View, { style: { gap: 16 }, children: [(() => {
                    const loc = (event.location || '').trim();
                    const addr = (event.address || '').trim();
                    const dupe = loc && addr && loc === addr;
                    const line1 = dupe ? splitStreet(addr) : loc;
                    const line2 = dupe ? splitRest(addr) : addr;
                    return (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, children: [_jsx(MetaIcon, { icon: lucide_react_native_1.MapPin, color: iconColor, colors: colors }), _jsxs(react_native_1.View, { style: { flex: 1, gap: 2, justifyContent: 'center' }, children: [line1 ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }, children: line1 })) : null, line2 ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }, children: line2 })) : null] })] }));
                })(), !(event.signupUrl && !event.allowJanataSignup) && (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 12 }, children: [_jsx(MetaIcon, { icon: lucide_react_native_1.Users, color: iconColor, colors: colors }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }, children: attendLabel }), _jsx(AvatarStack, { attendees: attendees, colors: colors })] })), event.pointOfContact ? (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 12 }, children: [_jsx(MetaIcon, { icon: lucide_react_native_1.User, color: iconColor, colors: colors }), _jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }, children: ["Contact: ", event.pointOfContact] })] })) : null] }));
    }
    // ── About section ────────────────────────────────────────────────────────
    function AboutSection({ description, colors }) {
        if (!description)
            return null;
        return (_jsxs(react_native_1.View, { style: { gap: 12 }, children: [_jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: 11,
                        color: colors.textMuted,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                    }, children: "About" }), _jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: 14,
                        color: colors.textSecondary,
                        lineHeight: 20,
                    }, children: description })] }));
    }
    // ── Attended banner ──────────────────────────────────────────────────────
    function AttendedBanner({ count, colors }) {
        return (_jsxs(react_native_1.View, { style: {
                backgroundColor: colors.attendedBg,
                borderRadius: 8,
                padding: 12,
                paddingHorizontal: 16,
                gap: 4,
            }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8 }, children: [_jsx(lucide_react_native_1.CheckCircle, { size: 18, color: "#059669" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: '#059669' }, children: "You attended this event" })] }), count > 1 && (_jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: '#059669', marginLeft: 26 }, children: ["Along with ", count - 1, " others"] }))] }));
    }
    // ── Action bar ───────────────────────────────────────────────────────────
    // Split an address like "129 Woodbury Rd, Woodbury, NY - 11797, US" into
    // the street segment ("129 Woodbury Rd") and the rest ("Woodbury, NY - 11797, US")
    // using the first comma as the boundary.
    function splitStreet(addr) {
        const i = addr.indexOf(',');
        return i === -1 ? addr : addr.slice(0, i).trim();
    }
    function splitRest(addr) {
        const i = addr.indexOf(',');
        return i === -1 ? '' : addr.slice(i + 1).trim();
    }
    function hostnameOf(url) {
        try {
            return new URL(url).hostname.replace(/^www\./, '');
        }
        catch {
            return 'official site';
        }
    }
    function ActionBar({ isRegistered, isPast, onToggle, isToggling, signupUrl, allowJanataSignup, colors, }) {
        if (isPast)
            return null;
        const wrapperStyle = {
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 28,
            backgroundColor: colors.panelBg,
        };
        // External signup + admin opted into Janata as alternate. Janata primary,
        // external secondary.
        if (signupUrl && allowJanataSignup) {
            return (_jsxs(react_native_1.View, { style: { ...wrapperStyle, gap: 8 }, children: [isRegistered ? (_jsx(ui_1.DestructiveButton, { onPress: onToggle, disabled: isToggling, loading: isToggling, children: "Cancel Registration" })) : (_jsx(ui_1.PrimaryButton, { onPress: onToggle, disabled: isToggling, loading: isToggling, children: "Attend on Janata" })), _jsx(react_native_1.Pressable, { onPress: () => react_native_1.Linking.openURL(signupUrl), style: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }, accessibilityLabel: `Sign up at ${hostnameOf(signupUrl)}`, children: _jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: '#E8862A' }, children: ["Or sign up at ", hostnameOf(signupUrl)] }) })] }));
        }
        // External signup is exclusive.
        if (signupUrl) {
            return (_jsxs(react_native_1.View, { style: wrapperStyle, children: [_jsxs(ui_1.PrimaryButton, { onPress: () => react_native_1.Linking.openURL(signupUrl), children: ["Sign up at ", hostnameOf(signupUrl)] }), _jsx(react_native_1.Text, { style: {
                            fontFamily: 'Inclusive Sans',
                            fontSize: 12,
                            color: colors.textMuted,
                            textAlign: 'center',
                            marginTop: 8,
                        }, children: "Registration handled on the official site" })] }));
        }
        if (isRegistered) {
            return (_jsx(react_native_1.View, { style: wrapperStyle, children: _jsx(ui_1.DestructiveButton, { onPress: onToggle, disabled: isToggling, loading: isToggling, children: "Cancel Registration" }) }));
        }
        return (_jsxs(react_native_1.View, { style: wrapperStyle, children: [_jsx(ui_1.PrimaryButton, { onPress: onToggle, disabled: isToggling, loading: isToggling, children: "Attend Event" }), _jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: 12,
                        color: colors.textMuted,
                        textAlign: 'center',
                        marginTop: 8,
                    }, children: "Free \u00B7 No registration required" })] }));
    }
    // ── Main component ───────────────────────────────────────────────────────
    function EventDetailPage() {
        const { id: rawId } = expo_router_1.useLocalSearchParams();
        const id = Array.isArray(rawId) ? rawId[0] : rawId;
        const router = expo_router_1.useRouter();
        const posthog = posthog_react_native_1.usePostHog();
        const userContext = contexts_1.useUser();
        const { user, authStatus } = userContext;
        const [activeTab, setActiveTab] = react_1.useState('Details');
        const username = authStatus === 'authenticated' ? user?.username : undefined;
        const userId = authStatus === 'authenticated' ? user?.id : undefined;
        const { event, attendees, loading, toggleRegistration, isToggling, isCreator } = useApiData_1.useEventDetail(id, username, userId);
        const colors = useDetailColors_1.useDetailColors();
        const hasTrackedView = react_1.useRef(false);
        const isAdmin = user?.email === ADMIN_EMAIL || (user?.verificationLevel !== undefined && user.verificationLevel >= 107);
        const canEdit = isAdmin || isCreator;
        const isPast = event?.date ? new Date(event.date + 'T23:59:59') < new Date() : false;
        // Track event viewed
        react_1.useEffect(() => {
            if (!loading && event && !hasTrackedView.current) {
                hasTrackedView.current = true;
                posthog?.capture('event_viewed', { eventId: id, title: event.title, isPast });
            }
        }, [loading, event, id, isPast, posthog]);
        const handleTabChange = (newTab) => {
            posthog?.capture('event_tab_changed', { tab: newTab, eventId: id });
            setActiveTab(newTab);
        };
        const handleEditPress = () => {
            posthog?.capture('event_edit_opened', { eventId: id });
        };
        const handleDeletePress = () => {
            if (!event)
                return;
            react_native_1.Alert.alert('Delete event?', `"${event.title}" will be permanently removed. This cannot be undone.`, [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            posthog?.capture('event_deleted', { eventId: id });
                            await api_1.removeEvent(id);
                            router.replace('/');
                        }
                        catch (err) {
                            react_native_1.Alert.alert('Delete failed', err?.message || 'Could not delete event.');
                        }
                    },
                },
            ]);
        };
        const handleToggleRegistration = async () => {
            if (!user?.username)
                return;
            try {
                posthog?.capture(event?.isRegistered ? 'event_unregistered' : 'event_registered', { eventId: id });
                await toggleRegistration(user.username);
            }
            catch (err) {
                const message = err?.message || '';
                posthog?.capture('event_registration_failed', { eventId: id, error: message });
                if (message.includes('Already registered')) {
                    react_native_1.Alert.alert('Already Registered', 'You are already registered for this event.');
                }
                else if (message.includes('Not registered')) {
                    react_native_1.Alert.alert('Not Registered', 'You are not registered for this event.');
                }
                else {
                    react_native_1.Alert.alert('Error', 'Failed to update registration. Please try again.');
                }
            }
        };
        // ── Loading state ────────────────────────────────────────────────────
        if (loading) {
            return (_jsx(react_native_safe_area_context_1.SafeAreaView, { style: { flex: 1, backgroundColor: colors.panelBg }, children: _jsx(Skeleton_1.DetailSkeleton, {}) }));
        }
        // ── Not-found state ──────────────────────────────────────────────────
        if (!event) {
            return (_jsx(react_native_safe_area_context_1.SafeAreaView, { style: { flex: 1, backgroundColor: colors.panelBg }, children: _jsxs(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }, children: [_jsx(react_native_1.Text, { style: {
                                fontSize: 22,
                                fontFamily: 'Inclusive Sans',
                                color: colors.text,
                                marginBottom: 16,
                            }, children: "Event not found" }), _jsx(react_native_1.Pressable, { onPress: () => router.back(), style: { marginTop: 8, minHeight: 44, justifyContent: 'center' }, children: _jsx(react_native_1.Text, { style: { fontSize: 16, fontFamily: 'Inclusive Sans', color: '#E8862A' }, children: "Go Back" }) })] }) }));
        }
        // ── Derived state ────────────────────────────────────────────────────
        const isRegistered = !!event?.isRegistered && !isPast;
        const canPostToThread = !!user?.isVerified;
        const eventBoard = connect_1.buildEventBoard({
            id: event.id,
            title: event.title,
            dateLabel: formatEventDateLabel(event.date),
            centerLabel: event.location,
            attendeesLabel: `${event.attendees} going`,
        });
        // ── Registered state (with tabs) ─────────────────────────────────────
        if (isRegistered) {
            return (_jsxs(react_native_safe_area_context_1.SafeAreaView, { style: { flex: 1, backgroundColor: colors.panelBg }, children: [_jsx(HeaderBar, { title: event.title, isPast: false, isRegistered: true, isAdmin: canEdit, eventId: id, onBack: () => router.back(), onEdit: handleEditPress, onDelete: canEdit ? handleDeletePress : undefined, colors: colors }), _jsx(react_native_1.View, { style: { paddingTop: 8 }, children: _jsx(ui_1.UnderlineTabBar, { tabs: ['Details', 'Thread', 'People'], activeTab: activeTab, onTabChange: handleTabChange, counts: { Thread: eventBoard.messages.length } }) }), _jsxs(react_native_1.ScrollView, { style: { flex: 1 }, contentContainerStyle: { paddingBottom: 100 }, showsVerticalScrollIndicator: false, children: [activeTab === 'Details' && (_jsxs(react_native_1.View, { style: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, gap: 20 }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 12 }, children: [_jsx(MetaIcon, { icon: lucide_react_native_1.Clock, color: "#E8862A", colors: colors }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }, children: formatRelativeDateTime(event.date, event.time) })] }), _jsx(MetaSection, { event: event, attendees: attendees, colors: colors }), _jsx(AboutSection, { description: event.description, colors: colors })] })), activeTab === 'People' && (_jsxs(react_native_1.View, { style: { paddingTop: 16, paddingHorizontal: 20 }, children: [_jsxs(react_native_1.Text, { style: {
                                            fontFamily: 'Inclusive Sans',
                                            fontSize: 13,
                                            color: colors.textSecondary,
                                            marginBottom: 12,
                                        }, children: [event.attendees, " ", event.attendees === 1 ? 'person' : 'people', " on Janata"] }), attendees.length > 0 ? (attendees.map((attendee, index) => (_jsxs(react_native_1.View, { style: {
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 12,
                                            gap: 12,
                                        }, children: [_jsx(ui_1.Avatar, { image: attendee.image, initials: attendee.initials, name: attendee.name, size: 42 }), _jsxs(react_native_1.View, { style: { flex: 1, gap: 2 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }, children: attendee.name }), attendee.subtitle ? (_jsx(react_native_1.Text, { style: {
                                                            fontFamily: 'Inclusive Sans',
                                                            fontSize: 12,
                                                            color: colors.textSecondary,
                                                        }, children: attendee.subtitle })) : null] }), index === 0 && _jsx(ui_1.Badge, { label: "HOST", variant: "host" })] }, index)))) : (_jsxs(react_native_1.View, { style: { alignItems: 'center', paddingVertical: 32 }, children: [_jsx(lucide_react_native_1.Users, { size: 48, color: colors.textMuted }), _jsx(react_native_1.Text, { style: {
                                                    fontFamily: 'Inclusive Sans',
                                                    fontSize: 14,
                                                    color: colors.textSecondary,
                                                    marginTop: 12,
                                                }, children: "No attendees yet" })] }))] })), activeTab === 'Thread' && (_jsx(connect_1.ThreadPanel, { messages: eventBoard.messages, colors: colors, emptyTitle: "Be the first to post", emptySubtitle: `Ask about carpooling, what to bring, or anything else for the ${event.attendees} people going.`, composerPlaceholder: "Write to the group...", composerState: canPostToThread ? 'open' : 'locked' }))] }), _jsx(ActionBar, { isRegistered: true, onToggle: handleToggleRegistration, isToggling: isToggling, signupUrl: event.signupUrl, allowJanataSignup: event.allowJanataSignup, colors: colors })] }));
        }
        // ── Default / past state ─────────────────────────────────────────────
        return (_jsxs(react_native_safe_area_context_1.SafeAreaView, { style: { flex: 1, backgroundColor: colors.panelBg }, children: [_jsx(HeaderBar, { title: event.title, isPast: isPast, isAdmin: canEdit, eventId: id, onBack: () => router.back(), onEdit: handleEditPress, onDelete: canEdit ? handleDeletePress : undefined, colors: colors }), event.image ? (_jsxs(react_native_1.View, { style: { width: '100%', height: 200, position: 'relative' }, children: [_jsx(react_native_1.Image, { source: { uri: event.image }, style: { width: '100%', height: 200, opacity: isPast ? 0.75 : 1 }, resizeMode: "cover" }), isPast && (_jsx(react_native_1.View, { style: {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.15)',
                            } })), _jsx(react_native_1.View, { style: { position: 'absolute', bottom: 16, left: 16 }, children: _jsx(ui_1.Badge, { label: isPast ? 'Past Event' : 'Upcoming', variant: isPast ? 'past' : 'upcoming' }) })] })) : null, _jsx(react_native_1.View, { style: { paddingTop: 8 }, children: _jsx(ui_1.UnderlineTabBar, { tabs: ['Details', 'Thread', 'Attendees'], activeTab: activeTab, onTabChange: handleTabChange, counts: { Thread: eventBoard.messages.length } }) }), _jsxs(react_native_1.ScrollView, { style: { flex: 1 }, contentContainerStyle: {
                        paddingHorizontal: 20,
                        paddingTop: 20,
                        paddingBottom: isPast ? 40 : 100,
                        gap: 20,
                    }, showsVerticalScrollIndicator: false, children: [activeTab === 'Details' && (_jsxs(_Fragment, { children: [isPast && isRegistered && _jsx(AttendedBanner, { count: event.attendees, colors: colors }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 12 }, children: [_jsx(MetaIcon, { icon: lucide_react_native_1.Clock, color: isPast ? colors.textMuted : '#E8862A', colors: colors }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }, children: formatRelativeDateTime(event.date, event.time) })] }), _jsx(MetaSection, { event: event, attendees: attendees, isPast: isPast, colors: colors }), _jsx(AboutSection, { description: event.description, colors: colors })] })), activeTab === 'Thread' && (_jsx(connect_1.ThreadPanel, { messages: eventBoard.messages, colors: colors, emptyTitle: "Be the first to post", emptySubtitle: `Ask about carpooling, what to bring, or anything else for the ${event.attendees} people going.`, composerPlaceholder: "Write to the group...", composerState: canPostToThread ? 'open' : 'locked' })), activeTab === 'Attendees' && (_jsx(react_native_1.View, { style: { paddingTop: 8 }, children: attendees.length > 0 ? (attendees.map((attendee, index) => (_jsxs(react_native_1.View, { style: {
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingVertical: 12,
                                    gap: 12,
                                }, children: [_jsx(ui_1.Avatar, { image: attendee.image, initials: attendee.initials, name: attendee.name, size: 42 }), _jsxs(react_native_1.View, { style: { flex: 1, gap: 2 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }, children: attendee.name }), attendee.subtitle ? (_jsx(react_native_1.Text, { style: {
                                                    fontFamily: 'Inclusive Sans',
                                                    fontSize: 12,
                                                    color: colors.textSecondary,
                                                }, children: attendee.subtitle })) : null] }), index === 0 && _jsx(ui_1.Badge, { label: "HOST", variant: "host" })] }, index)))) : (_jsxs(react_native_1.View, { style: { alignItems: 'center', paddingVertical: 32 }, children: [_jsx(lucide_react_native_1.Users, { size: 48, color: colors.textMuted }), _jsx(react_native_1.Text, { style: {
                                            fontFamily: 'Inclusive Sans',
                                            fontSize: 14,
                                            color: colors.textSecondary,
                                            marginTop: 12,
                                        }, children: "No attendees yet" })] })) }))] }), _jsx(ActionBar, { isRegistered: isRegistered, isPast: isPast, onToggle: handleToggleRegistration, isToggling: isToggling, signupUrl: event.signupUrl, allowJanataSignup: event.allowJanataSignup, colors: colors })] }));
    }
    exports_1("default", EventDetailPage);
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
            function (Skeleton_1_1) {
                Skeleton_1 = Skeleton_1_1;
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
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            },
            function (useDetailColors_1_1) {
                useDetailColors_1 = useDetailColors_1_1;
            },
            function (api_1_1) {
                api_1 = api_1_1;
            },
            function (connect_1_1) {
                connect_1 = connect_1_1;
            }
        ],
        execute: function () {
            ADMIN_EMAIL = 'chinmayajanata@gmail.com';
        }
    };
});
