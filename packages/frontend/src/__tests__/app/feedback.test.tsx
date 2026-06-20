/**
 * UI-path tests for the in-app feedback screen — app/feedback.tsx
 *
 * Issue #542 — "Add simple user feedback capture path".
 *
 * The issue explicitly requires the user-facing UI (not just backend/schema
 * plumbing): a feedback form, a submit action, and loading / success / error
 * states. These tests render the real screen and drive it through that path.
 *
 * Contract the implementation must satisfy (queried below):
 *   - a heading / title that identifies this as the feedback surface
 *   - a multi-line description field with testID "feedback-description"
 *   - a submit control with testID "feedback-submit"
 *   - submitting an empty form does NOT call the network
 *   - submitting a valid form calls feedbackClient.submit with the description,
 *     shows a loading indicator while in-flight, then a success confirmation
 *   - a failed submission surfaces a visible error (and lets the user retry)
 *
 * Heavy native/UI deps are stubbed following the WebBottomNav.test.tsx pattern.
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() })),
  usePathname: jest.fn(() => '/feedback'),
  useLocalSearchParams: jest.fn(() => ({})),
  Stack: { Screen: () => null },
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: 'SafeAreaView',
}))

// User context may be read to pre-fill the contact field.
jest.mock('../../../components/contexts', () => ({
  useUser: jest.fn(() => ({ user: { username: 'kish', email: 'kish@example.com' } })),
  useTheme: jest.fn(() => ({ isDark: false })),
}))

// Defensive stubs for optional presentation deps the screen may pull in.
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => 'Icon' }))
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn(), hide: jest.fn() },
}))
jest.mock('expo-image', () => ({ Image: 'Image' }))
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  MediaTypeOptions: { Images: 'Images' },
}))

// Keep validateFeedback real; only the network call is mocked.
jest.mock('../../feedback/feedbackClient', () => {
  const actual = jest.requireActual('../../feedback/feedbackClient') as Record<string, unknown>
  return { ...actual, feedbackClient: { submit: jest.fn() } }
})

const { feedbackClient } = jest.requireMock('../../feedback/feedbackClient') as {
  feedbackClient: { submit: jest.Mock<(input: unknown) => Promise<unknown>> }
}

const FeedbackScreen = require('../../../app/feedback').default

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('app/feedback screen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    feedbackClient.submit.mockResolvedValue({ success: true, data: { id: 'fb_1' } })
  })

  it('renders the feedback capture form', () => {
    render(<FeedbackScreen />)

    // A title/heading that identifies the surface as feedback.
    expect(screen.getAllByText(/feedback|report a bug|report an issue/i).length).toBeGreaterThan(0)
    // The description field and the submit control.
    expect(screen.getByTestId('feedback-description')).toBeTruthy()
    expect(screen.getByTestId('feedback-submit')).toBeTruthy()
  })

  it('does not submit when the description is empty', () => {
    render(<FeedbackScreen />)

    fireEvent.press(screen.getByTestId('feedback-submit'))

    expect(feedbackClient.submit).not.toHaveBeenCalled()
  })

  it('submits the typed feedback and shows a loading state then a success confirmation', async () => {
    const d = deferred<{ success: true; data: unknown }>()
    feedbackClient.submit.mockReturnValue(d.promise)

    render(<FeedbackScreen />)

    fireEvent.changeText(
      screen.getByTestId('feedback-description'),
      'The events list never finishes loading',
    )
    fireEvent.press(screen.getByTestId('feedback-submit'))

    // Sends the description (other context fields may be added by the screen).
    expect(feedbackClient.submit).toHaveBeenCalledTimes(1)
    expect(feedbackClient.submit).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'The events list never finishes loading' }),
    )

    // While the request is in flight, a loading affordance is visible.
    const loading =
      screen.queryByText(/sending|submitting/i) || screen.queryByTestId('feedback-submitting')
    expect(loading).toBeTruthy()

    d.resolve({ success: true, data: { id: 'fb_1' } })

    expect(
      await screen.findByText(/thank|received|sent|submitted|success|got it/i),
    ).toBeTruthy()
  })

  it('shows an error state when the submission fails', async () => {
    feedbackClient.submit.mockResolvedValue({ success: false, error: { message: 'Server error' } })

    render(<FeedbackScreen />)

    fireEvent.changeText(screen.getByTestId('feedback-description'), 'Something is broken')
    fireEvent.press(screen.getByTestId('feedback-submit'))

    await waitFor(() => {
      expect(
        screen.queryByText(/wrong|try again|error|failed|could ?n.?t|unable/i),
      ).toBeTruthy()
    })
  })
})
