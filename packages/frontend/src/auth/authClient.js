System.register(["../config/api"], function (exports_1, context_1) {
    "use strict";
    var api_1, withTimeout, toError, normalizeUsername, buildUrl, safeJson, authClient;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (api_1_1) {
                api_1 = api_1_1;
            }
        ],
        execute: function () {
            withTimeout = async (input, init, timeoutMs, retries = 2) => {
                let lastError;
                for (let attempt = 0; attempt <= retries; attempt++) {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
                    try {
                        const response = await fetch(input, {
                            ...init,
                            signal: controller.signal,
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json',
                                ...(init.headers || {}),
                            },
                        });
                        clearTimeout(timeoutId);
                        // Don't retry on client/server errors — only on network failures
                        return response;
                    }
                    catch (error) {
                        clearTimeout(timeoutId);
                        lastError = error;
                        // Don't retry if user intentionally aborted or it's not a network error
                        if (error?.name === 'AbortError' && attempt === 0) {
                            throw error; // Timeout on first attempt — throw immediately
                        }
                        if (attempt < retries) {
                            // Exponential backoff: 1s, 2s
                            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
                        }
                    }
                }
                throw lastError || new Error('Network request failed');
            };
            toError = (message, status, code) => ({
                message,
                status,
                code,
            });
            normalizeUsername = (username) => username.trim().toLowerCase();
            buildUrl = (path) => `${api_1.API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
            safeJson = async (response) => {
                try {
                    return (await response.json());
                }
                catch {
                    return null;
                }
            };
            exports_1("authClient", authClient = {
                async login(payload) {
                    try {
                        const normalizedPayload = {
                            ...payload,
                            username: normalizeUsername(payload.username),
                        };
                        const response = await withTimeout(buildUrl('/auth/authenticate'), {
                            method: 'POST',
                            body: JSON.stringify(normalizedPayload),
                        }, api_1.API_TIMEOUTS.auth);
                        const data = await safeJson(response);
                        if (!response.ok || !data?.user) {
                            return {
                                success: false,
                                error: toError(data?.message || 'Invalid credentials', response.status),
                            };
                        }
                        return { success: true, data };
                    }
                    catch (error) {
                        if (error?.name === 'AbortError') {
                            return { success: false, error: toError('Request timeout. Please check your connection.') };
                        }
                        return { success: false, error: toError('Network error. Please try again.') };
                    }
                },
                async signup(payload) {
                    try {
                        const normalizedPayload = {
                            ...payload,
                            username: normalizeUsername(payload.username),
                        };
                        const response = await withTimeout(buildUrl('/auth/register'), {
                            method: 'POST',
                            body: JSON.stringify(normalizedPayload),
                        }, api_1.API_TIMEOUTS.auth);
                        const data = await safeJson(response);
                        if (!response.ok) {
                            return {
                                success: false,
                                error: toError(data?.message || 'Signup failed. Please try again.', response.status),
                            };
                        }
                        return { success: true, data: { success: true, message: data?.message } };
                    }
                    catch (error) {
                        if (error?.name === 'AbortError') {
                            return { success: false, error: toError('Request timeout. Please check your connection.') };
                        }
                        return { success: false, error: toError('Network error. Please try again.') };
                    }
                },
                async verify(token) {
                    try {
                        const response = await withTimeout(buildUrl('/auth/verify'), {
                            method: 'GET',
                            headers: { Authorization: `Bearer ${token}` },
                        }, api_1.API_TIMEOUTS.auth);
                        const data = await safeJson(response);
                        if (!response.ok || !data?.user) {
                            return {
                                success: false,
                                error: toError(data?.message || 'Session invalid', response.status),
                            };
                        }
                        return { success: true, data: { user: data.user } };
                    }
                    catch (error) {
                        if (error?.name === 'AbortError') {
                            return { success: false, error: toError('Request timeout. Please check your connection.') };
                        }
                        return { success: false, error: toError('Network error. Please try again.') };
                    }
                },
                async logout(token) {
                    try {
                        const response = await withTimeout(buildUrl('/auth/deauthenticate'), {
                            method: 'POST',
                            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                        }, api_1.API_TIMEOUTS.logout);
                        const data = await safeJson(response);
                        if (!response.ok) {
                            return {
                                success: false,
                                error: toError(data?.message || 'Logout failed', response.status),
                            };
                        }
                        return { success: true, data: { success: true, message: data?.message } };
                    }
                    catch (error) {
                        if (error?.name === 'AbortError') {
                            return { success: false, error: toError('Request timeout. Please check your connection.') };
                        }
                        return { success: false, error: toError('Network error. Please try again.') };
                    }
                },
                async checkUserExists(username) {
                    try {
                        const normalizedUsername = normalizeUsername(username);
                        const response = await withTimeout(buildUrl('/userExistence'), {
                            method: 'POST',
                            body: JSON.stringify({ username: normalizedUsername, email: normalizedUsername }),
                        }, api_1.API_TIMEOUTS.standard);
                        const data = await safeJson(response);
                        if (!response.ok || typeof data?.existence !== 'boolean') {
                            return {
                                success: false,
                                error: toError(data?.message || 'Failed to check user existence', response.status),
                            };
                        }
                        return { success: true, data: { existence: data.existence } };
                    }
                    catch (error) {
                        if (error?.name === 'AbortError') {
                            return { success: false, error: toError('Request timeout. Please check your connection.') };
                        }
                        return { success: false, error: toError('Network error. Please try again.') };
                    }
                },
                async updateProfile(token, updates) {
                    try {
                        const response = await withTimeout(buildUrl('/auth/update-profile'), {
                            method: 'PUT',
                            headers: { Authorization: `Bearer ${token}` },
                            body: JSON.stringify(updates),
                        }, api_1.API_TIMEOUTS.standard);
                        const data = await safeJson(response);
                        if (!response.ok) {
                            const message = data?.message || 'Failed to update profile';
                            return { success: false, error: toError(message, response.status) };
                        }
                        // Supports either { user } or direct user response
                        const user = data?.user ? data.user : data;
                        return { success: true, data: { user } };
                    }
                    catch (error) {
                        if (error?.name === 'AbortError') {
                            return { success: false, error: toError('Request timeout. Please check your connection.') };
                        }
                        return { success: false, error: toError('Network error. Please try again.') };
                    }
                },
                async uploadProfileImage(token, file, fileName = 'avatar.jpg') {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), api_1.API_TIMEOUTS.standard);
                    try {
                        const formData = new FormData();
                        formData.append('file', file, fileName);
                        const response = await fetch(buildUrl('/profile/uploadImage'), {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                            body: formData,
                            signal: controller.signal,
                            credentials: 'include',
                        });
                        const data = await safeJson(response);
                        if (!response.ok || !data?.imageUrl) {
                            return {
                                success: false,
                                error: toError(data?.message || 'Failed to upload profile image', response.status),
                            };
                        }
                        return { success: true, data: { imageUrl: data.imageUrl } };
                    }
                    catch (error) {
                        if (error?.name === 'AbortError') {
                            return { success: false, error: toError('Upload timeout. Please check your connection.') };
                        }
                        return { success: false, error: toError('Network error. Please try again.') };
                    }
                    finally {
                        clearTimeout(timeoutId);
                    }
                },
                async refreshToken(refreshToken) {
                    try {
                        const response = await withTimeout(buildUrl('/auth/refresh'), {
                            method: 'POST',
                            body: JSON.stringify({ refreshToken }),
                        }, api_1.API_TIMEOUTS.auth);
                        const data = await safeJson(response);
                        if (!response.ok || !data?.token) {
                            return {
                                success: false,
                                error: toError(data?.message || 'Failed to refresh token', response.status),
                            };
                        }
                        return { success: true, data };
                    }
                    catch (error) {
                        if (error?.name === 'AbortError') {
                            return { success: false, error: toError('Request timeout. Please check your connection.') };
                        }
                        return { success: false, error: toError('Network error. Please try again.') };
                    }
                },
                async deleteAccount(token) {
                    try {
                        const response = await withTimeout(buildUrl('/auth/delete-account'), {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` },
                        }, api_1.API_TIMEOUTS.standard);
                        const data = await safeJson(response);
                        if (!response.ok) {
                            return {
                                success: false,
                                error: toError(data?.message || 'Failed to delete account', response.status),
                            };
                        }
                        return { success: true, data: { success: true, message: data?.message } };
                    }
                    catch (error) {
                        if (error?.name === 'AbortError') {
                            return { success: false, error: toError('Request timeout. Please check your connection.') };
                        }
                        return { success: false, error: toError('Network error. Please try again.') };
                    }
                },
            });
        }
    };
});
