System.register(["react/jsx-runtime", "react", "react-native", "lucide-react-native", "../../components/contexts", "expo-router", "../../components/ui", "../../components/ThemeSelector", "posthog-react-native", "expo-constants"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, lucide_react_native_1, contexts_1, expo_router_1, ui_1, ThemeSelector_1, posthog_react_native_1, expo_constants_1, APP_VERSION;
    var __moduleName = context_1 && context_1.id;
    function Preferences() {
        const { isDark } = contexts_1.useTheme();
        const { deleteAccount } = contexts_1.useUser();
        const router = expo_router_1.useRouter();
        const [isDeleting, setIsDeleting] = react_1.useState(false);
        const [showDeleteModal, setShowDeleteModal] = react_1.useState(false);
        const posthog = posthog_react_native_1.usePostHog();
        const currentYear = new Date().getFullYear();
        const textColor = isDark ? '#F5F5F5' : '#1C1917';
        const mutedTextColor = isDark ? '#A8A29E' : '#78716C';
        const cardBg = isDark ? '#171717' : '#FFFFFF';
        const borderColor = isDark ? '#262626' : '#E5E7EB';
        const iconColor = isDark ? '#a1a1aa' : '#71717a';
        const { width: viewportWidth } = react_native_1.useWindowDimensions();
        const isNarrowWeb = react_native_1.Platform.OS === 'web' && viewportWidth < 768;
        const webPaddingH = isNarrowWeb ? 16 : viewportWidth < 1024 ? 32 : 60;
        const handleDeleteAccount = async () => {
            setIsDeleting(true);
            try {
                const result = await deleteAccount();
                if (result.success) {
                    setShowDeleteModal(false);
                    router.replace('/auth');
                }
                else {
                    react_native_1.Alert.alert('Error', result.message || 'Failed to delete account');
                }
            }
            catch (error) {
                react_native_1.Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
            finally {
                setIsDeleting(false);
            }
        };
        return (_jsxs(react_native_1.ScrollView, { style: { flex: 1, backgroundColor: isDark ? '#171717' : '#FAFAF7' }, children: [_jsxs(react_native_1.View, { style: {
                        maxWidth: 900,
                        width: '100%',
                        alignSelf: 'center',
                        padding: isNarrowWeb ? 20 : 40,
                        paddingHorizontal: webPaddingH,
                        gap: isNarrowWeb ? 24 : 36,
                    }, children: [_jsxs(react_native_1.View, { children: [_jsx(react_native_1.Text, { style: {
                                        fontFamily: 'Inclusive Sans',
                                        fontSize: isNarrowWeb ? 24 : 28,
                                        color: textColor,
                                        letterSpacing: -0.5,
                                    }, children: "Preferences" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: mutedTextColor }, children: "Manage your app preferences" })] }), _jsxs(react_native_1.View, { children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }, children: [_jsx(lucide_react_native_1.Eye, { size: 20, color: iconColor }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 17, color: textColor }, children: "Appearance" })] }), _jsxs(react_native_1.View, { style: {
                                        backgroundColor: cardBg,
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        borderColor,
                                        padding: isNarrowWeb ? 20 : 28,
                                    }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: mutedTextColor, marginBottom: 12 }, children: "Choose your preferred theme" }), _jsx(ThemeSelector_1.default, {})] })] }), _jsxs(react_native_1.View, { children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }, children: [_jsx(lucide_react_native_1.Shield, { size: 20, color: iconColor }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 17, color: textColor }, children: "Privacy" })] }), _jsxs(react_native_1.View, { style: {
                                        backgroundColor: cardBg,
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        borderColor,
                                        overflow: 'hidden',
                                    }, children: [_jsxs(react_native_1.Pressable, { style: {
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: isNarrowWeb ? 20 : 28,
                                                borderBottomWidth: 1,
                                                borderBottomColor: borderColor,
                                            }, onPress: () => {
                                                posthog?.capture('privacy_policy_viewed');
                                                router.push('/privacy');
                                            }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: textColor }, children: "Privacy Policy" }), _jsx(lucide_react_native_1.ExternalLink, { size: 18, color: iconColor })] }), _jsxs(react_native_1.Pressable, { style: {
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: isNarrowWeb ? 20 : 28,
                                                borderBottomWidth: 1,
                                                borderBottomColor: borderColor,
                                            }, onPress: () => {
                                                posthog?.capture('terms_viewed');
                                                router.push('/terms');
                                            }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: textColor }, children: "Terms of Service" }), _jsx(lucide_react_native_1.ExternalLink, { size: 18, color: iconColor })] }), _jsxs(react_native_1.Pressable, { style: {
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: isNarrowWeb ? 20 : 28,
                                            }, onPress: () => {
                                                posthog?.capture('cookie_policy_viewed');
                                                router.push('/cookies');
                                            }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: textColor }, children: "Cookie Policy" }), _jsx(lucide_react_native_1.ExternalLink, { size: 18, color: iconColor })] })] })] }), _jsxs(react_native_1.View, { children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }, children: [_jsx(lucide_react_native_1.Info, { size: 20, color: iconColor }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 17, color: textColor }, children: "About" })] }), _jsxs(react_native_1.View, { style: {
                                        backgroundColor: cardBg,
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        borderColor,
                                        overflow: 'hidden',
                                    }, children: [_jsxs(react_native_1.View, { style: {
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: isNarrowWeb ? 20 : 28,
                                                borderBottomWidth: 1,
                                                borderBottomColor: borderColor,
                                            }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: textColor }, children: "Version" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: mutedTextColor, textAlign: 'right' }, children: APP_VERSION })] }), _jsxs(react_native_1.View, { style: {
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: isNarrowWeb ? 20 : 28,
                                            }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: textColor }, children: "Chinmaya Janata" }), _jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: mutedTextColor, textAlign: 'right' }, children: [currentYear, " Chinmaya Mission"] })] })] })] }), _jsx(react_native_1.View, { children: _jsxs(react_native_1.View, { style: {
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: isNarrowWeb ? 20 : 28,
                                    borderRadius: 20,
                                    borderWidth: 1,
                                    borderColor: '#FECACA',
                                    backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#FEF2F2',
                                }, children: [_jsxs(react_native_1.View, { style: { gap: 4, flex: 1, marginRight: 16 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: '#DC2626' }, children: "Danger Zone" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: mutedTextColor }, children: "Permanently delete your account and all data" })] }), _jsx(ui_1.DestructiveButton, { onPress: () => {
                                            posthog?.capture('delete_account_started');
                                            setShowDeleteModal(true);
                                        }, children: "Delete Account" })] }) })] }), _jsx(react_native_1.Modal, { transparent: true, visible: showDeleteModal, animationType: "fade", onRequestClose: () => setShowDeleteModal(false), children: _jsx(react_native_1.View, { style: {
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            paddingHorizontal: 24,
                        }, children: _jsxs(react_native_1.View, { style: {
                                backgroundColor: cardBg,
                                borderRadius: 20,
                                padding: 24,
                                width: '100%',
                                maxWidth: 400,
                                borderWidth: 1,
                                borderColor: '#FECACA',
                            }, children: [_jsxs(react_native_1.View, { style: { alignItems: 'center', marginBottom: 16 }, children: [_jsx(react_native_1.View, { style: {
                                                width: 64,
                                                height: 64,
                                                borderRadius: 32,
                                                backgroundColor: isDark ? 'rgba(220,38,38,0.15)' : '#FEE2E2',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: 12,
                                            }, children: _jsx(lucide_react_native_1.AlertTriangle, { size: 32, color: "#DC2626" }) }), _jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 22,
                                                color: textColor,
                                                marginBottom: 8,
                                            }, children: "Delete Account?" }), _jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 15,
                                                color: mutedTextColor,
                                                textAlign: 'center',
                                                lineHeight: 22,
                                            }, children: "This action cannot be undone. All your data will be permanently deleted." })] }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', gap: 12, marginTop: 8 }, children: [_jsx(react_native_1.View, { style: { flex: 1 }, children: _jsx(ui_1.SecondaryButton, { onPress: () => setShowDeleteModal(false), disabled: isDeleting, children: "Cancel" }) }), _jsx(react_native_1.View, { style: { flex: 1 }, children: _jsx(ui_1.DestructiveButton, { onPress: handleDeleteAccount, disabled: isDeleting, loading: isDeleting, children: "Delete Forever" }) })] })] }) }) })] }));
    }
    exports_1("default", Preferences);
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
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            },
            function (ThemeSelector_1_1) {
                ThemeSelector_1 = ThemeSelector_1_1;
            },
            function (posthog_react_native_1_1) {
                posthog_react_native_1 = posthog_react_native_1_1;
            },
            function (expo_constants_1_1) {
                expo_constants_1 = expo_constants_1_1;
            }
        ],
        execute: function () {
            APP_VERSION = expo_constants_1.default.expoConfig?.version || '0.2.0';
        }
    };
});
