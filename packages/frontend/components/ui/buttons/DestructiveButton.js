System.register(["react/jsx-runtime", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1;
    var __moduleName = context_1 && context_1.id;
    function DestructiveButton({ children, onPress, disabled, loading, style, ...props }) {
        const isDisabled = disabled || loading;
        return (_jsx(react_native_1.Pressable, { onPress: !isDisabled ? onPress : undefined, disabled: isDisabled, className: "bg-red-600 px-4 py-3 rounded-full active:bg-red-700 disabled:opacity-50", style: style, ...props, children: loading ? (_jsx(react_native_1.ActivityIndicator, { size: "small", color: "#FFFFFF" })) : (_jsx(react_native_1.Text, { className: "text-backgroundStrong font-sans text-bold text-gray-100 leading-4 text-center", children: children })) }));
    }
    exports_1("default", DestructiveButton);
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
