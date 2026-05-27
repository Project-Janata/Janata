import React from 'react'
import { View, Text } from 'react-native'
import { Calendar, MapPin, MagnifyingGlass } from 'phosphor-react-native'
import type { Icon } from 'phosphor-react-native'
import { useColors } from '../../hooks/useColors'

type EmptyStateVariant = 'events' | 'centers' | 'search' | 'date'

interface EmptyStateProps {
  variant?: EmptyStateVariant
  message?: string
  subtitle?: string
}

const config: Record<EmptyStateVariant, { icon: Icon; title: string; subtitle: string }> = {
  events:  { icon: Calendar,         title: 'No events yet',       subtitle: 'Events you register for will appear here' },
  centers: { icon: MapPin,           title: 'No centers found',    subtitle: 'Try adjusting your search or location' },
  search:  { icon: MagnifyingGlass,  title: 'No results found',    subtitle: 'Try a different search term' },
  date:    { icon: Calendar,         title: 'No events on this day', subtitle: 'Try selecting a different date' },
}

export function EmptyState({ variant = 'search', message, subtitle }: EmptyStateProps) {
  const c = useColors()
  const { icon: Icon, title, subtitle: defaultSubtitle } = config[variant]

  return (
    <View style={{ paddingVertical: 36, alignItems: 'center', paddingHorizontal: 24 }}>
      <Icon size={36} color={c.textFaint} />
      <Text style={{ marginTop: 14, fontFamily: 'Inclusive Sans', fontSize: 15, color: c.textMuted, textAlign: 'center' }}>
        {message || title}
      </Text>
      <Text style={{ marginTop: 6, fontSize: 13, lineHeight: 18, color: c.textFaint, textAlign: 'center' }}>
        {subtitle || defaultSubtitle}
      </Text>
    </View>
  )
}
