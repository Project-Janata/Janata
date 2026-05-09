/**
 * TabSegment.tsx
 *
 * A reusable tab segment component for consistent tab styling across the app
 *
 * Author: Generated for Project Janatha
 * Date: September 21, 2025
 */

import React, { useEffect, useRef } from 'react'
import { TouchableOpacity, Text, View, Animated } from 'react-native'
import { useTheme } from '../contexts'

export interface TabOption {
  value: string
  label: string
}

export interface TabSegmentProps {
  options: TabOption[]
  value: string
  onValueChange: (value: string) => void
  variant?: 'primary' | 'subtle'
}

export function TabSegment({
  options,
  value,
  onValueChange,
  variant = 'primary',
}: TabSegmentProps) {
  const { isDark } = useTheme()
  const selectedIndex = options.findIndex((opt) => opt.value === value)
  const optionWidth = 80
  const indicatorPadding = 8
  const slideAnim = useRef(new Animated.Value(selectedIndex * optionWidth)).current

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: selectedIndex * optionWidth,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [selectedIndex, slideAnim])

  const containerClass =
    variant === 'primary'
      ? 'bg-gray-100 dark:bg-neutral-800'
      : 'bg-gray-100 dark:bg-neutral-800'

  return (
    <View
      className={`relative flex-row ${containerClass} rounded-lg p-1`}
      style={{
        width: optionWidth * options.length + indicatorPadding,
      }}
    >
      {/* Sliding indicator */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          width: optionWidth - 8 + indicatorPadding,
          height: 32,
          borderRadius: 6,
          backgroundColor: isDark ? '#3f3f46' : '#e5e7eb',
          transform: [{ translateX: slideAnim }],
        }}
      />
      {/* Tab options */}
      {options.map((option, idx) => {
        const isActive = value === option.value
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onValueChange(option.value)}
            className="flex-row items-center justify-center py-2 px-3 rounded-md z-10"
            style={{ width: optionWidth }}
            activeOpacity={0.8}
          >
            <Text
              className={`text-center text-xs font-sans ${
                isActive
                  ? 'text-primary font-sans'
                  : 'text-gray-700 dark:text-white'
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export default TabSegment
