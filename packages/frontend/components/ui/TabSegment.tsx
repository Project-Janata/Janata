import React, { useEffect, useRef } from 'react'
import { Animated, Pressable, Text, View } from 'react-native'
import { useColors } from '../../hooks/useColors'

export interface TabOption {
  value: string
  label: string
}

export interface TabSegmentProps {
  options: TabOption[]
  value: string
  onValueChange: (value: string) => void
}

const OPTION_WIDTH = 80
const PADDING = 4

export function TabSegment({ options, value, onValueChange }: TabSegmentProps) {
  const c = useColors()
  const selectedIndex = options.findIndex((o) => o.value === value)
  const slideAnim = useRef(new Animated.Value(selectedIndex * OPTION_WIDTH)).current

  useEffect(() => {
    Animated.timing(slideAnim, { toValue: selectedIndex * OPTION_WIDTH, duration: 200, useNativeDriver: true }).start()
  }, [selectedIndex, slideAnim])

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: c.surface,
        borderRadius: 10,
        padding: PADDING,
        width: OPTION_WIDTH * options.length + PADDING * 2,
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: PADDING,
          left: PADDING,
          width: OPTION_WIDTH,
          height: 32,
          borderRadius: 7,
          backgroundColor: c.card,
          transform: [{ translateX: slideAnim }],
        }}
      />
      {options.map((option) => {
        const isActive = value === option.value
        return (
          <Pressable
            key={option.value}
            onPress={() => onValueChange(option.value)}
            style={{ width: OPTION_WIDTH, alignItems: 'center', justifyContent: 'center', paddingVertical: 6, zIndex: 1 }}
          >
            <Text style={{ fontWeight: '500', fontSize: 13, lineHeight: 18, color: isActive ? c.accent : c.textMuted }}>
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export default TabSegment
