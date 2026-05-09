System.register(["react/jsx-runtime", "nativewind", "react", "react-native", "@react-native-async-storage/async-storage"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, nativewind_1, react_1, react_native_1, async_storage_1, STORAGE_KEY, isWeb, ThemeContext;
    var __moduleName = context_1 && context_1.id;
    // ─── Storage helpers ──────────────────────────────────────────────────────────
    function storageRead() {
        if (isWeb && typeof window !== 'undefined') {
            const v = localStorage.getItem(STORAGE_KEY);
            if (v === 'light' || v === 'dark' || v === 'system')
                return v;
        }
        return 'system';
    }
    function storageWrite(pref) {
        if (isWeb && typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, pref);
        }
        else {
            async_storage_1.default.setItem(STORAGE_KEY, pref).catch(() => { });
        }
    }
    // ─── Web DOM helper (Twitter-style: toggle class + colorScheme on <html>) ─────
    //
    // Twitter writes `color-scheme` on <html> and toggles a "dark" class so both
    // Tailwind/NativeWind and native CSS `prefers-color-scheme` media queries stay
    // in sync without a flash of unstyled content.
    function applyToDOM(theme) {
        if (!isWeb || typeof document === 'undefined')
            return;
        const root = document.documentElement;
        root.classList.toggle('dark', theme === 'dark');
        root.style.colorScheme = theme;
    }
    // ─── System-theme hook ────────────────────────────────────────────────────────
    function useSystemTheme() {
        const getSystem = () => (react_native_1.Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
        const [system, setSystem] = react_1.useState(getSystem);
        react_1.useEffect(() => {
            if (isWeb) {
                // On web, mirror the OS via a media-query listener (most reliable)
                const mq = window.matchMedia('(prefers-color-scheme: dark)');
                const handler = (e) => setSystem(e.matches ? 'dark' : 'light');
                mq.addEventListener('change', handler);
                return () => mq.removeEventListener('change', handler);
            }
            // On native, re-read on mount in case Appearance was uninitialized
            // when the useState initializer ran (iOS cold start sometimes returns
            // null briefly). Then subscribe to OS changes via Appearance.
            setSystem(react_native_1.Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
            const sub = react_native_1.Appearance.addChangeListener(({ colorScheme }) => setSystem(colorScheme === 'dark' ? 'dark' : 'light'));
            return () => sub.remove();
        }, []);
        return system;
    }
    // ─── Provider ─────────────────────────────────────────────────────────────────
    function ThemeProvider({ children }) {
        const { setColorScheme } = nativewind_1.useColorScheme();
        const system = useSystemTheme();
        const [preference, setPreferenceState] = react_1.useState(storageRead);
        const preferenceRef = react_1.useRef(preference);
        // Keep ref current so async callbacks always see the latest value
        react_1.useEffect(() => {
            preferenceRef.current = preference;
        }, [preference]);
        // ── On native: hydrate from AsyncStorage (web is sync via localStorage) ───
        react_1.useEffect(() => {
            if (isWeb)
                return;
            async_storage_1.default.getItem(STORAGE_KEY)
                .then((v) => {
                if (v === 'light' || v === 'dark' || v === 'system')
                    setPreferenceState(v);
            })
                .catch(() => { });
        }, []);
        // ── Resolve: "system" falls back to OS preference ─────────────────────────
        const theme = preference === 'system' ? system : preference;
        // ── Apply to NativeWind + DOM on every change ──────────────────────────────
        react_1.useEffect(() => {
            setColorScheme(preference);
            if (isWeb) {
                document.documentElement.classList.toggle('dark', theme === 'dark');
                document.documentElement.style.colorScheme = theme;
            }
        }, [theme, preference, setColorScheme]);
        // ── Public setter: update state + persist ─────────────────────────────────
        const setPreference = react_1.useCallback((pref) => {
            setPreferenceState(pref);
            storageWrite(pref);
        }, []);
        const value = react_1.useMemo(() => ({ theme, preference, setPreference, isDark: theme === 'dark' }), [theme, preference, setPreference]);
        // On web the <html> class handles everything; on native we need a root View
        // that carries the NativeWind dark-mode class so child components resolve
        // their dark: variants correctly.
        return (_jsx(ThemeContext.Provider, { value: value, children: isWeb ? (children) : (_jsx(react_native_1.View, { className: `flex-1${theme === 'dark' ? ' dark' : ''}`, style: { flex: 1 }, children: children })) }));
    }
    exports_1("ThemeProvider", ThemeProvider);
    // ─── Hooks ────────────────────────────────────────────────────────────────────
    function useTheme() {
        const ctx = react_1.useContext(ThemeContext);
        if (!ctx)
            throw new Error('useTheme must be used inside <ThemeProvider>');
        return ctx;
    }
    exports_1("useTheme", useTheme);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (nativewind_1_1) {
                nativewind_1 = nativewind_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (async_storage_1_1) {
                async_storage_1 = async_storage_1_1;
            }
        ],
        execute: function () {
            // ─── Constants ────────────────────────────────────────────────────────────────
            STORAGE_KEY = '@theme';
            isWeb = react_native_1.Platform.OS === 'web';
            // ─── Context ──────────────────────────────────────────────────────────────────
            ThemeContext = react_1.createContext(null);
        }
    };
});
