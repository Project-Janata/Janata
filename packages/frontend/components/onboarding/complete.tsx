import { View, Text, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useEffect, useState } from 'react'
import { useOnboarding, useTheme } from '../contexts'
import { PrimaryButton } from '../ui'

export default function Complete() {
  const { completeOnboarding, isSubmitting, submitError } = useOnboarding()
  const { isDark } = useTheme()
  const logoSize = 160
  const [showLogo, setShowLogo] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Staggered animation: logo first, then content
    const logoTimer = setTimeout(() => {
      setShowLogo(true)
    }, 200)

    const contentTimer = setTimeout(() => {
      setShowContent(true)
    }, 500)

    return () => {
      clearTimeout(logoTimer)
      clearTimeout(contentTimer)
    }
  }, [])

  const handleGetStarted = () => {
    completeOnboarding()
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <View className="max-w-[720px] w-full flex-1 self-center px-6">
        <View className="flex-1 justify-center items-center">
          <View className="w-full items-center">
            {/* Logo */}
            <View
              className={`mb-12 ${
                showLogo ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
              }`}
            >
              {isDark ? (
                <Image
                  source={require('../../assets/images/chinmaya_logo_dark.svg')}
                  style={{ width: logoSize, height: logoSize }}
                />
              ) : (
                <Image
                  source={require('../../assets/images/chinmaya_logo_light.svg')}
                  style={{ width: logoSize, height: logoSize }}
                />
              )}
            </View>

            {/* Header Content */}
            <View
              className={`items-center ${
                showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <Text className="text-4xl font-sans font-bold text-content dark:text-content-dark text-center mb-4 tracking-tight">
                Welcome to Janata!
              </Text>
              <Text className="text-lg font-sans text-stone-500 dark:text-stone-400 text-center max-w-md leading-relaxed px-4">
                Begin your spiritual journey now
              </Text>
            </View>
          </View>
        </View>

        {/* Error Message */}
        {submitError && (
          <View className="px-4 mb-4">
            <Text className="text-red-500 dark:text-red-400 font-sans text-sm text-center">
              {submitError}
            </Text>
          </View>
        )}

        {/* Button */}
        <View className="pb-6">
          <PrimaryButton
            onPress={handleGetStarted}
            disabled={isSubmitting}
            loading={isSubmitting}
            style={{ width: '100%', maxWidth: 448, alignSelf: 'center' }}
          >
            Get Started
          </PrimaryButton>
        </View>
      </View>
    </SafeAreaView>
  )
}
