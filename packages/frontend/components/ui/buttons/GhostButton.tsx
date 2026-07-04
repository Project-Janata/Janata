import React, { useState } from 'react'
import { Pressable, Text } from 'react-native'
import { useColors } from '../../../hooks/useColors'

interface GhostButtonProps {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  style?: object
}

// NativeWind 4's CssInterop drops the function-style `style={({ pressed }) =>}`
// callback on Pressable. Use an array style with state-driven press feedback so
// the padding/press background keep applying. See PrimaryButton.native.
export default function GhostButton({ children, onPress, disabled, style }: GhostButtonProps) {
  const c = useColors()
  const [pressed, setPressed] = useState(false)

  return (
    <Pressable
      onPress={!disabled ? onPress : undefined}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      style={[
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
