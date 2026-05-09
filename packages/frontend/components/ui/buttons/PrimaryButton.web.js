System.register(["react/jsx-runtime"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1;
    var __moduleName = context_1 && context_1.id;
    function PrimaryButton({ children, onPress, disabled, loading, style, }) {
        const isDisabled = disabled || loading;
        const handleClick = (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            if (!isDisabled && onPress) {
                onPress();
            }
        };
        return (_jsx("button", { type: "button", onClick: handleClick, disabled: isDisabled, className: "bg-primary px-4 py-3 rounded-full active:bg-primary-press disabled:opacity-50 cursor-pointer w-full", style: { border: 'none', outline: 'none', ...style }, children: loading ? (_jsx("span", { className: "flex items-center justify-center", children: _jsxs("svg", { className: "animate-spin h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" })] }) })) : (_jsx("span", { className: "text-white font-sans text-base leading-4 text-center block", children: children })) }));
    }
    exports_1("default", PrimaryButton);
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
