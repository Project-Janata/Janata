System.register(["react/jsx-runtime", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, logoIcon, logoWithText, LOGO_WITH_TEXT_ASPECT_RATIO;
    var __moduleName = context_1 && context_1.id;
    function Logo({ showText = true, size = 32, color, style, }) {
        if (showText) {
            return (_jsx(react_native_1.View, { style: [{ flexDirection: 'row', alignItems: 'center' }, style], children: _jsx(react_native_1.Image, { source: logoWithText, style: {
                        height: size,
                        width: size * LOGO_WITH_TEXT_ASPECT_RATIO,
                    }, resizeMode: "contain", ...(color ? { tintColor: color } : {}) }) }));
        }
        return (_jsx(react_native_1.View, { style: [{ flexDirection: 'row', alignItems: 'center' }, style], children: _jsx(react_native_1.Image, { source: logoIcon, style: { width: size, height: size }, resizeMode: "contain", ...(color ? { tintColor: color } : {}) }) }));
    }
    exports_1("default", Logo);
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
            logoIcon = require('../../assets/images/logo.png');
            logoWithText = require('../../assets/images/logo_with_text.png');
            LOGO_WITH_TEXT_ASPECT_RATIO = 3.65;
        }
    };
});
