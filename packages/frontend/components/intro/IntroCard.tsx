import React from 'react'
import { View, Text } from 'react-native'
import type { IntroStep } from './IntroSteps'

type IntroCardProps = {
  step: IntroStep
  /** Width of the pager viewport so each card fills exactly one page. */
  width: number
}

/**
 * A single full-bleed intro card: emoji visual, headline, and supporting body.
 * Sized to fill one pager page; content is vertically centered and breathable.
 */
export default function IntroCard({ step, width }: IntroCardProps) {
  return (
    <View style={{ width }} className="flex-1 items-center justify-center px-6">
      <View className="w-full max-w-md items-center gap-6">
        {/* Visual */}
        <View className="h-28 w-28 items-center justify-center rounded-full bg-primary-soft dark:bg-primary/10">
          <Text className="text-6xl" accessibilityElementsHidden importantForAccessibility="no">
            {step.emoji}
          </Text>
        </View>

        {/* Copy */}
        <View className="gap-3">
          <Text className="text-3xl font-sans font-bold text-content dark:text-content-dark text-center">
            {step.title}
          </Text>
          <Text className="text-lg font-sans text-stone-500 dark:text-stone-400 text-center leading-7">
            {step.body}
          </Text>
        </View>
      </View>
    </View>
  )
}
