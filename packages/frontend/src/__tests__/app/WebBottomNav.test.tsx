import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react-native'

jest.mock('expo-router', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}))
jest.mock('../../../components/contexts', () => ({
  useUser: jest.fn(),
  useTheme: jest.fn(() => ({ isDark: false })),
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
jest.mock('../../../components/ui/Avatar', () => 'Avatar')

const { usePathname, useRouter } = jest.requireMock('expo-router') as {
  usePathname: jest.Mock
  useRouter: jest.Mock
}
const { useUser } = jest.requireMock('../../../components/contexts') as {
  useUser: jest.Mock
}
const mockPush = jest.fn()
const WebBottomNav = require('../../../components/ui/WebBottomNav').default

describe('WebBottomNav', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(usePathname as jest.Mock).mockReturnValue('/')
    ;(useUser as jest.Mock).mockReturnValue({ user: { username: 'kish' } })
  })

  it('renders the primary tabs (Profile lives in the header, not the bottom bar)', () => {
    render(<WebBottomNav />)
    expect(screen.getByText('Home')).toBeTruthy()
    expect(screen.getByText('Explore')).toBeTruthy()
    expect(screen.getByText('Feed')).toBeTruthy()
    expect(screen.queryByText('Profile')).toBeNull()
  })

  it('navigates to the tab route when pressed', () => {
    render(<WebBottomNav />)
    fireEvent.press(screen.getByText('Explore'))
    expect(mockPush).toHaveBeenCalledWith('/explore')
  })
})
