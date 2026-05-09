import { View, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useState } from 'react'
import { useOnboarding } from '../contexts'
import { PrimaryButton } from '../ui'

export default function Step4() {
  const { goToNextStep, interests, setInterests, skipOnboarding, returnTo, isSubmitting } = useOnboarding()
  const [error, setError] = useState<string | null>(null)
  const interestOptions = [
    'Satsangs',
    'Bhiksha',
    'Global Events',
    'Local Events',
    'Casual',
    'Formal',
  ]

  const handleSelectInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest))
    } else {
      setInterests([...interests, interest])
    }
  }

  const handleContinue = () => {
    if (interests.length === 0) {
      setError('Please select at least one interest')
      return
    }
    goToNextStep()
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <View className="max-w-[720px] w-full flex-1 self-center px-6">
        <View className="flex-1 justify-center">
          <View className="w-full">
            {/* Header */}
            <View className="mb-8">
              <Text className="text-4xl font-sans font-bold text-content dark:text-content-dark text-center mb-3">
                What are your interests?
              </Text>
              <Text className="text-lg font-sans text-stone-500 dark:text-stone-400 text-center">
                Select topics that interest you to personalize your experience.
              </Text>
            </View>

            {/* Interest Options */}
            <View className="flex-row flex-wrap justify-center gap-3">
              {interestOptions.map((option) => {
                const isSelected = interests.includes(option)
                return (
                  <Pressable
                    key={option}
                    onPress={() => handleSelectInterest(option)}
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

            {/* Error Message */}
            {error && (
              <View className="w-full max-w-md self-center mt-4 bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                <Text className="text-red-600 dark:text-red-400 font-sans text-center">
                  {error}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Button */}
        <View className="pb-6">
          <PrimaryButton
            onPress={handleContinue}
            disabled={interests.length === 0}
            style={{ width: '100%', maxWidth: 448, alignSelf: 'center' }}
          >
            Continue
          </PrimaryButton>
          {returnTo && (
            <Pressable onPress={skipOnboarding} disabled={isSubmitting} style={{ alignSelf: 'center', marginTop: 12 }}>
              <Text className="text-sm font-sans text-stone-400 dark:text-stone-500">
                Skip for now
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}
