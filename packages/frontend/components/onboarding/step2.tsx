import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, Pressable, Platform } from 'react-native'
import { useOnboarding } from '../contexts'
import BirthdatePicker from '../profile/BirthdatePicker'
import { PrimaryButton } from '../ui'

export default function Step2() {
  const { goToNextStep, birthdate, setBirthdate } = useOnboarding()

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="max-w-[720px] w-full flex-1 self-center px-6">
        {/* --- Main Content --- */}
        <View className="flex-1 flex flex-col items-center justify-center w-full">
          <View className="gap-4 w-full max-w-md flex flex-col items-center justify-center">
            <View className="gap-2 w-full flex flex-col items-center justify-center">
              <Text className="text-4xl font-sans font-bold text-content dark:text-content-dark text-center">
                When's your birthday?
              </Text>
              <Text className="text-lg font-sans text-stone-500 dark:text-stone-400 text-center">
                We'll use this to personalize your experience.
              </Text>
              <Text className="text-sm font-sans text-stone-400 dark:text-stone-500 text-center">
                Optional. You can add this later.
              </Text>
            </View>
            <View className="mt-8 w-full flex items-center justify-center" style={Platform.OS === 'web' ? { overflow: 'visible', zIndex: 20 } : undefined}>
              <BirthdatePicker value={birthdate ?? undefined} onChange={setBirthdate} />
            </View>
          </View>
        </View>

        {/* --- Continue Button --- */}
        <View className="pb-6">
          <PrimaryButton
            onPress={goToNextStep}
            style={{ width: '100%', maxWidth: 448, alignSelf: 'center' }}
          >
            Continue
          </PrimaryButton>
          {!birthdate && (
            <Pressable onPress={goToNextStep} style={{ alignSelf: 'center', marginTop: 12 }}>
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
