System.register(["react/jsx-runtime", "react-native", "lucide-react-native", "../../hooks/useDetailColors"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, lucide_react_native_1, useDetailColors_1, styles;
    var __moduleName = context_1 && context_1.id;
    function AdminDetailPanel({ title, onClose, children }) {
        const colors = useDetailColors_1.useDetailColors();
        return (_jsxs(react_native_1.View, { style: [
                styles.container,
                {
                    backgroundColor: colors.panelBg,
                    borderLeftColor: colors.border,
                },
            ], children: [_jsxs(react_native_1.View, { style: [styles.header, { borderBottomColor: colors.border }], children: [_jsx(react_native_1.Text, { style: [styles.title, { color: colors.text }], children: title }), _jsx(react_native_1.Pressable, { onPress: onClose, hitSlop: 8, children: _jsx(lucide_react_native_1.X, { size: 20, color: colors.textMuted }) })] }), _jsx(react_native_1.ScrollView, { style: styles.body, contentContainerStyle: styles.bodyContent, children: children })] }));
    }
    exports_1("default", AdminDetailPanel);
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
            function (useDetailColors_1_1) {
                useDetailColors_1 = useDetailColors_1_1;
            }
        ],
        execute: function () {
            styles = react_native_1.StyleSheet.create({
                container: {
                    width: 320,
                    borderLeftWidth: 1,
                },
                header: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                },
                title: {
                    fontFamily: 'Inclusive Sans',
                    fontSize: 15,
                },
                body: {
                    flex: 1,
                },
                bodyContent: {
                    padding: 16,
                },
            });
        }
    };
});
