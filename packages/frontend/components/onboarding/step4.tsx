import { View, Text, Pressable } from 'react-native'
import { useState } from 'react'
import { useOnboarding } from '../contexts'
import { StepLayout, StepHeading, StepError, StepFooter } from './shared'

const INTEREST_OPTIONS = ['Satsangs', 'Bhiksha', 'Global Events', 'Local Events', 'Casual', 'Formal']

export default function Step4() {
  const { goToNextStep, interests, setInterests } = useOnboarding()
  const [error, setError] = useState<string | null>(null)

  const toggleInterest = (option: string) => {
    setInterests(
      interests.includes(option)
        ? interests.filter((i) => i !== option)
        : [...interests, option]
    )
  }

  const handleContinue = () => {
    if (interests.length === 0) { setError('Please select at least one interest'); return }
    goToNextStep()
  }

  return (
    <StepLayout footer={
      <StepFooter onContinue={handleContinue} disabled={interests.length === 0} />
    }>
      <View className="w-full">
        <StepHeading
          title="What are your interests?"
          subtitle="Select topics that interest you to personalize your experience."
        />

        <View className="flex-row flex-wrap justify-center gap-3">
          {INTEREST_OPTIONS.map((option) => {
            const isSelected = interests.includes(option)
            return (
              <Pressable
                key={option}
                onPress={() => toggleInterest(option)}
                className={`px-6 py-3.5 rounded-full border-2 ${
                  isSelected
                    ? 'bg-primary border-primary shadow-lg'
                    : 'bg-stone-100 dark:bg-stone-800 border-transparent shadow-sm'
                }`}
              >
                <Text
                  className={`font-sans font-semibold text-base ${
                    isSelected ? 'text-white' : 'text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {option}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <StepError message={error} />
      </View>
    </StepLayout>
  )
}
