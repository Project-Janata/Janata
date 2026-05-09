System.register(["react/jsx-runtime", "react", "react-native", "expo-router", "lucide-react-native", "../ui/Logo"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, expo_router_1, lucide_react_native_1, Logo_1, NAV_LINKS;
    var __moduleName = context_1 && context_1.id;
    function NavBar() {
        const router = expo_router_1.useRouter();
        const { width } = react_native_1.useWindowDimensions();
        const isMobile = width < 768;
        const isTablet = width >= 768 && width < 1024;
        const [menuOpen, setMenuOpen] = react_1.useState(false);
        const paddingHorizontal = isMobile ? 20 : isTablet ? 40 : 80;
        return (_jsx(react_native_1.View, { style: {
                position: 'sticky',
                top: 0,
                zIndex: 50,
                backgroundColor: '#FAFAF7',
                boxShadow: '0 2px 32px 5px rgba(0,0,0,0.06)',
            }, children: _jsxs(react_native_1.View, { style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal,
                    paddingVertical: 14,
                }, children: [_jsx(react_native_1.Pressable, { onPress: () => router.push('/landing'), children: _jsx(Logo_1.default, { size: 32 }) }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8 }, children: [!isMobile &&
                                NAV_LINKS.map((link) => (_jsx(react_native_1.Pressable, { children: _jsx(react_native_1.Text, { style: {
                                            fontFamily: '"Inclusive Sans", sans-serif',
                                            fontWeight: '400',
                                            fontSize: 15,
                                            color: '#78716C',
                                        }, children: link }) }, link))), _jsx(react_native_1.Pressable, { accessibilityLabel: "Sign in or sign up", onPress: () => router.push('/auth'), style: {
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    borderWidth: 1,
                                    borderColor: '#D6D3D1',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }, children: _jsx(lucide_react_native_1.User, { size: 18, color: "#1C1917" }) })] })] }) }));
    }
    exports_1("NavBar", NavBar);
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
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            },
            function (Logo_1_1) {
                Logo_1 = Logo_1_1;
            }
        ],
        execute: function () {
            // Inject hamburger animation CSS (web only)
            if (react_native_1.Platform.OS === 'web' && typeof document !== 'undefined') {
                const id = 'navbar-mobile-keyframes';
                if (!document.getElementById(id)) {
                    const style = document.createElement('style');
                    style.id = id;
                    style.textContent = `
      @keyframes navSlideDown {
        0% { opacity: 0; transform: translateY(-8px); }
        100% { opacity: 1; transform: translateY(0); }
      }
    `;
                    document.head.appendChild(style);
                }
            }
            NAV_LINKS = [];
        }
    };
});
