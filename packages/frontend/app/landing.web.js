System.register(["react/jsx-runtime", "react-native", "../components/landing/NavBar", "../components/landing/Hero", "../components/landing/AppPreview", "../components/landing/ProblemSection", "../components/landing/CommunitySection", "../components/landing/FinalCTA", "../components/landing/Footer"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, NavBar_1, Hero_1, AppPreview_1, ProblemSection_1, CommunitySection_1, FinalCTA_1, Footer_1;
    var __moduleName = context_1 && context_1.id;
    function LandingPage() {
        return (_jsxs(react_native_1.ScrollView, { style: { flex: 1, backgroundColor: '#FAFAF7' }, contentContainerStyle: { minHeight: '100%' }, bounces: false, overScrollMode: "never", children: [_jsx(NavBar_1.NavBar, {}), _jsx(Hero_1.Hero, {}), _jsx(ProblemSection_1.ProblemSection, {}), _jsx(AppPreview_1.AppPreview, {}), _jsx(CommunitySection_1.CommunitySection, {}), _jsx(FinalCTA_1.FinalCTA, {}), _jsx(Footer_1.Footer, {})] }));
    }
    exports_1("default", LandingPage);
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
            function (Hero_1_1) {
                Hero_1 = Hero_1_1;
            },
            function (AppPreview_1_1) {
                AppPreview_1 = AppPreview_1_1;
            },
            function (ProblemSection_1_1) {
                ProblemSection_1 = ProblemSection_1_1;
            },
            function (CommunitySection_1_1) {
                CommunitySection_1 = CommunitySection_1_1;
            },
            function (FinalCTA_1_1) {
                FinalCTA_1 = FinalCTA_1_1;
            },
            function (Footer_1_1) {
                Footer_1 = Footer_1_1;
            }
        ],
        execute: function () {
            // Prevent overscroll bounce on web
            if (react_native_1.Platform.OS === 'web' && typeof document !== 'undefined') {
                document.documentElement.style.overscrollBehavior = 'none';
                document.body.style.overscrollBehavior = 'none';
            }
        }
    };
});
