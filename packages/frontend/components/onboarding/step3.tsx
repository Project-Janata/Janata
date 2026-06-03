import { View, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useOnboarding } from '../contexts'
import { useState } from 'react'
import { PrimaryButton } from '../ui'
import { CenterSearch } from '../center/CenterSearch'

export default function Step3() {
  const { goToNextStep, centerID, setCenterID, skipOnboarding, returnTo, isSubmitting } = useOnboarding()
  const [error, setError] = useState('')

  const handleContinue = () => {
    if (!centerID) {
      setError('Please search and select a center')
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
                Choose your center
              </Text>
              <Text className="text-lg font-sans text-stone-500 dark:text-stone-400 text-center">
                Enter your city or town to see nearby centers.
              </Text>
            </View>

            {/* Shared center search — same behavior as the feed's "join your
                center" step. Auto-picks the nearest result like before. */}
            <View className="w-full max-w-md self-center">
              <CenterSearch
                selectedCenterId={centerID}
                autoSelectNearest
                placeholder="City or town name"
                onSelect={(center) => {
                  setCenterID(center.id)
                  setError('')
                }}
              />
            </View>

            {/* Error Message */}
            {error ? (
              <View className="w-full max-w-md self-center mt-4 bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                <Text className="text-red-600 dark:text-red-400 font-sans text-center">{error}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Button */}
        <View className="pb-6">
          <PrimaryButton
            onPress={handleContinue}
            disabled={!centerID}
            style={{ width: '100%', maxWidth: 448, alignSelf: 'center' }}
          >
            Continue
          </PrimaryButton>
          {returnTo && (
            <Pressable onPress={skipOnboarding} disabled={isSubmitting} style={{ alignSelf: 'center', marginTop: 12 }}>
              <Text className="text-sm font-sans text-stone-400 dark:text-stone-500">Skip for now</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}
