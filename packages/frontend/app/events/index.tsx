import React from 'react'
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Calendar, MapPin, ThumbsUp, MessageCircle } from 'lucide-react-native'
import { useUser } from '../../components/contexts'
import { useMyEvents, EventDisplay } from '../../hooks/useApiData'
import { Card } from '../../components/ui'
import { useAnalytics } from '../../utils/analytics'

export default function EventsListPage() {
  const router = useRouter()
  const { user } = useUser()
  const { events, loading, refetch } = useMyEvents(user?.username)
  const [refreshing, setRefreshing] = React.useState(false)
  const { track } = useAnalytics()

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
    track('event_list_refreshed', { source: 'events_list' })
  }

  const handleEventPress = (event: EventDisplay) => {
    track('event_list_item_pressed', { eventId: event.id, source: 'events_list' })
    router.push(`/events/${event.id}`)
  }

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-background dark:bg-background-dark">
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    )
  }

  return (
    <ScrollView
      className="flex-1 bg-background dark:bg-background-dark"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View className="px-4 pt-4 pb-8 gap-4">
        <Text className="text-content dark:text-content-dark font-sans text-2xl font-bold">
          My Events
        </Text>

        {events.length > 0 ? (
          <View className="gap-3">
            {events.map((event) => (
              <Card key={event.id} pressable onPress={() => handleEventPress(event)} padding="sm">
                <View className="gap-2">
                  <Text className="font-sans text-sm text-primary font-medium">{event.time}</Text>
                  <Text className="text-content dark:text-content-dark font-sans text-sm">
                    {event.location}
                  </Text>
                  <Text className="text-content dark:text-content-dark font-sans text-lg font-semibold leading-tight">
                    {event.title}
                  </Text>
                  <Text className="text-content dark:text-content-dark text-sm mt-1">
                    {event.attendees} {event.attendees === 1 ? 'person' : 'people'}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <View className="items-center py-16 gap-4">
            <Calendar size={48} color="#a1a1aa" />
            <Text className="text-lg text-contentStrong dark:text-contentStrong-dark font-sans">
              No events yet
            </Text>
            <Text className="text-sm text-contentStrong dark:text-contentStrong-dark font-sans text-center px-8">
              Events you register for will appear here
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
