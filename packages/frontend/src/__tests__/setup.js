System.register(["vitest"], function (exports_1, context_1) {
    "use strict";
    var vitest_1;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (vitest_1_1) {
                vitest_1 = vitest_1_1;
            }
        ],
        execute: function () {
            globalThis.__DEV__ = true;
            // Mock React Native Platform
            vitest_1.vi.mock('react-native', () => ({
                Platform: { OS: 'web', select: (obj) => obj.web ?? obj.default },
            }));
            // Mock AsyncStorage
            vitest_1.vi.mock('@react-native-async-storage/async-storage', () => ({
                default: {
                    getItem: vitest_1.vi.fn().mockResolvedValue(null),
                    setItem: vitest_1.vi.fn().mockResolvedValue(undefined),
                    removeItem: vitest_1.vi.fn().mockResolvedValue(undefined),
                },
            }));
            // Mock tokenStorage (web version) — individual tests can override
            vitest_1.vi.mock('../../components/utils/tokenStorage', () => ({
                getStoredToken: vitest_1.vi.fn().mockResolvedValue(null),
                setStoredToken: vitest_1.vi.fn().mockResolvedValue(undefined),
                removeStoredToken: vitest_1.vi.fn().mockResolvedValue(undefined),
                hasStoredToken: vitest_1.vi.fn().mockResolvedValue(false),
            }));
            vitest_1.vi.mock('expo-router', () => ({
                useRouter: () => ({
                    push: vitest_1.vi.fn(),
                    replace: vitest_1.vi.fn(),
                    back: vitest_1.vi.fn(),
                }),
                useSegments: () => [],
                Slot: 'Slot',
                Stack: 'Stack',
                SplashScreen: {
                    preventAutoHideAsync: vitest_1.vi.fn(),
                    hideAsync: vitest_1.vi.fn(),
                },
            }));
        }
    };
});
