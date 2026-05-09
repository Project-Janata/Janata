System.register(["react/jsx-runtime", "react", "react-native", "lucide-react-native", "./AdminTable", "./AdminDetailPanel", "./AdminSearchInput", "./ConfirmDialog", "../../utils/api", "../../hooks/useDetailColors", "../contexts", "../ui"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, lucide_react_native_1, AdminTable_1, AdminDetailPanel_1, AdminSearchInput_1, ConfirmDialog_1, api_1, useDetailColors_1, contexts_1, ui_1, ROLE_COLORS, styles, detailStyles, infoStyles;
    var __moduleName = context_1 && context_1.id;
    function getRoleBadgeType(user) {
        if (user.verificationLevel >= 107)
            return 'super';
        if (user.isVerified)
            return 'verified';
        return null;
    }
    // ---------------------------------------------------------------------------
    // Date formatter
    // ---------------------------------------------------------------------------
    function formatJoinDate(iso) {
        if (!iso)
            return 'Unknown';
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    // ---------------------------------------------------------------------------
    // UsersTab
    // ---------------------------------------------------------------------------
    function UsersTab() {
        const colors = useDetailColors_1.useDetailColors();
        const { isDark } = contexts_1.useTheme();
        const [search, setSearch] = react_1.useState('');
        const [users, setUsers] = react_1.useState([]);
        const [total, setTotal] = react_1.useState(0);
        const [loading, setLoading] = react_1.useState(true);
        const [selectedUser, setSelectedUser] = react_1.useState(null);
        const [confirmDeleteVisible, setConfirmDeleteVisible] = react_1.useState(false);
        const [error, setError] = react_1.useState(null);
        const loadUsers = react_1.useCallback(async (q) => {
            try {
                setLoading(true);
                setError(null);
                const result = await api_1.fetchAdminUsers({ q: q || undefined, limit: 100 });
                setUsers(result.data);
                setTotal(result.total);
            }
            catch (err) {
                console.error('Failed to load users:', err);
                setError(err?.message || 'Failed to load users. Are you logged in?');
            }
            finally {
                setLoading(false);
            }
        }, []);
        react_1.useEffect(() => {
            loadUsers();
        }, [loadUsers]);
        react_1.useEffect(() => {
            const timer = setTimeout(() => {
                loadUsers(search);
            }, 300);
            return () => clearTimeout(timer);
        }, [search, loadUsers]);
        // --- Table columns ---
        const columns = react_1.useMemo(() => [
            {
                key: 'name',
                header: 'Name',
                flex: 2,
                render: (user) => (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center' }, children: [_jsx(ui_1.Avatar, { name: `${user.firstName} ${user.lastName}`, image: user.profileImage ?? undefined, size: 22, style: { marginRight: 8 } }), _jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text }, numberOfLines: 1, children: [user.firstName, " ", user.lastName] })] })),
            },
            {
                key: 'email',
                header: 'Email',
                flex: 2,
                render: (user) => (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }, numberOfLines: 1, children: user.email || user.username })),
            },
            {
                key: 'status',
                header: 'Status',
                flex: 1,
                render: (user) => {
                    const badge = getRoleBadgeType(user);
                    if (!badge) {
                        return (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }, children: '\u2014' }));
                    }
                    const rc = ROLE_COLORS[badge];
                    return (_jsx(react_native_1.View, { style: {
                            backgroundColor: rc.bg,
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 4,
                            alignSelf: 'flex-start',
                        }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 10, color: rc.text }, children: rc.label }) }));
                },
            },
        ], [colors]);
        // --- Actions ---
        const handleVerifyToggle = async () => {
            if (!selectedUser)
                return;
            try {
                const result = await api_1.adminVerifyUser(selectedUser.id, {
                    isVerified: !selectedUser.isVerified,
                });
                // Update local state
                setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, isVerified: result.isVerified } : u));
                setSelectedUser((prev) => prev ? { ...prev, isVerified: result.isVerified } : null);
            }
            catch (err) {
                console.error('Failed to toggle verification:', err);
            }
        };
        const handleConfirmRemove = async () => {
            setConfirmDeleteVisible(false);
            if (!selectedUser)
                return;
            try {
                await api_1.adminDeleteUser(selectedUser.id);
                setSelectedUser(null);
                loadUsers(search);
            }
            catch (err) {
                console.error('Failed to delete user:', err);
            }
        };
        // --- Detail panel content ---
        const renderDetailContent = () => {
            if (!selectedUser)
                return null;
            const u = selectedUser;
            const badgeType = getRoleBadgeType(u);
            const isSuperAdmin = badgeType === 'super';
            return (_jsxs(react_native_1.View, { children: [_jsxs(react_native_1.View, { style: detailStyles.userHeader, children: [_jsx(ui_1.Avatar, { name: `${u.firstName} ${u.lastName}`, image: u.profileImage ?? undefined, size: 56 }), _jsxs(react_native_1.Text, { style: [detailStyles.userName, { color: colors.text }], children: [u.firstName, " ", u.lastName] }), _jsx(react_native_1.Text, { style: [detailStyles.userEmail, { color: colors.textMuted }], children: u.email || u.username })] }), _jsxs(react_native_1.View, { style: { marginTop: 16 }, children: [_jsxs(react_native_1.View, { style: infoStyles.row, children: [_jsx(react_native_1.View, { style: [infoStyles.iconBox, { backgroundColor: colors.iconBoxBg }], children: _jsx(lucide_react_native_1.Building2, { size: 14, color: colors.iconHeader }) }), _jsx(react_native_1.Text, { style: [infoStyles.text, { color: colors.textSecondary }], children: u.centerID || 'No center' })] }), _jsxs(react_native_1.View, { style: infoStyles.row, children: [_jsx(react_native_1.View, { style: [infoStyles.iconBox, { backgroundColor: colors.iconBoxBg }], children: _jsx(lucide_react_native_1.Calendar, { size: 14, color: colors.iconHeader }) }), _jsxs(react_native_1.Text, { style: [infoStyles.text, { color: colors.textSecondary }], children: ["Joined ", formatJoinDate(u.createdAt)] })] }), _jsxs(react_native_1.View, { style: infoStyles.row, children: [_jsx(react_native_1.View, { style: [infoStyles.iconBox, { backgroundColor: colors.iconBoxBg }], children: _jsx(lucide_react_native_1.Shield, { size: 14, color: u.isVerified ? '#22c55e' : colors.iconHeader }) }), _jsxs(react_native_1.Text, { style: [infoStyles.text, { color: u.isVerified ? '#22c55e' : colors.textMuted }], children: [u.isVerified ? 'Verified' : 'Not verified', isSuperAdmin ? ' (Super Admin)' : ''] })] })] }), _jsxs(react_native_1.View, { style: detailStyles.actions, children: [_jsx(react_native_1.Pressable, { onPress: handleVerifyToggle, style: [detailStyles.actionBtn, { backgroundColor: colors.iconBoxBg }], children: _jsx(react_native_1.Text, { style: [detailStyles.actionBtnText, { color: colors.text }], children: u.isVerified ? 'Unverify' : 'Verify' }) }), _jsx(react_native_1.Pressable, { onPress: () => setConfirmDeleteVisible(true), style: [detailStyles.actionBtn, { backgroundColor: colors.iconBoxBg }], children: _jsx(react_native_1.Text, { style: [detailStyles.actionBtnText, { color: '#ef4444' }], children: "Remove User" }) })] })] }));
        };
        if (loading && users.length === 0) {
            return (_jsx(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center' }, children: _jsx(react_native_1.ActivityIndicator, { color: "#E8862A" }) }));
        }
        if (error && users.length === 0) {
            return (_jsxs(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: '#DC2626', textAlign: 'center' }, children: error }), _jsx(react_native_1.Pressable, { onPress: () => loadUsers(), style: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E8862A', borderRadius: 8 }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: '#fff' }, children: "Retry" }) })] }));
        }
        return (_jsxs(react_native_1.View, { style: styles.container, children: [_jsxs(react_native_1.View, { style: styles.tablePanel, children: [_jsxs(react_native_1.View, { style: styles.header, children: [_jsxs(react_native_1.Text, { style: [styles.title, { color: colors.text }], children: ["Users (", total, ")"] }), _jsx(react_native_1.View, { style: styles.searchWrap, children: _jsx(AdminSearchInput_1.default, { value: search, onChangeText: setSearch, placeholder: "Search users..." }) })] }), _jsx(AdminTable_1.default, { columns: columns, data: users, keyExtractor: (u) => u.id, selectedId: selectedUser?.id ?? null, onRowPress: (item) => setSelectedUser(item.id === selectedUser?.id ? null : item) })] }), selectedUser && (_jsx(AdminDetailPanel_1.default, { title: "User Details", onClose: () => setSelectedUser(null), children: renderDetailContent() })), _jsx(ConfirmDialog_1.default, { visible: confirmDeleteVisible, title: "Remove User", message: `Are you sure you want to remove ${selectedUser?.firstName ?? ''} ${selectedUser?.lastName ?? ''}? This action cannot be undone.`, confirmLabel: "Remove", onConfirm: handleConfirmRemove, onCancel: () => setConfirmDeleteVisible(false) })] }));
    }
    exports_1("default", UsersTab);
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
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            }
        ],
        execute: function () {
            // ---------------------------------------------------------------------------
            // Role badge config
            // ---------------------------------------------------------------------------
            ROLE_COLORS = {
                super: { bg: 'rgba(232,134,42,0.2)', text: '#E8862A', label: 'Super' },
                verified: { bg: 'rgba(34,197,94,0.2)', text: '#22c55e', label: 'Verified' },
            };
            // ---------------------------------------------------------------------------
            // Styles
            // ---------------------------------------------------------------------------
            styles = react_native_1.StyleSheet.create({
                container: { flex: 1, flexDirection: 'row' },
                tablePanel: { flex: 1 },
                header: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                },
                title: { fontFamily: 'Inclusive Sans', fontSize: 16 },
                searchWrap: { width: 240 },
            });
            detailStyles = react_native_1.StyleSheet.create({
                userHeader: { alignItems: 'center', marginBottom: 8 },
                userName: { fontFamily: 'Inclusive Sans', fontSize: 16, marginTop: 8 },
                userEmail: { fontFamily: 'Inclusive Sans', fontSize: 13, marginTop: 2 },
                actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
                actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
                actionBtnText: { fontFamily: 'Inclusive Sans', fontSize: 13 },
            });
            infoStyles = react_native_1.StyleSheet.create({
                row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
                iconBox: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
                text: { fontFamily: 'Inclusive Sans', fontSize: 13, flex: 1 },
            });
        }
    };
});
