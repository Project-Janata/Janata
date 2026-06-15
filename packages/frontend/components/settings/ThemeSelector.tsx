import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useTheme } from '../contexts'

const themeOptions = ['light', 'dark', 'system'] as const

export default function ThemeSelector({ style, className }: { style?: any; className?: string }) {
  const { preference: themePreference, setPreference: setThemePreference, isDark } = useTheme()

  const textColor = isDark ? '#FAFAFA' : '#1C1917'
  const mutedColor = isDark ? '#737373' : '#A8A29E'
  const accentColor = '#C2410C'

  const getLabel = (option: (typeof themeOptions)[number]) => {
    if (option === 'system') return 'Auto'
    return option.charAt(0).toUpperCase() + option.slice(1)
  }

  return (
    <View
      className={className || ''}
      style={{ flexDirection: 'row', gap: 8, ...(style || {}) }}
    >
      {themeOptions.map((option) => {
        const isSelected = themePreference === option
        const labelColor = isSelected ? textColor : mutedColor

        return (
          <Pressable
            key={option}
            onPress={() => setThemePreference(option)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: isSelected ? accentColor : 'transparent',
            }}
          >
            <Text
              style={{
                color: labelColor,
                fontSize: 13,
                fontFamily: 'Inclusive Sans',
                fontWeight: isSelected ? '600' : '400',
              }}
            >
              {getLabel(option)}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
