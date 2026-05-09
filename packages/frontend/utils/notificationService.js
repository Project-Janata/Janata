/**
 * notificationService.ts
 *
 * Frontend notification service for Chinmaya Janata
 * Handles fetching, caching, and managing user notifications
 */
System.register(["./api", "../components/utils/tokenStorage"], function (exports_1, context_1) {
    "use strict";
    var api_1, tokenStorage_1, NotificationTypes;
    var __moduleName = context_1 && context_1.id;
    // Helper function for authenticated API calls
    async function authFetch(endpoint, options = {}) {
        const token = await tokenStorage_1.getStoredToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
        const response = await fetch(`${api_1.API_URL}${endpoint}`, {
            ...options,
            headers,
        });
        return response;
    }
    /**
     * Get all notifications for the current user
     */
    async function getNotifications(options) {
        const params = new URLSearchParams();
        if (options?.limit)
            params.append('limit', options.limit.toString());
        if (options?.offset)
            params.append('offset', options.offset.toString());
        if (options?.unreadOnly)
            params.append('unreadOnly', 'true');
        const response = await authFetch(`/notifications?${params.toString()}`);
        return response.json();
    }
    exports_1("getNotifications", getNotifications);
    /**
     * Get unread notification count
     */
    async function getUnreadNotificationCount() {
        const response = await authFetch('/notifications/unread-count');
        const data = await response.json();
        return data.unreadCount;
    }
    exports_1("getUnreadNotificationCount", getUnreadNotificationCount);
    /**
     * Mark a notification as read
     */
    async function markNotificationAsRead(notificationId) {
        await authFetch(`/notifications/${notificationId}/read`, {
            method: 'PUT',
        });
    }
    exports_1("markNotificationAsRead", markNotificationAsRead);
    /**
     * Mark all notifications as read
     */
    async function markAllNotificationsAsRead() {
        await authFetch('/notifications/mark-all-read', {
            method: 'PUT',
        });
    }
    exports_1("markAllNotificationsAsRead", markAllNotificationsAsRead);
    /**
     * Archive a notification
     */
    async function archiveNotification(notificationId) {
        await authFetch(`/notifications/${notificationId}/archive`, {
            method: 'PUT',
        });
    }
    exports_1("archiveNotification", archiveNotification);
    /**
     * Delete a notification
     */
    async function deleteNotification(notificationId) {
        await authFetch(`/notifications/${notificationId}`, {
            method: 'DELETE',
        });
    }
    exports_1("deleteNotification", deleteNotification);
    /**
     * Get notification preferences
     */
    async function getNotificationPreferences() {
        const response = await authFetch('/notifications/preferences');
        return response.json();
    }
    exports_1("getNotificationPreferences", getNotificationPreferences);
    /**
     * Update notification preferences
     */
    async function updateNotificationPreferences(preferences) {
        const response = await authFetch('/notifications/preferences', {
            method: 'PUT',
            body: JSON.stringify(preferences),
        });
        return response.json();
    }
    exports_1("updateNotificationPreferences", updateNotificationPreferences);
    /**
     * Get notification type name from ID
     */
    function getNotificationTypeName(typeId) {
        const typeMap = {
            1: 'Event Reminder',
            2: 'Event Created',
            3: 'Event Cancelled',
            4: 'Event Updated',
            5: 'Attendee Joined',
            6: 'Center Announcement',
            7: 'System Notification',
        };
        return typeMap[typeId] || 'Notification';
    }
    exports_1("getNotificationTypeName", getNotificationTypeName);
    /**
     * Get notification type icon from ID
     */
    function getNotificationTypeIcon(typeId) {
        const iconMap = {
            1: 'bell',
            2: 'calendar-plus',
            3: 'calendar-minus',
            4: 'calendar-edit',
            5: 'user-plus',
            6: 'megaphone',
            7: 'info',
        };
        return iconMap[typeId] || 'bell';
    }
    exports_1("getNotificationTypeIcon", getNotificationTypeIcon);
    /**
     * Filter notifications by type
     */
    function filterNotificationsByType(notifications, typeId) {
        return notifications.filter((n) => n.typeId === typeId);
    }
    exports_1("filterNotificationsByType", filterNotificationsByType);
    /**
     * Get unread notifications
     */
    function getUnreadNotifications(notifications) {
        return notifications.filter((n) => !n.isRead);
    }
    exports_1("getUnreadNotifications", getUnreadNotifications);
    /**
     * Sort notifications by creation date (newest first)
     */
    function sortNotificationsByDate(notifications) {
        return [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    exports_1("sortNotificationsByDate", sortNotificationsByDate);
    return {
        setters: [
            function (api_1_1) {
                api_1 = api_1_1;
            },
            function (tokenStorage_1_1) {
                tokenStorage_1 = tokenStorage_1_1;
            }
        ],
        execute: function () {
            exports_1("NotificationTypes", NotificationTypes = {
                EVENT_REMINDER: 1,
                EVENT_CREATED: 2,
                EVENT_CANCELLED: 3,
                EVENT_UPDATED: 4,
                ATTENDEE_JOINED: 5,
                CENTER_ANNOUNCEMENT: 6,
                SYSTEM_NOTIFICATION: 7,
            });
        }
    };
});
