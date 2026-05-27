import React from 'react'
import { ActivityIndicator, Pressable, Text } from 'react-native'
import { useColors } from '../../../hooks/useColors'

interface DestructiveButtonProps {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  style?: object
}

export default function DestructiveButton({ children, onPress, disabled, loading, style }: DestructiveButtonProps) {
  const isDisabled = disabled || loading
  const c = useColors()

  return (
    <Pressable
      onPress={!isDisabled ? onPress : undefined}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          backgroundColor: c.error,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={{ fontWeight: '500', fontSize: 15, lineHeight: 20, color: '#FFFFFF', textAlign: 'center' }}>
          {children}
        </Text>
      )}
    </Pressable>
  )
}
