import React from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { MapPin } from 'lucide-react-native'
import { Avatar, Badge } from '../ui'
import type { AttendeeInfo, EventDisplay } from '../../utils/api'
import { formatDatePill, isToday } from './exploreShared'

const AVATAR_COLORS = ['#E8862A', '#78716C', '#A8A29E', '#D6D3D1']

function AttendeeAvatars({ count, attendees }: { count: number; attendees?: AttendeeInfo[] }) {
  if (count <= 0) return null
  const shown = Math.min(count, 4)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ flexDirection: 'row' }}>
        {attendees && attendees.length > 0
          ? attendees.slice(0, shown).map((attendee, i) => (
              <Avatar
                key={i}
                image={attendee.image}
                initials={attendee.initials}
                name={attendee.name}
                size={18}
                style={{
                  marginLeft: i === 0 ? 0 : -6,
                  borderWidth: 1.5,
                  borderColor: 'white',
                }}
              />
            ))
          : Array.from({ length: shown }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  marginLeft: i === 0 ? 0 : -6,
                  borderWidth: 1.5,
                  borderColor: 'white',
                }}
              />
            ))}
      </View>
      <Text className="text-stone-400 dark:text-stone-500 font-sans text-xs">{count} going</Text>
    </View>
  )
}

export function ExploreEventItem({
  event,
  onPress,
  centerName,
}: {
  event: EventDisplay
  onPress: () => void
  centerName?: string
}) {
  const { month, day } = event.date ? formatDatePill(event.date) : { month: '', day: '' }

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row gap-4 p-4 rounded-2xl active:opacity-80 border border-transparent hover:border-stone-200 dark:hover:border-neutral-700 ${
        event.isRegistered
          ? 'bg-orange-50/80 dark:bg-orange-950/20'
          : 'bg-white dark:bg-neutral-900'
      }`}
      style={{ minHeight: 72 }}
    >
      <View className="w-[52px] h-[60px] rounded-xl items-center justify-center bg-stone-100 dark:bg-neutral-800">
        <Text className="text-[10px] font-sans" style={{ color: '#E8862A' }}>
          {month}
        </Text>
        <Text className="text-lg font-sans text-content dark:text-content-dark">{day}</Text>
      </View>

      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text
            className="text-content dark:text-content-dark font-sans text-base leading-tight flex-1"
            numberOfLines={2}
          >
            {event.title}
          </Text>
          {event.isRegistered && <Badge label="Going" variant="going" />}
        </View>
        <Text className="text-stone-500 dark:text-stone-400 font-sans text-sm">
          {event.date && isToday(event.date) ? 'Today · ' : ''}{event.time || ''}
        </Text>
        {centerName && (
          <Text
            className="text-stone-500 dark:text-stone-400 font-sans text-sm"
            numberOfLines={1}
          >
            By {centerName}
          </Text>
        )}
        <View className="flex-row items-center gap-1.5">
          <MapPin size={12} color="#E8862A" />
          <Text
            className="text-stone-500 dark:text-stone-400 font-sans text-sm flex-1"
            numberOfLines={1}
          >
            {event.location}
          </Text>
        </View>
        {event.attendees > 0 && (
          <View style={{ marginTop: 4 }}>
            <AttendeeAvatars count={event.attendees} attendees={event.attendeesList} />
          </View>
        )}
      </View>

      {event.image && (
        <Image
          source={{ uri: event.image }}
          style={{ width: 84, height: 84, borderRadius: 12 }}
          resizeMode="cover"
        />
      )}
    </Pressable>
  )
}
