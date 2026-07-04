import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { Calendar, MapPin, Search } from 'lucide-react-native'
import { useColors } from '../../hooks/useColors'

type EmptyStateVariant = 'events' | 'centers' | 'search' | 'date'

interface EmptyStateProps {
  variant?: EmptyStateVariant
  message?: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

const config: Record<EmptyStateVariant, { icon: typeof Calendar; title: string; subtitle: string }> = {
  events:  { icon: Calendar, title: 'No events yet',       subtitle: 'Events you register for will appear here' },
  centers: { icon: MapPin,   title: 'No centers found',    subtitle: 'Try adjusting your search or location' },
  search:  { icon: Search,   title: 'No results found',    subtitle: 'Try a different search term' },
  date:    { icon: Calendar, title: 'No events on this day', subtitle: 'Try selecting a different date' },
}

export function EmptyState({ variant = 'search', message, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const c = useColors()
  const { icon: Icon, title, subtitle: defaultSubtitle } = config[variant]

  return (
    <View style={{ paddingVertical: 40, alignItems: 'center', paddingHorizontal: 24 }}>
      {/* Soft accent disc — matches the polished empty/callout treatment used on
          the verification, feed, and home cards for a consistent language. */}
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: c.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={26} color={c.accent} />
      </View>
      <Text style={{ marginTop: 16, fontFamily: 'Inclusive Sans', fontSize: 16, color: c.text, textAlign: 'center' }}>
        {message || title}
      </Text>
      <Text style={{ marginTop: 6, fontSize: 13.5, lineHeight: 19, color: c.textMuted, textAlign: 'center', maxWidth: 280 }}>
        {subtitle || defaultSubtitle}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={{ marginTop: 16, paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: c.accent }}
        >
          <Text style={{ fontSize: 13.5, fontWeight: '600', color: '#FFFFFF' }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}
