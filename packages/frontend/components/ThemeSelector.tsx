import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Sun, Moon, Monitor } from 'lucide-react-native'
import { useTheme } from './contexts'

const themeOptions = ['light', 'dark', 'system'] as const
const optionWidth = 70

export default function ThemeSelector({ style, className }: { style?: any; className?: string }) {
  const { preference: themePreference, setPreference: setThemePreference, isDark } = useTheme()

  // Single source of truth — never mix themePreference + isDark for colors
  const fg = isDark ? '#fff' : '#374151'
  const selectedBg = isDark ? '#3f3f46' : '#e5e7eb'

  const getLabel = (option: (typeof themeOptions)[number]) => {
    if (option === 'system') return 'Auto'
    return option.charAt(0).toUpperCase() + option.slice(1)
  }

  return (
    <View
      className={`relative flex-row bg-gray-100 dark:bg-neutral-800 rounded-lg p-1 ${className || ''}`}
      style={{ width: optionWidth * themeOptions.length + 8, ...(style || {}) }}
    >
      {themeOptions.map((option) => {
        const isSelected = themePreference === option
        const iconColor = isSelected ? '#f97316' : fg
        const textColor = isSelected ? '#f97316' : fg

        return (
          <Pressable
            key={option}
            onPress={() => setThemePreference(option)}
            className="flex-row items-center justify-center gap-1 py-2 px-3 rounded-md"
            style={{
              width: optionWidth,
              backgroundColor: isSelected ? selectedBg : 'transparent',
            }}
          >
            {option === 'light' && <Sun size={14} color={iconColor} />}
            {option === 'dark' && <Moon size={14} color={iconColor} />}
            {option === 'system' && <Monitor size={14} color={iconColor} />}
            <Text
              style={{
                color: textColor,
                fontSize: 12,
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
