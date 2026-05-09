System.register(["react/jsx-runtime", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1;
    var __moduleName = context_1 && context_1.id;
    function IconButton({ children, variant = 'solid', onPress, disabled, style, ...props }) {
        const baseClass = variant === 'outlined'
            ? 'border border-borderColor bg-transparent px-2 py-2 rounded-full active:bg-gray-200 disabled:opacity-50'
            : 'bg-gray-200 px-2 py-2 rounded-full active:bg-gray-400 disabled:opacity-50';
        return (_jsx(react_native_1.Pressable, { onPress: !disabled ? onPress : undefined, disabled: disabled, className: baseClass, style: style, ...props, children: children }));
    }
    exports_1("default", IconButton);
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
