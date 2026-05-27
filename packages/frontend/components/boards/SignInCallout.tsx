import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { UsersThree } from 'phosphor-react-native'
import type { AppColors } from '../../tokens'

export function SignInCallout({
  title,
  subtitle,
  colors,
  onPress,
}: {
  title: string
  subtitle: string
  colors: AppColors
  onPress: () => void
}) {
  return (
    <View style={{ backgroundColor: colors.accentSoft, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
        <UsersThree size={20} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: colors.text }}>{title}</Text>
        <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textMuted }}>{subtitle}</Text>
      </View>
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: colors.accent,
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <Text style={{ fontWeight: '500', fontSize: 13, color: '#FFFFFF' }}>Sign in</Text>
      </Pressable>
    </View>
  )
}
