import { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator, Linking, useWindowDimensions } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft, Share2, MapPin, Globe, Phone, User, Navigation, BadgeCheck, Users } from 'lucide-react-native'
import { useBoard, useCenterDetail } from '../../hooks/useApiData'
import { useDetailColors } from '../../hooks/useDetailColors'
import { createBoardPost, type EventDisplay } from '../../utils/api'
import UnderlineTabBar from '../../components/ui/UnderlineTabBar'
import { ThreadPanel, boardPostToMessage } from '../../components/boards'
import { useUser } from '../../components/contexts'

export default function CenterDetailWeb() {
  const { id: rawId } = useLocalSearchParams()
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isMobile = width < 768

  const initiallyMobile = useRef(isMobile)

  useEffect(() => {
    if (!initiallyMobile.current && id) {
      router.replace(`/?detail=center&id=${id}`)
    } else if (!id) {
      router.replace('/')
    }
  }, [id, router])

  if (!isMobile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E8862A" />
      </View>
    )
  }

  return <MobileCenterDetail centerId={id || ''} />
}

function formatDateCallout(dateStr: string): { month: string; day: string } {
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return { month: '', day: '' }
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = String(d.getDate())
  return { month, day }
}

function MobileCenterDetail({ centerId }: { centerId: string }) {
  const router = useRouter()
  const { user } = useUser()
  const { center, events, loading } = useCenterDetail(centerId)
  const colors = useDetailColors()
  const [activeTab, setActiveTab] = useState('About')
  const canPostToThread =
    !!user && (user.centerID === center?.id || (user.verificationLevel ?? 0) >= 107)
  const { posts: boardPosts, refetch: refetchBoard } = useBoard('center', center?.id, canPostToThread)
  const boardMessages = useMemo(() => boardPosts.map(boardPostToMessage), [boardPosts])

  const handleCreateThreadPost = async (body: string) => {
    if (!center?.id) return
    await createBoardPost('center', center.id, body)
    await refetchBoard()
  }

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: center?.name || 'Center', text: `Check out ${center?.name} on Chinmaya Janata!` }).catch(() => {})
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const handleAddressPress = () => {
    if (!center?.address) return
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(center.address)}`)
  }

  const handleWebsitePress = () => {
    if (!center?.website) return
    const url = center.website.startsWith('http') ? center.website : `https://${center.website}`
    Linking.openURL(url)
  }

  const handlePhonePress = () => {
    if (!center?.phone) return
    Linking.openURL(`tel:${center.phone}`)
  }

  const handleEventPress = (event: EventDisplay) => {
    router.push(`/events/${event.id}`)
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.panelBg }}>
        <ActivityIndicator size="large" color="#E8862A" />
      </View>
    )
  }

  if (!center) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.panelBg }}>
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Center not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#E8862A', fontSize: 16 }}>Go back</Text>
        </Pressable>
      </View>
    )
  }

  const displayWebsite = (center.website ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '')
  return (
    <View style={{ flex: 1, backgroundColor: colors.panelBg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <ChevronLeft size={20} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Back</Text>
          </Pressable>
          <Pressable onPress={handleShare} style={{ padding: 8 }}>
            <Share2 size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text }}>{center.name}</Text>
        {(center.memberCount > 0 || center.isVerified) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {center.memberCount > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Users size={13} color={colors.textSecondary} />
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  {center.memberCount} {center.memberCount === 1 ? 'member' : 'members'}
                </Text>
              </View>
            )}
            {center.memberCount > 0 && center.isVerified && (
              <Text style={{ fontSize: 13, color: colors.textMuted }}>·</Text>
            )}
            {center.isVerified && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <BadgeCheck size={13} color="#E8862A" />
                <Text style={{ fontSize: 13, color: '#E8862A' }}>Verified</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero image */}
        {center.image ? (
          <Image source={{ uri: center.image }} style={{ width: '100%', height: 200 }} resizeMode="cover" />
        ) : null}

        <View style={{ paddingTop: 8 }}>
          <UnderlineTabBar
            tabs={['About', 'Thread', 'Events']}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={{ Thread: boardMessages.length, Events: events.length }}
          />
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 20, gap: 16 }}>
          {activeTab === 'About' && (
            <>
          {/* Point of contact */}
          {center.pointOfContact ? (
            <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
              Point of Contact: {center.pointOfContact}
            </Text>
          ) : null}

          {/* Address */}
          {center.address ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <MapPin size={18} color="#E8862A" style={{ marginTop: 2 }} />
              <View style={{ flex: 1, gap: 8 }}>
                <Text style={{ color: colors.text, fontSize: 15 }}>{center.address}</Text>
                <Pressable
                  onPress={handleAddressPress}
                  style={{ alignSelf: 'flex-start', paddingVertical: 4 }}
                  accessibilityLabel="Get directions"
                >
                  <Text style={{ color: '#E8862A', fontSize: 14, fontWeight: '600', fontFamily: 'Inclusive Sans' }}>
                    Get directions →
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {/* Website */}
          {center.website ? (
            <Pressable onPress={handleWebsitePress} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Globe size={18} color="#E8862A" />
              <Text style={{ color: '#E8862A', fontSize: 15, flex: 1 }} numberOfLines={1}>{displayWebsite}</Text>
            </Pressable>
          ) : null}

          {/* Phone */}
          {center.phone ? (
            <Pressable onPress={handlePhonePress} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Phone size={18} color="#E8862A" />
              <Text style={{ color: colors.text, fontSize: 15, flex: 1 }}>{center.phone}</Text>
            </Pressable>
          ) : null}

          {/* Acharya */}
          {center.acharya ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <User size={18} color="#E8862A" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 15 }}>{center.acharya}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Resident Acharya</Text>
              </View>
            </View>
            ) : null}
            </>
          )}

          {activeTab === 'Thread' && (
            <ThreadPanel
              messages={boardMessages}
              colors={colors}
              emptyTitle="Be the first to post"
              emptySubtitle={`Ask about rides, what to bring, or anything else for ${center.name}.`}
              composerPlaceholder="Write to the board..."
              composerState={canPostToThread ? 'open' : 'locked'}
              onSubmitPost={handleCreateThreadPost}
            />
          )}

          {activeTab === 'Events' && (
            <>
              {events.length > 0 ? (
                <View style={{ gap: 8 }}>
                  {events.map((event) => {
                    const { month, day } = formatDateCallout(event.date)
                    return (
                      <Pressable
                        key={event.id}
                        onPress={() => handleEventPress(event)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: colors.cardBg,
                          borderRadius: 8,
                          paddingVertical: 12,
                          paddingHorizontal: 14,
                        }}
                      >
                        <View style={{ width: 52, alignItems: 'center' }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#E8862A', textTransform: 'uppercase' }}>{month}</Text>
                          <Text style={{ fontSize: 22, fontWeight: '600', color: colors.text }}>{day}</Text>
                        </View>
                        <View style={{ width: 1, backgroundColor: colors.border, alignSelf: 'stretch', marginHorizontal: 12 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }} numberOfLines={2}>{event.title}</Text>
                          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                            {event.time}{event.attendees > 0 ? ` · ${event.attendees} attending` : ''}
                          </Text>
                        </View>
                      </Pressable>
                    )
                  })}
                </View>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>No upcoming events yet</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
