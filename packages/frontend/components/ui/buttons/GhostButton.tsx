import React from 'react'
import { Pressable, Text } from 'react-native'
import { useColors } from '../../../hooks/useColors'

interface GhostButtonProps {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  style?: object
}

export default function GhostButton({ children, onPress, disabled, style }: GhostButtonProps) {
  const c = useColors()

  return (
    <Pressable
      onPress={!disabled ? onPress : undefined}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: pressed ? c.surface : 'transparent',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Text style={{ fontWeight: '500', fontSize: 15, lineHeight: 20, color: c.text, textAlign: 'center' }}>
        {children}
      </Text>
    </Pressable>
  )
}
