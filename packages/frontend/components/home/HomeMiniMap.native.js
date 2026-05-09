System.register(["react/jsx-runtime", "react-native", "lucide-react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, lucide_react_native_1;
    var __moduleName = context_1 && context_1.id;
    function HomeMiniMap({ eventCount, centerCount, tilePreview, isDark, onPress, }) {
        return (_jsxs(react_native_1.View, { style: {
                height: 156,
                borderRadius: 18,
                overflow: 'hidden',
                backgroundColor: isDark ? '#26231F' : '#EDE6DA',
            }, children: [_jsx(react_native_1.Image, { source: { uri: tilePreview.url }, style: { width: '100%', height: '100%' }, resizeMode: "cover" }), _jsx(react_native_1.View, { style: {
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        backgroundColor: isDark ? 'rgba(0,0,0,0.18)' : 'rgba(255,248,241,0.08)',
                    } }), tilePreview.markers.map((marker) => (_jsx(react_native_1.View, { style: {
                        position: 'absolute',
                        left: `${marker.x}%`,
                        top: `${marker.y}%`,
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: marker.type === 'event' ? '#F25C05' : '#2563EB',
                        borderWidth: 2,
                        borderColor: '#FFFFFF',
                        transform: [{ translateX: -12 }, { translateY: -12 }],
                        shadowColor: '#000',
                        shadowOpacity: 0.18,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: 3 },
                    } }, marker.id))), _jsx(MapOverlay, { eventCount: eventCount, centerCount: centerCount, isDark: isDark, onPress: onPress })] }));
    }
    exports_1("default", HomeMiniMap);
    function MapOverlay({ eventCount, centerCount, isDark, onPress, }) {
        return (_jsxs(_Fragment, { children: [_jsx(react_native_1.Pressable, { accessibilityLabel: "Open map", onPress: onPress, style: {
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        backgroundColor: 'transparent',
                    } }), _jsxs(react_native_1.View, { pointerEvents: "none", style: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }, children: [_jsx(react_native_1.View, { style: {
                                position: 'absolute',
                                left: 14,
                                top: 14,
                                borderRadius: 999,
                                backgroundColor: isDark ? '#171717' : '#FFFFFF',
                                paddingHorizontal: 12,
                                paddingVertical: 7,
                                shadowColor: '#000',
                                shadowOpacity: 0.08,
                                shadowRadius: 8,
                                shadowOffset: { width: 0, height: 3 },
                            }, children: _jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: isDark ? '#FAFAFA' : '#1C1917' }, children: [eventCount, " events - ", centerCount, " centers nearby"] }) }), _jsxs(react_native_1.View, { style: {
                                position: 'absolute',
                                right: 14,
                                bottom: 14,
                                borderRadius: 999,
                                backgroundColor: isDark ? '#171717' : '#FFFFFF',
                                paddingHorizontal: 13,
                                paddingVertical: 9,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                shadowColor: '#000',
                                shadowOpacity: 0.08,
                                shadowRadius: 8,
                                shadowOffset: { width: 0, height: 3 },
                            }, children: [_jsx(lucide_react_native_1.Map, { size: 15, color: "#E8862A" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: isDark ? '#FAFAFA' : '#1C1917' }, children: "Open map" })] })] })] }));
    }
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
