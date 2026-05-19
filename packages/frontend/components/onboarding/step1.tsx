import { View } from 'react-native'
import { useOnboarding } from '../contexts'
import { useState } from 'react'
import { StepLayout, StepHeading, OnboardingInput, StepError, StepFooter } from './shared'

export default function StepOne() {
  const { goToNextStep, firstName, setFirstName, lastName, setLastName } = useOnboarding()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleFirstNameChange = (text: string) => {
    setFirstName(text)
    setErrors((prev) => ({ ...prev, firstName: '' }))
  }
  const handleLastNameChange = (text: string) => {
    setLastName(text)
    setErrors((prev) => ({ ...prev, lastName: '' }))
  }

  const handleContinue = () => {
    if (!firstName.trim()) { setErrors((p) => ({ ...p, firstName: 'First name is required' })); return }
    if (!lastName.trim()) { setErrors((p) => ({ ...p, lastName: 'Last name is required' })); return }
    setFirstName(firstName.trim())
    setLastName(lastName.trim())
    goToNextStep()
  }

  const errorMessage = Object.values(errors).find(Boolean)

  return (
    <StepLayout footer={
      <StepFooter
        onContinue={handleContinue}
        disabled={!firstName.trim() || !lastName.trim()}
      />
    }>
      <View className="gap-4 w-full items-center">
        <StepHeading
          title="Welcome to Janata!"
          subtitle="Enter your name to get started with your journey."
        />
        <View className="gap-3 w-full max-w-md">
          <StepError message={errorMessage} />
          <OnboardingInput
            placeholder="First Name"
            value={firstName}
            onChangeText={handleFirstNameChange}
            autoCapitalize="words"
            autoComplete="given-name"
            autoCorrect={false}
          />
          <OnboardingInput
            placeholder="Last Name"
            value={lastName}
            onChangeText={handleLastNameChange}
            autoCapitalize="words"
            autoComplete="family-name"
            autoCorrect={false}
          />
        </View>
      </View>
    </StepLayout>
  )
}
