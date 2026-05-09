System.register(["react", "../src/config/api", "../utils/api", "../utils/addressParsing"], function (exports_1, context_1) {
    "use strict";
    var react_1, api_1, api_2, addressParsing_1, SAMPLE_CENTERS, SAMPLE_EVENTS, SAMPLE_EVENT_LIST, SAMPLE_ATTENDEES, SAMPLE_MESSAGES, SAMPLE_CENTER_DETAILS, SAMPLE_CENTER_EVENTS, CATEGORY_TO_INTEREST;
    var __moduleName = context_1 && context_1.id;
    // ── Helper: transform API EventData into EventDisplay ──────────────────
    function apiEventToDisplay(e, _username) {
        const parseDate = (dateStr) => {
            if (!dateStr)
                return null;
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? null : d;
        };
        const parsedDate = parseDate(e.date);
        const dateStr = parsedDate ? parsedDate.toISOString().split('T')[0] : '';
        const timeStr = parsedDate
            ? parsedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
            : '';
        const display = {
            id: e.eventID,
            title: e.title || e.description || 'Event',
            date: dateStr,
            time: timeStr,
            location: e.address || 'TBD',
            address: e.address ?? undefined,
            latitude: e.latitude,
            longitude: e.longitude,
            attendees: e.peopleAttending || 0,
            attendeesList: e.attendeesList,
            likes: 0,
            comments: 0,
            description: e.description || undefined,
            pointOfContact: e.pointOfContact ?? undefined,
            image: e.image ?? undefined,
            isRegistered: false, // Determined per-user at call site if needed
            centerId: e.centerID ?? undefined,
            createdBy: e.createdBy ?? undefined,
            category: e.category,
            externalUrl: e.externalUrl ?? null,
            signupUrl: e.signupUrl ?? null,
            allowJanataSignup: e.allowJanataSignup ?? false,
        };
        // If we have an image URL for the event, ensure it's absolute
        if (display.image && display.image.startsWith('/')) {
            display.image = `${api_1.API_BASE_URL}${display.image}`;
        }
        return display;
    }
    // ── Helper: fetch all events across centers in parallel ────────────────
    async function fetchAllEventsFromCenters(centers) {
        const results = await Promise.all(centers.map((c) => api_2.fetchEventsByCenter(c.centerID).catch(() => [])));
        return results.flat();
    }
    // ── Hooks ──────────────────────────────────────────────────────────────
    function useMapPoints() {
        const [points, setPoints] = react_1.useState([]);
        const [loading, setLoading] = react_1.useState(true);
        const [isLive, setIsLive] = react_1.useState(false);
        const [error, setError] = react_1.useState(null);
        react_1.useEffect(() => {
            let mounted = true;
            const load = async () => {
                try {
                    setError(null);
                    const centers = await api_2.fetchCenters();
                    if (!mounted)
                        return;
                    const centerPoints = api_2.centersToMapPoints(centers);
                    if (centerPoints.length > 0) {
                        const allEvents = await api_2.fetchAllEvents();
                        if (!mounted)
                            return;
                        const eventPoints = api_2.eventsToMapPoints(allEvents);
                        setPoints([...centerPoints, ...eventPoints]);
                        setIsLive(true);
                    }
                }
                catch (err) {
                    if (mounted) {
                        const message = err?.message || 'Failed to load map data';
                        setError(message);
                        if (__DEV__)
                            console.warn('[useMapPoints]', message);
                    }
                }
                finally {
                    if (mounted)
                        setLoading(false);
                }
            };
            load();
            return () => {
                mounted = false;
            };
        }, []);
        return { points, loading, isLive, error };
    }
    exports_1("useMapPoints", useMapPoints);
    function useEventList() {
        const [events, setEvents] = react_1.useState([]);
        const [loading, setLoading] = react_1.useState(true);
        const [isLive, setIsLive] = react_1.useState(false);
        const [error, setError] = react_1.useState(null);
        react_1.useEffect(() => {
            let mounted = true;
            const load = async () => {
                try {
                    setError(null);
                    const centers = await api_2.fetchCenters();
                    if (!mounted)
                        return;
                    const allApiEvents = await api_2.fetchAllEvents();
                    if (!mounted)
                        return;
                    const allEvents = allApiEvents.map((e) => apiEventToDisplay(e));
                    if (allEvents.length > 0) {
                        // Sort: registered first, then by date
                        allEvents.sort((a, b) => {
                            if (a.isRegistered !== b.isRegistered)
                                return a.isRegistered ? -1 : 1;
                            return a.date.localeCompare(b.date);
                        });
                        setEvents(allEvents);
                        setIsLive(true);
                    }
                }
                catch (err) {
                    if (mounted) {
                        const message = err?.message || 'Failed to load events';
                        setError(message);
                        if (__DEV__)
                            console.warn('[useEventList]', message);
                    }
                }
                finally {
                    if (mounted)
                        setLoading(false);
                }
            };
            load();
            return () => {
                mounted = false;
            };
        }, []);
        return { events, loading, isLive, error };
    }
    exports_1("useEventList", useEventList);
    function useEventDetail(eventId, username, userId) {
        const [event, setEvent] = react_1.useState(null);
        const [attendees, setAttendees] = react_1.useState([]);
        const [messages, setMessages] = react_1.useState([]);
        const [loading, setLoading] = react_1.useState(true);
        const [isLive, setIsLive] = react_1.useState(false);
        const [isToggling, setIsToggling] = react_1.useState(false);
        const [isRegistered, setIsRegistered] = react_1.useState(false);
        const [isCreator, setIsCreator] = react_1.useState(false);
        const [error, setError] = react_1.useState(null);
        react_1.useEffect(() => {
            let mounted = true;
            const load = async () => {
                try {
                    setError(null);
                    const apiEvent = await api_2.fetchEvent(eventId);
                    if (!mounted)
                        return;
                    if (apiEvent) {
                        // Check if user is the creator
                        const userIsCreator = !!(userId && apiEvent.createdBy === userId);
                        const display = apiEventToDisplay(apiEvent);
                        setEvent(display);
                        setIsCreator(userIsCreator);
                        setIsLive(true);
                        // Fetch attendees and check if current user is registered
                        const users = await api_2.fetchEventUsers(eventId);
                        if (mounted) {
                            setAttendees(users.map((u) => ({
                                name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.username,
                                subtitle: '',
                                image: u.profileImage ?? undefined,
                                initials: u.firstName
                                    ? `${u.firstName[0]}${u.lastName?.[0] || ''}`.toUpperCase()
                                    : u.username.slice(0, 2).toUpperCase(),
                            })));
                            // Check if current user is in attendees list
                            const userIsRegistered = userId ? users.some((u) => u.id === userId) : false;
                            setIsRegistered(userIsRegistered);
                            setEvent((prev) => (prev ? { ...prev, isRegistered: userIsRegistered } : null));
                        }
                    }
                }
                catch (err) {
                    if (mounted) {
                        const message = err?.message || 'Failed to load event details';
                        setError(message);
                        if (__DEV__)
                            console.warn('[useEventDetail]', message);
                    }
                }
                finally {
                    if (mounted)
                        setLoading(false);
                }
            };
            load();
            return () => {
                mounted = false;
            };
        }, [eventId, userId]);
        const toggleRegistration = react_1.useCallback(async (_username) => {
            if (!event)
                return;
            setIsToggling(true);
            try {
                // Check current registration status directly from API
                const users = await api_2.fetchEventUsers(eventId);
                const currentUserInAttendees = users.some((u) => u.id === userId);
                if (currentUserInAttendees) {
                    // Already registered - unattend
                    await api_2.unattendEvent(eventId);
                    setIsRegistered(false);
                    // Re-fetch attendees after unregistering
                    const updatedUsers = await api_2.fetchEventUsers(eventId);
                    const newAttendeesList = updatedUsers.map((u) => ({
                        name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.username,
                        image: u.profileImage || undefined,
                        initials: u.firstName
                            ? `${u.firstName[0]}${u.lastName?.[0] || ''}`.toUpperCase()
                            : u.username.slice(0, 2).toUpperCase(),
                    }));
                    setEvent((prev) => prev
                        ? {
                            ...prev,
                            isRegistered: false,
                            attendees: updatedUsers.length,
                            attendeesList: newAttendeesList.slice(0, 4),
                        }
                        : null);
                    // Also update attendees state
                    setAttendees(updatedUsers.map((u) => ({
                        name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.username,
                        subtitle: '',
                        image: u.profileImage ?? undefined,
                        initials: u.firstName
                            ? `${u.firstName[0]}${u.lastName?.[0] || ''}`.toUpperCase()
                            : u.username.slice(0, 2).toUpperCase(),
                    })));
                }
                else {
                    // Not registered - attend
                    await api_2.attendEvent(eventId);
                    setIsRegistered(true);
                    // Re-fetch attendees after registering
                    const updatedUsers = await api_2.fetchEventUsers(eventId);
                    const newAttendeesList = updatedUsers.map((u) => ({
                        name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.username,
                        image: u.profileImage || undefined,
                        initials: u.firstName
                            ? `${u.firstName[0]}${u.lastName?.[0] || ''}`.toUpperCase()
                            : u.username.slice(0, 2).toUpperCase(),
                    }));
                    setEvent((prev) => prev
                        ? {
                            ...prev,
                            isRegistered: true,
                            attendees: updatedUsers.length,
                            attendeesList: newAttendeesList.slice(0, 4),
                        }
                        : null);
                    // Also update attendees state
                    setAttendees(updatedUsers.map((u) => ({
                        name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.username,
                        subtitle: '',
                        image: u.profileImage ?? undefined,
                        initials: u.firstName
                            ? `${u.firstName[0]}${u.lastName?.[0] || ''}`.toUpperCase()
                            : u.username.slice(0, 2).toUpperCase(),
                    })));
                }
            }
            catch (error) {
                // If error says already registered, update UI
                if (error?.message?.includes('Already registered')) {
                    setIsRegistered(true);
                    setEvent((prev) => (prev ? { ...prev, isRegistered: true } : null));
                }
                throw error;
            }
            finally {
                setIsToggling(false);
            }
        }, [event, eventId, userId]);
        return {
            event,
            attendees,
            messages,
            loading,
            isLive,
            toggleRegistration,
            isToggling,
            isCreator,
            error,
        };
    }
    exports_1("useEventDetail", useEventDetail);
    function useWeekCalendar() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        const weekDates = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            return d.getDate();
        });
        const today = now.getDate();
        return { weekDays, weekDates, today };
    }
    exports_1("useWeekCalendar", useWeekCalendar);
    function useCenterDetail(centerId) {
        const [center, setCenter] = react_1.useState(null);
        const [events, setEvents] = react_1.useState([]);
        const [loading, setLoading] = react_1.useState(true);
        const [isLive, setIsLive] = react_1.useState(false);
        const [error, setError] = react_1.useState(null);
        react_1.useEffect(() => {
            if (!centerId) {
                setCenter(null);
                setEvents([]);
                setLoading(false);
                return;
            }
            let mounted = true;
            const load = async () => {
                try {
                    setError(null);
                    const [apiCenter, apiEvents] = await Promise.all([
                        api_2.fetchCenter(centerId),
                        api_2.fetchEventsByCenter(centerId),
                    ]);
                    if (!mounted)
                        return;
                    if (apiCenter) {
                        setCenter({
                            id: centerId,
                            name: apiCenter.name || 'Unknown Center',
                            image: apiCenter.image || '',
                            address: apiCenter.address || '',
                            website: apiCenter.website || '',
                            phone: apiCenter.phone || '',
                            upcomingEvents: apiEvents.length,
                            pointOfContact: apiCenter.pointOfContact || '',
                            acharya: apiCenter.acharya || '',
                            latitude: apiCenter.latitude,
                            longitude: apiCenter.longitude,
                            memberCount: apiCenter.memberCount ?? 0,
                            isVerified: apiCenter.isVerified ?? false,
                        });
                        setIsLive(true);
                    }
                    if (apiEvents.length > 0) {
                        setEvents(apiEvents.map((e) => apiEventToDisplay(e)));
                    }
                }
                catch (err) {
                    if (mounted) {
                        const message = err?.message || 'Failed to load center details';
                        setError(message);
                        if (__DEV__)
                            console.warn('[useCenterDetail]', message);
                    }
                }
                finally {
                    if (mounted)
                        setLoading(false);
                }
            };
            load();
            return () => {
                mounted = false;
            };
        }, [centerId]);
        return { center, events, loading, isLive, error };
    }
    exports_1("useCenterDetail", useCenterDetail);
    // ── My Events hook ──────────────────────────────────────────────────
    function useMyEvents(username) {
        const [events, setEvents] = react_1.useState([]);
        const [loading, setLoading] = react_1.useState(true);
        const [isLive, setIsLive] = react_1.useState(false);
        const [error, setError] = react_1.useState(null);
        const load = react_1.useCallback(async () => {
            if (!username) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                setError(null);
                const apiEvents = await api_2.getUserEvents(username);
                if (apiEvents.length > 0) {
                    setEvents(apiEvents.map((e) => ({
                        ...apiEventToDisplay(e, username),
                        isRegistered: true,
                    })));
                    setIsLive(true);
                }
            }
            catch (err) {
                const message = err?.message || 'Failed to load your events';
                setError(message);
                if (__DEV__)
                    console.warn('[useMyEvents]', message);
            }
            finally {
                setLoading(false);
            }
        }, [username]);
        react_1.useEffect(() => {
            load();
        }, [load]);
        return { events, loading, isLive, error, refetch: load };
    }
    exports_1("useMyEvents", useMyEvents);
    // ── Discover hooks ──────────────────────────────────────────────────
    function useCenterList() {
        const [centers, setCenters] = react_1.useState([]);
        const [loading, setLoading] = react_1.useState(true);
        const [isLive, setIsLive] = react_1.useState(false);
        const [error, setError] = react_1.useState(null);
        react_1.useEffect(() => {
            let mounted = true;
            const load = async () => {
                try {
                    setError(null);
                    const apiCenters = await api_2.fetchCenters();
                    if (!mounted)
                        return;
                    const discoverCenters = api_2.centersToDiscoverCenters(apiCenters);
                    if (discoverCenters.length > 0) {
                        setCenters(discoverCenters);
                        setIsLive(true);
                    }
                }
                catch (err) {
                    if (mounted) {
                        const message = err?.message || 'Failed to load centers';
                        setError(message);
                        if (__DEV__)
                            console.warn('[useCenterList]', message);
                    }
                }
                finally {
                    if (mounted)
                        setLoading(false);
                }
            };
            load();
            return () => {
                mounted = false;
            };
        }, []);
        return { centers, loading, isLive, error };
    }
    exports_1("useCenterList", useCenterList);
    // ── Center grouping helpers ──────────────────────────────────
    // extractCountryAndState: ../utils/addressParsing (US ST-ZIP, Canada vs CA ambiguity)
    function groupCenterItems(centers, userCenterID) {
        const groups = new Map();
        for (const center of centers) {
            const { country, state } = addressParsing_1.extractCountryAndState(center.address);
            // Single key: "State" for US, "State, Country" for international, "Other" for unknown
            let key;
            if (country === 'Other' || state === 'Unknown') {
                key = 'Other';
            }
            else if (country === 'United States') {
                key = state;
            }
            else {
                key = `${state}, ${country}`;
            }
            if (!groups.has(key))
                groups.set(key, []);
            groups.get(key).push(center);
        }
        // Find which group the user's center belongs to
        let userGroupKey = null;
        if (userCenterID) {
            const userCenter = centers.find((c) => c.id === userCenterID);
            if (userCenter) {
                const { country, state } = addressParsing_1.extractCountryAndState(userCenter.address);
                if (country === 'Other' || state === 'Unknown') {
                    userGroupKey = 'Other';
                }
                else if (country === 'United States') {
                    userGroupKey = state;
                }
                else {
                    userGroupKey = `${state}, ${country}`;
                }
            }
        }
        // Sort: user's group first, then US states alphabetically, then international
        // (keys containing a comma, e.g. "Alberta, Canada"), then "Other" last.
        const sortedKeys = [...groups.keys()].sort((a, b) => {
            if (userGroupKey) {
                if (a === userGroupKey)
                    return -1;
                if (b === userGroupKey)
                    return 1;
            }
            if (a === 'Other')
                return 1;
            if (b === 'Other')
                return -1;
            const aIntl = a.includes(',');
            const bIntl = b.includes(',');
            if (aIntl !== bIntl)
                return aIntl ? 1 : -1;
            return a.localeCompare(b);
        });
        const result = [];
        for (const key of sortedKeys) {
            const sectionCenters = groups.get(key);
            sectionCenters.sort((a, b) => {
                if (userCenterID) {
                    if (a.id === userCenterID)
                        return -1;
                    if (b.id === userCenterID)
                        return 1;
                }
                return a.name.localeCompare(b.name);
            });
            result.push({ type: 'section', data: { label: key } });
            for (const c of sectionCenters) {
                result.push({ type: 'center', data: c });
            }
        }
        return result;
    }
    function useDiscoverData(filter, searchQuery, userId, showPastEvents = false, showGoingOnly = false, userInterests, userCenterID) {
        const [allEvents, setAllEvents] = react_1.useState([]);
        const [allCenters, setAllCenters] = react_1.useState([]);
        const [loading, setLoading] = react_1.useState(true);
        const [isLive, setIsLive] = react_1.useState(false);
        const [error, setError] = react_1.useState(null);
        const refresh = react_1.useCallback(async () => {
            // Note: We don't set loading(true) here to avoid jarring UI flickers on focus
            try {
                const apiCenters = await api_2.fetchCenters();
                const discoverCenters = api_2.centersToDiscoverCenters(apiCenters);
                if (discoverCenters.length > 0) {
                    setAllCenters(discoverCenters);
                }
                const allApiEvents = await api_2.fetchAllEvents();
                const eventsWithAttendees = await Promise.all(allApiEvents.map(async (e) => {
                    const users = await api_2.fetchEventUsers(e.eventID);
                    const attendeesList = users.map((u) => ({
                        name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.username,
                        image: u.profileImage || undefined,
                        initials: u.firstName
                            ? `${u.firstName[0]}${u.lastName?.[0] || ''}`.toUpperCase()
                            : u.username.slice(0, 2).toUpperCase(),
                    }));
                    const userIsRegistered = userId ? users.some((u) => u.id === userId) : false;
                    return {
                        ...e,
                        attendeesList: attendeesList.slice(0, 4),
                        isRegistered: userIsRegistered,
                        peopleAttending: users.length,
                    };
                }));
                const fetchedEvents = eventsWithAttendees.map((e) => {
                    const display = apiEventToDisplay(e);
                    display.attendeesList = e.attendeesList;
                    display.isRegistered = e.isRegistered;
                    display.attendees = e.peopleAttending;
                    return display;
                });
                if (fetchedEvents.length > 0) {
                    setAllEvents(fetchedEvents);
                    setIsLive(true);
                }
            }
            catch (err) {
                const message = err?.message || 'Failed to refresh discover data';
                setError(message);
            }
            finally {
                setLoading(false);
            }
        }, [userId]);
        react_1.useEffect(() => {
            refresh();
        }, [refresh]);
        const items = react_1.useMemo(() => {
            const query = searchQuery.toLowerCase().trim();
            const todayStr = new Date().toISOString().split('T')[0];
            // Filter out past events unless showPastEvents is enabled
            const visibleEvents = showPastEvents
                ? allEvents
                : allEvents.filter((e) => !e.date || e.date >= todayStr);
            // Filter events by user interests if set
            const filteredEvents = userInterests && userInterests.length > 0
                ? visibleEvents.filter((e) => {
                    if (e.category == null)
                        return true;
                    const interestName = CATEGORY_TO_INTEREST[e.category];
                    return !interestName || userInterests.includes(interestName);
                })
                : visibleEvents;
            let result = [];
            if (filter === 'Centers') {
                result = groupCenterItems(allCenters, userCenterID);
            }
            else {
                const eventsToShow = showGoingOnly
                    ? filteredEvents.filter((e) => e.isRegistered)
                    : filteredEvents;
                const sortByDate = (a, b) => b.date.localeCompare(a.date);
                const registered = eventsToShow.filter((e) => e.isRegistered).sort(sortByDate);
                const unregistered = eventsToShow.filter((e) => !e.isRegistered).sort(sortByDate);
                result = [
                    ...registered.map((e) => ({ type: 'event', data: e })),
                    ...unregistered.map((e) => ({ type: 'event', data: e })),
                ];
            }
            // Apply search query
            if (query) {
                if (filter === 'Centers') {
                    const matchingCenters = allCenters.filter((c) => c.name.toLowerCase().includes(query) ||
                        (c.address?.toLowerCase().includes(query) ?? false));
                    result = groupCenterItems(matchingCenters, userCenterID);
                }
                else {
                    result = result.filter((item) => {
                        if (item.type === 'event') {
                            return (item.data.title.toLowerCase().includes(query) ||
                                item.data.location.toLowerCase().includes(query));
                        }
                        if (item.type === 'center') {
                            return (item.data.name.toLowerCase().includes(query) ||
                                (item.data.address?.toLowerCase().includes(query) ?? false));
                        }
                        return false;
                    });
                }
            }
            return result;
        }, [allEvents, allCenters, filter, searchQuery, showPastEvents, showGoingOnly, userInterests, userCenterID]);
        // Map points from current data
        const filteredPoints = react_1.useMemo(() => {
            const centerPoints = allCenters.map((c) => ({
                id: c.id,
                type: 'center',
                name: c.name,
                latitude: c.latitude,
                longitude: c.longitude,
            }));
            const eventPoints = allEvents
                .filter((e) => e.latitude != null && e.longitude != null)
                .map((e) => ({
                id: e.id,
                type: 'event',
                name: e.title,
                latitude: e.latitude,
                longitude: e.longitude,
            }));
            const allPoints = [...centerPoints, ...eventPoints];
            if (filter === 'Centers') {
                return allPoints.filter((p) => p.type === 'center');
            }
            return allPoints;
        }, [allCenters, allEvents, filter]);
        const updateEventStatus = react_1.useCallback((eventId, isRegistered, attendeesCount, attendeesList) => {
            setAllEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, isRegistered, attendees: attendeesCount, attendeesList } : e));
        }, []);
        return {
            items,
            filteredPoints,
            loading,
            isLive,
            error,
            allEvents,
            allCenters,
            refresh,
            updateEventStatus,
        };
    }
    exports_1("useDiscoverData", useDiscoverData);
    return {
        setters: [
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (api_1_1) {
                api_1 = api_1_1;
            },
            function (api_2_1) {
                api_2 = api_2_1;
            },
            function (addressParsing_1_1) {
                addressParsing_1 = addressParsing_1_1;
            }
        ],
        execute: function () {
            // ── Sample data (empty since we fetch from API) ────────────
            SAMPLE_CENTERS = [];
            SAMPLE_EVENTS = [];
            SAMPLE_EVENT_LIST = [];
            SAMPLE_ATTENDEES = [];
            exports_1("SAMPLE_ATTENDEES", SAMPLE_ATTENDEES);
            SAMPLE_MESSAGES = [];
            exports_1("SAMPLE_MESSAGES", SAMPLE_MESSAGES);
            SAMPLE_CENTER_DETAILS = {};
            SAMPLE_CENTER_EVENTS = [];
            // Maps event category IDs to user interest strings
            CATEGORY_TO_INTEREST = {
                91: 'Satsangs',
                92: 'Bhiksha',
            };
        }
    };
});
