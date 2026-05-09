System.register(["react/jsx-runtime", "react", "react-native", "./contexts", "lucide-react-native", "expo-router", "./ThemeSelector", "./ui", "../utils/admin"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, contexts_1, lucide_react_native_1, expo_router_1, ThemeSelector_1, ui_1, admin_1;
    var __moduleName = context_1 && context_1.id;
    function SettingsPanel({ visible, onClose, onLogout }) {
        const opacityAnim = react_1.useRef(new react_native_1.Animated.Value(0)).current;
        const translateYAnim = react_1.useRef(new react_native_1.Animated.Value(-20)).current;
        const { user } = contexts_1.useUser();
        const { preference: themePreference, setPreference: setThemePreference, isDark } = contexts_1.useTheme();
        const pathname = expo_router_1.usePathname();
        const themeOptions = ['light', 'dark', 'system'];
        const optionWidth = 70;
        const indicatorPadding = 8;
        const [selectedIndex, setSelectedIndex] = react_1.useState(themeOptions.indexOf(themePreference));
        const slideAnim = react_1.useRef(new react_native_1.Animated.Value(selectedIndex * optionWidth)).current;
        const previousTheme = react_1.useRef(isDark);
        const isMountedRef = react_1.useRef(true);
        // Cleanup on unmount
        react_1.useEffect(() => {
            isMountedRef.current = true;
            return () => {
                isMountedRef.current = false;
                // Stop all animations immediately on unmount
                opacityAnim.stopAnimation();
                translateYAnim.stopAnimation();
                slideAnim.stopAnimation();
            };
        }, [opacityAnim, translateYAnim, slideAnim]);
        react_1.useEffect(() => {
            if (visible) {
                react_native_1.Animated.parallel([
                    react_native_1.Animated.timing(opacityAnim, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    react_native_1.Animated.spring(translateYAnim, {
                        toValue: 0,
                        friction: 8,
                        tension: 80,
                        useNativeDriver: true,
                    }),
                ]).start();
            }
            else {
                react_native_1.Animated.parallel([
                    react_native_1.Animated.timing(opacityAnim, {
                        toValue: 0,
                        duration: 150,
                        useNativeDriver: true,
                    }),
                    react_native_1.Animated.timing(translateYAnim, {
                        toValue: -20,
                        duration: 150,
                        useNativeDriver: true,
                    }),
                ]).start();
            }
        }, [visible]);
        react_1.useEffect(() => {
            const idx = themeOptions.indexOf(themePreference);
            setSelectedIndex(idx);
            react_native_1.Animated.timing(slideAnim, {
                toValue: idx * optionWidth,
                duration: 100,
                useNativeDriver: true,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
            }).start();
        }, [themePreference]);
        // Stop animations when theme changes
        react_1.useEffect(() => {
            if (previousTheme.current !== isDark) {
                opacityAnim.stopAnimation();
                translateYAnim.stopAnimation();
                // Set to final values to prevent flickering
                opacityAnim.setValue(1);
                translateYAnim.setValue(0);
                previousTheme.current = isDark;
            }
        }, [isDark]);
        if (!visible)
            return null;
        const displayName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || 'User';
        const profileImage = user?.profileImage;
        const getInitials = () => {
            if (user?.firstName && user?.lastName)
                return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
            if (user?.firstName)
                return user.firstName[0].toUpperCase();
            if (user?.username)
                return user.username[0].toUpperCase();
            return '?';
        };
        return (_jsxs(_Fragment, { children: [_jsx(react_native_1.Pressable, { style: {
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 99,
                    }, onPress: onClose }), _jsxs(react_native_1.Animated.View, { style: {
                        position: 'fixed',
                        top: 56,
                        right: 16,
                        zIndex: 100,
                        width: 248,
                        backgroundColor: isDark ? '#171717' : '#fff',
                        borderColor: isDark ? '#262626' : '#E5E7EB',
                        borderWidth: 1,
                        borderRadius: 16,
                        shadowColor: '#000',
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        padding: 16,
                        elevation: 8,
                        opacity: opacityAnim,
                        transform: [{ translateY: translateYAnim }],
                    }, children: [_jsxs(react_native_1.View, { className: "flex-row items-center mb-3", children: [_jsx(ui_1.Avatar, { image: profileImage || undefined, name: displayName, size: 32, style: { marginRight: 12 } }), _jsxs(react_native_1.View, { className: "flex-col flex-1", children: [_jsx(react_native_1.Text, { className: "text-lg font-sans text-content dark:text-content-dark -mb-0.5", children: displayName }), _jsx(react_native_1.Text, { className: "text-sm font-sans text-contentStrong dark:text-contentStrong-dark", numberOfLines: 1, ellipsizeMode: "tail", children: user?.username })] })] }), _jsx(react_native_1.View, { className: "h-[1px] bg-gray-200 dark:bg-neutral-800 mb-3" }), _jsxs(react_native_1.Pressable, { className: `flex-row items-center mb-2 p-2 rounded-lg ${pathname === '/settings/profile' ? 'bg-primary' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'}`, onPress: () => {
                                onClose();
                                expo_router_1.router.push('/settings/profile');
                            }, children: [_jsx(lucide_react_native_1.User, { size: 16, color: pathname === '/settings/profile' ? '#fff' : isDark ? '#fff' : '#374151', className: "mr-3" }), _jsx(react_native_1.Text, { className: `font-sans ${pathname === '/settings/profile' ? 'text-white font-sans' : 'text-content dark:text-content-dark'}`, children: "Profile" })] }), _jsxs(react_native_1.Pressable, { className: `flex-row items-center mb-2 p-2 rounded-lg ${pathname === '/settings/preferences' ? 'bg-primary' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'}`, onPress: () => {
                                onClose();
                                expo_router_1.router.push('/settings/preferences');
                            }, children: [_jsx(lucide_react_native_1.Settings, { size: 16, color: pathname === '/settings/preferences' ? '#fff' : isDark ? '#fff' : '#374151', className: "mr-3" }), _jsx(react_native_1.Text, { className: `font-sans ${pathname === '/settings/preferences' ? 'text-white font-sans' : 'text-content dark:text-content-dark'}`, children: "Preferences" })] }), admin_1.isSuperAdmin(user) && (_jsxs(react_native_1.Pressable, { className: "flex-row items-center mb-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800", onPress: () => {
                                onClose();
                                expo_router_1.router.push('/admin');
                            }, children: [_jsx(lucide_react_native_1.Shield, { size: 16, color: "#E8862A", className: "mr-3" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', color: '#E8862A' }, children: "Admin Dashboard" })] })), _jsx(react_native_1.View, { className: "h-[1px] bg-gray-200 dark:bg-neutral-800 mb-2" }), _jsxs(react_native_1.View, { className: "mb-3", children: [_jsx(react_native_1.Text, { className: "text-sm font-sans text-content dark:text-content-dark mb-2", children: "Appearance" }), _jsx(ThemeSelector_1.default, { className: "relative flex-row bg-gray-100 dark:bg-neutral-800 rounded-lg p-1", style: { width: 218 } })] }), _jsx(react_native_1.View, { className: "h-[1px] bg-gray-200 dark:bg-neutral-800 mb-2" }), _jsxs(react_native_1.Pressable, { onPress: onLogout, className: "flex-row items-center p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20", children: [_jsx(lucide_react_native_1.LogOut, { size: 16, color: isDark ? '#ef4444' : '#dc2626', className: "mr-3" }), _jsx(react_native_1.Text, { className: "text-red-600 dark:text-red-400 font-sans", children: "Log Out" })] })] })] }));
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
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (ThemeSelector_1_1) {
                ThemeSelector_1 = ThemeSelector_1_1;
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            },
            function (admin_1_1) {
                admin_1 = admin_1_1;
            }
        ],
        execute: function () {
            exports_1("default", react_1.default.memo(SettingsPanel));
        }
    };
});
