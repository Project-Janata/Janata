System.register(["react/jsx-runtime", "react", "react-native", "react-native-safe-area-context", "expo-router", "lucide-react-native", "../../components/contexts", "../../components/ui", "../../components/ThemeSelector", "posthog-react-native", "expo-constants"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, react_native_safe_area_context_1, expo_router_1, lucide_react_native_1, contexts_1, ui_1, ThemeSelector_1, posthog_react_native_1, expo_constants_1, APP_VERSION;
    var __moduleName = context_1 && context_1.id;
    function PreferencesNative() {
        const router = expo_router_1.useRouter();
        const { user, logout } = contexts_1.useUser();
        const { isDark } = contexts_1.useTheme();
        const { deleteAccount } = contexts_1.useUser();
        const posthog = posthog_react_native_1.usePostHog();
        const [isDeleting, setIsDeleting] = react_1.useState(false);
        const [showDeleteModal, setShowDeleteModal] = react_1.useState(false);
        const currentYear = new Date().getFullYear();
        const textColor = isDark ? '#F5F5F5' : '#1C1917';
        const mutedTextColor = isDark ? '#A8A29E' : '#78716C';
        const borderColor = isDark ? '#262626' : '#E5E7EB';
        const cardBg = isDark ? '#171717' : '#FFFFFF';
        const handleLogout = async () => {
            posthog?.capture('nav_logout');
            await logout();
            router.replace('/auth');
        };
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
        const displayName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || '';
        const MenuRow = ({ onPress, children, showArrow = true, }) => (_jsxs(react_native_1.Pressable, { style: {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                paddingHorizontal: 16,
                backgroundColor: cardBg,
            }, onPress: onPress, children: [children, showArrow && _jsx(lucide_react_native_1.ChevronRight, { size: 20, color: textColor })] }));
        /** Static label/value row (e.g. About) — avoids MenuRow flex-start packing label + value together */
        const AboutInfoRow = ({ icon: Icon, label, value, isLast, }) => (_jsxs(react_native_1.View, { style: {
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: 16,
                backgroundColor: cardBg,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: borderColor,
                gap: 12,
            }, children: [_jsx(Icon, { size: 20, color: textColor }), _jsx(react_native_1.Text, { style: {
                        fontSize: 16,
                        color: textColor,
                        flex: 1,
                        minWidth: 0,
                    }, numberOfLines: 1, ellipsizeMode: "tail", children: label }), _jsx(react_native_1.Text, { style: {
                        fontSize: 15,
                        color: mutedTextColor,
                        textAlign: 'right',
                        flexShrink: 0,
                        maxWidth: '52%',
                    }, numberOfLines: 2, children: value })] }));
        const Section = ({ title, children }) => (_jsxs(react_native_1.View, { style: { marginBottom: 24 }, children: [title && (_jsx(react_native_1.Text, { style: {
                        fontSize: 13,
                        fontWeight: '600',
                        color: mutedTextColor,
                        textTransform: 'uppercase',
                        paddingHorizontal: 16,
                        paddingBottom: 8,
                    }, children: title })), _jsx(react_native_1.View, { style: { borderTopWidth: 1, borderBottomWidth: 1, borderColor }, children: children })] }));
        return (_jsxs(react_native_safe_area_context_1.SafeAreaView, { style: { flex: 1, backgroundColor: isDark ? '#000' : '#fff' }, edges: ['top', 'bottom'], children: [_jsx(react_native_1.StatusBar, { barStyle: isDark ? 'light-content' : 'dark-content' }), _jsxs(react_native_1.View, { style: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 8,
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderColor,
                        backgroundColor: isDark ? '#000' : '#fff',
                    }, children: [_jsx(react_native_1.Pressable, { onPress: () => router.back(), style: { padding: 8 }, children: _jsx(lucide_react_native_1.ArrowLeft, { size: 24, color: textColor }) }), _jsx(react_native_1.Text, { style: { fontSize: 17, fontWeight: '600', color: textColor }, children: "Preferences" }), _jsx(react_native_1.View, { style: { width: 40 } })] }), _jsxs(react_native_1.ScrollView, { style: { flex: 1 }, contentContainerStyle: { paddingTop: 8 }, children: [_jsx(react_native_1.View, { style: { paddingHorizontal: 16, paddingVertical: 16, marginBottom: 16 }, children: _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center' }, children: [_jsx(ui_1.Avatar, { image: user?.profileImage || undefined, name: displayName, size: 56 }), _jsxs(react_native_1.View, { style: { marginLeft: 12, flex: 1 }, children: [_jsx(react_native_1.Text, { style: { fontSize: 17, fontWeight: '600', color: textColor }, children: displayName }), user?.username && (_jsxs(react_native_1.Text, { style: { fontSize: 14, color: mutedTextColor }, children: ["@", user.username] }))] })] }) }), _jsx(Section, { title: "Account", children: _jsx(MenuRow, { onPress: () => router.push('/settings/profile'), showArrow: true, children: _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center' }, children: [_jsx(lucide_react_native_1.User, { size: 20, color: textColor, style: { marginRight: 12 } }), _jsx(react_native_1.Text, { style: { fontSize: 16, color: textColor }, children: "Edit Profile" })] }) }) }), _jsx(Section, { title: "Appearance", children: _jsxs(react_native_1.View, { style: { paddingVertical: 14, paddingHorizontal: 16, backgroundColor: cardBg }, children: [_jsx(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 }, children: _jsx(react_native_1.Text, { style: { fontSize: 16, color: textColor, flex: 1 }, children: "Theme" }) }), _jsx(ThemeSelector_1.default, {})] }) }), _jsxs(Section, { title: "Regulatory", children: [_jsx(MenuRow, { onPress: () => {
                                        posthog?.capture('privacy_policy_viewed');
                                        router.push('/privacy');
                                    }, children: _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center' }, children: [_jsx(lucide_react_native_1.Shield, { size: 20, color: textColor, style: { marginRight: 12 } }), _jsx(react_native_1.Text, { style: { fontSize: 16, color: textColor }, children: "Privacy Policy" })] }) }), _jsx(MenuRow, { onPress: () => {
                                        posthog?.capture('terms_viewed');
                                        router.push('/terms');
                                    }, children: _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center' }, children: [_jsx(lucide_react_native_1.FileText, { size: 20, color: textColor, style: { marginRight: 12 } }), _jsx(react_native_1.Text, { style: { fontSize: 16, color: textColor }, children: "Terms of Service" })] }) }), _jsx(MenuRow, { onPress: () => {
                                        posthog?.capture('cookie_policy_viewed');
                                        router.push('/cookies');
                                    }, children: _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center' }, children: [_jsx(lucide_react_native_1.Info, { size: 20, color: textColor, style: { marginRight: 12 } }), _jsx(react_native_1.Text, { style: { fontSize: 16, color: textColor }, children: "Cookie Policy" })] }) })] }), _jsxs(Section, { title: "About", children: [_jsx(AboutInfoRow, { icon: lucide_react_native_1.Info, label: "Version", value: APP_VERSION }), _jsx(AboutInfoRow, { icon: lucide_react_native_1.Info, label: "Chinmaya Janata", value: `© ${currentYear}\nChinmaya Mission`, isLast: true })] }), _jsxs(Section, { children: [_jsx(MenuRow, { onPress: handleLogout, showArrow: false, children: _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center' }, children: [_jsx(lucide_react_native_1.LogOut, { size: 20, color: "#ef4444", style: { marginRight: 12 } }), _jsx(react_native_1.Text, { style: { fontSize: 16, color: '#ef4444', fontWeight: '600' }, children: "Log Out" })] }) }), _jsx(MenuRow, { onPress: () => {
                                        posthog?.capture('delete_account_started');
                                        setShowDeleteModal(true);
                                    }, showArrow: false, children: _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center' }, children: [_jsx(lucide_react_native_1.AlertTriangle, { size: 20, color: "#dc2626", style: { marginRight: 12 } }), _jsx(react_native_1.Text, { style: { fontSize: 16, color: '#dc2626', fontWeight: '600' }, children: "Delete Account" })] }) })] }), _jsx(react_native_1.View, { style: { height: 40 } })] }), _jsx(react_native_1.Modal, { transparent: true, visible: showDeleteModal, animationType: "fade", onRequestClose: () => setShowDeleteModal(false), children: _jsx(react_native_1.View, { style: {
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
                                maxWidth: 340,
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
                                                fontSize: 20,
                                                fontWeight: '700',
                                                color: textColor,
                                                marginBottom: 8,
                                                textAlign: 'center',
                                            }, children: "Delete Account?" }), _jsx(react_native_1.Text, { style: { fontSize: 15, color: mutedTextColor, textAlign: 'center', lineHeight: 22 }, children: "This action cannot be undone. All your data will be permanently deleted." })] }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', gap: 12, marginTop: 8 }, children: [_jsx(react_native_1.Pressable, { onPress: () => setShowDeleteModal(false), disabled: isDeleting, style: {
                                                flex: 1,
                                                paddingVertical: 14,
                                                borderRadius: 12,
                                                backgroundColor: isDark ? '#1c1c1c' : '#f3f4f6',
                                                alignItems: 'center',
                                            }, children: _jsx(react_native_1.Text, { style: { fontSize: 16, fontWeight: '600', color: textColor }, children: "Cancel" }) }), _jsx(react_native_1.Pressable, { onPress: handleDeleteAccount, disabled: isDeleting, style: {
                                                flex: 1,
                                                paddingVertical: 14,
                                                borderRadius: 12,
                                                backgroundColor: '#DC2626',
                                                alignItems: 'center',
                                            }, children: isDeleting ? (_jsx(react_native_1.Text, { style: { fontSize: 16, fontWeight: '600', color: '#fff' }, children: "Deleting..." })) : (_jsx(react_native_1.Text, { style: { fontSize: 16, fontWeight: '600', color: '#fff' }, children: "Delete" })) })] })] }) }) })] }));
    }
    exports_1("default", PreferencesNative);
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
