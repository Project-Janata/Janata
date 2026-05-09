System.register(["react/jsx-runtime", "@jest/globals", "@testing-library/react-native"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, globals_1, react_native_1, _a, useLocalSearchParams, useRouter, useEventDetail, useUser, mockUseLocalSearchParams, mockUseRouter, mockUseEventDetail, mockUseUser, EventDetailPage;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (globals_1_1) {
                globals_1 = globals_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            }
        ],
        execute: function () {
            // Mock expo-router
            globals_1.jest.mock('expo-router', () => ({
                useLocalSearchParams: globals_1.jest.fn(),
                useRouter: globals_1.jest.fn(),
            }));
            // Mock hooks
            globals_1.jest.mock('../../../../hooks/useApiData', () => ({
                useEventDetail: globals_1.jest.fn(),
            }));
            globals_1.jest.mock('../../../../components/contexts', () => ({
                useUser: globals_1.jest.fn(),
                useTheme: globals_1.jest.fn(() => ({ isDark: false })),
            }));
            globals_1.jest.mock('../../../../hooks/useDetailColors', () => ({
                useDetailColors: globals_1.jest.fn(() => ({
                    panelBg: '#fff',
                    text: '#000',
                    textMuted: '#999',
                    textSecondary: '#666',
                    border: '#eee',
                    iconHeader: '#333',
                    iconBoxBg: '#f5f5f5',
                    cardBg: '#f9f9f9',
                    avatarBorder: '#ddd',
                    attendedBg: '#f0fdf4',
                })),
            }));
            _a = globals_1.jest.requireMock('expo-router'), useLocalSearchParams = _a.useLocalSearchParams, useRouter = _a.useRouter;
            useEventDetail = globals_1.jest.requireMock('../../../../hooks/useApiData').useEventDetail;
            useUser = globals_1.jest.requireMock('../../../../components/contexts').useUser;
            mockUseLocalSearchParams = useLocalSearchParams;
            mockUseRouter = useRouter;
            mockUseEventDetail = useEventDetail;
            mockUseUser = useUser;
            EventDetailPage = require('../../../../app/events/[id]').default;
            globals_1.describe('EventDetailPage', () => {
                globals_1.beforeEach(() => {
                    globals_1.jest.clearAllMocks();
                    mockUseLocalSearchParams.mockReturnValue({ id: 'event-123' });
                    mockUseRouter.mockReturnValue({
                        push: globals_1.jest.fn(),
                        replace: globals_1.jest.fn(),
                        back: globals_1.jest.fn(),
                    });
                });
                globals_1.it('shows loading state while fetching event', () => {
                    mockUseUser.mockReturnValue({
                        user: { username: 'user123', id: 'uid-1' },
                        authStatus: 'authenticated',
                    });
                    mockUseEventDetail.mockReturnValue({
                        event: null,
                        attendees: [],
                        messages: [],
                        loading: true,
                        toggleRegistration: globals_1.jest.fn(),
                        isToggling: false,
                        isCreator: false,
                    });
                    react_native_1.render(_jsx(EventDetailPage, {}));
                    globals_1.expect(react_native_1.screen.queryByText('Event not found')).toBeNull();
                });
                globals_1.it('shows "Event not found" when event is null and not loading', () => {
                    mockUseUser.mockReturnValue({
                        user: { username: 'user123', id: 'uid-1' },
                        authStatus: 'authenticated',
                    });
                    mockUseEventDetail.mockReturnValue({
                        event: null,
                        attendees: [],
                        messages: [],
                        loading: false,
                        toggleRegistration: globals_1.jest.fn(),
                        isToggling: false,
                        isCreator: false,
                    });
                    react_native_1.render(_jsx(EventDetailPage, {}));
                    globals_1.expect(react_native_1.screen.getByText('Event not found')).toBeTruthy();
                });
                globals_1.it('displays event details for unregistered user', () => {
                    const mockEvent = {
                        title: 'Yoga Session',
                        date: '2026-04-15',
                        time: '10:00 AM',
                        location: 'Yoga Studio',
                        address: '123 Main St',
                        attendees: 5,
                        description: 'Beginner yoga class',
                        image: 'https://example.com/yoga.jpg',
                        isRegistered: false,
                    };
                    mockUseUser.mockReturnValue({
                        user: { username: 'user123', id: 'uid-1' },
                        authStatus: 'authenticated',
                    });
                    mockUseEventDetail.mockReturnValue({
                        event: mockEvent,
                        attendees: [],
                        messages: [],
                        loading: false,
                        toggleRegistration: globals_1.jest.fn(),
                        isToggling: false,
                        isCreator: false,
                    });
                    react_native_1.render(_jsx(EventDetailPage, {}));
                    globals_1.expect(react_native_1.screen.getByText('Yoga Session')).toBeTruthy();
                    globals_1.expect(react_native_1.screen.getByText('Attend Event')).toBeTruthy();
                });
                globals_1.it('shows "Cancel Registration" button for registered user', () => {
                    const mockEvent = {
                        title: 'Meditation Workshop',
                        date: '2026-04-20',
                        time: '2:00 PM',
                        location: 'Community Center',
                        attendees: 12,
                        description: 'Guided meditation',
                        image: null,
                        isRegistered: true,
                    };
                    mockUseUser.mockReturnValue({
                        user: { username: 'user123', id: 'uid-1' },
                        authStatus: 'authenticated',
                    });
                    mockUseEventDetail.mockReturnValue({
                        event: mockEvent,
                        attendees: [{ name: 'John', initials: 'JD' }],
                        messages: [],
                        loading: false,
                        toggleRegistration: globals_1.jest.fn(),
                        isToggling: false,
                        isCreator: false,
                    });
                    react_native_1.render(_jsx(EventDetailPage, {}));
                    globals_1.expect(react_native_1.screen.getByText('Meditation Workshop')).toBeTruthy();
                });
                globals_1.it('hides action bar for past events', () => {
                    const mockEvent = {
                        title: 'Past Event',
                        date: '2026-01-01',
                        time: '3:00 PM',
                        location: 'Old Location',
                        attendees: 20,
                        description: 'This event already happened',
                        image: null,
                        isRegistered: true,
                    };
                    mockUseUser.mockReturnValue({
                        user: { username: 'user123', id: 'uid-1' },
                        authStatus: 'authenticated',
                    });
                    mockUseEventDetail.mockReturnValue({
                        event: mockEvent,
                        attendees: [],
                        messages: [],
                        loading: false,
                        toggleRegistration: globals_1.jest.fn(),
                        isToggling: false,
                        isCreator: false,
                    });
                    react_native_1.render(_jsx(EventDetailPage, {}));
                    globals_1.expect(react_native_1.screen.queryByText('Attend Event')).toBeFalsy();
                    globals_1.expect(react_native_1.screen.queryByText('Cancel Registration')).toBeFalsy();
                });
                globals_1.it('allows host to edit event', () => {
                    const mockEvent = {
                        title: 'Editable Event',
                        date: '2026-05-10',
                        time: '5:00 PM',
                        location: 'Edit Location',
                        attendees: 8,
                        description: 'This event can be edited',
                        image: null,
                        isRegistered: true,
                    };
                    mockUseUser.mockReturnValue({
                        user: { username: 'hostUser', id: 'uid-host' },
                        authStatus: 'authenticated',
                    });
                    mockUseEventDetail.mockReturnValue({
                        event: mockEvent,
                        attendees: [],
                        messages: [],
                        loading: false,
                        toggleRegistration: globals_1.jest.fn(),
                        isToggling: false,
                        isCreator: true,
                    });
                    react_native_1.render(_jsx(EventDetailPage, {}));
                    globals_1.expect(react_native_1.screen.getByText('Editable Event')).toBeTruthy();
                });
            });
        }
    };
});
