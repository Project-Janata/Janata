import React from 'react'
import { ActivityIndicator, Pressable, Text } from 'react-native'

interface DestructiveButtonProps {
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
  style?: object
}

// NativeWind 4's CssInterop silently drops the function-style
// `style={({ pressed }) => ...}` callback on Pressable, so this button's red
// background/padding/radius never applied — leaving white text on a
// transparent background (invisible in light mode; see the event "Cancel
// Registration" button). Fix: drive styling via className (which IS
// interop-processed) with `active:` for press feedback — same pattern as
// PrimaryButton.native. Arbitrary hex keeps the exact red regardless of the
// Tailwind theme config.
export default function DestructiveButton({ children, onPress, disabled, loading, style }: DestructiveButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={!isDisabled ? onPress : undefined}
      disabled={isDisabled}
      className={[
        'bg-[#DC2626] active:bg-[#B91C1C]',
        'px-4 py-3.5 rounded-full',
        'items-center justify-center',
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
