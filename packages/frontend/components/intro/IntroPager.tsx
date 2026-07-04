import React, { useCallback, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  FlatList,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type ListRenderItemInfo,
} from 'react-native'
import { useRouter } from 'expo-router'
import { PrimaryButton } from '../ui'
import IntroCard from './IntroCard'
import { INTRO_STEPS, type IntroStep } from './IntroSteps'
import { setIntroShown } from '../../utils/introStorage'

/**
 * Horizontal swipeable pager for the first-timer explainer.
 * - Paged FlatList of IntroCards
 * - Progress dots reflecting the active page
 * - "Next" advances; "Get started" on the last page finishes
 * - "Skip" jumps straight to auth
 * Finishing or skipping marks the intro as shown and routes to /auth.
 */
export default function IntroPager() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  // Cap the page width so cards stay readable on wide web viewports.
  const pageWidth = Math.min(width, 560)
  const [index, setIndex] = useState(0)
  const listRef = useRef<FlatList<IntroStep>>(null)

  const isLast = index >= INTRO_STEPS.length - 1

  const finish = useCallback(async () => {
    await setIntroShown(true)
    router.replace('/auth')
  }, [router])

  const handleNext = useCallback(() => {
    if (isLast) {
      void finish()
      return
    }
    const next = index + 1
    listRef.current?.scrollToOffset({ offset: next * pageWidth, animated: true })
    setIndex(next)
  }, [isLast, finish, index, pageWidth])

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / pageWidth)
      if (page !== index) setIndex(page)
    },
    [index, pageWidth],
  )

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<IntroStep>) => (
      <IntroCard step={item} width={pageWidth} index={index} />
    ),
    [pageWidth],
  )

  return (
    <View className="flex-1 w-full self-center" style={{ maxWidth: 560 }}>
      {/* Skip */}
      <View className="flex-row justify-end px-6 pt-2">
        <Pressable
          onPress={() => void finish()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Skip intro"
        >
          <Text className="text-base font-sans text-stone-400 dark:text-stone-500">Skip</Text>
        </Pressable>
      </View>

      {/* Pager */}
      <FlatList
        ref={listRef}
        data={INTRO_STEPS}
        keyExtractor={(_, i) => `intro-${i}`}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, i) => ({ length: pageWidth, offset: pageWidth * i, index: i })}
        className="flex-1"
      />

      {/* Progress dots */}
      <View className="flex-row justify-center items-center gap-2 py-4">
        {INTRO_STEPS.map((_, i) => (
          <View
            key={i}
            className={`h-2 rounded-full ${
              i === index ? 'w-6 bg-primary' : 'w-2 bg-muted/30 dark:bg-muted-dark/30'
            }`}
          />
        ))}
      </View>

      {/* CTA */}
      <View className="px-6 pb-6">
        <PrimaryButton onPress={handleNext} style={{ width: '100%', maxWidth: 448, alignSelf: 'center' }}>
          {isLast ? 'Get started' : 'Next'}
        </PrimaryButton>
      </View>
    </View>
  )
}
