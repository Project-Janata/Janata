import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { UsersRound, type LucideIcon } from 'lucide-react-native'
import type { AppColors } from '../../tokens'

export type CalloutFeature = { icon: LucideIcon; label: string; hint?: string }

export function SignInCallout({
  title,
  subtitle,
  colors,
  onPress,
  features,
  ctaLabel = 'Sign in',
}: {
  title: string
  subtitle: string
  colors: AppColors
  onPress: () => void
  /** When provided, renders a richer card that explains the feature. */
  features?: CalloutFeature[]
  ctaLabel?: string
}) {
  // Rich, explanatory card when feature highlights are passed.
  if (features && features.length > 0) {
    return (
      <View style={{ backgroundColor: colors.accentSoft, borderRadius: 20, padding: 20, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
            <UsersRound size={22} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 18, color: colors.text }}>{title}</Text>
            <Text style={{ fontSize: 13.5, lineHeight: 19, color: colors.textMuted, marginTop: 2 }}>{subtitle}</Text>
          </View>
        </View>
        <View style={{ gap: 12 }}>
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14.5, color: colors.text }}>{f.label}</Text>
                  {f.hint ? (
                    <Text style={{ fontSize: 12.5, lineHeight: 17, color: colors.textMuted }}>{f.hint}</Text>
                  ) : null}
                </View>
              </View>
            )
          })}
        </View>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          style={{ backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 13, alignItems: 'center' }}
        >
          <Text style={{ fontWeight: '600', fontSize: 14.5, color: '#FFFFFF' }}>{ctaLabel}</Text>
        </Pressable>
      </View>
    )
  }

  // Compact banner (original) — used where space is tight.
  return (
    <View style={{ backgroundColor: colors.accentSoft, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
        <UsersRound size={20} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: colors.text }}>{title}</Text>
        <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textMuted }}>{subtitle}</Text>
      </View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={{ backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }}
      >
        <Text style={{ fontWeight: '500', fontSize: 13, color: '#FFFFFF' }}>{ctaLabel}</Text>
      </Pressable>
    </View>
  )
}
