System.register(["react/jsx-runtime", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1;
    var __moduleName = context_1 && context_1.id;
    function SecondaryButton({ children, onPress, disabled, loading, style, ...props }) {
        const isDisabled = disabled || loading;
        return (_jsx(react_native_1.Pressable, { onPress: !isDisabled ? onPress : undefined, disabled: isDisabled, className: "border border-borderColor dark:border-borderColor-dark bg-transparent text-content dark:text-content-dark px-4 py-3 rounded-full active:bg-gray-4 disabled:opacity-50", style: style, ...props, children: loading ? (_jsx(react_native_1.ActivityIndicator, { size: "small", color: "#78716C" })) : (_jsx(react_native_1.Text, { className: "font-sans text-content dark:text-content-dark text-base leading-5 text-center", children: children })) }));
    }
    exports_1("default", SecondaryButton);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            }
        ],
        execute: function () {
        }
    };
});
