System.register(["react/jsx-runtime", "react-native", "react"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, react_1;
    var __moduleName = context_1 && context_1.id;
    function AuthInput({ secureTextEntry, onChangeText, ...props }) {
        const [hasText, setHasText] = react_1.useState(false);
        const handleChangeText = (text) => {
            setHasText(text.length > 0);
            onChangeText?.(text);
        };
        return (_jsx(react_native_1.TextInput, { className: `w-full font-sans rounded-lg px-4 py-3 min-h-[48px] bg-stone-100 dark:bg-stone-800 focus:border-primary focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-400 ${hasText ? 'text-content dark:text-content-dark' : ''}`, placeholderTextColor: "#9ca3af", secureTextEntry: secureTextEntry, onChangeText: handleChangeText, style: {
                fontSize: 16,
                fontFamily: 'Inclusive Sans',
                letterSpacing: secureTextEntry ? 0.125 : 0,
            }, ...props }));
    }
    exports_1("default", AuthInput);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            }
        ],
        execute: function () {
        }
    };
});
