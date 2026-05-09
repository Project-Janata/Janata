System.register(["react/jsx-runtime", "react", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, TAB_DURATION, FEATURES;
    var __moduleName = context_1 && context_1.id;
    function TabPill({ feature, isActive, onPress, cycleKey, }) {
        return (_jsxs(react_native_1.Pressable, { onPress: onPress, style: {
                backgroundColor: isActive ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.28)',
                borderRadius: 100,
                paddingHorizontal: 20,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                position: 'relative',
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.42)',
            }, children: [isActive && (_jsx("div", { style: {
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        height: 3,
                        backgroundColor: '#C2410C',
                        borderRadius: 2,
                        animation: `progressFill ${TAB_DURATION}ms linear forwards`,
                    } }, `prog-${cycleKey}`)), _jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans, sans-serif',
                        fontWeight: '600',
                        fontSize: 11,
                        color: isActive ? '#C2410C' : '#A8A29E',
                        letterSpacing: 0.5,
                    }, children: feature.number }), _jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans, sans-serif',
                        fontWeight: isActive ? '500' : '400',
                        fontSize: 14,
                        color: isActive ? '#292524' : '#78716C',
                    }, children: feature.title })] }));
    }
    // ─── App-like mockup visuals (light theme matching landing page) ───
    function MockupShell({ children }) {
        return (_jsx(react_native_1.View, { style: {
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: '0 4px 30px rgba(0,0,0,0.08)',
                borderWidth: 1,
                borderColor: '#E7E5E4',
                flex: 1,
                minHeight: 420,
            }, children: children }));
    }
    function MockupSearchBar() {
        return (_jsxs(react_native_1.View, { style: {
                flexDirection: 'row',
                alignItems: 'center',
                marginHorizontal: 16,
                marginBottom: 10,
                paddingHorizontal: 12,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#F3F4F6',
                gap: 8,
            }, children: [_jsx(react_native_1.View, { style: {
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        borderWidth: 1.5,
                        borderColor: '#9CA3AF',
                    } }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans, sans-serif', fontSize: 12, color: '#9CA3AF' }, children: "Search events and centers..." })] }));
    }
    function MockupFilterTabs({ active }) {
        const tabs = ['All', 'Going', 'Centers'];
        return (_jsx(react_native_1.View, { style: {
                flexDirection: 'row',
                marginHorizontal: 16,
                marginBottom: 12,
                gap: 0,
                borderBottomWidth: 1,
                borderBottomColor: '#E5E7EB',
            }, children: tabs.map((tab) => (_jsx(react_native_1.View, { style: {
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderBottomWidth: 2,
                    borderBottomColor: tab === active ? '#E8862A' : 'transparent',
                }, children: _jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans, sans-serif',
                        fontWeight: tab === active ? '600' : '400',
                        fontSize: 13,
                        color: tab === active ? '#E8862A' : '#9CA3AF',
                    }, children: tab }) }, tab))) }));
    }
    function MockupDragHandle() {
        return (_jsx(react_native_1.View, { style: { alignItems: 'center', paddingTop: 10, paddingBottom: 8 }, children: _jsx(react_native_1.View, { style: {
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: '#D1D5DB',
                } }) }));
    }
    function MockupDatePill({ month, day, accent }) {
        return (_jsxs(react_native_1.View, { style: {
                width: 44,
                height: 50,
                borderRadius: 12,
                backgroundColor: accent ? '#FFF7ED' : '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }, children: [_jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans, sans-serif',
                        fontWeight: '600',
                        fontSize: 9,
                        color: '#E8862A',
                        letterSpacing: 0.5,
                    }, children: month }), _jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans, sans-serif',
                        fontWeight: '700',
                        fontSize: 16,
                        color: '#1C1917',
                    }, children: day })] }));
    }
    function MockupAvatarDots({ count }) {
        const colors = ['#E8862A', '#78716C', '#A8A29E', '#D6D3D1'];
        return (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }, children: [_jsx(react_native_1.View, { style: { flexDirection: 'row' }, children: Array.from({ length: Math.min(count, 3) }).map((_, i) => (_jsx(react_native_1.View, { style: {
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: colors[i],
                            marginLeft: i === 0 ? 0 : -4,
                            borderWidth: 1.5,
                            borderColor: '#FFFFFF',
                        } }, i))) }), _jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans, sans-serif', fontSize: 10, color: '#A8A29E' }, children: [count, " going"] })] }));
    }
    function MockupEventItem({ month, day, title, time, location, attendees, isRegistered, delay, }) {
        return (_jsx("div", { style: { animation: `fadeSlideIn 0.3s ease-out ${delay || 0}ms both` }, children: _jsxs(react_native_1.View, { style: {
                    flexDirection: 'row',
                    gap: 10,
                    padding: 10,
                    borderRadius: 14,
                    backgroundColor: isRegistered ? '#FFF7ED' : 'transparent',
                }, children: [_jsx(MockupDatePill, { month: month, day: day, accent: isRegistered }), _jsxs(react_native_1.View, { style: { flex: 1, gap: 1 }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 6 }, children: [_jsx(react_native_1.Text, { style: {
                                            fontFamily: 'Inclusive Sans, sans-serif',
                                            fontWeight: '600',
                                            fontSize: 13,
                                            color: '#1C1917',
                                            flex: 1,
                                        }, numberOfLines: 1, children: title }), isRegistered && (_jsx(react_native_1.View, { style: {
                                            backgroundColor: 'rgba(232,134,42,0.15)',
                                            paddingHorizontal: 8,
                                            paddingVertical: 2,
                                            borderRadius: 6,
                                        }, children: _jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans, sans-serif',
                                                fontWeight: '500',
                                                fontSize: 9,
                                                color: '#E8862A',
                                            }, children: "Going" }) }))] }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans, sans-serif', fontSize: 11, color: '#78716C' }, children: time }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 }, children: [_jsx(react_native_1.View, { style: {
                                            width: 3,
                                            height: 3,
                                            borderRadius: 1.5,
                                            backgroundColor: '#E8862A',
                                        } }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans, sans-serif', fontSize: 10, color: '#78716C' }, numberOfLines: 1, children: location })] }), _jsx(MockupAvatarDots, { count: attendees })] })] }) }));
    }
    function MockupCenterItem({ name, distance, events, isMember, delay, }) {
        return (_jsx("div", { style: { animation: `fadeSlideIn 0.3s ease-out ${delay || 0}ms both` }, children: _jsxs(react_native_1.View, { style: {
                    flexDirection: 'row',
                    gap: 10,
                    padding: 10,
                    borderRadius: 14,
                    backgroundColor: isMember ? '#FFF7ED' : 'transparent',
                }, children: [_jsx(react_native_1.View, { style: {
                            width: 44,
                            height: 50,
                            borderRadius: 12,
                            backgroundColor: 'rgba(232,134,42,0.12)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }, children: _jsx(react_native_1.Text, { style: { fontSize: 18 }, children: "\uD83C\uDFDB" }) }), _jsxs(react_native_1.View, { style: { flex: 1, gap: 1 }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 6 }, children: [_jsx(react_native_1.Text, { style: {
                                            fontFamily: 'Inclusive Sans, sans-serif',
                                            fontWeight: '600',
                                            fontSize: 13,
                                            color: '#1C1917',
                                            flex: 1,
                                        }, children: name }), isMember && (_jsx(react_native_1.View, { style: {
                                            backgroundColor: 'rgba(232,134,42,0.15)',
                                            paddingHorizontal: 8,
                                            paddingVertical: 2,
                                            borderRadius: 6,
                                        }, children: _jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans, sans-serif',
                                                fontWeight: '500',
                                                fontSize: 9,
                                                color: '#E8862A',
                                            }, children: "Member" }) }))] }), _jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans, sans-serif', fontSize: 11, color: '#78716C' }, children: ["Center \u00B7 ", distance] }), events > 0 && (_jsxs(react_native_1.Text, { style: {
                                    fontFamily: 'Inclusive Sans, sans-serif',
                                    fontSize: 10,
                                    color: '#E8862A',
                                    marginTop: 1,
                                }, children: [events, " events this week"] }))] })] }) }));
    }
    // ─── Per-tab visuals ───
    function DiscoverVisual() {
        return (_jsx("div", { style: { animation: 'fadeSlideIn 0.4s ease-out' }, children: _jsxs(MockupShell, { children: [_jsxs(react_native_1.View, { style: { height: 160, position: 'relative', overflow: 'hidden' }, children: [_jsx(react_native_1.Image, { source: require('../../assets/images/landing/map-preview.jpg'), resizeMode: "cover", style: { width: '100%', height: '100%' } }), _jsx(react_native_1.View, { style: {
                                    position: 'absolute',
                                    top: 50,
                                    left: '30%',
                                    width: 14,
                                    height: 14,
                                    borderRadius: 7,
                                    backgroundColor: '#E8862A',
                                    borderWidth: 2,
                                    borderColor: '#FFFFFF',
                                } }), _jsx(react_native_1.View, { style: {
                                    position: 'absolute',
                                    top: 80,
                                    left: '55%',
                                    width: 10,
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: '#E8862A',
                                    opacity: 0.7,
                                    borderWidth: 2,
                                    borderColor: '#FFFFFF',
                                } }), _jsx(react_native_1.View, { style: {
                                    position: 'absolute',
                                    top: 35,
                                    left: '70%',
                                    width: 10,
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: '#E8862A',
                                    opacity: 0.6,
                                    borderWidth: 2,
                                    borderColor: '#FFFFFF',
                                } })] }), _jsxs(react_native_1.View, { style: {
                            flex: 1,
                            backgroundColor: '#FFFFFF',
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            marginTop: -16,
                            boxShadow: '0 -2px 10px rgba(0,0,0,0.04)',
                        }, children: [_jsx(MockupDragHandle, {}), _jsx(MockupSearchBar, {}), _jsx(MockupFilterTabs, { active: "Centers" }), _jsxs(react_native_1.View, { style: { paddingHorizontal: 12, gap: 2 }, children: [_jsx(MockupCenterItem, { name: "CM San Jose", distance: "2.4 mi", events: 5, isMember: true, delay: 200 }), _jsx(MockupCenterItem, { name: "CM Fremont", distance: "8.1 mi", events: 3, delay: 350 }), _jsx(MockupCenterItem, { name: "CM Palo Alto", distance: "12 mi", events: 2, delay: 500 })] })] })] }) }, "discover"));
    }
    function MockupEventDetail({ delay }) {
        return (_jsx("div", { style: { animation: `popIn 0.4s ease-out ${delay || 0}ms both` }, children: _jsxs(react_native_1.View, { style: {
                    position: 'absolute',
                    top: 40,
                    left: 16,
                    right: 16,
                    bottom: 16,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
                    zIndex: 10,
                    overflow: 'hidden',
                }, children: [_jsx(react_native_1.View, { style: {
                            height: 100,
                            backgroundColor: '#FFF7ED',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }, children: _jsx(react_native_1.Text, { style: { fontSize: 32 }, children: "\uD83D\uDCD6" }) }), _jsxs(react_native_1.View, { style: { padding: 16, gap: 10 }, children: [_jsx(react_native_1.Text, { style: {
                                    fontFamily: 'Inclusive Sans, sans-serif',
                                    fontWeight: '700',
                                    fontSize: 16,
                                    color: '#1C1917',
                                }, children: "Bhagavad Gita Study" }), _jsxs(react_native_1.View, { style: { gap: 6 }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 6 }, children: [_jsx(react_native_1.Text, { style: { fontSize: 12 }, children: "\uD83D\uDCC5" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans, sans-serif', fontSize: 12, color: '#57534E' }, children: "Today \u00B7 10:30 AM \u2013 12:00 PM" })] }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 6 }, children: [_jsx(react_native_1.Text, { style: { fontSize: 12 }, children: "\uD83D\uDCCD" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans, sans-serif', fontSize: 12, color: '#57534E' }, children: "CM San Jose \u00B7 1050 Park Ave" })] })] }), _jsx(react_native_1.Text, { style: {
                                    fontFamily: 'Inclusive Sans, sans-serif',
                                    fontSize: 12,
                                    lineHeight: 18,
                                    color: '#78716C',
                                    marginTop: 2,
                                }, children: "Join us for Chapter 12: The Yoga of Devotion. Open to all levels." }), _jsx(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }, children: _jsx(MockupAvatarDots, { count: 14 }) }), _jsx(react_native_1.View, { style: {
                                    backgroundColor: '#E8862A',
                                    paddingVertical: 10,
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    marginTop: 6,
                                }, children: _jsx(react_native_1.Text, { style: {
                                        fontFamily: 'Inclusive Sans, sans-serif',
                                        fontWeight: '600',
                                        fontSize: 13,
                                        color: '#FFFFFF',
                                    }, children: "Registered \u2713" }) })] })] }) }));
    }
    function MockupAvatarPile({ count }) {
        const colors = ['#E8862A', '#9A3412', '#78716C', '#A8A29E', '#D6D3D1'];
        const visible = Math.min(count, 5);
        return (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center' }, children: [Array.from({ length: visible }).map((_, i) => (_jsx(react_native_1.View, { style: {
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: colors[i % colors.length],
                        marginLeft: i === 0 ? 0 : -7,
                        borderWidth: 2,
                        borderColor: '#FFFFFF',
                    } }, i))), count > visible && (_jsx(react_native_1.View, { style: {
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: '#F3F4F6',
                        marginLeft: -7,
                        borderWidth: 2,
                        borderColor: '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }, children: _jsxs(react_native_1.Text, { style: {
                            fontFamily: 'Inclusive Sans, sans-serif',
                            fontSize: 9,
                            fontWeight: '600',
                            color: '#57534E',
                        }, children: ["+", count - visible] }) }))] }));
    }
    function CoordinatorAttendeeRow({ name, role, status, delay, }) {
        return (_jsx("div", { style: { animation: `fadeSlideIn 0.3s ease-out ${delay || 0}ms both` }, children: _jsxs(react_native_1.View, { style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingVertical: 8,
                    paddingHorizontal: 4,
                }, children: [_jsx(react_native_1.View, { style: {
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: '#E8862A',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }, children: _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans, sans-serif',
                                fontWeight: '600',
                                fontSize: 11,
                                color: '#FFFFFF',
                            }, children: name[0] }) }), _jsxs(react_native_1.View, { style: { flex: 1 }, children: [_jsx(react_native_1.Text, { style: {
                                    fontFamily: 'Inclusive Sans, sans-serif',
                                    fontWeight: '600',
                                    fontSize: 12,
                                    color: '#1C1917',
                                }, children: name }), _jsx(react_native_1.Text, { style: {
                                    fontFamily: 'Inclusive Sans, sans-serif',
                                    fontSize: 10,
                                    color: '#A8A29E',
                                }, children: role })] }), status === 'just-rsvpd' ? (_jsx(react_native_1.View, { style: {
                            backgroundColor: '#DCFCE7',
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 6,
                        }, children: _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans, sans-serif',
                                fontWeight: '600',
                                fontSize: 9,
                                color: '#15803D',
                            }, children: "Just RSVP'd" }) })) : (_jsx(react_native_1.Text, { style: {
                            fontFamily: 'Inclusive Sans, sans-serif',
                            fontSize: 10,
                            color: '#A8A29E',
                        }, children: "Going" }))] }) }));
    }
    function CoordinatorVisual() {
        return (_jsx("div", { style: { animation: 'fadeSlideIn 0.4s ease-out' }, children: _jsxs(MockupShell, { children: [_jsxs(react_native_1.View, { style: {
                            paddingHorizontal: 16,
                            paddingTop: 16,
                            paddingBottom: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: '#F3F4F6',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }, children: [_jsx(react_native_1.Text, { style: {
                                    fontFamily: 'Inclusive Sans, sans-serif',
                                    fontWeight: '700',
                                    fontSize: 14,
                                    color: '#1C1917',
                                }, children: "Manage event" }), _jsxs(react_native_1.View, { style: {
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 5,
                                    backgroundColor: '#DCFCE7',
                                    paddingHorizontal: 8,
                                    paddingVertical: 3,
                                    borderRadius: 100,
                                }, children: [_jsx(react_native_1.View, { style: {
                                            width: 6,
                                            height: 6,
                                            borderRadius: 3,
                                            backgroundColor: '#15803D',
                                        } }), _jsx(react_native_1.Text, { style: {
                                            fontFamily: 'Inclusive Sans, sans-serif',
                                            fontWeight: '600',
                                            fontSize: 10,
                                            color: '#15803D',
                                        }, children: "Live" })] })] }), _jsx(react_native_1.View, { style: { paddingHorizontal: 16, paddingTop: 14 }, children: _jsxs(react_native_1.View, { style: {
                                backgroundColor: '#FFF7ED',
                                borderRadius: 14,
                                padding: 14,
                                gap: 8,
                            }, children: [_jsx(react_native_1.Text, { style: {
                                        fontFamily: 'Inclusive Sans, sans-serif',
                                        fontWeight: '700',
                                        fontSize: 14,
                                        color: '#1C1917',
                                    }, children: "Spring CHYK Satsang" }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 12 }, children: [_jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans, sans-serif',
                                                fontSize: 11,
                                                color: '#57534E',
                                            }, children: "Sat, Apr 12 \u00B7 6:00 PM" }), _jsx(react_native_1.View, { style: {
                                                width: 3,
                                                height: 3,
                                                borderRadius: 1.5,
                                                backgroundColor: '#A8A29E',
                                            } }), _jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans, sans-serif',
                                                fontSize: 11,
                                                color: '#57534E',
                                            }, children: "CM Dallas" })] })] }) }), _jsxs(react_native_1.View, { style: {
                            flexDirection: 'row',
                            paddingHorizontal: 16,
                            paddingTop: 12,
                            gap: 8,
                        }, children: [_jsxs(react_native_1.View, { style: {
                                    flex: 1,
                                    backgroundColor: '#FFFFFF',
                                    borderWidth: 1,
                                    borderColor: '#F3F4F6',
                                    borderRadius: 10,
                                    padding: 10,
                                }, children: [_jsx(react_native_1.Text, { style: {
                                            fontFamily: '"Inclusive Sans", sans-serif',
                                            fontSize: 22,
                                            color: '#C2410C',
                                            marginBottom: 2,
                                        }, children: "28" }), _jsx(react_native_1.Text, { style: {
                                            fontFamily: 'Inclusive Sans, sans-serif',
                                            fontSize: 10,
                                            color: '#78716C',
                                        }, children: "Going" })] }), _jsxs(react_native_1.View, { style: {
                                    flex: 1,
                                    backgroundColor: '#FFFFFF',
                                    borderWidth: 1,
                                    borderColor: '#F3F4F6',
                                    borderRadius: 10,
                                    padding: 10,
                                }, children: [_jsx(react_native_1.Text, { style: {
                                            fontFamily: '"Inclusive Sans", sans-serif',
                                            fontSize: 22,
                                            color: '#1C1917',
                                            marginBottom: 2,
                                        }, children: "94" }), _jsx(react_native_1.Text, { style: {
                                            fontFamily: 'Inclusive Sans, sans-serif',
                                            fontSize: 10,
                                            color: '#78716C',
                                        }, children: "CHYKs reached" })] }), _jsxs(react_native_1.View, { style: {
                                    flex: 1,
                                    backgroundColor: '#FFFFFF',
                                    borderWidth: 1,
                                    borderColor: '#F3F4F6',
                                    borderRadius: 10,
                                    padding: 10,
                                }, children: [_jsx(react_native_1.Text, { style: {
                                            fontFamily: '"Inclusive Sans", sans-serif',
                                            fontSize: 22,
                                            color: '#1C1917',
                                            marginBottom: 2,
                                        }, children: "5" }), _jsx(react_native_1.Text, { style: {
                                            fontFamily: 'Inclusive Sans, sans-serif',
                                            fontSize: 10,
                                            color: '#78716C',
                                        }, children: "Centers" })] })] }), _jsxs(react_native_1.View, { style: {
                            paddingHorizontal: 16,
                            paddingTop: 14,
                            flex: 1,
                        }, children: [_jsxs(react_native_1.View, { style: {
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 4,
                                }, children: [_jsx(react_native_1.Text, { style: {
                                            fontFamily: 'Inclusive Sans, sans-serif',
                                            fontWeight: '600',
                                            fontSize: 11,
                                            letterSpacing: 0.4,
                                            textTransform: 'uppercase',
                                            color: '#78716C',
                                        }, children: "Recent RSVPs" }), _jsx(MockupAvatarPile, { count: 28 })] }), _jsx(CoordinatorAttendeeRow, { name: "Anika S.", role: "CM Frisco \u00B7 new", status: "just-rsvpd", delay: 250 }), _jsx(CoordinatorAttendeeRow, { name: "Rohan P.", role: "CM Dallas", status: "going", delay: 400 }), _jsx(CoordinatorAttendeeRow, { name: "Meera K.", role: "CM Houston \u00B7 visiting", status: "going", delay: 550 })] })] }) }, "coordinator"));
    }
    function EventsVisual() {
        return (_jsx("div", { style: { animation: 'fadeSlideIn 0.4s ease-out' }, children: _jsx(MockupShell, { children: _jsxs(react_native_1.View, { style: { position: 'relative', flex: 1 }, children: [_jsx(MockupDragHandle, {}), _jsx(MockupSearchBar, {}), _jsx(MockupFilterTabs, { active: "All" }), _jsxs(react_native_1.View, { style: { paddingHorizontal: 12, gap: 2 }, children: [_jsx(MockupEventItem, { month: "MAR", day: "29", title: "Bhagavad Gita Study", time: "Today \u00B7 10:30 AM", location: "CM San Jose", attendees: 14, isRegistered: true, delay: 200 }), _jsx(MockupEventItem, { month: "APR", day: "2", title: "Youth Retreat", time: "Sat \u00B7 9:00 AM", location: "CM Fremont", attendees: 48, delay: 350 }), _jsx(MockupEventItem, { month: "APR", day: "5", title: "Devi Group", time: "Mon \u00B7 7:30 PM", location: "CM San Jose", attendees: 22, delay: 500 }), _jsx(MockupEventItem, { month: "APR", day: "8", title: "Vedanta Course", time: "Thu \u00B7 7:00 PM", location: "CM Palo Alto", attendees: 18, delay: 650 })] }), _jsx(MockupEventDetail, { delay: 900 })] }) }) }, "events"));
    }
    // ─── Main export ───
    function AppPreview() {
        const { width } = react_native_1.useWindowDimensions();
        const isMobile = width < 768;
        const isTablet = width >= 768 && width < 1024;
        const [activeIndex, setActiveIndex] = react_1.useState(0);
        const [cycleKey, setCycleKey] = react_1.useState(0);
        const timerRef = react_1.useRef(null);
        const goToTab = react_1.useCallback((index) => {
            setActiveIndex(index);
            setCycleKey((k) => k + 1);
        }, []);
        react_1.useEffect(() => {
            timerRef.current = setTimeout(() => {
                goToTab((activeIndex + 1) % FEATURES.length);
            }, TAB_DURATION);
            return () => {
                if (timerRef.current)
                    clearTimeout(timerRef.current);
            };
        }, [activeIndex, cycleKey, goToTab]);
        const handleTabPress = (index) => {
            if (timerRef.current)
                clearTimeout(timerRef.current);
            goToTab(index);
        };
        const activeFeature = FEATURES[activeIndex];
        const sectionPadding = isMobile ? 20 : isTablet ? 40 : 80;
        const renderVisual = () => {
            switch (activeIndex) {
                case 0:
                    return _jsx(DiscoverVisual, {});
                case 1:
                    return _jsx(EventsVisual, {});
                case 2:
                    return _jsx(CoordinatorVisual, {});
                default:
                    return null;
            }
        };
        const tabPills = FEATURES.map((feature, index) => (_jsx(TabPill, { feature: feature, isActive: index === activeIndex, onPress: () => handleTabPress(index), cycleKey: cycleKey }, feature.number)));
        return (_jsxs(react_native_1.View, { style: {
                backgroundColor: '#F4DED7',
                paddingHorizontal: sectionPadding,
                paddingVertical: sectionPadding,
            }, children: [isMobile && (_jsxs(_Fragment, { children: [_jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans, sans-serif',
                                fontWeight: '600',
                                fontSize: 12,
                                letterSpacing: 1.5,
                                textTransform: 'uppercase',
                                color: '#C2410C',
                                marginBottom: 20,
                            }, children: "THE PLATFORM" }), _jsx(react_native_1.ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, style: { marginBottom: 32 }, contentContainerStyle: { flexDirection: 'row', gap: 10 }, children: tabPills })] })), _jsxs(react_native_1.View, { style: {
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 32 : isTablet ? 40 : 60,
                        alignItems: isMobile ? 'stretch' : 'center',
                    }, children: [_jsxs(react_native_1.View, { style: {
                                flex: isMobile ? undefined : 1,
                            }, children: [!isMobile && (_jsxs(_Fragment, { children: [_jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans, sans-serif',
                                                fontWeight: '600',
                                                fontSize: 12,
                                                letterSpacing: 1.5,
                                                textTransform: 'uppercase',
                                                color: '#C2410C',
                                                marginBottom: 20,
                                            }, children: "THE PLATFORM" }), _jsx(react_native_1.View, { style: { flexDirection: 'row', gap: 10, marginBottom: 32, flexWrap: 'wrap' }, children: tabPills })] })), _jsxs("div", { style: {
                                        animation: 'fadeSlideIn 0.35s ease-out',
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }, children: [_jsx(react_native_1.Text, { style: {
                                                fontFamily: '"Inclusive Sans", sans-serif',
                                                fontWeight: '400',
                                                fontSize: isMobile ? 28 : isTablet ? 32 : 40,
                                                lineHeight: isMobile ? 36 : isTablet ? 40 : 48,
                                                color: '#1C1917',
                                                marginBottom: 16,
                                            }, children: activeFeature.heading }), _jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans, sans-serif',
                                                fontWeight: '400',
                                                fontSize: isMobile ? 15 : 18,
                                                lineHeight: isMobile ? 24 : 28,
                                                color: '#57534E',
                                            }, children: activeFeature.description })] }, `text-${cycleKey}`)] }), _jsx(react_native_1.View, { style: {
                                flex: isMobile ? undefined : 1,
                            }, children: renderVisual() })] })] }));
    }
    exports_1("AppPreview", AppPreview);
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
            }
        ],
        execute: function () {
            TAB_DURATION = 5000; // 5 seconds per tab
            // Inject CSS keyframes (web only)
            if (react_native_1.Platform.OS === 'web' && typeof document !== 'undefined') {
                const id = 'apppreview-keyframes';
                if (!document.getElementById(id)) {
                    const style = document.createElement('style');
                    style.id = id;
                    style.textContent = `
      @keyframes progressFill {
        0% { width: 0%; }
        100% { width: 100%; }
      }
      @keyframes fadeSlideIn {
        0% { opacity: 0; transform: translateY(12px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes popIn {
        0% { opacity: 0; transform: scale(0.85) translateY(8px); }
        60% { transform: scale(1.02) translateY(-2px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
    `;
                    document.head.appendChild(style);
                }
            }
            FEATURES = [
                {
                    number: '01',
                    title: 'Discover centers',
                    heading: 'Find your nearest Chinmaya Mission center',
                    description: 'A live map of every CM center. Tap any pin to see the acharya, schedule, address, and what’s coming up — even before you sign up.',
                },
                {
                    number: '02',
                    title: 'Show up & RSVP',
                    heading: 'See who’s going before you walk in',
                    description: 'Browse events near you across every center. RSVP in one tap and see who else is coming — so you never have to walk into a room of strangers cold.',
                },
                {
                    number: '03',
                    title: 'Run your events',
                    heading: 'Post once. Reach every CHYK nearby.',
                    description: 'For coordinators: create an event in under a minute, track RSVPs in real time, and reach CHYKs beyond your WhatsApp group. No flyer, no Google Form, no spreadsheet.',
                },
            ];
        }
    };
});
