import React from 'react'
import { View, Text } from 'react-native'
import type { ColorSet } from './types'

export function EmptyPanel({
  title,
  subtitle,
  colors,
}: {
  title: string
  subtitle: string
  colors: ColorSet
}) {
  return (
    <View style={{ paddingVertical: 18, paddingHorizontal: 4, gap: 5 }}>
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 17, color: colors.text }}>
        {title}
      </Text>
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, lineHeight: 20, color: colors.textMuted }}>
        {subtitle}
      </Text>
    </View>
  )
}
