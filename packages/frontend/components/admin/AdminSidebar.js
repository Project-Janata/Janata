System.register(["react/jsx-runtime", "react-native", "lucide-react-native", "../contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, lucide_react_native_1, contexts_1, tabs, styles;
    var __moduleName = context_1 && context_1.id;
    function AdminSidebar({ activeTab, onTabChange }) {
        const { isDark } = contexts_1.useTheme();
        const inactiveColor = isDark ? '#A8A29E' : '#78716C';
        return (_jsxs(react_native_1.View, { style: [
                styles.container,
                {
                    backgroundColor: isDark ? '#1a1a1a' : '#F5F5F4',
                    borderRightColor: isDark ? '#262626' : '#E7E5E4',
                },
            ], children: [_jsx(react_native_1.Text, { style: styles.header, children: "Admin" }), tabs.map(({ key, label, Icon }) => {
                    const isActive = activeTab === key;
                    const color = isActive ? '#E8862A' : inactiveColor;
                    return (_jsxs(react_native_1.Pressable, { onPress: () => onTabChange(key), style: [
                            styles.tab,
                            isActive && styles.tabActive,
                        ], children: [_jsx(Icon, { size: 18, color: color }), _jsx(react_native_1.Text, { style: [styles.tabLabel, { color }], children: label })] }, key));
                })] }));
    }
    exports_1("default", AdminSidebar);
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
            tabs = [
                { key: 'Centers', label: 'Centers', Icon: lucide_react_native_1.Building2 },
                { key: 'Events', label: 'Events', Icon: lucide_react_native_1.CalendarDays },
                { key: 'Users', label: 'Users', Icon: lucide_react_native_1.Users },
                { key: 'Invite Codes', label: 'Invite Codes', Icon: lucide_react_native_1.Ticket },
                { key: 'Notifications', label: 'Notifications', Icon: lucide_react_native_1.Bell },
            ];
            styles = react_native_1.StyleSheet.create({
                container: {
                    width: 200,
                    borderRightWidth: 1,
                    paddingTop: 20,
                    paddingHorizontal: 12,
                },
                header: {
                    fontFamily: 'Inclusive Sans',
                    fontSize: 15,
                    color: '#E8862A',
                    marginBottom: 20,
                    paddingHorizontal: 8,
                },
                tab: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 8,
                    borderRadius: 8,
                    marginBottom: 4,
                },
                tabActive: {
                    backgroundColor: 'rgba(232,134,42,0.12)',
                },
                tabLabel: {
                    fontFamily: 'Inclusive Sans',
                    fontSize: 14,
                    marginLeft: 10,
                },
            });
        }
    };
});
