System.register(["vitest"], function (exports_1, context_1) {
    "use strict";
    var vitest_1, mockFetch;
    var __moduleName = context_1 && context_1.id;
    // Helper to build a mock Response
    function mockResponse(body, ok = true, status = 200) {
        return {
            ok,
            status,
            json: vitest_1.vi.fn().mockResolvedValue(body),
            text: vitest_1.vi.fn().mockResolvedValue(JSON.stringify(body)),
            headers: new Headers(),
            redirected: false,
            statusText: ok ? 'OK' : 'Error',
            type: 'basic',
            url: '',
            clone: vitest_1.vi.fn(),
            body: null,
            bodyUsed: false,
            arrayBuffer: vitest_1.vi.fn(),
            blob: vitest_1.vi.fn(),
            formData: vitest_1.vi.fn(),
            bytes: vitest_1.vi.fn(),
        };
    }
    return {
        setters: [
            function (vitest_1_1) {
                vitest_1 = vitest_1_1;
            }
        ],
        execute: function () {
            // We need to be able to re-import the module with different Platform/DEV settings,
            // so we'll use dynamic imports and resetModules where needed.
            // ── Global fetch mock ──────────────────────────────────────────────────
            mockFetch = vitest_1.vi.fn();
            globalThis.fetch = mockFetch;
            // ── Tests ──────────────────────────────────────────────────────────────
            vitest_1.describe('API_URL generation', () => {
                vitest_1.afterEach(() => {
                    vitest_1.vi.resetModules();
                });
                vitest_1.it('returns localhost for web in dev mode', async () => {
                    ;
                    globalThis.__DEV__ = true;
                    vitest_1.vi.doMock('react-native', () => ({
                        Platform: { OS: 'web', select: (obj) => obj.web ?? obj.default },
                    }));
                    const api = await context_1.import('../../utils/api');
                    vitest_1.expect(api.API_URL).toBe('http://localhost:8787/api');
                });
                vitest_1.it('returns 10.0.2.2 for android in dev mode', async () => {
                    ;
                    globalThis.__DEV__ = true;
                    vitest_1.vi.doMock('react-native', () => ({
                        Platform: { OS: 'android', select: (obj) => obj.android ?? obj.default },
                    }));
                    const api = await context_1.import('../../utils/api');
                    vitest_1.expect(api.API_URL).toBe('http://10.0.2.2:8787/api');
                });
                vitest_1.it('returns localhost for ios in dev mode', async () => {
                    ;
                    globalThis.__DEV__ = true;
                    vitest_1.vi.doMock('react-native', () => ({
                        Platform: { OS: 'ios', select: (obj) => obj.ios ?? obj.default },
                    }));
                    const api = await context_1.import('../../utils/api');
                    vitest_1.expect(api.API_URL).toBe('http://localhost:8787/api');
                });
                vitest_1.it('returns backend Worker URL for web in production', async () => {
                    ;
                    globalThis.__DEV__ = false;
                    vitest_1.vi.doMock('react-native', () => ({
                        Platform: { OS: 'web', select: (obj) => obj.web ?? obj.default },
                    }));
                    const api = await context_1.import('../../utils/api');
                    vitest_1.expect(api.API_URL).toBe('https://api.chinmayajanata.org/api');
                });
                vitest_1.it('returns backend Worker URL for native in production', async () => {
                    ;
                    globalThis.__DEV__ = false;
                    vitest_1.vi.doMock('react-native', () => ({
                        Platform: { OS: 'ios', select: (obj) => obj.ios ?? obj.default },
                    }));
                    const api = await context_1.import('../../utils/api');
                    vitest_1.expect(api.API_URL).toBe('https://api.chinmayajanata.org/api');
                });
            });
            vitest_1.describe('fetchCenters', () => {
                let api;
                vitest_1.beforeEach(async () => {
                    ;
                    globalThis.__DEV__ = true;
                    vitest_1.vi.resetModules();
                    mockFetch.mockReset();
                    vitest_1.vi.doMock('react-native', () => ({
                        Platform: { OS: 'web', select: (obj) => obj.web ?? obj.default },
                    }));
                    api = await context_1.import('../../utils/api');
                    api.invalidateCentersCache();
                });
                vitest_1.it('returns centers on success', async () => {
                    const centers = [
                        { centerID: '1', name: 'Center A', latitude: 37.0, longitude: -122.0, address: null, memberCount: 10, isVerified: true },
                    ];
                    mockFetch.mockResolvedValue(mockResponse({ centers }));
                    const result = await api.fetchCenters();
                    vitest_1.expect(result).toEqual(centers);
                    vitest_1.expect(mockFetch).toHaveBeenCalledTimes(1);
                });
                vitest_1.it('returns empty array on non-ok response', async () => {
                    mockFetch.mockResolvedValue(mockResponse({}, false, 500));
                    const result = await api.fetchCenters();
                    vitest_1.expect(result).toEqual([]);
                });
                vitest_1.it('returns empty array on fetch error', async () => {
                    mockFetch.mockRejectedValue(new Error('Network failure'));
                    const result = await api.fetchCenters();
                    vitest_1.expect(result).toEqual([]);
                });
                vitest_1.it('caches result within TTL', async () => {
                    const centers = [{ centerID: '1', name: 'C', latitude: 1, longitude: 2, address: null, memberCount: 0, isVerified: false }];
                    mockFetch.mockResolvedValue(mockResponse({ centers }));
                    const first = await api.fetchCenters();
                    const second = await api.fetchCenters();
                    vitest_1.expect(first).toEqual(centers);
                    vitest_1.expect(second).toEqual(centers);
                    // Only one fetch call because of caching
                    vitest_1.expect(mockFetch).toHaveBeenCalledTimes(1);
                });
                vitest_1.it('refetches after cache invalidation', async () => {
                    const centers1 = [{ centerID: '1', name: 'C1', latitude: 1, longitude: 2, address: null, memberCount: 0, isVerified: false }];
                    const centers2 = [{ centerID: '2', name: 'C2', latitude: 3, longitude: 4, address: null, memberCount: 0, isVerified: false }];
                    mockFetch.mockResolvedValueOnce(mockResponse({ centers: centers1 }));
                    mockFetch.mockResolvedValueOnce(mockResponse({ centers: centers2 }));
                    const first = await api.fetchCenters();
                    vitest_1.expect(first).toEqual(centers1);
                    api.invalidateCentersCache();
                    const second = await api.fetchCenters();
                    vitest_1.expect(second).toEqual(centers2);
                    vitest_1.expect(mockFetch).toHaveBeenCalledTimes(2);
                });
                vitest_1.it('clears cache on error so next call retries', async () => {
                    mockFetch.mockRejectedValueOnce(new Error('Network failure'));
                    const first = await api.fetchCenters();
                    vitest_1.expect(first).toEqual([]);
                    const centers = [{ centerID: '1', name: 'C', latitude: 1, longitude: 2, address: null, memberCount: 0, isVerified: false }];
                    mockFetch.mockResolvedValueOnce(mockResponse({ centers }));
                    const second = await api.fetchCenters();
                    vitest_1.expect(second).toEqual(centers);
                });
            });
            vitest_1.describe('fetchCenter', () => {
                let api;
                vitest_1.beforeEach(async () => {
                    ;
                    globalThis.__DEV__ = true;
                    vitest_1.vi.resetModules();
                    mockFetch.mockReset();
                    vitest_1.vi.doMock('react-native', () => ({
                        Platform: { OS: 'web', select: (obj) => obj.web ?? obj.default },
                    }));
                    api = await context_1.import('../../utils/api');
                });
                vitest_1.it('returns center on success', async () => {
                    const center = { centerID: '1', name: 'Test', latitude: 1, longitude: 2, address: null, memberCount: 5, isVerified: true };
                    mockFetch.mockResolvedValue(mockResponse({ center }));
                    const result = await api.fetchCenter('1');
                    vitest_1.expect(result).toEqual(center);
                });
                vitest_1.it('returns null on not found (non-ok)', async () => {
                    mockFetch.mockResolvedValue(mockResponse({}, false, 404));
                    const result = await api.fetchCenter('999');
                    vitest_1.expect(result).toBeNull();
                });
                vitest_1.it('returns null on error', async () => {
                    mockFetch.mockRejectedValue(new Error('fail'));
                    const result = await api.fetchCenter('1');
                    vitest_1.expect(result).toBeNull();
                });
            });
            vitest_1.describe('fetchEvent', () => {
                let api;
                vitest_1.beforeEach(async () => {
                    ;
                    globalThis.__DEV__ = true;
                    vitest_1.vi.resetModules();
                    mockFetch.mockReset();
                    vitest_1.vi.doMock('react-native', () => ({
                        Platform: { OS: 'web', select: (obj) => obj.web ?? obj.default },
                    }));
                    api = await context_1.import('../../utils/api');
                });
                vitest_1.it('returns event on success', async () => {
                    const event = { eventID: 'e1', title: 'Test', description: '', date: '2025-01-01', latitude: 1, longitude: 2, address: null, centerID: null, tier: 1, peopleAttending: 0, pointOfContact: null, image: null, category: null };
                    mockFetch.mockResolvedValue(mockResponse({ event }));
                    const result = await api.fetchEvent('e1');
                    vitest_1.expect(result).toEqual(event);
                });
                vitest_1.it('returns null on not found', async () => {
                    mockFetch.mockResolvedValue(mockResponse({}, false, 404));
                    const result = await api.fetchEvent('e999');
                    vitest_1.expect(result).toBeNull();
                });
                vitest_1.it('returns null on error', async () => {
                    mockFetch.mockRejectedValue(new Error('fail'));
                    const result = await api.fetchEvent('e1');
                    vitest_1.expect(result).toBeNull();
                });
            });
            vitest_1.describe('fetchEventsByCenter', () => {
                let api;
                vitest_1.beforeEach(async () => {
                    ;
                    globalThis.__DEV__ = true;
                    vitest_1.vi.resetModules();
                    mockFetch.mockReset();
                    vitest_1.vi.doMock('react-native', () => ({
                        Platform: { OS: 'web', select: (obj) => obj.web ?? obj.default },
                    }));
                    api = await context_1.import('../../utils/api');
                });
                vitest_1.it('returns events on success', async () => {
                    const events = [{ eventID: 'e1', title: 'A', description: '', date: '2025-01-01', latitude: 1, longitude: 2, address: null, centerID: 'c1', tier: 1, peopleAttending: 0, pointOfContact: null, image: null, category: null }];
                    mockFetch.mockResolvedValue(mockResponse({ events }));
                    const result = await api.fetchEventsByCenter('c1');
                    vitest_1.expect(result).toEqual(events);
                });
                vitest_1.it('returns empty array when no events', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ events: [] }));
                    const result = await api.fetchEventsByCenter('c1');
                    vitest_1.expect(result).toEqual([]);
                });
                vitest_1.it('returns empty array on error', async () => {
                    mockFetch.mockRejectedValue(new Error('fail'));
                    const result = await api.fetchEventsByCenter('c1');
                    vitest_1.expect(result).toEqual([]);
                });
            });
            vitest_1.describe('fetchEventUsers', () => {
                let api;
                vitest_1.beforeEach(async () => {
                    ;
                    globalThis.__DEV__ = true;
                    vitest_1.vi.resetModules();
                    mockFetch.mockReset();
                    vitest_1.vi.doMock('react-native', () => ({
                        Platform: { OS: 'web', select: (obj) => obj.web ?? obj.default },
                    }));
                    api = await context_1.import('../../utils/api');
                });
                vitest_1.it('returns users on success', async () => {
                    const users = [{ id: 'u1', username: 'testuser', email: null, firstName: 'Test', lastName: 'User', dateOfBirth: null, phoneNumber: null, profileImage: null, centerID: null, points: 0, isVerified: false, verificationLevel: 0, isActive: true, profileComplete: false, interests: null }];
                    mockFetch.mockResolvedValue(mockResponse({ users }));
                    const result = await api.fetchEventUsers('e1');
                    vitest_1.expect(result).toEqual(users);
                });
                vitest_1.it('returns empty array when no users', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ users: [] }));
                    const result = await api.fetchEventUsers('e1');
                    vitest_1.expect(result).toEqual([]);
                });
                vitest_1.it('returns empty array on error', async () => {
                    mockFetch.mockRejectedValue(new Error('fail'));
                    const result = await api.fetchEventUsers('e1');
                    vitest_1.expect(result).toEqual([]);
                });
            });
            vitest_1.describe('attendEvent', () => {
                let api;
                vitest_1.beforeEach(async () => {
                    ;
                    globalThis.__DEV__ = true;
                    vitest_1.vi.resetModules();
                    mockFetch.mockReset();
                    vitest_1.vi.doMock('react-native', () => ({
                        Platform: { OS: 'web', select: (obj) => obj.web ?? obj.default },
                    }));
                    api = await context_1.import('../../utils/api');
                });
                vitest_1.it('returns peopleAttending on success', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ peopleAttending: 5 }));
                    const result = await api.attendEvent('e1');
                    vitest_1.expect(result).toEqual({ peopleAttending: 5 });
                });
                vitest_1.it('throws on non-ok response', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ message: 'Already attending' }, false, 400));
                    await vitest_1.expect(api.attendEvent('e1')).rejects.toThrow('Already attending');
                });
                vitest_1.it('throws with default message when response body parse fails', async () => {
                    const response = {
                        ok: false,
                        status: 500,
                        json: vitest_1.vi.fn().mockRejectedValue(new Error('parse error')),
                        headers: new Headers(),
                        redirected: false,
                        statusText: 'Error',
                        type: 'basic',
                        url: '',
                        clone: vitest_1.vi.fn(),
                        body: null,
                        bodyUsed: false,
                        arrayBuffer: vitest_1.vi.fn(),
                        blob: vitest_1.vi.fn(),
                        formData: vitest_1.vi.fn(),
                        text: vitest_1.vi.fn(),
                        bytes: vitest_1.vi.fn(),
                    };
                    mockFetch.mockResolvedValue(response);
                    await vitest_1.expect(api.attendEvent('e1')).rejects.toThrow('Failed to attend event');
                });
            });
            vitest_1.describe('unattendEvent', () => {
                let api;
                vitest_1.beforeEach(async () => {
                    ;
                    globalThis.__DEV__ = true;
                    vitest_1.vi.resetModules();
                    mockFetch.mockReset();
                    vitest_1.vi.doMock('react-native', () => ({
                        Platform: { OS: 'web', select: (obj) => obj.web ?? obj.default },
                    }));
                    api = await context_1.import('../../utils/api');
                });
                vitest_1.it('returns peopleAttending on success', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ peopleAttending: 3 }));
                    const result = await api.unattendEvent('e1');
                    vitest_1.expect(result).toEqual({ peopleAttending: 3 });
                });
                vitest_1.it('throws on non-ok response', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ message: 'Not attending' }, false, 400));
                    await vitest_1.expect(api.unattendEvent('e1')).rejects.toThrow('Not attending');
                });
            });
            vitest_1.describe('updateEvent', () => {
                let api;
                vitest_1.beforeEach(async () => {
                    ;
                    globalThis.__DEV__ = true;
                    vitest_1.vi.resetModules();
                    mockFetch.mockReset();
                    vitest_1.vi.doMock('react-native', () => ({
                        Platform: { OS: 'web', select: (obj) => obj.web ?? obj.default },
                    }));
                    api = await context_1.import('../../utils/api');
                });
                vitest_1.it('returns data on success', async () => {
                    const updated = { success: true };
                    mockFetch.mockResolvedValue(mockResponse(updated));
                    const result = await api.updateEvent({ title: 'Updated' });
                    vitest_1.expect(result).toEqual(updated);
                });
                vitest_1.it('throws on non-ok response', async () => {
                    mockFetch.mockResolvedValue(mockResponse({}, false, 500));
                    await vitest_1.expect(api.updateEvent({ title: 'Fail' })).rejects.toThrow('Failed to update event');
                });
            });
            vitest_1.describe('getUserEvents', () => {
                let api;
                vitest_1.beforeEach(async () => {
                    ;
                    globalThis.__DEV__ = true;
                    vitest_1.vi.resetModules();
                    mockFetch.mockReset();
                    vitest_1.vi.doMock('react-native', () => ({
                        Platform: { OS: 'web', select: (obj) => obj.web ?? obj.default },
                    }));
                    api = await context_1.import('../../utils/api');
                });
                vitest_1.it('returns events on success', async () => {
                    const events = [{ eventID: 'e1', title: 'A', description: '', date: '2025-01-01', latitude: 1, longitude: 2, address: null, centerID: null, tier: 1, peopleAttending: 0, pointOfContact: null, image: null, category: null }];
                    mockFetch.mockResolvedValue(mockResponse({ events }));
                    const result = await api.getUserEvents('testuser');
                    vitest_1.expect(result).toEqual(events);
                });
                vitest_1.it('returns empty array when no events', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ events: [] }));
                    const result = await api.getUserEvents('testuser');
                    vitest_1.expect(result).toEqual([]);
                });
                vitest_1.it('returns empty array on error', async () => {
                    mockFetch.mockRejectedValue(new Error('fail'));
                    const result = await api.getUserEvents('testuser');
                    vitest_1.expect(result).toEqual([]);
                });
            });
            vitest_1.describe('centersToMapPoints', () => {
                let api;
                vitest_1.beforeEach(async () => {
                    ;
                    globalThis.__DEV__ = true;
                    vitest_1.vi.resetModules();
                    vitest_1.vi.doMock('react-native', () => ({
                        Platform: { OS: 'web', select: (obj) => obj.web ?? obj.default },
                    }));
                    api = await context_1.import('../../utils/api');
                });
                vitest_1.it('converts centers with lat/lng to map points', () => {
                    const centers = [
                        { centerID: '1', name: 'A', latitude: 37.0, longitude: -122.0, address: null, memberCount: 10, isVerified: true },
                        { centerID: '2', name: 'B', latitude: 38.0, longitude: -121.0, address: 'Addr', memberCount: 5, isVerified: false },
                    ];
                    const result = api.centersToMapPoints(centers);
                    vitest_1.expect(result).toHaveLength(2);
                    vitest_1.expect(result[0]).toEqual({ id: '1', type: 'center', name: 'A', latitude: 37.0, longitude: -122.0 });
                });
                vitest_1.it('keeps entries with latitude=0 (valid coordinate)', () => {
                    const centers = [
                        { centerID: '1', name: 'A', latitude: 0, longitude: -122.0, address: null, memberCount: 10, isVerified: true },
                        { centerID: '2', name: 'B', latitude: 38.0, longitude: -121.0, address: null, memberCount: 5, isVerified: false },
                    ];
                    const result = api.centersToMapPoints(centers);
                    vitest_1.expect(result).toHaveLength(2);
                });
                vitest_1.it('keeps entries with longitude=0 (valid coordinate)', () => {
                    const centers = [
                        { centerID: '1', name: 'A', latitude: 37.0, longitude: 0, address: null, memberCount: 10, isVerified: true },
                    ];
                    const result = api.centersToMapPoints(centers);
                    vitest_1.expect(result).toHaveLength(1);
                });
                vitest_1.it('uses "Unknown Center" when name is empty', () => {
                    const centers = [
                        { centerID: '1', name: '', latitude: 37.0, longitude: -122.0, address: null, memberCount: 0, isVerified: false },
                    ];
                    const result = api.centersToMapPoints(centers);
                    vitest_1.expect(result[0].name).toBe('Unknown Center');
                });
            });
            vitest_1.describe('eventsToMapPoints', () => {
                let api;
                vitest_1.beforeEach(async () => {
                    ;
                    globalThis.__DEV__ = true;
                    vitest_1.vi.resetModules();
                    vitest_1.vi.doMock('react-native', () => ({
                        Platform: { OS: 'web', select: (obj) => obj.web ?? obj.default },
                    }));
                    api = await context_1.import('../../utils/api');
                });
                vitest_1.it('converts events with lat/lng to map points', () => {
                    const events = [
                        { eventID: 'e1', title: 'Ev1', description: '', date: '2025-01-01', latitude: 37.0, longitude: -122.0, address: null, centerID: null, tier: 1, peopleAttending: 0, pointOfContact: null, image: null, category: null },
                    ];
                    const result = api.eventsToMapPoints(events);
                    vitest_1.expect(result).toHaveLength(1);
                    vitest_1.expect(result[0]).toEqual({ id: 'e1', type: 'event', name: 'Ev1', latitude: 37.0, longitude: -122.0 });
                });
                vitest_1.it('keeps entries with lat/lng=0 (valid coordinates)', () => {
                    const events = [
                        { eventID: 'e1', title: 'Ev1', description: '', date: '2025-01-01', latitude: 0, longitude: -122.0, address: null, centerID: null, tier: 1, peopleAttending: 0, pointOfContact: null, image: null, category: null },
                        { eventID: 'e2', title: 'Ev2', description: '', date: '2025-01-01', latitude: 37.0, longitude: 0, address: null, centerID: null, tier: 1, peopleAttending: 0, pointOfContact: null, image: null, category: null },
                    ];
                    const result = api.eventsToMapPoints(events);
                    vitest_1.expect(result).toHaveLength(2);
                });
                vitest_1.it('uses description as fallback when title is empty', () => {
                    const events = [
                        { eventID: 'e1', title: '', description: 'Desc', date: '2025-01-01', latitude: 37.0, longitude: -122.0, address: null, centerID: null, tier: 1, peopleAttending: 0, pointOfContact: null, image: null, category: null },
                    ];
                    const result = api.eventsToMapPoints(events);
                    vitest_1.expect(result[0].name).toBe('Desc');
                });
                vitest_1.it('uses "Event" when both title and description are empty', () => {
                    const events = [
                        { eventID: 'e1', title: '', description: '', date: '2025-01-01', latitude: 37.0, longitude: -122.0, address: null, centerID: null, tier: 1, peopleAttending: 0, pointOfContact: null, image: null, category: null },
                    ];
                    const result = api.eventsToMapPoints(events);
                    vitest_1.expect(result[0].name).toBe('Event');
                });
            });
            vitest_1.describe('centersToDiscoverCenters', () => {
                let api;
                vitest_1.beforeEach(async () => {
                    ;
                    globalThis.__DEV__ = true;
                    vitest_1.vi.resetModules();
                    vitest_1.vi.doMock('react-native', () => ({
                        Platform: { OS: 'web', select: (obj) => obj.web ?? obj.default },
                    }));
                    api = await context_1.import('../../utils/api');
                });
                vitest_1.it('transforms centers to DiscoverCenter format', () => {
                    const centers = [
                        { centerID: '1', name: 'A', latitude: 37.0, longitude: -122.0, address: '123 St', memberCount: 10, isVerified: true },
                    ];
                    const result = api.centersToDiscoverCenters(centers);
                    vitest_1.expect(result).toEqual([
                        { id: '1', name: 'A', address: '123 St', latitude: 37.0, longitude: -122.0, memberCount: 10, image: null },
                    ]);
                });
                vitest_1.it('keeps entries with lat/lng=0 (valid coordinates)', () => {
                    const centers = [
                        { centerID: '1', name: 'A', latitude: 0, longitude: -122.0, address: null, memberCount: 10, isVerified: true },
                        { centerID: '2', name: 'B', latitude: 37.0, longitude: -122.0, address: null, memberCount: 5, isVerified: false },
                    ];
                    const result = api.centersToDiscoverCenters(centers);
                    vitest_1.expect(result).toHaveLength(2);
                });
                vitest_1.it('converts null address to undefined', () => {
                    const centers = [
                        { centerID: '1', name: 'A', latitude: 37.0, longitude: -122.0, address: null, memberCount: 10, isVerified: true },
                    ];
                    const result = api.centersToDiscoverCenters(centers);
                    vitest_1.expect(result[0].address).toBeUndefined();
                });
                vitest_1.it('uses "Unknown Center" for empty name', () => {
                    const centers = [
                        { centerID: '1', name: '', latitude: 37.0, longitude: -122.0, address: null, memberCount: 0, isVerified: false },
                    ];
                    const result = api.centersToDiscoverCenters(centers);
                    vitest_1.expect(result[0].name).toBe('Unknown Center');
                });
            });
        }
    };
});
