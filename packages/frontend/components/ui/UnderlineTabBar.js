System.register(["react/jsx-runtime", "react-native", "../contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, contexts_1;
    var __moduleName = context_1 && context_1.id;
    function UnderlineTabBar({ tabs, activeTab, onTabChange, counts }) {
        const { isDark } = contexts_1.useTheme();
        const borderColor = isDark ? '#404040' : '#E7E5E4';
        const inactiveColor = isDark ? '#6B7280' : '#A8A29E';
        return (_jsx(react_native_1.View, { className: "flex-row", style: { borderBottomWidth: 1, borderBottomColor: borderColor }, children: tabs.map((tab) => {
                const isActive = tab === activeTab;
                const count = counts?.[tab];
                const labelColor = isActive ? '#E8862A' : inactiveColor;
                const countColor = isActive ? '#E8862A99' : (isDark ? '#52525B' : '#D6D3D1');
                return (_jsx(react_native_1.Pressable, { onPress: () => onTabChange(tab), className: "flex-1 items-center pb-3 pt-1", style: isActive ? { borderBottomWidth: 2, borderBottomColor: '#E8862A', marginBottom: -1 } : { marginBottom: -1 }, children: _jsxs(react_native_1.Text, { style: {
                            fontSize: 14,
                            fontFamily: 'Inclusive Sans',
                            color: labelColor,
                        }, children: [tab, count != null && (_jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', color: countColor }, children: ['  ', count] }))] }) }, tab));
            }) }));
    }
    exports_1("default", UnderlineTabBar);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            }
        ],
        execute: function () {
        }
    };
});
