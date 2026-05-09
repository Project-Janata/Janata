System.register([], function (exports_1, context_1) {
    "use strict";
    var validateEmail, validatePassword, validatePhoneNumber;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
            exports_1("validateEmail", validateEmail = (email) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            });
            exports_1("validatePassword", validatePassword = (password) => {
                const errors = [];
                // Password must be at least 8 characters long
                if (password.length < 8) {
                    errors.push("Password must be at least 8 characters long.");
                }
                // Password must contain at least one uppercase letter
                if (!/[A-Z]/.test(password)) {
                    errors.push("Password must contain at least one uppercase letter.");
                }
                // Password must contain at least one lowercase letter
                if (!/[a-z]/.test(password)) {
                    errors.push("Password must contain at least one lowercase letter.");
                }
                // Password must contain at least one digit
                if (!/[0-9]/.test(password)) {
                    errors.push("Password must contain at least one digit.");
                }
                // Password must contain at least one special character
                if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
                    errors.push("Password must contain at least one special character.");
                }
                return {
                    isValid: errors.length === 0,
                    errors,
                };
            });
            exports_1("validatePhoneNumber", validatePhoneNumber = (phoneNumber) => {
                const phoneNumberRegex = /^\d{10}$/; // Exactly 10 digits
                return phoneNumberRegex.test(phoneNumber);
            });
        }
    };
});
