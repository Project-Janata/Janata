import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { ArrowLeft } from 'phosphor-react-native'
import type { AppColors } from '../../tokens'

export function NativeChatHeader({
  colors,
  insetsTop,
  title,
  subtitle,
  hideAvatar,
  onBack,
}: {
  colors: AppColors
  insetsTop: number
  title: string
  subtitle?: string
  hideAvatar?: boolean
  onBack: () => void
}) {
  return (
    <View
      style={{
        paddingTop: insetsTop + 6,
        paddingHorizontal: 14,
        paddingBottom: 10,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={{
            width: 82,
            minHeight: 42,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <ArrowLeft size={21} color={colors.accent} />
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.accent }}>
            Back
          </Text>
        </Pressable>

        <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          {hideAvatar ? null : null}
          <Text
            style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textFaint }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={{ width: 82 }} />
      </View>
    </View>
  )
}
