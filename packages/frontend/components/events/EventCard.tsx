import React from 'react'
import { View, Text } from 'react-native'
import { MapPin, ThumbsUp, MessageCircle, BadgeCheck } from 'lucide-react-native'
import { Card } from '../ui'

export interface EventCardData {
  id: string
  title: string
  time: string
  location: string
  attendees: number
  likes: number
  comments: number
  // #192 — true when creator was at SEVAK level or higher at create time.
  isOfficial?: boolean
}

interface EventCardProps {
  event: EventCardData
  onPress: (event: EventCardData) => void
  variant?: 'compact' | 'full'
}

export function EventCard({ event, onPress, variant = 'compact' }: EventCardProps) {
  if (variant === 'full') {
    return (
      <Card pressable onPress={() => onPress(event)} padding="md" hoverBorderColor="primary">
        <View className="gap-3">
          <Text className="font-sans text-sm text-primary font-bold uppercase tracking-wide">
            {event.time}
          </Text>
          <View className="flex-row items-center gap-2">
            <MapPin size={16} color="#a1a1aa" />
            <Text className="text-content dark:text-content-dark font-sans text-sm">
              {event.location}
            </Text>
          </View>
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-content dark:text-content-dark font-sans text-xl font-bold leading-tight flex-shrink">
              {event.title}
            </Text>
            {event.isOfficial && <BadgeCheck size={18} color="#C2410C" />}
          </View>
          <Text className="text-content dark:text-content-dark text-base font-medium mt-2">
            {event.attendees} {event.attendees === 1 ? 'person' : 'people'} attending
          </Text>
        </View>

        <View className="flex-row items-center gap-8 pt-4">
          <View className="flex-row items-center gap-2">
            <ThumbsUp size={18} color="#a1a1aa" />
            <Text className="text-content dark:text-content-dark font-sans text-sm font-medium">
              {event.likes}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <MessageCircle size={18} color="#a1a1aa" />
            <Text className="text-content dark:text-content-dark font-sans text-sm font-medium">
              {event.comments}
            </Text>
          </View>
        </View>
      </Card>
    )
  }

  return (
    <Card pressable onPress={() => onPress(event)} padding="sm">
      <View className="gap-2">
        <Text className="font-sans text-sm text-primary font-medium">{event.time}</Text>
        <Text className="text-content dark:text-content-dark font-sans text-sm">
          {event.location}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <Text className="text-content dark:text-content-dark font-sans text-lg font-semibold leading-tight flex-shrink">
            {event.title}
          </Text>
          {event.isOfficial && <BadgeCheck size={15} color="#C2410C" />}
        </View>
        <Text className="text-content dark:text-content-dark text-sm mt-1">
          {event.attendees} {event.attendees === 1 ? 'person' : 'people'}
        </Text>
      </View>

      <View className="flex-row justify-end gap-4 pt-2">
        <View className="flex-row items-center gap-1">
          <ThumbsUp size={16} color="#a1a1aa" />
          <Text className="text-content dark:text-content-dark font-sans text-sm">
            {event.likes}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <MessageCircle size={16} color="#a1a1aa" />
          <Text className="text-content dark:text-content-dark font-sans text-sm">
            {event.comments}
          </Text>
        </View>
      </View>
    </Card>
  )
}
