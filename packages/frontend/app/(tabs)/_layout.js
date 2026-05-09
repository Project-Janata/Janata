System.register(["react/jsx-runtime", "expo-router", "react-native", "react", "../../components/contexts", "../../components/contexts/HeaderActionContext", "lucide-react-native", "../../components/SettingsPanel", "../../components/ui/Logo", "../../components/ui/TabHeader", "posthog-react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, expo_router_1, react_native_1, react_1, contexts_1, HeaderActionContext_1, lucide_react_native_1, SettingsPanel_1, Logo_1, TabHeader_1, posthog_react_native_1;
    var __moduleName = context_1 && context_1.id;
    function TabLayout() {
        const router = expo_router_1.useRouter();
        const pathname = expo_router_1.usePathname();
        const { user, loading, logout } = contexts_1.useUser();
        const { isDark } = contexts_1.useTheme();
        const [settingsVisible, setSettingsVisible] = react_1.useState(false);
        const canCreate = !!user;
        const posthog = posthog_react_native_1.usePostHog();
        react_1.useEffect(() => {
            if (react_native_1.Platform.OS !== 'web' && !loading && !user) {
                router.replace('/auth');
            }
        }, [user, loading]);
        const handleLogout = async () => {
            posthog?.capture('nav_logout');
            await logout();
            router.replace('/auth');
        };
        const navItems = [
            { label: 'Home', href: '/' },
            { label: 'Explore', href: '/explore' },
            { label: 'Feed', href: '/feed' },
            { label: 'Messages', href: '/chat' },
        ];
        const isRouteActive = (href) => {
            if (href === '/')
                return pathname === '/';
            return pathname === href || pathname.startsWith(`${href}/`);
        };
        const WebHeader = () => {
            const webProfileImage = user?.profileImage;
            const getInitials = () => {
                if (user?.firstName && user?.lastName)
                    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
                if (user?.firstName)
                    return user.firstName[0].toUpperCase();
                if (user?.username)
                    return user.username[0].toUpperCase();
                return '?';
            };
            return (_jsxs(react_native_1.View, { style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    height: 56,
                    backgroundColor: isDark ? '#000000' : '#FFFFFF',
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? '#262626' : '#E5E7EB',
                }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 24 }, children: [_jsx(react_native_1.Pressable, { onPress: () => router.push('/'), style: { flexDirection: 'row', alignItems: 'center', gap: 10 }, children: _jsx(Logo_1.default, { size: 28 }) }), _jsx(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 6 }, children: navItems.map(({ label, href }) => {
                                    const active = isRouteActive(href);
                                    return (_jsx(react_native_1.Pressable, { onPress: () => router.push(href), style: {
                                            paddingHorizontal: 12,
                                            paddingVertical: 10,
                                            borderRadius: 999,
                                            backgroundColor: active
                                                ? isDark
                                                    ? 'rgba(232,134,42,0.16)'
                                                    : '#FFF7ED'
                                                : 'transparent',
                                        }, children: _jsx(react_native_1.Text, { style: {
                                                fontFamily: active ? 'Inclusive Sans' : 'Inclusive Sans',
                                                fontSize: 14,
                                                color: active ? '#E8862A' : isDark ? '#E7E5E4' : '#44403C',
                                            }, children: label }) }, href));
                                }) })] }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8 }, children: [canCreate && (_jsxs(react_native_1.Pressable, { style: {
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderRadius: 999,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                    borderWidth: 1.5,
                                    borderColor: '#E8862A',
                                }, onPress: () => {
                                    posthog?.capture('nav_create_event');
                                    if (typeof window !== 'undefined') {
                                        const isMobile = window.innerWidth < 768;
                                        if (isMobile) {
                                            router.push('/events/form');
                                        }
                                        else {
                                            window.dispatchEvent(new CustomEvent('open-event-form'));
                                        }
                                    }
                                }, children: [_jsx(lucide_react_native_1.Plus, { size: 16, color: "#E8862A" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: '#E8862A' }, children: "Create Event" })] })), _jsx(react_native_1.Pressable, { style: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden' }, onPress: () => {
                                    posthog?.capture('nav_menu_opened');
                                    setSettingsVisible(true);
                                }, children: webProfileImage ? (_jsx(react_native_1.Image, { source: { uri: webProfileImage }, style: { width: 36, height: 36 } })) : (_jsx(react_native_1.View, { style: {
                                        width: 36,
                                        height: 36,
                                        borderRadius: 18,
                                        backgroundColor: '#C2410C',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }, children: _jsx(react_native_1.Text, { style: { color: '#fff', fontSize: 14, fontWeight: '600' }, children: getInitials() }) })) }), _jsx(SettingsPanel_1.default, { visible: settingsVisible, onClose: () => setSettingsVisible(false), onLogout: handleLogout })] })] }));
        };
        const isWeb = react_native_1.Platform.OS === 'web';
        return (_jsxs(_Fragment, { children: [react_native_1.Platform.OS !== 'web' && (_jsx(react_native_1.StatusBar, { barStyle: isDark ? 'light-content' : 'dark-content', backgroundColor: "transparent", translucent: true })), _jsx(HeaderActionContext_1.HeaderActionProvider, { children: _jsxs(expo_router_1.Tabs, { screenOptions: {
                            tabBarStyle: isWeb
                                ? { display: 'none' }
                                : {
                                    backgroundColor: isDark ? '#171717' : '#FFFFFF',
                                    borderTopColor: isDark ? '#262626' : '#E7E5E4',
                                    height: 84,
                                    paddingTop: 8,
                                    paddingBottom: 24,
                                },
                            tabBarActiveTintColor: '#E8862A',
                            tabBarInactiveTintColor: isDark ? '#A8A29E' : '#78716C',
                            headerShown: true,
                            headerShadowVisible: false,
                        }, children: [_jsx(expo_router_1.Tabs.Screen, { name: "index", options: {
                                    title: 'Home',
                                    header: isWeb
                                        ? () => _jsx(WebHeader, {})
                                        : () => (_jsx(TabHeader_1.default, { showLogo: true, rightContent: _jsx(react_native_1.Pressable, { onPress: () => router.push('/chat'), style: {
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 18,
                                                    borderWidth: 1.5,
                                                    borderColor: isDark ? '#404040' : '#D6D3D1',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }, children: _jsx(lucide_react_native_1.Bell, { size: 17, color: isDark ? '#FAFAF9' : '#1C1917' }) }) })),
                                    tabBarIcon: ({ color, size }) => _jsx(lucide_react_native_1.House, { size: size, color: color }),
                                } }), _jsx(expo_router_1.Tabs.Screen, { name: "explore", options: {
                                    title: 'Explore',
                                    headerTransparent: !isWeb,
                                    header: isWeb
                                        ? () => _jsx(WebHeader, {})
                                        : () => _jsx(TabHeader_1.default, { title: "Explore", transparent: true, pillTitle: true, borderAvatar: true }),
                                    tabBarIcon: ({ color, size }) => _jsx(lucide_react_native_1.Compass, { size: size, color: color }),
                                } }), _jsx(expo_router_1.Tabs.Screen, { name: "feed", options: {
                                    title: 'Feed',
                                    header: isWeb ? () => _jsx(WebHeader, {}) : () => _jsx(TabHeader_1.default, { title: "Feed", showPlus: true }),
                                    tabBarIcon: ({ color, size }) => _jsx(lucide_react_native_1.Newspaper, { size: size, color: color }),
                                } }), _jsx(expo_router_1.Tabs.Screen, { name: "chat", options: {
                                    title: 'Chat',
                                    header: isWeb ? () => _jsx(WebHeader, {}) : () => _jsx(TabHeader_1.default, { title: "Chat", showPlus: true }),
                                    tabBarIcon: ({ color, size }) => _jsx(lucide_react_native_1.MessageSquare, { size: size, color: color }),
                                } })] }) })] }));
    }
    exports_1("default", TabLayout);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (HeaderActionContext_1_1) {
                HeaderActionContext_1 = HeaderActionContext_1_1;
            },
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            },
            function (SettingsPanel_1_1) {
                SettingsPanel_1 = SettingsPanel_1_1;
            },
            function (Logo_1_1) {
                Logo_1 = Logo_1_1;
            },
            function (TabHeader_1_1) {
                TabHeader_1 = TabHeader_1_1;
            },
            function (posthog_react_native_1_1) {
                posthog_react_native_1 = posthog_react_native_1_1;
            }
        ],
        execute: function () {
        }
    };
});
