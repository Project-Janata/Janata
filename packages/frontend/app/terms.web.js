System.register(["react/jsx-runtime", "react-native", "../components/landing/NavBar", "../components/landing/Footer", "../components/landing/TermsOfService"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, NavBar_1, Footer_1, TermsOfService_1;
    var __moduleName = context_1 && context_1.id;
    function TermsWeb() {
        return (_jsxs(react_native_1.ScrollView, { style: { flex: 1, backgroundColor: '#FAFAF7' }, children: [_jsx(NavBar_1.NavBar, {}), _jsx(TermsOfService_1.TermsOfService, {}), _jsx(Footer_1.Footer, {})] }));
    }
    exports_1("default", TermsWeb);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (NavBar_1_1) {
                NavBar_1 = NavBar_1_1;
            },
            function (Footer_1_1) {
                Footer_1 = Footer_1_1;
            },
            function (TermsOfService_1_1) {
                TermsOfService_1 = TermsOfService_1_1;
            }
        ],
        execute: function () {
        }
    };
});
