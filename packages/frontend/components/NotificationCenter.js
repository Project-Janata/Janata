System.register(["react/jsx-runtime", "react", "react-native", "../utils/notificationService", "./NotificationItem"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, notificationService_1, NotificationItem_1, NotificationCenter, styles;
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
            },
            function (NotificationItem_1_1) {
                NotificationItem_1 = NotificationItem_1_1;
            }
        ],
        execute: function () {
            exports_1("NotificationCenter", NotificationCenter = ({ onNotificationPress }) => {
                const [notifications, setNotifications] = react_1.useState([]);
                const [loading, setLoading] = react_1.useState(true);
                const [hasMore, setHasMore] = react_1.useState(true);
                const [offset, setOffset] = react_1.useState(0);
                const [filter, setFilter] = react_1.useState('all');
                react_1.useEffect(() => {
                    loadNotifications();
                }, [filter]);
                const loadNotifications = async () => {
                    try {
                        setLoading(true);
                        const data = await notificationService_1.getNotifications({
                            limit: 50,
                            offset: 0,
                            unreadOnly: filter === 'unread',
                        });
                        setNotifications(data.notifications);
                        setOffset(0);
                        setHasMore(data.count === 50);
                    }
                    catch (error) {
                        console.error('Failed to load notifications:', error);
                        react_native_1.Alert.alert('Error', 'Failed to load notifications');
                    }
                    finally {
                        setLoading(false);
                    }
                };
                const loadMore = async () => {
                    if (!hasMore || loading)
                        return;
                    try {
                        const newOffset = offset + 50;
                        const data = await notificationService_1.getNotifications({
                            limit: 50,
                            offset: newOffset,
                            unreadOnly: filter === 'unread',
                        });
                        setNotifications((prev) => [...prev, ...data.notifications]);
                        setOffset(newOffset);
                        setHasMore(data.count === 50);
                    }
                    catch (error) {
                        console.error('Failed to load more notifications:', error);
                    }
                };
                const handleMarkAsRead = async (notificationId) => {
                    try {
                        await notificationService_1.markNotificationAsRead(notificationId);
                        setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, isRead: true } : n));
                    }
                    catch (error) {
                        console.error('Failed to mark notification as read:', error);
                        react_native_1.Alert.alert('Error', 'Failed to mark notification as read');
                    }
                };
                const handleMarkAllAsRead = async () => {
                    try {
                        await notificationService_1.markAllNotificationsAsRead();
                        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                    }
                    catch (error) {
                        console.error('Failed to mark all as read:', error);
                        react_native_1.Alert.alert('Error', 'Failed to mark all as read');
                    }
                };
                const handleArchive = async (notificationId) => {
                    try {
                        await notificationService_1.archiveNotification(notificationId);
                        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
                    }
                    catch (error) {
                        console.error('Failed to archive notification:', error);
                        react_native_1.Alert.alert('Error', 'Failed to archive notification');
                    }
                };
                const handleDelete = async (notificationId) => {
                    try {
                        await notificationService_1.deleteNotification(notificationId);
                        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
                    }
                    catch (error) {
                        console.error('Failed to delete notification:', error);
                        react_native_1.Alert.alert('Error', 'Failed to delete notification');
                    }
                };
                const unreadCount = notifications.filter((n) => !n.isRead).length;
                return (_jsxs(react_native_1.View, { style: styles.container, children: [_jsxs(react_native_1.View, { style: styles.header, children: [_jsx(react_native_1.Text, { style: styles.headerTitle, children: "Notifications" }), unreadCount > 0 && (_jsx(react_native_1.View, { style: styles.badge, children: _jsx(react_native_1.Text, { style: styles.badgeText, children: unreadCount }) }))] }), _jsxs(react_native_1.View, { style: styles.filterContainer, children: [_jsx(react_native_1.TouchableOpacity, { style: [styles.filterButton, filter === 'all' && styles.filterButtonActive], onPress: () => setFilter('all'), children: _jsx(react_native_1.Text, { style: [styles.filterText, filter === 'all' && styles.filterTextActive], children: "All" }) }), _jsx(react_native_1.TouchableOpacity, { style: [styles.filterButton, filter === 'unread' && styles.filterButtonActive], onPress: () => setFilter('unread'), children: _jsxs(react_native_1.Text, { style: [styles.filterText, filter === 'unread' && styles.filterTextActive], children: ["Unread (", unreadCount, ")"] }) }), unreadCount > 0 && (_jsx(react_native_1.TouchableOpacity, { style: styles.markAllButton, onPress: handleMarkAllAsRead, children: _jsx(react_native_1.Text, { style: styles.markAllText, children: "Mark all as read" }) }))] }), loading && notifications.length === 0 ? (_jsxs(react_native_1.View, { style: styles.centerContent, children: [_jsx(react_native_1.ActivityIndicator, { size: "large", color: "#007AFF" }), _jsx(react_native_1.Text, { style: styles.loadingText, children: "Loading notifications..." })] })) : notifications.length === 0 ? (_jsx(react_native_1.View, { style: styles.centerContent, children: _jsx(react_native_1.Text, { style: styles.emptyText, children: filter === 'unread' ? 'No unread notifications' : 'No notifications yet' }) })) : (_jsx(react_native_1.FlatList, { data: notifications, renderItem: ({ item }) => (_jsx(NotificationItem_1.NotificationItem, { notification: item, onPress: () => onNotificationPress?.(item), onMarkAsRead: () => handleMarkAsRead(item.id), onArchive: () => handleArchive(item.id), onDelete: () => handleDelete(item.id) })), keyExtractor: (item) => item.id, onEndReached: loadMore, onEndReachedThreshold: 0.3, ListFooterComponent: hasMore ? _jsx(react_native_1.ActivityIndicator, { size: "small", color: "#007AFF", style: styles.footer }) : null }))] }));
            });
            styles = react_native_1.StyleSheet.create({
                container: {
                    flex: 1,
                    backgroundColor: '#fff',
                },
                header: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f0f0f0',
                },
                headerTitle: {
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: '#000',
                },
                badge: {
                    backgroundColor: '#007AFF',
                    borderRadius: 12,
                    width: 24,
                    height: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                badgeText: {
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 'bold',
                },
                filterContainer: {
                    flexDirection: 'row',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    gap: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f0f0f0',
                    alignItems: 'center',
                },
                filterButton: {
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: '#f0f0f0',
                },
                filterButtonActive: {
                    backgroundColor: '#007AFF',
                },
                filterText: {
                    fontSize: 12,
                    color: '#666',
                    fontWeight: '500',
                },
                filterTextActive: {
                    color: '#fff',
                },
                markAllButton: {
                    marginLeft: 'auto',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                },
                markAllText: {
                    fontSize: 12,
                    color: '#007AFF',
                    fontWeight: '500',
                },
                centerContent: {
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                loadingText: {
                    marginTop: 12,
                    fontSize: 14,
                    color: '#666',
                },
                emptyText: {
                    fontSize: 16,
                    color: '#999',
                },
                footer: {
                    paddingVertical: 16,
                },
            });
        }
    };
});
