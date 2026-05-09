System.register(["react/jsx-runtime"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1;
    var __moduleName = context_1 && context_1.id;
    function MapPopover({ point, mode, eventDetail, centerDetail, onViewPress, onClose, x, y, }) {
        const isCenter = point.type === 'center';
        const accent = isCenter ? '#9A3412' : '#2563EB';
        const accentBg = isCenter ? '#FFF7ED' : '#EFF6FF';
        if (mode === 'hover') {
            return (_jsxs("div", { className: "absolute z-50 pointer-events-none", style: { left: x, top: y - 16, transform: 'translate(-50%, -100%)' }, children: [_jsxs("div", { className: "flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 whitespace-nowrap", style: { maxWidth: 280 }, children: [_jsx("div", { className: "w-2 h-2 rounded-full flex-shrink-0", style: { backgroundColor: accent } }), _jsx("span", { className: "text-xs font-semibold text-gray-800 dark:text-gray-200 truncate", children: point.name })] }), _jsx("div", { className: "flex justify-center", children: _jsx("div", { className: "w-2 h-2 rotate-45 -mt-1 bg-white dark:bg-neutral-800 border-b border-r border-gray-200 dark:border-neutral-700" }) })] }));
        }
        // click mode — detail card
        return (_jsxs("div", { className: "absolute z-50", style: { left: x, top: y - 20, transform: 'translate(-50%, -100%)' }, children: [_jsxs("div", { className: "rounded-xl shadow-xl bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 p-4 min-w-[240px] max-w-[300px]", children: [_jsx("button", { onClick: onClose, className: "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer border-none bg-transparent", children: "\u00D7" }), _jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [_jsx("div", { className: "w-2 h-2 rounded-full", style: { backgroundColor: accent } }), _jsx("span", { className: "text-[10px] font-semibold uppercase tracking-wider", style: { color: accent }, children: isCenter ? 'Center' : 'Event' })] }), _jsx("p", { className: "text-sm font-bold text-gray-900 dark:text-gray-100 mb-1 leading-tight pr-4", children: point.name }), eventDetail && (_jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 space-y-0.5 mb-3", children: [_jsx("p", { children: eventDetail.time }), _jsx("p", { children: eventDetail.location })] })), centerDetail && (_jsxs("div", { className: "text-xs text-gray-500 dark:text-gray-400 space-y-0.5 mb-3", children: [centerDetail.address && _jsx("p", { children: centerDetail.address }), centerDetail.eventCount != null && centerDetail.eventCount > 0 && (_jsxs("p", { className: "font-medium", style: { color: accent }, children: [centerDetail.eventCount, " events this week"] }))] })), _jsxs("button", { onClick: onViewPress, className: "w-full py-2 rounded-full text-xs font-semibold text-white border-none cursor-pointer transition-opacity hover:opacity-90", style: { backgroundColor: accent }, children: ["View ", isCenter ? 'Center' : 'Event'] })] }), _jsx("div", { className: "flex justify-center", children: _jsx("div", { className: "w-3 h-3 rotate-45 -mt-1.5 bg-white dark:bg-neutral-800 border-b border-r border-gray-200 dark:border-neutral-700" }) })] }));
    }
    exports_1("default", MapPopover);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            }
        ],
        execute: function () {
        }
    };
});
