import React, { useState } from 'react'
import { ActivityIndicator, Pressable, Text } from 'react-native'
import { useColors } from '../../../hooks/useColors'

interface SecondaryButtonProps {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  style?: object
}

// NativeWind 4's CssInterop drops the function-style `style={({ pressed }) =>}`
// callback on Pressable, which stripped this button's border/padding/background.
// Use an array style (interop-processed) with state-driven press feedback so the
// theme colors from useColors() keep working without a function callback.
export default function SecondaryButton({ children, onPress, disabled, loading, style }: SecondaryButtonProps) {
  const c = useColors()
  const [pressed, setPressed] = useState(false)
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={!isDisabled ? onPress : undefined}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isDisabled}
      style={[
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
