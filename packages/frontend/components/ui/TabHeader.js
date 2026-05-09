System.register(["react/jsx-runtime", "react-native", "expo-router", "lucide-react-native", "posthog-react-native", "../contexts", "../contexts/HeaderActionContext", "./Avatar", "./Logo"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, expo_router_1, lucide_react_native_1, posthog_react_native_1, contexts_1, HeaderActionContext_1, Avatar_1, Logo_1;
    var __moduleName = context_1 && context_1.id;
    function TabHeader({ title, showLogo = false, transparent = false, pillTitle = false, borderAvatar = false, showPlus = false, onPlusPress, rightContent, }) {
        const router = expo_router_1.useRouter();
        const { user } = contexts_1.useUser();
        const { isDark } = contexts_1.useTheme();
        const posthog = posthog_react_native_1.usePostHog();
        const { triggerCreate } = HeaderActionContext_1.useHeaderAction();
        const bgColor = transparent ? 'transparent' : isDark ? '#000000' : '#FFFFFF';
        const textColor = transparent ? '#FFFFFF' : isDark ? '#FAFAF9' : '#1F1D1B';
        const displayName = user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : user?.username || '';
        const profileImage = user?.profileImage;
        const handleProfilePress = () => {
            posthog?.capture('nav_menu_opened');
            if (react_native_1.Platform.OS === 'web') {
                // web handled by rightContent
            }
            else {
                router.push('/settings/preferences');
            }
        };
        return (_jsxs(react_native_1.View, { style: {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: react_native_1.Platform.OS === 'ios' ? 56 : 44,
                paddingBottom: 12,
                paddingHorizontal: 16,
                backgroundColor: bgColor,
            }, children: [_jsx(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', flex: 1 }, children: showLogo ? (_jsx(Logo_1.default, { showText: true, size: 24 })) : title ? (pillTitle ? (_jsx(react_native_1.View, { style: {
                            backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
                            borderRadius: 999,
                            paddingHorizontal: 14,
                            paddingVertical: 6,
                        }, children: _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans',
                                fontSize: 16,
                                color: isDark ? '#FAFAF9' : '#1F1D1B',
                            }, children: title }) })) : (_jsx(react_native_1.Text, { style: {
                            fontFamily: 'Inclusive Sans',
                            fontSize: 22,
                            color: textColor,
                        }, children: title }))) : null }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8 }, children: [rightContent, showPlus ? (_jsx(react_native_1.Pressable, { onPress: onPlusPress || triggerCreate, style: {
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                borderWidth: 1.5,
                                borderColor: transparent
                                    ? 'rgba(255,255,255,0.4)'
                                    : isDark
                                        ? '#404040'
                                        : '#D6D3D1',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }, children: _jsx(lucide_react_native_1.Plus, { size: 18, color: transparent ? '#FFFFFF' : isDark ? '#FAFAF9' : '#1C1917', strokeWidth: 2 }) })) : null, user ? (_jsx(react_native_1.Pressable, { onPress: handleProfilePress, style: borderAvatar
                                ? {
                                    borderRadius: 20,
                                    borderWidth: 2,
                                    borderColor: '#FFFFFF',
                                    overflow: 'hidden',
                                }
                                : undefined, children: _jsx(Avatar_1.default, { image: profileImage || undefined, name: displayName, size: 36 }) })) : (_jsx(react_native_1.Pressable, { onPress: () => router.push('/auth'), style: {
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                borderWidth: 1,
                                borderColor: transparent
                                    ? 'rgba(255,255,255,0.4)'
                                    : isDark
                                        ? '#404040'
                                        : '#D6D3D1',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }, children: _jsx(lucide_react_native_1.User, { size: 18, color: transparent ? '#FFFFFF' : isDark ? '#FAFAFA' : '#1C1917' }) }))] })] }));
    }
    exports_1("default", TabHeader);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
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
            function (posthog_react_native_1_1) {
                posthog_react_native_1 = posthog_react_native_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (HeaderActionContext_1_1) {
                HeaderActionContext_1 = HeaderActionContext_1_1;
            },
            function (Avatar_1_1) {
                Avatar_1 = Avatar_1_1;
            },
            function (Logo_1_1) {
                Logo_1 = Logo_1_1;
            }
        ],
        execute: function () {
        }
    };
});
