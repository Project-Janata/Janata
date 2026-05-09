System.register(["react/jsx-runtime", "react", "react-native", "expo-router", "lucide-react-native", "posthog-react-native", "../components/ui", "../components/contexts", "../utils", "../components", "../components/DevPanel", "../src/config/api"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, expo_router_1, lucide_react_native_1, posthog_react_native_1, ui_1, contexts_1, utils_1, components_1, DevPanel_1, api_1, isDev;
    var __moduleName = context_1 && context_1.id;
    function AuthScreen() {
        const router = expo_router_1.useRouter();
        const { isDark } = contexts_1.useTheme();
        const { checkUserExists, login, signup, loading } = contexts_1.useUser();
        const posthog = posthog_react_native_1.usePostHog();
        // Read params for deep-link support (e.g. from AuthPromptModal)
        const params = expo_router_1.useLocalSearchParams();
        const urlInviteCode = params.inviteCode;
        const [authStep, setAuthStep] = react_1.useState(params.mode === 'login' ? 'login'
            : params.mode === 'signup' && urlInviteCode ? 'signup'
                : 'initial');
        const [username, setUsername] = react_1.useState('');
        const [password, setPassword] = react_1.useState('');
        const [confirmPassword, setConfirmPassword] = react_1.useState('');
        const [inviteCode, setInviteCode] = react_1.useState(urlInviteCode || '');
        const [errors, setErrors] = react_1.useState({});
        const [showDevPanel, setShowDevPanel] = react_1.useState(false);
        const handleContinue = react_1.useCallback(async () => {
            setErrors({});
            if (!username) {
                setErrors({ username: 'Please enter a username.' });
                return;
            }
            if (!utils_1.validateEmail(username)) {
                setErrors({ username: 'You must enter a valid email address.' });
                return;
            }
            try {
                posthog?.capture('auth_email_submitted');
                const exists = await checkUserExists(username);
                if (exists) {
                    posthog?.capture('auth_user_exists');
                    setAuthStep('login');
                }
                else {
                    posthog?.capture('auth_user_new');
                    setAuthStep('invite-code');
                }
            }
            catch (e) {
                posthog?.capture('auth_check_failed');
                setErrors({ form: e.message || 'Failed to connect to server.' });
            }
        }, [username, checkUserExists, posthog]);
        const handleLogin = react_1.useCallback(async () => {
            setErrors({});
            if (!username) {
                setErrors({ username: 'Please enter a username.' });
                return;
            }
            if (!password) {
                setErrors({ password: 'Please enter your password.' });
                return;
            }
            try {
                const result = await login(username, password);
                if (result.success) {
                    router.replace('/(tabs)');
                }
                else {
                    setErrors({ form: result.message || 'Username or password is incorrect.' });
                }
            }
            catch (e) {
                setErrors({ form: 'Failed to connect to server. Please try again.' });
            }
        }, [username, password, login, router]);
        const handleInviteCodeContinue = react_1.useCallback(async () => {
            setErrors({});
            if (!inviteCode) {
                setErrors({ inviteCode: 'Please enter your invite code.' });
                return;
            }
            try {
                posthog?.capture('auth_invite_code_submitted');
                // Validate the invite code with the backend
                const response = await fetch(`${api_1.API_BASE_URL}/auth/validate-invite-code`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: inviteCode }),
                });
                const data = await response.json();
                if (data.valid) {
                    posthog?.capture('auth_invite_code_valid');
                    setAuthStep('signup');
                }
                else {
                    posthog?.capture('auth_invite_code_invalid');
                    setErrors({ form: data.error || 'Invalid or inactive invite code.' });
                }
            }
            catch (e) {
                posthog?.capture('auth_invite_code_check_failed');
                setErrors({ form: 'Failed to validate invite code. Please try again.' });
            }
        }, [inviteCode, posthog]);
        const handleSignup = react_1.useCallback(async () => {
            setErrors({});
            if (!username) {
                setErrors({ username: 'Please enter a username.' });
                return;
            }
            if (!password) {
                setErrors({ password: 'Please enter a password.' });
                return;
            }
            if (!utils_1.validatePassword(password).isValid) {
                setErrors({ password: 'Password does not meet complexity requirements.' });
                return;
            }
            if (password !== confirmPassword) {
                setErrors({ confirmPassword: 'Passwords do not match.' });
                return;
            }
            try {
                const result = await signup(username, password, inviteCode);
                if (result.success) {
                    router.replace(params.returnTo ? `/onboarding?returnTo=${encodeURIComponent(params.returnTo)}` : '/onboarding');
                }
                else {
                    setErrors({ form: result.message || 'Failed to sign up. Please try again.' });
                }
            }
            catch (e) {
                setErrors({ form: 'Failed to connect to server. Please try again.' });
            }
        }, [username, password, confirmPassword, inviteCode, signup, router]);
        const handleSubmit = react_1.useCallback((e) => {
            if (react_native_1.Platform.OS === 'web' && e) {
                e.preventDefault?.();
                e.stopPropagation?.();
            }
            if (authStep === 'login') {
                handleLogin();
            }
            else if (authStep === 'invite-code') {
                handleInviteCodeContinue();
            }
            else if (authStep === 'signup') {
                handleSignup();
            }
            else {
                handleContinue();
            }
        }, [authStep, handleLogin, handleInviteCodeContinue, handleSignup, handleContinue]);
        const handleBack = react_1.useCallback(() => {
            setAuthStep('initial');
            setPassword('');
            setConfirmPassword('');
            setInviteCode('');
            setErrors({});
        }, []);
        const isButtonDisabled = loading ||
            (authStep === 'initial' && !username) ||
            (authStep === 'invite-code' && !inviteCode) ||
            (authStep !== 'initial' && authStep !== 'invite-code' && !password) ||
            (authStep === 'signup' && !confirmPassword);
        // Collect error messages to display
        const errorMessages = Object.values(errors).filter(Boolean);
        // Memoize input handlers to prevent recreation
        const handleUsernameChange = react_1.useCallback((text) => {
            setUsername(text);
            setErrors((prev) => ({ ...prev, username: '' }));
        }, []);
        const handlePasswordChange = react_1.useCallback((text) => {
            setPassword(text);
            setErrors((prev) => ({ ...prev, password: '' }));
        }, []);
        const handleConfirmPasswordChange = react_1.useCallback((text) => {
            setConfirmPassword(text);
            setErrors((prev) => ({ ...prev, confirmPassword: '' }));
        }, []);
        const handleInviteCodeChange = react_1.useCallback((text) => {
            setInviteCode(text);
            setErrors((prev) => ({ ...prev, inviteCode: '' }));
        }, []);
        return (_jsx(react_native_1.KeyboardAvoidingView, { behavior: react_native_1.Platform.OS === 'ios' ? 'padding' : 'height', className: "flex-1", children: _jsx(react_native_1.ScrollView, { contentContainerStyle: { flexGrow: 1 }, className: "flex-1 bg-[#FAFAF7] dark:bg-background-dark", keyboardShouldPersistTaps: "handled", children: _jsx(react_native_1.View, { className: "flex-1 justify-center items-center w-full px-6", style: {
                        paddingTop: 60,
                        paddingBottom: 48,
                    }, children: _jsxs(react_native_1.View, { className: "w-full", style: { maxWidth: 400 }, children: [authStep !== 'initial' && (_jsxs(react_native_1.TouchableOpacity, { onPress: handleBack, activeOpacity: 0.7, className: "flex-row items-center gap-2 mb-6 rounded-xl px-3 py-2 self-start", style: { alignSelf: 'flex-start' }, children: [_jsx(lucide_react_native_1.ArrowLeft, { size: 20, className: isDark ? 'text-white' : 'text-content' }), _jsx(react_native_1.Text, { className: "font-sans font-medium text-content dark:text-content-dark", children: "Back" })] })), _jsx(react_native_1.Pressable, { onPress: () => router.push('/landing'), children: _jsx(ui_1.Logo, { size: 32, style: { marginBottom: 32 } }) }), _jsxs(react_native_1.View, { className: "mb-6", children: [_jsx(react_native_1.Text, { style: { fontFamily: '"Inclusive Sans"', fontSize: 36, fontWeight: '400' }, className: "text-content dark:text-content-dark", children: authStep === 'login'
                                            ? 'Welcome back.'
                                            : authStep === 'invite-code'
                                                ? 'Enter invite code.'
                                                : authStep === 'signup'
                                                    ? 'Join the community.'
                                                    : 'Welcome.' }), _jsx(react_native_1.Text, { className: "text-base font-sans mt-2", style: { color: '#78716C' }, children: authStep === 'login'
                                            ? 'Enter your password to continue'
                                            : authStep === 'invite-code'
                                                ? 'Enter your beta invite code to proceed'
                                                : authStep === 'signup'
                                                    ? 'Create your account to get started'
                                                    : 'Enter your email to get started' })] }), errorMessages.length > 0 && (_jsx(react_native_1.View, { className: "w-full font-sans bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 mb-4", children: errorMessages.map((msg, idx) => (_jsx(react_native_1.Text, { className: "text-red-500 text-sm font-sans", children: msg }, idx))) })), _jsxs(react_native_1.View, { className: "gap-4", children: [_jsx(react_native_1.View, { children: _jsx(ui_1.AuthInput, { placeholder: "Email", onChangeText: handleUsernameChange, value: username, secureTextEntry: false, editable: authStep === 'initial' }) }), authStep === 'login' && (_jsx(react_native_1.View, { children: _jsx(ui_1.AuthInput, { placeholder: "Password", onChangeText: handlePasswordChange, value: password, secureTextEntry: true, autoComplete: "password", style: {} }) })), authStep === 'invite-code' && (_jsx(react_native_1.View, { children: _jsx(ui_1.AuthInput, { placeholder: "Invite Code", onChangeText: handleInviteCodeChange, value: inviteCode, secureTextEntry: false, autoComplete: "off", style: {} }) })), authStep === 'signup' && (_jsxs(_Fragment, { children: [_jsxs(react_native_1.View, { children: [_jsx(components_1.PasswordStrength, { password: password, show: password.length > 0 }), _jsx(ui_1.AuthInput, { placeholder: "Password", onChangeText: handlePasswordChange, value: password, secureTextEntry: true, autoComplete: "password-new", style: {} })] }), _jsx(react_native_1.View, { children: _jsx(ui_1.AuthInput, { placeholder: "Confirm password", onChangeText: handleConfirmPasswordChange, value: confirmPassword, secureTextEntry: true, autoComplete: "password-new", style: {} }) })] })), _jsx(ui_1.PrimaryButton, { onPress: handleSubmit, disabled: isButtonDisabled, loading: loading, style: { marginTop: 8 }, children: authStep === 'login'
                                            ? 'Log In'
                                            : authStep === 'invite-code'
                                                ? 'Verify Code'
                                                : authStep === 'signup'
                                                    ? 'Sign Up'
                                                    : 'Continue' }), authStep === 'login' && (_jsx(react_native_1.Pressable, { className: "items-center mt-2", onPress: () => react_native_1.Alert.alert('Reset Password', 'Please contact info@chinmayajanata.org to reset your password.'), children: _jsx(react_native_1.Text, { className: "text-primary font-sans font-medium", children: "Forgot password?" }) }))] }), isDev && (_jsx(react_native_1.View, { className: "mt-8 pt-6 border-t border-borderColor dark:border-borderColor-dark", children: _jsxs(react_native_1.Pressable, { onPress: () => setShowDevPanel(true), className: "flex-row items-center justify-center bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl active:opacity-70", children: [_jsx(lucide_react_native_1.Code, { size: 18, className: isDark ? 'text-white' : 'text-black' }), _jsx(react_native_1.Text, { className: "ml-2 text-content dark:text-content-dark font-sans font-semibold", children: "Developer Mode" })] }) })), isDev && showDevPanel && (_jsx(DevPanel_1.default, { visible: showDevPanel, onClose: () => setShowDevPanel(false) })), _jsxs(react_native_1.Text, { className: "text-content dark:text-content-dark opacity-50 text-sm font-sans mt-8 text-center px-4", children: ["By continuing, you agree to our", ' ', _jsx(react_native_1.Text, { className: "text-primary font-sans", onPress: () => router.push('/terms'), children: "Terms of Service" }), ' ', "and", ' ', _jsx(react_native_1.Text, { className: "text-primary font-sans", onPress: () => router.push('/privacy'), children: "Privacy Policy" })] })] }) }) }) }));
    }
    exports_1("default", AuthScreen);
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
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            },
            function (posthog_react_native_1_1) {
                posthog_react_native_1 = posthog_react_native_1_1;
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (utils_1_1) {
                utils_1 = utils_1_1;
            },
            function (components_1_1) {
                components_1 = components_1_1;
            },
            function (DevPanel_1_1) {
                DevPanel_1 = DevPanel_1_1;
            },
            function (api_1_1) {
                api_1 = api_1_1;
            }
        ],
        execute: function () {
            // __DEV__ is a React Native/Expo global — always false in production builds
            isDev = typeof __DEV__ !== 'undefined' && __DEV__;
        }
    };
});
