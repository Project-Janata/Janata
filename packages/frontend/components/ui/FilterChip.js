System.register(["react/jsx-runtime", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1;
    var __moduleName = context_1 && context_1.id;
    function FilterChip({ label, icon, active, onPress, variant = 'filled', }) {
        const isOutline = variant === 'outline';
        return (_jsxs(react_native_1.Pressable, { onPress: onPress, className: `flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border active:opacity-70 ${active
                ? isOutline
                    ? 'border-primary bg-primary/10'
                    : 'bg-primary border-primary'
                : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700'}`, children: [icon && _jsx(react_native_1.View, { children: icon }), _jsx(react_native_1.Text, { className: `text-sm font-sans ${active
                        ? isOutline
                            ? 'text-primary'
                            : 'text-white'
                        : 'text-gray-500 dark:text-gray-400'}`, children: label })] }));
    }
    exports_1("default", FilterChip);
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
