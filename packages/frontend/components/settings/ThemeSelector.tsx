import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Sun, Moon, Monitor } from 'phosphor-react-native'
import { useTheme } from '../contexts'
import { useColors } from '../../hooks/useColors'

const themeOptions = ['light', 'dark', 'system'] as const
const optionWidth = 70

export default function ThemeSelector({ style, className }: { style?: any; className?: string }) {
  const { preference: themePreference, setPreference: setThemePreference } = useTheme()
  const c = useColors()

  const textColor = c.text
  const mutedColor = c.textFaint
  const accentColor = c.accent

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
        const iconColor = isSelected ? accentColor : mutedColor
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
              gap: 6,
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: isSelected ? accentColor : 'transparent',
            }}
          >
            {option === 'light' && <Sun size={16} color={iconColor} />}
            {option === 'dark' && <Moon size={16} color={iconColor} />}
            {option === 'system' && <Monitor size={16} color={iconColor} />}
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
