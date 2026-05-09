System.register(["react/jsx-runtime", "react", "react-native", "../contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, contexts_1;
    var __moduleName = context_1 && context_1.id;
    function TabSegment({ options, value, onValueChange, variant = 'primary', }) {
        const { isDark } = contexts_1.useTheme();
        const selectedIndex = options.findIndex((opt) => opt.value === value);
        const optionWidth = 80;
        const indicatorPadding = 8;
        const slideAnim = react_1.useRef(new react_native_1.Animated.Value(selectedIndex * optionWidth)).current;
        react_1.useEffect(() => {
            react_native_1.Animated.timing(slideAnim, {
                toValue: selectedIndex * optionWidth,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }, [selectedIndex, slideAnim]);
        const containerClass = variant === 'primary'
            ? 'bg-gray-100 dark:bg-neutral-800'
            : 'bg-gray-100 dark:bg-neutral-800';
        return (_jsxs(react_native_1.View, { className: `relative flex-row ${containerClass} rounded-lg p-1`, style: {
                width: optionWidth * options.length + indicatorPadding,
            }, children: [_jsx(react_native_1.Animated.View, { style: {
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        width: optionWidth - 8 + indicatorPadding,
                        height: 32,
                        borderRadius: 6,
                        backgroundColor: isDark ? '#3f3f46' : '#e5e7eb',
                        transform: [{ translateX: slideAnim }],
                    } }), options.map((option, idx) => {
                    const isActive = value === option.value;
                    return (_jsx(react_native_1.TouchableOpacity, { onPress: () => onValueChange(option.value), className: "flex-row items-center justify-center py-2 px-3 rounded-md z-10", style: { width: optionWidth }, activeOpacity: 0.8, children: _jsx(react_native_1.Text, { className: `text-center text-xs font-sans ${isActive
                                ? 'text-primary font-sans'
                                : 'text-gray-700 dark:text-white'}`, children: option.label }) }, option.value));
                })] }));
    }
    exports_1("TabSegment", TabSegment);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            }
        ],
        execute: function () {
            exports_1("default", TabSegment);
        }
    };
});
