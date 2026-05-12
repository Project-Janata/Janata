import React from 'react'
import { ActivityIndicator, Pressable, Text } from 'react-native'
import { useColors } from '../../../hooks/useColors'

interface SecondaryButtonProps {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  style?: object
}

export default function SecondaryButton({ children, onPress, disabled, loading, style }: SecondaryButtonProps) {
  const c = useColors()
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={!isDisabled ? onPress : undefined}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: pressed ? c.surface : 'transparent',
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
        <ActivityIndicator size="small" color={c.textMuted} />
      ) : (
        <Text style={{ fontWeight: '500', fontSize: 15, lineHeight: 20, color: c.text, textAlign: 'center' }}>
          {children}
        </Text>
      )}
    </Pressable>
  )
}
