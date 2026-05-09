System.register(["react/jsx-runtime", "react-native-safe-area-context", "react-native", "../contexts", "../BirthdatePicker", "../ui"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_safe_area_context_1, react_native_1, contexts_1, BirthdatePicker_1, ui_1;
    var __moduleName = context_1 && context_1.id;
    function Step2() {
        const { goToNextStep, birthdate, setBirthdate, skipOnboarding, returnTo, isSubmitting } = contexts_1.useOnboarding();
        // Only true if birthdate is not null
        const isDateSelected = !!birthdate;
        return (_jsx(react_native_safe_area_context_1.SafeAreaView, { className: "flex-1 bg-background dark:bg-background-dark", children: _jsxs(react_native_1.View, { className: "max-w-[720px] w-full flex-1 self-center px-6", children: [_jsx(react_native_1.View, { className: "flex-1 flex flex-col items-center justify-center w-full", children: _jsxs(react_native_1.View, { className: "gap-4 w-full max-w-md flex flex-col items-center justify-center", children: [_jsxs(react_native_1.View, { className: "gap-2 w-full flex flex-col items-center justify-center", children: [_jsx(react_native_1.Text, { className: "text-4xl font-sans font-bold text-content dark:text-content-dark text-center", children: "When's your birthday?" }), _jsx(react_native_1.Text, { className: "text-lg font-sans text-stone-500 dark:text-stone-400 text-center", children: "We'll use this to personalize your experience." })] }), _jsx(react_native_1.View, { className: "mt-8 w-full flex items-center justify-center", style: react_native_1.Platform.OS === 'web' ? { overflow: 'visible', zIndex: 20 } : undefined, children: _jsx(BirthdatePicker_1.default, { value: birthdate ?? undefined, onChange: setBirthdate }) })] }) }), _jsxs(react_native_1.View, { className: "pb-6", children: [_jsx(ui_1.PrimaryButton, { disabled: !isDateSelected, onPress: goToNextStep, style: { width: '100%', maxWidth: 448, alignSelf: 'center' }, children: "Continue" }), returnTo && (_jsx(react_native_1.Pressable, { onPress: skipOnboarding, disabled: isSubmitting, style: { alignSelf: 'center', marginTop: 12 }, children: _jsx(react_native_1.Text, { className: "text-sm font-sans text-stone-400 dark:text-stone-500", children: "Skip for now" }) }))] })] }) }));
    }
    exports_1("default", Step2);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_safe_area_context_1_1) {
                react_native_safe_area_context_1 = react_native_safe_area_context_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (BirthdatePicker_1_1) {
                BirthdatePicker_1 = BirthdatePicker_1_1;
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            }
        ],
        execute: function () {
        }
    };
});
