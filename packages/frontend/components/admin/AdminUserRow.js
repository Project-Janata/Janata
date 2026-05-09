System.register(["react/jsx-runtime", "react-native", "../ui"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, ui_1;
    var __moduleName = context_1 && context_1.id;
    function AdminUserRow({ name, image, actionLabel, onAction, colors, isDark }) {
        return (_jsxs(react_native_1.View, { style: {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: colors.iconBoxBg,
                borderRadius: 8,
                padding: 8,
                marginBottom: 6,
            }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8 }, children: [_jsx(ui_1.Avatar, { name: name, image: image ?? undefined, size: 24 }), _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans',
                                fontSize: 12,
                                color: colors.text,
                            }, children: name })] }), actionLabel && onAction && (_jsx(react_native_1.Pressable, { onPress: onAction, children: _jsx(react_native_1.Text, { style: {
                            fontFamily: 'Inclusive Sans',
                            fontSize: 11,
                            color: isDark ? '#F87171' : '#DC2626',
                        }, children: actionLabel }) }))] }));
    }
    exports_1("default", AdminUserRow);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            }
        ],
        execute: function () {
        }
    };
});
