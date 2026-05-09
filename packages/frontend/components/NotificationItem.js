System.register(["react/jsx-runtime", "react-native", "../utils/notificationService"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, notificationService_1, NotificationItem, styles;
    var __moduleName = context_1 && context_1.id;
    function getTimeString(date) {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1)
            return 'Just now';
        if (diffMins < 60)
            return `${diffMins}m ago`;
        if (diffHours < 24)
            return `${diffHours}h ago`;
        if (diffDays < 7)
            return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (notificationService_1_1) {
                notificationService_1 = notificationService_1_1;
            }
        ],
        execute: function () {
            exports_1("NotificationItem", NotificationItem = ({ notification, onPress, onMarkAsRead, onArchive, onDelete, }) => {
                const timestamp = new Date(notification.createdAt);
                const timeString = getTimeString(timestamp);
                return (_jsxs(react_native_1.TouchableOpacity, { style: [
                        styles.container,
                        !notification.isRead && styles.unread,
                    ], onPress: () => {
                        if (!notification.isRead && onMarkAsRead) {
                            onMarkAsRead();
                        }
                        onPress?.();
                    }, activeOpacity: 0.7, children: [_jsxs(react_native_1.View, { style: styles.content, children: [_jsxs(react_native_1.View, { style: styles.header, children: [_jsx(react_native_1.Text, { style: [styles.title, !notification.isRead && styles.unreadTitle], children: notification.title }), _jsx(react_native_1.Text, { style: styles.time, children: timeString })] }), _jsx(react_native_1.Text, { style: styles.message, numberOfLines: 2, children: notification.message }), _jsx(react_native_1.Text, { style: styles.type, children: notificationService_1.getNotificationTypeName(notification.typeId) })] }), !notification.isRead && _jsx(react_native_1.View, { style: styles.unreadIndicator }), _jsxs(react_native_1.View, { style: styles.actions, children: [!notification.isRead && onMarkAsRead && (_jsx(react_native_1.TouchableOpacity, { onPress: onMarkAsRead, style: styles.actionButton, children: _jsx(react_native_1.Text, { style: styles.actionText, children: "\u2713" }) })), onArchive && (_jsx(react_native_1.TouchableOpacity, { onPress: onArchive, style: styles.actionButton, children: _jsx(react_native_1.Text, { style: styles.actionText, children: "\uD83D\uDCE5" }) })), onDelete && (_jsx(react_native_1.TouchableOpacity, { onPress: onDelete, style: styles.actionButton, children: _jsx(react_native_1.Text, { style: styles.actionText, children: "\u2715" }) }))] })] }));
            });
            styles = react_native_1.StyleSheet.create({
                container: {
                    flexDirection: 'row',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f0f0f0',
                    backgroundColor: '#fff',
                    alignItems: 'center',
                },
                unread: {
                    backgroundColor: '#f9f9f9',
                },
                content: {
                    flex: 1,
                    marginRight: 8,
                },
                header: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                },
                title: {
                    fontSize: 16,
                    fontWeight: '500',
                    color: '#333',
                    flex: 1,
                },
                unreadTitle: {
                    fontWeight: '700',
                },
                time: {
                    fontSize: 12,
                    color: '#999',
                    marginLeft: 8,
                },
                message: {
                    fontSize: 14,
                    color: '#666',
                    marginBottom: 4,
                    lineHeight: 20,
                },
                type: {
                    fontSize: 12,
                    color: '#999',
                    fontStyle: 'italic',
                },
                unreadIndicator: {
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#007AFF',
                    marginRight: 8,
                },
                actions: {
                    flexDirection: 'row',
                    gap: 4,
                },
                actionButton: {
                    width: 32,
                    height: 32,
                    borderRadius: 4,
                    backgroundColor: '#f0f0f0',
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                actionText: {
                    fontSize: 16,
                },
            });
        }
    };
});
