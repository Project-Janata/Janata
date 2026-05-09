import React from 'react'
import { View, Text } from 'react-native'
import { Check } from 'lucide-react-native'
import { useTheme } from '../contexts'

type BadgeVariant = 'going' | 'member' | 'upcoming' | 'past' | 'host'

type BadgeProps = {
  label: string
  variant: BadgeVariant
}

type VariantStyle = { bg: string; text: string; showCheck?: boolean }

const LIGHT_STYLES: Record<BadgeVariant, VariantStyle> = {
  going:    { bg: '#ECFDF5', text: '#059669', showCheck: true },
  member:   { bg: '#ECFDF5', text: '#059669', showCheck: true },
  upcoming: { bg: '#E8862A', text: '#FFFFFF' },
  past:     { bg: 'rgba(120,113,108,0.85)', text: '#FFFFFF' },
  host:     { bg: '#FFF7ED', text: '#E8862A' },
}

const DARK_STYLES: Record<BadgeVariant, VariantStyle> = {
  going:    { bg: 'rgba(6,95,70,0.25)', text: '#34D399', showCheck: true },
  member:   { bg: 'rgba(6,95,70,0.25)', text: '#34D399', showCheck: true },
  upcoming: { bg: '#E8862A', text: '#FFFFFF' },
  past:     { bg: 'rgba(120,113,108,0.5)', text: '#D6D3D1' },
  host:     { bg: 'rgba(232,134,42,0.15)', text: '#F59E0B' },
}

export default function Badge({ label, variant }: BadgeProps) {
  const { isDark } = useTheme()
  const style = isDark ? DARK_STYLES[variant] : LIGHT_STYLES[variant]

  return (
    <View
      style={{
        backgroundColor: style.bg,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
      }}
    >
      {style.showCheck && <Check size={11} color={style.text} strokeWidth={3} />}
      <Text
        style={{
          fontSize: 11,
          fontFamily: 'Inclusive Sans',
          color: style.text,
          lineHeight: 14,
        }}
      >
        {label}
      </Text>
    </View>
  )
}
