System.register(["react/jsx-runtime", "react-native", "react-native-safe-area-context", "expo-router", "lucide-react-native", "../../components/contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, react_native_safe_area_context_1, expo_router_1, lucide_react_native_1, contexts_1, SETTINGS_TABS;
    var __moduleName = context_1 && context_1.id;
    function SettingsLayout() {
        const router = expo_router_1.useRouter();
        const pathname = expo_router_1.usePathname();
        const { isDark } = contexts_1.useTheme();
        const { width } = react_native_1.useWindowDimensions();
        const showSidebar = react_native_1.Platform.OS === 'web' && width >= 768;
        const handleTabPress = (path) => {
            router.push(path);
        };
        const handleClose = () => {
            router.push('/');
        };
        // Native: Stack with slide animation
        if (react_native_1.Platform.OS !== 'web') {
            return (_jsxs(expo_router_1.Stack, { screenOptions: { headerShown: false, animation: 'slide_from_right' }, children: [_jsx(expo_router_1.Stack.Screen, { name: "preferences" }), _jsx(expo_router_1.Stack.Screen, { name: "profile" })] }));
        }
        // Web: sidebar layout
        return (_jsxs(_Fragment, { children: [_jsx(expo_router_1.Stack.Screen, { options: { headerShown: false } }), _jsx(react_native_safe_area_context_1.SafeAreaView, { className: "flex-1 bg-white dark:bg-neutral-900", edges: ['bottom'], children: _jsxs(react_native_1.View, { className: "flex-1 flex-row", children: [showSidebar && (_jsxs(react_native_1.View, { className: "w-64 border-r border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900", children: [_jsx(react_native_1.View, { className: "p-6 border-b border-stone-200 dark:border-stone-700", children: _jsxs(react_native_1.View, { className: "flex-row items-center justify-between mb-2", children: [_jsx(react_native_1.Pressable, { onPress: handleClose, className: "p-1", style: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }, children: _jsx(lucide_react_native_1.ArrowLeft, { size: 20, color: isDark ? '#a1a1aa' : '#71717a' }) }), _jsx(react_native_1.Text, { className: "text-2xl font-sans font-bold text-content dark:text-content-dark", children: "Settings" }), _jsx(react_native_1.View, { style: { width: 44 } })] }) }), _jsx(react_native_1.ScrollView, { className: "flex-1 p-3", children: SETTINGS_TABS.map((tab) => {
                                            const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/');
                                            const Icon = tab.icon;
                                            return (_jsxs(react_native_1.Pressable, { onPress: () => handleTabPress(tab.path), className: `flex-row items-center gap-3 px-4 py-3 rounded-xl mb-1 ${isActive
                                                    ? 'bg-primary shadow-sm'
                                                    : 'bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800'}`, style: { minHeight: 44 }, children: [_jsx(Icon, { size: 20, className: isActive ? 'text-white' : 'text-stone-500 dark:text-stone-400' }), _jsx(react_native_1.Text, { className: `font-sans font-medium text-base ${isActive ? 'text-white' : 'text-content dark:text-content-dark'}`, children: tab.label })] }, tab.id));
                                        }) })] })), _jsx(react_native_1.View, { className: "flex-1", children: _jsx(expo_router_1.Slot, {}) })] }) })] }));
    }
    exports_1("default", SettingsLayout);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
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
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            }
        ],
        execute: function () {
            SETTINGS_TABS = [
                { id: 'profile', label: 'Profile', icon: lucide_react_native_1.User, path: '/settings/profile' },
                { id: 'preferences', label: 'Preferences', icon: lucide_react_native_1.Settings, path: '/settings/preferences' },
            ];
        }
    };
});
