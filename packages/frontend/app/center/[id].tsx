import React, { useEffect, useState } from 'react'
import { DetailSkeleton } from '../../components/ui/Skeleton'
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Linking,
  ActivityIndicator,
  Share,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft, Share2, MapPin, Globe, Phone, User, Navigation, BadgeCheck, Users } from 'lucide-react-native'
import { usePostHog } from 'posthog-react-native'
import { useCenterDetail } from '../../hooks/useApiData'
import { Badge, UnderlineTabBar } from '../../components/ui'
import type { EventDisplay } from '../../utils/api'
import { useDetailColors, type DetailColors } from '../../hooks/useDetailColors'
import { buildCenterBoard, ThreadPanel } from '../../components/connect'
import { useUser } from '../../components/contexts'

// ── Helpers ─────────────────────────────────────────────────────────────

function formatDateCallout(dateStr: string): { month: string; day: string } {
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return { month: '', day: '' }
  const month = d
    .toLocaleDateString('en-US', { month: 'short' })
    .toUpperCase()
  const day = String(d.getDate())
  return { month, day }
}

// ── Sub-components ──────────────────────────────────────────────────────

function MetaIcon({
  icon: Icon,
  color,
  colors,
}: {
  icon: React.ElementType
  color: string
  colors: DetailColors
}) {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.iconBoxBg,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={18} color={color} />
    </View>
  )
}

// ── Header ──────────────────────────────────────────────────────────────

function HeaderBar({
  title,
  onBack,
  onShare,
  colors,
  memberCount = 0,
  isVerified = false,
}: {
  title: string
  onBack: () => void
  onShare: () => void
  colors: DetailColors
  memberCount?: number
  isVerified?: boolean
}) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: 10,
      }}
    >
      {/* Top row: back + share */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={onBack}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8, minHeight: 44, minWidth: 44 }}
        >
          <ChevronLeft size={20} color={colors.iconHeader} />
          <Text
            style={{
              fontFamily: 'Inter-Regular',
              fontSize: 14,
              color: colors.iconHeader,
            }}
          >
            Back
          </Text>
        </Pressable>

        <Pressable onPress={onShare} style={{ padding: 8, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Share2 size={18} color={colors.iconHeader} />
        </Pressable>
      </View>

      {/* Title row */}
      <Text
        style={{
          fontFamily: 'Inter-Bold',
          fontSize: 20,
          color: colors.text,
          lineHeight: 26,
        }}
      >
        {title}
      </Text>

      {/* Stats row */}
      {(memberCount > 0 || isVerified) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {memberCount > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Users size={13} color={colors.textSecondary} />
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 13,
                  color: colors.textSecondary,
                }}
              >
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </Text>
            </View>
          )}
          {memberCount > 0 && isVerified && (
            <Text style={{ fontSize: 13, color: colors.textMuted }}>·</Text>
          )}
          {isVerified && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <BadgeCheck size={13} color="#E8862A" />
              <Text
                style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 13,
                  color: '#E8862A',
                }}
              >
                Verified
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

// ── Main page component ─────────────────────────────────────────────────

export default function CenterDetailPage() {
  const { id: rawId } = useLocalSearchParams()
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const router = useRouter()
  const posthog = usePostHog()
  const { user } = useUser()
  const { center, events, loading } = useCenterDetail(id as string)
  const colors = useDetailColors()
  const [activeTab, setActiveTab] = useState('About')

  useEffect(() => {
    if (!loading && center) {
      posthog?.capture('center_viewed', { centerId: id, name: center.name })
    }
  }, [loading, center, id, posthog])

  const handleEventPress = (event: EventDisplay) => {
    posthog?.capture('center_event_pressed', { centerId: id, eventId: event.id })
    router.push(`/events/${event.id}`)
  }

  const handleShare = async () => {
    posthog?.capture('center_shared', { centerId: id })
    try {
      const url = id ? `https://chinmayajanata.org/center/${id}` : 'https://chinmayajanata.org'
      await Share.share({
        message: center ? `Check out ${center.name} on Chinmaya Janata! ${url}` : `Check out this center on Chinmaya Janata! ${url}`,
        url,
      })
    } catch {
      // Share cancelled or failed
    }
  }

  const handleAddressPress = () => {
    if (!center?.address) return
    posthog?.capture('center_address_pressed', { centerId: id })
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(center.address)}`)
  }

  const handleWebsitePress = () => {
    if (!center?.website) return
    posthog?.capture('center_website_pressed', { centerId: id })
    const url = center.website.startsWith('http')
      ? center.website
      : `https://${center.website}`
    Linking.openURL(url)
  }

  const handlePhonePress = () => {
    if (!center?.phone) return
    posthog?.capture('center_phone_pressed', { centerId: id })
    Linking.openURL(`tel:${center.phone}`)
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.panelBg }} edges={['top']}>
        <DetailSkeleton />
      </SafeAreaView>
    )
  }

  if (!center) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.panelBg }} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 22, fontFamily: 'Inter-SemiBold', color: colors.text, marginBottom: 16 }}>
            Center not found
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 8, minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, fontFamily: 'Inter-Medium', color: '#E8862A' }}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  // Strip protocol for website display
  const displayWebsite = (center.website ?? '')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
  const board = buildCenterBoard({
    id: center.id,
    centerName: center.name,
    subtitle: `Ask about rides, seva, and announcements for ${center.name}.`,
  })
  const canPostToThread = !!user?.isVerified

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.panelBg }} edges={['top']}>
      <HeaderBar
        title={center.name}
        onBack={() => router.back()}
        onShare={handleShare}
        colors={colors}
        memberCount={center.memberCount}
        isVerified={center.isVerified}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image — edge-to-edge */}
        {center.image ? (
          <Image
            source={{ uri: center.image }}
            style={{ width: '100%', height: 200 }}
            resizeMode="cover"
          />
        ) : null}

        <View style={{ paddingTop: 8 }}>
          <UnderlineTabBar
            tabs={['About', 'Thread', 'Events']}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={{ Thread: board.messages.length, Events: events.length }}
          />
        </View>

        {/* Content area */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}>
          {activeTab === 'About' && (
            <>
          {/* Point of contact subtitle */}
          {center.pointOfContact ? (
            <Text
              style={{
                fontFamily: 'Inter-Regular',
                fontSize: 13,
                color: colors.textSecondary,
                marginBottom: 16,
              }}
            >
              Point of Contact: {center.pointOfContact}
            </Text>
          ) : null}

          {/* Meta rows */}
          <View style={{ gap: 16 }}>
            {/* Address */}
            {center.address ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <MetaIcon icon={MapPin} color="#E8862A" colors={colors} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Text
                    style={{
                      fontFamily: 'Inter-Medium',
                      fontSize: 14,
                      color: colors.text,
                      lineHeight: 20,
                    }}
                  >
                    {center.address}
                  </Text>
                  <Pressable
                    onPress={handleAddressPress}
                    style={{ alignSelf: 'flex-start', paddingVertical: 4 }}
                    accessibilityLabel="Get directions"
                  >
                    <Text
                      style={{
                        fontFamily: 'Inter-SemiBold',
                        fontSize: 14,
                        color: '#E8862A',
                      }}
                    >
                      Get directions →
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {/* Website */}
            {center.website ? (
              <Pressable
                onPress={handleWebsitePress}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}
              >
                <MetaIcon icon={Globe} color="#E8862A" colors={colors} />
                <Text
                  style={{
                    fontFamily: 'Inter-Medium',
                    fontSize: 14,
                    color: '#E8862A',
                    lineHeight: 20,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {displayWebsite}
                </Text>
              </Pressable>
            ) : null}

            {/* Phone */}
            {center.phone ? (
              <Pressable
                onPress={handlePhonePress}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}
              >
                <MetaIcon icon={Phone} color="#E8862A" colors={colors} />
                <Text
                  style={{
                    fontFamily: 'Inter-Medium',
                    fontSize: 14,
                    color: colors.text,
                    lineHeight: 20,
                    flex: 1,
                  }}
                >
                  {center.phone}
                </Text>
              </Pressable>
            ) : null}

            {/* Acharya */}
            {center.acharya ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <MetaIcon icon={User} color="#E8862A" colors={colors} />
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text
                    style={{
                      fontFamily: 'Inter-Medium',
                      fontSize: 14,
                      color: colors.text,
                      lineHeight: 20,
                    }}
                  >
                    {center.acharya}
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Inter-Regular',
                      fontSize: 13,
                      color: colors.textSecondary,
                      lineHeight: 18,
                      marginTop: 2,
                    }}
                  >
                    Resident Acharya
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
            </>
          )}

          {activeTab === 'Thread' && (
            <ThreadPanel
              messages={board.messages}
              colors={colors}
              emptyTitle="Be the first to post"
              emptySubtitle={`Ask about rides, what to bring, or anything else for ${center.name}.`}
              composerPlaceholder="Write to the board..."
              composerState={canPostToThread ? 'open' : 'locked'}
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
                          minHeight: 44,
                        }}
                      >
                        <View
                          style={{
                            width: 52,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: 'Inter-SemiBold',
                              fontSize: 11,
                              color: '#E8862A',
                              textTransform: 'uppercase',
                              lineHeight: 14,
                            }}
                          >
                            {month}
                          </Text>
                          <Text
                            style={{
                              fontFamily: 'Inter-SemiBold',
                              fontSize: 22,
                              color: colors.text,
                              lineHeight: 28,
                            }}
                          >
                            {day}
                          </Text>
                        </View>

                        <View
                          style={{
                            width: 1,
                            backgroundColor: colors.border,
                            alignSelf: 'stretch',
                            marginHorizontal: 12,
                          }}
                        />

                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontFamily: 'Inter-SemiBold',
                              fontSize: 14,
                              color: colors.text,
                              lineHeight: 20,
                            }}
                            numberOfLines={2}
                          >
                            {event.title}
                          </Text>
                          <Text
                            style={{
                              fontFamily: 'Inter-Regular',
                              fontSize: 12,
                              color: colors.textSecondary,
                              lineHeight: 16,
                              marginTop: 2,
                            }}
                          >
                            {event.time}{event.attendees > 0 ? ` \u00B7 ${event.attendees} attending` : ''}
                          </Text>
                        </View>
                      </Pressable>
                    )
                  })}
                </View>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.textSecondary }}>
                    No upcoming events yet
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
