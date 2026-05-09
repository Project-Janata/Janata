System.register(["react/jsx-runtime", "react-native", "../contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, contexts_1, styles;
    var __moduleName = context_1 && context_1.id;
    function ConfirmDialog({ visible, title, message, confirmLabel = 'Delete', onConfirm, onCancel, }) {
        const { isDark } = contexts_1.useTheme();
        if (!visible)
            return null;
        const dialogBg = isDark ? '#1a1a1a' : '#fff';
        const dialogBorder = isDark ? '#262626' : '#E7E5E4';
        const textColor = isDark ? '#F3F4F6' : '#1C1917';
        const secondaryText = isDark ? '#9CA3AF' : '#78716C';
        const cancelBg = isDark ? '#262626' : '#F5F5F4';
        const cancelText = isDark ? '#D6D3D1' : '#44403C';
        return (_jsx(react_native_1.Modal, { transparent: true, animationType: "fade", visible: visible, onRequestClose: onCancel, children: _jsx(react_native_1.Pressable, { style: styles.backdrop, onPress: onCancel, children: _jsxs(react_native_1.Pressable, { style: [
                        styles.dialog,
                        {
                            backgroundColor: dialogBg,
                            borderColor: dialogBorder,
                        },
                    ], onPress: (e) => e.stopPropagation(), children: [_jsx(react_native_1.Text, { style: [styles.title, { color: textColor }], children: title }), _jsx(react_native_1.Text, { style: [styles.message, { color: secondaryText }], children: message }), _jsxs(react_native_1.View, { style: styles.actions, children: [_jsx(react_native_1.Pressable, { onPress: onCancel, style: [styles.button, { backgroundColor: cancelBg }], children: _jsx(react_native_1.Text, { style: [styles.buttonText, { color: cancelText }], children: "Cancel" }) }), _jsx(react_native_1.Pressable, { onPress: onConfirm, style: [styles.button, styles.confirmButton], children: _jsx(react_native_1.Text, { style: [styles.buttonText, { color: '#fff' }], children: confirmLabel }) })] })] }) }) }));
    }
    exports_1("default", ConfirmDialog);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            }
        ],
        execute: function () {
            styles = react_native_1.StyleSheet.create({
                backdrop: {
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                dialog: {
                    width: 360,
                    borderRadius: 14,
                    borderWidth: 1,
                    padding: 24,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.15,
                    shadowRadius: 24,
                    elevation: 8,
                },
                title: {
                    fontFamily: 'Inclusive Sans',
                    fontSize: 16,
                    marginBottom: 8,
                },
                message: {
                    fontFamily: 'Inclusive Sans',
                    fontSize: 14,
                    lineHeight: 20,
                    marginBottom: 24,
                },
                actions: {
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    gap: 10,
                },
                button: {
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    borderRadius: 8,
                },
                confirmButton: {
                    backgroundColor: '#ef4444',
                },
                buttonText: {
                    fontFamily: 'Inclusive Sans',
                    fontSize: 14,
                },
            });
        }
    };
});
