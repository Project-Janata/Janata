System.register(["react/jsx-runtime", "expo-router", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, expo_router_1, react_native_1;
    var __moduleName = context_1 && context_1.id;
    function NotFoundScreen() {
        return (_jsxs(_Fragment, { children: [_jsx(expo_router_1.Stack.Screen, { options: { title: 'Oops!' } }), _jsxs(react_native_1.View, { className: "flex-1 items-center justify-center p-5", children: [_jsx(react_native_1.Text, { className: "text-xl font-bold mb-2", children: "This screen doesn't exist." }), _jsx(expo_router_1.Link, { href: "/", className: "mt-4 py-4", children: _jsx(react_native_1.Text, { className: "text-base text-blue-600", children: "Go to home screen!" }) })] })] }));
    }
    exports_1("default", NotFoundScreen);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            }
        ],
        execute: function () {
        }
    };
});
