System.register(["react/jsx-runtime", "react", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1;
    var __moduleName = context_1 && context_1.id;
    function getWeekDays() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const days = [];
        const letters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        for (let offset = -3; offset <= 3; offset++) {
            const d = new Date(today);
            d.setDate(today.getDate() + offset);
            days.push({
                dateStr: d.toISOString().split('T')[0],
                dayLetter: letters[d.getDay()],
                dayNum: d.getDate(),
                isToday: offset === 0,
                date: d,
            });
        }
        return days;
    }
    /**
     * Build the month/year label that sits above the week strip. Shows the year
     * once when all days share it; spans two months when the strip crosses a
     * boundary (e.g. "April – May 2026").
     */
    function buildMonthLabel(days) {
        if (days.length === 0)
            return '';
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        const first = days[0].date;
        const last = days[days.length - 1].date;
        const firstMonth = first.getMonth();
        const lastMonth = last.getMonth();
        const firstYear = first.getFullYear();
        const lastYear = last.getFullYear();
        if (firstYear === lastYear && firstMonth === lastMonth) {
            return `${months[firstMonth]} ${firstYear}`;
        }
        if (firstYear === lastYear) {
            return `${months[firstMonth]} – ${months[lastMonth]} ${firstYear}`;
        }
        return `${months[firstMonth]} ${firstYear} – ${months[lastMonth]} ${lastYear}`;
    }
    function WeekCalendar({ eventDates, selectedDate, onSelectDate }) {
        const weekDays = react_1.useMemo(() => getWeekDays(), []);
        const monthLabel = react_1.useMemo(() => buildMonthLabel(weekDays), [weekDays]);
        return (_jsxs(react_native_1.View, { children: [_jsx(react_native_1.Text, { className: "text-[11px] font-sans text-stone-500 dark:text-stone-400 px-4 pt-2", style: { letterSpacing: 0.3 }, children: monthLabel }), _jsx(react_native_1.View, { className: "flex-row justify-around px-3 py-2.5", children: weekDays.map((d) => {
                        const isSelected = selectedDate === d.dateStr;
                        const hasEvents = eventDates.has(d.dateStr);
                        return (_jsxs(react_native_1.Pressable, { onPress: () => onSelectDate(isSelected ? null : d.dateStr), className: "items-center px-1", style: { minWidth: 42 }, children: [_jsx(react_native_1.Text, { className: "text-[11px] font-sans text-gray-400 dark:text-gray-500", children: d.dayLetter }), _jsxs(react_native_1.View, { style: { position: 'relative' }, children: [_jsx(react_native_1.View, { className: `w-10 h-10 rounded-full items-center justify-center ${isSelected
                                                ? 'bg-primary'
                                                : d.isToday
                                                    ? 'border-2 border-primary'
                                                    : ''}`, children: _jsx(react_native_1.Text, { className: `text-sm font-sans ${isSelected
                                                    ? 'text-white'
                                                    : d.isToday
                                                        ? 'text-primary'
                                                        : 'text-content dark:text-content-dark'}`, children: d.dayNum }) }), hasEvents && (_jsx(react_native_1.View, { className: "w-2 h-2 rounded-full bg-primary", style: { position: 'absolute', top: 2, right: 2 } }))] })] }, d.dateStr));
                    }) })] }));
    }
    exports_1("default", WeekCalendar);
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
            }
        ],
        execute: function () {
        }
    };
});
