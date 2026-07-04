import React, { useState } from 'react'
import { Pressable } from 'react-native'
import { useColors } from '../../../hooks/useColors'

interface IconButtonProps {
  children: React.ReactNode
  variant?: 'solid' | 'outlined' | 'ghost'
  onPress?: () => void
  disabled?: boolean
  size?: number
  style?: object
}

// NativeWind 4's CssInterop drops the function-style `style={({ pressed }) =>}`
// callback on Pressable, which stripped the icon button's background/border.
// Use an array style with state-driven press feedback. See PrimaryButton.native.
export default function IconButton({ children, variant = 'solid', onPress, disabled, size = 36, style }: IconButtonProps) {
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
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
          backgroundColor:
            variant === 'outlined' ? 'transparent'
            : variant === 'ghost'    ? 'transparent'
            : pressed               ? c.border
            : c.surface,
          borderWidth: variant === 'outlined' ? 1.5 : 0,
          borderColor: variant === 'outlined' ? c.border : undefined,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  )
}
