System.register(["react/jsx-runtime", "react-native", "../components/landing/NavBar", "../components/landing/Footer", "../components/landing/CookiePolicy"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, NavBar_1, Footer_1, CookiePolicy_1;
    var __moduleName = context_1 && context_1.id;
    function CookiePolicyWeb() {
        return (_jsxs(react_native_1.ScrollView, { style: { flex: 1, backgroundColor: '#FAFAF7' }, children: [_jsx(NavBar_1.NavBar, {}), _jsx(CookiePolicy_1.CookiePolicy, {}), _jsx(Footer_1.Footer, {})] }));
    }
    exports_1("default", CookiePolicyWeb);
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
            function (CookiePolicy_1_1) {
                CookiePolicy_1 = CookiePolicy_1_1;
            }
        ],
        execute: function () {
        }
    };
});
