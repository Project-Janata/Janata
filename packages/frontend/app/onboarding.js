System.register(["react/jsx-runtime", "react-native", "react-native-safe-area-context", "../components/contexts", "react", "../components/onboarding"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, react_native_safe_area_context_1, contexts_1, react_1, onboarding_1, OnboardingHeader, OnboardingContent;
    var __moduleName = context_1 && context_1.id;
    function Onboarding() {
        return (_jsx(contexts_1.OnboardingProvider, { children: _jsxs(react_native_safe_area_context_1.SafeAreaView, { className: "flex-1 bg-white dark:bg-neutral-900", children: [_jsx(OnboardingHeader, {}), _jsx(OnboardingContent, {})] }) }));
    }
    exports_1("default", Onboarding);
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
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (onboarding_1_1) {
                onboarding_1 = onboarding_1_1;
            }
        ],
        execute: function () {
            OnboardingHeader = () => {
                const { currentStep, totalSteps } = contexts_1.useOnboarding();
                const progress = Math.min(((currentStep - 1) / totalSteps) * 100, 100); // Cap at 100%
                const animatedWidth = react_1.useRef(new react_native_1.Animated.Value(0)).current;
                react_1.useEffect(() => {
                    react_native_1.Animated.timing(animatedWidth, {
                        toValue: progress,
                        duration: 300,
                        useNativeDriver: false,
                    }).start();
                }, [progress]);
                return (_jsx(react_native_1.View, { className: "pt-6 pb-6 px-6 bg-white dark:bg-neutral-900", children: _jsxs(react_native_1.View, { className: "max-w-[720px] w-full self-center", children: [_jsx(react_native_1.View, { className: "w-full h-2 rounded-full bg-muted/30 dark:bg-muted-dark/20 overflow-hidden", children: _jsx(react_native_1.Animated.View, { style: {
                                        width: animatedWidth.interpolate({
                                            inputRange: [0, 100],
                                            outputRange: ['0%', '100%'],
                                        }),
                                        height: '100%',
                                        backgroundColor: '#ea580c',
                                    }, className: "rounded-full" }) }), currentStep <= totalSteps && (_jsxs(react_native_1.Text, { className: "text-center text-sm font-sans text-stone-500 dark:text-stone-400 mt-2", children: ["Step ", currentStep, " of ", totalSteps] }))] }) }));
            };
            OnboardingContent = () => {
                const { currentStep } = contexts_1.useOnboarding();
                switch (currentStep) {
                    case 1:
                        return _jsx(onboarding_1.Step1, {});
                    case 2:
                        return _jsx(onboarding_1.Step2, {});
                    case 3:
                        return _jsx(onboarding_1.Step3, {});
                    case 4:
                        return _jsx(onboarding_1.Step4, {});
                    case 5:
                        return _jsx(onboarding_1.Complete, {});
                    default:
                        return _jsx(onboarding_1.Step1, {});
                }
            };
        }
    };
});
