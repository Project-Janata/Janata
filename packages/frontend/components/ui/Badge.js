System.register(["react/jsx-runtime", "react-native", "lucide-react-native", "../contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, lucide_react_native_1, contexts_1, LIGHT_STYLES, DARK_STYLES;
    var __moduleName = context_1 && context_1.id;
    function Badge({ label, variant }) {
        const { isDark } = contexts_1.useTheme();
        const style = isDark ? DARK_STYLES[variant] : LIGHT_STYLES[variant];
        return (_jsxs(react_native_1.View, { style: {
                backgroundColor: style.bg,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 4,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
            }, children: [style.showCheck && _jsx(lucide_react_native_1.Check, { size: 11, color: style.text, strokeWidth: 3 }), _jsx(react_native_1.Text, { style: {
                        fontSize: 11,
                        fontFamily: 'Inclusive Sans',
                        color: style.text,
                        lineHeight: 14,
                    }, children: label })] }));
    }
    exports_1("default", Badge);
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
            LIGHT_STYLES = {
                going: { bg: '#ECFDF5', text: '#059669', showCheck: true },
                member: { bg: '#ECFDF5', text: '#059669', showCheck: true },
                upcoming: { bg: '#E8862A', text: '#FFFFFF' },
                past: { bg: 'rgba(120,113,108,0.85)', text: '#FFFFFF' },
                host: { bg: '#FFF7ED', text: '#E8862A' },
            };
            DARK_STYLES = {
                going: { bg: 'rgba(6,95,70,0.25)', text: '#34D399', showCheck: true },
                member: { bg: 'rgba(6,95,70,0.25)', text: '#34D399', showCheck: true },
                upcoming: { bg: '#E8862A', text: '#FFFFFF' },
                past: { bg: 'rgba(120,113,108,0.5)', text: '#D6D3D1' },
                host: { bg: 'rgba(232,134,42,0.15)', text: '#F59E0B' },
            };
        }
    };
});
