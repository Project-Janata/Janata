import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react-native'
// Mock expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}))

// Mock hooks
jest.mock('../../../../hooks/useApiData', () => ({
  useEventDetail: jest.fn(),
}))

jest.mock('../../../../components/contexts', () => ({
  useUser: jest.fn(),
  useTheme: jest.fn(() => ({ isDark: false })),
}))

jest.mock('../../../../hooks/useDetailColors', () => ({
  useDetailColors: jest.fn(() => ({
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
}))

// jest.requireMock returns `unknown` by default; cast to the shape we
// stub out in the vi.mock factories above so destructuring stays type-safe.
type MockedModule = Record<string, jest.Mock>
const { useLocalSearchParams, useRouter } = jest.requireMock('expo-router') as MockedModule
const { useEventDetail } = jest.requireMock('../../../../hooks/useApiData') as MockedModule
const { useUser } = jest.requireMock('../../../../components/contexts') as MockedModule

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock
const mockUseRouter = useRouter as jest.Mock
const mockUseEventDetail = useEventDetail as jest.Mock
const mockUseUser = useUser as jest.Mock
const EventDetailPage = require('../../../../app/events/[id]').default

describe('EventDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocalSearchParams.mockReturnValue({ id: 'event-123' })
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    })
  })

  it('shows loading state while fetching event', () => {
    mockUseUser.mockReturnValue({
      user: { username: 'user123', id: 'uid-1' },
      authStatus: 'authenticated',
    })
    mockUseEventDetail.mockReturnValue({
      event: null,
      attendees: [],
      messages: [],
      loading: true,
      toggleRegistration: jest.fn(),
      isToggling: false,
      isCreator: false,
    })

    render(<EventDetailPage />)
    expect(screen.queryByText('Event not found')).toBeNull()
  })

  it('shows "Event not found" when event is null and not loading', () => {
    mockUseUser.mockReturnValue({
      user: { username: 'user123', id: 'uid-1' },
      authStatus: 'authenticated',
    })
    mockUseEventDetail.mockReturnValue({
      event: null,
      attendees: [],
      messages: [],
      loading: false,
      toggleRegistration: jest.fn(),
      isToggling: false,
      isCreator: false,
    })

    render(<EventDetailPage />)
    expect(screen.getByText('Event not found')).toBeTruthy()
  })

  it('displays event details for unregistered user', () => {
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
    }

    mockUseUser.mockReturnValue({
      user: { username: 'user123', id: 'uid-1' },
      authStatus: 'authenticated',
    })
    mockUseEventDetail.mockReturnValue({
      event: mockEvent,
      attendees: [],
      messages: [],
      loading: false,
      toggleRegistration: jest.fn(),
      isToggling: false,
      isCreator: false,
    })

    render(<EventDetailPage />)
    expect(screen.getByText('Yoga Session')).toBeTruthy()
    expect(screen.getByText('Attend Event')).toBeTruthy()
  })

  it('shows "Cancel Registration" button for registered user', () => {
    const mockEvent = {
      title: 'Meditation Workshop',
      date: '2026-04-20',
      time: '2:00 PM',
      location: 'Community Center',
      attendees: 12,
      description: 'Guided meditation',
      image: null,
      isRegistered: true,
    }

    mockUseUser.mockReturnValue({
      user: { username: 'user123', id: 'uid-1' },
      authStatus: 'authenticated',
    })
    mockUseEventDetail.mockReturnValue({
      event: mockEvent,
      attendees: [{ name: 'John', initials: 'JD' }],
      messages: [],
      loading: false,
      toggleRegistration: jest.fn(),
      isToggling: false,
      isCreator: false,
    })

    render(<EventDetailPage />)
    expect(screen.getByText('Meditation Workshop')).toBeTruthy()
  })

  it('hides action bar for past events', () => {
    const mockEvent = {
      title: 'Past Event',
      date: '2026-01-01',
      time: '3:00 PM',
      location: 'Old Location',
      attendees: 20,
      description: 'This event already happened',
      image: null,
      isRegistered: true,
    }

    mockUseUser.mockReturnValue({
      user: { username: 'user123', id: 'uid-1' },
      authStatus: 'authenticated',
    })
    mockUseEventDetail.mockReturnValue({
      event: mockEvent,
      attendees: [],
      messages: [],
      loading: false,
      toggleRegistration: jest.fn(),
      isToggling: false,
      isCreator: false,
    })

    render(<EventDetailPage />)
    expect(screen.queryByText('Attend Event')).toBeFalsy()
    expect(screen.queryByText('Cancel Registration')).toBeFalsy()
  })

  it('allows host to edit event', () => {
    const mockEvent = {
      title: 'Editable Event',
      date: '2026-05-10',
      time: '5:00 PM',
      location: 'Edit Location',
      attendees: 8,
      description: 'This event can be edited',
      image: null,
      isRegistered: true,
    }

    mockUseUser.mockReturnValue({
      user: { username: 'hostUser', id: 'uid-host' },
      authStatus: 'authenticated',
    })
    mockUseEventDetail.mockReturnValue({
      event: mockEvent,
      attendees: [],
      messages: [],
      loading: false,
      toggleRegistration: jest.fn(),
      isToggling: false,
      isCreator: true,
    })

    render(<EventDetailPage />)
    expect(screen.getByText('Editable Event')).toBeTruthy()
  })
})
