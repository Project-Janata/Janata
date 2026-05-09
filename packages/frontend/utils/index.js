System.register(["./locationServices", "./validation", "./api"], function (exports_1, context_1) {
    "use strict";
    var locationServices_1, validation_1;
    var __moduleName = context_1 && context_1.id;
    var exportedNames_1 = {
        "getLocationAccess": true,
        "getCurrentPosition": true,
        "validateEmail": true,
        "validatePassword": true
    };
    function exportStar_1(m) {
        var exports = {};
        for (var n in m) {
            if (n !== "default" && !exportedNames_1.hasOwnProperty(n)) exports[n] = m[n];
        }
        exports_1(exports);
    }
    return {
        setters: [
            function (locationServices_1_1) {
                locationServices_1 = locationServices_1_1;
            },
            function (validation_1_1) {
                validation_1 = validation_1_1;
            },
            function (api_1_1) {
                exportStar_1(api_1_1);
            }
        ],
        execute: function () {
            exports_1("getLocationAccess", locationServices_1.getLocationAccess);
            exports_1("getCurrentPosition", locationServices_1.getCurrentPosition);
            exports_1("validateEmail", validation_1.validateEmail);
            exports_1("validatePassword", validation_1.validatePassword);
        }
    };
});
