// Shared admin constants and helpers
System.register([], function (exports_1, context_1) {
    "use strict";
    var ADMIN_EMAIL, isLocal;
    var __moduleName = context_1 && context_1.id;
    function isSuperAdmin(user) {
        if (!user)
            return false;
        return (user.email === ADMIN_EMAIL ||
            (user.verificationLevel !== undefined && user.verificationLevel >= 107) ||
            isLocal);
    }
    exports_1("isSuperAdmin", isSuperAdmin);
    return {
        setters: [],
        execute: function () {
            exports_1("ADMIN_EMAIL", ADMIN_EMAIL = 'chinmayajanata@gmail.com');
            exports_1("isLocal", isLocal = typeof window !== 'undefined' && window.location?.hostname === 'localhost');
        }
    };
});
