System.register(["../components/utils/tokenStorage", "../src/config/api"], function (exports_1, context_1) {
    "use strict";
    var tokenStorage_1, api_1, API_URL, _centersPromise, _centersTimestamp, CENTERS_CACHE_TTL, DISCOVER_SAMPLE_EVENTS, DISCOVER_SAMPLE_CENTERS;
    var __moduleName = context_1 && context_1.id;
    // ── Fetch helpers ──────────────────────────────────────────────────────
    async function apiFetch(endpoint, options = {}, retries = 2) {
        let lastError;
        for (let attempt = 0; attempt <= retries; attempt++) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            try {
                const response = await fetch(`${API_URL}${endpoint}`, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers,
                    },
                    signal: controller.signal,
                });
                clearTimeout(timeoutId);
                return response;
            }
            catch (error) {
                clearTimeout(timeoutId);
                lastError = error;
                if (error.name === 'AbortError' && attempt === 0) {
                    throw new Error('Request timeout');
                }
                if (attempt < retries) {
                    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
                }
            }
        }
        throw lastError || new Error('Network request failed');
    }
    async function authFetch(endpoint, options = {}) {
        const token = await tokenStorage_1.getStoredToken();
        return apiFetch(endpoint, {
            ...options,
            headers: {
                ...options.headers,
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });
    }
    async function fetchCenters() {
        const now = Date.now();
        // Return cached promise if still fresh
        if (_centersPromise && now - _centersTimestamp < CENTERS_CACHE_TTL) {
            return _centersPromise;
        }
        _centersTimestamp = now;
        _centersPromise = (async () => {
            try {
                const response = await apiFetch('/centers');
                if (!response.ok) {
                    return [];
                }
                const data = await response.json();
                return data.centers || [];
            }
            catch (err) {
                if (__DEV__)
                    console.warn('[fetchCenters]', err?.message || err);
                _centersPromise = null; // Clear on error so next call retries
                return [];
            }
        })();
        return _centersPromise;
    }
    exports_1("fetchCenters", fetchCenters);
    /** Invalidate the centers cache (e.g. after adding a center) */
    function invalidateCentersCache() {
        _centersPromise = null;
        _centersTimestamp = 0;
    }
    exports_1("invalidateCentersCache", invalidateCentersCache);
    // ── API methods ────────────────────────────────────────────────────────
    async function fetchCenter(centerID) {
        try {
            const response = await apiFetch('/fetchCenter', {
                method: 'POST',
                body: JSON.stringify({ centerID }),
            });
            if (!response.ok)
                return null;
            const data = await response.json();
            return data.center || null;
        }
        catch (err) {
            if (__DEV__)
                console.warn('[fetchCenter]', err?.message || err);
            return null;
        }
    }
    exports_1("fetchCenter", fetchCenter);
    async function fetchEvent(eventID) {
        try {
            const response = await apiFetch('/fetchEvent', {
                method: 'POST',
                body: JSON.stringify({ id: eventID }),
            });
            if (!response.ok)
                return null;
            const data = await response.json();
            const event = data.event;
            if (event && event.image && event.image.startsWith('/')) {
                event.image = `${api_1.API_BASE_URL}${event.image}`;
            }
            return event;
        }
        catch (err) {
            if (__DEV__)
                console.warn('[fetchEvent]', err?.message || err);
            return null;
        }
    }
    exports_1("fetchEvent", fetchEvent);
    async function fetchEventsByCenter(centerID) {
        try {
            const response = await apiFetch('/fetchEventsByCenter', {
                method: 'POST',
                body: JSON.stringify({ centerID }),
            });
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.events || [];
        }
        catch (err) {
            if (__DEV__)
                console.warn('[fetchEventsByCenter]', err?.message || err);
            return [];
        }
    }
    exports_1("fetchEventsByCenter", fetchEventsByCenter);
    async function fetchAllEvents() {
        try {
            const response = await apiFetch('/fetchAllEvents');
            if (!response.ok) {
                return [];
            }
            const data = await response.json();
            const events = (data.events || []);
            return events.map((e) => {
                if (e.image && e.image.startsWith('/')) {
                    return { ...e, image: `${api_1.API_BASE_URL}${e.image}` };
                }
                return e;
            });
        }
        catch (err) {
            if (__DEV__)
                console.warn('[fetchAllEvents]', err?.message || err);
            return [];
        }
    }
    exports_1("fetchAllEvents", fetchAllEvents);
    async function fetchEventUsers(eventID) {
        try {
            const response = await apiFetch('/getEventUsers', {
                method: 'POST',
                body: JSON.stringify({ id: eventID }),
            });
            if (!response.ok)
                return [];
            const data = await response.json();
            const users = (data.users || []);
            // Normalize profile images
            return users.map((u) => {
                if (u.profileImage && u.profileImage.startsWith('/')) {
                    return {
                        ...u,
                        profileImage: `${api_1.API_BASE_URL}${u.profileImage}`,
                    };
                }
                return u;
            });
        }
        catch (err) {
            if (__DEV__)
                console.warn('[fetchEventUsers]', err?.message || err);
            return [];
        }
    }
    exports_1("fetchEventUsers", fetchEventUsers);
    async function attendEvent(eventID) {
        const response = await authFetch('/attendEvent', {
            method: 'POST',
            body: JSON.stringify({ eventID }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Failed to attend event' }));
            throw new Error(err.message || 'Failed to attend event');
        }
        return response.json();
    }
    exports_1("attendEvent", attendEvent);
    async function unattendEvent(eventID) {
        const response = await authFetch('/unattendEvent', {
            method: 'POST',
            body: JSON.stringify({ eventID }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Failed to unattend event' }));
            throw new Error(err.message || 'Failed to unattend event');
        }
        return response.json();
    }
    exports_1("unattendEvent", unattendEvent);
    async function createEvent(data) {
        const response = await authFetch('/addEvent', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Failed to create event' }));
            throw new Error(err.message || 'Failed to create event');
        }
        return response.json();
    }
    exports_1("createEvent", createEvent);
    async function updateEvent(eventJSON) {
        const response = await authFetch('/updateEvent', {
            method: 'POST',
            body: JSON.stringify({ eventJSON }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Failed to update event' }));
            throw new Error(err.message || 'Failed to update event');
        }
        return response.json();
    }
    exports_1("updateEvent", updateEvent);
    async function removeEvent(id) {
        const response = await authFetch('/removeEvent', {
            method: 'POST',
            body: JSON.stringify({ id }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Failed to delete event' }));
            throw new Error(err.message || 'Failed to delete event');
        }
    }
    exports_1("removeEvent", removeEvent);
    async function getUserEvents(username) {
        try {
            const response = await authFetch('/getUserEvents', {
                method: 'POST',
                body: JSON.stringify({ username }),
            });
            if (!response.ok) {
                return [];
            }
            const data = await response.json();
            return data.events || [];
        }
        catch (err) {
            if (__DEV__)
                console.warn('[getUserEvents]', err?.message || err);
            return [];
        }
    }
    exports_1("getUserEvents", getUserEvents);
    // ── Data normalization (flat fields) ──────────────────────────────────
    function centersToMapPoints(centers) {
        return centers
            .filter((c) => c.latitude != null && c.longitude != null)
            .map((c) => ({
            id: c.centerID,
            type: 'center',
            name: c.name || 'Unknown Center',
            latitude: c.latitude,
            longitude: c.longitude,
        }));
    }
    exports_1("centersToMapPoints", centersToMapPoints);
    function eventsToMapPoints(events) {
        return events
            .filter((e) => e.latitude != null && e.longitude != null)
            .map((e) => ({
            id: e.eventID,
            type: 'event',
            name: e.title || e.description || 'Event',
            latitude: e.latitude,
            longitude: e.longitude,
        }));
    }
    exports_1("eventsToMapPoints", eventsToMapPoints);
    function centersToDiscoverCenters(centers) {
        return centers
            .filter((c) => c.latitude != null && c.longitude != null)
            .map((c) => ({
            id: c.centerID,
            name: c.name || 'Unknown Center',
            address: c.address ?? undefined,
            latitude: c.latitude,
            longitude: c.longitude,
            memberCount: c.memberCount,
            image: c.image && c.image.startsWith('/') ? `${api_1.API_BASE_URL}${c.image}` : c.image ?? null,
        }));
    }
    exports_1("centersToDiscoverCenters", centersToDiscoverCenters);
    async function fetchAdminStats() {
        const response = await authFetch('/admin/stats');
        if (!response.ok)
            throw new Error('Failed to fetch admin stats');
        return response.json();
    }
    exports_1("fetchAdminStats", fetchAdminStats);
    async function fetchAdminUsers(params) {
        const searchParams = new URLSearchParams();
        if (params?.q)
            searchParams.set('q', params.q);
        if (params?.limit)
            searchParams.set('limit', String(params.limit));
        if (params?.offset)
            searchParams.set('offset', String(params.offset));
        const qs = searchParams.toString();
        const response = await authFetch(`/admin/users${qs ? `?${qs}` : ''}`);
        if (!response.ok)
            throw new Error('Failed to fetch admin users');
        return response.json();
    }
    exports_1("fetchAdminUsers", fetchAdminUsers);
    async function fetchAdminCenters(params) {
        const searchParams = new URLSearchParams();
        if (params?.q)
            searchParams.set('q', params.q);
        if (params?.limit)
            searchParams.set('limit', String(params.limit));
        if (params?.offset)
            searchParams.set('offset', String(params.offset));
        const qs = searchParams.toString();
        const response = await authFetch(`/admin/centers${qs ? `?${qs}` : ''}`);
        if (!response.ok)
            throw new Error('Failed to fetch admin centers');
        return response.json();
    }
    exports_1("fetchAdminCenters", fetchAdminCenters);
    async function fetchAdminEvents(params) {
        const searchParams = new URLSearchParams();
        if (params?.q)
            searchParams.set('q', params.q);
        if (params?.limit)
            searchParams.set('limit', String(params.limit));
        if (params?.offset)
            searchParams.set('offset', String(params.offset));
        const qs = searchParams.toString();
        const response = await authFetch(`/admin/events${qs ? `?${qs}` : ''}`);
        if (!response.ok)
            throw new Error('Failed to fetch admin events');
        return response.json();
    }
    exports_1("fetchAdminEvents", fetchAdminEvents);
    async function fetchAdminCenterMembers(centerId) {
        const response = await authFetch(`/admin/centers/${centerId}/members`);
        if (!response.ok)
            throw new Error('Failed to fetch center members');
        const data = await response.json();
        return data.data;
    }
    exports_1("fetchAdminCenterMembers", fetchAdminCenterMembers);
    async function adminVerifyUser(userId, opts) {
        const response = await authFetch(`/admin/users/${userId}/verify`, {
            method: 'POST',
            body: JSON.stringify(opts),
        });
        if (!response.ok)
            throw new Error('Failed to update user verification');
        return response.json();
    }
    exports_1("adminVerifyUser", adminVerifyUser);
    async function adminDeleteUser(userId) {
        const response = await authFetch(`/admin/users/${userId}`, { method: 'DELETE' });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Failed to delete user' }));
            throw new Error(err.message);
        }
    }
    exports_1("adminDeleteUser", adminDeleteUser);
    async function adminUpdateCenter(centerId, updates) {
        const response = await authFetch(`/admin/centers/${centerId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
        if (!response.ok)
            throw new Error('Failed to update center');
    }
    exports_1("adminUpdateCenter", adminUpdateCenter);
    async function adminVerifyCenter(centerId) {
        const response = await authFetch(`/admin/centers/${centerId}/verify`, {
            method: 'POST',
            body: '{}',
        });
        if (!response.ok)
            throw new Error('Failed to toggle center verification');
    }
    exports_1("adminVerifyCenter", adminVerifyCenter);
    async function adminDeleteCenter(centerId) {
        const response = await authFetch(`/admin/centers/${centerId}`, { method: 'DELETE' });
        if (!response.ok)
            throw new Error('Failed to delete center');
    }
    exports_1("adminDeleteCenter", adminDeleteCenter);
    async function adminUpdateEvent(eventId, updates) {
        const response = await authFetch(`/admin/events/${eventId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
        if (!response.ok)
            throw new Error('Failed to update event');
    }
    exports_1("adminUpdateEvent", adminUpdateEvent);
    async function adminDeleteEvent(eventId) {
        const response = await authFetch(`/admin/events/${eventId}`, { method: 'DELETE' });
        if (!response.ok)
            throw new Error('Failed to delete event');
    }
    exports_1("adminDeleteEvent", adminDeleteEvent);
    async function fetchAdminInviteCodes() {
        const response = await authFetch('/admin/invite-codes');
        if (!response.ok)
            throw new Error('Failed to fetch invite codes');
        return response.json();
    }
    exports_1("fetchAdminInviteCodes", fetchAdminInviteCodes);
    async function adminCreateInviteCode(params) {
        const response = await authFetch('/admin/invite-codes', {
            method: 'POST',
            body: JSON.stringify(params),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Failed to create invite code' }));
            throw new Error(err.message);
        }
    }
    exports_1("adminCreateInviteCode", adminCreateInviteCode);
    async function adminToggleInviteCode(code) {
        const response = await authFetch(`/admin/invite-codes/${encodeURIComponent(code)}/toggle`, {
            method: 'POST',
            body: '{}',
        });
        if (!response.ok)
            throw new Error('Failed to toggle invite code');
    }
    exports_1("adminToggleInviteCode", adminToggleInviteCode);
    async function fetchAdminInviteCodeUsers(code) {
        const response = await authFetch(`/admin/invite-codes/${encodeURIComponent(code)}/users`);
        if (!response.ok)
            throw new Error('Failed to fetch invite code users');
        const data = await response.json();
        return data.data;
    }
    exports_1("fetchAdminInviteCodeUsers", fetchAdminInviteCodeUsers);
    async function fetchAdminNotifications(params) {
        const searchParams = new URLSearchParams();
        if (params?.limit)
            searchParams.set('limit', String(params.limit));
        if (params?.offset)
            searchParams.set('offset', String(params.offset));
        if (params?.userId)
            searchParams.set('userId', params.userId);
        if (params?.typeId)
            searchParams.set('typeId', String(params.typeId));
        const qs = searchParams.toString();
        const response = await authFetch(`/admin/notifications${qs ? `?${qs}` : ''}`);
        if (!response.ok)
            throw new Error('Failed to fetch admin notifications');
        return response.json();
    }
    exports_1("fetchAdminNotifications", fetchAdminNotifications);
    async function fetchAdminNotificationStats() {
        const response = await authFetch('/admin/notifications/stats');
        if (!response.ok)
            throw new Error('Failed to fetch notification stats');
        return response.json();
    }
    exports_1("fetchAdminNotificationStats", fetchAdminNotificationStats);
    async function adminSendNotification(params) {
        const response = await authFetch('/admin/notifications/send', {
            method: 'POST',
            body: JSON.stringify(params),
        });
        if (!response.ok)
            throw new Error('Failed to send notification');
        return response.json();
    }
    exports_1("adminSendNotification", adminSendNotification);
    async function adminDeleteNotification(notificationId) {
        const response = await authFetch(`/admin/notifications/${notificationId}`, { method: 'DELETE' });
        if (!response.ok)
            throw new Error('Failed to delete notification');
    }
    exports_1("adminDeleteNotification", adminDeleteNotification);
    return {
        setters: [
            function (tokenStorage_1_1) {
                tokenStorage_1 = tokenStorage_1_1;
            },
            function (api_1_1) {
                api_1 = api_1_1;
            }
        ],
        execute: function () {
            exports_1("API_URL", API_URL = api_1.API_BASE_URL);
            // ── Request deduplication cache for fetchCenters ───────────────────────
            _centersPromise = null;
            _centersTimestamp = 0;
            CENTERS_CACHE_TTL = 30000; // 30 seconds
            // ── Discover sample data (empty since we fetch from API) ──────────────────────────
            exports_1("DISCOVER_SAMPLE_EVENTS", DISCOVER_SAMPLE_EVENTS = []);
            exports_1("DISCOVER_SAMPLE_CENTERS", DISCOVER_SAMPLE_CENTERS = []);
        }
    };
});
