System.register(["react/jsx-runtime", "react", "react-native", "lucide-react-native", "./AdminTable", "./AdminDetailPanel", "./AdminSearchInput", "./AdminInfoRow", "./AdminSectionHeader", "./AdminUserRow", "./ConfirmDialog", "../../utils/api", "../../hooks/useDetailColors", "../contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, lucide_react_native_1, AdminTable_1, AdminDetailPanel_1, AdminSearchInput_1, AdminInfoRow_1, AdminSectionHeader_1, AdminUserRow_1, ConfirmDialog_1, api_1, useDetailColors_1, contexts_1;
    var __moduleName = context_1 && context_1.id;
    function CentersTab() {
        const colors = useDetailColors_1.useDetailColors();
        const { isDark } = contexts_1.useTheme();
        const [search, setSearch] = react_1.useState('');
        const [centers, setCenters] = react_1.useState([]);
        const [total, setTotal] = react_1.useState(0);
        const [loading, setLoading] = react_1.useState(true);
        const [selectedId, setSelectedId] = react_1.useState(null);
        const [deleteTarget, setDeleteTarget] = react_1.useState(null);
        const [members, setMembers] = react_1.useState([]);
        const [membersLoading, setMembersLoading] = react_1.useState(false);
        const [error, setError] = react_1.useState(null);
        const [editing, setEditing] = react_1.useState(false);
        const [saving, setSaving] = react_1.useState(false);
        const [saveError, setSaveError] = react_1.useState(null);
        const [form, setForm] = react_1.useState({
            image: '',
            address: '',
            website: '',
            phone: '',
            acharya: '',
            pointOfContact: '',
        });
        const loadCenters = react_1.useCallback(async (q) => {
            try {
                setLoading(true);
                setError(null);
                const result = await api_1.fetchAdminCenters({ q: q || undefined, limit: 100 });
                setCenters(result.data);
                setTotal(result.total);
            }
            catch (err) {
                console.error('Failed to load centers:', err);
                setError(err?.message || 'Failed to load centers. Are you logged in?');
            }
            finally {
                setLoading(false);
            }
        }, []);
        react_1.useEffect(() => {
            loadCenters();
        }, [loadCenters]);
        // Debounced search
        react_1.useEffect(() => {
            const timer = setTimeout(() => {
                loadCenters(search);
            }, 300);
            return () => clearTimeout(timer);
        }, [search, loadCenters]);
        const selected = react_1.useMemo(() => centers.find((c) => c.centerID === selectedId) ?? null, [selectedId, centers]);
        // Load members when a center is selected
        react_1.useEffect(() => {
            if (!selected) {
                setMembers([]);
                return;
            }
            let cancelled = false;
            setMembersLoading(true);
            api_1.fetchAdminCenterMembers(selected.centerID)
                .then((data) => {
                if (!cancelled)
                    setMembers(data);
            })
                .catch(() => {
                if (!cancelled)
                    setMembers([]);
            })
                .finally(() => {
                if (!cancelled)
                    setMembersLoading(false);
            });
            return () => { cancelled = true; };
        }, [selected]);
        const renderStatus = (isVerified) => {
            const bg = isVerified
                ? isDark ? 'rgba(22,101,52,0.3)' : '#ECFDF5'
                : isDark ? 'rgba(113,63,18,0.3)' : '#FFFBEB';
            const textColor = isVerified
                ? isDark ? '#4ade80' : '#059669'
                : isDark ? '#fbbf24' : '#D97706';
            return (_jsx(react_native_1.View, { style: { alignSelf: 'flex-start', backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 10, color: textColor }, children: isVerified ? 'Verified' : 'Pending' }) }));
        };
        // Reset edit state whenever the selection changes.
        react_1.useEffect(() => {
            setEditing(false);
            setSaveError(null);
            if (selected) {
                setForm({
                    image: selected.image ?? '',
                    address: selected.address ?? '',
                    website: selected.website ?? '',
                    phone: selected.phone ?? '',
                    acharya: selected.acharya ?? '',
                    pointOfContact: selected.pointOfContact ?? '',
                });
            }
        }, [selected]);
        const handleSave = async () => {
            if (!selected)
                return;
            setSaving(true);
            setSaveError(null);
            try {
                await api_1.adminUpdateCenter(selected.centerID, {
                    image: form.image.trim() || null,
                    address: form.address.trim() || null,
                    website: form.website.trim() || null,
                    phone: form.phone.trim() || null,
                    acharya: form.acharya.trim() || null,
                    pointOfContact: form.pointOfContact.trim() || null,
                });
                await loadCenters(search);
                setEditing(false);
            }
            catch (err) {
                setSaveError(err?.message || 'Failed to save');
            }
            finally {
                setSaving(false);
            }
        };
        const handleVerify = async () => {
            if (!selected)
                return;
            try {
                await api_1.adminVerifyCenter(selected.centerID);
                loadCenters(search);
            }
            catch (err) {
                console.error('Failed to toggle verification:', err);
            }
        };
        const handleDelete = async () => {
            if (!deleteTarget)
                return;
            try {
                await api_1.adminDeleteCenter(deleteTarget.centerID);
                setDeleteTarget(null);
                setSelectedId(null);
                loadCenters(search);
            }
            catch (err) {
                console.error('Failed to delete center:', err);
            }
        };
        const columns = [
            {
                key: 'name',
                header: 'Name',
                flex: 2,
                render: (item) => (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text }, numberOfLines: 1, children: item.name })),
            },
            {
                key: 'address',
                header: 'Address',
                flex: 2,
                render: (item) => (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }, numberOfLines: 1, children: item.address || '\u2014' })),
            },
            {
                key: 'members',
                header: 'Members',
                flex: 1,
                render: (item) => (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }, children: item.memberCount })),
            },
            {
                key: 'status',
                header: 'Status',
                flex: 1,
                render: (item) => renderStatus(item.isVerified),
            },
        ];
        if (loading && centers.length === 0) {
            return (_jsx(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center' }, children: _jsx(react_native_1.ActivityIndicator, { color: "#E8862A" }) }));
        }
        if (error && centers.length === 0) {
            return (_jsxs(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: '#DC2626', textAlign: 'center' }, children: error }), _jsx(react_native_1.Pressable, { onPress: () => loadCenters(), style: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E8862A', borderRadius: 8 }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: '#fff' }, children: "Retry" }) })] }));
        }
        return (_jsxs(react_native_1.View, { style: { flex: 1, flexDirection: 'row' }, children: [_jsxs(react_native_1.View, { style: { flex: 1, padding: 20 }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 18, color: colors.text }, children: ["Centers (", total, ")"] }), _jsx(react_native_1.View, { style: { width: 260 }, children: _jsx(AdminSearchInput_1.default, { value: search, onChangeText: setSearch, placeholder: "Search centers..." }) })] }), _jsx(AdminTable_1.default, { columns: columns, data: centers, keyExtractor: (item) => item.centerID, selectedId: selectedId, onRowPress: (item) => setSelectedId(item.centerID === selectedId ? null : item.centerID) })] }), selected && (_jsxs(AdminDetailPanel_1.default, { title: selected.name, onClose: () => setSelectedId(null), children: [editing ? (_jsxs(react_native_1.View, { style: { gap: 10 }, children: [_jsx(EditField, { icon: _jsx(lucide_react_native_1.Image, { size: 14, color: colors.textMuted }), label: "Image URL", value: form.image, onChangeText: (v) => setForm((f) => ({ ...f, image: v })), placeholder: "https://...", colors: colors }), _jsx(EditField, { icon: _jsx(lucide_react_native_1.MapPin, { size: 14, color: colors.textMuted }), label: "Address", value: form.address, onChangeText: (v) => setForm((f) => ({ ...f, address: v })), placeholder: "Street, City, ST - ZIP, Country", colors: colors }), _jsx(EditField, { icon: _jsx(lucide_react_native_1.Globe, { size: 14, color: colors.textMuted }), label: "Website", value: form.website, onChangeText: (v) => setForm((f) => ({ ...f, website: v })), placeholder: "example.org", colors: colors }), _jsx(EditField, { icon: _jsx(lucide_react_native_1.Phone, { size: 14, color: colors.textMuted }), label: "Phone", value: form.phone, onChangeText: (v) => setForm((f) => ({ ...f, phone: v })), placeholder: "555-123-4567", colors: colors }), _jsx(EditField, { icon: _jsx(lucide_react_native_1.User, { size: 14, color: colors.textMuted }), label: "Acharya", value: form.acharya, onChangeText: (v) => setForm((f) => ({ ...f, acharya: v })), placeholder: "Resident acharya", colors: colors }), _jsx(EditField, { icon: _jsx(lucide_react_native_1.User, { size: 14, color: colors.textMuted }), label: "Point of contact", value: form.pointOfContact, onChangeText: (v) => setForm((f) => ({ ...f, pointOfContact: v })), placeholder: "Name", colors: colors }), saveError && (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: '#DC2626' }, children: saveError })), _jsxs(react_native_1.View, { style: { flexDirection: 'row', gap: 8, marginTop: 4 }, children: [_jsx(react_native_1.Pressable, { onPress: handleSave, disabled: saving, style: { backgroundColor: '#E8862A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, opacity: saving ? 0.6 : 1 }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: '#fff' }, children: saving ? 'Saving…' : 'Save' }) }), _jsx(react_native_1.Pressable, { onPress: () => { setEditing(false); setSaveError(null); }, disabled: saving, style: { backgroundColor: colors.iconBoxBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.text }, children: "Cancel" }) })] })] })) : (_jsxs(_Fragment, { children: [_jsxs(react_native_1.View, { style: { gap: 12 }, children: [selected.address && (_jsx(AdminInfoRow_1.default, { icon: _jsx(lucide_react_native_1.MapPin, { size: 14, color: colors.textMuted }), text: selected.address, colors: colors })), selected.website && (_jsx(AdminInfoRow_1.default, { icon: _jsx(lucide_react_native_1.Globe, { size: 14, color: colors.textMuted }), text: selected.website, colors: colors })), selected.phone && (_jsx(AdminInfoRow_1.default, { icon: _jsx(lucide_react_native_1.Phone, { size: 14, color: colors.textMuted }), text: selected.phone, colors: colors })), selected.acharya && (_jsx(AdminInfoRow_1.default, { icon: _jsx(lucide_react_native_1.User, { size: 14, color: colors.textMuted }), text: selected.acharya, colors: colors }))] }), _jsx(react_native_1.View, { style: { marginTop: 16 }, children: renderStatus(selected.isVerified) }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', gap: 8, marginTop: 16 }, children: [_jsxs(react_native_1.Pressable, { onPress: () => setEditing(true), style: { backgroundColor: '#E8862A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }, children: [_jsx(lucide_react_native_1.Pencil, { size: 12, color: "#fff" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: '#fff' }, children: "Edit" })] }), _jsx(react_native_1.Pressable, { onPress: handleVerify, style: { backgroundColor: colors.iconBoxBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.text }, children: selected.isVerified ? 'Unverify' : 'Verify' }) }), _jsx(react_native_1.Pressable, { onPress: () => setDeleteTarget(selected), style: { backgroundColor: colors.iconBoxBg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: isDark ? '#F87171' : '#DC2626' }, children: "Delete" }) })] })] })), _jsx(AdminSectionHeader_1.default, { label: "Members", colors: colors }), membersLoading ? (_jsx(react_native_1.ActivityIndicator, { size: "small", color: "#E8862A" })) : members.length === 0 ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textMuted }, children: "No members" })) : (members.map((u) => (_jsx(AdminUserRow_1.default, { name: `${u.firstName} ${u.lastName}`, image: u.profileImage, colors: colors, isDark: isDark }, u.id))))] })), _jsx(ConfirmDialog_1.default, { visible: deleteTarget !== null, title: "Delete Center", message: `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`, confirmLabel: "Delete", onConfirm: handleDelete, onCancel: () => setDeleteTarget(null) })] }));
    }
    exports_1("default", CentersTab);
    function EditField({ icon, label, value, onChangeText, placeholder, colors }) {
        return (_jsxs(react_native_1.View, { style: { gap: 4 }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 6 }, children: [icon, _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }, children: label })] }), _jsx(react_native_1.TextInput, { value: value, onChangeText: onChangeText, placeholder: placeholder, placeholderTextColor: colors.textMuted, style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: 13,
                        color: colors.text,
                        backgroundColor: colors.iconBoxBg,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderRadius: 6,
                    }, autoCapitalize: "none", autoCorrect: false })] }));
    }
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
            function (AdminSectionHeader_1_1) {
                AdminSectionHeader_1 = AdminSectionHeader_1_1;
            },
            function (AdminUserRow_1_1) {
                AdminUserRow_1 = AdminUserRow_1_1;
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
        }
    };
});
