System.register(["react/jsx-runtime", "react-native", "lucide-react-native", "./ui"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, lucide_react_native_1, ui_1;
    var __moduleName = context_1 && context_1.id;
    function EventCard({ event, onPress, variant = 'compact' }) {
        if (variant === 'full') {
            return (_jsxs(ui_1.Card, { pressable: true, onPress: () => onPress(event), padding: "md", hoverBorderColor: "primary", children: [_jsxs(react_native_1.View, { className: "gap-3", children: [_jsx(react_native_1.Text, { className: "font-sans text-sm text-primary font-bold uppercase tracking-wide", children: event.time }), _jsxs(react_native_1.View, { className: "flex-row items-center gap-2", children: [_jsx(lucide_react_native_1.MapPin, { size: 16, color: "#a1a1aa" }), _jsx(react_native_1.Text, { className: "text-content dark:text-content-dark font-sans text-sm", children: event.location })] }), _jsx(react_native_1.Text, { className: "text-content dark:text-content-dark font-sans text-xl font-bold leading-tight mt-1", children: event.title }), _jsxs(react_native_1.Text, { className: "text-content dark:text-content-dark text-base font-medium mt-2", children: [event.attendees, " ", event.attendees === 1 ? 'person' : 'people', " attending"] })] }), _jsxs(react_native_1.View, { className: "flex-row items-center gap-8 pt-4", children: [_jsxs(react_native_1.View, { className: "flex-row items-center gap-2", children: [_jsx(lucide_react_native_1.ThumbsUp, { size: 18, color: "#a1a1aa" }), _jsx(react_native_1.Text, { className: "text-content dark:text-content-dark font-sans text-sm font-medium", children: event.likes })] }), _jsxs(react_native_1.View, { className: "flex-row items-center gap-2", children: [_jsx(lucide_react_native_1.MessageCircle, { size: 18, color: "#a1a1aa" }), _jsx(react_native_1.Text, { className: "text-content dark:text-content-dark font-sans text-sm font-medium", children: event.comments })] })] })] }));
        }
        return (_jsxs(ui_1.Card, { pressable: true, onPress: () => onPress(event), padding: "sm", children: [_jsxs(react_native_1.View, { className: "gap-2", children: [_jsx(react_native_1.Text, { className: "font-sans text-sm text-primary font-medium", children: event.time }), _jsx(react_native_1.Text, { className: "text-content dark:text-content-dark font-sans text-sm", children: event.location }), _jsx(react_native_1.Text, { className: "text-content dark:text-content-dark font-sans text-lg font-semibold leading-tight", children: event.title }), _jsxs(react_native_1.Text, { className: "text-content dark:text-content-dark text-sm mt-1", children: [event.attendees, " ", event.attendees === 1 ? 'person' : 'people'] })] }), _jsxs(react_native_1.View, { className: "flex-row justify-end gap-4 pt-2", children: [_jsxs(react_native_1.View, { className: "flex-row items-center gap-1", children: [_jsx(lucide_react_native_1.ThumbsUp, { size: 16, color: "#a1a1aa" }), _jsx(react_native_1.Text, { className: "text-content dark:text-content-dark font-sans text-sm", children: event.likes })] }), _jsxs(react_native_1.View, { className: "flex-row items-center gap-1", children: [_jsx(lucide_react_native_1.MessageCircle, { size: 16, color: "#a1a1aa" }), _jsx(react_native_1.Text, { className: "text-content dark:text-content-dark font-sans text-sm", children: event.comments })] })] })] }));
    }
    exports_1("EventCard", EventCard);
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
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            }
        ],
        execute: function () {
        }
    };
});
