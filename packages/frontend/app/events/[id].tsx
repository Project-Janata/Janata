import React, { useMemo, useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator, Alert, Share, Linking } from 'react-native'
import { DetailSkeleton } from '../../components/ui/Skeleton'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ChevronLeft,
  Share2,
  MapPin,
  Users,
  User,
  Clock,
  CheckCircle,
  Lock,
  Pencil,
  Trash2,
} from 'lucide-react-native'
import { useAnalytics } from '../../utils/analytics'
import { useBoard, useEventDetail } from '../../hooks/useApiData'
import { useUser } from '../../components/contexts'
import { Badge, Avatar, PrimaryButton, DestructiveButton, DetailSection } from '../../components/ui'
import { useDetailColors, type DetailColors } from '../../hooks/useDetailColors'
import { useColors } from '../../hooks/useColors'
import { createBoardPost, removeEvent } from '../../utils/api'
import { ThreadPanel, boardPostToMessage, type BoardMessage } from '../../components/boards'
import { PostThread, type FeedPost } from '../../components/feed'
import { buildFeedPostFromMessage } from '../../components/feed/feedData'
import AuthPromptModal from '../../components/ui/AuthPromptModal'

const ADMIN_EMAIL = 'chinmayajanata@gmail.com'

// ── Helpers ──────────────────────────────────────────────────────────────

/** Format date + time into "In X hours · 2/27 7:45 PM PST" */
function formatRelativeDateTime(dateStr: string, timeStr: string): string {
  const startTime = timeStr.split(' - ')[0] || timeStr

  const match = startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  let eventDate: Date
  if (match) {
    let hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    const ampm = match[3].toUpperCase()
    if (ampm === 'PM' && hours !== 12) hours += 12
    if (ampm === 'AM' && hours === 12) hours = 0
    eventDate = new Date(dateStr + 'T00:00:00')
    eventDate.setHours(hours, minutes, 0, 0)
  } else {
    eventDate = new Date(dateStr + 'T12:00:00')
  }

  const now = new Date()
  const diffMs = eventDate.getTime() - now.getTime()
  const absDiffMs = Math.abs(diffMs)
  const isFuture = diffMs > 0

  let relative: string
  const mins = Math.floor(absDiffMs / 60000)
  const hrs = Math.floor(absDiffMs / 3600000)
  const days = Math.floor(absDiffMs / 86400000)

  if (mins < 1) {
    relative = 'Now'
  } else if (mins < 60) {
    relative = isFuture ? `In ${mins}m` : `${mins}m ago`
  } else if (hrs < 24) {
    relative = isFuture ? `In ${hrs}h` : `${hrs}h ago`
  } else {
    relative = isFuture ? `In ${days}d` : `${days}d ago`
  }

  const month = eventDate.getMonth() + 1
  const day = eventDate.getDate()
  const timeFormatted = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
  const absolute = `${month}/${day} ${timeFormatted}`

  if (relative === 'Now') return `Now · ${absolute}`
  return `${relative} · ${absolute}`
}

// Split an address like "129 Woodbury Rd, Woodbury, NY - 11797, US" into
// the street segment and the rest using the first comma as the boundary.
function splitStreet(addr: string): string {
  const i = addr.indexOf(',')
  return i === -1 ? addr : addr.slice(0, i).trim()
}
function splitRest(addr: string): string {
  const i = addr.indexOf(',')
  return i === -1 ? '' : addr.slice(i + 1).trim()
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'official site'
  }
}

// ── Sub-components ───────────────────────────────────────────────────────

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
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Icon size={18} color={color} />
    </View>
  )
}

function AvatarStack({
  attendees,
  colors,
}: {
  attendees: { image?: string; initials?: string; name: string }[]
  colors: DetailColors
}) {
  const shown = attendees.slice(0, 5)
  return (
    <View style={{ flexDirection: 'row', marginLeft: 4 }}>
      {shown.map((a, i) => (
        <Avatar
          key={i}
          image={a.image}
          initials={a.initials}
          name={a.name}
          size={28}
          style={{
            borderWidth: 2,
            borderColor: colors.avatarBorder,
            marginLeft: i === 0 ? 0 : -8,
          }}
        />
      ))}
    </View>
  )
}

// ── Header ───────────────────────────────────────────────────────────────

function HeaderBar({
  title,
  isPast,
  isRegistered,
  isAdmin,
  eventId,
  onBack,
  onEdit,
  onDelete,
  onShare,
  colors,
}: {
  title: string
  isPast?: boolean
  isRegistered?: boolean
  isAdmin?: boolean
  eventId?: string
  onBack: () => void
  onEdit?: () => void
  onDelete?: () => void
  onShare?: () => void
  colors: DetailColors
}) {
  const router = useRouter()

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 14,
        gap: 12,
      }}
    >
      {/* Top row: back + actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            padding: 8,
            minHeight: 44,
            minWidth: 44,
          }}
        >
          <ChevronLeft size={20} color={colors.iconHeader} />
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.iconHeader }}>
            Back
          </Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {eventId && !isPast && isAdmin && (
            <Pressable
              onPress={() => {
                onEdit?.()
                router.push(`/events/form?id=${eventId}`)
              }}
              style={{ padding: 8, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
              accessibilityLabel="Edit event"
            >
              <Pencil size={18} color={colors.iconHeader} />
            </Pressable>
          )}
          {eventId && isAdmin && onDelete && (
            <Pressable
              onPress={onDelete}
              style={{ padding: 8, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
              accessibilityLabel="Delete event"
            >
              <Trash2 size={18} color="#DC2626" />
            </Pressable>
          )}
          {!isPast && (
            <Pressable
              onPress={() => {
                onShare?.()
                const url = eventId ? `https://chinmayajanata.org/events/${eventId}` : 'https://chinmayajanata.org'
                Share.share({
                  message: `Check out ${title} on Chinmaya Janata! ${url}`,
                  url,
                }).catch(() => {})
              }}
              accessibilityRole="button"
              accessibilityLabel="Share this event"
              style={{ padding: 8, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Share2 size={18} color={colors.iconHeader} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Title row + badge */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <Text
          style={{
            flex: 1,
            fontFamily: 'Inclusive Sans',
            fontSize: 26,
            color: colors.text,
            lineHeight: 32,
          }}
        >
          {title}
        </Text>
        {isRegistered && (
          <View style={{ marginTop: 5 }}>
            <Badge label="Going" variant="going" />
          </View>
        )}
      </View>
    </View>
  )
}

// ── Details section content ──────────────────────────────────────────────

function DetailsContent({
  event,
  attendees,
  isPast,
  colors,
}: {
  event: {
    date: string
    time: string
    location: string
    address?: string
    attendees: number
    pointOfContact?: string
    description?: string
    signupUrl?: string | null
    allowJanataSignup?: boolean
  }
  attendees: { image?: string; initials?: string; name: string }[]
  isPast?: boolean
  colors: DetailColors
}) {
  const iconColor = isPast ? colors.textMuted : '#E8862A'
  const loc = (event.location || '').trim()
  const addr = (event.address || '').trim()
  const dupe = loc && addr && loc === addr
  const line1 = dupe ? splitStreet(addr) : loc
  const line2 = dupe ? splitRest(addr) : addr

  return (
    <View style={{ gap: 16 }}>
      {/* Date & time */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <MetaIcon icon={Clock} color={iconColor} colors={colors} />
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }}>
          {formatRelativeDateTime(event.date, event.time)}
        </Text>
      </View>

      {/* Location */}
      {(line1 || line2) && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <MetaIcon icon={MapPin} color={iconColor} colors={colors} />
          <View style={{ flex: 1, gap: 2, justifyContent: 'center' }}>
            {line1 ? (
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }}>{line1}</Text>
            ) : null}
            {line2 ? (
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }}>
                {line2}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Point of contact */}
      {event.pointOfContact ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <MetaIcon icon={User} color={iconColor} colors={colors} />
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }}>
            Contact: {event.pointOfContact}
          </Text>
        </View>
      ) : null}

      {/* About */}
      {event.description ? (
        <Text
          style={{
            fontFamily: 'Inclusive Sans',
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 21,
            marginTop: 2,
          }}
        >
          {event.description}
        </Text>
      ) : null}
    </View>
  )
}

// ── Attendees section content ────────────────────────────────────────────

function AttendeesContent({
  attendees,
  colors,
}: {
  attendees: { image?: string; initials?: string; name: string; subtitle: string }[]
  colors: DetailColors
}) {
  if (attendees.length === 0) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
        <Users size={18} color={colors.textMuted} />
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.textSecondary }}>
          No attendees yet — be the first to RSVP.
        </Text>
      </View>
    )
  }
  return (
    <View>
      {attendees.map((attendee, index) => (
        <View
          key={index}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 }}
        >
          <Avatar image={attendee.image} initials={attendee.initials} name={attendee.name} size={40} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }}>
              {attendee.name}
            </Text>
            {attendee.subtitle ? (
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSecondary }}>
                {attendee.subtitle}
              </Text>
            ) : null}
          </View>
          {index === 0 && <Badge label="HOST" variant="host" />}
        </View>
      ))}
    </View>
  )
}

// ── Attended banner ──────────────────────────────────────────────────────

function AttendedBanner({ count, colors }: { count: number; colors: DetailColors }) {
  return (
    <View
      style={{
        backgroundColor: colors.attendedBg,
        borderRadius: 8,
        padding: 12,
        paddingHorizontal: 16,
        gap: 4,
        marginBottom: 4,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <CheckCircle size={18} color="#059669" />
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: '#059669' }}>
          You attended this event
        </Text>
      </View>
      {count > 1 && (
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: '#059669', marginLeft: 26 }}>
          Along with {count - 1} others
        </Text>
      )}
    </View>
  )
}

// ── Action bar (RSVP) ──────────────────────────────────────────────────────

function ActionBar({
  isRegistered,
  isPast,
  onToggle,
  isToggling,
  signupUrl,
  allowJanataSignup,
  onExternalSignup,
  colors,
}: {
  isRegistered?: boolean
  isPast?: boolean
  onToggle: () => void
  isToggling: boolean
  signupUrl?: string | null
  allowJanataSignup?: boolean
  onExternalSignup?: () => void
  colors: DetailColors
}) {
  if (isPast) return null

  const wrapperStyle = {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: colors.panelBg,
  } as const

  if (signupUrl && allowJanataSignup) {
    return (
      <View style={{ ...wrapperStyle, gap: 8 }}>
        {isRegistered ? (
          <DestructiveButton onPress={onToggle} disabled={isToggling} loading={isToggling}>
            Cancel Registration
          </DestructiveButton>
        ) : (
          <PrimaryButton onPress={onToggle} disabled={isToggling} loading={isToggling}>
            Attend on Janata
          </PrimaryButton>
        )}
        <Pressable
          onPress={() => {
            onExternalSignup?.()
            Linking.openURL(signupUrl)
          }}
          style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}
          accessibilityLabel={`Sign up at ${hostnameOf(signupUrl)}`}
        >
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: '#E8862A' }}>
            Or sign up at {hostnameOf(signupUrl)}
          </Text>
        </Pressable>
      </View>
    )
  }

  if (signupUrl) {
    return (
      <View style={wrapperStyle}>
        <PrimaryButton onPress={() => { onExternalSignup?.(); Linking.openURL(signupUrl) }}>
          Sign up at {hostnameOf(signupUrl)}
        </PrimaryButton>
        <Text
          style={{
            fontFamily: 'Inclusive Sans',
            fontSize: 12,
            color: colors.textMuted,
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          Registration handled on the official site
        </Text>
      </View>
    )
  }

  if (isRegistered) {
    return (
      <View style={wrapperStyle}>
        <DestructiveButton onPress={onToggle} disabled={isToggling} loading={isToggling}>
          Cancel Registration
        </DestructiveButton>
      </View>
    )
  }

  return (
    <View style={wrapperStyle}>
      <PrimaryButton onPress={onToggle} disabled={isToggling} loading={isToggling}>
        Attend Event
      </PrimaryButton>
      <Text
        style={{
          fontFamily: 'Inclusive Sans',
          fontSize: 12,
          color: colors.textMuted,
          textAlign: 'center',
          marginTop: 8,
        }}
      >
        Free · No registration required
      </Text>
    </View>
  )
}

// ── Locked board hint (shown in Comments when board isn't accessible) ──────

function LockedComments({ colors }: { colors: DetailColors }) {
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
        RSVP to join the conversation — ask about carpooling, what to bring, and more.
      </Text>
    </View>
  )
}

// ── Main component ───────────────────────────────────────────────────────

export default function EventDetailPage() {
  const { id: rawId } = useLocalSearchParams()
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const router = useRouter()
  const { track } = useAnalytics()
  const userContext = useUser()
  const { user, authStatus } = userContext
  const username = authStatus === 'authenticated' ? user?.username : undefined
  const userId = authStatus === 'authenticated' ? user?.id : undefined
  const { event, attendees, loading, toggleRegistration, isToggling, isCreator } =
    useEventDetail(id as string, username, userId)
  const colors = useDetailColors()
  const appColors = useColors()
  const hasTrackedView = useRef(false)
  const [threadDetailPost, setThreadDetailPost] = useState<FeedPost | null>(null)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)

  const isAdmin = user?.email === ADMIN_EMAIL || (user?.verificationLevel !== undefined && user.verificationLevel >= 107)
  const canEdit = isAdmin || isCreator

  const isPast = event?.date ? new Date(event.date + 'T23:59:59') < new Date() : false
  const canAccessEventBoard = !!user && !!event?.id && (!!event.isRegistered || isCreator || isAdmin)
  const { posts: boardPosts, refetch: refetchBoard } = useBoard('event', event?.id, canAccessEventBoard)
  const eventBoardMessages = useMemo(() => boardPosts.map(boardPostToMessage), [boardPosts])

  useEffect(() => {
    if (!loading && event && !hasTrackedView.current) {
      hasTrackedView.current = true
      track('event_viewed', { eventId: id, title: event.title, isPast })
    }
  }, [loading, event, id, isPast])

  const handleEditPress = () => {
    track('event_edit_opened', { eventId: id, source: 'event_detail' })
  }

  const handleDeletePress = () => {
    if (!event) return
    Alert.alert(
      'Delete event?',
      `"${event.title}" will be permanently removed. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              track('event_deleted', { eventId: id, source: 'event_detail' })
              await removeEvent(id as string)
              router.replace('/')
            } catch (err: any) {
              Alert.alert('Delete failed', err?.message || 'Could not delete event.')
            }
          },
        },
      ],
    )
  }

  const handleToggleRegistration = async () => {
    // Guest taps RSVP → prompt to sign in (mirrors the web event detail).
    if (!user) {
      track('event_auth_prompt_shown', { eventId: id, source: 'event_detail' })
      setShowAuthPrompt(true)
      return
    }
    if (!user.username) return
    try {
      track(event?.isRegistered ? 'event_unregistered' : 'event_registered', { eventId: id, source: 'event_detail' })
      await toggleRegistration(user.username)
    } catch (err: any) {
      const message = err?.message || ''
      track('event_registration_failed', { eventId: id, error: message, source: 'event_detail' })
      if (message.includes('Already registered')) {
        Alert.alert('Already Registered', 'You are already registered for this event.')
      } else if (message.includes('Not registered')) {
        Alert.alert('Not Registered', 'You are not registered for this event.')
      } else {
        Alert.alert('Error', 'Failed to update registration. Please try again.')
      }
    }
  }

  const handleCreateThreadPost = async (body: string) => {
    if (!event?.id) return
    await createBoardPost('event', event.id, body)
    track('event_board_post_created', { eventId: id, source: 'event_detail' })
    await refetchBoard()
  }

  const openThreadPost = (message: BoardMessage) => {
    if (!event?.id) return
    track('event_board_post_opened', { eventId: id, postId: message.id, source: 'event_detail' })
    setThreadDetailPost(
      buildFeedPostFromMessage(message, {
        groupId: `event-${event.id}`,
        kind: 'event',
        parentId: event.id,
        title: event.title,
        subtitle: event.location || `${event.attendees ?? 0} going`,
      })
    )
  }

  const closeThreadPost = () => {
    track('event_board_thread_closed', { eventId: id, source: 'event_detail' })
    setThreadDetailPost(null)
  }

  // ── Loading state ────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.panelBg }}>
        <DetailSkeleton />
      </SafeAreaView>
    )
  }

  // ── Not-found state ──────────────────────────────────────────────────

  if (!event) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.panelBg }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 22, fontFamily: 'Inclusive Sans', color: colors.text, marginBottom: 16 }}>
            Event not found
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 8, minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, fontFamily: 'Inclusive Sans', color: '#E8862A' }}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  // ── Derived state ────────────────────────────────────────────────────

  const isRegistered = !!event?.isRegistered && !isPast

  // ── Focused thread view (a board post + its replies) ─────────────────
  // Reuses the same PostThread (with its bottom-docked composer) as the
  // Connect feed, so opening a comment feels identical across the app.

  if (threadDetailPost) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: appColors.bg }}>
        <View style={{ paddingTop: 6 }}>
          <Pressable
            onPress={closeThreadPost}
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

  // ── Sectioned detail (Details → Attendees → Comments) ────────────────

  const isExternalOnly = !!event.signupUrl && !event.allowJanataSignup

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.panelBg }}>
      <HeaderBar
        title={event.title}
        isPast={isPast}
        isRegistered={isRegistered}
        isAdmin={canEdit}
        eventId={id as string}
        onBack={() => router.back()}
        onEdit={handleEditPress}
        onDelete={canEdit ? handleDeletePress : undefined}
        onShare={() => track('event_shared', { eventId: id, source: 'event_detail' })}
        colors={colors}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: isPast ? 32 : 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero image — edge-to-edge */}
        {event.image ? (
          <View style={{ width: '100%', height: 200, position: 'relative', marginBottom: 4 }}>
            <Image
              source={{ uri: event.image }}
              style={{ width: '100%', height: 200, opacity: isPast ? 0.75 : 1 }}
              resizeMode="cover"
            />
            {isPast && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.15)' }} />
            )}
            <View style={{ position: 'absolute', bottom: 16, left: 16 }}>
              <Badge label={isPast ? 'Past Event' : 'Upcoming'} variant={isPast ? 'past' : 'upcoming'} />
            </View>
          </View>
        ) : null}

        {/* DETAILS */}
        <DetailSection title="Details" first>
          {isPast && isRegistered ? <AttendedBanner count={event.attendees} colors={colors} /> : null}
          <DetailsContent event={event} attendees={attendees} isPast={isPast} colors={colors} />
        </DetailSection>

        {/* ATTENDEES — hidden when registration is external-only (no native RSVP) */}
        {!isExternalOnly && (
          <DetailSection
            title="Attendees"
            count={event.attendees}
            contentStyle={{ gap: 8 }}
          >
            {attendees.length > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <AvatarStack attendees={attendees} colors={colors} />
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }}>
                  {event.attendees} {event.attendees === 1 ? 'person' : 'people'} on Janata
                </Text>
              </View>
            ) : null}
            <AttendeesContent attendees={attendees} colors={colors} />
          </DetailSection>
        )}

        {/* COMMENTS — board posts, feed-style. Composer sits at the top of the
            section; tapping a post opens the focused thread view above. */}
        <DetailSection title="Comments" count={canAccessEventBoard ? eventBoardMessages.length : undefined} contentStyle={{ paddingHorizontal: 0 }}>
          {canAccessEventBoard ? (
            <ThreadPanel
              messages={eventBoardMessages}
              colors={colors}
              emptyTitle="Be the first to post"
              emptySubtitle={`Ask about carpooling, what to bring, or anything else for the ${event.attendees ?? 0} people going.`}
              composerPlaceholder="Write to the group..."
              composerState="open"
              onSubmitPost={handleCreateThreadPost}
              onMessagePress={openThreadPost}
            />
          ) : (
            <View style={{ paddingHorizontal: 20 }}>
              <LockedComments colors={colors} />
            </View>
          )}
        </DetailSection>
      </ScrollView>

      <ActionBar
        isRegistered={isRegistered}
        isPast={isPast}
        onToggle={handleToggleRegistration}
        isToggling={isToggling}
        signupUrl={event.signupUrl}
        allowJanataSignup={event.allowJanataSignup}
        onExternalSignup={() => track('event_external_signup_pressed', { eventId: id, signupUrl: event.signupUrl, source: 'event_detail' })}
        colors={colors}
      />

      <AuthPromptModal
        visible={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        returnTo={`/events/${id}`}
        eventTitle={event?.title}
      />
    </SafeAreaView>
  )
}
