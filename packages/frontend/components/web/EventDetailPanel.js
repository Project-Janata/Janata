System.register(["react/jsx-runtime", "react", "react-native", "lucide-react-native", "../ui/CopyLinkButton", "../ui/Badge", "../ui/UnderlineTabBar", "../ui/Avatar", "../ui/buttons/PrimaryButton", "../ui/buttons/DestructiveButton", "../../hooks/useDetailColors", "../../components/connect", "../../components/contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, lucide_react_native_1, CopyLinkButton_1, Badge_1, UnderlineTabBar_1, Avatar_1, PrimaryButton_1, DestructiveButton_1, useDetailColors_1, connect_1, contexts_1;
    var __moduleName = context_1 && context_1.id;
    // ---------------------------------------------------------------------------
    // Date helpers
    // ---------------------------------------------------------------------------
    /** Format date + time into "In X hours, 2/27 7:45 PM PST" or "3 days ago, 2/24 7:45 PM PST" */
    function formatRelativeDateTime(dateStr, timeStr) {
        // Parse the start time from the time string (e.g. "10:30 AM - 11:30 AM" → "10:30 AM")
        const startTime = timeStr.split(' - ')[0] || timeStr;
        // Build a full Date object
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
        // Relative part
        let relative;
        const minutes = Math.floor(absDiffMs / 60000);
        const hours = Math.floor(absDiffMs / 3600000);
        const days = Math.floor(absDiffMs / 86400000);
        if (minutes < 1) {
            relative = 'Now';
        }
        else if (minutes < 60) {
            relative = isFuture ? `In ${minutes}m` : `${minutes}m ago`;
        }
        else if (hours < 24) {
            relative = isFuture ? `In ${hours}h` : `${hours}h ago`;
        }
        else if (days < 7) {
            relative = isFuture ? `In ${days}d` : `${days}d ago`;
        }
        else {
            relative = isFuture ? `In ${days}d` : `${days}d ago`;
        }
        // Absolute part — "2/27 7:45 PM PST"
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
        if (isNaN(d.getTime()))
            return dateStr.toUpperCase();
        const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        return `${weekday}, ${month} ${d.getDate()}`;
    }
    // ---------------------------------------------------------------------------
    // Sub-components
    // ---------------------------------------------------------------------------
    /** 32px icon box used in meta rows */
    function MetaIcon({ icon: Icon, color, colors, }) {
        return (_jsx(react_native_1.View, { style: {
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: colors.iconBoxBg,
                alignItems: 'center',
                justifyContent: 'center',
            }, children: _jsx(Icon, { size: 18, color: color }) }));
    }
    /** Small overlapping avatar stack (max 3 shown) */
    function AvatarStack({ attendees, colors }) {
        const shown = attendees.slice(0, 3);
        return (_jsx(react_native_1.View, { className: "flex-row", style: { marginLeft: 4 }, children: shown.map((a, i) => (_jsx(Avatar_1.default, { image: a.image, initials: a.initials, name: a.name, size: 24, style: {
                    borderWidth: 2,
                    borderColor: colors.avatarBorder,
                    marginLeft: i === 0 ? 0 : -8,
                } }, i))) }));
    }
    // ---------------------------------------------------------------------------
    // Header bar
    // ---------------------------------------------------------------------------
    function HeaderBar({ title, isPast, isRegistered, isAdmin, eventId, onClose, onEdit, onDelete, colors, }) {
        return (_jsxs(react_native_1.View, { style: {
                paddingHorizontal: 16,
                paddingTop: 14,
                paddingBottom: 12,
                borderBottomWidth: isRegistered ? 0 : 1,
                borderBottomColor: colors.border,
                gap: 10,
            }, children: [_jsxs(react_native_1.View, { className: "flex-row items-center", style: { justifyContent: 'space-between' }, children: [_jsxs(react_native_1.Pressable, { onPress: onClose, className: "flex-row items-center", style: { gap: 4, padding: 8, minHeight: 44, minWidth: 44 }, accessibilityLabel: "Close panel", children: [_jsx(lucide_react_native_1.ChevronLeft, { size: 20, color: colors.iconHeader }), _jsx(react_native_1.Text, { style: {
                                        fontFamily: 'Inclusive Sans',
                                        fontSize: 14,
                                        color: colors.iconHeader,
                                    }, children: "Back" })] }), _jsxs(react_native_1.View, { className: "flex-row items-center", style: { gap: 4 }, children: [eventId && _jsx(CopyLinkButton_1.default, { path: `/events/${eventId}`, variant: "icon", color: colors.iconHeader }), eventId && onEdit && (_jsx(react_native_1.Pressable, { onPress: () => onEdit(eventId), style: { padding: 8, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }, accessibilityLabel: "Edit event", children: _jsx(lucide_react_native_1.Pencil, { size: 18, color: colors.iconHeader }) })), eventId && onDelete && (_jsx(react_native_1.Pressable, { onPress: () => onDelete(eventId), style: { padding: 8, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }, accessibilityLabel: "Delete event", children: _jsx(lucide_react_native_1.Trash2, { size: 18, color: "#DC2626" }) }))] })] }), _jsxs(react_native_1.View, { className: "flex-row items-start", style: { gap: 10 }, children: [_jsx(react_native_1.Text, { style: {
                                flex: 1,
                                fontFamily: 'Inclusive Sans',
                                fontSize: 20,
                                color: colors.text,
                                lineHeight: 26,
                            }, children: title }), isRegistered && (_jsx(react_native_1.View, { style: { marginTop: 3 }, children: _jsx(Badge_1.default, { label: "Going", variant: "going" }) }))] })] }));
    }
    // ---------------------------------------------------------------------------
    // Hero image (default + past states)
    // ---------------------------------------------------------------------------
    function HeroImage({ uri, isPast, isRegistered, }) {
        if (!uri)
            return null;
        return (_jsxs(react_native_1.View, { style: { width: '100%', height: 200, position: 'relative' }, children: [_jsx(react_native_1.Image, { source: { uri }, style: {
                        width: '100%',
                        height: 200,
                        opacity: isPast ? 0.75 : 1,
                    }, resizeMode: "cover" }), isPast && (_jsx(react_native_1.View, { style: {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.15)',
                    } })), _jsx(react_native_1.View, { style: { position: 'absolute', bottom: 16, left: 16 }, children: _jsx(Badge_1.default, { label: isPast ? 'Past Event' : 'Upcoming', variant: isPast ? 'past' : 'upcoming' }) })] }));
    }
    // ---------------------------------------------------------------------------
    // Meta rows section
    // ---------------------------------------------------------------------------
    function MetaSection({ event, attendees, isPast, colors, }) {
        const iconColor = isPast ? colors.textMuted : '#E8862A';
        const attendLabel = `${event.attendees} on Janata`;
        return (_jsxs(react_native_1.View, { style: { gap: 16 }, children: [(() => {
                    const loc = (event.location || '').trim();
                    const addr = (event.address || '').trim();
                    const dupe = loc && addr && loc === addr;
                    const line1 = dupe ? splitStreet(addr) : loc;
                    const line2 = dupe ? splitRest(addr) : addr;
                    return (_jsxs(react_native_1.View, { className: "flex-row", style: { gap: 12, alignItems: 'flex-start' }, children: [_jsx(MetaIcon, { icon: lucide_react_native_1.MapPin, color: iconColor, colors: colors }), _jsxs(react_native_1.View, { style: { flex: 1, gap: 2 }, children: [line1 && (_jsx(react_native_1.Text, { style: {
                                            fontFamily: 'Inclusive Sans',
                                            fontSize: 14,
                                            color: colors.text,
                                        }, children: line1 })), line2 && (_jsx(react_native_1.Text, { style: {
                                            fontFamily: 'Inclusive Sans',
                                            fontSize: 13,
                                            color: colors.textSecondary,
                                        }, children: line2 }))] })] }));
                })(), !(event.signupUrl && !event.allowJanataSignup) && (_jsxs(react_native_1.View, { className: "flex-row items-center", style: { gap: 12 }, children: [_jsx(MetaIcon, { icon: lucide_react_native_1.Users, color: iconColor, colors: colors }), _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans',
                                fontSize: 14,
                                color: colors.text,
                            }, children: attendLabel }), _jsx(AvatarStack, { attendees: attendees, colors: colors })] })), event.pointOfContact && (_jsxs(react_native_1.View, { className: "flex-row items-center", style: { gap: 12 }, children: [_jsx(MetaIcon, { icon: lucide_react_native_1.User, color: iconColor, colors: colors }), _jsxs(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans',
                                fontSize: 14,
                                color: colors.text,
                            }, children: ["Contact: ", event.pointOfContact] })] })), event.externalUrl && (_jsxs(react_native_1.Pressable, { onPress: () => react_native_1.Linking.openURL(event.externalUrl), className: "flex-row items-center", style: { gap: 12, minHeight: 44 }, children: [_jsx(MetaIcon, { icon: lucide_react_native_1.ExternalLink, color: iconColor, colors: colors }), _jsxs(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans',
                                fontSize: 14,
                                color: '#E8862A',
                                flex: 1,
                            }, numberOfLines: 1, children: ["Visit official page \u00B7 ", hostnameOf(event.externalUrl)] })] }))] }));
    }
    // ---------------------------------------------------------------------------
    // About section
    // ---------------------------------------------------------------------------
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
    // ---------------------------------------------------------------------------
    // "You attended" banner (past state)
    // ---------------------------------------------------------------------------
    function AttendedBanner({ count, colors }) {
        return (_jsxs(react_native_1.View, { style: {
                backgroundColor: colors.attendedBg,
                borderRadius: 8,
                padding: 12,
                paddingHorizontal: 16,
                gap: 4,
            }, children: [_jsxs(react_native_1.View, { className: "flex-row items-center", style: { gap: 8 }, children: [_jsx(lucide_react_native_1.CheckCircle, { size: 18, color: "#059669" }), _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans',
                                fontSize: 14,
                                color: '#059669',
                            }, children: "You attended this event" })] }), count > 1 && (_jsxs(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: 12,
                        color: '#059669',
                        marginLeft: 26,
                    }, children: ["Along with ", count - 1, " others"] }))] }));
    }
    // ---------------------------------------------------------------------------
    // People tab content
    // ---------------------------------------------------------------------------
    function PeopleTab({ attendees, colors }) {
        return (_jsxs(react_native_1.View, { style: { paddingHorizontal: 24, paddingTop: 16 }, children: [_jsxs(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: 13,
                        color: colors.textSecondary,
                        marginBottom: 12,
                    }, children: [attendees.length, " ", attendees.length === 1 ? 'person' : 'people', " on Janata"] }), attendees.length === 0 ? (_jsxs(react_native_1.View, { style: { alignItems: 'center', paddingTop: 32, gap: 8 }, children: [_jsx(lucide_react_native_1.Users, { size: 32, color: colors.textMuted }), _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans',
                                fontSize: 14,
                                color: colors.textSecondary,
                            }, children: "No attendees yet" })] })) : (_jsx(react_native_1.View, { style: { gap: 4 }, children: attendees.map((a, i) => (_jsxs(react_native_1.View, { className: "flex-row items-center", style: { paddingVertical: 12, gap: 12 }, children: [_jsx(Avatar_1.default, { image: a.image, initials: a.initials, name: a.name, size: 42 }), _jsxs(react_native_1.View, { style: { flex: 1, gap: 2 }, children: [_jsx(react_native_1.Text, { style: {
                                            fontFamily: 'Inclusive Sans',
                                            fontSize: 14,
                                            color: colors.text,
                                        }, children: a.name }), _jsx(react_native_1.Text, { style: {
                                            fontFamily: 'Inclusive Sans',
                                            fontSize: 12,
                                            color: colors.textSecondary,
                                        }, children: a.subtitle })] }), i === 0 && (_jsx(Badge_1.default, { label: "HOST", variant: "host" }))] }, i))) }))] }));
    }
    // ---------------------------------------------------------------------------
    // Default content (unregistered / past)
    // ---------------------------------------------------------------------------
    function DefaultContent({ event, attendees, isPast, colors, }) {
        return (_jsxs(react_native_1.ScrollView, { style: { flex: 1 }, contentContainerStyle: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, gap: 20 }, showsVerticalScrollIndicator: false, children: [isPast && event.isRegistered && (_jsx(AttendedBanner, { count: event.attendees, colors: colors })), _jsxs(react_native_1.View, { className: "flex-row items-center", style: { gap: 12 }, children: [_jsx(MetaIcon, { icon: lucide_react_native_1.Clock, color: isPast ? colors.textMuted : '#E8862A', colors: colors }), _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans',
                                fontSize: 14,
                                color: colors.text,
                            }, children: formatRelativeDateTime(event.date, event.time) })] }), _jsx(MetaSection, { event: event, attendees: attendees, isPast: isPast, colors: colors }), event.description && (_jsx(AboutSection, { description: event.description, colors: colors }))] }));
    }
    // ---------------------------------------------------------------------------
    // Registered content (with tabs)
    // ---------------------------------------------------------------------------
    function RegisteredContent({ event, attendees, colors, canPostToThread, }) {
        const [activeTab, setActiveTab] = react_1.useState('Details');
        const eventBoard = connect_1.buildEventBoard({
            id: event.id,
            title: event.title,
            dateLabel: formatEventDateLabel(event.date),
            centerLabel: event.location,
            attendeesLabel: `${event.attendees} going`,
        });
        return (_jsxs(react_native_1.View, { style: { flex: 1 }, children: [_jsx(react_native_1.View, { style: { paddingTop: 8 }, children: _jsx(UnderlineTabBar_1.default, { tabs: ['Details', 'Thread', 'People'], activeTab: activeTab, onTabChange: setActiveTab, counts: { Thread: eventBoard.messages.length } }) }), _jsxs(react_native_1.ScrollView, { style: { flex: 1 }, showsVerticalScrollIndicator: false, children: [activeTab === 'Details' && (_jsxs(react_native_1.View, { style: {
                                paddingHorizontal: 24,
                                paddingTop: 20,
                                paddingBottom: 24,
                                gap: 20,
                            }, children: [_jsxs(react_native_1.View, { className: "flex-row items-center", style: { gap: 12 }, children: [_jsx(MetaIcon, { icon: lucide_react_native_1.Clock, color: "#E8862A", colors: colors }), _jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 14,
                                                color: colors.text,
                                            }, children: formatRelativeDateTime(event.date, event.time) })] }), _jsx(MetaSection, { event: event, attendees: attendees, colors: colors }), event.description && (_jsx(AboutSection, { description: event.description, colors: colors }))] })), activeTab === 'Thread' && (_jsx(connect_1.ThreadPanel, { messages: eventBoard.messages, colors: colors, emptyTitle: "Be the first to post", emptySubtitle: `Ask about carpooling, what to bring, or anything else for the ${event.attendees} people going.`, composerPlaceholder: "Write to the group...", composerState: canPostToThread ? 'open' : 'locked' })), activeTab === 'People' && _jsx(PeopleTab, { attendees: attendees, colors: colors })] })] }));
    }
    // ---------------------------------------------------------------------------
    // Action bar (sticky bottom)
    // ---------------------------------------------------------------------------
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
    function ActionBar({ isRegistered, isPast, onToggleRegistration, isToggling, signupUrl, allowJanataSignup, colors, }) {
        if (isPast)
            return null;
        // External signup is set + admin opted into letting users RSVP on Janata
        // too. Janata is primary, external is the alternate.
        if (signupUrl && allowJanataSignup) {
            return (_jsxs(react_native_1.View, { style: {
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    padding: 16,
                    backgroundColor: colors.panelBg,
                    gap: 8,
                }, children: [isRegistered ? (_jsx(DestructiveButton_1.default, { onPress: onToggleRegistration, disabled: isToggling, loading: isToggling, children: "Cancel Registration" })) : (_jsx(PrimaryButton_1.default, { onPress: onToggleRegistration, disabled: isToggling, loading: isToggling, children: "Attend on Janata" })), _jsx(react_native_1.Pressable, { onPress: () => react_native_1.Linking.openURL(signupUrl), style: {
                            paddingVertical: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }, accessibilityLabel: `Sign up at ${hostnameOf(signupUrl)}`, children: _jsxs(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans',
                                fontSize: 14,
                                color: '#E8862A',
                            }, children: ["Or sign up at ", hostnameOf(signupUrl)] }) })] }));
        }
        // External signup is exclusive. We're just a referrer.
        if (signupUrl) {
            return (_jsxs(react_native_1.View, { style: {
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    padding: 16,
                    backgroundColor: colors.panelBg,
                }, children: [_jsxs(PrimaryButton_1.default, { onPress: () => react_native_1.Linking.openURL(signupUrl), children: ["Sign up at ", hostnameOf(signupUrl)] }), _jsx(react_native_1.Text, { style: {
                            fontFamily: 'Inclusive Sans',
                            fontSize: 12,
                            color: colors.textMuted,
                            textAlign: 'center',
                            marginTop: 8,
                        }, children: "Registration handled on the official site" })] }));
        }
        if (isRegistered) {
            return (_jsx(react_native_1.View, { style: {
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    padding: 16,
                    backgroundColor: colors.panelBg,
                }, children: _jsx(DestructiveButton_1.default, { onPress: onToggleRegistration, disabled: isToggling, loading: isToggling, children: "Cancel Registration" }) }));
        }
        return (_jsxs(react_native_1.View, { style: {
                borderTopWidth: 1,
                borderTopColor: colors.border,
                padding: 16,
                backgroundColor: colors.panelBg,
            }, children: [_jsx(PrimaryButton_1.default, { onPress: onToggleRegistration, disabled: isToggling, loading: isToggling, children: "Attend Event" }), _jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: 12,
                        color: colors.textMuted,
                        textAlign: 'center',
                        marginTop: 8,
                    }, children: "Free \u00B7 No registration required" })] }));
    }
    // ---------------------------------------------------------------------------
    // Main component
    // ---------------------------------------------------------------------------
    function EventDetailPanel({ event, attendees, isPast, isAdmin, onClose, onToggleRegistration, isToggling, onEdit, onDelete, }) {
        const colors = useDetailColors_1.useDetailColors();
        const { user } = contexts_1.useUser();
        const isRegistered = event.isRegistered && !isPast;
        const canPostToThread = !!user?.isVerified;
        return (_jsxs(react_native_1.View, { style: {
                maxWidth: 440,
                width: '100%',
                height: '100%',
                backgroundColor: colors.panelBg,
                borderLeftWidth: 1,
                borderLeftColor: colors.border,
                flexDirection: 'column',
            }, children: [_jsx(HeaderBar, { title: event.title, isPast: isPast, isRegistered: isRegistered, isAdmin: isAdmin, eventId: event.id, onClose: onClose, onEdit: onEdit, onDelete: onDelete, colors: colors }), !isRegistered && (_jsx(HeroImage, { uri: event.image, isPast: isPast, isRegistered: isRegistered })), isRegistered ? (_jsx(RegisteredContent, { event: event, attendees: attendees, colors: colors, canPostToThread: canPostToThread })) : (_jsx(DefaultContent, { event: event, attendees: attendees, isPast: isPast, colors: colors })), _jsx(ActionBar, { isRegistered: isRegistered, isPast: isPast, onToggleRegistration: onToggleRegistration, isToggling: isToggling, signupUrl: event.signupUrl, allowJanataSignup: event.allowJanataSignup, colors: colors })] }));
    }
    exports_1("default", EventDetailPanel);
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
            function (Badge_1_1) {
                Badge_1 = Badge_1_1;
            },
            function (UnderlineTabBar_1_1) {
                UnderlineTabBar_1 = UnderlineTabBar_1_1;
            },
            function (Avatar_1_1) {
                Avatar_1 = Avatar_1_1;
            },
            function (PrimaryButton_1_1) {
                PrimaryButton_1 = PrimaryButton_1_1;
            },
            function (DestructiveButton_1_1) {
                DestructiveButton_1 = DestructiveButton_1_1;
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
