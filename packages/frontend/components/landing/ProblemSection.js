System.register(["react/jsx-runtime", "react-native", "lucide-react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, lucide_react_native_1;
    var __moduleName = context_1 && context_1.id;
    function PersonaCard({ role, headline, situation, quote, Icon, accent, isMobile, }) {
        return (_jsxs(react_native_1.View, { style: {
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: isMobile ? 24 : 32,
                boxShadow: '0 2px 24px rgba(0,0,0,0.05)',
                borderWidth: 1,
                borderColor: '#F5F0EB',
            }, children: [_jsxs(react_native_1.View, { style: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 14,
                        marginBottom: 20,
                    }, children: [_jsx(react_native_1.View, { style: {
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                                backgroundColor: '#FFF7ED',
                                borderWidth: 1,
                                borderColor: '#FED7AA',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }, children: _jsx(Icon, { size: 26, color: accent, strokeWidth: 1.75 }) }), _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans, sans-serif',
                                fontWeight: '600',
                                fontSize: 11,
                                letterSpacing: 1.5,
                                textTransform: 'uppercase',
                                color: accent,
                            }, children: role })] }), _jsx(react_native_1.Text, { style: {
                        fontFamily: '"Inclusive Sans", sans-serif',
                        fontWeight: '400',
                        fontSize: isMobile ? 26 : 32,
                        lineHeight: isMobile ? 32 : 40,
                        color: '#1C1917',
                        marginBottom: 16,
                    }, children: headline }), _jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans, sans-serif',
                        fontWeight: '400',
                        fontSize: isMobile ? 15 : 16,
                        lineHeight: isMobile ? 24 : 26,
                        color: '#57534E',
                        marginBottom: 20,
                    }, children: situation }), _jsx(react_native_1.View, { style: {
                        borderLeftWidth: 3,
                        borderLeftColor: accent,
                        paddingLeft: 14,
                        paddingVertical: 4,
                    }, children: _jsxs(react_native_1.Text, { style: {
                            fontFamily: '"Inclusive Sans", sans-serif',
                            fontWeight: '400',
                            fontStyle: 'italic',
                            fontSize: isMobile ? 16 : 17,
                            lineHeight: isMobile ? 24 : 26,
                            color: '#1C1917',
                        }, children: ["\u201C", quote, "\u201D"] }) })] }));
    }
    function ProblemSection() {
        const { width } = react_native_1.useWindowDimensions();
        const isMobile = width < 768;
        const isTablet = width >= 768 && width < 1024;
        return (_jsxs(react_native_1.View, { style: {
                paddingHorizontal: isMobile ? 20 : isTablet ? 40 : 80,
                paddingVertical: isMobile ? 60 : isTablet ? 80 : 100,
                backgroundColor: '#FAFAF7',
            }, children: [_jsxs(react_native_1.View, { style: { maxWidth: 760, marginBottom: isMobile ? 40 : 56 }, children: [_jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans, sans-serif',
                                fontWeight: '600',
                                fontSize: 12,
                                letterSpacing: 1.5,
                                textTransform: 'uppercase',
                                color: '#C2410C',
                                marginBottom: 16,
                            }, children: "THE PROBLEM" }), _jsx(react_native_1.Text, { style: {
                                fontFamily: '"Inclusive Sans", sans-serif',
                                fontWeight: '400',
                                fontSize: isMobile ? 32 : isTablet ? 40 : 48,
                                lineHeight: isMobile ? 40 : isTablet ? 48 : 56,
                                color: '#1C1917',
                                marginBottom: 20,
                            }, children: "50+ centers. But CHYKs can't find each other." }), _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans, sans-serif',
                                fontWeight: '400',
                                fontSize: isMobile ? 16 : 18,
                                lineHeight: isMobile ? 26 : 30,
                                color: '#57534E',
                            }, children: "Events happen every week across the Mission. They're scattered across WhatsApp, email, flyers, and word of mouth. Members miss out. Coordinators burn out. The community pays the price either way." })] }), _jsxs(react_native_1.View, { style: {
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 16 : 24,
                    }, children: [_jsx(PersonaCard, { role: "For Members", headline: "Showing up shouldn't take weeks.", situation: "Joins CHYK in college, then moves cities for work. No idea how to plug back in locally. Spends weeks tracking down a WhatsApp group \u2014 and only after someone mentions it in passing.", quote: "I didn't know which event to show up to first, or whether I'd even be welcome.", Icon: lucide_react_native_1.MapPin, accent: "#C2410C", isMobile: isMobile }), _jsx(PersonaCard, { role: "For Coordinators", headline: "Running events shouldn't be a part-time job.", situation: "Runs a local CHYK chapter. Every event means making a flyer, posting to WhatsApp, creating a Google Form, checking it manually, copying the same message across five group chats. Rarely tracks who actually showed up.", quote: "I don't have the tools I need for community and event management.", Icon: lucide_react_native_1.Megaphone, accent: "#9A3412", isMobile: isMobile })] })] }));
    }
    exports_1("ProblemSection", ProblemSection);
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
            }
        ],
        execute: function () {
        }
    };
});
