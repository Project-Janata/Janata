System.register([], function (exports_1, context_1) {
    "use strict";
    var initialSessionState;
    var __moduleName = context_1 && context_1.id;
    function sessionReducer(state, event) {
        switch (event.type) {
            case 'BOOTSTRAP_START':
                return { ...state, authStatus: 'booting', user: null };
            case 'BOOTSTRAP_SUCCESS':
                return { authStatus: 'authenticated', user: event.user };
            case 'BOOTSTRAP_FAIL':
                return { authStatus: 'unauthenticated', user: null };
            case 'LOGIN_SUCCESS':
                return { authStatus: 'authenticated', user: event.user };
            case 'LOGOUT':
            case 'SESSION_EXPIRED':
                return { authStatus: 'unauthenticated', user: null };
            case 'PROFILE_UPDATED':
                return { ...state, user: event.user };
            default:
                return state;
        }
    }
    exports_1("sessionReducer", sessionReducer);
    return {
        setters: [],
        execute: function () {
            exports_1("initialSessionState", initialSessionState = {
                authStatus: 'booting',
                user: null,
            });
        }
    };
});
