System.register(["react/jsx-runtime", "react-native", "react-native-safe-area-context", "react", "../contexts", "../ui"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, react_native_safe_area_context_1, react_1, contexts_1, ui_1;
    var __moduleName = context_1 && context_1.id;
    function Step4() {
        const { goToNextStep, interests, setInterests, skipOnboarding, returnTo, isSubmitting } = contexts_1.useOnboarding();
        const [error, setError] = react_1.useState(null);
        const interestOptions = [
            'Satsangs',
            'Bhiksha',
            'Global Events',
            'Local Events',
            'Casual',
            'Formal',
        ];
        const handleSelectInterest = (interest) => {
            if (interests.includes(interest)) {
                setInterests(interests.filter((i) => i !== interest));
            }
            else {
                setInterests([...interests, interest]);
            }
        };
        const handleContinue = () => {
            if (interests.length === 0) {
                setError('Please select at least one interest');
                return;
            }
            goToNextStep();
        };
        return (_jsx(react_native_safe_area_context_1.SafeAreaView, { className: "flex-1 bg-white dark:bg-neutral-900", children: _jsxs(react_native_1.View, { className: "max-w-[720px] w-full flex-1 self-center px-6", children: [_jsx(react_native_1.View, { className: "flex-1 justify-center", children: _jsxs(react_native_1.View, { className: "w-full", children: [_jsxs(react_native_1.View, { className: "mb-8", children: [_jsx(react_native_1.Text, { className: "text-4xl font-sans font-bold text-content dark:text-content-dark text-center mb-3", children: "What are your interests?" }), _jsx(react_native_1.Text, { className: "text-lg font-sans text-stone-500 dark:text-stone-400 text-center", children: "Select topics that interest you to personalize your experience." })] }), _jsx(react_native_1.View, { className: "flex-row flex-wrap justify-center gap-3", children: interestOptions.map((option) => {
                                        const isSelected = interests.includes(option);
                                        return (_jsx(react_native_1.Pressable, { onPress: () => handleSelectInterest(option), className: `px-6 py-3.5 rounded-full border-2 ${isSelected
                                                ? 'bg-primary border-primary shadow-lg'
                                                : 'bg-stone-100 dark:bg-stone-800 border-transparent shadow-sm'}`, children: _jsx(react_native_1.Text, { className: `font-sans font-semibold text-base ${isSelected ? 'text-white' : 'text-stone-600 dark:text-stone-300'}`, children: option }) }, option));
                                    }) }), error && (_jsx(react_native_1.View, { className: "w-full max-w-md self-center mt-4 bg-red-50 dark:bg-red-900/20 rounded-xl p-4", children: _jsx(react_native_1.Text, { className: "text-red-600 dark:text-red-400 font-sans text-center", children: error }) }))] }) }), _jsxs(react_native_1.View, { className: "pb-6", children: [_jsx(ui_1.PrimaryButton, { onPress: handleContinue, disabled: interests.length === 0, style: { width: '100%', maxWidth: 448, alignSelf: 'center' }, children: "Continue" }), returnTo && (_jsx(react_native_1.Pressable, { onPress: skipOnboarding, disabled: isSubmitting, style: { alignSelf: 'center', marginTop: 12 }, children: _jsx(react_native_1.Text, { className: "text-sm font-sans text-stone-400 dark:text-stone-500", children: "Skip for now" }) }))] })] }) }));
    }
    exports_1("default", Step4);
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
