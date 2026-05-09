System.register(["react/jsx-runtime", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1;
    var __moduleName = context_1 && context_1.id;
    function NativeAvatarCropper({ visible, imageUri, onCropComplete, onCancel }) {
        if (!visible)
            return null;
        return (_jsx(react_native_1.View, { children: _jsxs(react_native_1.Text, { children: ["Native Avatar Cropper - ", imageUri] }) }));
    }
    exports_1("default", NativeAvatarCropper);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            }
        ],
        execute: function () {
        }
    };
});
