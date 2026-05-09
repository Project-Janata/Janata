System.register(["vitest", "../auth/authClient"], function (exports_1, context_1) {
    "use strict";
    var vitest_1, mockFetch, authClient_1;
    var __moduleName = context_1 && context_1.id;
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
            },
            function (authClient_1_1) {
                authClient_1 = authClient_1_1;
            }
        ],
        execute: function () {
            // ── Mock the config/api module ─────────────────────────────────────────
            vitest_1.vi.mock('../config/api', () => ({
                API_BASE_URL: 'http://localhost:8787/api',
                API_TIMEOUTS: {
                    auth: 60000,
                    logout: 30000,
                    standard: 60000,
                },
                API_ENDPOINTS: {
                    auth: {
                        login: '/auth/authenticate',
                        register: '/auth/register',
                        verify: '/auth/verify',
                        logout: '/auth/deauthenticate',
                        deleteAccount: '/auth/delete-account',
                    },
                    users: {
                        exists: '/userExistence',
                        profile: '/auth/update-profile',
                    },
                },
                DEFAULT_FETCH_OPTIONS: {
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                },
                buildApiUrl: (path) => `http://localhost:8787/api${path.startsWith('/') ? path : `/${path}`}`,
            }));
            // ── Global fetch mock ──────────────────────────────────────────────────
            mockFetch = vitest_1.vi.fn();
            globalThis.fetch = mockFetch;
            vitest_1.beforeEach(() => {
                mockFetch.mockReset();
            });
            // ── Login ──────────────────────────────────────────────────────────────
            vitest_1.describe('authClient.login', () => {
                vitest_1.it('returns user and token on success', async () => {
                    const user = { username: 'testuser', firstName: 'Test', lastName: 'User' };
                    mockFetch.mockResolvedValue(mockResponse({ user, token: 'abc123' }));
                    const result = await authClient_1.authClient.login({ username: 'TestUser', password: 'pass' });
                    vitest_1.expect(result.success).toBe(true);
                    if (result.success) {
                        vitest_1.expect(result.data.user).toEqual(user);
                        vitest_1.expect(result.data.token).toBe('abc123');
                    }
                });
                vitest_1.it('normalizes username (trim + lowercase)', async () => {
                    const user = { username: 'testuser' };
                    mockFetch.mockResolvedValue(mockResponse({ user, token: 'tok' }));
                    await authClient_1.authClient.login({ username: '  TestUser  ', password: 'pass' });
                    const call = mockFetch.mock.calls[0];
                    const body = JSON.parse(call[1].body);
                    vitest_1.expect(body.username).toBe('testuser');
                });
                vitest_1.it('returns error on invalid credentials', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ message: 'Invalid credentials' }, false, 401));
                    const result = await authClient_1.authClient.login({ username: 'bad', password: 'wrong' });
                    vitest_1.expect(result.success).toBe(false);
                    if (!result.success) {
                        vitest_1.expect(result.error.message).toBe('Invalid credentials');
                        vitest_1.expect(result.error.status).toBe(401);
                    }
                });
                vitest_1.it('returns error when response has no user', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ token: 'tok' }));
                    const result = await authClient_1.authClient.login({ username: 'test', password: 'pass' });
                    vitest_1.expect(result.success).toBe(false);
                });
                vitest_1.it('returns network error on fetch failure', async () => {
                    mockFetch.mockRejectedValue(new Error('fetch failed'));
                    const result = await authClient_1.authClient.login({ username: 'test', password: 'pass' });
                    vitest_1.expect(result.success).toBe(false);
                    if (!result.success) {
                        vitest_1.expect(result.error.message).toBe('Network error. Please try again.');
                    }
                });
                vitest_1.it('returns timeout error on AbortError', async () => {
                    const abortError = new DOMException('Aborted', 'AbortError');
                    mockFetch.mockRejectedValue(abortError);
                    const result = await authClient_1.authClient.login({ username: 'test', password: 'pass' });
                    vitest_1.expect(result.success).toBe(false);
                    if (!result.success) {
                        vitest_1.expect(result.error.message).toContain('timeout');
                    }
                });
            });
            // ── Signup ─────────────────────────────────────────────────────────────
            vitest_1.describe('authClient.signup', () => {
                vitest_1.it('returns success on valid signup', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ success: true, message: 'User created' }));
                    const result = await authClient_1.authClient.signup({ username: 'newuser', password: 'pass123' });
                    vitest_1.expect(result.success).toBe(true);
                    if (result.success) {
                        vitest_1.expect(result.data.success).toBe(true);
                    }
                });
                vitest_1.it('normalizes username', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ success: true }));
                    await authClient_1.authClient.signup({ username: '  NewUser  ', password: 'pass' });
                    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
                    vitest_1.expect(body.username).toBe('newuser');
                });
                vitest_1.it('returns error on duplicate username (409)', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ message: 'Username already exists' }, false, 409));
                    const result = await authClient_1.authClient.signup({ username: 'existing', password: 'pass' });
                    vitest_1.expect(result.success).toBe(false);
                    if (!result.success) {
                        vitest_1.expect(result.error.message).toBe('Username already exists');
                        vitest_1.expect(result.error.status).toBe(409);
                    }
                });
                vitest_1.it('returns error on validation error', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ message: 'Password too short' }, false, 400));
                    const result = await authClient_1.authClient.signup({ username: 'test', password: 'x' });
                    vitest_1.expect(result.success).toBe(false);
                    if (!result.success) {
                        vitest_1.expect(result.error.message).toBe('Password too short');
                    }
                });
                vitest_1.it('returns network error on fetch failure', async () => {
                    mockFetch.mockRejectedValue(new Error('network'));
                    const result = await authClient_1.authClient.signup({ username: 'test', password: 'pass' });
                    vitest_1.expect(result.success).toBe(false);
                    if (!result.success) {
                        vitest_1.expect(result.error.message).toBe('Network error. Please try again.');
                    }
                });
                vitest_1.it('returns timeout error on AbortError', async () => {
                    const abortError = new DOMException('Aborted', 'AbortError');
                    mockFetch.mockRejectedValue(abortError);
                    const result = await authClient_1.authClient.signup({ username: 'test', password: 'pass' });
                    vitest_1.expect(result.success).toBe(false);
                    if (!result.success) {
                        vitest_1.expect(result.error.message).toContain('timeout');
                    }
                });
            });
            // ── Verify ─────────────────────────────────────────────────────────────
            vitest_1.describe('authClient.verify', () => {
                vitest_1.it('returns user on valid token', async () => {
                    const user = { username: 'test', firstName: 'A', lastName: 'B' };
                    mockFetch.mockResolvedValue(mockResponse({ user }));
                    const result = await authClient_1.authClient.verify('valid-token');
                    vitest_1.expect(result.success).toBe(true);
                    if (result.success) {
                        vitest_1.expect(result.data.user).toEqual(user);
                    }
                });
                vitest_1.it('sends Authorization header', async () => {
                    const user = { username: 'test' };
                    mockFetch.mockResolvedValue(mockResponse({ user }));
                    await authClient_1.authClient.verify('my-token');
                    const headers = mockFetch.mock.calls[0][1].headers;
                    vitest_1.expect(headers.Authorization).toBe('Bearer my-token');
                });
                vitest_1.it('returns error on invalid token', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ message: 'Session invalid' }, false, 401));
                    const result = await authClient_1.authClient.verify('bad-token');
                    vitest_1.expect(result.success).toBe(false);
                    if (!result.success) {
                        vitest_1.expect(result.error.message).toBe('Session invalid');
                    }
                });
                vitest_1.it('returns error when response has no user', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ something: 'else' }));
                    const result = await authClient_1.authClient.verify('token');
                    vitest_1.expect(result.success).toBe(false);
                });
                vitest_1.it('returns network error on fetch failure', async () => {
                    mockFetch.mockRejectedValue(new Error('network'));
                    const result = await authClient_1.authClient.verify('token');
                    vitest_1.expect(result.success).toBe(false);
                    if (!result.success) {
                        vitest_1.expect(result.error.message).toBe('Network error. Please try again.');
                    }
                });
            });
            // ── Logout ─────────────────────────────────────────────────────────────
            vitest_1.describe('authClient.logout', () => {
                vitest_1.it('returns success on ok response', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ success: true, message: 'Logged out' }));
                    const result = await authClient_1.authClient.logout('tok');
                    vitest_1.expect(result.success).toBe(true);
                });
                vitest_1.it('sends Authorization header when token provided', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ success: true }));
                    await authClient_1.authClient.logout('my-token');
                    const headers = mockFetch.mock.calls[0][1].headers;
                    vitest_1.expect(headers.Authorization).toBe('Bearer my-token');
                });
                vitest_1.it('works without token', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ success: true }));
                    const result = await authClient_1.authClient.logout();
                    vitest_1.expect(result.success).toBe(true);
                });
                vitest_1.it('returns error on failure', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ message: 'Logout failed' }, false, 500));
                    const result = await authClient_1.authClient.logout('tok');
                    vitest_1.expect(result.success).toBe(false);
                    if (!result.success) {
                        vitest_1.expect(result.error.message).toBe('Logout failed');
                    }
                });
            });
            // ── Check User Exists ──────────────────────────────────────────────────
            vitest_1.describe('authClient.checkUserExists', () => {
                vitest_1.it('returns true when user exists', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ existence: true }));
                    const result = await authClient_1.authClient.checkUserExists('existinguser');
                    vitest_1.expect(result.success).toBe(true);
                    if (result.success) {
                        vitest_1.expect(result.data.existence).toBe(true);
                    }
                });
                vitest_1.it('returns false when user does not exist', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ existence: false }));
                    const result = await authClient_1.authClient.checkUserExists('newuser');
                    vitest_1.expect(result.success).toBe(true);
                    if (result.success) {
                        vitest_1.expect(result.data.existence).toBe(false);
                    }
                });
                vitest_1.it('normalizes username', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ existence: true }));
                    await authClient_1.authClient.checkUserExists('  TestUser  ');
                    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
                    vitest_1.expect(body.username).toBe('testuser');
                    vitest_1.expect(body.email).toBe('testuser');
                });
                vitest_1.it('returns error on failure', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ message: 'Server error' }, false, 500));
                    const result = await authClient_1.authClient.checkUserExists('user');
                    vitest_1.expect(result.success).toBe(false);
                });
            });
            // ── Update Profile ─────────────────────────────────────────────────────
            vitest_1.describe('authClient.updateProfile', () => {
                vitest_1.it('returns user from { user } response shape', async () => {
                    const user = { username: 'test', firstName: 'Updated' };
                    mockFetch.mockResolvedValue(mockResponse({ user }));
                    const result = await authClient_1.authClient.updateProfile('tok', { firstName: 'Updated' });
                    vitest_1.expect(result.success).toBe(true);
                    if (result.success) {
                        vitest_1.expect(result.data.user).toEqual(user);
                    }
                });
                vitest_1.it('returns user from direct user response shape', async () => {
                    const user = { username: 'test', firstName: 'Direct' };
                    mockFetch.mockResolvedValue(mockResponse(user));
                    const result = await authClient_1.authClient.updateProfile('tok', { firstName: 'Direct' });
                    vitest_1.expect(result.success).toBe(true);
                    if (result.success) {
                        vitest_1.expect(result.data.user).toEqual(user);
                    }
                });
                vitest_1.it('sends PUT with auth header', async () => {
                    const user = { username: 'test' };
                    mockFetch.mockResolvedValue(mockResponse({ user }));
                    await authClient_1.authClient.updateProfile('my-token', { firstName: 'A' });
                    const call = mockFetch.mock.calls[0];
                    vitest_1.expect(call[1].method).toBe('PUT');
                    vitest_1.expect(call[1].headers.Authorization).toBe('Bearer my-token');
                });
                vitest_1.it('returns error on failure', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ message: 'Validation failed' }, false, 400));
                    const result = await authClient_1.authClient.updateProfile('tok', { firstName: '' });
                    vitest_1.expect(result.success).toBe(false);
                    if (!result.success) {
                        vitest_1.expect(result.error.message).toBe('Validation failed');
                    }
                });
            });
            // ── Delete Account ─────────────────────────────────────────────────────
            vitest_1.describe('authClient.deleteAccount', () => {
                vitest_1.it('returns success on ok response', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ success: true, message: 'Deleted' }));
                    const result = await authClient_1.authClient.deleteAccount('tok');
                    vitest_1.expect(result.success).toBe(true);
                });
                vitest_1.it('sends DELETE with auth header', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ success: true }));
                    await authClient_1.authClient.deleteAccount('my-token');
                    const call = mockFetch.mock.calls[0];
                    vitest_1.expect(call[1].method).toBe('DELETE');
                    vitest_1.expect(call[1].headers.Authorization).toBe('Bearer my-token');
                });
                vitest_1.it('returns error on failure', async () => {
                    mockFetch.mockResolvedValue(mockResponse({ message: 'Cannot delete' }, false, 403));
                    const result = await authClient_1.authClient.deleteAccount('tok');
                    vitest_1.expect(result.success).toBe(false);
                    if (!result.success) {
                        vitest_1.expect(result.error.message).toBe('Cannot delete');
                    }
                });
            });
        }
    };
});
