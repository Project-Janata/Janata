import React, { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import type { AppColors } from '../../tokens'

export function EmptyPanel({
  title,
  subtitle,
  colors,
  actionLabel,
  onAction,
}: {
  title: string
  subtitle: string
  colors: AppColors
  actionLabel?: string
  onAction?: () => void
}) {
  // NativeWind 4's CssInterop drops the function-style `style={({ pressed }) =>}`
  // callback on Pressable, which stripped the accent background and left the
  // white (textInverse) label invisible. Use a static style + state-driven press.
  const [pressed, setPressed] = useState(false)
  return (
    <View style={{ paddingVertical: 18, paddingHorizontal: 4, gap: 5 }}>
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 17, color: colors.text }}>{title}</Text>
      <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textMuted }}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          style={{
            alignSelf: 'flex-start',
            marginTop: 10,
            paddingHorizontal: 16,
            paddingVertical: 9,
            borderRadius: 999,
            backgroundColor: colors.accent,
            opacity: pressed ? 0.85 : 1,
          }}
        >
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.textInverse }}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}
