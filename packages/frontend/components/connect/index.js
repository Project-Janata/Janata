System.register(["./ThreadPanel", "./mockData"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var exportedNames_1 = {
        "BoardPostCard": true,
        "ThreadPanel": true
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
            function (ThreadPanel_1_1) {
                exports_1({
                    "BoardPostCard": ThreadPanel_1_1["BoardPostCard"],
                    "ThreadPanel": ThreadPanel_1_1["ThreadPanel"]
                });
            },
            function (mockData_1_1) {
                exportStar_1(mockData_1_1);
            }
        ],
        execute: function () {
        }
    };
});
