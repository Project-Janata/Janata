System.register(["react/jsx-runtime", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1;
    var __moduleName = context_1 && context_1.id;
    function StepCard({ number, title, description, isMobile }) {
        return (_jsxs(react_native_1.View, { style: { flex: 1, gap: 10 }, children: [_jsx(react_native_1.View, { style: {
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: '#FFF7ED',
                        borderWidth: 1,
                        borderColor: '#FED7AA',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }, children: _jsx(react_native_1.Text, { style: {
                            fontFamily: '"Inclusive Sans", sans-serif',
                            fontWeight: '400',
                            fontSize: 16,
                            color: '#C2410C',
                        }, children: number }) }), _jsx(react_native_1.Text, { style: {
                        fontFamily: '"Inclusive Sans", sans-serif',
                        fontWeight: '400',
                        fontSize: isMobile ? 20 : 22,
                        lineHeight: isMobile ? 26 : 28,
                        color: '#1C1917',
                    }, children: title }), _jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans, sans-serif',
                        fontWeight: '400',
                        fontSize: isMobile ? 14 : 15,
                        lineHeight: isMobile ? 22 : 24,
                        color: '#57534E',
                    }, children: description })] }));
    }
    function CommunitySection() {
        const { width } = react_native_1.useWindowDimensions();
        const isMobile = width < 768;
        const isTablet = width >= 768 && width < 1024;
        return (_jsxs(react_native_1.View, { style: {
                paddingHorizontal: isMobile ? 20 : isTablet ? 40 : 80,
                paddingVertical: isMobile ? 60 : isTablet ? 80 : 100,
                backgroundColor: '#FAFAF7',
            }, children: [_jsxs(react_native_1.View, { style: { maxWidth: 720, marginBottom: isMobile ? 40 : 56 }, children: [_jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans, sans-serif',
                                fontWeight: '600',
                                fontSize: 12,
                                letterSpacing: 1.5,
                                textTransform: 'uppercase',
                                color: '#C2410C',
                                marginBottom: 16,
                            }, children: "BUILT BY THE COMMUNITY" }), _jsx(react_native_1.Text, { style: {
                                fontFamily: '"Inclusive Sans", sans-serif',
                                fontWeight: '400',
                                fontSize: isMobile ? 32 : isTablet ? 40 : 48,
                                lineHeight: isMobile ? 40 : isTablet ? 48 : 56,
                                color: '#1C1917',
                                marginBottom: 20,
                            }, children: "Made by sevaks. Run by CHYKs." }), _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans, sans-serif',
                                fontWeight: '400',
                                fontSize: isMobile ? 16 : 18,
                                lineHeight: isMobile ? 26 : 30,
                                color: '#57534E',
                            }, children: "Janata is volunteer-led \u2014 built and maintained entirely by CHYKs across centers. No gatekeepers. No back-office team. The community runs it." })] }), _jsxs(react_native_1.View, { style: {
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? 32 : 48,
                        marginBottom: isMobile ? 56 : 72,
                    }, children: [_jsx(StepCard, { number: "1", title: "Any CHYK joins", description: "Sign up in under a minute. Browse centers and events nearby with no extra hoops \u2014 even before you've made an account.", isMobile: isMobile }), _jsx(StepCard, { number: "2", title: "Coordinators post", description: "CHYK event coordinators are given permission to publish events for their center. Title, date, location \u2014 done in minutes.", isMobile: isMobile }), _jsx(StepCard, { number: "3", title: "The community grows", description: "Every event lands on the same map every CHYK is checking. Beyond your group chat, beyond your center.", isMobile: isMobile })] }), _jsxs(react_native_1.View, { style: {
                        backgroundColor: '#FFFFFF',
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: '#F5F0EB',
                        paddingHorizontal: isMobile ? 24 : 32,
                        paddingVertical: isMobile ? 28 : 32,
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        justifyContent: 'space-between',
                        gap: isMobile ? 24 : 32,
                    }, children: [_jsxs(react_native_1.View, { style: { flex: 1, maxWidth: 420 }, children: [_jsx(react_native_1.Text, { style: {
                                        fontFamily: 'Inclusive Sans, sans-serif',
                                        fontWeight: '600',
                                        fontSize: 11,
                                        letterSpacing: 1.2,
                                        textTransform: 'uppercase',
                                        color: '#C2410C',
                                        marginBottom: 8,
                                    }, children: "THE TEAM" }), _jsx(react_native_1.Text, { style: {
                                        fontFamily: '"Inclusive Sans", sans-serif',
                                        fontWeight: '400',
                                        fontSize: isMobile ? 22 : 26,
                                        lineHeight: isMobile ? 28 : 32,
                                        color: '#1C1917',
                                        marginBottom: 8,
                                    }, children: "A team of sevaks across the Mission." }), _jsx(react_native_1.Text, { style: {
                                        fontFamily: 'Inclusive Sans, sans-serif',
                                        fontSize: isMobile ? 14 : 15,
                                        lineHeight: isMobile ? 22 : 24,
                                        color: '#78716C',
                                    }, children: "Eight CHYKs across cities and disciplines \u2014 engineering, design, product, and outreach. All volunteer, all on our own time." })] }), _jsx(react_native_1.View, { style: {
                                flex: isMobile ? undefined : 1.2,
                                width: '100%',
                                maxWidth: 520,
                                aspectRatio: 16 / 9,
                            }, children: _jsx(react_native_1.Image, { source: require('../../assets/images/landing/team-grid.png'), resizeMode: "contain", style: { width: '100%', height: '100%' } }) })] })] }));
    }
    exports_1("CommunitySection", CommunitySection);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            }
        ],
        execute: function () {
        }
    };
});
