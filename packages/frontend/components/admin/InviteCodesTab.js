System.register(["react/jsx-runtime", "react", "react-native", "lucide-react-native", "./AdminTable", "./AdminDetailPanel", "./ConfirmDialog", "../../utils/api", "../../hooks/useDetailColors", "../contexts", "../ui"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, lucide_react_native_1, AdminTable_1, AdminDetailPanel_1, ConfirmDialog_1, api_1, useDetailColors_1, contexts_1, ui_1, styles, detailStyles, infoStyles, createStyles;
    var __moduleName = context_1 && context_1.id;
    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------
    function formatDate(iso) {
        if (!iso)
            return 'Unknown';
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    // ---------------------------------------------------------------------------
    // InviteCodesTab
    // ---------------------------------------------------------------------------
    function InviteCodesTab() {
        const colors = useDetailColors_1.useDetailColors();
        const { isDark } = contexts_1.useTheme();
        const [codes, setCodes] = react_1.useState([]);
        const [loading, setLoading] = react_1.useState(true);
        const [error, setError] = react_1.useState(null);
        const [selectedCode, setSelectedCode] = react_1.useState(null);
        const [codeUsers, setCodeUsers] = react_1.useState([]);
        const [loadingUsers, setLoadingUsers] = react_1.useState(false);
        // Create form state
        const [showCreate, setShowCreate] = react_1.useState(false);
        const [newCode, setNewCode] = react_1.useState('');
        const [newLabel, setNewLabel] = react_1.useState('');
        const [newVerLevel, setNewVerLevel] = react_1.useState('45');
        const [createError, setCreateError] = react_1.useState('');
        const [creating, setCreating] = react_1.useState(false);
        // Toggle confirm
        const [confirmToggleVisible, setConfirmToggleVisible] = react_1.useState(false);
        const loadCodes = react_1.useCallback(async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await api_1.fetchAdminInviteCodes();
                setCodes(result.data);
            }
            catch (err) {
                setError(err?.message || 'Failed to load invite codes.');
            }
            finally {
                setLoading(false);
            }
        }, []);
        react_1.useEffect(() => {
            loadCodes();
        }, [loadCodes]);
        // Load users when a code is selected
        react_1.useEffect(() => {
            if (!selectedCode) {
                setCodeUsers([]);
                return;
            }
            let cancelled = false;
            setLoadingUsers(true);
            api_1.fetchAdminInviteCodeUsers(selectedCode.code)
                .then((users) => {
                if (!cancelled)
                    setCodeUsers(users);
            })
                .catch(() => {
                if (!cancelled)
                    setCodeUsers([]);
            })
                .finally(() => {
                if (!cancelled)
                    setLoadingUsers(false);
            });
            return () => { cancelled = true; };
        }, [selectedCode]);
        // --- Table columns ---
        const columns = react_1.useMemo(() => [
            {
                key: 'code',
                header: 'Code',
                flex: 2,
                render: (item) => (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text, letterSpacing: 0.5 }, numberOfLines: 1, children: item.code })),
            },
            {
                key: 'label',
                header: 'Label',
                flex: 2,
                render: (item) => (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }, numberOfLines: 1, children: item.label })),
            },
            {
                key: 'usage',
                header: 'Signups',
                flex: 1,
                render: (item) => (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }, children: item.usageCount })),
            },
            {
                key: 'status',
                header: 'Status',
                flex: 1,
                render: (item) => {
                    const active = item.isActive;
                    return (_jsx(react_native_1.View, { style: {
                            backgroundColor: active ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)',
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 4,
                            alignSelf: 'flex-start',
                        }, children: _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans',
                                fontSize: 10,
                                color: active ? '#22c55e' : '#ef4444',
                            }, children: active ? 'Active' : 'Inactive' }) }));
                },
            },
        ], [colors]);
        // --- Actions ---
        const handleToggle = async () => {
            setConfirmToggleVisible(false);
            if (!selectedCode)
                return;
            try {
                await api_1.adminToggleInviteCode(selectedCode.code);
                // Refresh
                const result = await api_1.fetchAdminInviteCodes();
                setCodes(result.data);
                const updated = result.data.find((c) => c.code === selectedCode.code);
                if (updated)
                    setSelectedCode(updated);
            }
            catch (err) {
                console.error('Failed to toggle invite code:', err);
            }
        };
        const handleCreate = async () => {
            setCreateError('');
            if (!newCode.trim()) {
                setCreateError('Code is required');
                return;
            }
            if (!newLabel.trim()) {
                setCreateError('Label is required');
                return;
            }
            const verLevel = parseInt(newVerLevel, 10);
            if (isNaN(verLevel) || verLevel < 0) {
                setCreateError('Valid verification level is required');
                return;
            }
            try {
                setCreating(true);
                await api_1.adminCreateInviteCode({
                    code: newCode.trim(),
                    label: newLabel.trim(),
                    verificationLevel: verLevel,
                });
                setNewCode('');
                setNewLabel('');
                setNewVerLevel('45');
                setShowCreate(false);
                loadCodes();
            }
            catch (err) {
                setCreateError(err?.message || 'Failed to create invite code');
            }
            finally {
                setCreating(false);
            }
        };
        const handleCopyCode = (code) => {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(code);
            }
        };
        // --- Detail panel ---
        const renderDetailContent = () => {
            if (!selectedCode)
                return null;
            const c = selectedCode;
            return (_jsxs(react_native_1.View, { children: [_jsxs(react_native_1.View, { style: detailStyles.header, children: [_jsx(react_native_1.View, { style: [detailStyles.iconCircle, { backgroundColor: c.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)' }], children: _jsx(lucide_react_native_1.Ticket, { size: 24, color: c.isActive ? '#22c55e' : '#ef4444' }) }), _jsx(react_native_1.Text, { style: [detailStyles.codeName, { color: colors.text }], children: c.code }), _jsx(react_native_1.Text, { style: [detailStyles.codeLabel, { color: colors.textMuted }], children: c.label })] }), _jsxs(react_native_1.View, { style: { marginTop: 16 }, children: [_jsxs(react_native_1.View, { style: infoStyles.row, children: [_jsx(react_native_1.View, { style: [infoStyles.iconBox, { backgroundColor: colors.iconBoxBg }], children: _jsx(lucide_react_native_1.Users, { size: 14, color: colors.iconHeader }) }), _jsxs(react_native_1.Text, { style: [infoStyles.text, { color: colors.textSecondary }], children: [c.usageCount, " signup", c.usageCount !== 1 ? 's' : ''] })] }), _jsxs(react_native_1.View, { style: infoStyles.row, children: [_jsx(react_native_1.View, { style: [infoStyles.iconBox, { backgroundColor: colors.iconBoxBg }], children: c.isActive
                                            ? _jsx(lucide_react_native_1.ToggleRight, { size: 14, color: "#22c55e" })
                                            : _jsx(lucide_react_native_1.ToggleLeft, { size: 14, color: "#ef4444" }) }), _jsx(react_native_1.Text, { style: [infoStyles.text, { color: c.isActive ? '#22c55e' : '#ef4444' }], children: c.isActive ? 'Active' : 'Inactive' })] }), _jsx(react_native_1.View, { style: infoStyles.row, children: _jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textMuted }, children: ["Verification Level: ", c.verificationLevel, " \u00B7 Created ", formatDate(c.createdAt)] }) })] }), _jsxs(react_native_1.View, { style: detailStyles.actions, children: [_jsxs(react_native_1.Pressable, { onPress: () => handleCopyCode(c.code), style: [detailStyles.actionBtn, { backgroundColor: colors.iconBoxBg }], children: [_jsx(lucide_react_native_1.Copy, { size: 14, color: colors.text }), _jsx(react_native_1.Text, { style: [detailStyles.actionBtnText, { color: colors.text, marginLeft: 6 }], children: "Copy" })] }), _jsx(react_native_1.Pressable, { onPress: () => setConfirmToggleVisible(true), style: [detailStyles.actionBtn, { backgroundColor: colors.iconBoxBg }], children: _jsx(react_native_1.Text, { style: [detailStyles.actionBtnText, { color: c.isActive ? '#ef4444' : '#22c55e' }], children: c.isActive ? 'Deactivate' : 'Activate' }) })] }), _jsxs(react_native_1.View, { style: { marginTop: 20 }, children: [_jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }, children: ["Signups (", codeUsers.length, ")"] }), loadingUsers ? (_jsx(react_native_1.ActivityIndicator, { size: "small", color: "#E8862A" })) : codeUsers.length === 0 ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }, children: "No signups yet" })) : (codeUsers.map((user) => (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 }, children: [_jsx(ui_1.Avatar, { name: `${user.firstName} ${user.lastName}`, image: user.profileImage ?? undefined, size: 24, style: { marginRight: 8 } }), _jsxs(react_native_1.View, { style: { flex: 1 }, children: [_jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text }, numberOfLines: 1, children: [user.firstName, " ", user.lastName] }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted }, numberOfLines: 1, children: user.email || user.username })] })] }, user.id))))] })] }));
        };
        // --- Create form modal ---
        const renderCreateForm = () => {
            if (!showCreate)
                return null;
            const inputStyle = {
                fontFamily: 'Inclusive Sans',
                fontSize: 14,
                color: colors.text,
                backgroundColor: colors.iconBoxBg,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: colors.border,
            };
            return (_jsx(react_native_1.View, { style: [createStyles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }], children: _jsxs(react_native_1.View, { style: [createStyles.modal, { backgroundColor: colors.panelBg, borderColor: colors.border }], children: [_jsxs(react_native_1.View, { style: createStyles.modalHeader, children: [_jsx(react_native_1.Text, { style: [createStyles.modalTitle, { color: colors.text }], children: "Create Invite Code" }), _jsx(react_native_1.Pressable, { onPress: () => { setShowCreate(false); setCreateError(''); }, children: _jsx(lucide_react_native_1.X, { size: 18, color: colors.textMuted }) })] }), _jsx(react_native_1.TextInput, { style: inputStyle, placeholder: "Code (e.g. BETA-WAVE3)", placeholderTextColor: colors.textMuted, value: newCode, onChangeText: setNewCode, autoCapitalize: "characters" }), _jsx(react_native_1.TextInput, { style: inputStyle, placeholder: "Label (e.g. Wave 3 - Extended testers)", placeholderTextColor: colors.textMuted, value: newLabel, onChangeText: setNewLabel }), _jsx(react_native_1.TextInput, { style: inputStyle, placeholder: "Verification Level (default: 45)", placeholderTextColor: colors.textMuted, value: newVerLevel, onChangeText: setNewVerLevel, keyboardType: "numeric" }), createError ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: '#ef4444', marginBottom: 8 }, children: createError })) : null, _jsx(react_native_1.Pressable, { onPress: handleCreate, disabled: creating, style: [createStyles.createBtn, creating && { opacity: 0.6 }], children: _jsx(react_native_1.Text, { style: createStyles.createBtnText, children: creating ? 'Creating...' : 'Create Code' }) })] }) }));
        };
        if (loading && codes.length === 0) {
            return (_jsx(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center' }, children: _jsx(react_native_1.ActivityIndicator, { color: "#E8862A" }) }));
        }
        if (error && codes.length === 0) {
            return (_jsxs(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: '#DC2626', textAlign: 'center' }, children: error }), _jsx(react_native_1.Pressable, { onPress: loadCodes, style: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E8862A', borderRadius: 8 }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: '#fff' }, children: "Retry" }) })] }));
        }
        return (_jsxs(react_native_1.View, { style: styles.container, children: [_jsxs(react_native_1.View, { style: styles.tablePanel, children: [_jsxs(react_native_1.View, { style: styles.header, children: [_jsxs(react_native_1.Text, { style: [styles.title, { color: colors.text }], children: ["Invite Codes (", codes.length, ")"] }), _jsxs(react_native_1.Pressable, { onPress: () => setShowCreate(true), style: styles.addBtn, children: [_jsx(lucide_react_native_1.Plus, { size: 14, color: "#fff" }), _jsx(react_native_1.Text, { style: styles.addBtnText, children: "New Code" })] })] }), _jsx(AdminTable_1.default, { columns: columns, data: codes, keyExtractor: (c) => c.code, selectedId: selectedCode?.code ?? null, onRowPress: (item) => setSelectedCode(item.code === selectedCode?.code ? null : item) })] }), selectedCode && (_jsx(AdminDetailPanel_1.default, { title: "Invite Code", onClose: () => setSelectedCode(null), children: renderDetailContent() })), _jsx(ConfirmDialog_1.default, { visible: confirmToggleVisible, title: selectedCode?.isActive ? 'Deactivate Code' : 'Activate Code', message: selectedCode?.isActive
                        ? `Deactivating "${selectedCode?.code}" will prevent new signups with this code. Existing users are unaffected.`
                        : `Reactivating "${selectedCode?.code}" will allow new signups with this code.`, confirmLabel: selectedCode?.isActive ? 'Deactivate' : 'Activate', onConfirm: handleToggle, onCancel: () => setConfirmToggleVisible(false) }), renderCreateForm()] }));
    }
    exports_1("default", InviteCodesTab);
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
                addBtn: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#E8862A',
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 8,
                    gap: 6,
                },
                addBtnText: { fontFamily: 'Inclusive Sans', fontSize: 13, color: '#fff' },
            });
            detailStyles = react_native_1.StyleSheet.create({
                header: { alignItems: 'center', marginBottom: 8 },
                iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
                codeName: { fontFamily: 'Inclusive Sans', fontSize: 16, marginTop: 8, letterSpacing: 0.5 },
                codeLabel: { fontFamily: 'Inclusive Sans', fontSize: 13, marginTop: 2 },
                actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
                actionBtn: { flex: 1, flexDirection: 'row', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
                actionBtnText: { fontFamily: 'Inclusive Sans', fontSize: 13 },
            });
            infoStyles = react_native_1.StyleSheet.create({
                row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
                iconBox: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
                text: { fontFamily: 'Inclusive Sans', fontSize: 13, flex: 1 },
            });
            createStyles = react_native_1.StyleSheet.create({
                overlay: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 100,
                },
                modal: {
                    width: 400,
                    borderRadius: 12,
                    borderWidth: 1,
                    padding: 20,
                },
                modalHeader: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                },
                modalTitle: { fontFamily: 'Inclusive Sans', fontSize: 16 },
                createBtn: {
                    backgroundColor: '#E8862A',
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginTop: 4,
                },
                createBtnText: { fontFamily: 'Inclusive Sans', fontSize: 14, color: '#fff' },
            });
        }
    };
});
