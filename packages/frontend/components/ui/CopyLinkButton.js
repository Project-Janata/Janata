System.register(["react/jsx-runtime", "react", "react-native", "lucide-react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, lucide_react_native_1, FALLBACK_ORIGIN;
    var __moduleName = context_1 && context_1.id;
    function buildShareUrl(path) {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        if (typeof window !== 'undefined' && window.location?.origin) {
            return `${window.location.origin}${cleanPath}`;
        }
        return `${FALLBACK_ORIGIN}${cleanPath}`;
    }
    function CopyLinkButton({ path, color = '#78716C', variant = 'inline' }) {
        const [copied, setCopied] = react_1.useState(false);
        const handlePress = react_1.useCallback(async () => {
            const url = buildShareUrl(path);
            try {
                if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(url);
                }
                else {
                    // No clipboard API (likely older mobile webviews). Fall back to a
                    // textarea selection trick so the action still works.
                    if (typeof document !== 'undefined') {
                        const ta = document.createElement('textarea');
                        ta.value = url;
                        ta.style.position = 'fixed';
                        ta.style.opacity = '0';
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                    }
                }
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
            }
            catch {
                // Silently swallow — the user can still copy from the URL bar.
            }
        }, [path]);
        if (variant === 'icon') {
            return (_jsx(react_native_1.Pressable, { onPress: handlePress, style: {
                    padding: 8,
                    minHeight: 44,
                    minWidth: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                }, accessibilityLabel: copied ? 'Link copied' : 'Copy link', children: copied ? _jsx(lucide_react_native_1.Check, { size: 18, color: "#16A34A" }) : _jsx(lucide_react_native_1.Link2, { size: 18, color: color }) }));
        }
        return (_jsx(react_native_1.Pressable, { onPress: handlePress, style: {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 6,
                minHeight: 32,
            }, accessibilityLabel: copied ? 'Link copied' : 'Copy link', children: copied ? (_jsxs(_Fragment, { children: [_jsx(lucide_react_native_1.Check, { size: 14, color: "#16A34A" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: '#16A34A' }, children: "Copied" })] })) : (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 6 }, children: [_jsx(lucide_react_native_1.Link2, { size: 14, color: color }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color }, children: "Copy link" })] })) }));
    }
    exports_1("default", CopyLinkButton);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            }
        ],
        execute: function () {
            FALLBACK_ORIGIN = 'https://chinmayajanata.org';
        }
    };
});
