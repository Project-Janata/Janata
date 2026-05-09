System.register(["react/jsx-runtime", "react-native", "react-native-safe-area-context", "react", "../contexts", "../ui"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, react_native_safe_area_context_1, react_1, contexts_1, ui_1;
    var __moduleName = context_1 && context_1.id;
    function Complete() {
        const { completeOnboarding, isSubmitting, submitError } = contexts_1.useOnboarding();
        const { isDark } = contexts_1.useTheme();
        const logoSize = 160;
        const [showLogo, setShowLogo] = react_1.useState(false);
        const [showContent, setShowContent] = react_1.useState(false);
        react_1.useEffect(() => {
            // Staggered animation: logo first, then content
            const logoTimer = setTimeout(() => {
                setShowLogo(true);
            }, 200);
            const contentTimer = setTimeout(() => {
                setShowContent(true);
            }, 500);
            return () => {
                clearTimeout(logoTimer);
                clearTimeout(contentTimer);
            };
        }, []);
        const handleGetStarted = () => {
            completeOnboarding();
        };
        return (_jsx(react_native_safe_area_context_1.SafeAreaView, { className: "flex-1 bg-white dark:bg-neutral-900", children: _jsxs(react_native_1.View, { className: "max-w-[720px] w-full flex-1 self-center px-6", children: [_jsx(react_native_1.View, { className: "flex-1 justify-center items-center", children: _jsxs(react_native_1.View, { className: "w-full items-center", children: [_jsx(react_native_1.View, { className: `mb-12 ${showLogo ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`, children: isDark ? (_jsx(react_native_1.Image, { source: require('../../assets/images/chinmaya_logo_dark.svg'), style: { width: logoSize, height: logoSize } })) : (_jsx(react_native_1.Image, { source: require('../../assets/images/chinmaya_logo_light.svg'), style: { width: logoSize, height: logoSize } })) }), _jsxs(react_native_1.View, { className: `items-center ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`, children: [_jsx(react_native_1.Text, { className: "text-4xl font-sans font-bold text-content dark:text-content-dark text-center mb-4 tracking-tight", children: "Welcome to Janata!" }), _jsx(react_native_1.Text, { className: "text-lg font-sans text-stone-500 dark:text-stone-400 text-center max-w-md leading-relaxed px-4", children: "Begin your spiritual journey now" })] })] }) }), submitError && (_jsx(react_native_1.View, { className: "px-4 mb-4", children: _jsx(react_native_1.Text, { className: "text-red-500 dark:text-red-400 font-sans text-sm text-center", children: submitError }) })), _jsx(react_native_1.View, { className: "pb-6", children: _jsx(ui_1.PrimaryButton, { onPress: handleGetStarted, disabled: isSubmitting, loading: isSubmitting, style: { width: '100%', maxWidth: 448, alignSelf: 'center' }, children: "Get Started" }) })] }) }));
    }
    exports_1("default", Complete);
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
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            }
        ],
        execute: function () {
        }
    };
});
