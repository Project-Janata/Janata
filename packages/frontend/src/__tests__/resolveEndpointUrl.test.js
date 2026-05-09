System.register(["vitest"], function (exports_1, context_1) {
    "use strict";
    var vitest_1, API_BASE_URL, resolveEndpointUrl;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (vitest_1_1) {
                vitest_1 = vitest_1_1;
            }
        ],
        execute: function () {
            API_BASE_URL = 'http://localhost:8787/api';
            /**
             * Exact copy of the resolveEndpointUrl function from UserContext.tsx lines 61-78.
             */
            resolveEndpointUrl = (endpoint) => {
                if (/^https?:\/\//i.test(endpoint))
                    return endpoint;
                const normalizedBase = API_BASE_URL.replace(/\/+$/, '');
                const normalizedEndpoint = endpoint.replace(/^\/api(?=\/|$)/, '');
                if (normalizedEndpoint.startsWith('/')) {
                    return `${normalizedBase}${normalizedEndpoint}`;
                }
                if (normalizedEndpoint === '') {
                    return normalizedBase;
                }
                return `${normalizedBase}/${normalizedEndpoint}`;
            };
            vitest_1.describe('resolveEndpointUrl', () => {
                vitest_1.it('passes through full URLs unchanged', () => {
                    vitest_1.expect(resolveEndpointUrl('https://example.com/api/test')).toBe('https://example.com/api/test');
                });
                vitest_1.it('passes through http URLs unchanged', () => {
                    vitest_1.expect(resolveEndpointUrl('http://other.com/path')).toBe('http://other.com/path');
                });
                vitest_1.it('is case-insensitive for protocol detection', () => {
                    vitest_1.expect(resolveEndpointUrl('HTTPS://example.com/test')).toBe('HTTPS://example.com/test');
                });
                vitest_1.it('strips /api prefix from /api/auth/me', () => {
                    vitest_1.expect(resolveEndpointUrl('/api/auth/me')).toBe('http://localhost:8787/api/auth/me');
                });
                vitest_1.it('strips /api/ to produce trailing slash', () => {
                    vitest_1.expect(resolveEndpointUrl('/api/')).toBe('http://localhost:8787/api/');
                });
                vitest_1.it('strips /api exactly (no trailing slash)', () => {
                    vitest_1.expect(resolveEndpointUrl('/api')).toBe('http://localhost:8787/api');
                });
                vitest_1.it('handles /auth/me (no /api prefix)', () => {
                    vitest_1.expect(resolveEndpointUrl('/auth/me')).toBe('http://localhost:8787/api/auth/me');
                });
                vitest_1.it('handles relative path without leading slash', () => {
                    vitest_1.expect(resolveEndpointUrl('auth/me')).toBe('http://localhost:8787/api/auth/me');
                });
                vitest_1.it('handles empty string', () => {
                    vitest_1.expect(resolveEndpointUrl('')).toBe('http://localhost:8787/api');
                });
            });
            vitest_1.describe('resolveEndpointUrl with trailing slash on BASE', () => {
                const BASE_WITH_SLASH = 'http://localhost:8787/api/';
                const resolveWithSlash = (endpoint) => {
                    if (/^https?:\/\//i.test(endpoint))
                        return endpoint;
                    const normalizedBase = BASE_WITH_SLASH.replace(/\/+$/, '');
                    const normalizedEndpoint = endpoint.replace(/^\/api(?=\/|$)/, '');
                    if (normalizedEndpoint.startsWith('/')) {
                        return `${normalizedBase}${normalizedEndpoint}`;
                    }
                    if (normalizedEndpoint === '') {
                        return normalizedBase;
                    }
                    return `${normalizedBase}/${normalizedEndpoint}`;
                };
                vitest_1.it('strips trailing slash from base and resolves correctly', () => {
                    vitest_1.expect(resolveWithSlash('/auth/me')).toBe('http://localhost:8787/api/auth/me');
                });
                vitest_1.it('handles /api/auth/me with trailing slash base', () => {
                    vitest_1.expect(resolveWithSlash('/api/auth/me')).toBe('http://localhost:8787/api/auth/me');
                });
                vitest_1.it('handles empty string with trailing slash base', () => {
                    vitest_1.expect(resolveWithSlash('')).toBe('http://localhost:8787/api');
                });
                vitest_1.it('handles relative path with trailing slash base', () => {
                    vitest_1.expect(resolveWithSlash('auth/me')).toBe('http://localhost:8787/api/auth/me');
                });
            });
        }
    };
});
