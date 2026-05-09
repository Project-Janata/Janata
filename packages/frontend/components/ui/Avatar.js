System.register(["react/jsx-runtime", "react", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1;
    var __moduleName = context_1 && context_1.id;
    function Avatar({ image, initials, name, size = 40, style, backgroundColor }) {
        const [imageError, setImageError] = react_1.default.useState(false);
        const getInitials = () => {
            if (initials)
                return initials;
            if (name) {
                const parts = name.split(' ');
                if (parts.length >= 2) {
                    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
                }
                return name.slice(0, 2).toUpperCase();
            }
            return '?';
        };
        const fontSize = size * 0.4;
        const bgColor = backgroundColor || '#C2410C';
        if (image && !imageError) {
            return (_jsx(react_native_1.View, { style: [
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        overflow: 'hidden',
                    },
                    style,
                ], children: _jsx(react_native_1.Image, { source: { uri: image }, style: {
                        width: '100%',
                        height: '100%',
                    }, resizeMode: "cover", onError: () => setImageError(true) }) }));
        }
        return (_jsx(react_native_1.View, { style: [
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: bgColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                },
                style,
            ], children: _jsx(react_native_1.Text, { style: {
                    color: 'white',
                    fontSize,
                    fontWeight: '600',
                }, children: getInitials() }) }));
    }
    exports_1("default", Avatar);
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
