System.register(["react/jsx-runtime", "expo-router"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, expo_router_1;
    var __moduleName = context_1 && context_1.id;
    function AdminFallback() {
        return _jsx(expo_router_1.Redirect, { href: "/(tabs)" });
    }
    exports_1("default", AdminFallback);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            }
        ],
        execute: function () {
        }
    };
});
