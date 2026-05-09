import React from 'react'
import { Pressable, Text, ActivityIndicator } from 'react-native'

interface PrimaryButtonProps {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  style?: any
  className?: string
}

export default function PrimaryButton({
  children,
  onPress,
  disabled,
  loading,
  style,
  ...props
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading

  const handlePress = () => {
    if (!isDisabled && onPress) {
      onPress()
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      className="bg-primary px-4 py-3 rounded-full active:bg-primary-press disabled:opacity-50"
      style={style}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text className="text-white font-sans text-base leading-5 text-center">{children}</Text>
      )}
    </Pressable>
  )
}
