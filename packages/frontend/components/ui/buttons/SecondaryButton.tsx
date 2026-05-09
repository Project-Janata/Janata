import { Pressable, Text, ActivityIndicator } from 'react-native'
import React from 'react'

interface SecondaryButtonProps {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  style?: any
  [key: string]: any
}

export default function SecondaryButton({ children, onPress, disabled, loading, style, ...props }: SecondaryButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={!isDisabled ? onPress : undefined}
      disabled={isDisabled}
      className="border border-borderColor dark:border-borderColor-dark bg-transparent text-content dark:text-content-dark px-4 py-3 rounded-full active:bg-gray-4 disabled:opacity-50"
      style={style}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#78716C" />
      ) : (
        <Text className="font-sans text-content dark:text-content-dark text-base leading-5 text-center">
          {children}
        </Text>
      )}
    </Pressable>
  )
}
