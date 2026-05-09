System.register(["react", "react-native"], function (exports_1, context_1) {
    "use strict";
    var react_1, react_native_1;
    var __moduleName = context_1 && context_1.id;
    /**
     * Custom hook for loading fonts on web using CSS font loading
     * This is a web-specific alternative to expo-font
     */
    function useWebFonts() {
        const [loaded, setLoaded] = react_1.useState(react_native_1.Platform.OS !== 'web');
        const [error, setError] = react_1.useState(null);
        react_1.useEffect(() => {
            if (react_native_1.Platform.OS !== 'web') {
                return;
            }
            // Check if fonts are already loaded - production safe
            if (document?.fonts && document.fonts.check) {
                const checkFonts = async () => {
                    try {
                        // Check if our main font is loaded
                        const isLoaded = document.fonts.check('16px "Inclusive Sans"');
                        if (isLoaded) {
                            setLoaded(true);
                            return;
                        }
                        // Wait for fonts to load
                        await document.fonts.ready;
                        setLoaded(true);
                    }
                    catch (err) {
                        setError(err);
                        setLoaded(true); // Fallback to loaded state
                    }
                };
                checkFonts();
            }
            else {
                // Fallback for browsers without Font Loading API
                setTimeout(() => setLoaded(true), 100);
            }
        }, []);
        return [loaded, error];
    }
    exports_1("useWebFonts", useWebFonts);
    return {
        setters: [
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            }
        ],
        execute: function () {
        }
    };
});
