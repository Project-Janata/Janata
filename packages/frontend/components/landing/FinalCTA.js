System.register(["react/jsx-runtime", "react-native", "expo-router"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, expo_router_1, CONTACT_EMAIL;
    var __moduleName = context_1 && context_1.id;
    function AskCard({ audience, headline, description, ctaLabel, onPress, isMobile, }) {
        return (_jsxs(react_native_1.View, { style: {
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: isMobile ? 24 : 28,
                borderWidth: 1,
                borderColor: '#F5F0EB',
                boxShadow: '0 2px 24px rgba(0,0,0,0.04)',
                gap: 14,
                justifyContent: 'space-between',
            }, children: [_jsxs(react_native_1.View, { style: { gap: 14 }, children: [_jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans, sans-serif',
                                fontWeight: '600',
                                fontSize: 11,
                                letterSpacing: 1.5,
                                textTransform: 'uppercase',
                                color: '#C2410C',
                            }, children: audience }), _jsx(react_native_1.Text, { style: {
                                fontFamily: '"Inclusive Sans", sans-serif',
                                fontWeight: '400',
                                fontSize: isMobile ? 22 : 24,
                                lineHeight: isMobile ? 28 : 30,
                                color: '#1C1917',
                            }, children: headline }), _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans, sans-serif',
                                fontSize: isMobile ? 14 : 15,
                                lineHeight: isMobile ? 22 : 24,
                                color: '#57534E',
                            }, children: description })] }), _jsxs(react_native_1.Pressable, { onPress: onPress, style: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingTop: 6,
                    }, children: [_jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans, sans-serif',
                                fontWeight: '600',
                                fontSize: 14,
                                color: '#C2410C',
                            }, children: ctaLabel }), _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans, sans-serif',
                                fontWeight: '600',
                                fontSize: 14,
                                color: '#C2410C',
                            }, children: "\u2192" })] })] }));
    }
    function FinalCTA() {
        const router = expo_router_1.useRouter();
        const { width } = react_native_1.useWindowDimensions();
        const isMobile = width < 768;
        const isTablet = width >= 768 && width < 1024;
        const openMail = (subject) => {
            const body = encodeURIComponent('Hari Om,\n\n');
            react_native_1.Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${body}`);
        };
        return (_jsx(react_native_1.View, { style: {
                paddingHorizontal: isMobile ? 20 : isTablet ? 40 : 80,
                paddingVertical: isMobile ? 60 : isTablet ? 80 : 100,
                backgroundColor: '#FAFAF7',
            }, children: _jsxs(react_native_1.View, { style: {
                    backgroundColor: '#F5F0EB',
                    borderRadius: 28,
                    paddingHorizontal: isMobile ? 24 : isTablet ? 40 : 64,
                    paddingVertical: isMobile ? 48 : isTablet ? 60 : 72,
                    overflow: 'hidden',
                    position: 'relative',
                }, children: [_jsx("div", { style: {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'radial-gradient(ellipse at 50% 0%, rgba(194,65,12,0.08) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        } }), _jsxs(react_native_1.View, { style: { alignItems: 'center', marginBottom: isMobile ? 36 : 48 }, children: [_jsx(react_native_1.Text, { style: {
                                    fontFamily: 'Inclusive Sans, sans-serif',
                                    fontWeight: '600',
                                    fontSize: 12,
                                    letterSpacing: 1.5,
                                    textTransform: 'uppercase',
                                    color: '#C2410C',
                                    marginBottom: 16,
                                }, children: "THE ASK" }), _jsx(react_native_1.Text, { style: {
                                    fontFamily: '"Inclusive Sans", sans-serif',
                                    fontWeight: '400',
                                    fontSize: isMobile ? 32 : isTablet ? 40 : 48,
                                    lineHeight: isMobile ? 40 : isTablet ? 48 : 56,
                                    color: '#1C1917',
                                    textAlign: 'center',
                                    marginBottom: 16,
                                    maxWidth: 720,
                                }, children: "All we're missing is you." }), _jsx(react_native_1.Text, { style: {
                                    fontFamily: 'Inclusive Sans, sans-serif',
                                    fontWeight: '400',
                                    fontSize: isMobile ? 16 : 18,
                                    lineHeight: isMobile ? 24 : 28,
                                    color: '#78716C',
                                    textAlign: 'center',
                                    maxWidth: 560,
                                }, children: "The app is live. The community is ready. We need a few people from each corner of the Mission to help bring it to life." })] }), _jsxs(react_native_1.View, { style: {
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: isMobile ? 16 : 20,
                            marginBottom: isMobile ? 36 : 44,
                        }, children: [_jsx(AskCard, { audience: "If you coordinate events", headline: "Post your next event on Janata.", description: "It takes a minute per event, and CHYKs who aren't in your WhatsApp group can finally find you. We'll personally help you migrate your RSVP flow.", ctaLabel: "Get set up", onPress: () => openMail('Coordinator — getting set up on Janata'), isMobile: isMobile }), _jsx(AskCard, { audience: "If you want to contribute", headline: "Join the team.", description: "Volunteer-led across dev, design, product, and outreach. Async over Slack, as much or as little time as you can give. A great opportunity for seva.", ctaLabel: "Get in touch", onPress: () => openMail('Joining the Janata team'), isMobile: isMobile }), _jsx(AskCard, { audience: "If you're an acharya", headline: "Bless this & introduce us.", description: "Designed to be run entirely by CHYKs \u2014 nothing added to your plate. Connect us with the coordinators at your center and spread the word to your CHYKs.", ctaLabel: "Connect with us", onPress: () => openMail('Acharya introduction — Janata'), isMobile: isMobile })] }), _jsxs(react_native_1.View, { style: {
                            alignItems: 'center',
                            gap: 14,
                            borderTopWidth: 1,
                            borderTopColor: 'rgba(194,65,12,0.12)',
                            paddingTop: isMobile ? 28 : 32,
                        }, children: [_jsx(react_native_1.Text, { style: {
                                    fontFamily: 'Inclusive Sans, sans-serif',
                                    fontSize: 14,
                                    color: '#78716C',
                                }, children: "Just here to look around?" }), _jsx(react_native_1.Pressable, { onPress: () => router.push('/(tabs)'), className: "bg-primary active:bg-primary-press rounded-full", style: {
                                    paddingHorizontal: 28,
                                    paddingVertical: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                }, children: _jsx(react_native_1.Text, { style: {
                                        fontFamily: 'Inclusive Sans, sans-serif',
                                        fontWeight: '500',
                                        fontSize: 15,
                                        color: '#FFFFFF',
                                    }, children: "Browse events nearby \u2192" }) }), _jsx(react_native_1.Text, { style: {
                                    fontFamily: 'Inclusive Sans, sans-serif',
                                    fontSize: 12,
                                    color: '#A8A29E',
                                }, children: "Currently in beta \u00B7 Available on web" })] })] }) }));
    }
    exports_1("FinalCTA", FinalCTA);
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
            }
        ],
        execute: function () {
            CONTACT_EMAIL = 'projectjanatha@gmail.com';
        }
    };
});
