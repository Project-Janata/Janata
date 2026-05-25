import React from 'react'
import { ActivityIndicator, Pressable, Text, type StyleProp, type ViewStyle } from 'react-native'

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

  return (
    <Pressable
      onPress={!isDisabled ? onPress : undefined}
      disabled={isDisabled}
      className={[
        'bg-primary',
        'px-4 py-3.5 rounded-full',
        'items-center justify-center',
        'active:bg-primary-press',
        isDisabled ? 'opacity-50' : '',
      ].join(' ')}
      style={style}
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
