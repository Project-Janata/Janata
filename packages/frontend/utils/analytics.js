System.register(["posthog-react-native"], function (exports_1, context_1) {
    "use strict";
    var AnalyticsEvents;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (posthog_react_native_1_1) {
                exports_1({
                    "usePostHog": posthog_react_native_1_1["usePostHog"]
                });
            }
        ],
        execute: function () {
            exports_1("AnalyticsEvents", AnalyticsEvents = {
                // Auth
                AUTH_EMAIL_SUBMITTED: 'auth_email_submitted',
                AUTH_USER_EXISTS: 'auth_user_exists',
                AUTH_USER_NEW: 'auth_user_new',
                AUTH_CHECK_FAILED: 'auth_check_failed',
                LOGIN_SUCCESS: 'login_success',
                LOGIN_FAILED: 'login_failed',
                SIGNUP_SUCCESS: 'signup_success',
                SIGNUP_FAILED: 'signup_failed',
                LOGOUT: 'logout',
                // Onboarding
                ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
                ONBOARDING_COMPLETED: 'onboarding_completed',
                ONBOARDING_FAILED: 'onboarding_failed',
                // Profile
                PROFILE_UPDATED: 'profile_updated',
                PROFILE_UPDATE_FAILED: 'profile_update_failed',
                PROFILE_EDIT_STARTED: 'profile_edit_started',
                PROFILE_EDIT_SAVED: 'profile_edit_saved',
                PROFILE_EDIT_CANCELLED: 'profile_edit_cancelled',
                // Discover / Home
                DISCOVER_FILTER_CHANGED: 'discover_filter_changed',
                DISCOVER_SEARCH: 'discover_search',
                DISCOVER_DATE_SELECTED: 'discover_date_selected',
                MAP_POINT_PRESSED: 'map_point_pressed',
                // Events
                EVENT_VIEWED: 'event_viewed',
                EVENT_REGISTERED: 'event_registered',
                EVENT_UNREGISTERED: 'event_unregistered',
                EVENT_REGISTRATION_FAILED: 'event_registration_failed',
                EVENT_SHARED: 'event_shared',
                EVENT_TAB_CHANGED: 'event_tab_changed',
                EVENT_CREATED: 'event_created',
                EVENT_UPDATED: 'event_updated',
                EVENT_CREATE_FAILED: 'event_create_failed',
                EVENT_EDIT_OPENED: 'event_edit_opened',
                EVENT_LIST_VIEWED: 'event_list_viewed',
                EVENT_LIST_ITEM_PRESSED: 'event_list_item_pressed',
                // Centers
                CENTER_VIEWED: 'center_viewed',
                CENTER_SHARED: 'center_shared',
                CENTER_ADDRESS_PRESSED: 'center_address_pressed',
                CENTER_WEBSITE_PRESSED: 'center_website_pressed',
                CENTER_PHONE_PRESSED: 'center_phone_pressed',
                CENTER_EVENT_PRESSED: 'center_event_pressed',
                // Settings
                SETTINGS_OPENED: 'settings_opened',
                THEME_CHANGED: 'theme_changed',
                PRIVACY_POLICY_VIEWED: 'privacy_policy_viewed',
                TERMS_VIEWED: 'terms_viewed',
                COOKIE_POLICY_VIEWED: 'cookie_policy_viewed',
                DELETE_ACCOUNT_STARTED: 'delete_account_started',
                ACCOUNT_DELETED: 'account_deleted',
                DELETE_ACCOUNT_FAILED: 'delete_account_failed',
                // Navigation
                NAV_PROFILE_OPENED: 'nav_profile_opened',
                NAV_SETTINGS_OPENED: 'nav_settings_opened',
                NAV_CREATE_EVENT: 'nav_create_event',
            });
        }
    };
});
