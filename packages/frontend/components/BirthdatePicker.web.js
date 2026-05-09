System.register(["react/jsx-runtime", "react", "react-native", "@headlessui/react", "lucide-react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, react_2, lucide_react_native_1;
    var __moduleName = context_1 && context_1.id;
    // --- Helper: Generate array of numbers ---
    function range(start, end) {
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
    // --- NEW: A fully styleable Select component ---
    function Select({ label, value, options, onChange, className }) {
        // Find the currently selected option object
        const selectedOption = options.find((opt) => opt.value === value);
        return (_jsx(react_2.Listbox, { value: value, onChange: onChange, children: _jsxs("div", { className: `relative ${className}`, children: [_jsxs(react_2.Listbox.Button, { "aria-label": label, className: "relative w-full font-sans text-base bg-stone-100 dark:bg-stone-800 text-content dark:text-content-dark py-[14px] px-4 rounded-lg border-2 border-transparent focus:border-primary outline-none text-left", children: [_jsx("span", { className: "block truncate", children: selectedOption?.label }), _jsx("span", { className: "pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3", children: _jsx(lucide_react_native_1.ChevronDown, { className: "text-stone-400 dark:text-stone-500 ml-3" }) })] }), _jsx(react_2.Transition, { as: react_1.default.Fragment, leave: "transition ease-in duration-100", leaveFrom: "opacity-100", leaveTo: "opacity-0", children: _jsx(react_2.Listbox.Options, { className: "mt-1 max-h-60 w-full overflow-auto rounded-md bg-background dark:bg-background-dark py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none", children: options
                                .filter((option) => option.value !== null) // <-- filter out placeholder
                                .map((option) => (_jsx(react_2.Listbox.Option, { value: option.value, className: ({ active }) => `relative select-none py-2 px-4 font-sans ${active ? 'bg-primary/10 text-primary' : 'text-content dark:text-content-dark'}`, children: option.label }, option.value))) }) })] }) }));
    }
    function BirthdatePicker({ value, onChange }) {
        const [date, setDate] = react_1.useState(value || new Date(2000, 0, 1));
        react_1.useEffect(() => {
            setDate(value || new Date(2000, 0, 1));
        }, [value]);
        const currentYear = new Date().getFullYear();
        // Add placeholder options
        const years = [
            { label: 'Year', value: null },
            ...range(currentYear - 100, currentYear - 18)
                .reverse()
                .map((y) => ({ label: y, value: y })),
        ];
        const months = [
            { label: 'Month', value: null },
            ...Array.from({ length: 12 }, (_, i) => ({
                label: new Date(2000, i).toLocaleString('en-US', { month: 'long' }),
                value: i,
            })),
        ];
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const days = [
            { label: 'Day', value: null },
            ...range(1, daysInMonth).map((d) => ({ label: d, value: d })),
        ];
        // Set initial state to value prop if provided, otherwise null for placeholders
        const [dateParts, setDateParts] = react_1.useState(() => {
            if (value) {
                return {
                    year: value.getFullYear(),
                    month: value.getMonth(),
                    day: value.getDate(),
                };
            }
            return {
                year: null,
                month: null,
                day: null,
            };
        });
        const handlePartChange = (part, newValue) => {
            const newParts = { ...dateParts, [part]: newValue };
            setDateParts(newParts);
            // Only call onChange when all parts are selected
            if (newParts.year !== null && newParts.month !== null && newParts.day !== null) {
                const selectedDate = new Date(newParts.year, newParts.month, newParts.day);
                const minAgeDate = new Date();
                minAgeDate.setFullYear(minAgeDate.getFullYear() - 18);
                minAgeDate.setHours(0, 0, 0, 0);
                // Block under-18 (also covers future dates since minAgeDate < today)
                if (selectedDate <= minAgeDate) {
                    onChange(selectedDate);
                }
            }
        };
        return (_jsx(react_native_1.View, { className: "w-full max-w-[480px]", style: { overflow: 'visible', zIndex: 50 }, children: _jsxs(react_native_1.View, { className: "flex-row justify-between space-x-2", children: [_jsx(Select, { label: "Month", value: dateParts.month, options: months, onChange: (val) => handlePartChange('month', val), className: "flex-[4]" }), _jsx(Select, { label: "Day", value: dateParts.day, options: days, onChange: (val) => handlePartChange('day', val), className: "flex-[3]" }), _jsx(Select, { label: "Year", value: dateParts.year, options: years, onChange: (val) => handlePartChange('year', val), className: "flex-[3]" })] }) }));
    }
    exports_1("default", BirthdatePicker);
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
            function (react_2_1) {
                react_2 = react_2_1;
            },
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            }
        ],
        execute: function () {
        }
    };
});
