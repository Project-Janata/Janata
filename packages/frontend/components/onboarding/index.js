System.register(["./step1", "./step2", "./step3", "./step4", "./complete"], function (exports_1, context_1) {
    "use strict";
    var step1_1, step2_1, step3_1, step4_1, complete_1;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (step1_1_1) {
                step1_1 = step1_1_1;
            },
            function (step2_1_1) {
                step2_1 = step2_1_1;
            },
            function (step3_1_1) {
                step3_1 = step3_1_1;
            },
            function (step4_1_1) {
                step4_1 = step4_1_1;
            },
            function (complete_1_1) {
                complete_1 = complete_1_1;
            }
        ],
        execute: function () {
            exports_1("Step1", step1_1.default);
            exports_1("Step2", step2_1.default);
            exports_1("Step3", step3_1.default);
            exports_1("Step4", step4_1.default);
            exports_1("Complete", complete_1.default);
        }
    };
});
