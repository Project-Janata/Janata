System.register(["vitest/config"], function (exports_1, context_1) {
    "use strict";
    var config_1;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (config_1_1) {
                config_1 = config_1_1;
            }
        ],
        execute: function () {
            exports_1("default", config_1.defineConfig({
                test: {
                    globals: true,
                    environment: 'node',
                    include: ['src/__tests__/**/*.test.{ts,tsx}'],
                    exclude: ['src/__tests__/app/**/*.test.tsx'],
                    setupFiles: ['src/__tests__/setup.ts'],
                },
                resolve: {
                    alias: {
                        'react-native': 'react-native-web',
                    },
                },
            }));
        }
    };
});
