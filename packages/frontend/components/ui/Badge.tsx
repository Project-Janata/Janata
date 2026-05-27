import React from 'react'
import { View, Text } from 'react-native'
import { Check } from 'phosphor-react-native'
import { useColors } from '../../hooks/useColors'

type BadgeVariant = 'going' | 'member' | 'upcoming' | 'past' | 'host'

type BadgeProps = {
  label: string
  variant: BadgeVariant
}

export default function Badge({ label, variant }: BadgeProps) {
  const c = useColors()

  const styles: Record<BadgeVariant, { bg: string; text: string; showCheck?: boolean }> = {
    going:    { bg: c.successSoft,  text: c.success,    showCheck: true },
    member:   { bg: c.successSoft,  text: c.success,    showCheck: true },
    upcoming: { bg: c.accent,       text: '#FFFFFF' },
    past:     { bg: c.surface,      text: c.textMuted },
    host:     { bg: c.accentSoft,   text: c.accent },
  }

  const { bg, text, showCheck } = styles[variant]

  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
      }}
    >
      {showCheck && <Check size={11} color={text} />}
      <Text style={{ fontWeight: '500', fontSize: 11, lineHeight: 14, color: text }}>
        {label}
      </Text>
    </View>
  )
}
