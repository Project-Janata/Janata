System.register(["react/jsx-runtime", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1;
    var __moduleName = context_1 && context_1.id;
    function PrimaryButton({ children, onPress, disabled, loading, style, ...props }) {
        const isDisabled = disabled || loading;
        const handlePress = () => {
            if (!isDisabled && onPress) {
                onPress();
            }
        };
        return (_jsx(react_native_1.Pressable, { onPress: handlePress, disabled: isDisabled, className: "bg-primary px-4 py-3 rounded-full active:bg-primary-press disabled:opacity-50", style: style, ...props, children: loading ? (_jsx(react_native_1.ActivityIndicator, { size: "small", color: "#FFFFFF" })) : (_jsx(react_native_1.Text, { className: "text-white font-sans text-base leading-5 text-center", children: children })) }));
    }
    exports_1("default", PrimaryButton);
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
