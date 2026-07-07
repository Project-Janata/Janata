import { createContext, useContext, useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { Platform } from 'react-native'
import { useUser } from './UserContext'
import { usePostHog } from 'posthog-react-native'

// Stable, human-readable name per onboarding step, so the drop-off funnel reads
// "name → birthdate → center → interests" instead of opaque step numbers. The
// numeric `step` property is kept alongside these for back-compat with existing
// PostHog data. Step 5 is the Complete screen (final submit).
const ONBOARDING_STEP_NAMES: Record<number, string> = {
  1: 'name',
  2: 'birthdate',
  3: 'center',
  4: 'interests',
  5: 'complete',
}

interface OnboardingContextType {
  currentStep: number
  totalSteps: number
  firstName: string
  lastName: string
  birthdate: Date | null
  centerID: string
  phoneNumber: string
  interests: string[]
  isSubmitting: boolean
  submitError: string | null
  returnTo: string | null
  goToNextStep: () => void
  goToPreviousStep: () => void
  completeOnboarding: () => void
  skipOnboarding: () => void
  setFirstName: (name: string) => void
  setLastName: (name: string) => void
  setBirthdate: (date: Date) => void
  setCenterID: (id: string) => void
  setPhoneNumber: (phoneNumber: string) => void
  setInterests: (interests: string[]) => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export default function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser, authenticatedFetch } = useUser()
  const params = useLocalSearchParams<{ returnTo?: string }>()
  const returnTo = params.returnTo || (Platform.OS === 'web' && typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('returnTo')
    : null)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4 // Total form steps (not including Complete screen)
  const posthog = usePostHog()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [birthdate, setBirthdate] = useState<Date | null>(null)
  const [centerID, setCenterID] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Fire onboarding_started once when the user enters the flow, so the funnel
  // has a true top-of-funnel entry (not just the first step completion).
  useEffect(() => {
    posthog?.capture('onboarding_started', { total_steps: totalSteps })
    // Intentionally once-per-mount; onboarding mounts once per attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goToNextStep = () => {
    posthog?.capture('onboarding_step_completed', {
      step: currentStep, // numeric, kept for back-compat
      step_index: currentStep,
      step_name: ONBOARDING_STEP_NAMES[currentStep] ?? `step_${currentStep}`,
      total_steps: totalSteps,
    })
    // Allow incrementing past totalSteps to show Complete screen
    setCurrentStep(currentStep + 1)
  }

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeOnboarding = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await authenticatedFetch('/api/auth/complete-onboarding', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.username,
          firstName,
          lastName,
          dateOfBirth: birthdate?.toISOString() || null,
          phoneNumber: phoneNumber || undefined,
          interests: interests.length > 0 ? interests : undefined,
          profileComplete: true,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to complete onboarding')
      }

      const data = await response.json()
      setUser(data.user)
      // Capture before navigating away so the events aren't dropped on unmount.
      posthog?.capture('onboarding_completed', { total_steps: totalSteps })
      posthog?.capture('profile_completed', {
        source: 'onboarding',
        has_photo: !!data.user?.profileImage,
        interests_count: interests.length,
        looking_for_count: 0,
      })
      router.replace((returnTo || '/') as never)
    } catch (error: any) {
      posthog?.capture('onboarding_failed', { error: error.message, source: 'complete' })
      setSubmitError(error.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const skipOnboarding = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      // Can't skip without a name — just go to step 1
      setCurrentStep(1)
      return
    }
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const response = await authenticatedFetch('/api/auth/complete-onboarding', {
        method: 'POST',
        body: JSON.stringify({
          userId: user?.username,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          profileComplete: true,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to complete onboarding')
      }
      const data = await response.json()
      setUser(data.user)
      // The profile is now complete even though they skipped optional steps —
      // fire both the skip signal and the canonical profile_completed (which is
      // the cross-path "they're done" event used for the activation funnel).
      posthog?.capture('onboarding_skipped', {
        step: currentStep,
        step_name: ONBOARDING_STEP_NAMES[currentStep] ?? `step_${currentStep}`,
      })
      posthog?.capture('profile_completed', {
        source: 'onboarding_skip',
        has_photo: !!data.user?.profileImage,
        interests_count: interests.length,
        looking_for_count: 0,
      })
      router.replace((returnTo || '/') as never)
    } catch (error: any) {
      posthog?.capture('onboarding_failed', { error: error.message, source: 'skip' })
      setSubmitError(error.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const value = {
    currentStep,
    totalSteps,
    firstName,
    lastName,
    birthdate,
    centerID,
    phoneNumber,
    interests,
    isSubmitting,
    submitError,
    returnTo,
    goToNextStep,
    goToPreviousStep,
    completeOnboarding,
    skipOnboarding,
    setFirstName,
    setLastName,
    setBirthdate,
    setCenterID,
    setPhoneNumber,
    setInterests,
  }

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
