System.register(["react/jsx-runtime", "react-native", "../components/contexts"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, contexts_1;
    var __moduleName = context_1 && context_1.id;
    function CookiePolicy() {
        const { isDark } = contexts_1.useTheme();
        const bg = isDark ? '#171717' : '#FAFAF7';
        const heading = isDark ? '#F5F5F4' : '#1C1917';
        const body = isDark ? '#D6D3D1' : '#44403C';
        const muted = isDark ? '#A8A29E' : '#78716C';
        const border = isDark ? '#262626' : '#E7E5E4';
        return (_jsx(react_native_1.ScrollView, { style: { flex: 1, backgroundColor: bg }, children: _jsxs(react_native_1.View, { style: { padding: 24, maxWidth: 800, alignSelf: 'center' }, children: [_jsx(react_native_1.Text, { style: { fontSize: 36, fontWeight: 'bold', marginBottom: 8, color: heading }, children: "Cookie Policy" }), _jsx(react_native_1.Text, { style: { fontSize: 14, color: muted, marginBottom: 32 }, children: "Last updated: March 2026" }), _jsx(react_native_1.Text, { style: { fontSize: 15, color: body, lineHeight: 24, marginBottom: 24 }, children: "This Cookie Policy explains what Cookies are and how Chinmaya Janata uses them on our mobile application and website." }), _jsx(react_native_1.Text, { style: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }, children: "1. What Are Cookies" }), _jsx(react_native_1.Text, { style: { fontSize: 15, color: body, lineHeight: 24 }, children: "Cookies are small text files stored on your device when you visit websites or use applications. They help remember your preferences, analyze site traffic, and enhance your user experience." }), _jsx(react_native_1.Text, { style: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }, children: "2. Types of Cookies We Use" }), _jsx(react_native_1.Text, { style: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8, color: heading }, children: "Essential Cookies" }), _jsx(react_native_1.Text, { style: { fontSize: 15, color: body, lineHeight: 24 }, children: "These cookies are necessary for the Service to function. They enable authentication, session management, and security features." }), _jsx(react_native_1.Text, { style: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8, color: heading }, children: "Functional Cookies" }), _jsx(react_native_1.Text, { style: { fontSize: 15, color: body, lineHeight: 24 }, children: "These cookies remember your preferences and settings, such as your selected center and theme preferences." }), _jsx(react_native_1.Text, { style: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8, color: heading }, children: "Analytics Cookies" }), _jsx(react_native_1.Text, { style: { fontSize: 15, color: body, lineHeight: 24 }, children: "We use analytics cookies to understand how users interact with our Service. These cookies collect anonymous information to help us improve the Service." }), _jsx(react_native_1.Text, { style: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }, children: "3. Managing Cookies" }), _jsx(react_native_1.Text, { style: { fontSize: 15, color: body, lineHeight: 24, marginBottom: 8 }, children: "You can control or disable cookies through your browser or device settings. Note that blocking essential cookies may prevent the Service from functioning properly." }), _jsx(react_native_1.Text, { style: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }, children: "4. Third-Party Cookies" }), _jsx(react_native_1.Text, { style: { fontSize: 15, color: body, lineHeight: 24 }, children: "We do not use third-party advertising cookies. Our analytics are provided through Cloudflare for security and performance purposes." }), _jsx(react_native_1.Text, { style: { fontSize: 18, fontWeight: '600', marginTop: 24, marginBottom: 12, color: heading }, children: "5. Contact Us" }), _jsxs(react_native_1.Text, { style: { fontSize: 15, color: body, lineHeight: 24 }, children: ["If you have questions about our use of cookies, please contact us:", '\n', "Email: info@chinmayajanata.org", '\n', "Address: Chinmaya Mission West, 83900 Highway 271, Piercy, CA 95587", '\n', "Phone: 707-247-3488"] }), _jsx(react_native_1.View, { style: { marginTop: 48, paddingTop: 24, borderTopWidth: 1, borderTopColor: border }, children: _jsx(react_native_1.Text, { style: { fontSize: 13, color: muted }, children: "\u00A9 2026 Chinmaya Janata. Built with love by CHYKs." }) })] }) }));
    }
    exports_1("default", CookiePolicy);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            }
        ],
        execute: function () {
        }
    };
});
