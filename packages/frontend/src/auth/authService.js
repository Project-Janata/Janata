System.register(["./authClient", "../../components/utils/tokenStorage"], function (exports_1, context_1) {
    "use strict";
    var authClient_1, tokenStorage_1, authService;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (authClient_1_1) {
                authClient_1 = authClient_1_1;
            },
            function (tokenStorage_1_1) {
                tokenStorage_1 = tokenStorage_1_1;
            }
        ],
        execute: function () {
            exports_1("authService", authService = {
                async bootstrapSession() {
                    try {
                        const token = await tokenStorage_1.getStoredToken();
                        if (!token) {
                            return { authStatus: 'unauthenticated', user: null };
                        }
                        const verifyResult = await authClient_1.authClient.verify(token);
                        if (verifyResult.success) {
                            return { authStatus: 'authenticated', user: verifyResult.data.user };
                        }
                        // Access token invalid/expired — try refreshing
                        const refreshToken = await tokenStorage_1.getStoredRefreshToken();
                        if (refreshToken) {
                            const refreshResult = await authClient_1.authClient.refreshToken(refreshToken);
                            if (refreshResult.success && refreshResult.data.token) {
                                await tokenStorage_1.setStoredToken(refreshResult.data.token);
                                if (refreshResult.data.refreshToken) {
                                    await tokenStorage_1.setStoredRefreshToken(refreshResult.data.refreshToken);
                                }
                                return { authStatus: 'authenticated', user: refreshResult.data.user };
                            }
                        }
                        await tokenStorage_1.removeStoredToken();
                        return { authStatus: 'unauthenticated', user: null };
                    }
                    catch {
                        await tokenStorage_1.removeStoredToken();
                        return { authStatus: 'unauthenticated', user: null };
                    }
                },
                async login(username, password) {
                    const result = await authClient_1.authClient.login({ username, password });
                    if (!result.success) {
                        return { success: false, message: result.error.message };
                    }
                    if (result.data.token) {
                        await tokenStorage_1.setStoredToken(result.data.token);
                    }
                    if (result.data.refreshToken) {
                        await tokenStorage_1.setStoredRefreshToken(result.data.refreshToken);
                    }
                    return { success: true, user: result.data.user };
                },
                async signup(username, password, inviteCode) {
                    const signupResult = await authClient_1.authClient.signup({ username, password, inviteCode });
                    if (!signupResult.success) {
                        return { success: false, message: signupResult.error.message };
                    }
                    return authService.login(username, password);
                },
                async logout() {
                    try {
                        const token = await tokenStorage_1.getStoredToken();
                        await authClient_1.authClient.logout(token || undefined);
                    }
                    finally {
                        await tokenStorage_1.removeStoredToken();
                    }
                },
                async checkUserExists(username) {
                    const result = await authClient_1.authClient.checkUserExists(username);
                    if (!result.success) {
                        return { success: false, message: result.error.message };
                    }
                    return { success: true, existence: result.data.existence };
                },
                async updateProfile(updates) {
                    const token = await tokenStorage_1.getStoredToken();
                    if (!token) {
                        return { success: false, message: 'No authentication token found' };
                    }
                    const result = await authClient_1.authClient.updateProfile(token, updates);
                    if (!result.success) {
                        return { success: false, message: result.error.message };
                    }
                    return { success: true, user: result.data.user };
                },
                async uploadProfileImage(file, fileName) {
                    const token = await tokenStorage_1.getStoredToken();
                    if (!token) {
                        return { success: false, message: 'No authentication token found' };
                    }
                    const result = await authClient_1.authClient.uploadProfileImage(token, file, fileName);
                    if (!result.success) {
                        return { success: false, message: result.error.message };
                    }
                    return { success: true, imageUrl: result.data.imageUrl };
                },
                async deleteAccount() {
                    const token = await tokenStorage_1.getStoredToken();
                    if (!token) {
                        return { success: false, message: 'No authentication token found' };
                    }
                    const result = await authClient_1.authClient.deleteAccount(token);
                    if (!result.success) {
                        return { success: false, message: result.error.message };
                    }
                    await tokenStorage_1.removeStoredToken();
                    return { success: true, message: result.data.message };
                },
                toAuthStatus(isAuthenticated) {
                    return isAuthenticated ? 'authenticated' : 'unauthenticated';
                },
            });
        }
    };
});
