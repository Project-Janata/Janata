System.register(["react/jsx-runtime", "react", "expo-router", "react-native", "./UserContext", "posthog-react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, expo_router_1, react_native_1, UserContext_1, posthog_react_native_1, OnboardingContext;
    var __moduleName = context_1 && context_1.id;
    function OnboardingProvider({ children }) {
        const { user, setUser, authenticatedFetch } = UserContext_1.useUser();
        const params = expo_router_1.useLocalSearchParams();
        const returnTo = params.returnTo || (react_native_1.Platform.OS === 'web' && typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('returnTo')
            : null);
        const [currentStep, setCurrentStep] = react_1.useState(1);
        const totalSteps = 4; // Total form steps (not including Complete screen)
        const posthog = posthog_react_native_1.usePostHog();
        const [firstName, setFirstName] = react_1.useState('');
        const [lastName, setLastName] = react_1.useState('');
        const [birthdate, setBirthdate] = react_1.useState(null);
        const [centerID, setCenterID] = react_1.useState('');
        const [phoneNumber, setPhoneNumber] = react_1.useState('');
        const [interests, setInterests] = react_1.useState([]);
        const [isSubmitting, setIsSubmitting] = react_1.useState(false);
        const [submitError, setSubmitError] = react_1.useState(null);
        const goToNextStep = () => {
            posthog?.capture('onboarding_step_completed', { step: currentStep });
            // Allow incrementing past totalSteps to show Complete screen
            setCurrentStep(currentStep + 1);
        };
        const goToPreviousStep = () => {
            if (currentStep > 1) {
                setCurrentStep(currentStep - 1);
            }
        };
        const completeOnboarding = async () => {
            setIsSubmitting(true);
            setSubmitError(null);
            try {
                const response = await authenticatedFetch('/api/auth/complete-onboarding', {
                    method: 'POST',
                    body: JSON.stringify({
                        userId: user?.username,
                        firstName,
                        lastName,
                        dateOfBirth: birthdate?.toISOString() || null,
                        centerID,
                        phoneNumber: phoneNumber || undefined,
                        interests: interests.length > 0 ? interests : undefined,
                        profileComplete: true,
                    }),
                });
                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data.message || 'Failed to complete onboarding');
                }
                const data = await response.json();
                setUser(data.user);
                expo_router_1.router.replace(returnTo || '/');
                posthog?.capture('onboarding_completed');
            }
            catch (error) {
                posthog?.capture('onboarding_failed', { error: error.message });
                setSubmitError(error.message || 'Something went wrong. Please try again.');
            }
            finally {
                setIsSubmitting(false);
            }
        };
        const skipOnboarding = async () => {
            if (!firstName.trim() || !lastName.trim()) {
                // Can't skip without a name — just go to step 1
                setCurrentStep(1);
                return;
            }
            setIsSubmitting(true);
            setSubmitError(null);
            try {
                const response = await authenticatedFetch('/api/auth/complete-onboarding', {
                    method: 'POST',
                    body: JSON.stringify({
                        userId: user?.username,
                        firstName: firstName.trim(),
                        lastName: lastName.trim(),
                        profileComplete: true,
                    }),
                });
                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data.message || 'Failed to complete onboarding');
                }
                const data = await response.json();
                setUser(data.user);
                expo_router_1.router.replace(returnTo || '/');
                posthog?.capture('onboarding_skipped', { step: currentStep });
            }
            catch (error) {
                setSubmitError(error.message || 'Something went wrong. Please try again.');
            }
            finally {
                setIsSubmitting(false);
            }
        };
        const value = {
            currentStep,
            totalSteps,
            firstName,
            lastName,
            birthdate,
            centerID,
            phoneNumber,
            interests,
            isSubmitting,
            submitError,
            returnTo,
            goToNextStep,
            goToPreviousStep,
            completeOnboarding,
            skipOnboarding,
            setFirstName,
            setLastName,
            setBirthdate,
            setCenterID,
            setPhoneNumber,
            setInterests,
        };
        return _jsx(OnboardingContext.Provider, { value: value, children: children });
    }
    exports_1("default", OnboardingProvider);
    function useOnboarding() {
        const context = react_1.useContext(OnboardingContext);
        if (!context) {
            throw new Error('useOnboarding must be used within an OnboardingProvider');
        }
        return context;
    }
    exports_1("useOnboarding", useOnboarding);
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
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (UserContext_1_1) {
                UserContext_1 = UserContext_1_1;
            },
            function (posthog_react_native_1_1) {
                posthog_react_native_1 = posthog_react_native_1_1;
            }
        ],
        execute: function () {
            OnboardingContext = react_1.createContext(undefined);
        }
    };
});
