System.register(["react/jsx-runtime", "react", "react-native", "../contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, contexts_1, styles;
    var __moduleName = context_1 && context_1.id;
    function SkeletonBox({ width = '100%', height = 16, borderRadius = 8, style }) {
        const { isDark } = contexts_1.useTheme();
        const opacity = react_1.useRef(new react_native_1.Animated.Value(0.3)).current;
        react_1.useEffect(() => {
            const animation = react_native_1.Animated.loop(react_native_1.Animated.sequence([
                react_native_1.Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                react_native_1.Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ]));
            animation.start();
            return () => animation.stop();
        }, [opacity]);
        return (_jsx(react_native_1.Animated.View, { style: [
                {
                    width: width,
                    height,
                    borderRadius,
                    backgroundColor: isDark ? '#2e2e2e' : '#d6d3d1',
                    opacity,
                },
                style,
            ] }));
    }
    function EventCardSkeleton() {
        const { isDark } = contexts_1.useTheme();
        return (_jsx(react_native_1.View, { style: [styles.card, isDark && styles.cardDark], children: _jsxs(react_native_1.View, { style: styles.cardBody, children: [_jsx(SkeletonBox, { width: "60%", height: 14 }), _jsx(SkeletonBox, { width: "40%", height: 12, style: { marginTop: 8 } }), _jsx(SkeletonBox, { width: "80%", height: 12, style: { marginTop: 8 } }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', gap: 8, marginTop: 12 }, children: [_jsx(SkeletonBox, { width: 28, height: 28, borderRadius: 14 }), _jsx(SkeletonBox, { width: 28, height: 28, borderRadius: 14 }), _jsx(SkeletonBox, { width: 28, height: 28, borderRadius: 14 })] })] }) }));
    }
    exports_1("EventCardSkeleton", EventCardSkeleton);
    function CenterCardSkeleton() {
        const { isDark } = contexts_1.useTheme();
        return (_jsx(react_native_1.View, { style: [styles.card, isDark && styles.cardDark], children: _jsxs(react_native_1.View, { style: styles.cardBody, children: [_jsx(SkeletonBox, { width: "50%", height: 14 }), _jsx(SkeletonBox, { width: "70%", height: 12, style: { marginTop: 8 } })] }) }));
    }
    exports_1("CenterCardSkeleton", CenterCardSkeleton);
    function DiscoverListSkeleton({ count = 4 }) {
        return (_jsx(react_native_1.View, { style: { gap: 8, paddingTop: 8 }, children: Array.from({ length: count }).map((_, i) => (_jsx(react_native_1.View, { children: i % 3 === 2 ? _jsx(CenterCardSkeleton, {}) : _jsx(EventCardSkeleton, {}) }, i))) }));
    }
    exports_1("DiscoverListSkeleton", DiscoverListSkeleton);
    function DetailSkeleton() {
        return (_jsxs(react_native_1.View, { style: { padding: 20, gap: 16 }, children: [_jsx(SkeletonBox, { width: "100%", height: 200, borderRadius: 12 }), _jsx(SkeletonBox, { width: "70%", height: 20 }), _jsx(SkeletonBox, { width: "40%", height: 14 }), _jsx(SkeletonBox, { width: "90%", height: 14 }), _jsx(SkeletonBox, { width: "85%", height: 14 }), _jsx(SkeletonBox, { width: "60%", height: 14 })] }));
    }
    exports_1("DetailSkeleton", DetailSkeleton);
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
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            }
        ],
        execute: function () {
            styles = react_native_1.StyleSheet.create({
                card: {
                    backgroundColor: '#fafaf9',
                    borderRadius: 12,
                    padding: 16,
                },
                cardDark: {
                    backgroundColor: '#1c1c1e',
                },
                cardBody: {
                    gap: 0,
                },
            });
        }
    };
});
