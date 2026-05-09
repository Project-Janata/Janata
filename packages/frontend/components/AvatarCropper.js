System.register(["react/jsx-runtime", "react", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1;
    var __moduleName = context_1 && context_1.id;
    function AvatarCropper({ onCropComplete }) {
        const inputRef = react_1.useRef(null);
        const handleChange = react_1.useCallback((e) => {
            const file = e.target.files?.[0];
            if (file) {
                onCropComplete(file);
            }
        }, [onCropComplete]);
        return (_jsx(react_native_1.View, { style: { display: 'none' }, children: _jsx("input", { ref: inputRef, type: "file", accept: "image/*", onChange: handleChange }) }));
    }
    exports_1("AvatarCropper", AvatarCropper);
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
