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
  Pencil,
  Trash2,
} from 'lucide-react-native'
import { usePostHog } from 'posthog-react-native'
import { useBoard, useEventDetail } from '../../hooks/useApiData'
import { useUser } from '../../components/contexts'
import { Badge, UnderlineTabBar, Avatar, PrimaryButton, DestructiveButton } from '../../components/ui'
import { useDetailColors, type DetailColors } from '../../hooks/useDetailColors'
import { useColors } from '../../hooks/useColors'
import { createBoardPost, removeEvent } from '../../utils/api'
import { ThreadPanel, boardPostToMessage, type BoardMessage } from '../../components/boards'
import { PostThread, type FeedPost } from '../../components/feed'
import { buildFeedPostFromMessage } from '../../components/feed/feedData'

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

function formatEventDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr.toUpperCase()
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  return `${weekday}, ${month} ${d.getDate()}`
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
  const shown = attendees.slice(0, 3)
  return (
    <View style={{ flexDirection: 'row', marginLeft: 4 }}>
      {shown.map((a, i) => (
        <Avatar
          key={i}
          image={a.image}
          initials={a.initials}
          name={a.name}
          size={24}
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
  colors: DetailColors
}) {
  const router = useRouter()

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        borderBottomWidth: isRegistered ? 0 : 1,
        borderBottomColor: colors.border,
        gap: 10,
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
          <Text
            style={{
              fontFamily: 'Inclusive Sans',
              fontSize: 14,
              color: colors.iconHeader,
            }}
          >
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
              style={{
                padding: 8,
                minHeight: 44,
                minWidth: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityLabel="Edit event"
            >
              <Pencil size={18} color={colors.iconHeader} />
            </Pressable>
          )}
          {eventId && isAdmin && onDelete && (
            <Pressable
              onPress={onDelete}
              style={{
                padding: 8,
                minHeight: 44,
                minWidth: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              accessibilityLabel="Delete event"
            >
              <Trash2 size={18} color="#DC2626" />
            </Pressable>
          )}
          {!isPast && (
            <Pressable
              onPress={() => {
                const url = eventId ? `https://chinmayajanata.org/events/${eventId}` : 'https://chinmayajanata.org'
                Share.share({
                  message: `Check out ${title} on Chinmaya Janata! ${url}`,
                  url,
                }).catch(() => {})
              }}
              accessibilityRole="button"
              accessibilityLabel="Share this event"
              style={{
                padding: 8,
                minHeight: 44,
                minWidth: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
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
            fontSize: 20,
            color: colors.text,
            lineHeight: 26,
          }}
        >
          {title}
        </Text>
        {isRegistered && (
          <View style={{ marginTop: 3 }}>
            <Badge label="Going" variant="going" />
          </View>
        )}
      </View>
    </View>
  )
}

// ── Meta section ─────────────────────────────────────────────────────────

function MetaSection({
  event,
  attendees,
  isPast,
  colors,
}: {
  event: { location: string; address?: string; attendees: number; pointOfContact?: string; signupUrl?: string | null; allowJanataSignup?: boolean }
  attendees: { image?: string; initials?: string; name: string; subtitle: string }[]
  isPast?: boolean
  colors: DetailColors
}) {
  const iconColor = isPast ? colors.textMuted : '#E8862A'
  const attendLabel = `${event.attendees} on Janata`

  return (
    <View style={{ gap: 16 }}>
      {/* Location — when location and address are the same value (common
          when the venue isn't named separately), split into "street" /
          "city, state, zip" so the second line isn't a duplicate. */}
      {(() => {
        const loc = (event.location || '').trim()
        const addr = (event.address || '').trim()
        const dupe = loc && addr && loc === addr
        const line1 = dupe ? splitStreet(addr) : loc
        const line2 = dupe ? splitRest(addr) : addr
        return (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <MetaIcon icon={MapPin} color={iconColor} colors={colors} />
            <View style={{ flex: 1, gap: 2, justifyContent: 'center' }}>
              {line1 ? (
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }}>
                  {line1}
                </Text>
              ) : null}
              {line2 ? (
                <Text
                  style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }}
                >
                  {line2}
                </Text>
              ) : null}
            </View>
          </View>
        )
      })()}

      {/* Attendees — hidden when external signup is exclusive (no native RSVP) */}
      {!(event.signupUrl && !event.allowJanataSignup) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <MetaIcon icon={Users} color={iconColor} colors={colors} />
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }}>
            {attendLabel}
          </Text>
          <AvatarStack attendees={attendees} colors={colors} />
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
    </View>
  )
}

// ── About section ────────────────────────────────────────────────────────

function AboutSection({ description, colors }: { description?: string; colors: DetailColors }) {
  if (!description) return null
  return (
    <View style={{ gap: 12 }}>
      <Text
        style={{
          fontFamily: 'Inclusive Sans',
          fontSize: 11,
          color: colors.textMuted,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        About
      </Text>
      <Text
        style={{
          fontFamily: 'Inclusive Sans',
          fontSize: 14,
          color: colors.textSecondary,
          lineHeight: 20,
        }}
      >
        {description}
      </Text>
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
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <CheckCircle size={18} color="#059669" />
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: '#059669' }}>
          You attended this event
        </Text>
      </View>
      {count > 1 && (
        <Text
          style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: '#059669', marginLeft: 26 }}
        >
          Along with {count - 1} others
        </Text>
      )}
    </View>
  )
}

// ── Action bar ───────────────────────────────────────────────────────────

// Split an address like "129 Woodbury Rd, Woodbury, NY - 11797, US" into
// the street segment ("129 Woodbury Rd") and the rest ("Woodbury, NY - 11797, US")
// using the first comma as the boundary.
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

function ActionBar({
  isRegistered,
  isPast,
  onToggle,
  isToggling,
  signupUrl,
  allowJanataSignup,
  colors,
}: {
  isRegistered?: boolean
  isPast?: boolean
  onToggle: () => void
  isToggling: boolean
  signupUrl?: string | null
  allowJanataSignup?: boolean
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

  // External signup + admin opted into Janata as alternate. Janata primary,
  // external secondary.
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
          onPress={() => Linking.openURL(signupUrl)}
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

  // External signup is exclusive.
  if (signupUrl) {
    return (
      <View style={wrapperStyle}>
        <PrimaryButton onPress={() => Linking.openURL(signupUrl)}>
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

// ── Main component ───────────────────────────────────────────────────────

export default function EventDetailPage() {
  const { id: rawId } = useLocalSearchParams()
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const router = useRouter()
  const posthog = usePostHog()
  const userContext = useUser()
  const { user, authStatus } = userContext
  const [activeTab, setActiveTab] = useState('Details')
  const username = authStatus === 'authenticated' ? user?.username : undefined
  const userId = authStatus === 'authenticated' ? user?.id : undefined
  const { event, attendees, loading, toggleRegistration, isToggling, isCreator } =
    useEventDetail(id as string, username, userId)
  const colors = useDetailColors()
  const appColors = useColors()
  const hasTrackedView = useRef(false)
  const [threadDetailPost, setThreadDetailPost] = useState<FeedPost | null>(null)

  const isAdmin = user?.email === ADMIN_EMAIL || (user?.verificationLevel !== undefined && user.verificationLevel >= 107)
  const canEdit = isAdmin || isCreator

  const isPast = event?.date ? new Date(event.date + 'T23:59:59') < new Date() : false
  const canAccessEventBoard =
    !!user && !!event?.id && (!!event.isRegistered || isCreator || isAdmin)
  const { posts: boardPosts, refetch: refetchBoard } = useBoard('event', event?.id, canAccessEventBoard)
  const eventBoardMessages = useMemo(() => boardPosts.map(boardPostToMessage), [boardPosts])

  // Track event viewed
  useEffect(() => {
    if (!loading && event && !hasTrackedView.current) {
      hasTrackedView.current = true
      posthog?.capture('event_viewed', { eventId: id, title: event.title, isPast })
    }
  }, [loading, event, id, isPast, posthog])

  const handleTabChange = (newTab: string) => {
    posthog?.capture('event_tab_changed', { tab: newTab, eventId: id })
    setActiveTab(newTab)
  }

  const handleEditPress = () => {
    posthog?.capture('event_edit_opened', { eventId: id })
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
              posthog?.capture('event_deleted', { eventId: id })
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
    if (!user?.username) return
    try {
      posthog?.capture(event?.isRegistered ? 'event_unregistered' : 'event_registered', { eventId: id })
      await toggleRegistration(user.username)
    } catch (err: any) {
      const message = err?.message || ''
      posthog?.capture('event_registration_failed', { eventId: id, error: message })
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
    await refetchBoard()
  }

  const openThreadPost = (message: BoardMessage) => {
    if (!event?.id) return
    posthog?.capture('event_board_post_opened', { eventId: id, postId: message.id })
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

  const closeThreadPost = () => setThreadDetailPost(null)

  // Thread tab content: either the post list (ThreadPanel) or, when a post is
  // tapped, its detail (replies + reactions + author actions) reusing the same
  // PostThread as the Connect Feed (#206). Rendered inline (not a Modal) so it
  // works reliably on web inside the screen's ScrollView.
  const renderThreadTab = () =>
    threadDetailPost ? (
      <View style={{ paddingTop: 6 }}>
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
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: appColors.accent }}>
            Back to board
          </Text>
        </Pressable>
        <View style={{ paddingHorizontal: 16 }}>
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
    ) : (
      <ThreadPanel
        messages={eventBoardMessages}
        colors={colors}
        emptyTitle="Be the first to post"
        emptySubtitle={`Ask about carpooling, what to bring, or anything else for the ${event?.attendees ?? 0} people going.`}
        composerPlaceholder="Write to the group..."
        composerState={canPostToThread ? 'open' : 'locked'}
        onSubmitPost={handleCreateThreadPost}
        onMessagePress={openThreadPost}
      />
    )

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
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}
        >
          <Text
            style={{
              fontSize: 22,
              fontFamily: 'Inclusive Sans',
              color: colors.text,
              marginBottom: 16,
            }}
          >
            Event not found
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ marginTop: 8, minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 16, fontFamily: 'Inclusive Sans', color: '#E8862A' }}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  // ── Derived state ────────────────────────────────────────────────────

  const isRegistered = !!event?.isRegistered && !isPast
  const canPostToThread = canAccessEventBoard

  // ── Registered state (with tabs) ─────────────────────────────────────

  if (isRegistered) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.panelBg }}>
        <HeaderBar
          title={event.title}
          isPast={false}
          isRegistered
          isAdmin={canEdit}
          eventId={id as string}
          onBack={() => router.back()}
          onEdit={handleEditPress}
          onDelete={canEdit ? handleDeletePress : undefined}
          colors={colors}
        />

        <View style={{ paddingTop: 8 }}>
          <UnderlineTabBar
            tabs={['Details', 'Thread', 'People']}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            counts={{ Thread: eventBoardMessages.length }}
          />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'Details' && (
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, gap: 20 }}>
              {/* Date & time */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MetaIcon icon={Clock} color="#E8862A" colors={colors} />
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }}>
                  {formatRelativeDateTime(event.date, event.time)}
                </Text>
              </View>

              <MetaSection event={event} attendees={attendees} colors={colors} />
              <AboutSection description={event.description} colors={colors} />
            </View>
          )}

          {activeTab === 'People' && (
            <View style={{ paddingTop: 16, paddingHorizontal: 20 }}>
              <Text
                style={{
                  fontFamily: 'Inclusive Sans',
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginBottom: 12,
                }}
              >
                {event.attendees} {event.attendees === 1 ? 'person' : 'people'} on Janata
              </Text>
              {attendees.length > 0 ? (
                attendees.map((attendee, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      gap: 12,
                    }}
                  >
                    <Avatar
                      image={attendee.image}
                      initials={attendee.initials}
                      name={attendee.name}
                      size={42}
                    />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }}
                      >
                        {attendee.name}
                      </Text>
                      {attendee.subtitle ? (
                        <Text
                          style={{
                            fontFamily: 'Inclusive Sans',
                            fontSize: 12,
                            color: colors.textSecondary,
                          }}
                        >
                          {attendee.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    {index === 0 && <Badge label="HOST" variant="host" />}
                  </View>
                ))
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Users size={48} color={colors.textMuted} />
                  <Text
                    style={{
                      fontFamily: 'Inclusive Sans',
                      fontSize: 14,
                      color: colors.textSecondary,
                      marginTop: 12,
                    }}
                  >
                    No attendees yet
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'Thread' && renderThreadTab()}

        </ScrollView>

        <ActionBar
          isRegistered
          onToggle={handleToggleRegistration}
          isToggling={isToggling}
          signupUrl={event.signupUrl}
          allowJanataSignup={event.allowJanataSignup}
          colors={colors}
        />
      </SafeAreaView>
    )
  }

  // ── Default / past state ─────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.panelBg }}>
      <HeaderBar
        title={event.title}
        isPast={isPast}
        isAdmin={canEdit}
        eventId={id as string}
        onBack={() => router.back()}
        onEdit={handleEditPress}
        onDelete={canEdit ? handleDeletePress : undefined}
        colors={colors}
      />

      {/* Hero image — edge-to-edge */}
      {event.image ? (
        <View style={{ width: '100%', height: 200, position: 'relative' }}>
          <Image
            source={{ uri: event.image }}
            style={{ width: '100%', height: 200, opacity: isPast ? 0.75 : 1 }}
            resizeMode="cover"
          />
          {isPast && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.15)',
              }}
            />
          )}
          <View style={{ position: 'absolute', bottom: 16, left: 16 }}>
            <Badge
              label={isPast ? 'Past Event' : 'Upcoming'}
              variant={isPast ? 'past' : 'upcoming'}
            />
          </View>
        </View>
      ) : null}

      <View style={{ paddingTop: 8 }}>
        <UnderlineTabBar
          tabs={['Details', 'Thread', 'Attendees']}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={{ Thread: eventBoardMessages.length }}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: isPast ? 40 : 100,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Details' && (
          <>
            {/* Attended banner (past + user was registered) */}
            {isPast && isRegistered && <AttendedBanner count={event.attendees} colors={colors} />}

            {/* Date & time */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <MetaIcon icon={Clock} color={isPast ? colors.textMuted : '#E8862A'} colors={colors} />
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }}>
                {formatRelativeDateTime(event.date, event.time)}
              </Text>
            </View>

            {/* Meta rows */}
            <MetaSection event={event} attendees={attendees} isPast={isPast} colors={colors} />

            {/* About */}
            <AboutSection description={event.description} colors={colors} />
          </>
        )}

        {activeTab === 'Thread' && renderThreadTab()}

        {activeTab === 'Attendees' && (
          <View style={{ paddingTop: 8 }}>
            {attendees.length > 0 ? (
              attendees.map((attendee, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    gap: 12,
                  }}
                >
                  <Avatar
                    image={attendee.image}
                    initials={attendee.initials}
                    name={attendee.name}
                    size={42}
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }}
                    >
                      {attendee.name}
                    </Text>
                    {attendee.subtitle ? (
                      <Text
                        style={{
                          fontFamily: 'Inclusive Sans',
                          fontSize: 12,
                          color: colors.textSecondary,
                        }}
                      >
                        {attendee.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  {index === 0 && <Badge label="HOST" variant="host" />}
                </View>
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Users size={48} color={colors.textMuted} />
                <Text
                  style={{
                    fontFamily: 'Inclusive Sans',
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginTop: 12,
                  }}
                >
                  No attendees yet
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <ActionBar
        isRegistered={isRegistered}
        isPast={isPast}
        onToggle={handleToggleRegistration}
        isToggling={isToggling}
        signupUrl={event.signupUrl}
        allowJanataSignup={event.allowJanataSignup}
        colors={colors}
      />
    </SafeAreaView>
  )
}
