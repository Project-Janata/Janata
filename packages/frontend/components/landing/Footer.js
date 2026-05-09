System.register(["react/jsx-runtime", "react-native", "expo-router", "../ui/Logo"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, expo_router_1, Logo_1;
    var __moduleName = context_1 && context_1.id;
    function Footer() {
        const router = expo_router_1.useRouter();
        const { width } = react_native_1.useWindowDimensions();
        const isMobile = width < 768;
        const isTablet = width >= 768 && width < 1024;
        return (_jsxs(react_native_1.View, { style: { backgroundColor: '#FAFAF7' }, children: [_jsxs(react_native_1.View, { style: {
                        borderTopWidth: 1,
                        borderTopColor: '#E7E5E4',
                        paddingHorizontal: isMobile ? 20 : isTablet ? 40 : 80,
                        paddingTop: 48,
                        paddingBottom: 48,
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        gap: isMobile ? 24 : undefined,
                    }, children: [_jsxs(react_native_1.View, { style: { maxWidth: 320 }, children: [_jsx(Logo_1.default, { size: 32, style: { marginBottom: 12 } }), _jsx(react_native_1.Text, { style: {
                                        fontFamily: 'Inclusive Sans, sans-serif',
                                        fontWeight: '400',
                                        fontSize: 14,
                                        lineHeight: 22,
                                        color: '#78716C',
                                    }, children: "Helping CHYKs stay connected to their Chinmaya Mission community." })] }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', gap: isMobile ? 20 : 32, alignItems: 'center' }, children: [_jsx(react_native_1.Pressable, { onPress: () => react_native_1.Linking.openURL('https://chinmayamission.com'), children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans, sans-serif', fontSize: 14, color: '#78716C' }, children: "Chinmaya Mission" }) }), _jsx(react_native_1.Pressable, { onPress: () => router.push('/privacy'), children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans, sans-serif', fontSize: 14, color: '#78716C' }, children: "Privacy Policy" }) }), _jsx(react_native_1.Pressable, { onPress: () => router.push('/terms'), children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans, sans-serif', fontSize: 14, color: '#78716C' }, children: "Terms of Service" }) })] })] }), _jsx(react_native_1.View, { style: {
                        paddingHorizontal: isMobile ? 20 : isTablet ? 40 : 80,
                        paddingBottom: 40,
                    }, children: _jsx(react_native_1.Text, { style: {
                            fontFamily: 'Inclusive Sans, sans-serif',
                            fontWeight: '400',
                            fontSize: 13,
                            color: '#A8A29E',
                        }, children: "\u00A9 2026 Janata. Built with love by CHYKs." }) })] }));
    }
    exports_1("Footer", Footer);
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
            function (Logo_1_1) {
                Logo_1 = Logo_1_1;
            }
        ],
        execute: function () {
        }
    };
});
