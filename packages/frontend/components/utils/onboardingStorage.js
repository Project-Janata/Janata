/**
 * onboardingStorage.ts
 *
 * Utility functions for storing onboarding completion state
 */
System.register(["@react-native-async-storage/async-storage", "react-native"], function (exports_1, context_1) {
    "use strict";
    var async_storage_1, react_native_1, ONBOARDING_KEY, setCookie, getCookie, eraseCookie, setOnboardingComplete, getOnboardingComplete, clearOnboardingComplete;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (async_storage_1_1) {
                async_storage_1 = async_storage_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            }
        ],
        execute: function () {
            ONBOARDING_KEY = '@onboarding_complete';
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
            eraseCookie = (name) => {
                if (typeof document === 'undefined')
                    return;
                document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            };
            exports_1("setOnboardingComplete", setOnboardingComplete = async (value) => {
                try {
                    const serialized = value ? '1' : '0';
                    if (react_native_1.Platform.OS === 'web') {
                        if (typeof window !== 'undefined') {
                            try {
                                localStorage.setItem(ONBOARDING_KEY, serialized);
                            }
                            catch (e) { }
                            setCookie(ONBOARDING_KEY, serialized, 30);
                        }
                    }
                    else {
                        await async_storage_1.default.setItem(ONBOARDING_KEY, serialized);
                    }
                }
                catch (error) {
                    if (__DEV__)
                        console.error('Error storing onboarding state:', error);
                }
            });
            exports_1("getOnboardingComplete", getOnboardingComplete = async () => {
                try {
                    if (react_native_1.Platform.OS === 'web') {
                        if (typeof window !== 'undefined') {
                            try {
                                const stored = localStorage.getItem(ONBOARDING_KEY);
                                if (stored)
                                    return stored === '1';
                            }
                            catch (e) { }
                            const cookie = getCookie(ONBOARDING_KEY);
                            return cookie === '1';
                        }
                        return false;
                    }
                    const value = await async_storage_1.default.getItem(ONBOARDING_KEY);
                    return value === '1';
                }
                catch (error) {
                    if (__DEV__)
                        console.error('Error retrieving onboarding state:', error);
                    return false;
                }
            });
            exports_1("clearOnboardingComplete", clearOnboardingComplete = async () => {
                try {
                    if (react_native_1.Platform.OS === 'web') {
                        if (typeof window !== 'undefined') {
                            try {
                                localStorage.removeItem(ONBOARDING_KEY);
                            }
                            catch (e) { }
                            eraseCookie(ONBOARDING_KEY);
                        }
                    }
                    else {
                        await async_storage_1.default.removeItem(ONBOARDING_KEY);
                    }
                }
                catch (error) {
                    if (__DEV__)
                        console.error('Error clearing onboarding state:', error);
                }
            });
        }
    };
});
