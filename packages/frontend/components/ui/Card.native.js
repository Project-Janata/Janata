System.register(["react/jsx-runtime", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1;
    var __moduleName = context_1 && context_1.id;
    function Card({ children, size = 'md', padding = 'none', pressable = false, overflowHidden = false, className = '', onPress, ...props }) {
        const baseClasses = 'bg-card dark:bg-card-dark border border-borderColor dark:border-borderColor-dark';
        const sizeClasses = size === 'lg' ? 'rounded-3xl' : 'rounded-2xl';
        const paddingClasses = {
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
            none: '',
        }[padding];
        const overflowClass = overflowHidden ? 'overflow-hidden' : '';
        const activeClasses = pressable ? 'active:scale-[0.98]' : '';
        const combinedClasses = `${baseClasses} ${sizeClasses} ${paddingClasses} ${overflowClass} ${activeClasses} ${className}`.trim();
        if (pressable && onPress) {
            return (_jsx(react_native_1.Pressable, { onPress: onPress, className: combinedClasses, ...props, children: children }));
        }
        return (_jsx(react_native_1.View, { className: combinedClasses, ...props, children: children }));
    }
    exports_1("default", Card);
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
