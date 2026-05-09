System.register(["react/jsx-runtime", "react", "react-native", "@react-native-community/datetimepicker"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, datetimepicker_1;
    var __moduleName = context_1 && context_1.id;
    function BirthdatePicker({ value, onChange }) {
        const [date, setDate] = react_1.useState(value || new Date(2000, 0, 1));
        const [show, setShow] = react_1.useState(false);
        const handleChange = (event, selectedDate) => {
            // On Android, the picker closes automatically
            if (react_native_1.Platform.OS === 'android') {
                setShow(false);
            }
            if (selectedDate) {
                setDate(selectedDate);
                onChange(selectedDate);
            }
        };
        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });
        };
        return (_jsxs(react_native_1.View, { className: "p-4", children: [_jsx(react_native_1.Pressable, { onPress: () => setShow(true), className: "bg-muted/50 dark:bg-muted-dark/10 py-3 px-4 rounded-lg border-2 border-transparent active:border-primary", children: _jsx(react_native_1.Text, { className: "font-sans text-base text-content dark:text-content-dark", children: formatDate(date) }) }), show && (_jsxs(react_native_1.View, { children: [_jsx(datetimepicker_1.default, { value: date, mode: "date", display: react_native_1.Platform.OS === 'ios' ? 'spinner' : 'default', onChange: handleChange, maximumDate: (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d; })(), minimumDate: new Date(1900, 0, 1) }), react_native_1.Platform.OS === 'ios' && (_jsx(react_native_1.Pressable, { onPress: () => {
                                onChange(date);
                                setShow(false);
                            }, className: "bg-primary py-3 px-4 rounded-lg mt-2", children: _jsx(react_native_1.Text, { className: "font-sans text-base text-white text-center font-semibold", children: "Done" }) }))] }))] }));
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
            function (datetimepicker_1_1) {
                datetimepicker_1 = datetimepicker_1_1;
            }
        ],
        execute: function () {
        }
    };
});
