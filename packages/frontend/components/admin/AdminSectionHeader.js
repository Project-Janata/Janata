System.register(["react/jsx-runtime", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1;
    var __moduleName = context_1 && context_1.id;
    function AdminSectionHeader({ label, actionLabel, onAction, colors }) {
        return (_jsxs(react_native_1.View, { style: {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 20,
                marginBottom: 8,
            }, children: [_jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        color: colors.textMuted,
                    }, children: label }), actionLabel && onAction && (_jsx(react_native_1.Pressable, { onPress: onAction, children: _jsx(react_native_1.Text, { style: {
                            fontFamily: 'Inclusive Sans',
                            fontSize: 11,
                            color: '#E8862A',
                        }, children: actionLabel }) }))] }));
    }
    exports_1("default", AdminSectionHeader);
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
