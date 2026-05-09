System.register(["react/jsx-runtime", "react", "react-native", "../components/contexts", "expo-router", "../components/admin/AdminSidebar", "../components/admin/CentersTab", "../components/admin/EventsTab", "../components/admin/UsersTab", "../components/admin/InviteCodesTab", "../components/admin/NotificationsTab", "../utils/admin"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, contexts_1, expo_router_1, AdminSidebar_1, CentersTab_1, EventsTab_1, UsersTab_1, InviteCodesTab_1, NotificationsTab_1, admin_1;
    var __moduleName = context_1 && context_1.id;
    function AdminPage() {
        const { user, loading } = contexts_1.useUser();
        const { isDark } = contexts_1.useTheme();
        const [activeTab, setActiveTab] = react_1.useState('Centers');
        // TODO: backend must enforce admin auth on all admin-specific endpoints
        const isAdmin = admin_1.isSuperAdmin(user);
        react_1.useEffect(() => {
            if (!loading && !isAdmin) {
                expo_router_1.router.replace('/(tabs)');
            }
        }, [loading, isAdmin]);
        if (!loading && !isAdmin) {
            return null;
        }
        if (loading) {
            return (_jsx(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#0d0d0d' : '#FAFAF9' }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: isDark ? '#666' : '#999' }, children: "Loading..." }) }));
        }
        const pageBg = isDark ? '#0d0d0d' : '#FAFAF9';
        return (_jsxs(react_native_1.View, { style: { flex: 1, flexDirection: 'row', backgroundColor: pageBg }, children: [_jsx(AdminSidebar_1.default, { activeTab: activeTab, onTabChange: setActiveTab }), activeTab === 'Centers' && _jsx(CentersTab_1.default, {}), activeTab === 'Events' && _jsx(EventsTab_1.default, {}), activeTab === 'Users' && _jsx(UsersTab_1.default, {}), activeTab === 'Invite Codes' && _jsx(InviteCodesTab_1.default, {}), activeTab === 'Notifications' && _jsx(NotificationsTab_1.default, {})] }));
    }
    exports_1("default", AdminPage);
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
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (AdminSidebar_1_1) {
                AdminSidebar_1 = AdminSidebar_1_1;
            },
            function (CentersTab_1_1) {
                CentersTab_1 = CentersTab_1_1;
            },
            function (EventsTab_1_1) {
                EventsTab_1 = EventsTab_1_1;
            },
            function (UsersTab_1_1) {
                UsersTab_1 = UsersTab_1_1;
            },
            function (InviteCodesTab_1_1) {
                InviteCodesTab_1 = InviteCodesTab_1_1;
            },
            function (NotificationsTab_1_1) {
                NotificationsTab_1 = NotificationsTab_1_1;
            },
            function (admin_1_1) {
                admin_1 = admin_1_1;
            }
        ],
        execute: function () {
        }
    };
});
