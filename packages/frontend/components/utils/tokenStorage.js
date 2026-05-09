/**
 * tokenStorage.ts
 *
 * Native-only token storage using expo-secure-store (iOS Keychain / Android Keystore).
 * Web uses tokenStorage.web.ts (resolved automatically by Metro/webpack).
 */
System.register(["expo-secure-store"], function (exports_1, context_1) {
    "use strict";
    var SecureStore, TOKEN_KEY, REFRESH_TOKEN_KEY, setStoredToken, getStoredToken, removeStoredToken, hasStoredToken, setStoredRefreshToken, getStoredRefreshToken;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (SecureStore_1) {
                SecureStore = SecureStore_1;
            }
        ],
        execute: function () {
            TOKEN_KEY = 'auth_token';
            REFRESH_TOKEN_KEY = 'refresh_token';
            exports_1("setStoredToken", setStoredToken = async (token) => {
                try {
                    await SecureStore.setItemAsync(TOKEN_KEY, token);
                }
                catch (error) {
                    if (__DEV__)
                        console.error('Error storing token:', error);
                }
            });
            exports_1("getStoredToken", getStoredToken = async () => {
                try {
                    return await SecureStore.getItemAsync(TOKEN_KEY);
                }
                catch (error) {
                    if (__DEV__)
                        console.error('Error retrieving token:', error);
                    return null;
                }
            });
            exports_1("removeStoredToken", removeStoredToken = async () => {
                try {
                    await SecureStore.deleteItemAsync(TOKEN_KEY);
                    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
                }
                catch (error) {
                    if (__DEV__)
                        console.error('Error removing token:', error);
                }
            });
            exports_1("hasStoredToken", hasStoredToken = async () => {
                try {
                    const token = await getStoredToken();
                    return token !== null && token.length > 0;
                }
                catch (error) {
                    if (__DEV__)
                        console.error('Error checking for token:', error);
                    return false;
                }
            });
            exports_1("setStoredRefreshToken", setStoredRefreshToken = async (token) => {
                try {
                    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
                }
                catch (error) {
                    if (__DEV__)
                        console.error('Error storing refresh token:', error);
                }
            });
            exports_1("getStoredRefreshToken", getStoredRefreshToken = async () => {
                try {
                    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
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
