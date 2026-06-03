import React, { useEffect, useMemo, useState } from 'react'
import { DetailSkeleton } from '../../components/ui/Skeleton'
import { View, Text, ScrollView, Image, Pressable, Linking, Share } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ChevronLeft,
  Share as ShareIcon,
  MapPin,
  Globe,
  Phone,
  User,
  BadgeCheck,
  Users,
  Lock,
} from 'lucide-react-native'
import { useAnalytics } from '../../utils/analytics'
import { useBoard, useCenterDetail } from '../../hooks/useApiData'
import { DetailSection } from '../../components/ui'
import { createBoardPost, type EventDisplay } from '../../utils/api'
import { useDetailColors, type DetailColors } from '../../hooks/useDetailColors'
import { useColors } from '../../hooks/useColors'
import { ThreadPanel, boardPostToMessage, type BoardMessage } from '../../components/boards'
import { PostThread, type FeedPost } from '../../components/feed'
import { buildFeedPostFromMessage } from '../../components/feed/feedData'
import { useUser } from '../../components/contexts'
import { CenterAbout } from '../../components/center/CenterAbout'

// ── Helpers ─────────────────────────────────────────────────────────────

function formatDateCallout(dateStr: string): { month: string; day: string } {
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return { month: '', day: '' }
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
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
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, gap: 12 }}>
      {/* Top row: back + share */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8, minHeight: 44, minWidth: 44 }}
        >
          <ChevronLeft size={20} color={colors.iconHeader} />
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.iconHeader }}>Back</Text>
        </Pressable>

        <Pressable
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel="Share this center"
          style={{ padding: 8, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <ShareIcon size={18} color={colors.iconHeader} />
        </Pressable>
      </View>

      {/* Title */}
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 26, color: colors.text, lineHeight: 32 }}>
        {title}
      </Text>

      {/* Stats row */}
      {(memberCount > 0 || isVerified) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {memberCount > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Users size={14} color={colors.textSecondary} />
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </Text>
            </View>
          )}
          {memberCount > 0 && isVerified && <Text style={{ fontSize: 13, color: colors.textMuted }}>·</Text>}
          {isVerified && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <BadgeCheck size={14} color="#E8862A" />
              <Text style={{ fontSize: 13, color: '#E8862A' }}>Verified</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

// ── Locked board hint ─────────────────────────────────────────────────────

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
      <Text style={{ flex: 1, fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }}>
        Verified members of this center can post and reply on the board.
      </Text>
    </View>
  )
}

// ── Main page component ─────────────────────────────────────────────────

export default function CenterDetailPage() {
  const { id: rawId } = useLocalSearchParams()
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const router = useRouter()
  const { track } = useAnalytics()
  const { user } = useUser()
  const { center, events, loading } = useCenterDetail(id as string)
  const colors = useDetailColors()
  const appColors = useColors()
  const [threadDetailPost, setThreadDetailPost] = useState<FeedPost | null>(null)
  const canPostToThread =
    !!user && (user.centerID === center?.id || (user.verificationLevel ?? 0) >= 107)
  const canEditCenter = !!user && (user.verificationLevel ?? 0) >= 107
  const { posts: boardPosts, refetch: refetchBoard } = useBoard('center', center?.id, canPostToThread)
  const boardMessages = useMemo(() => boardPosts.map(boardPostToMessage), [boardPosts])

  useEffect(() => {
    if (!loading && center) {
      track('center_viewed', { centerId: id, name: center.name })
    }
  }, [loading, center, id])

  const handleEventPress = (event: EventDisplay) => {
    track('center_event_pressed', { centerId: id, eventId: event.id, source: 'center_detail' })
    router.push(`/events/${event.id}`)
  }

  const handleCreateThreadPost = async (body: string) => {
    if (!center?.id) return
    await createBoardPost('center', center.id, body)
    track('center_board_post_created', { centerId: center.id, source: 'center_detail' })
    await refetchBoard()
  }

  const openThreadPost = (message: BoardMessage) => {
    if (!center?.id) return
    track('center_board_post_opened', { centerId: center.id, postId: message.id, source: 'center_detail' })
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

  const handleShare = async () => {
    track('center_shared', { centerId: id, source: 'center_detail' })
    try {
      const url = id ? `https://chinmayajanata.org/center/${id}` : 'https://chinmayajanata.org'
      await Share.share({
        message: center
          ? `Check out ${center.name} on Chinmaya Janata! ${url}`
          : `Check out this center on Chinmaya Janata! ${url}`,
        url,
      })
    } catch {
      // Share cancelled or failed
    }
  }

  const handleAddressPress = () => {
    if (!center?.address) return
    track('center_address_pressed', { centerId: id, source: 'center_detail' })
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(center.address)}`)
  }

  const handleWebsitePress = () => {
    if (!center?.website) return
    track('center_website_pressed', { centerId: id, source: 'center_detail' })
    const url = center.website.startsWith('http') ? center.website : `https://${center.website}`
    Linking.openURL(url)
  }

  const handlePhonePress = () => {
    if (!center?.phone) return
    track('center_phone_pressed', { centerId: id, source: 'center_detail' })
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
          <Text style={{ fontSize: 22, fontFamily: 'Inclusive Sans', color: colors.text, marginBottom: 16 }}>
            Center not found
          </Text>
          <Pressable onPress={() => { track('center_not_found_back_pressed', { centerId: id, source: 'center_detail' }); router.back() }} style={{ marginTop: 8, minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, fontFamily: 'Inclusive Sans', color: '#E8862A' }}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  // ── Focused thread view (a board post + its replies) ─────────────────

  if (threadDetailPost) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: appColors.bg }} edges={['top']}>
        <View style={{ paddingTop: 6 }}>
          <Pressable
            onPress={() => { track('center_board_thread_closed', { centerId: center?.id, source: 'center_detail' }); closeThreadPost() }}
            accessibilityRole="button"
            accessibilityLabel="Back to board"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12 }}
          >
            <ChevronLeft size={20} color={appColors.accent} />
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: appColors.accent }}>
              Back to board
            </Text>
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
      </SafeAreaView>
    )
  }

  // Strip protocol for website display
  const displayWebsite = (center.website ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '')

  // ── Sectioned detail (Details → Upcoming Events → Board) ─────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.panelBg }} edges={['top']}>
      <HeaderBar
        title={center.name}
        onBack={() => { track('center_back_pressed', { centerId: id, source: 'center_detail' }); router.back() }}
        onShare={handleShare}
        colors={colors}
        memberCount={center.memberCount}
        isVerified={center.isVerified}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image — edge-to-edge */}
        {center.image ? (
          <Image source={{ uri: center.image }} style={{ width: '100%', height: 200, marginBottom: 4 }} resizeMode="cover" />
        ) : null}

        {/* ABOUT (editable by admins — #285) */}
        <DetailSection title="About" first>
          <CenterAbout
            centerId={center.id}
            description={center.description}
            pointOfContact={center.pointOfContact}
            canEdit={canEditCenter}
          />
        </DetailSection>

        {/* DETAILS */}
        <DetailSection title="Details">
          <View style={{ gap: 16 }}>
            {/* Address */}
            {center.address ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <MetaIcon icon={MapPin} color="#E8862A" colors={colors} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>{center.address}</Text>
                  <Pressable
                    onPress={handleAddressPress}
                    style={{ alignSelf: 'flex-start', paddingVertical: 2 }}
                    accessibilityLabel="Get directions"
                  >
                    <Text style={{ fontSize: 14, color: '#E8862A' }}>Get directions →</Text>
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
                <Text style={{ fontSize: 14, color: '#E8862A', lineHeight: 20, flex: 1 }} numberOfLines={1}>
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
                <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20, flex: 1 }}>{center.phone}</Text>
              </Pressable>
            ) : null}

            {/* Acharya */}
            {center.acharya ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <MetaIcon icon={User} color="#E8862A" colors={colors} />
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>{center.acharya}</Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginTop: 2 }}>
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
                    minHeight: 44,
                  }}
                >
                  <View style={{ width: 52, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Text
                      style={{
                        fontFamily: 'Inclusive Sans',
                        fontSize: 11,
                        color: '#E8862A',
                        textTransform: 'uppercase',
                        lineHeight: 14,
                      }}
                    >
                      {month}
                    </Text>
                    <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 22, color: colors.text, lineHeight: 28 }}>
                      {day}
                    </Text>
                  </View>

                  <View style={{ width: 1, backgroundColor: colors.border, alignSelf: 'stretch', marginHorizontal: 12 }} />

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text, lineHeight: 20 }}
                      numberOfLines={2}
                    >
                      {event.title}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'Inclusive Sans',
                        fontSize: 12,
                        color: colors.textSecondary,
                        lineHeight: 16,
                        marginTop: 2,
                      }}
                    >
                      {event.time}
                      {event.attendees > 0 ? ` · ${event.attendees} attending` : ''}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </DetailSection>
        ) : null}

        {/* BOARD — feed-style posts. Tapping a post opens the focused thread. */}
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
            <View style={{ paddingHorizontal: 20 }}>
              <LockedBoard colors={colors} />
            </View>
          )}
        </DetailSection>
      </ScrollView>
    </SafeAreaView>
  )
}
