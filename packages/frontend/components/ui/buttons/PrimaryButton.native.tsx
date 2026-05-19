<<<<<<< HEAD
<<<<<<< HEAD
import React from 'react'
import { ActivityIndicator, Pressable, Text, type StyleProp, type ViewStyle } from 'react-native'
=======
=======
>>>>>>> da32827 (feat: refactor onboarding steps to use shared components and improve structure)
import React, { useState } from 'react'
import { ActivityIndicator, Pressable, Text } from 'react-native'
>>>>>>> da32827 (feat: refactor onboarding steps to use shared components and improve structure)

interface PrimaryButtonProps {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  style?: StyleProp<ViewStyle>
}

// Pressable supports a function-style `style={({pressed}) => ...}` callback,
// but NativeWind's CssInterop doesn't process that form — the inline
// backgroundColor gets stripped, leaving white-on-white text on the cream
// auth background. Visible since the project moved to NativeWind 4.
// Fix: drive static styling via className (which IS interop-processed) and
// use `active:` for press feedback. Same pattern as the Developer Mode
// button in app/auth.tsx that has always rendered correctly.
export default function PrimaryButton({ children, onPress, disabled, loading, style }: PrimaryButtonProps) {
  const isDisabled = disabled || loading
  const [pressed, setPressed] = useState(false)

  return (
    <Pressable
      onPress={!isDisabled ? onPress : undefined}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isDisabled}
<<<<<<< HEAD
<<<<<<< HEAD
      className={[
        'bg-primary',
        'px-4 py-3.5 rounded-full',
        'items-center justify-center',
        'active:bg-primary-press',
        isDisabled ? 'opacity-50' : '',
      ].join(' ')}
      style={style}
=======
=======
>>>>>>> da32827 (feat: refactor onboarding steps to use shared components and improve structure)
      style={[
        {
          backgroundColor: pressed ? '#D97520' : '#E8862A',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 999,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
>>>>>>> da32827 (feat: refactor onboarding steps to use shared components and improve structure)
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text className="text-white font-medium text-[15px] leading-5">
          {children}
        </Text>
      )}
    </Pressable>
  )
}
