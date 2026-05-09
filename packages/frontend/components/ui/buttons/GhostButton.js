System.register(["react/jsx-runtime", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1;
    var __moduleName = context_1 && context_1.id;
    function GhostButton({ children, onPress, disabled, style, ...props }) {
        return (_jsx(react_native_1.Pressable, { onPress: !disabled ? onPress : undefined, disabled: disabled, className: "bg-transparent px-4 py-3 rounded-full active:bg-gray-200 dark:active:bg-gray-700 disabled:opacity-50", style: style, ...props, children: _jsx(react_native_1.Text, { className: "text-content dark:text-content-dark text-base leading-4 text-center", children: children }) }));
    }
    exports_1("default", GhostButton);
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
