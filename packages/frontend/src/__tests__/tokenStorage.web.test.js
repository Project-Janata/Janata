System.register(["vitest"], function (exports_1, context_1) {
    "use strict";
    var vitest_1, TOKEN_KEY, store, localStorageMock, cookieStore, origWindow, origDocument, origLocalStorage;
    var __moduleName = context_1 && context_1.id;
    // Dynamically import the actual web implementation, bypassing the setup.ts mock
    async function getTokenStorage() {
        vitest_1.vi.resetModules();
        globalThis.__DEV__ = true;
        globalThis.window = globalThis;
        vitest_1.vi.doUnmock('../../components/utils/tokenStorage');
        return await context_1.import('../../components/utils/tokenStorage.web');
    }
    return {
        setters: [
            function (vitest_1_1) {
                vitest_1 = vitest_1_1;
            }
        ],
        execute: function () {
            TOKEN_KEY = '@auth_token';
            // ── localStorage mock ──────────────────────────────────────────────────
            store = {};
            localStorageMock = {
                getItem: vitest_1.vi.fn((key) => store[key] ?? null),
                setItem: vitest_1.vi.fn((key, value) => { store[key] = value; }),
                removeItem: vitest_1.vi.fn((key) => { delete store[key]; }),
                clear: vitest_1.vi.fn(() => { store = {}; }),
            };
            // ── document.cookie mock ───────────────────────────────────────────────
            cookieStore = '';
            // Save originals
            origWindow = globalThis.window;
            origDocument = globalThis.document;
            origLocalStorage = globalThis.localStorage;
            vitest_1.beforeEach(() => {
                store = {};
                localStorageMock.getItem.mockImplementation((key) => store[key] ?? null);
                localStorageMock.setItem.mockImplementation((key, value) => { store[key] = value; });
                localStorageMock.removeItem.mockImplementation((key) => { delete store[key]; });
                localStorageMock.getItem.mockClear();
                localStorageMock.setItem.mockClear();
                localStorageMock.removeItem.mockClear();
                cookieStore = '';
                globalThis.window = globalThis;
                Object.defineProperty(globalThis, 'localStorage', {
                    value: localStorageMock,
                    writable: true,
                    configurable: true,
                });
                Object.defineProperty(globalThis, 'document', {
                    value: {
                        get cookie() {
                            return cookieStore;
                        },
                        set cookie(val) {
                            const parts = val.split(';');
                            const nameValue = parts[0].trim();
                            const eqIdx = nameValue.indexOf('=');
                            if (eqIdx === -1)
                                return;
                            const name = nameValue.substring(0, eqIdx);
                            const value = nameValue.substring(eqIdx + 1);
                            // Check if this is an expiry/deletion cookie
                            const expiresMatch = val.match(/Expires=([^;]+)/);
                            if (expiresMatch) {
                                const expDate = new Date(expiresMatch[1]);
                                if (expDate.getTime() < Date.now()) {
                                    // Remove cookie
                                    const cookies = cookieStore.split(';').filter((c) => {
                                        const cn = c.trim().split('=')[0];
                                        return cn !== name;
                                    });
                                    cookieStore = cookies.filter(Boolean).join('; ');
                                    return;
                                }
                            }
                            // Add or update cookie
                            const existing = cookieStore.split(';').filter((c) => {
                                const cn = c.trim().split('=')[0];
                                return cn !== name;
                            });
                            existing.push(`${name}=${value}`);
                            cookieStore = existing.filter(Boolean).map((s) => s.trim()).join('; ');
                        },
                    },
                    writable: true,
                    configurable: true,
                });
            });
            vitest_1.afterEach(() => {
                // Restore originals
                if (origWindow === undefined) {
                    delete globalThis.window;
                }
                else {
                    ;
                    globalThis.window = origWindow;
                }
                if (origDocument === undefined) {
                    delete globalThis.document;
                }
                else {
                    ;
                    globalThis.document = origDocument;
                }
                if (origLocalStorage === undefined) {
                    // Can't really delete localStorage on globalThis, but configurable allows it
                    try {
                        Object.defineProperty(globalThis, 'localStorage', {
                            value: undefined,
                            writable: true,
                            configurable: true,
                        });
                    }
                    catch { }
                }
                else {
                    Object.defineProperty(globalThis, 'localStorage', {
                        value: origLocalStorage,
                        writable: true,
                        configurable: true,
                    });
                }
            });
            vitest_1.describe('setStoredToken', () => {
                vitest_1.it('stores token in localStorage and sets cookie', async () => {
                    const { setStoredToken } = await getTokenStorage();
                    await setStoredToken('my-token');
                    vitest_1.expect(localStorageMock.setItem).toHaveBeenCalledWith(TOKEN_KEY, 'my-token');
                    vitest_1.expect(cookieStore).toContain(`${TOKEN_KEY}=my-token`);
                });
            });
            vitest_1.describe('getStoredToken', () => {
                vitest_1.it('reads from localStorage first', async () => {
                    const { getStoredToken } = await getTokenStorage();
                    store[TOKEN_KEY] = 'local-token';
                    const token = await getStoredToken();
                    vitest_1.expect(token).toBe('local-token');
                });
                vitest_1.it('falls back to cookie when localStorage has no token', async () => {
                    const { getStoredToken } = await getTokenStorage();
                    cookieStore = `${TOKEN_KEY}=cookie-token`;
                    const token = await getStoredToken();
                    vitest_1.expect(token).toBe('cookie-token');
                });
                vitest_1.it('returns null when neither localStorage nor cookie has token', async () => {
                    const { getStoredToken } = await getTokenStorage();
                    const token = await getStoredToken();
                    vitest_1.expect(token).toBeNull();
                });
            });
            vitest_1.describe('removeStoredToken', () => {
                vitest_1.it('removes from localStorage and erases cookie', async () => {
                    const { removeStoredToken } = await getTokenStorage();
                    store[TOKEN_KEY] = 'to-remove';
                    cookieStore = `${TOKEN_KEY}=to-remove`;
                    await removeStoredToken();
                    vitest_1.expect(localStorageMock.removeItem).toHaveBeenCalledWith(TOKEN_KEY);
                    vitest_1.expect(cookieStore).not.toContain(`${TOKEN_KEY}=to-remove`);
                });
            });
            vitest_1.describe('hasStoredToken', () => {
                vitest_1.it('returns true when token exists in localStorage', async () => {
                    const { hasStoredToken } = await getTokenStorage();
                    store[TOKEN_KEY] = 'exists';
                    const result = await hasStoredToken();
                    vitest_1.expect(result).toBe(true);
                });
                vitest_1.it('returns true when token exists in cookie only', async () => {
                    const { hasStoredToken } = await getTokenStorage();
                    cookieStore = `${TOKEN_KEY}=cookie-token`;
                    const result = await hasStoredToken();
                    vitest_1.expect(result).toBe(true);
                });
                vitest_1.it('returns false when no token exists', async () => {
                    const { hasStoredToken } = await getTokenStorage();
                    const result = await hasStoredToken();
                    vitest_1.expect(result).toBe(false);
                });
            });
            vitest_1.describe('cookie fallback when localStorage throws', () => {
                vitest_1.it('setStoredToken still sets cookie when localStorage.setItem throws', async () => {
                    const { setStoredToken } = await getTokenStorage();
                    localStorageMock.setItem.mockImplementationOnce(() => {
                        throw new Error('localStorage disabled');
                    });
                    await setStoredToken('fallback-token');
                    vitest_1.expect(cookieStore).toContain(`${TOKEN_KEY}=fallback-token`);
                });
                vitest_1.it('getStoredToken falls back to cookie when localStorage.getItem throws', async () => {
                    const { getStoredToken } = await getTokenStorage();
                    localStorageMock.getItem.mockImplementationOnce(() => {
                        throw new Error('localStorage disabled');
                    });
                    cookieStore = `${TOKEN_KEY}=cookie-fallback`;
                    const token = await getStoredToken();
                    vitest_1.expect(token).toBe('cookie-fallback');
                });
            });
        }
    };
});
