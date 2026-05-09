System.register(["react/jsx-runtime", "react", "react-native", "expo-router"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, expo_router_1;
    var __moduleName = context_1 && context_1.id;
    function LandingPage() {
        const router = expo_router_1.useRouter();
        react_1.default.useEffect(() => {
            router.replace('/auth');
        }, []);
        return (_jsx(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center' }, children: _jsx(react_native_1.Text, { children: "Redirecting..." }) }));
    }
    exports_1("default", LandingPage);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            }
        ],
        execute: function () {
        }
    };
});
