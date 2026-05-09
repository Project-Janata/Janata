System.register(["react/jsx-runtime", "expo-router/html"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, html_1;
    var __moduleName = context_1 && context_1.id;
    // This file is web-only and used to configure the root HTML for every
    // web page during static rendering.
    // The contents of this function only run in Node.js environments and
    // do not have access to the DOM or browser APIs.
    function Root({ children }) {
        return (_jsxs("html", { lang: "en", children: [_jsxs("head", { children: [_jsx("meta", { charSet: "utf-8" }), _jsx("meta", { httpEquiv: "X-UA-Compatible", content: "IE=edge" }), _jsx("title", { children: "Chinmaya Janata \u2014 Connect with Your Chinmaya Community" }), _jsx("meta", { name: "description", content: "Chinmaya Janata brings the Chinmaya Mission community together. Discover nearby centers, find events, and connect with fellow members." }), _jsx("meta", { name: "theme-color", content: "#ea580c" }), _jsx("meta", { property: "og:type", content: "website" }), _jsx("meta", { property: "og:title", content: "Chinmaya Janata" }), _jsx("meta", { property: "og:description", content: "Discover nearby Chinmaya Mission centers, find events, and connect with your community." }), _jsx("meta", { property: "og:site_name", content: "Chinmaya Janata" }), _jsx("meta", { name: "twitter:card", content: "summary" }), _jsx("meta", { name: "twitter:title", content: "Chinmaya Janata" }), _jsx("meta", { name: "twitter:description", content: "Discover nearby Chinmaya Mission centers, find events, and connect with your community." }), _jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" }), _jsx("meta", { name: "mobile-web-app-capable", content: "yes" }), _jsx("meta", { name: "apple-mobile-web-app-capable", content: "yes" }), _jsx("meta", { name: "apple-mobile-web-app-status-bar-style", content: "default" }), _jsx("meta", { name: "apple-mobile-web-app-title", content: "Janata" }), _jsx("link", { rel: "manifest", href: "/manifest.json" }), _jsx("link", { rel: "apple-touch-icon", href: "/logo.png" }), _jsx(html_1.ScrollViewStyleReset, {}), _jsx("style", { dangerouslySetInnerHTML: {
                                __html: 'body{background-color:#fff;margin:0;padding:0}@media(prefers-color-scheme:dark){body{background-color:#0A0A0A}}',
                            } }), _jsx("link", { rel: "preconnect", href: "https://fonts.googleapis.com" }), _jsx("link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" }), _jsx("link", { href: "https://fonts.googleapis.com/css2?family=Inclusive+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap", rel: "stylesheet" })] }), _jsx("body", { children: children })] }));
    }
    exports_1("default", Root);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (html_1_1) {
                html_1 = html_1_1;
            }
        ],
        execute: function () {
        }
    };
});
