import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { useColors } from '../../hooks/useColors'
import Badge from '../ui/Badge'

export type WeekItem = {
  id: string
  month: string
  day: string
  title: string
  subtitle: string
  highlight: boolean
  hosting?: boolean
  onPress?: () => void
}

export function MiniEventRow({ item }: { item: WeekItem }) {
  const c = useColors()

  const highlightBg = c.bg === '#1A1A1A' ? 'rgba(124,45,18,0.28)' : '#FFF7ED'
  const highlightBorder = c.bg === '#1A1A1A' ? '#7C2D12' : '#FFE0C2'

  return (
    <Pressable
      onPress={item.onPress}
      style={{
        flexDirection: 'row',
        gap: 12,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: item.highlight ? highlightBorder : c.border,
        backgroundColor: item.highlight ? highlightBg : c.card,
      }}
    >
      <View style={{ width: 44, height: 50, borderRadius: 10, backgroundColor: item.highlight ? c.card : c.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 9.5, color: c.accent, letterSpacing: 0.6 }}>{item.month}</Text>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 18, lineHeight: 20, color: c.text }}>{item.day}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, justifyContent: 'center', gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: c.text, flexShrink: 1 }} numberOfLines={1}>{item.title}</Text>
          {item.hosting && <Badge label="Hosting" variant="host" />}
        </View>
        <Text style={{ fontSize: 12, lineHeight: 16, color: c.textMuted }} numberOfLines={1}>{item.subtitle}</Text>
      </View>
    </Pressable>
  )
}
