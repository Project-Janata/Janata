import React from 'react'
import { View, Text, Pressable } from 'react-native'

export type WeekItem = {
  id: string
  month: string
  day: string
  title: string
  subtitle: string
  highlight: boolean
  onPress?: () => void
}

export function MiniEventRow({
  item,
  cardBg,
  surfaceBg,
  borderColor,
  textColor,
  mutedColor,
  accentColor,
  isDark,
}: {
  item: WeekItem
  cardBg: string
  surfaceBg: string
  borderColor: string
  textColor: string
  mutedColor: string
  accentColor: string
  isDark: boolean
}) {
  const highlightBg = isDark ? 'rgba(124,45,18,0.28)' : '#FFF7ED'
  const highlightBorder = isDark ? '#7C2D12' : '#FFE0C2'
  const pillBg = item.highlight ? (isDark ? '#1F1F1F' : '#FFFFFF') : surfaceBg

  return (
    <Pressable
      onPress={item.onPress}
      style={{
        flexDirection: 'row',
        gap: 12,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: item.highlight ? highlightBorder : borderColor,
        backgroundColor: item.highlight ? highlightBg : cardBg,
      }}
    >
      <View
        style={{
          width: 44,
          height: 50,
          borderRadius: 10,
          backgroundColor: pillBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 9.5, color: accentColor, letterSpacing: 0.6 }}>
          {item.month}
        </Text>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 18, lineHeight: 20, color: textColor }}>
          {item.day}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, justifyContent: 'center', gap: 2 }}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: textColor }} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: mutedColor }} numberOfLines={1}>
          {item.subtitle}
        </Text>
      </View>
    </Pressable>
  )
}
