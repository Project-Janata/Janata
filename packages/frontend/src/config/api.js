System.register(["react-native"], function (exports_1, context_1) {
    "use strict";
    var react_native_1, DEV_API_URL, PROD_API_URL, envBaseUrl, API_BASE_URL, API_TIMEOUTS, API_ENDPOINTS, DEFAULT_FETCH_OPTIONS, buildApiUrl;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            }
        ],
        execute: function () {
            DEV_API_URL = react_native_1.Platform.OS === 'android'
                ? 'http://10.0.2.2:8787/api'
                : 'http://localhost:8787/api';
            PROD_API_URL = 'https://api.chinmayajanata.org/api';
            envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
            exports_1("API_BASE_URL", API_BASE_URL = envBaseUrl && envBaseUrl.length > 0
                ? envBaseUrl
                : typeof __DEV__ !== 'undefined' && __DEV__
                    ? DEV_API_URL
                    : PROD_API_URL);
            exports_1("API_TIMEOUTS", API_TIMEOUTS = {
                auth: 60000,
                logout: 30000,
                standard: 60000,
            });
            exports_1("API_ENDPOINTS", API_ENDPOINTS = {
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
            });
            exports_1("DEFAULT_FETCH_OPTIONS", DEFAULT_FETCH_OPTIONS = {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            exports_1("buildApiUrl", buildApiUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`);
        }
    };
});
