System.register(["react/jsx-runtime", "react-native", "lucide-react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, lucide_react_native_1, config;
    var __moduleName = context_1 && context_1.id;
    function EmptyState({ variant = 'search', message, subtitle }) {
        const { icon: Icon, title, subtitle: defaultSubtitle } = config[variant];
        return (_jsxs(react_native_1.View, { style: { paddingVertical: 36, alignItems: 'center', paddingHorizontal: 24 }, children: [_jsx(Icon, { size: 36, color: "#a8a29e" }), _jsx(react_native_1.Text, { style: {
                        marginTop: 14,
                        fontSize: 15,
                        fontWeight: '600',
                        color: '#78716c',
                        fontFamily: 'Inclusive Sans',
                        textAlign: 'center',
                    }, children: message || title }), _jsx(react_native_1.Text, { style: {
                        marginTop: 6,
                        fontSize: 13,
                        color: '#a8a29e',
                        fontFamily: 'Inclusive Sans',
                        textAlign: 'center',
                    }, children: subtitle || defaultSubtitle })] }));
    }
    exports_1("EmptyState", EmptyState);
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
            config = {
                events: {
                    icon: lucide_react_native_1.Calendar,
                    title: 'No events yet',
                    subtitle: 'Events you register for will appear here',
                },
                centers: {
                    icon: lucide_react_native_1.MapPin,
                    title: 'No centers found',
                    subtitle: 'Try adjusting your search or location',
                },
                search: {
                    icon: lucide_react_native_1.Search,
                    title: 'No results found',
                    subtitle: 'Try a different search term',
                },
                date: {
                    icon: lucide_react_native_1.Calendar,
                    title: 'No events on this day',
                    subtitle: 'Try selecting a different date',
                },
            };
        }
    };
});
