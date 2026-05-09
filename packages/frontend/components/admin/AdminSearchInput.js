System.register(["react/jsx-runtime", "react-native", "lucide-react-native", "../../hooks/useDetailColors"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, lucide_react_native_1, useDetailColors_1, styles;
    var __moduleName = context_1 && context_1.id;
    function AdminSearchInput({ value, onChangeText, placeholder = 'Search...', }) {
        const colors = useDetailColors_1.useDetailColors();
        return (_jsxs(react_native_1.View, { style: [styles.container, { backgroundColor: colors.iconBoxBg }], children: [_jsx(lucide_react_native_1.Search, { size: 16, color: colors.textMuted, style: styles.icon }), _jsx(react_native_1.TextInput, { value: value, onChangeText: onChangeText, placeholder: placeholder, placeholderTextColor: colors.textMuted, style: [
                        styles.input,
                        {
                            color: colors.text,
                            outlineStyle: 'none',
                        },
                    ] })] }));
    }
    exports_1("default", AdminSearchInput);
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
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                },
                icon: {
                    marginRight: 8,
                },
                input: {
                    flex: 1,
                    fontFamily: 'Inclusive Sans',
                    fontSize: 13,
                    padding: 0,
                },
            });
        }
    };
});
