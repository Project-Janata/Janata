import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { UsersRound } from 'lucide-react-native'
import type { ColorSet } from './types'

export function SignInCallout({
  title,
  subtitle,
  colors,
  onPress,
}: {
  title: string
  subtitle: string
  colors: ColorSet
  onPress: () => void
}) {
  return (
    <View
      style={{
        backgroundColor: colors.orangeSoft,
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 15,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <UsersRound size={20} color={colors.orange} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: colors.text }}>
          {title}
        </Text>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, lineHeight: 19, color: colors.textMuted }}>
          {subtitle}
        </Text>
      </View>
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: colors.text,
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.surface }}>
          Sign in
        </Text>
      </Pressable>
    </View>
  )
}
