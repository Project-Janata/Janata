System.register(["react/jsx-runtime", "react", "react-native", "../../hooks/useDetailColors"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, useDetailColors_1, styles;
    var __moduleName = context_1 && context_1.id;
    function AdminTableRow({ item, columns, isSelected, onPress, }) {
        const colors = useDetailColors_1.useDetailColors();
        const [hovered, setHovered] = react_1.useState(false);
        let rowBg = colors.panelBg;
        if (isSelected)
            rowBg = 'rgba(232,134,42,0.06)';
        else if (hovered)
            rowBg = colors.cardBg;
        return (_jsx(react_native_1.Pressable, { onPress: onPress, onHoverIn: () => setHovered(true), onHoverOut: () => setHovered(false), style: [
                styles.row,
                {
                    backgroundColor: rowBg,
                    borderBottomColor: colors.border,
                    borderLeftColor: isSelected ? '#E8862A' : 'transparent',
                    borderLeftWidth: 2,
                },
            ], children: columns.map((col) => (_jsx(react_native_1.View, { style: { flex: col.flex }, children: col.render(item) }, col.key))) }));
    }
    function AdminTable({ columns, data, keyExtractor, selectedId, onRowPress, }) {
        const colors = useDetailColors_1.useDetailColors();
        return (_jsxs(react_native_1.View, { children: [_jsx(react_native_1.View, { style: [styles.headerRow, { borderBottomColor: colors.border }], children: columns.map((col) => (_jsx(react_native_1.View, { style: { flex: col.flex }, children: _jsx(react_native_1.Text, { style: [styles.headerText, { color: colors.textMuted }], children: col.header }) }, col.key))) }), _jsx(react_native_1.ScrollView, { style: styles.scrollBody, children: data.map((item) => {
                        const id = keyExtractor(item);
                        return (_jsx(AdminTableRow, { item: item, columns: columns, isSelected: selectedId === id, onPress: () => onRowPress(item) }, id));
                    }) })] }));
    }
    exports_1("default", AdminTable);
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
            function (useDetailColors_1_1) {
                useDetailColors_1 = useDetailColors_1_1;
            }
        ],
        execute: function () {
            styles = react_native_1.StyleSheet.create({
                headerRow: {
                    flexDirection: 'row',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                },
                headerText: {
                    fontFamily: 'Inclusive Sans',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                },
                scrollBody: {
                    maxHeight: 600,
                },
                row: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                },
            });
        }
    };
});
