System.register(["./OnboardingProvider", "./UserContext", "./ThemeContext"], function (exports_1, context_1) {
    "use strict";
    var OnboardingProvider_1, UserContext_1, ThemeContext_1;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (OnboardingProvider_1_1) {
                OnboardingProvider_1 = OnboardingProvider_1_1;
            },
            function (UserContext_1_1) {
                UserContext_1 = UserContext_1_1;
            },
            function (ThemeContext_1_1) {
                ThemeContext_1 = ThemeContext_1_1;
            }
        ],
        execute: function () {
            exports_1("OnboardingProvider", OnboardingProvider_1.default);
            exports_1("useOnboarding", OnboardingProvider_1.useOnboarding);
            exports_1("UserContext", UserContext_1.default);
            exports_1("UserProvider", UserContext_1.UserProvider);
            exports_1("useUser", UserContext_1.useUser);
            exports_1("ThemeProvider", ThemeContext_1.ThemeProvider);
            exports_1("useTheme", ThemeContext_1.useTheme);
        }
    };
});
