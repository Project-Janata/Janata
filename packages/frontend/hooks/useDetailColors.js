System.register(["react", "../components/contexts"], function (exports_1, context_1) {
    "use strict";
    var react_1, contexts_1;
    var __moduleName = context_1 && context_1.id;
    function useDetailColors() {
        const { isDark } = contexts_1.useTheme();
        return react_1.useMemo(() => isDark
            ? {
                panelBg: '#171717', // neutral-900 — matches app shell
                text: '#F3F4F6',
                textSecondary: '#9CA3AF',
                textMuted: '#6B7280',
                border: '#404040', // neutral-700
                iconBoxBg: '#262626', // neutral-800
                cardBg: '#262626', // neutral-800
                avatarBorder: '#171717',
                attendedBg: 'rgba(6,95,70,0.2)',
                iconHeader: '#9CA3AF',
            }
            : {
                panelBg: '#FFFFFF',
                text: '#1C1917',
                textSecondary: '#78716C',
                textMuted: '#A8A29E',
                border: '#E7E5E4',
                iconBoxBg: '#F5F5F4',
                cardBg: '#F5F5F4',
                avatarBorder: '#FFFFFF',
                attendedBg: '#ECFDF5',
                iconHeader: '#78716C',
            }, [isDark]);
    }
    exports_1("useDetailColors", useDetailColors);
    return {
        setters: [
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            }
        ],
        execute: function () {
        }
    };
});
