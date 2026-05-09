System.register(["react/jsx-runtime", "react", "react-native", "lucide-react-native", "../../hooks/useDetailColors"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, lucide_react_native_1, useDetailColors_1;
    var __moduleName = context_1 && context_1.id;
    function FilterPickerModal({ visible, title, options, selected, onSelect, onClear, onClose, }) {
        const colors = useDetailColors_1.useDetailColors();
        react_1.useEffect(() => {
            if (react_native_1.Platform.OS !== 'web' || !visible)
                return;
            const handler = (e) => {
                if (e.key === 'Escape')
                    onClose();
            };
            document.addEventListener('keydown', handler);
            return () => document.removeEventListener('keydown', handler);
        }, [visible, onClose]);
        if (!visible)
            return null;
        const renderRow = (opt) => {
            const isSelected = selected === opt.value;
            return (_jsxs(react_native_1.Pressable, { onPress: () => {
                    onSelect(opt.value);
                    onClose();
                }, style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                }, children: [_jsxs(react_native_1.View, { style: { flex: 1 }, children: [_jsx(react_native_1.Text, { style: { fontSize: 15, color: colors.text, fontFamily: 'Inclusive Sans' }, children: opt.label }), opt.sublabel && (_jsx(react_native_1.Text, { style: { fontSize: 12, color: colors.textSecondary, marginTop: 2 }, children: opt.sublabel }))] }), opt.count !== undefined && (_jsx(react_native_1.Text, { style: {
                            fontSize: 13,
                            color: colors.textSecondary,
                            fontFamily: 'Inclusive Sans',
                            marginRight: isSelected ? 10 : 0,
                            minWidth: 24,
                            textAlign: 'right',
                        }, children: opt.count })), isSelected && _jsx(lucide_react_native_1.Check, { size: 18, color: "#E8862A" })] }, String(opt.value)));
        };
        const sheet = (_jsxs(react_native_1.View, { style: {
                backgroundColor: colors.panelBg,
                borderRadius: 16,
                width: 360,
                maxWidth: '90%',
                maxHeight: '80%',
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
            }, children: [_jsxs(react_native_1.View, { style: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                    }, children: [_jsx(react_native_1.Text, { style: { fontSize: 16, fontFamily: 'Inclusive Sans', color: colors.text }, children: title }), _jsx(react_native_1.Pressable, { onPress: onClose, children: _jsx(react_native_1.Text, { style: { fontSize: 14, color: colors.textSecondary, fontFamily: 'Inclusive Sans' }, children: "Close" }) })] }), _jsx(react_native_1.ScrollView, { style: { maxHeight: 480 }, children: options.map(renderRow) }), selected !== null && (_jsx(react_native_1.Pressable, { onPress: () => {
                        onClear();
                        onClose();
                    }, style: {
                        paddingVertical: 14,
                        alignItems: 'center',
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                    }, children: _jsx(react_native_1.Text, { style: { fontSize: 14, color: '#E8862A', fontFamily: 'Inclusive Sans' }, children: "Clear selection" }) }))] }));
        if (react_native_1.Platform.OS === 'web') {
            return (_jsxs(react_native_1.View, { style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999,
                }, children: [_jsx(react_native_1.Pressable, { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, onPress: onClose }), sheet] }));
        }
        return (_jsx(react_native_1.Modal, { visible: visible, transparent: true, animationType: "fade", onRequestClose: onClose, children: _jsxs(react_native_1.View, { style: {
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                }, children: [_jsx(react_native_1.Pressable, { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, onPress: onClose }), sheet] }) }));
    }
    exports_1("default", FilterPickerModal);
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
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            },
            function (useDetailColors_1_1) {
                useDetailColors_1 = useDetailColors_1_1;
            }
        ],
        execute: function () {
        }
    };
});
