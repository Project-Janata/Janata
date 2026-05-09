System.register(["vitest", "../../components/utils/tokenStorage", "../auth/authClient", "../auth/authService"], function (exports_1, context_1) {
    "use strict";
    var vitest_1, tokenStorage_1, authClient_1, authService_1, mockedAuthClient, mockedGetToken, mockedSetToken, mockedRemoveToken;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (vitest_1_1) {
                vitest_1 = vitest_1_1;
            },
            function (tokenStorage_1_1) {
                tokenStorage_1 = tokenStorage_1_1;
            },
            function (authClient_1_1) {
                authClient_1 = authClient_1_1;
            },
            function (authService_1_1) {
                authService_1 = authService_1_1;
            }
        ],
        execute: function () {
            // ── Mock authClient ────────────────────────────────────────────────────
            vitest_1.vi.mock('../auth/authClient', () => ({
                authClient: {
                    login: vitest_1.vi.fn(),
                    signup: vitest_1.vi.fn(),
                    verify: vitest_1.vi.fn(),
                    logout: vitest_1.vi.fn(),
                    checkUserExists: vitest_1.vi.fn(),
                    updateProfile: vitest_1.vi.fn(),
                    deleteAccount: vitest_1.vi.fn(),
                },
            }));
            mockedAuthClient = vitest_1.vi.mocked(authClient_1.authClient);
            mockedGetToken = vitest_1.vi.mocked(tokenStorage_1.getStoredToken);
            mockedSetToken = vitest_1.vi.mocked(tokenStorage_1.setStoredToken);
            mockedRemoveToken = vitest_1.vi.mocked(tokenStorage_1.removeStoredToken);
            vitest_1.beforeEach(() => {
                vitest_1.vi.clearAllMocks();
                mockedGetToken.mockResolvedValue(null);
                mockedSetToken.mockResolvedValue(undefined);
                mockedRemoveToken.mockResolvedValue(undefined);
            });
            // ── bootstrapSession ───────────────────────────────────────────────────
            vitest_1.describe('authService.bootstrapSession', () => {
                vitest_1.it('returns unauthenticated when no token exists', async () => {
                    mockedGetToken.mockResolvedValue(null);
                    const result = await authService_1.authService.bootstrapSession();
                    vitest_1.expect(result.authStatus).toBe('unauthenticated');
                    vitest_1.expect(result.user).toBeNull();
                });
                vitest_1.it('returns authenticated with user when token is valid', async () => {
                    const user = { username: 'test', firstName: 'A', lastName: 'B' };
                    mockedGetToken.mockResolvedValue('valid-token');
                    mockedAuthClient.verify.mockResolvedValue({ success: true, data: { user } });
                    const result = await authService_1.authService.bootstrapSession();
                    vitest_1.expect(result.authStatus).toBe('authenticated');
                    vitest_1.expect(result.user).toEqual(user);
                });
                vitest_1.it('clears token and returns unauthenticated when token is invalid', async () => {
                    mockedGetToken.mockResolvedValue('invalid-token');
                    mockedAuthClient.verify.mockResolvedValue({
                        success: false,
                        error: { message: 'Session invalid', status: 401 },
                    });
                    const result = await authService_1.authService.bootstrapSession();
                    vitest_1.expect(result.authStatus).toBe('unauthenticated');
                    vitest_1.expect(result.user).toBeNull();
                    vitest_1.expect(mockedRemoveToken).toHaveBeenCalled();
                });
                vitest_1.it('clears token and returns unauthenticated on verify error', async () => {
                    mockedGetToken.mockResolvedValue('token');
                    mockedAuthClient.verify.mockRejectedValue(new Error('network'));
                    const result = await authService_1.authService.bootstrapSession();
                    vitest_1.expect(result.authStatus).toBe('unauthenticated');
                    vitest_1.expect(result.user).toBeNull();
                    vitest_1.expect(mockedRemoveToken).toHaveBeenCalled();
                });
            });
            // ── login ──────────────────────────────────────────────────────────────
            vitest_1.describe('authService.login', () => {
                vitest_1.it('stores token and returns user on success', async () => {
                    const user = { username: 'test' };
                    mockedAuthClient.login.mockResolvedValue({
                        success: true,
                        data: { user, token: 'new-token' },
                    });
                    const result = await authService_1.authService.login('test', 'password');
                    vitest_1.expect(result.success).toBe(true);
                    vitest_1.expect(result.user).toEqual(user);
                    vitest_1.expect(mockedSetToken).toHaveBeenCalledWith('new-token');
                });
                vitest_1.it('does not store token when no token in response', async () => {
                    const user = { username: 'test' };
                    mockedAuthClient.login.mockResolvedValue({
                        success: true,
                        data: { user },
                    });
                    const result = await authService_1.authService.login('test', 'password');
                    vitest_1.expect(result.success).toBe(true);
                    vitest_1.expect(mockedSetToken).not.toHaveBeenCalled();
                });
                vitest_1.it('returns error message on failure', async () => {
                    mockedAuthClient.login.mockResolvedValue({
                        success: false,
                        error: { message: 'Invalid credentials' },
                    });
                    const result = await authService_1.authService.login('bad', 'wrong');
                    vitest_1.expect(result.success).toBe(false);
                    vitest_1.expect(result.message).toBe('Invalid credentials');
                });
            });
            // ── signup ─────────────────────────────────────────────────────────────
            vitest_1.describe('authService.signup', () => {
                vitest_1.it('calls register then login on success', async () => {
                    mockedAuthClient.signup.mockResolvedValue({
                        success: true,
                        data: { success: true, message: 'Created' },
                    });
                    const user = { username: 'newuser' };
                    mockedAuthClient.login.mockResolvedValue({
                        success: true,
                        data: { user, token: 'tok' },
                    });
                    const result = await authService_1.authService.signup('newuser', 'pass123');
                    vitest_1.expect(mockedAuthClient.signup).toHaveBeenCalledWith({ username: 'newuser', password: 'pass123' });
                    vitest_1.expect(mockedAuthClient.login).toHaveBeenCalledWith({ username: 'newuser', password: 'pass123' });
                    vitest_1.expect(result.success).toBe(true);
                    vitest_1.expect(result.user).toEqual(user);
                });
                vitest_1.it('returns error when register fails', async () => {
                    mockedAuthClient.signup.mockResolvedValue({
                        success: false,
                        error: { message: 'Username taken' },
                    });
                    const result = await authService_1.authService.signup('taken', 'pass');
                    vitest_1.expect(result.success).toBe(false);
                    vitest_1.expect(result.message).toBe('Username taken');
                    vitest_1.expect(mockedAuthClient.login).not.toHaveBeenCalled();
                });
            });
            // ── logout ─────────────────────────────────────────────────────────────
            vitest_1.describe('authService.logout', () => {
                vitest_1.it('calls authClient.logout and removes token', async () => {
                    mockedGetToken.mockResolvedValue('tok');
                    mockedAuthClient.logout.mockResolvedValue({
                        success: true,
                        data: { success: true },
                    });
                    await authService_1.authService.logout();
                    vitest_1.expect(mockedAuthClient.logout).toHaveBeenCalledWith('tok');
                    vitest_1.expect(mockedRemoveToken).toHaveBeenCalled();
                });
                vitest_1.it('removes token even when authClient.logout fails', async () => {
                    mockedGetToken.mockResolvedValue('tok');
                    mockedAuthClient.logout.mockRejectedValue(new Error('fail'));
                    // try/finally re-throws, so we catch it but verify removeStoredToken was still called
                    await vitest_1.expect(authService_1.authService.logout()).rejects.toThrow('fail');
                    vitest_1.expect(mockedRemoveToken).toHaveBeenCalled();
                });
                vitest_1.it('passes undefined when no token stored', async () => {
                    mockedGetToken.mockResolvedValue(null);
                    mockedAuthClient.logout.mockResolvedValue({
                        success: true,
                        data: { success: true },
                    });
                    await authService_1.authService.logout();
                    vitest_1.expect(mockedAuthClient.logout).toHaveBeenCalledWith(undefined);
                });
            });
            // ── checkUserExists ────────────────────────────────────────────────────
            vitest_1.describe('authService.checkUserExists', () => {
                vitest_1.it('delegates to authClient and returns existence', async () => {
                    mockedAuthClient.checkUserExists.mockResolvedValue({
                        success: true,
                        data: { existence: true },
                    });
                    const result = await authService_1.authService.checkUserExists('testuser');
                    vitest_1.expect(result.success).toBe(true);
                    vitest_1.expect(result.existence).toBe(true);
                    vitest_1.expect(mockedAuthClient.checkUserExists).toHaveBeenCalledWith('testuser');
                });
                vitest_1.it('returns error message on failure', async () => {
                    mockedAuthClient.checkUserExists.mockResolvedValue({
                        success: false,
                        error: { message: 'Server error' },
                    });
                    const result = await authService_1.authService.checkUserExists('testuser');
                    vitest_1.expect(result.success).toBe(false);
                    vitest_1.expect(result.message).toBe('Server error');
                });
            });
            // ── updateProfile ──────────────────────────────────────────────────────
            vitest_1.describe('authService.updateProfile', () => {
                vitest_1.it('returns updated user on success', async () => {
                    const user = { username: 'test', firstName: 'Updated' };
                    mockedGetToken.mockResolvedValue('tok');
                    mockedAuthClient.updateProfile.mockResolvedValue({
                        success: true,
                        data: { user },
                    });
                    const result = await authService_1.authService.updateProfile({ firstName: 'Updated' });
                    vitest_1.expect(result.success).toBe(true);
                    vitest_1.expect(result.user).toEqual(user);
                });
                vitest_1.it('returns error when no token exists', async () => {
                    mockedGetToken.mockResolvedValue(null);
                    const result = await authService_1.authService.updateProfile({ firstName: 'A' });
                    vitest_1.expect(result.success).toBe(false);
                    vitest_1.expect(result.message).toBe('No authentication token found');
                });
                vitest_1.it('returns error when authClient fails', async () => {
                    mockedGetToken.mockResolvedValue('tok');
                    mockedAuthClient.updateProfile.mockResolvedValue({
                        success: false,
                        error: { message: 'Validation failed' },
                    });
                    const result = await authService_1.authService.updateProfile({ firstName: '' });
                    vitest_1.expect(result.success).toBe(false);
                    vitest_1.expect(result.message).toBe('Validation failed');
                });
            });
            // ── deleteAccount ──────────────────────────────────────────────────────
            vitest_1.describe('authService.deleteAccount', () => {
                vitest_1.it('removes token on success', async () => {
                    mockedGetToken.mockResolvedValue('tok');
                    mockedAuthClient.deleteAccount.mockResolvedValue({
                        success: true,
                        data: { success: true, message: 'Deleted' },
                    });
                    const result = await authService_1.authService.deleteAccount();
                    vitest_1.expect(result.success).toBe(true);
                    vitest_1.expect(result.message).toBe('Deleted');
                    vitest_1.expect(mockedRemoveToken).toHaveBeenCalled();
                });
                vitest_1.it('returns error when no token exists', async () => {
                    mockedGetToken.mockResolvedValue(null);
                    const result = await authService_1.authService.deleteAccount();
                    vitest_1.expect(result.success).toBe(false);
                    vitest_1.expect(result.message).toBe('No authentication token found');
                });
                vitest_1.it('returns error when authClient fails', async () => {
                    mockedGetToken.mockResolvedValue('tok');
                    mockedAuthClient.deleteAccount.mockResolvedValue({
                        success: false,
                        error: { message: 'Cannot delete' },
                    });
                    const result = await authService_1.authService.deleteAccount();
                    vitest_1.expect(result.success).toBe(false);
                    vitest_1.expect(result.message).toBe('Cannot delete');
                    // Should NOT remove token on failure
                    vitest_1.expect(mockedRemoveToken).not.toHaveBeenCalled();
                });
            });
            // ── toAuthStatus ───────────────────────────────────────────────────────
            vitest_1.describe('authService.toAuthStatus', () => {
                vitest_1.it('returns "authenticated" for true', () => {
                    vitest_1.expect(authService_1.authService.toAuthStatus(true)).toBe('authenticated');
                });
                vitest_1.it('returns "unauthenticated" for false', () => {
                    vitest_1.expect(authService_1.authService.toAuthStatus(false)).toBe('unauthenticated');
                });
            });
        }
    };
});
