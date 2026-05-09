System.register(["react/jsx-runtime", "react-native", "../contexts", "react-native-safe-area-context", "react", "../ui"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, contexts_1, react_native_safe_area_context_1, react_1, ui_1;
    var __moduleName = context_1 && context_1.id;
    function StepOne() {
        const { goToNextStep, firstName, setFirstName, lastName, setLastName } = contexts_1.useOnboarding();
        const [focusedField, setFocusedField] = react_1.useState(null);
        const [errors, setErrors] = react_1.useState({});
        const FieldError = ({ message }) => {
            if (!message)
                return null;
            return _jsx(react_native_1.Text, { className: "text-red-500 text-sm mt-1 ml-1 font-sans", children: message });
        };
        const errorMessages = Object.values(errors).filter(Boolean);
        // Clear errors on input change
        const handleFirstNameChange = (text) => {
            setFirstName(text);
            setErrors((prev) => ({ ...prev, firstName: '' }));
        };
        const handleLastNameChange = (text) => {
            setLastName(text);
            setErrors((prev) => ({ ...prev, lastName: '' }));
        };
        const handleContinue = () => {
            if (!firstName.trim()) {
                setErrors({ ...errors, firstName: 'First name is required' });
                return;
            }
            if (!lastName.trim()) {
                setErrors({ ...errors, lastName: 'Last name is required' });
                return;
            }
            setFirstName(firstName.trim());
            setLastName(lastName.trim());
            goToNextStep();
        };
        return (_jsx(react_native_safe_area_context_1.SafeAreaView, { className: "flex-1 bg-white dark:bg-neutral-900", children: _jsxs(react_native_1.View, { className: "max-w-[720px] w-full flex-1 self-center px-6", children: [_jsx(react_native_1.View, { className: "flex-1 justify-center items-center", children: _jsxs(react_native_1.View, { className: "gap-4 w-full", children: [_jsxs(react_native_1.View, { className: "gap-2", children: [_jsx(react_native_1.Text, { className: "text-4xl font-sans font-bold text-content dark:text-content-dark text-center", children: "Welcome to Janata!" }), _jsx(react_native_1.Text, { className: "text-lg font-sans text-stone-500 dark:text-stone-400 text-center", children: "Enter your name to get started with your journey." })] }), _jsxs(react_native_1.View, { className: "gap-3 mt-8 w-full items-center", children: [errorMessages.length > 0 && (_jsx(react_native_1.View, { className: " font-sans bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 mb-4", children: errorMessages.map((msg, idx) => (_jsx(react_native_1.Text, { className: "text-red-500 text-sm font-sans", children: msg }, idx))) })), _jsx(react_native_1.TextInput, { className: `text-content dark:text-content-dark w-full max-w-md font-sans rounded-xl px-4 py-4 text-base bg-stone-100 dark:bg-stone-800 border-2 outline-none ${focusedField === 'first' ? 'border-primary' : 'border-transparent'} placeholder:text-gray-400 dark:placeholder:text-gray-500`, placeholder: "First Name", value: firstName, onChangeText: handleFirstNameChange, onFocus: () => setFocusedField('first'), onBlur: () => setFocusedField(null), placeholderTextColor: "#9ca3af", autoCapitalize: "words", autoComplete: "given-name", autoCorrect: false }), _jsx(react_native_1.TextInput, { className: `text-content dark:text-content-dark w-full max-w-md font-sans rounded-xl px-4 py-4 text-base bg-stone-100 dark:bg-stone-800 border-2 outline-none ${focusedField === 'last' ? 'border-primary' : 'border-transparent'} placeholder:text-gray-400 dark:placeholder:text-gray-500`, placeholder: "Last Name", value: lastName, onChangeText: handleLastNameChange, onFocus: () => setFocusedField('last'), onBlur: () => setFocusedField(null), placeholderTextColor: "#9ca3af", autoCapitalize: "words", autoComplete: "family-name", autoCorrect: false })] })] }) }), _jsx(react_native_1.View, { className: "pb-6", children: _jsx(ui_1.PrimaryButton, { onPress: handleContinue, disabled: !firstName.trim() || !lastName.trim(), style: { width: '100%', maxWidth: 448, alignSelf: 'center' }, children: "Continue" }) })] }) }));
    }
    exports_1("default", StepOne);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (react_native_safe_area_context_1_1) {
                react_native_safe_area_context_1 = react_native_safe_area_context_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            }
        ],
        execute: function () {
        }
    };
});
