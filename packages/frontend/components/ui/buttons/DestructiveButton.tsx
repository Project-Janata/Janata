import { Pressable, Text, ActivityIndicator } from 'react-native'
import React from 'react'

interface DestructiveButtonProps {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  style?: any
  [key: string]: any
}

export default function DestructiveButton({ children, onPress, disabled, loading, style, ...props }: DestructiveButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={!isDisabled ? onPress : undefined}
      disabled={isDisabled}
      className="bg-red-600 px-4 py-3 rounded-full active:bg-red-700 disabled:opacity-50"
      style={style}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text className="text-backgroundStrong font-sans text-bold text-gray-100 leading-4 text-center">
          {children}
        </Text>
      )}
    </Pressable>
  )
}
