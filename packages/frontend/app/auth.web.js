System.register(["react/jsx-runtime", "react", "expo-router", "../components/contexts", "../utils", "../components/PasswordStrength", "../components/auth/ImageCarousel", "../components/DevPanel", "../components/ui/Logo", "../src/config/api"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, expo_router_1, contexts_1, utils_1, PasswordStrength_1, ImageCarousel_1, swamiChinmayanandaJpg, swamiChinmayanandaAlt, swamiChinmayanandaOption2, DevPanel_1, Logo_1, api_1, isDev, AUTH_CAROUSEL_IMAGES;
    var __moduleName = context_1 && context_1.id;
    function AuthScreen() {
        const router = expo_router_1.useRouter();
        const { checkUserExists, login, signup, loading } = contexts_1.useUser();
        // Read mode, returnTo, and inviteCode from URL params
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const initialMode = urlParams?.get('mode');
        const returnTo = urlParams?.get('returnTo');
        const urlInviteCode = urlParams?.get('inviteCode');
        // When inviteCode is provided via URL (e.g. from public explore flow),
        // skip the invite-code step and go straight to signup
        const [authStep, setAuthStep] = react_1.useState(initialMode === 'login' ? 'login'
            : initialMode === 'signup' && urlInviteCode ? 'signup'
                : 'initial');
        const [username, setUsername] = react_1.useState('');
        const [password, setPassword] = react_1.useState('');
        const [confirmPassword, setConfirmPassword] = react_1.useState('');
        const [inviteCode, setInviteCode] = react_1.useState(urlInviteCode || '');
        const [errors, setErrors] = react_1.useState({});
        const [showDevPanel, setShowDevPanel] = react_1.useState(false);
        // Focus state for input styling
        const [emailFocused, setEmailFocused] = react_1.useState(false);
        const [passwordFocused, setPasswordFocused] = react_1.useState(false);
        const [confirmPasswordFocused, setConfirmPasswordFocused] = react_1.useState(false);
        const [inviteCodeFocused, setInviteCodeFocused] = react_1.useState(false);
        const [viewportWidth, setViewportWidth] = react_1.useState(() => typeof window !== 'undefined' ? window.innerWidth : 1280);
        react_1.useEffect(() => {
            if (typeof window === 'undefined')
                return;
            const onResize = () => setViewportWidth(window.innerWidth);
            window.addEventListener('resize', onResize);
            return () => window.removeEventListener('resize', onResize);
        }, []);
        // --- Auth Handlers (same logic as auth.tsx) ---
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
                const exists = await checkUserExists(username);
                if (exists) {
                    setAuthStep('login');
                }
                else {
                    setAuthStep('invite-code');
                }
            }
            catch (e) {
                setErrors({ form: e.message || 'Failed to connect to server.' });
            }
        }, [username, checkUserExists]);
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
                    router.replace(returnTo || '/(tabs)');
                }
                else {
                    setErrors({ form: result.message || 'Username or password is incorrect.' });
                }
            }
            catch (e) {
                setErrors({ form: 'Failed to connect to server. Please try again.' });
            }
        }, [username, password, login, router]);
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
                    router.replace(returnTo ? `/onboarding?returnTo=${encodeURIComponent(returnTo)}` : '/onboarding');
                }
                else {
                    setErrors({ form: result.message || 'Failed to sign up. Please try again.' });
                }
            }
            catch (e) {
                setErrors({ form: 'Failed to connect to server. Please try again.' });
            }
        }, [username, password, confirmPassword, inviteCode, signup, router]);
        const handleInviteCodeContinue = react_1.useCallback(async () => {
            setErrors({});
            if (!inviteCode) {
                setErrors({ inviteCode: 'Please enter your invite code.' });
                return;
            }
            try {
                // Validate the invite code with the backend
                const response = await fetch(`${api_1.API_BASE_URL}/auth/validate-invite-code`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: inviteCode }),
                });
                const data = await response.json();
                if (data.valid) {
                    setAuthStep('signup');
                }
                else {
                    setErrors({ form: data.error || 'Invalid or inactive invite code.' });
                }
            }
            catch (e) {
                setErrors({ form: 'Failed to validate invite code. Please try again.' });
            }
        }, [inviteCode]);
        const handleSubmit = react_1.useCallback((e) => {
            if (e) {
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
        const handleUsernameChange = react_1.useCallback((e) => {
            setUsername(e.target.value);
            setErrors((prev) => ({ ...prev, username: '' }));
        }, []);
        const handlePasswordChange = react_1.useCallback((e) => {
            setPassword(e.target.value);
            setErrors((prev) => ({ ...prev, password: '' }));
        }, []);
        const handleConfirmPasswordChange = react_1.useCallback((e) => {
            setConfirmPassword(e.target.value);
            setErrors((prev) => ({ ...prev, confirmPassword: '' }));
        }, []);
        const handleInviteCodeChange = react_1.useCallback((e) => {
            setInviteCode(e.target.value);
            setErrors((prev) => ({ ...prev, inviteCode: '' }));
        }, []);
        const isButtonDisabled = loading ||
            (authStep === 'initial' && !username) ||
            (authStep === 'invite-code' && !inviteCode) ||
            (authStep !== 'initial' && authStep !== 'invite-code' && !password) ||
            (authStep === 'signup' && !confirmPassword);
        const errorMessages = Object.values(errors).filter(Boolean);
        // --- Input style helpers ---
        const baseInputStyle = {
            width: '100%',
            height: 48,
            minHeight: 44,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: '#D6D3D1',
            borderRadius: 8,
            padding: '0 16px',
            fontSize: 16,
            fontFamily: 'Inclusive Sans, sans-serif',
            color: '#1C1917',
            backgroundColor: '#FAFAF7',
            outline: 'none',
            boxSizing: 'border-box',
            WebkitAppearance: 'none',
        };
        const focusInputStyle = {
            borderColor: '#C2410C',
            boxShadow: '0 0 0 3px rgba(194,65,12,0.1)',
            backgroundColor: '#FFFFFF',
        };
        const getInputStyle = (focused) => ({
            ...baseInputStyle,
            ...(focused ? focusInputStyle : {}),
        });
        // --- Heading and subtitle per step ---
        const heading = authStep === 'login'
            ? 'Welcome back.'
            : authStep === 'invite-code'
                ? 'Enter invite code.'
                : authStep === 'signup'
                    ? 'Join the community.'
                    : 'Welcome.';
        const subtitle = authStep === 'login'
            ? 'Enter your password to continue'
            : authStep === 'invite-code'
                ? 'Enter your beta invite code to proceed'
                : authStep === 'signup'
                    ? 'Create your account to get started'
                    : 'Enter your email to get started';
        const buttonText = loading
            ? 'Please wait...'
            : authStep === 'login'
                ? 'Sign In'
                : authStep === 'invite-code'
                    ? 'Verify Code'
                    : authStep === 'signup'
                        ? 'Create Account'
                        : 'Continue';
        const isNarrowWeb = viewportWidth < 1024;
        const isMobile = viewportWidth < 640;
        return (_jsxs("div", { className: "auth-root", style: {
                display: 'flex',
                flexDirection: isNarrowWeb ? 'column' : 'row',
                minHeight: '100vh',
                backgroundColor: '#FAFAF7',
            }, children: [!isNarrowWeb && (_jsx("div", { style: { width: '50%', position: 'relative' }, children: _jsx(ImageCarousel_1.ImageCarousel, { images: AUTH_CAROUSEL_IMAGES }) })), _jsxs("div", { style: {
                        width: isNarrowWeb ? '100%' : '50%',
                        backgroundColor: '#FAFAF7',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        flex: 1,
                    }, children: [_jsxs("nav", { style: {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: isMobile ? '16px 16px' : '24px 32px',
                                flexShrink: 0,
                            }, children: [_jsx("button", { onClick: () => router.push('/landing'), style: {
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '8px 4px',
                                        margin: '-8px -4px',
                                        fontSize: 14,
                                        fontFamily: 'Inclusive Sans, sans-serif',
                                        color: '#78716C',
                                        minHeight: 44,
                                        display: 'flex',
                                        alignItems: 'center',
                                    }, children: "\u2190 Back to home" }), _jsx("button", { onClick: () => router.push('/(tabs)'), style: {
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '8px 4px',
                                        margin: '-8px -4px',
                                        fontSize: 14,
                                        fontFamily: 'Inclusive Sans, sans-serif',
                                        fontWeight: '500',
                                        color: '#C2410C',
                                        minHeight: 44,
                                        display: 'flex',
                                        alignItems: 'center',
                                    }, children: "Discover \u2192" })] }), _jsx("div", { style: {
                                flex: 1,
                                display: 'flex',
                                alignItems: isMobile ? 'flex-start' : 'center',
                                justifyContent: 'center',
                                padding: isMobile ? '8px 16px 24px' : isNarrowWeb ? '0 20px 32px' : 0,
                            }, children: _jsxs("div", { style: { maxWidth: 400, width: '100%', padding: isNarrowWeb ? 0 : '0 48px' }, children: [authStep !== 'initial' && (_jsx("button", { onClick: handleBack, style: {
                                            color: '#78716C',
                                            fontSize: 14,
                                            fontFamily: 'Inclusive Sans, sans-serif',
                                            cursor: 'pointer',
                                            background: 'none',
                                            border: 'none',
                                            padding: '12px 16px 12px 0',
                                            marginBottom: 12,
                                            marginLeft: -4,
                                            minHeight: 44,
                                            minWidth: 44,
                                            display: 'flex',
                                            alignItems: 'center',
                                        }, children: "\u2190 Back" })), _jsx("div", { onClick: () => router.push('/landing'), role: "link", style: { marginBottom: isMobile ? 32 : 48, cursor: 'pointer' }, children: _jsx(Logo_1.default, { size: isMobile ? 28 : 32 }) }), _jsx("h1", { style: {
                                            fontFamily: '"Inclusive Sans", sans-serif',
                                            fontSize: isMobile ? 28 : isNarrowWeb ? 32 : 36,
                                            fontWeight: '400',
                                            color: '#1C1917',
                                            marginBottom: 8,
                                            marginTop: 0,
                                        }, children: heading }), _jsx("p", { style: {
                                            fontFamily: 'Inclusive Sans, sans-serif',
                                            fontSize: 16,
                                            color: '#78716C',
                                            marginBottom: 32,
                                            marginTop: 0,
                                        }, children: subtitle }), errorMessages.length > 0 && (_jsx("div", { style: {
                                            backgroundColor: '#FEF2F2',
                                            borderRadius: 12,
                                            padding: '12px 16px',
                                            marginBottom: 16,
                                        }, children: errorMessages.map((msg, idx) => (_jsx("p", { style: {
                                                color: '#EF4444',
                                                fontSize: 14,
                                                fontFamily: 'Inclusive Sans, sans-serif',
                                                margin: 0,
                                            }, children: msg }, idx))) })), _jsxs("form", { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: 16 }, children: [_jsx("input", { className: "auth-input", type: "email", placeholder: "Email", value: username, onChange: handleUsernameChange, disabled: authStep !== 'initial', onFocus: () => setEmailFocused(true), onBlur: () => setEmailFocused(false), style: getInputStyle(emailFocused) }), authStep === 'login' && (_jsx("input", { className: "auth-input", type: "password", placeholder: "Password", value: password, onChange: handlePasswordChange, autoComplete: "current-password", onFocus: () => setPasswordFocused(true), onBlur: () => setPasswordFocused(false), style: getInputStyle(passwordFocused) })), authStep === 'invite-code' && (_jsx("input", { className: "auth-input", type: "text", placeholder: "Invite Code", value: inviteCode, onChange: handleInviteCodeChange, autoComplete: "off", onFocus: () => setInviteCodeFocused(true), onBlur: () => setInviteCodeFocused(false), style: getInputStyle(inviteCodeFocused) })), authStep === 'signup' && (_jsxs(_Fragment, { children: [_jsx("input", { className: "auth-input", type: "password", placeholder: "Password", value: password, onChange: handlePasswordChange, autoComplete: "new-password", onFocus: () => setPasswordFocused(true), onBlur: () => setPasswordFocused(false), style: getInputStyle(passwordFocused) }), _jsx(PasswordStrength_1.default, { password: password, show: password.length > 0 }), _jsx("input", { className: "auth-input", type: "password", placeholder: "Confirm password", value: confirmPassword, onChange: handleConfirmPasswordChange, autoComplete: "new-password", onFocus: () => setConfirmPasswordFocused(true), onBlur: () => setConfirmPasswordFocused(false), style: getInputStyle(confirmPasswordFocused) })] })), _jsx("button", { className: "auth-submit", type: "submit", disabled: isButtonDisabled, style: {
                                                    width: '100%',
                                                    height: 48,
                                                    minHeight: 44,
                                                    backgroundColor: '#C2410C',
                                                    color: '#FFFFFF',
                                                    border: 'none',
                                                    borderRadius: 8,
                                                    fontSize: 16,
                                                    fontFamily: 'Inclusive Sans, sans-serif',
                                                    fontWeight: '500',
                                                    cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                                                    marginTop: 8,
                                                    opacity: isButtonDisabled ? 0.4 : 1,
                                                    WebkitTapHighlightColor: 'transparent',
                                                    touchAction: 'manipulation',
                                                }, children: buttonText })] }), authStep === 'initial' && (_jsxs("p", { style: {
                                            fontSize: 14,
                                            color: '#78716C',
                                            textAlign: 'center',
                                            marginTop: 16,
                                            fontFamily: 'Inclusive Sans, sans-serif',
                                        }, children: ["Don't have an account?", ' ', _jsx("span", { role: "button", tabIndex: 0, onClick: async () => {
                                                    if (!username) {
                                                        setErrors({ username: 'Please enter your email first.' });
                                                        return;
                                                    }
                                                    if (!utils_1.validateEmail(username)) {
                                                        setErrors({ username: 'You must enter a valid email address.' });
                                                        return;
                                                    }
                                                    try {
                                                        const exists = await checkUserExists(username);
                                                        if (exists) {
                                                            setErrors({ form: 'An account with this email already exists. Please log in.' });
                                                            setAuthStep('login');
                                                        }
                                                        else {
                                                            setAuthStep('signup');
                                                        }
                                                    }
                                                    catch (e) {
                                                        setErrors({ form: e.message || 'Failed to connect to server.' });
                                                    }
                                                }, onKeyDown: async (e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        if (!username) {
                                                            setErrors({ username: 'Please enter your email first.' });
                                                            return;
                                                        }
                                                        if (!utils_1.validateEmail(username)) {
                                                            setErrors({ username: 'You must enter a valid email address.' });
                                                            return;
                                                        }
                                                        try {
                                                            const exists = await checkUserExists(username);
                                                            if (exists) {
                                                                setErrors({ form: 'An account with this email already exists. Please log in.' });
                                                                setAuthStep('login');
                                                            }
                                                            else {
                                                                setAuthStep('signup');
                                                            }
                                                        }
                                                        catch (e) {
                                                            setErrors({ form: e.message || 'Failed to connect to server.' });
                                                        }
                                                    }
                                                }, style: {
                                                    color: '#C2410C',
                                                    cursor: 'pointer',
                                                    padding: '8px 4px',
                                                    margin: '-8px -4px',
                                                    display: 'inline-block',
                                                }, children: "Create one" })] })), authStep === 'login' && (_jsx("p", { style: {
                                            fontSize: 14,
                                            color: '#78716C',
                                            textAlign: 'center',
                                            marginTop: 16,
                                            fontFamily: 'Inclusive Sans, sans-serif',
                                        }, children: _jsx("span", { role: "button", tabIndex: 0, onClick: () => window.alert('Please contact info@chinmayajanata.org to reset your password.'), onKeyDown: (e) => {
                                                if (e.key === 'Enter' || e.key === ' ')
                                                    window.alert('Please contact info@chinmayajanata.org to reset your password.');
                                            }, style: {
                                                color: '#C2410C',
                                                cursor: 'pointer',
                                                padding: '8px 4px',
                                                margin: '-8px -4px',
                                                display: 'inline-block',
                                            }, children: "Forgot password?" }) })), isDev && (_jsxs("button", { onClick: () => setShowDevPanel(true), style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            backgroundColor: '#F5F5F4',
                                            padding: '10px 16px',
                                            borderRadius: 8,
                                            border: 'none',
                                            cursor: 'pointer',
                                            marginTop: 24,
                                            width: '100%',
                                            fontSize: 14,
                                            fontFamily: 'Inclusive Sans, sans-serif',
                                            color: '#57534E',
                                        }, children: [_jsx("span", { style: { fontFamily: 'monospace', fontSize: 16 }, children: "</>" }), "Developer Mode"] })), isDev && showDevPanel && (_jsx(DevPanel_1.default, { visible: showDevPanel, onClose: () => setShowDevPanel(false) })), _jsxs("p", { style: {
                                            fontSize: 13,
                                            color: '#A8A29E',
                                            textAlign: 'center',
                                            marginTop: isMobile ? 24 : 32,
                                            fontFamily: 'Inclusive Sans, sans-serif',
                                            paddingBottom: isMobile ? 16 : 0,
                                        }, children: ["By continuing, you agree to our", ' ', _jsx("span", { role: "link", tabIndex: 0, onClick: () => router.push('/terms'), onKeyDown: (e) => { if (e.key === 'Enter')
                                                    router.push('/terms'); }, style: { color: '#C2410C', cursor: 'pointer' }, children: "Terms of Service" }), ' ', "and", ' ', _jsx("span", { role: "link", tabIndex: 0, onClick: () => router.push('/privacy'), onKeyDown: (e) => { if (e.key === 'Enter')
                                                    router.push('/privacy'); }, style: { color: '#C2410C', cursor: 'pointer' }, children: "Privacy Policy" })] })] }) })] })] }));
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
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (utils_1_1) {
                utils_1 = utils_1_1;
            },
            function (PasswordStrength_1_1) {
                PasswordStrength_1 = PasswordStrength_1_1;
            },
            function (ImageCarousel_1_1) {
                ImageCarousel_1 = ImageCarousel_1_1;
            },
            function (DevPanel_1_1) {
                DevPanel_1 = DevPanel_1_1;
            },
            function (Logo_1_1) {
                Logo_1 = Logo_1_1;
            },
            function (api_1_1) {
                api_1 = api_1_1;
            }
        ],
        execute: function () {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            swamiChinmayanandaJpg = require('../assets/images/landing/Swami Chinmayananda.jpg');
            swamiChinmayanandaAlt = require('../assets/images/landing/Swami Chinmayananda (1).jpg');
            swamiChinmayanandaOption2 = require('../assets/images/landing/Swami Chinmayananda Option 2.jpeg');
            // __DEV__ is a React Native/Expo global — always false in production builds
            isDev = typeof __DEV__ !== 'undefined' && __DEV__;
            // Inject CSS for placeholder, hover, and mobile-specific styles (web only)
            if (typeof document !== 'undefined') {
                const id = 'auth-web-styles';
                if (!document.getElementById(id)) {
                    const style = document.createElement('style');
                    style.id = id;
                    style.textContent = `
      .auth-input::placeholder { color: #9CA3AF; }
      .auth-input:disabled { opacity: 0.6; cursor: not-allowed; }
      .auth-input { font-size: 16px !important; } /* Prevent iOS zoom on focus */
      .auth-submit:hover:not(:disabled) { background-color: #B91C1C !important; }
      @supports (min-height: 100dvh) {
        .auth-root { min-height: 100dvh !important; }
      }
    `;
                    document.head.appendChild(style);
                }
            }
            AUTH_CAROUSEL_IMAGES = [
                swamiChinmayanandaJpg,
                swamiChinmayanandaAlt,
                swamiChinmayanandaOption2,
            ];
        }
    };
});
