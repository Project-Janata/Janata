System.register(["react/jsx-runtime", "react", "posthog-react-native", "../utils/tokenStorage", "../utils/onboardingStorage", "../../src/auth/authService", "../../src/config/api"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, posthog_react_native_1, tokenStorage_1, onboardingStorage_1, authService_1, api_1, UserContext, useUser, getUserInitials, resolveEndpointUrl, userTraits, UserProvider;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (posthog_react_native_1_1) {
                posthog_react_native_1 = posthog_react_native_1_1;
            },
            function (tokenStorage_1_1) {
                tokenStorage_1 = tokenStorage_1_1;
            },
            function (onboardingStorage_1_1) {
                onboardingStorage_1 = onboardingStorage_1_1;
            },
            function (authService_1_1) {
                authService_1 = authService_1_1;
            },
            function (api_1_1) {
                api_1 = api_1_1;
            }
        ],
        execute: function () {
            UserContext = react_1.createContext(undefined);
            exports_1("useUser", useUser = () => {
                const context = react_1.useContext(UserContext);
                if (!context) {
                    throw new Error('useUser must be used within a UserProvider');
                }
                return context;
            });
            // Helper function to get user initials
            exports_1("getUserInitials", getUserInitials = (user) => {
                if (!user)
                    return '?';
                if (user.firstName && user.lastName) {
                    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
                }
                if (user.firstName)
                    return user.firstName[0].toUpperCase();
                if (user.username)
                    return user.username[0].toUpperCase();
                return '?';
            });
            resolveEndpointUrl = (endpoint) => {
                // Already a full URL — use as-is
                if (/^https?:\/\//i.test(endpoint))
                    return endpoint;
                const normalizedBase = api_1.API_BASE_URL.replace(/\/+$/, '');
                // Strip /api or /api/ prefix to avoid double-pathing since API_BASE_URL already includes /api
                const normalizedEndpoint = endpoint.replace(/^\/api(?=\/|$)/, '');
                // Ensure exactly one slash between base and endpoint
                if (normalizedEndpoint.startsWith('/')) {
                    return `${normalizedBase}${normalizedEndpoint}`;
                }
                if (normalizedEndpoint === '') {
                    return normalizedBase;
                }
                return `${normalizedBase}/${normalizedEndpoint}`;
            };
            /** Helper to build the PostHog person properties from a User object */
            userTraits = (u) => ({
                email: u.email,
                firstName: u.firstName,
                lastName: u.lastName,
                profileComplete: u.profileComplete,
            });
            exports_1("UserProvider", UserProvider = ({ children }) => {
                const posthog = posthog_react_native_1.usePostHog();
                const [user, setUser] = react_1.useState(null);
                const [authStatus, setAuthStatus] = react_1.useState('booting');
                const [onboardingComplete, setOnboardingCompleteState] = react_1.useState(false);
                const loading = authStatus === 'booting';
                const login = react_1.useCallback(async (username, password) => {
                    const result = await authService_1.authService.login(username, password);
                    if (!result.success) {
                        posthog?.capture('login_failed', { reason: result.message });
                        return { success: false, message: result.message };
                    }
                    setUser(result.user || null);
                    setAuthStatus('authenticated');
                    if (result.user) {
                        posthog?.identify(result.user.username, userTraits(result.user));
                    }
                    posthog?.capture('login_success');
                    return { success: true };
                }, [posthog]);
                const signup = react_1.useCallback(async (username, password, inviteCode) => {
                    const result = await authService_1.authService.signup(username, password, inviteCode);
                    if (!result.success || !result.user) {
                        posthog?.capture('signup_failed', { reason: result.message });
                        return { success: false, message: result.message || 'Signup failed. Please try again.' };
                    }
                    setUser(result.user);
                    setAuthStatus('authenticated');
                    posthog?.identify(result.user.username, userTraits(result.user));
                    posthog?.capture('signup_success');
                    return { success: true };
                }, [posthog]);
                const logout = react_1.useCallback(async () => {
                    posthog?.capture('logout');
                    posthog?.reset();
                    await authService_1.authService.logout();
                    await onboardingStorage_1.clearOnboardingComplete();
                    setUser(null);
                    setAuthStatus('unauthenticated');
                    setOnboardingCompleteState(false);
                }, [posthog]);
                const checkUserExists = react_1.useCallback(async (username) => {
                    const result = await authService_1.authService.checkUserExists(username);
                    if (!result.success || typeof result.existence !== 'boolean') {
                        throw new Error(result.message || 'Failed to check user existence');
                    }
                    return result.existence;
                }, []);
                const authenticatedFetch = react_1.useCallback(async (endpoint, options = {}) => {
                    const token = await tokenStorage_1.getStoredToken();
                    if (!token) {
                        throw new Error('No authentication token found');
                    }
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), api_1.API_TIMEOUTS.standard);
                    try {
                        const headers = {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                            ...(options.headers || {}),
                        };
                        const response = await fetch(resolveEndpointUrl(endpoint), {
                            ...options,
                            headers,
                            signal: controller.signal,
                            credentials: 'include',
                        });
                        if (response.status === 401 || response.status === 403) {
                            await tokenStorage_1.removeStoredToken();
                            setUser(null);
                            setAuthStatus('unauthenticated');
                            throw new Error('Session expired. Please login again.');
                        }
                        return response;
                    }
                    catch (error) {
                        if (error?.name === 'AbortError') {
                            throw new Error('Request timeout. Please check your connection.');
                        }
                        throw error;
                    }
                    finally {
                        clearTimeout(timeoutId);
                    }
                }, []);
                const deleteAccount = react_1.useCallback(async () => {
                    const result = await authService_1.authService.deleteAccount();
                    if (!result.success) {
                        posthog?.capture('delete_account_failed', { reason: result.message });
                        return { success: false, message: result.message || 'Failed to delete account' };
                    }
                    posthog?.capture('account_deleted');
                    posthog?.reset();
                    await onboardingStorage_1.clearOnboardingComplete();
                    setUser(null);
                    setAuthStatus('unauthenticated');
                    setOnboardingCompleteState(false);
                    return { success: true, message: result.message || 'Account deleted successfully' };
                }, [posthog]);
                const updateProfile = react_1.useCallback(async (updates) => {
                    // Save previous user state for rollback on failure
                    let previousUser = null;
                    setUser((prev) => {
                        previousUser = prev;
                        return prev ? { ...prev, ...updates } : null;
                    });
                    const result = await authService_1.authService.updateProfile(updates);
                    if (!result.success || !result.user) {
                        // Rollback optimistic update on failure
                        setUser(previousUser);
                        posthog?.capture('profile_update_failed', { reason: result.message });
                        return { success: false, message: result.message || 'Failed to update profile' };
                    }
                    setUser(result.user);
                    posthog?.capture('profile_updated', { fields: Object.keys(updates) });
                    if (updates.profileComplete || result.user.profileComplete) {
                        await onboardingStorage_1.setOnboardingComplete(true);
                        setOnboardingCompleteState(true);
                    }
                    return { success: true };
                }, [posthog]);
                const setDevSession = react_1.useCallback(async (devUser, completed) => {
                    setUser(devUser);
                    setAuthStatus('authenticated');
                    setOnboardingCompleteState(!!completed);
                    if (completed) {
                        await onboardingStorage_1.setOnboardingComplete(true);
                    }
                    else {
                        await onboardingStorage_1.clearOnboardingComplete();
                    }
                }, []);
                react_1.useEffect(() => {
                    let isMounted = true;
                    const loadUser = async () => {
                        try {
                            const token = await tokenStorage_1.getStoredToken();
                            if (!isMounted)
                                return;
                            if (!token) {
                                setUser(null);
                                setAuthStatus('unauthenticated');
                                return;
                            }
                            const session = await authService_1.authService.bootstrapSession();
                            if (!isMounted)
                                return;
                            setUser(session.user);
                            setAuthStatus(session.authStatus);
                            // Identify returning user in PostHog
                            if (session.user && session.authStatus === 'authenticated') {
                                posthog?.identify(session.user.username, userTraits(session.user));
                            }
                            const storedOnboarding = await onboardingStorage_1.getOnboardingComplete();
                            const derivedComplete = session.user?.profileComplete === true ||
                                (!!session.user?.firstName && !!session.user?.lastName && !!session.user?.email);
                            const finalComplete = storedOnboarding || derivedComplete;
                            setOnboardingCompleteState(finalComplete);
                            if (derivedComplete && !storedOnboarding) {
                                await onboardingStorage_1.setOnboardingComplete(true);
                            }
                        }
                        catch {
                            if (!isMounted)
                                return;
                            await tokenStorage_1.removeStoredToken();
                            setUser(null);
                            setAuthStatus('unauthenticated');
                            setOnboardingCompleteState(false);
                        }
                    };
                    loadUser();
                    return () => {
                        isMounted = false;
                    };
                }, [posthog]);
                const contextValue = react_1.useMemo(() => ({
                    user,
                    loading,
                    authStatus,
                    onboardingComplete,
                    login,
                    signup,
                    logout,
                    checkUserExists,
                    setUser,
                    getToken: tokenStorage_1.getStoredToken,
                    authenticatedFetch,
                    deleteAccount,
                    updateProfile,
                    setDevSession,
                    getUserInitials: () => getUserInitials(user),
                }), [
                    user,
                    loading,
                    authStatus,
                    onboardingComplete,
                    login,
                    signup,
                    logout,
                    checkUserExists,
                    authenticatedFetch,
                    deleteAccount,
                    updateProfile,
                    setDevSession,
                ]);
                return _jsx(UserContext.Provider, { value: contextValue, children: children });
            });
            exports_1("default", UserContext);
        }
    };
});
