import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { useColors } from '../../hooks/useColors'

type FilterChipProps = {
  label: string
  icon?: React.ReactNode
  active: boolean
  onPress: () => void
  variant?: 'filled' | 'outline'
}

export default function FilterChip({ label, icon, active, onPress, variant = 'filled' }: FilterChipProps) {
  const c = useColors()
  const isOutline = variant === 'outline'

  const bg = active
    ? isOutline ? c.accentSoft : c.accent
    : c.card
  const borderColor = active ? c.accent : c.border
  const textColor = active
    ? isOutline ? c.accent : '#FFFFFF'
    : c.textMuted

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor,
        backgroundColor: bg,
      }}
    >
      {icon && <View>{icon}</View>}
      <Text style={{ fontWeight: '500', fontSize: 13, lineHeight: 18, color: textColor }}>
        {label}
      </Text>
    </Pressable>
  )
}
