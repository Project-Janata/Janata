import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IntroPager } from '../components/intro'

/**
 * Pre-auth "What is Janata" first-timer explainer.
 * Shown once before login; gated in _layout.tsx via getIntroShown().
 */
export default function IntroScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <IntroPager />
    </SafeAreaView>
  )
}
