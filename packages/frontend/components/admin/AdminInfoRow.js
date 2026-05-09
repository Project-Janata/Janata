System.register(["react/jsx-runtime", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1;
    var __moduleName = context_1 && context_1.id;
    function AdminInfoRow({ icon, text, colors, textColor }) {
        return (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8 }, children: [icon, _jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: 12,
                        color: textColor ?? colors.text,
                        flex: 1,
                    }, numberOfLines: 2, children: text })] }));
    }
    exports_1("default", AdminInfoRow);
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
