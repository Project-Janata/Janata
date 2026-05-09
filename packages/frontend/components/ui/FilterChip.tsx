import React from 'react'
import { Pressable, Text, View } from 'react-native'

type FilterChipProps = {
  label: string
  icon?: React.ReactNode
  active: boolean
  onPress: () => void
  variant?: 'filled' | 'outline'
}

export default function FilterChip({
  label,
  icon,
  active,
  onPress,
  variant = 'filled',
}: FilterChipProps) {
  const isOutline = variant === 'outline'

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border active:opacity-70 ${
        active
          ? isOutline
            ? 'border-primary bg-primary/10'
            : 'bg-primary border-primary'
          : 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700'
      }`}
    >
      {icon && <View>{icon}</View>}
      <Text
        className={`text-sm font-sans ${
          active
            ? isOutline
              ? 'text-primary'
              : 'text-white'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  )
}
