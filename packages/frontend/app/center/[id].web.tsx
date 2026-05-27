import { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  Linking,
  useWindowDimensions,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  CaretLeft,
  ShareNetwork,
  MapPin,
  Globe,
  Phone,
  User,
  NavigationArrow,
  SealCheck,
  Users,
} from 'phosphor-react-native'
import { useCenterDetail } from '../../hooks/useApiData'
import { useDetailColors } from '../../hooks/useDetailColors'
import type { EventDisplay } from '../../utils/api'
import UnderlineTabBar from '../../components/ui/UnderlineTabBar'
import { buildCenterBoard, ThreadPanel } from '../../components/boards'
import { useUser } from '../../components/contexts'
import { SeoHead } from '../../components/seo/SeoHead'
import { buildCenterJsonLd } from '../../components/seo/jsonLd'
import { usePostHog } from 'posthog-react-native'

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

function LockedBoard({ colors }: { colors: DetailColors }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.iconBoxBg,
      }}
    >
      <Lock size={18} color={colors.textSecondary} />
      <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary }}>
        Verified members of this center can post and reply on the board.
      </Text>
    </View>
  )
}

function MobileCenterDetail({ centerId }: { centerId: string }) {
  const router = useRouter()
  const { user } = useUser()
  const posthog = usePostHog()
  const { center, events, loading } = useCenterDetail(centerId)
  const colors = useDetailColors()
  const appColors = useColors()
  const [threadDetailPost, setThreadDetailPost] = useState<FeedPost | null>(null)

  // Fire center_viewed once per center load. Mirrors the native page's
  // event so web traffic isn't missing from PostHog. (#analytics)
  useEffect(() => {
    if (!loading && center?.id) {
      posthog?.capture('center_viewed', {
        centerId: center.id,
        name: center.name,
        source: 'web_detail',
      })
    }
  }, [loading, center?.id, center?.name, posthog])
  const canPostToThread =
    !!user && (user.centerID === center?.id || (user.verificationLevel ?? 0) >= 107)
  const { posts: boardPosts, refetch: refetchBoard } = useBoard(
    'center',
    center?.id,
    canPostToThread
  )
  const boardMessages = useMemo(() => boardPosts.map(boardPostToMessage), [boardPosts])

  const handleCreateThreadPost = async (body: string) => {
    if (!center?.id) return
    await createBoardPost('center', center.id, body)
    await refetchBoard()
  }

  const openThreadPost = (message: BoardMessage) => {
    if (!center?.id) return
    setThreadDetailPost(
      buildFeedPostFromMessage(message, {
        groupId: `center-${center.id}`,
        kind: 'center',
        parentId: center.id,
        title: center.name,
        subtitle: center.address || 'Center board',
      })
    )
  }

  const closeThreadPost = () => setThreadDetailPost(null)

  const handleShare = () => {
    posthog?.capture('center_shared', { centerId: center?.id ?? '', source: 'web_detail' })
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: center?.name || 'Center',
          text: `Check out ${center?.name} on Chinmaya Janata!`,
        })
        .catch(() => {})
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const handleAddressPress = () => {
    if (!center?.address) return
    posthog?.capture('center_address_pressed', { centerId: center.id, source: 'web_detail' })
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(center.address)}`)
  }

  const handleWebsitePress = () => {
    if (!center?.website) return
    posthog?.capture('center_website_pressed', { centerId: center.id, source: 'web_detail' })
    const url = center.website.startsWith('http') ? center.website : `https://${center.website}`
    Linking.openURL(url)
  }

  const handlePhonePress = () => {
    if (!center?.phone) return
    posthog?.capture('center_phone_pressed', { centerId: center.id, source: 'web_detail' })
    Linking.openURL(`tel:${center.phone}`)
  }

  const handleEventPress = (event: EventDisplay) => {
    posthog?.capture('center_event_pressed', {
      centerId: center?.id ?? '',
      eventId: event.id,
      source: 'web_detail',
    })
    router.push(`/events/${event.id}`)
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.panelBg,
        }}
      >
        <ActivityIndicator size="large" color="#E8862A" />
      </View>
    )
  }

  if (!center) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.panelBg,
        }}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Center not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#E8862A', fontSize: 16 }}>Go back</Text>
        </Pressable>
      </View>
    )
  }

  // ── Focused thread view (a board post + its replies) ─────────────────
  if (threadDetailPost) {
    return (
      <View style={{ flex: 1, backgroundColor: appColors.bg }}>
        <View style={{ paddingTop: 12 }}>
          <Pressable
            onPress={closeThreadPost}
            accessibilityRole="button"
            accessibilityLabel="Back to board"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <ChevronLeft size={20} color={appColors.accent} />
            <Text style={{ fontSize: 14, color: appColors.accent }}>Back to board</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1 }}>
          <PostThread
            post={threadDetailPost}
            colors={appColors}
            onPostChanged={refetchBoard}
            onPostDeleted={() => {
              closeThreadPost()
              refetchBoard()
            }}
          />
        </View>
      </View>
    )
  }

  const displayWebsite = (center.website ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '')
  const seoTitle = center.name || 'Center'
  const seoDesc =
    `${center.name} — a Chinmaya Mission center` +
    (center.address ? ` at ${center.address}` : '') +
    '. Find upcoming events, contact info, and connect with the local community on Chinmaya Janata.'
  const centerJsonLd = buildCenterJsonLd(center)

  return (
    <View style={{ flex: 1, backgroundColor: colors.panelBg }}>
      <SeoHead
        title={seoTitle}
        description={seoDesc}
        path={`/center/${center.id}`}
        ogImage={center.image || undefined}
        jsonLd={centerJsonLd}
      />
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          >
            <CaretLeft size={20} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Back</Text>
          </Pressable>
          <Pressable onPress={handleShare} style={{ padding: 8 }}>
            <ShareNetwork size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: colors.text }}>{center.name}</Text>
        {(center.memberCount > 0 || center.isVerified) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {center.memberCount > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Users size={14} color={colors.textSecondary} />
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
                <SealCheck size={13} color="#E8862A" />
                <Text style={{ fontSize: 13, color: '#E8862A' }}>Verified</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero image */}
        {center.image ? (
          <Image
            source={{ uri: center.image }}
            style={{ width: '100%', height: 200, marginBottom: 4 }}
            resizeMode="cover"
          />
        ) : null}

        {/* DETAILS */}
        <DetailSection title="Details" first>
          <View style={{ gap: 16 }}>
            {center.pointOfContact ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <User size={18} color="#E8862A" />
                <Text style={{ color: colors.text, fontSize: 15 }}>
                  Contact: {center.pointOfContact}
                </Text>
              </View>
            ) : null}

            {center.address ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <MapPin size={18} color="#E8862A" style={{ marginTop: 2 }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ color: colors.text, fontSize: 15 }}>{center.address}</Text>
                  <Pressable
                    onPress={handleAddressPress}
                    style={{ alignSelf: 'flex-start', paddingVertical: 2 }}
                    accessibilityLabel="Get directions"
                  >
                    <Text style={{ color: '#E8862A', fontSize: 14, fontWeight: '600' }}>
                      Get directions →
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {center.website ? (
              <Pressable
                onPress={handleWebsitePress}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <Globe size={18} color="#E8862A" />
                <Text style={{ color: '#E8862A', fontSize: 15, flex: 1 }} numberOfLines={1}>
                  {displayWebsite}
                </Text>
              </Pressable>
            ) : null}

            {center.phone ? (
              <Pressable
                onPress={handlePhonePress}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <Phone size={18} color="#E8862A" />
                <Text style={{ color: colors.text, fontSize: 15, flex: 1 }}>{center.phone}</Text>
              </Pressable>
            ) : null}

            {center.acharya ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <User size={18} color="#E8862A" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 15 }}>{center.acharya}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                    Resident Acharya
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </DetailSection>

        {/* UPCOMING EVENTS */}
        {events.length > 0 ? (
          <DetailSection title="Upcoming Events" count={events.length} contentStyle={{ gap: 8 }}>
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
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                  }}
                >
                  <View style={{ width: 52, alignItems: 'center' }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: '#E8862A',
                        textTransform: 'uppercase',
                      }}
                    >
                      {month}
                    </Text>
                    <Text style={{ fontSize: 22, fontWeight: '600', color: colors.text }}>
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
                      style={{ fontSize: 14, fontWeight: '600', color: colors.text }}
                      numberOfLines={2}
                    >
                      {event.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                      {event.time}
                      {event.attendees > 0 ? ` · ${event.attendees} attending` : ''}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </DetailSection>
        ) : null}

        {/* BOARD */}
        <DetailSection
          title="Board"
          count={canPostToThread ? boardMessages.length : undefined}
          contentStyle={{ paddingHorizontal: 0 }}
        >
          {canPostToThread ? (
            <ThreadPanel
              messages={boardMessages}
              colors={colors}
              emptyTitle="Be the first to post"
              emptySubtitle={`Ask about rides, what to bring, or anything else for ${center.name}.`}
              composerPlaceholder="Write to the board..."
              composerState="open"
              onSubmitPost={handleCreateThreadPost}
              onMessagePress={openThreadPost}
            />
          ) : (
            <View style={{ paddingHorizontal: 16 }}>
              <LockedBoard colors={colors} />
            </View>
          )}
        </DetailSection>
      </ScrollView>
    </View>
  )
}
