/**
 * tokenStorage.web.ts
 *
 * Web-specific implementation using localStorage with Cookie fallback
 * This avoids importing AsyncStorage entirely on web
 */
System.register([], function (exports_1, context_1) {
    "use strict";
    var TOKEN_KEY, REFRESH_TOKEN_KEY, setCookie, getCookie, eraseCookie, setStoredToken, getStoredToken, removeStoredToken, hasStoredToken, setStoredRefreshToken, getStoredRefreshToken;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            TOKEN_KEY = '@auth_token';
            REFRESH_TOKEN_KEY = '@refresh_token';
            // Helper to set cookie
            setCookie = (name, value, days) => {
                if (typeof document === 'undefined')
                    return;
                let expires = '';
                if (days) {
                    const date = new Date();
                    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
                    expires = '; expires=' + date.toUTCString();
                }
                document.cookie = name + '=' + (value || '') + expires + '; path=/';
            };
            // Helper to get cookie
            getCookie = (name) => {
                if (typeof document === 'undefined')
                    return null;
                const nameEQ = name + '=';
                const ca = document.cookie.split(';');
                for (let i = 0; i < ca.length; i++) {
                    let c = ca[i];
                    while (c.charAt(0) === ' ')
                        c = c.substring(1, c.length);
                    if (c.indexOf(nameEQ) === 0)
                        return c.substring(nameEQ.length, c.length);
                }
                return null;
            };
            // Helper to erase cookie
            eraseCookie = (name) => {
                if (typeof document === 'undefined')
                    return;
                document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            };
            exports_1("setStoredToken", setStoredToken = async (token) => {
                try {
                    if (typeof window !== 'undefined') {
                        // Try localStorage first
                        try {
                            localStorage.setItem(TOKEN_KEY, token);
                        }
                        catch (e) {
                            // Ignore localStorage errors
                        }
                        // Also set cookie as backup for ITP
                        setCookie(TOKEN_KEY, token, 7);
                    }
                }
                catch (error) {
                    if (__DEV__)
                        console.error('Error storing token:', error);
                }
            });
            exports_1("getStoredToken", getStoredToken = async () => {
                try {
                    if (typeof window !== 'undefined') {
                        // Try localStorage
                        try {
                            const localToken = localStorage.getItem(TOKEN_KEY);
                            if (localToken)
                                return localToken;
                        }
                        catch (e) {
                            // Ignore localStorage errors
                        }
                        // Fallback to cookie
                        return getCookie(TOKEN_KEY);
                    }
                    return null;
                }
                catch (error) {
                    if (__DEV__)
                        console.error('Error retrieving token:', error);
                    return null;
                }
            });
            exports_1("removeStoredToken", removeStoredToken = async () => {
                try {
                    if (typeof window !== 'undefined') {
                        try {
                            localStorage.removeItem(TOKEN_KEY);
                            localStorage.removeItem(REFRESH_TOKEN_KEY);
                        }
                        catch (e) { }
                        eraseCookie(TOKEN_KEY);
                        eraseCookie(REFRESH_TOKEN_KEY);
                    }
                }
                catch (error) {
                    if (__DEV__)
                        console.error('Error removing token:', error);
                }
            });
            exports_1("hasStoredToken", hasStoredToken = async () => {
                const token = await getStoredToken();
                return !!token;
            });
            exports_1("setStoredRefreshToken", setStoredRefreshToken = async (token) => {
                try {
                    if (typeof window !== 'undefined') {
                        try {
                            localStorage.setItem(REFRESH_TOKEN_KEY, token);
                        }
                        catch (e) { }
                        setCookie(REFRESH_TOKEN_KEY, token, 90);
                    }
                }
                catch (error) {
                    if (__DEV__)
                        console.error('Error storing refresh token:', error);
                }
            });
            exports_1("getStoredRefreshToken", getStoredRefreshToken = async () => {
                try {
                    if (typeof window !== 'undefined') {
                        try {
                            const localToken = localStorage.getItem(REFRESH_TOKEN_KEY);
                            if (localToken)
                                return localToken;
                        }
                        catch (e) { }
                        return getCookie(REFRESH_TOKEN_KEY);
                    }
                    return null;
                }
                catch (error) {
                    if (__DEV__)
                        console.error('Error retrieving refresh token:', error);
                    return null;
                }
            });
        }
    };
});
