import { View, Text, Animated, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { OnboardingProvider, useOnboarding, useUser } from '../components/contexts'
import { useEffect, useRef } from 'react'
import { Step1, Step2, Step3, Step4, Complete } from '../components/onboarding'

const OnboardingHeader = () => {
  const { currentStep, totalSteps } = useOnboarding()
  const progress = Math.min(((currentStep - 1) / totalSteps) * 100, 100) // Cap at 100%
  const animatedWidth = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start()
  }, [progress])

  return (
    <View className="pt-6 pb-6 px-6 bg-white dark:bg-neutral-900">
      <View className="max-w-[720px] w-full self-center">
        <View className="w-full h-2 rounded-full bg-muted/30 dark:bg-muted-dark/20 overflow-hidden">
          <Animated.View
            style={{
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              height: '100%',
              backgroundColor: '#E8862A',
            }}
            className="rounded-full"
          />
        </View>
        {currentStep <= totalSteps && (
          <Text className="text-center text-sm font-sans text-stone-500 dark:text-stone-400 mt-2">
            Step {currentStep} of {totalSteps}
          </Text>
        )}
      </View>
    </View>
  )
}

const OnboardingContent = () => {
  const { currentStep } = useOnboarding()

  switch (currentStep) {
    case 1:
      return <Step1 />
    case 2:
      return <Step2 />
    case 3:
      return <Step3 />
    case 4:
      return <Step4 />
    case 5:
      return <Complete />
    default:
      return <Step1 />
  }
}

export default function Onboarding() {
  const router = useRouter()
  const { user, loading } = useUser()

  // Onboarding requires an account — bounce guests to sign-in.
  useEffect(() => {
    if (Platform.OS !== 'web' && !loading && !user) router.replace('/auth')
  }, [user, loading])

  return (
    <OnboardingProvider>
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
        <OnboardingHeader />
        <OnboardingContent />
      </SafeAreaView>
    </OnboardingProvider>
  )
}
