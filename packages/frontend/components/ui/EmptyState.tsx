import { View, Text } from 'react-native'
import { Calendar, MapPin, Search } from 'lucide-react-native'

type EmptyStateVariant = 'events' | 'centers' | 'search' | 'date'

interface EmptyStateProps {
  variant?: EmptyStateVariant
  message?: string
  subtitle?: string
}

const config: Record<EmptyStateVariant, { icon: typeof Calendar; title: string; subtitle: string }> = {
  events: {
    icon: Calendar,
    title: 'No events yet',
    subtitle: 'Events you register for will appear here',
  },
  centers: {
    icon: MapPin,
    title: 'No centers found',
    subtitle: 'Try adjusting your search or location',
  },
  search: {
    icon: Search,
    title: 'No results found',
    subtitle: 'Try a different search term',
  },
  date: {
    icon: Calendar,
    title: 'No events on this day',
    subtitle: 'Try selecting a different date',
  },
}

export function EmptyState({ variant = 'search', message, subtitle }: EmptyStateProps) {
  const { icon: Icon, title, subtitle: defaultSubtitle } = config[variant]

  return (
    <View style={{ paddingVertical: 36, alignItems: 'center', paddingHorizontal: 24 }}>
      <Icon size={36} color="#a8a29e" />
      <Text
        style={{
          marginTop: 14,
          fontSize: 15,
          fontWeight: '600',
          color: '#78716c',
          fontFamily: 'Inclusive Sans',
          textAlign: 'center',
        }}
      >
        {message || title}
      </Text>
      <Text
        style={{
          marginTop: 6,
          fontSize: 13,
          color: '#a8a29e',
          fontFamily: 'Inclusive Sans',
          textAlign: 'center',
        }}
      >
        {subtitle || defaultSubtitle}
      </Text>
    </View>
  )
}
