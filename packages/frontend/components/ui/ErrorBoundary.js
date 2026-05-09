System.register(["react/jsx-runtime", "react", "react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, ErrorBoundary;
    var __moduleName = context_1 && context_1.id;
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
            }
        ],
        execute: function () {
            ErrorBoundary = class ErrorBoundary extends react_1.Component {
                constructor(props) {
                    super(props);
                    this.handleRetry = () => {
                        this.setState({ hasError: false, error: null, componentStack: null, copied: false });
                    };
                    this.buildErrorReport = () => {
                        const { error, componentStack } = this.state;
                        const url = typeof window !== 'undefined' ? window.location.href : '';
                        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
                        return [
                            `Message: ${error?.message ?? '(no message)'}`,
                            `URL: ${url}`,
                            `UA: ${ua}`,
                            '',
                            'Stack:',
                            error?.stack ?? '(no stack)',
                            '',
                            'Component stack:',
                            componentStack ?? '(no component stack)',
                        ].join('\n');
                    };
                    this.handleCopyDetails = async () => {
                        const text = this.buildErrorReport();
                        try {
                            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                                await navigator.clipboard.writeText(text);
                                this.setState({ copied: true });
                                setTimeout(() => this.setState({ copied: false }), 2000);
                            }
                        }
                        catch {
                            // Clipboard can be blocked (insecure context, denied permission). Users
                            // can still read the on-screen text and screenshot it.
                        }
                    };
                    /**
                     * Recovery path for users whose session is the cause of the crash (stale
                     * auth tokens, malformed cached state, etc.). Wipes localStorage,
                     * sessionStorage, and cookies for the current origin, then hard-reloads —
                     * the page comes back as if it's a first visit.
                     *
                     * "Try Again" alone wasn't enough: re-rendering with the same broken
                     * persisted state just loops on the same crash.
                     */
                    this.handleResetAndReload = () => {
                        if (typeof window === 'undefined')
                            return;
                        try {
                            window.localStorage?.clear();
                        }
                        catch {
                            // Ignore — some browsers block storage access in private/incognito.
                        }
                        try {
                            window.sessionStorage?.clear();
                        }
                        catch {
                            // Ignore.
                        }
                        if (typeof document !== 'undefined') {
                            try {
                                const cookies = document.cookie.split(';');
                                for (const c of cookies) {
                                    const eq = c.indexOf('=');
                                    const name = (eq > -1 ? c.substring(0, eq) : c).trim();
                                    if (!name)
                                        continue;
                                    // Expire on this path and root domain, with and without leading dot.
                                    const host = window.location.hostname;
                                    const stripped = host.replace(/^www\./, '');
                                    for (const domain of [host, '.' + stripped, stripped]) {
                                        document.cookie =
                                            name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; domain=' + domain;
                                    }
                                    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
                                }
                            }
                            catch {
                                // Ignore — best-effort.
                            }
                        }
                        window.location.replace(window.location.pathname || '/');
                    };
                    this.state = { hasError: false, error: null, componentStack: null, copied: false };
                }
                // Capture the error here (runs before render) so the fallback can show it
                // on first paint — componentDidCatch runs after render and would leave the
                // first paint empty.
                static getDerivedStateFromError(error) {
                    return { hasError: true, error };
                }
                componentDidCatch(error, info) {
                    // Log in prod too — silently swallowing crashes makes triage impossible.
                    // The component stack lets us identify which JSX site rendered an
                    // undefined element (the most common cause of React error #130 in prod).
                    console.error('ErrorBoundary caught:', error, info.componentStack);
                    if (typeof window !== 'undefined') {
                        ;
                        window.__lastErrorInfo = {
                            message: error?.message,
                            stack: error?.stack,
                            componentStack: info.componentStack,
                        };
                    }
                    this.setState({ componentStack: info.componentStack ?? null });
                }
                render() {
                    if (this.state.hasError) {
                        if (this.props.fallback) {
                            return this.props.fallback;
                        }
                        return (_jsxs(react_native_1.View, { style: {
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: 24,
                            }, children: [_jsx(react_native_1.Text, { style: {
                                        fontSize: 20,
                                        fontWeight: '600',
                                        color: '#1a1a1a',
                                        marginBottom: 8,
                                    }, children: "Something went wrong" }), _jsx(react_native_1.Text, { style: {
                                        fontSize: 14,
                                        color: '#666',
                                        textAlign: 'center',
                                        marginBottom: 24,
                                    }, children: "An unexpected error occurred. Please try again." }), _jsx(react_native_1.Pressable, { onPress: this.handleRetry, style: {
                                        backgroundColor: '#ea580c',
                                        paddingHorizontal: 24,
                                        paddingVertical: 12,
                                        borderRadius: 9999,
                                    }, children: _jsx(react_native_1.Text, { style: { color: '#fff', fontWeight: '600', fontSize: 16 }, children: "Try Again" }) }), typeof window !== 'undefined' && (_jsx(react_native_1.Pressable, { onPress: this.handleResetAndReload, style: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 10 }, children: _jsx(react_native_1.Text, { style: { color: '#666', fontSize: 13, textDecorationLine: 'underline' }, children: "Still stuck? Reset session and reload" }) })), this.state.error && (_jsxs(react_native_1.View, { style: {
                                        marginTop: 32,
                                        width: '100%',
                                        maxWidth: 640,
                                        borderWidth: 1,
                                        borderColor: '#e5e5e5',
                                        borderRadius: 8,
                                        padding: 12,
                                        backgroundColor: '#fafafa',
                                    }, children: [_jsxs(react_native_1.View, { style: {
                                                flexDirection: 'row',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: 8,
                                            }, children: [_jsx(react_native_1.Text, { style: { fontSize: 12, fontWeight: '600', color: '#666' }, children: "Debug details (beta)" }), _jsx(react_native_1.Pressable, { onPress: this.handleCopyDetails, style: {
                                                        paddingHorizontal: 10,
                                                        paddingVertical: 4,
                                                        borderRadius: 6,
                                                        backgroundColor: this.state.copied ? '#16a34a' : '#1a1a1a',
                                                    }, children: _jsx(react_native_1.Text, { style: { color: '#fff', fontSize: 12, fontWeight: '600' }, children: this.state.copied ? 'Copied' : 'Copy details' }) })] }), _jsx(react_native_1.Text, { selectable: true, style: { fontSize: 12, color: '#1a1a1a', marginBottom: 6 }, children: this.state.error.message || '(no message)' }), _jsx(react_native_1.ScrollView, { style: { maxHeight: 240 }, nestedScrollEnabled: true, children: _jsx(react_native_1.Text, { selectable: true, style: {
                                                    fontFamily: 'monospace',
                                                    fontSize: 11,
                                                    color: '#444',
                                                    lineHeight: 16,
                                                }, children: this.buildErrorReport() }) })] }))] }));
                    }
                    return this.props.children;
                }
            };
            exports_1("ErrorBoundary", ErrorBoundary);
        }
    };
});
