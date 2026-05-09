System.register(["react/jsx-runtime", "react", "react-native", "lucide-react-native", "./AdminTable", "./ConfirmDialog", "../../utils/api", "../../hooks/useDetailColors", "../contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, lucide_react_native_1, AdminTable_1, ConfirmDialog_1, api_1, useDetailColors_1, contexts_1, NOTIFICATION_TYPE_NAMES;
    var __moduleName = context_1 && context_1.id;
    function NotificationsTab() {
        const colors = useDetailColors_1.useDetailColors();
        const { isDark } = contexts_1.useTheme();
        const [notifications, setNotifications] = react_1.useState([]);
        const [stats, setStats] = react_1.useState(null);
        const [total, setTotal] = react_1.useState(0);
        const [loading, setLoading] = react_1.useState(true);
        const [error, setError] = react_1.useState(null);
        const [selectedId, setSelectedId] = react_1.useState(null);
        const [deleteTarget, setDeleteTarget] = react_1.useState(null);
        const [filterType, setFilterType] = react_1.useState(undefined);
        // Send form state
        const [showSendForm, setShowSendForm] = react_1.useState(false);
        const [sendTitle, setSendTitle] = react_1.useState('');
        const [sendMessage, setSendMessage] = react_1.useState('');
        const [sendTypeId, setSendTypeId] = react_1.useState(7); // default System Notification
        const [sendBroadcast, setSendBroadcast] = react_1.useState(true);
        const [sendUserId, setSendUserId] = react_1.useState('');
        const [sending, setSending] = react_1.useState(false);
        const [sendResult, setSendResult] = react_1.useState(null);
        const loadNotifications = react_1.useCallback(async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await api_1.fetchAdminNotifications({ limit: 100, typeId: filterType });
                setNotifications(result.data);
                setTotal(result.total);
            }
            catch (err) {
                setError(err?.message || 'Failed to load notifications');
            }
            finally {
                setLoading(false);
            }
        }, [filterType]);
        const loadStats = react_1.useCallback(async () => {
            try {
                const s = await api_1.fetchAdminNotificationStats();
                setStats(s);
            }
            catch {
                // stats are non-critical
            }
        }, []);
        react_1.useEffect(() => {
            loadNotifications();
            loadStats();
        }, [loadNotifications, loadStats]);
        const handleDelete = async () => {
            if (!deleteTarget)
                return;
            try {
                await api_1.adminDeleteNotification(deleteTarget.id);
                setDeleteTarget(null);
                setSelectedId(null);
                loadNotifications();
                loadStats();
            }
            catch (err) {
                console.error('Failed to delete notification:', err);
            }
        };
        const handleSend = async () => {
            if (!sendTitle.trim() || !sendMessage.trim())
                return;
            try {
                setSending(true);
                setSendResult(null);
                const result = await api_1.adminSendNotification({
                    title: sendTitle.trim(),
                    message: sendMessage.trim(),
                    typeId: sendTypeId,
                    broadcast: sendBroadcast,
                    userId: sendBroadcast ? undefined : sendUserId.trim() || undefined,
                });
                setSendResult(result.message);
                setSendTitle('');
                setSendMessage('');
                setSendUserId('');
                loadNotifications();
                loadStats();
            }
            catch (err) {
                setSendResult(`Error: ${err.message}`);
            }
            finally {
                setSending(false);
            }
        };
        const selected = notifications.find((n) => n.id === selectedId) ?? null;
        const renderTypeBadge = (typeId) => {
            const name = NOTIFICATION_TYPE_NAMES[typeId] || `Type ${typeId}`;
            const isSystem = typeId === 7;
            const bg = isSystem
                ? isDark ? 'rgba(59,130,246,0.2)' : '#EFF6FF'
                : isDark ? 'rgba(232,134,42,0.2)' : '#FFF7ED';
            const textColor = isSystem
                ? isDark ? '#93C5FD' : '#2563EB'
                : isDark ? '#FBB86C' : '#C2410C';
            return (_jsx(react_native_1.View, { style: { alignSelf: 'flex-start', backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 10, color: textColor }, children: name }) }));
        };
        const renderReadStatus = (isRead) => {
            const bg = isRead
                ? isDark ? 'rgba(113,113,122,0.2)' : '#F4F4F5'
                : isDark ? 'rgba(22,163,74,0.2)' : '#F0FDF4';
            const textColor = isRead
                ? isDark ? '#A1A1AA' : '#71717A'
                : isDark ? '#4ADE80' : '#16A34A';
            return (_jsx(react_native_1.View, { style: { alignSelf: 'flex-start', backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 10, color: textColor }, children: isRead ? 'Read' : 'Unread' }) }));
        };
        const columns = [
            {
                key: 'title',
                header: 'Title',
                flex: 2,
                render: (item) => (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text }, numberOfLines: 1, children: item.title })),
            },
            {
                key: 'recipient',
                header: 'Recipient',
                flex: 1.5,
                render: (item) => (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }, numberOfLines: 1, children: item.recipientName })),
            },
            {
                key: 'type',
                header: 'Type',
                flex: 1.2,
                render: (item) => renderTypeBadge(item.typeId),
            },
            {
                key: 'status',
                header: 'Status',
                flex: 0.8,
                render: (item) => renderReadStatus(item.isRead),
            },
            {
                key: 'date',
                header: 'Date',
                flex: 1,
                render: (item) => (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textMuted }, children: new Date(item.createdAt).toLocaleDateString() })),
            },
        ];
        if (loading && notifications.length === 0) {
            return (_jsx(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center' }, children: _jsx(react_native_1.ActivityIndicator, { color: "#E8862A" }) }));
        }
        if (error && notifications.length === 0) {
            return (_jsxs(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: '#DC2626', textAlign: 'center' }, children: error }), _jsx(react_native_1.Pressable, { onPress: () => loadNotifications(), style: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E8862A', borderRadius: 8 }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: '#fff' }, children: "Retry" }) })] }));
        }
        const inputBg = isDark ? '#262626' : '#fff';
        const inputBorder = isDark ? '#404040' : '#D6D3D1';
        const inputColor = isDark ? '#E5E5E5' : '#1C1917';
        return (_jsxs(react_native_1.View, { style: { flex: 1, flexDirection: 'row' }, children: [_jsxs(react_native_1.View, { style: { flex: 1, padding: 20 }, children: [stats && (_jsx(react_native_1.View, { style: { flexDirection: 'row', gap: 16, marginBottom: 16 }, children: [
                                { label: 'Total', value: stats.total },
                                { label: 'Unread', value: stats.unread },
                                { label: 'Last 24h', value: stats.last24h },
                            ].map((s) => (_jsxs(react_native_1.View, { style: {
                                    backgroundColor: isDark ? '#1a1a1a' : '#F5F5F4',
                                    borderRadius: 10,
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    borderWidth: 1,
                                    borderColor: isDark ? '#262626' : '#E7E5E4',
                                }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 2 }, children: s.label }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 20, color: colors.text }, children: s.value })] }, s.label))) })), _jsxs(react_native_1.View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 12 }, children: [_jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 18, color: colors.text }, children: ["Notifications (", total, ")"] }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', gap: 4 }, children: [_jsx(react_native_1.Pressable, { onPress: () => setFilterType(undefined), style: {
                                                        paddingHorizontal: 10,
                                                        paddingVertical: 4,
                                                        borderRadius: 6,
                                                        backgroundColor: filterType === undefined ? '#E8862A' : (isDark ? '#262626' : '#F5F5F4'),
                                                    }, children: _jsx(react_native_1.Text, { style: {
                                                            fontFamily: 'Inclusive Sans',
                                                            fontSize: 11,
                                                            color: filterType === undefined ? '#fff' : colors.textSecondary,
                                                        }, children: "All" }) }), [7, 6, 2, 3, 4].map((tid) => (_jsx(react_native_1.Pressable, { onPress: () => setFilterType(filterType === tid ? undefined : tid), style: {
                                                        paddingHorizontal: 10,
                                                        paddingVertical: 4,
                                                        borderRadius: 6,
                                                        backgroundColor: filterType === tid ? '#E8862A' : (isDark ? '#262626' : '#F5F5F4'),
                                                    }, children: _jsx(react_native_1.Text, { style: {
                                                            fontFamily: 'Inclusive Sans',
                                                            fontSize: 11,
                                                            color: filterType === tid ? '#fff' : colors.textSecondary,
                                                        }, children: NOTIFICATION_TYPE_NAMES[tid]?.replace('Event ', '').replace('Center ', '') }) }, tid)))] })] }), _jsxs(react_native_1.Pressable, { onPress: () => setShowSendForm(!showSendForm), style: {
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                        backgroundColor: '#E8862A',
                                        paddingHorizontal: 14,
                                        paddingVertical: 8,
                                        borderRadius: 8,
                                    }, children: [_jsx(lucide_react_native_1.Send, { size: 14, color: "#fff" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: '#fff' }, children: "Send" })] })] }), showSendForm && (_jsxs(react_native_1.View, { style: {
                                backgroundColor: isDark ? '#1a1a1a' : '#F5F5F4',
                                borderRadius: 10,
                                padding: 16,
                                marginBottom: 16,
                                borderWidth: 1,
                                borderColor: isDark ? '#262626' : '#E7E5E4',
                            }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text, marginBottom: 12 }, children: "Send Notification" }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', gap: 12, marginBottom: 10 }, children: [_jsxs(react_native_1.View, { style: { flex: 1 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 4 }, children: "Title" }), _jsx(react_native_1.TextInput, { value: sendTitle, onChangeText: setSendTitle, placeholder: "Notification title", placeholderTextColor: colors.textMuted, style: {
                                                        fontFamily: 'Inclusive Sans',
                                                        fontSize: 13,
                                                        color: inputColor,
                                                        backgroundColor: inputBg,
                                                        borderWidth: 1,
                                                        borderColor: inputBorder,
                                                        borderRadius: 6,
                                                        paddingHorizontal: 10,
                                                        paddingVertical: 8,
                                                    } })] }), _jsxs(react_native_1.View, { style: { width: 160 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 4 }, children: "Type" }), _jsx(react_native_1.View, { style: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 }, children: [7, 6].map((tid) => (_jsx(react_native_1.Pressable, { onPress: () => setSendTypeId(tid), style: {
                                                            paddingHorizontal: 8,
                                                            paddingVertical: 4,
                                                            borderRadius: 6,
                                                            backgroundColor: sendTypeId === tid ? '#E8862A' : (isDark ? '#333' : '#E7E5E4'),
                                                        }, children: _jsx(react_native_1.Text, { style: {
                                                                fontFamily: 'Inclusive Sans',
                                                                fontSize: 11,
                                                                color: sendTypeId === tid ? '#fff' : colors.textSecondary,
                                                            }, children: NOTIFICATION_TYPE_NAMES[tid] }) }, tid))) })] })] }), _jsxs(react_native_1.View, { style: { marginBottom: 10 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 4 }, children: "Message" }), _jsx(react_native_1.TextInput, { value: sendMessage, onChangeText: setSendMessage, placeholder: "Notification message", placeholderTextColor: colors.textMuted, multiline: true, numberOfLines: 2, style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 13,
                                                color: inputColor,
                                                backgroundColor: inputBg,
                                                borderWidth: 1,
                                                borderColor: inputBorder,
                                                borderRadius: 6,
                                                paddingHorizontal: 10,
                                                paddingVertical: 8,
                                                minHeight: 48,
                                            } })] }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }, children: [_jsxs(react_native_1.Pressable, { onPress: () => setSendBroadcast(true), style: { flexDirection: 'row', alignItems: 'center', gap: 6 }, children: [_jsx(react_native_1.View, { style: {
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: 8,
                                                        borderWidth: 2,
                                                        borderColor: sendBroadcast ? '#E8862A' : colors.textMuted,
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }, children: sendBroadcast && _jsx(react_native_1.View, { style: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E8862A' } }) }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.text }, children: "Broadcast to all" })] }), _jsxs(react_native_1.Pressable, { onPress: () => setSendBroadcast(false), style: { flexDirection: 'row', alignItems: 'center', gap: 6 }, children: [_jsx(react_native_1.View, { style: {
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: 8,
                                                        borderWidth: 2,
                                                        borderColor: !sendBroadcast ? '#E8862A' : colors.textMuted,
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }, children: !sendBroadcast && _jsx(react_native_1.View, { style: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E8862A' } }) }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.text }, children: "Specific user" })] }), !sendBroadcast && (_jsx(react_native_1.TextInput, { value: sendUserId, onChangeText: setSendUserId, placeholder: "User ID", placeholderTextColor: colors.textMuted, style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 12,
                                                color: inputColor,
                                                backgroundColor: inputBg,
                                                borderWidth: 1,
                                                borderColor: inputBorder,
                                                borderRadius: 6,
                                                paddingHorizontal: 10,
                                                paddingVertical: 6,
                                                width: 200,
                                            } }))] }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 12 }, children: [_jsxs(react_native_1.Pressable, { onPress: handleSend, disabled: sending || !sendTitle.trim() || !sendMessage.trim(), style: {
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 6,
                                                backgroundColor: sending || !sendTitle.trim() || !sendMessage.trim() ? (isDark ? '#444' : '#D6D3D1') : '#E8862A',
                                                paddingHorizontal: 14,
                                                paddingVertical: 8,
                                                borderRadius: 8,
                                            }, children: [sending ? (_jsx(react_native_1.ActivityIndicator, { size: "small", color: "#fff" })) : (_jsx(lucide_react_native_1.Send, { size: 14, color: "#fff" })), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: '#fff' }, children: sending ? 'Sending...' : sendBroadcast ? 'Send to All' : 'Send' })] }), sendResult && (_jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 12,
                                                color: sendResult.startsWith('Error') ? '#DC2626' : (isDark ? '#4ADE80' : '#16A34A'),
                                            }, children: sendResult }))] })] })), _jsx(AdminTable_1.default, { columns: columns, data: notifications, keyExtractor: (item) => item.id, selectedId: selectedId, onRowPress: (item) => setSelectedId(item.id === selectedId ? null : item.id) }), notifications.length === 0 && !loading && (_jsxs(react_native_1.View, { style: { padding: 40, alignItems: 'center' }, children: [_jsx(lucide_react_native_1.Bell, { size: 32, color: colors.textMuted }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.textMuted, marginTop: 12 }, children: "No notifications yet" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textMuted, marginTop: 4 }, children: "Send a notification or wire up triggers to see them here" })] }))] }), selected && (_jsxs(react_native_1.View, { style: {
                        width: 320,
                        borderLeftWidth: 1,
                        borderLeftColor: colors.border,
                        backgroundColor: colors.panelBg,
                    }, children: [_jsxs(react_native_1.View, { style: {
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                                borderBottomWidth: 1,
                                borderBottomColor: colors.border,
                            }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.text }, numberOfLines: 1, children: selected.title }), _jsx(react_native_1.Pressable, { onPress: () => setSelectedId(null), hitSlop: 8, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 18, color: colors.textMuted }, children: "x" }) })] }), _jsx(react_native_1.ScrollView, { style: { flex: 1 }, contentContainerStyle: { padding: 16 }, children: _jsxs(react_native_1.View, { style: { gap: 14 }, children: [_jsxs(react_native_1.View, { children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }, children: "Message" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text, lineHeight: 20 }, children: selected.message })] }), _jsxs(react_native_1.View, { children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }, children: "Recipient" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text }, children: selected.recipientName }), _jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted }, children: ["@", selected.recipientUsername, " / ", selected.userId] })] }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', gap: 8 }, children: [renderTypeBadge(selected.typeId), renderReadStatus(selected.isRead)] }), _jsxs(react_native_1.View, { children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }, children: "Created" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSecondary }, children: new Date(selected.createdAt).toLocaleString() })] }), selected.readAt && (_jsxs(react_native_1.View, { children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }, children: "Read At" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSecondary }, children: new Date(selected.readAt).toLocaleString() })] })), selected.actionUrl && (_jsxs(react_native_1.View, { children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }, children: "Action URL" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: '#E8862A' }, children: selected.actionUrl })] })), _jsx(react_native_1.View, { style: { flexDirection: 'row', gap: 8, marginTop: 4 }, children: _jsxs(react_native_1.Pressable, { onPress: () => setDeleteTarget(selected), style: {
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 6,
                                                backgroundColor: colors.iconBoxBg,
                                                paddingHorizontal: 14,
                                                paddingVertical: 8,
                                                borderRadius: 8,
                                            }, children: [_jsx(lucide_react_native_1.Trash2, { size: 14, color: isDark ? '#F87171' : '#DC2626' }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: isDark ? '#F87171' : '#DC2626' }, children: "Delete" })] }) })] }) })] })), _jsx(ConfirmDialog_1.default, { visible: deleteTarget !== null, title: "Delete Notification", message: `Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`, confirmLabel: "Delete", onConfirm: handleDelete, onCancel: () => setDeleteTarget(null) })] }));
    }
    exports_1("default", NotificationsTab);
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
            NOTIFICATION_TYPE_NAMES = {
                1: 'Event Reminder',
                2: 'Event Created',
                3: 'Event Cancelled',
                4: 'Event Updated',
                5: 'Attendee Joined',
                6: 'Center Announcement',
                7: 'System Notification',
            };
        }
    };
});
