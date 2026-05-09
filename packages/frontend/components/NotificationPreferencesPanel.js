System.register(["react/jsx-runtime", "react", "react-native", "../utils/notificationService"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, notificationService_1, NotificationPreferencesPanel, PreferenceRow, styles;
    var __moduleName = context_1 && context_1.id;
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
            function (notificationService_1_1) {
                notificationService_1 = notificationService_1_1;
            }
        ],
        execute: function () {
            exports_1("NotificationPreferencesPanel", NotificationPreferencesPanel = () => {
                const [preferences, setPreferences] = react_1.useState(null);
                const [loading, setLoading] = react_1.useState(true);
                const [saving, setSaving] = react_1.useState(false);
                react_1.useEffect(() => {
                    loadPreferences();
                }, []);
                const loadPreferences = async () => {
                    try {
                        setLoading(true);
                        const prefs = await notificationService_1.getNotificationPreferences();
                        setPreferences(prefs);
                    }
                    catch (error) {
                        console.error('Failed to load preferences:', error);
                        react_native_1.Alert.alert('Error', 'Failed to load notification preferences');
                    }
                    finally {
                        setLoading(false);
                    }
                };
                const updatePreference = async (key, value) => {
                    if (!preferences)
                        return;
                    try {
                        setSaving(true);
                        const updated = await notificationService_1.updateNotificationPreferences({
                            [key]: value,
                        });
                        setPreferences(updated);
                    }
                    catch (error) {
                        console.error('Failed to update preference:', error);
                        react_native_1.Alert.alert('Error', 'Failed to update preference');
                        // Revert the change
                        loadPreferences();
                    }
                    finally {
                        setSaving(false);
                    }
                };
                if (loading) {
                    return (_jsx(react_native_1.View, { style: styles.container, children: _jsx(react_native_1.ActivityIndicator, { size: "large", color: "#007AFF" }) }));
                }
                if (!preferences) {
                    return (_jsx(react_native_1.View, { style: styles.container, children: _jsx(react_native_1.Text, { style: styles.errorText, children: "Failed to load preferences" }) }));
                }
                return (_jsxs(react_native_1.ScrollView, { style: styles.container, contentContainerStyle: styles.content, children: [_jsxs(react_native_1.View, { style: styles.section, children: [_jsx(react_native_1.Text, { style: styles.sectionTitle, children: "Notification Channels" }), _jsx(PreferenceRow, { label: "In-App Notifications", value: preferences.inAppEnabled, onValueChange: (value) => updatePreference('inAppEnabled', value), disabled: saving }), _jsx(PreferenceRow, { label: "Push Notifications (Coming Soon)", value: preferences.pushEnabled, onValueChange: (value) => updatePreference('pushEnabled', value), disabled: saving || true }), _jsx(PreferenceRow, { label: "Email Notifications (Coming Soon)", value: preferences.emailEnabled, onValueChange: (value) => updatePreference('emailEnabled', value), disabled: saving || true })] }), _jsxs(react_native_1.View, { style: styles.section, children: [_jsx(react_native_1.Text, { style: styles.sectionTitle, children: "Notification Types" }), _jsx(PreferenceRow, { label: "Event Reminders", description: "Get reminded about upcoming events", value: preferences.eventReminders, onValueChange: (value) => updatePreference('eventReminders', value), disabled: saving }), _jsx(PreferenceRow, { label: "Event Created", description: "New events at your center", value: preferences.eventCreated, onValueChange: (value) => updatePreference('eventCreated', value), disabled: saving }), _jsx(PreferenceRow, { label: "Event Cancelled", description: "Event cancellations", value: preferences.eventCancelled, onValueChange: (value) => updatePreference('eventCancelled', value), disabled: saving }), _jsx(PreferenceRow, { label: "Event Updated", description: "Changes to event details", value: preferences.eventUpdated, onValueChange: (value) => updatePreference('eventUpdated', value), disabled: saving }), _jsx(PreferenceRow, { label: "Attendee Joined", description: "When others join your events", value: preferences.attendeeJoined, onValueChange: (value) => updatePreference('attendeeJoined', value), disabled: saving }), _jsx(PreferenceRow, { label: "Center Announcements", description: "Important updates from your center", value: preferences.centerAnnouncements, onValueChange: (value) => updatePreference('centerAnnouncements', value), disabled: saving })] }), _jsxs(react_native_1.View, { style: styles.section, children: [_jsx(react_native_1.Text, { style: styles.sectionTitle, children: "Quiet Hours (Coming Soon)" }), _jsx(react_native_1.Text, { style: styles.infoText, children: "Mute notifications during specific hours" })] }), _jsx(react_native_1.View, { style: styles.spacer })] }));
            });
            PreferenceRow = ({ label, description, value, onValueChange, disabled, }) => {
                return (_jsxs(react_native_1.View, { style: styles.row, children: [_jsxs(react_native_1.View, { style: styles.rowContent, children: [_jsx(react_native_1.Text, { style: styles.rowLabel, children: label }), description && _jsx(react_native_1.Text, { style: styles.rowDescription, children: description })] }), _jsx(react_native_1.Switch, { value: value, onValueChange: onValueChange, disabled: disabled, trackColor: { false: '#ccc', true: '#81C784' }, thumbColor: value ? '#4CAF50' : '#f4f3f4' })] }));
            };
            styles = react_native_1.StyleSheet.create({
                container: {
                    flex: 1,
                    backgroundColor: '#fff',
                },
                content: {
                    padding: 16,
                },
                section: {
                    marginBottom: 24,
                },
                sectionTitle: {
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#000',
                    marginBottom: 12,
                    paddingBottom: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f0f0f0',
                },
                row: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f9f9f9',
                },
                rowContent: {
                    flex: 1,
                    marginRight: 12,
                },
                rowLabel: {
                    fontSize: 15,
                    fontWeight: '500',
                    color: '#000',
                    marginBottom: 4,
                },
                rowDescription: {
                    fontSize: 13,
                    color: '#666',
                    marginTop: 4,
                },
                infoText: {
                    fontSize: 14,
                    color: '#666',
                    fontStyle: 'italic',
                },
                errorText: {
                    fontSize: 14,
                    color: '#d32f2f',
                    textAlign: 'center',
                },
                spacer: {
                    height: 24,
                },
            });
        }
    };
});
