System.register(["react/jsx-runtime", "react-native", "lucide-react-native", "./contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, lucide_react_native_1, contexts_1, themeOptions, optionWidth;
    var __moduleName = context_1 && context_1.id;
    function ThemeSelector({ style, className }) {
        const { preference: themePreference, setPreference: setThemePreference, isDark } = contexts_1.useTheme();
        // Single source of truth — never mix themePreference + isDark for colors
        const fg = isDark ? '#fff' : '#374151';
        const selectedBg = isDark ? '#3f3f46' : '#e5e7eb';
        const getLabel = (option) => {
            if (option === 'system')
                return 'Auto';
            return option.charAt(0).toUpperCase() + option.slice(1);
        };
        return (_jsx(react_native_1.View, { className: `relative flex-row bg-gray-100 dark:bg-neutral-800 rounded-lg p-1 ${className || ''}`, style: { width: optionWidth * themeOptions.length + 8, ...(style || {}) }, children: themeOptions.map((option) => {
                const isSelected = themePreference === option;
                const iconColor = isSelected ? '#f97316' : fg;
                const textColor = isSelected ? '#f97316' : fg;
                return (_jsxs(react_native_1.Pressable, { onPress: () => setThemePreference(option), className: "flex-row items-center justify-center gap-1 py-2 px-3 rounded-md", style: {
                        width: optionWidth,
                        backgroundColor: isSelected ? selectedBg : 'transparent',
                    }, children: [option === 'light' && _jsx(lucide_react_native_1.Sun, { size: 14, color: iconColor }), option === 'dark' && _jsx(lucide_react_native_1.Moon, { size: 14, color: iconColor }), option === 'system' && _jsx(lucide_react_native_1.Monitor, { size: 14, color: iconColor }), _jsx(react_native_1.Text, { style: {
                                color: textColor,
                                fontSize: 12,
                                fontFamily: 'Inclusive Sans',
                                fontWeight: isSelected ? '600' : '400',
                            }, children: getLabel(option) })] }, option));
            }) }));
    }
    exports_1("default", ThemeSelector);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            }
        ],
        execute: function () {
            themeOptions = ['light', 'dark', 'system'];
            optionWidth = 70;
        }
    };
});
