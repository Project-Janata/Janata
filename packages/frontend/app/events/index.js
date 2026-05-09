System.register(["react/jsx-runtime", "react", "react-native", "expo-router", "lucide-react-native", "../../components/contexts", "../../hooks/useApiData", "../../components/ui", "posthog-react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, expo_router_1, lucide_react_native_1, contexts_1, useApiData_1, ui_1, posthog_react_native_1;
    var __moduleName = context_1 && context_1.id;
    function EventsListPage() {
        const router = expo_router_1.useRouter();
        const { user } = contexts_1.useUser();
        const { events, loading, refetch } = useApiData_1.useMyEvents(user?.username);
        const [refreshing, setRefreshing] = react_1.default.useState(false);
        const posthog = posthog_react_native_1.usePostHog();
        react_1.useEffect(() => {
            posthog?.capture('event_list_viewed');
        }, []);
        const handleRefresh = async () => {
            setRefreshing(true);
            await refetch();
            setRefreshing(false);
        };
        const handleEventPress = (event) => {
            posthog?.capture('event_list_item_pressed', { eventId: event.id });
            router.push(`/events/${event.id}`);
        };
        if (loading && !refreshing) {
            return (_jsx(react_native_1.View, { className: "flex-1 justify-center items-center bg-background dark:bg-background-dark", children: _jsx(react_native_1.ActivityIndicator, { size: "large", color: "#ea580c" }) }));
        }
        return (_jsx(react_native_1.ScrollView, { className: "flex-1 bg-background dark:bg-background-dark", refreshControl: _jsx(react_native_1.RefreshControl, { refreshing: refreshing, onRefresh: handleRefresh }), children: _jsxs(react_native_1.View, { className: "px-4 pt-4 pb-8 gap-4", children: [_jsx(react_native_1.Text, { className: "text-content dark:text-content-dark font-sans text-2xl font-bold", children: "My Events" }), events.length > 0 ? (_jsx(react_native_1.View, { className: "gap-3", children: events.map((event) => (_jsx(ui_1.Card, { pressable: true, onPress: () => handleEventPress(event), padding: "sm", children: _jsxs(react_native_1.View, { className: "gap-2", children: [_jsx(react_native_1.Text, { className: "font-sans text-sm text-primary font-medium", children: event.time }), _jsx(react_native_1.Text, { className: "text-content dark:text-content-dark font-sans text-sm", children: event.location }), _jsx(react_native_1.Text, { className: "text-content dark:text-content-dark font-sans text-lg font-semibold leading-tight", children: event.title }), _jsxs(react_native_1.Text, { className: "text-content dark:text-content-dark text-sm mt-1", children: [event.attendees, " ", event.attendees === 1 ? 'person' : 'people'] })] }) }, event.id))) })) : (_jsxs(react_native_1.View, { className: "items-center py-16 gap-4", children: [_jsx(lucide_react_native_1.Calendar, { size: 48, color: "#a1a1aa" }), _jsx(react_native_1.Text, { className: "text-lg text-contentStrong dark:text-contentStrong-dark font-sans", children: "No events yet" }), _jsx(react_native_1.Text, { className: "text-sm text-contentStrong dark:text-contentStrong-dark font-sans text-center px-8", children: "Events you register for will appear here" })] }))] }) }));
    }
    exports_1("default", EventsListPage);
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
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (useApiData_1_1) {
                useApiData_1 = useApiData_1_1;
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            },
            function (posthog_react_native_1_1) {
                posthog_react_native_1 = posthog_react_native_1_1;
            }
        ],
        execute: function () {
        }
    };
});
