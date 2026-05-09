System.register(["react/jsx-runtime", "react", "react-native", "lucide-react-native", "./AdminTable", "./AdminDetailPanel", "./AdminSearchInput", "./AdminInfoRow", "./ConfirmDialog", "../../utils/api", "../../hooks/useDetailColors", "../contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, lucide_react_native_1, AdminTable_1, AdminDetailPanel_1, AdminSearchInput_1, AdminInfoRow_1, ConfirmDialog_1, api_1, useDetailColors_1, contexts_1, formatDate, formatTime;
    var __moduleName = context_1 && context_1.id;
    function EventsTab() {
        const colors = useDetailColors_1.useDetailColors();
        const { isDark } = contexts_1.useTheme();
        const [search, setSearch] = react_1.useState('');
        const [events, setEvents] = react_1.useState([]);
        const [total, setTotal] = react_1.useState(0);
        const [loading, setLoading] = react_1.useState(true);
        const [selectedId, setSelectedId] = react_1.useState(null);
        const [deleteTarget, setDeleteTarget] = react_1.useState(null);
        const [error, setError] = react_1.useState(null);
        const loadEvents = react_1.useCallback(async (q) => {
            try {
                setLoading(true);
                setError(null);
                const result = await api_1.fetchAdminEvents({ q: q || undefined, limit: 100 });
                setEvents(result.data);
                setTotal(result.total);
            }
            catch (err) {
                console.error('Failed to load events:', err);
                setError(err?.message || 'Failed to load events. Are you logged in?');
            }
            finally {
                setLoading(false);
            }
        }, []);
        react_1.useEffect(() => {
            loadEvents();
        }, [loadEvents]);
        react_1.useEffect(() => {
            const timer = setTimeout(() => {
                loadEvents(search);
            }, 300);
            return () => clearTimeout(timer);
        }, [search, loadEvents]);
        const selected = react_1.useMemo(() => events.find((e) => e.eventID === selectedId) ?? null, [selectedId, events]);
        const handleDelete = async () => {
            if (!deleteTarget)
                return;
            try {
                await api_1.adminDeleteEvent(deleteTarget.eventID);
                setDeleteTarget(null);
                setSelectedId(null);
                loadEvents(search);
            }
            catch (err) {
                console.error('Failed to delete event:', err);
            }
        };
        const columns = [
            {
                key: 'title',
                header: 'Title',
                flex: 2,
                render: (item) => (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text }, numberOfLines: 1, children: item.title || 'Untitled' })),
            },
            {
                key: 'date',
                header: 'Date',
                flex: 1,
                render: (item) => (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }, children: formatDate(item.date) })),
            },
            {
                key: 'attendees',
                header: 'Attendees',
                flex: 1,
                render: (item) => (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }, children: item.peopleAttending })),
            },
        ];
        if (loading && events.length === 0) {
            return (_jsx(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center' }, children: _jsx(react_native_1.ActivityIndicator, { color: "#E8862A" }) }));
        }
        if (error && events.length === 0) {
            return (_jsxs(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: '#DC2626', textAlign: 'center' }, children: error }), _jsx(react_native_1.Pressable, { onPress: () => loadEvents(), style: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E8862A', borderRadius: 8 }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: '#fff' }, children: "Retry" }) })] }));
        }
        return (_jsxs(react_native_1.View, { style: { flex: 1, flexDirection: 'row' }, children: [_jsxs(react_native_1.View, { style: { flex: 1, padding: 20 }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 18, color: colors.text }, children: ["Events (", total, ")"] }), _jsx(react_native_1.View, { style: { width: 240 }, children: _jsx(AdminSearchInput_1.default, { value: search, onChangeText: setSearch, placeholder: "Search events..." }) })] }), _jsx(AdminTable_1.default, { columns: columns, data: events, keyExtractor: (item) => item.eventID, selectedId: selectedId, onRowPress: (item) => setSelectedId(item.eventID === selectedId ? null : item.eventID) })] }), selected && (_jsxs(AdminDetailPanel_1.default, { title: selected.title || 'Untitled', onClose: () => setSelectedId(null), children: [_jsxs(react_native_1.View, { style: { gap: 12 }, children: [_jsx(AdminInfoRow_1.default, { icon: _jsx(lucide_react_native_1.Clock, { size: 14, color: colors.textMuted }), text: `${formatDate(selected.date)} · ${formatTime(selected.date)}`, colors: colors }), selected.address && (_jsx(AdminInfoRow_1.default, { icon: _jsx(lucide_react_native_1.MapPin, { size: 14, color: colors.textMuted }), text: selected.address, colors: colors })), _jsx(AdminInfoRow_1.default, { icon: _jsx(lucide_react_native_1.Users, { size: 14, color: colors.textMuted }), text: `${selected.peopleAttending} attendees`, colors: colors }), selected.description && (_jsx(AdminInfoRow_1.default, { icon: _jsx(lucide_react_native_1.FileText, { size: 14, color: colors.textMuted }), text: selected.description, colors: colors }))] }), _jsx(react_native_1.View, { style: { marginTop: 16 }, children: _jsx(react_native_1.Pressable, { onPress: () => setDeleteTarget(selected), style: { backgroundColor: colors.iconBoxBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: isDark ? '#F87171' : '#DC2626' }, children: "Delete" }) }) })] })), _jsx(ConfirmDialog_1.default, { visible: deleteTarget !== null, title: "Delete Event", message: `Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`, confirmLabel: "Delete", onConfirm: handleDelete, onCancel: () => setDeleteTarget(null) })] }));
    }
    exports_1("default", EventsTab);
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
            function (AdminTable_1_1) {
                AdminTable_1 = AdminTable_1_1;
            },
            function (AdminDetailPanel_1_1) {
                AdminDetailPanel_1 = AdminDetailPanel_1_1;
            },
            function (AdminSearchInput_1_1) {
                AdminSearchInput_1 = AdminSearchInput_1_1;
            },
            function (AdminInfoRow_1_1) {
                AdminInfoRow_1 = AdminInfoRow_1_1;
            },
            function (ConfirmDialog_1_1) {
                ConfirmDialog_1 = ConfirmDialog_1_1;
            },
            function (api_1_1) {
                api_1 = api_1_1;
            },
            function (useDetailColors_1_1) {
                useDetailColors_1 = useDetailColors_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            }
        ],
        execute: function () {
            formatDate = (dateStr) => {
                const d = new Date(dateStr);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            };
            formatTime = (dateStr) => {
                const d = new Date(dateStr);
                return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            };
        }
    };
});
