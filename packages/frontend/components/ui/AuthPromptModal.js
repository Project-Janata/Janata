System.register(["react/jsx-runtime", "react", "react-native", "expo-router", "../../hooks/useDetailColors", "./buttons/PrimaryButton", "./buttons/SecondaryButton"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, expo_router_1, useDetailColors_1, PrimaryButton_1, SecondaryButton_1;
    var __moduleName = context_1 && context_1.id;
    function AuthPromptModal({ visible, onClose, returnTo, eventTitle }) {
        const router = expo_router_1.useRouter();
        const colors = useDetailColors_1.useDetailColors();
        const encoded = encodeURIComponent(returnTo);
        const handleSignUp = () => {
            onClose();
            router.push(`/auth?mode=signup&returnTo=${encoded}&inviteCode=PUBLIC-EXPLORE`);
        };
        const handleLogIn = () => {
            onClose();
            router.push(`/auth?mode=login&returnTo=${encoded}`);
        };
        // Web: close on Escape key
        react_1.useEffect(() => {
            if (react_native_1.Platform.OS !== 'web' || !visible)
                return;
            const handler = (e) => {
                if (e.key === 'Escape')
                    onClose();
            };
            document.addEventListener('keydown', handler);
            return () => document.removeEventListener('keydown', handler);
        }, [visible, onClose]);
        if (!visible)
            return null;
        // Use a portal-style overlay on web for better z-index handling
        if (react_native_1.Platform.OS === 'web') {
            return (_jsxs(react_native_1.View, { style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999,
                }, children: [_jsx(react_native_1.Pressable, { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, onPress: onClose }), _jsxs(react_native_1.View, { style: {
                            backgroundColor: colors.panelBg,
                            borderRadius: 16,
                            padding: 28,
                            width: 360,
                            maxWidth: '90%',
                            gap: 16,
                            shadowColor: '#000',
                            shadowOpacity: 0.15,
                            shadowRadius: 20,
                            shadowOffset: { width: 0, height: 8 },
                        }, children: [_jsx(react_native_1.Text, { style: { fontSize: 20, fontFamily: 'Inclusive Sans', color: colors.text, textAlign: 'center' }, children: "Sign up to attend" }), _jsx(react_native_1.Text, { style: { fontSize: 15, fontFamily: 'Inclusive Sans', color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }, children: eventTitle
                                    ? `Create a free account to register for ${eventTitle}`
                                    : 'Create a free account to register for events' }), _jsxs(react_native_1.View, { style: { gap: 10, marginTop: 4 }, children: [_jsx(PrimaryButton_1.default, { onPress: handleSignUp, children: "Sign Up" }), _jsx(SecondaryButton_1.default, { onPress: handleLogIn, children: "Log In" })] }), _jsx(react_native_1.Pressable, { onPress: onClose, style: { alignSelf: 'center', paddingTop: 4 }, children: _jsx(react_native_1.Text, { style: { fontSize: 14, fontFamily: 'Inclusive Sans', color: colors.textMuted }, children: "Maybe later" }) })] })] }));
        }
        // Native fallback using Modal
        return (_jsx(react_native_1.Modal, { visible: visible, transparent: true, animationType: "fade", onRequestClose: onClose, children: _jsxs(react_native_1.View, { style: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }, children: [_jsx(react_native_1.Pressable, { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, onPress: onClose }), _jsxs(react_native_1.View, { style: {
                            backgroundColor: colors.panelBg,
                            borderRadius: 16,
                            padding: 28,
                            width: 360,
                            maxWidth: '90%',
                            gap: 16,
                        }, children: [_jsx(react_native_1.Text, { style: { fontSize: 20, fontFamily: 'Inclusive Sans', color: colors.text, textAlign: 'center' }, children: "Sign up to attend" }), _jsx(react_native_1.Text, { style: { fontSize: 15, fontFamily: 'Inclusive Sans', color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }, children: eventTitle
                                    ? `Create a free account to register for ${eventTitle}`
                                    : 'Create a free account to register for events' }), _jsxs(react_native_1.View, { style: { gap: 10, marginTop: 4 }, children: [_jsx(PrimaryButton_1.default, { onPress: handleSignUp, children: "Sign Up" }), _jsx(SecondaryButton_1.default, { onPress: handleLogIn, children: "Log In" })] }), _jsx(react_native_1.Pressable, { onPress: onClose, style: { alignSelf: 'center', paddingTop: 4 }, children: _jsx(react_native_1.Text, { style: { fontSize: 14, fontFamily: 'Inclusive Sans', color: colors.textMuted }, children: "Maybe later" }) })] })] }) }));
    }
    exports_1("default", AuthPromptModal);
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
            function (useDetailColors_1_1) {
                useDetailColors_1 = useDetailColors_1_1;
            },
            function (PrimaryButton_1_1) {
                PrimaryButton_1 = PrimaryButton_1_1;
            },
            function (SecondaryButton_1_1) {
                SecondaryButton_1 = SecondaryButton_1_1;
            }
        ],
        execute: function () {
        }
    };
});
