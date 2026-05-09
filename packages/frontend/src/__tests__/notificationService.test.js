/**
 * notificationService.test.ts
 *
 * Tests for the frontend notification service
 */
System.register(["vitest", "../../utils/notificationService"], function (exports_1, context_1) {
    "use strict";
    var vitest_1, notificationService_1;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (vitest_1_1) {
                vitest_1 = vitest_1_1;
            },
            function (notificationService_1_1) {
                notificationService_1 = notificationService_1_1;
            }
        ],
        execute: function () {
            vitest_1.describe('Notification Service', () => {
                vitest_1.describe('Notification Type Names', () => {
                    vitest_1.it('should return correct names for notification types', () => {
                        vitest_1.expect(notificationService_1.getNotificationTypeName(notificationService_1.NotificationTypes.EVENT_REMINDER)).toBe('Event Reminder');
                        vitest_1.expect(notificationService_1.getNotificationTypeName(notificationService_1.NotificationTypes.EVENT_CREATED)).toBe('Event Created');
                        vitest_1.expect(notificationService_1.getNotificationTypeName(notificationService_1.NotificationTypes.EVENT_CANCELLED)).toBe('Event Cancelled');
                        vitest_1.expect(notificationService_1.getNotificationTypeName(notificationService_1.NotificationTypes.EVENT_UPDATED)).toBe('Event Updated');
                        vitest_1.expect(notificationService_1.getNotificationTypeName(notificationService_1.NotificationTypes.ATTENDEE_JOINED)).toBe('Attendee Joined');
                        vitest_1.expect(notificationService_1.getNotificationTypeName(notificationService_1.NotificationTypes.CENTER_ANNOUNCEMENT)).toBe('Center Announcement');
                        vitest_1.expect(notificationService_1.getNotificationTypeName(notificationService_1.NotificationTypes.SYSTEM_NOTIFICATION)).toBe('System Notification');
                    });
                    vitest_1.it('should return default name for unknown type', () => {
                        vitest_1.expect(notificationService_1.getNotificationTypeName(999)).toBe('Notification');
                    });
                });
                vitest_1.describe('Notification Type Icons', () => {
                    vitest_1.it('should return correct icons for notification types', () => {
                        vitest_1.expect(notificationService_1.getNotificationTypeIcon(notificationService_1.NotificationTypes.EVENT_REMINDER)).toBe('bell');
                        vitest_1.expect(notificationService_1.getNotificationTypeIcon(notificationService_1.NotificationTypes.EVENT_CREATED)).toBe('calendar-plus');
                        vitest_1.expect(notificationService_1.getNotificationTypeIcon(notificationService_1.NotificationTypes.EVENT_CANCELLED)).toBe('calendar-minus');
                        vitest_1.expect(notificationService_1.getNotificationTypeIcon(notificationService_1.NotificationTypes.EVENT_UPDATED)).toBe('calendar-edit');
                        vitest_1.expect(notificationService_1.getNotificationTypeIcon(notificationService_1.NotificationTypes.ATTENDEE_JOINED)).toBe('user-plus');
                        vitest_1.expect(notificationService_1.getNotificationTypeIcon(notificationService_1.NotificationTypes.CENTER_ANNOUNCEMENT)).toBe('megaphone');
                        vitest_1.expect(notificationService_1.getNotificationTypeIcon(notificationService_1.NotificationTypes.SYSTEM_NOTIFICATION)).toBe('info');
                    });
                    vitest_1.it('should return default icon for unknown type', () => {
                        vitest_1.expect(notificationService_1.getNotificationTypeIcon(999)).toBe('bell');
                    });
                });
                vitest_1.describe('Notification Filtering', () => {
                    const mockNotifications = [
                        {
                            id: '1',
                            userId: 'user-1',
                            typeId: notificationService_1.NotificationTypes.EVENT_CREATED,
                            title: 'New Event',
                            message: 'A new event was created',
                            data: null,
                            isRead: false,
                            isArchived: false,
                            readAt: null,
                            actionUrl: null,
                            relatedEventId: 'event-1',
                            relatedUserId: null,
                            createdAt: '2026-04-07T10:00:00Z',
                            updatedAt: '2026-04-07T10:00:00Z',
                        },
                        {
                            id: '2',
                            userId: 'user-1',
                            typeId: notificationService_1.NotificationTypes.EVENT_REMINDER,
                            title: 'Event Reminder',
                            message: 'Your event starts soon',
                            data: null,
                            isRead: true,
                            isArchived: false,
                            readAt: '2026-04-07T10:05:00Z',
                            actionUrl: null,
                            relatedEventId: 'event-2',
                            relatedUserId: null,
                            createdAt: '2026-04-07T09:00:00Z',
                            updatedAt: '2026-04-07T10:05:00Z',
                        },
                        {
                            id: '3',
                            userId: 'user-1',
                            typeId: notificationService_1.NotificationTypes.EVENT_CREATED,
                            title: 'Another Event',
                            message: 'Another event was created',
                            data: null,
                            isRead: false,
                            isArchived: false,
                            readAt: null,
                            actionUrl: null,
                            relatedEventId: 'event-3',
                            relatedUserId: null,
                            createdAt: '2026-04-07T11:00:00Z',
                            updatedAt: '2026-04-07T11:00:00Z',
                        },
                    ];
                    vitest_1.it('should filter notifications by type', () => {
                        const filtered = notificationService_1.filterNotificationsByType(mockNotifications, notificationService_1.NotificationTypes.EVENT_CREATED);
                        vitest_1.expect(filtered).toHaveLength(2);
                        vitest_1.expect(filtered.every((n) => n.typeId === notificationService_1.NotificationTypes.EVENT_CREATED)).toBe(true);
                    });
                    vitest_1.it('should return empty array when no notifications match type', () => {
                        const filtered = notificationService_1.filterNotificationsByType(mockNotifications, notificationService_1.NotificationTypes.CENTER_ANNOUNCEMENT);
                        vitest_1.expect(filtered).toHaveLength(0);
                    });
                    vitest_1.it('should get unread notifications', () => {
                        const unread = notificationService_1.getUnreadNotifications(mockNotifications);
                        vitest_1.expect(unread).toHaveLength(2);
                        vitest_1.expect(unread.every((n) => !n.isRead)).toBe(true);
                    });
                    vitest_1.it('should return empty array when all notifications are read', () => {
                        const allRead = mockNotifications.map((n) => ({ ...n, isRead: true }));
                        const unread = notificationService_1.getUnreadNotifications(allRead);
                        vitest_1.expect(unread).toHaveLength(0);
                    });
                });
                vitest_1.describe('Notification Sorting', () => {
                    const mockNotifications = [
                        {
                            id: '1',
                            userId: 'user-1',
                            typeId: notificationService_1.NotificationTypes.EVENT_CREATED,
                            title: 'Old Event',
                            message: 'Old event',
                            data: null,
                            isRead: false,
                            isArchived: false,
                            readAt: null,
                            actionUrl: null,
                            relatedEventId: 'event-1',
                            relatedUserId: null,
                            createdAt: '2026-04-07T08:00:00Z',
                            updatedAt: '2026-04-07T08:00:00Z',
                        },
                        {
                            id: '2',
                            userId: 'user-1',
                            typeId: notificationService_1.NotificationTypes.EVENT_REMINDER,
                            title: 'Recent Event',
                            message: 'Recent event',
                            data: null,
                            isRead: true,
                            isArchived: false,
                            readAt: '2026-04-07T10:05:00Z',
                            actionUrl: null,
                            relatedEventId: 'event-2',
                            relatedUserId: null,
                            createdAt: '2026-04-07T10:00:00Z',
                            updatedAt: '2026-04-07T10:05:00Z',
                        },
                        {
                            id: '3',
                            userId: 'user-1',
                            typeId: notificationService_1.NotificationTypes.EVENT_CREATED,
                            title: 'Newest Event',
                            message: 'Newest event',
                            data: null,
                            isRead: false,
                            isArchived: false,
                            readAt: null,
                            actionUrl: null,
                            relatedEventId: 'event-3',
                            relatedUserId: null,
                            createdAt: '2026-04-07T11:00:00Z',
                            updatedAt: '2026-04-07T11:00:00Z',
                        },
                    ];
                    vitest_1.it('should sort notifications by date (newest first)', () => {
                        const sorted = notificationService_1.sortNotificationsByDate(mockNotifications);
                        vitest_1.expect(sorted[0].id).toBe('3');
                        vitest_1.expect(sorted[1].id).toBe('2');
                        vitest_1.expect(sorted[2].id).toBe('1');
                    });
                    vitest_1.it('should not modify original array', () => {
                        const original = [...mockNotifications];
                        notificationService_1.sortNotificationsByDate(mockNotifications);
                        vitest_1.expect(mockNotifications).toEqual(original);
                    });
                });
                vitest_1.describe('Notification Types Enum', () => {
                    vitest_1.it('should have all notification types defined', () => {
                        vitest_1.expect(notificationService_1.NotificationTypes.EVENT_REMINDER).toBe(1);
                        vitest_1.expect(notificationService_1.NotificationTypes.EVENT_CREATED).toBe(2);
                        vitest_1.expect(notificationService_1.NotificationTypes.EVENT_CANCELLED).toBe(3);
                        vitest_1.expect(notificationService_1.NotificationTypes.EVENT_UPDATED).toBe(4);
                        vitest_1.expect(notificationService_1.NotificationTypes.ATTENDEE_JOINED).toBe(5);
                        vitest_1.expect(notificationService_1.NotificationTypes.CENTER_ANNOUNCEMENT).toBe(6);
                        vitest_1.expect(notificationService_1.NotificationTypes.SYSTEM_NOTIFICATION).toBe(7);
                    });
                });
            });
        }
    };
});
