System.register(["react/jsx-runtime", "@expo/metro-runtime", "react", "react-native", "@expo-google-fonts/inclusive-sans", "@react-navigation/native", "expo-font", "expo-router", "posthog-react-native", "../components/contexts", "../components/ui/ErrorBoundary", "../globals.css"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, inclusive_sans_1, native_1, expo_font_1, expo_router_1, posthog_react_native_1, contexts_1, ErrorBoundary_1, unstable_settings, posthogHost, posthogKey, posthogEnabled;
    var __moduleName = context_1 && context_1.id;
    function RootLayout() {
        const [fontsLoaded] = expo_font_1.useFonts({
            'Inclusive Sans': inclusive_sans_1.InclusiveSans_400Regular,
            'Inclusive Sans Bold': inclusive_sans_1.InclusiveSans_700Bold,
            'Inclusive Sans SemiBold': inclusive_sans_1.InclusiveSans_600SemiBold,
            'Inclusive Sans Medium': inclusive_sans_1.InclusiveSans_500Medium,
            'Inclusive Sans Light': inclusive_sans_1.InclusiveSans_300Light,
        });
        react_1.useEffect(() => {
            if (fontsLoaded) {
                expo_router_1.SplashScreen.hideAsync().catch(() => { });
            }
        }, [fontsLoaded]);
        if (!fontsLoaded) {
            return null;
        }
        return posthogEnabled ? (_jsx(posthog_react_native_1.PostHogProvider, { apiKey: posthogKey.trim(), options: {
                host: posthogHost,
            }, children: _jsx(ErrorBoundary_1.ErrorBoundary, { children: _jsx(contexts_1.ThemeProvider, { children: _jsx(contexts_1.UserProvider, { children: _jsx(RootLayoutNav, {}) }) }) }) })) : (_jsx(ErrorBoundary_1.ErrorBoundary, { children: _jsx(contexts_1.ThemeProvider, { children: _jsx(contexts_1.UserProvider, { children: _jsx(RootLayoutNav, {}) }) }) }));
    }
    exports_1("default", RootLayout);
    function RootLayoutNav() {
        const { user, loading } = contexts_1.useUser();
        const { isDark } = contexts_1.useTheme();
        const pathname = expo_router_1.usePathname();
        const router = expo_router_1.useRouter();
        const isAuthenticated = !!user;
        react_1.useEffect(() => {
            if (loading)
                return;
            const inAuthGroup = pathname.startsWith('/auth');
            const inOnboardingGroup = pathname.startsWith('/onboarding');
            const inLandingPage = pathname === '/landing';
            if (!isAuthenticated) {
                // Allow public pages through without redirect
                const isPublicPage = inAuthGroup ||
                    inLandingPage ||
                    pathname === '/' ||
                    pathname.startsWith('/(tabs)') ||
                    pathname.startsWith('/events/') ||
                    pathname.startsWith('/center/') ||
                    pathname.startsWith('/privacy') ||
                    pathname.startsWith('/terms') ||
                    pathname.startsWith('/cookies');
                if (!isPublicPage) {
                    router.replace('/landing');
                }
            }
            else {
                // User IS authenticated
                // Check for completion flag OR fallback to checking fields
                const isComplete = user.profileComplete || (!!user.firstName && !!user.lastName);
                if (!isComplete) {
                    // User needs to onboard
                    if (!inOnboardingGroup) {
                        router.replace('/onboarding');
                    }
                }
                else {
                    // User is fully onboarded
                    if (inAuthGroup || inOnboardingGroup) {
                        // Redirect away from auth/onboarding pages to Home
                        router.replace('/');
                    }
                }
            }
        }, [user, loading, pathname, isAuthenticated]);
        const navTheme = isDark ? native_1.DarkTheme : native_1.DefaultTheme;
        const prevIsDark = react_1.useRef(isDark);
        const fadeAnim = react_1.useRef(new react_native_1.Animated.Value(1)).current;
        react_1.useEffect(() => {
            if (prevIsDark.current !== isDark) {
                prevIsDark.current = isDark;
                react_native_1.Animated.sequence([
                    react_native_1.Animated.timing(fadeAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
                    react_native_1.Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
                ]).start();
            }
        }, [isDark, fadeAnim]);
        if (loading) {
            return (_jsx(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center' }, children: _jsx(react_native_1.ActivityIndicator, { size: "large", color: "#ea580c" }) }));
        }
        return (_jsx(react_native_1.Animated.View, { style: { flex: 1, opacity: fadeAnim }, children: _jsx(native_1.ThemeProvider, { value: navTheme, children: _jsxs(expo_router_1.Stack, { screenOptions: { headerShown: false }, children: [_jsx(expo_router_1.Stack.Screen, { name: "(tabs)", options: { headerShown: false } }), _jsx(expo_router_1.Stack.Screen, { name: "auth", options: { headerShown: false } }), _jsx(expo_router_1.Stack.Screen, { name: "landing", options: { headerShown: false } }), _jsx(expo_router_1.Stack.Screen, { name: "onboarding", options: { headerShown: false, gestureEnabled: false } }), _jsx(expo_router_1.Stack.Screen, { name: "settings", options: { headerShown: false } }), _jsx(expo_router_1.Stack.Screen, { name: "events/index", options: { headerShown: true, title: 'My Events', headerBackTitle: '' } }), _jsx(expo_router_1.Stack.Screen, { name: "events/[id]", options: { headerShown: false } }), _jsx(expo_router_1.Stack.Screen, { name: "events/form", options: { headerShown: false } }), _jsx(expo_router_1.Stack.Screen, { name: "center/[id]", options: { headerShown: false } }), _jsx(expo_router_1.Stack.Screen, { name: "privacy", options: { headerShown: react_native_1.Platform.OS !== 'web', title: 'Privacy Policy', headerBackTitle: '' } }), _jsx(expo_router_1.Stack.Screen, { name: "terms", options: { headerShown: react_native_1.Platform.OS !== 'web', title: 'Terms of Service', headerBackTitle: '' } }), _jsx(expo_router_1.Stack.Screen, { name: "cookies", options: { headerShown: react_native_1.Platform.OS !== 'web', title: 'Cookie Policy', headerBackTitle: '' } }), _jsx(expo_router_1.Stack.Screen, { name: "admin", options: { headerShown: false } })] }) }) }));
    }
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (_1) {
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (inclusive_sans_1_1) {
                inclusive_sans_1 = inclusive_sans_1_1;
            },
            function (native_1_1) {
                native_1 = native_1_1;
            },
            function (expo_font_1_1) {
                expo_font_1 = expo_font_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (posthog_react_native_1_1) {
                posthog_react_native_1 = posthog_react_native_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (ErrorBoundary_1_1) {
                ErrorBoundary_1 = ErrorBoundary_1_1;
            },
            function (_2) {
            }
        ],
        execute: function () {
            // Suppress non-fatal WorkletsTurboModule error in Expo Go (reanimated v4 compat)
            react_native_1.LogBox.ignoreLogs(['Exception in HostFunction: <unknown>']);
            exports_1("unstable_settings", unstable_settings = {
                initialRouteName: '(tabs)',
            });
            expo_router_1.SplashScreen.preventAutoHideAsync();
            posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
            posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
            posthogEnabled = posthogKey && posthogKey.trim().length > 0;
        }
    };
});
