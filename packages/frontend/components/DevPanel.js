System.register(["react/jsx-runtime", "react-native", "expo-router", "./contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, expo_router_1, contexts_1;
    var __moduleName = context_1 && context_1.id;
    function DevPanel({ visible, onClose }) {
        const router = expo_router_1.useRouter();
        const { setUser } = contexts_1.useUser();
        if (!visible)
            return null;
        const handleGoToHome = () => {
            setUser({
                username: 'devuser@example.com',
                firstName: 'Dev',
                lastName: 'User',
                email: 'devuser@example.com',
                centerID: '-1',
                profileComplete: true,
            });
            router.push('/');
        };
        const handleGoToOnboarding = () => {
            setUser({
                username: 'devuser@example.com',
                firstName: 'Dev',
                lastName: 'User',
                email: 'devuser@example.com',
                centerID: '-1',
                profileComplete: false,
            });
            router.push('/onboarding');
        };
        return (_jsxs(react_native_1.View, { className: "absolute left-1/2 -translate-x-1/2 mt-2 z-50 bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-6 flex flex-col gap-4", style: { minWidth: 220 }, children: [_jsxs(react_native_1.View, { className: "flex-row justify-between items-center mb-2", children: [_jsx(react_native_1.Text, { className: "font-sans font-bold text-lg text-content dark:text-content-dark", children: "Dev Panel" }), _jsx(react_native_1.Pressable, { className: "ml-2 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-neutral-800", onPress: onClose, children: _jsx(react_native_1.Text, { className: "text-lg font-bold text-gray-500 dark:text-gray-300", children: "\u00D7" }) })] }), _jsx(react_native_1.Pressable, { className: "bg-primary rounded-lg px-4 py-2 active:opacity-80", onPress: handleGoToHome, children: _jsx(react_native_1.Text, { className: "text-white font-sans font-medium", children: "Go to Home" }) }), _jsx(react_native_1.Pressable, { className: "bg-primary rounded-lg px-4 py-2 active:opacity-80", onPress: handleGoToOnboarding, children: _jsx(react_native_1.Text, { className: "text-white font-sans font-medium", children: "Go to Onboarding" }) })] }));
    }
    exports_1("default", DevPanel);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            }
        ],
        execute: function () {
        }
    };
});
