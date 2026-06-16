import { useEffect, useMemo, useState, useRef } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator, useWindowDimensions, Linking } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft, Share2, MapPin, Users, User, Clock, Lock, Pencil, Trash2 } from 'lucide-react-native'
import { useAnalytics } from '../../utils/analytics'
import { useUser } from '../../components/contexts'
import { useBoard, useEventDetail } from '../../hooks/useApiData'
import { createBoardPost, removeEvent } from '../../utils/api'
import { isSuperAdmin } from '../../utils/admin'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import PrimaryButton from '../../components/ui/buttons/PrimaryButton'
import DestructiveButton from '../../components/ui/buttons/DestructiveButton'
import GuestRsvpSheet from '../../components/events/GuestRsvpSheet'
import EventAttendeeRoster from '../../components/events/EventAttendeeRoster'
import { DetailSection } from '../../components/ui'
import { useDetailColors, type DetailColors } from '../../hooks/useDetailColors'
import { useColors } from '../../hooks/useColors'
import { ThreadPanel, boardPostToMessage, type BoardMessage } from '../../components/boards'
import { PostThread, type FeedPost } from '../../components/feed'
import { buildFeedPostFromMessage } from '../../components/feed/feedData'
import { SeoHead } from '../../components/seo/SeoHead'
import { buildEventJsonLd } from '../../components/seo/jsonLd'

export default function EventDetailWeb() {
  const { id: rawId } = useLocalSearchParams()
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isMobile = width < 768

  const initiallyMobile = useRef(isMobile)

  useEffect(() => {
    if (!initiallyMobile.current && id) {
      // Desktop detail is rendered by the Explore screen's panel (it consumes
      // ?detail=&id=, shows the EventDetailPanel column, and pans the map).
      // Route there, not to "/" (Home has no detail consumer, so the panel
      // never opened — the desktop detail bug).
      router.replace(`/explore?detail=event&id=${id}`)
    } else if (!id) {
      router.replace('/')
    }
  }, [id, router])

  // On desktop, show loading while redirecting
  if (!isMobile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E8862A" />
      </View>
    )
  }

  // On mobile web, render full-screen event detail
  return <MobileEventDetail eventId={id || ''} />
}

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
      <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary }}>
        RSVP to join the conversation — ask about carpooling, what to bring, and more.
      </Text>
    </View>
  )
}

function MobileEventDetail({ eventId }: { eventId: string }) {
  const router = useRouter()
  const { track } = useAnalytics()
  const { user } = useUser()
  const { event, loading, toggleRegistration, isToggling, attendees, isCreator } = useEventDetail(eventId, user?.username, user?.id)
  const colors = useDetailColors()
  const appColors = useColors()
  const [showGuestRsvp, setShowGuestRsvp] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [threadDetailPost, setThreadDetailPost] = useState<FeedPost | null>(null)
  const hasTrackedView = useRef(false)

  const isPast = event?.date ? new Date(event.date + 'T23:59:59') < new Date() : false
  const canEdit = !!user && (isSuperAdmin(user) || isCreator)
  const canAccessEventBoard =
    !!user && !!event?.id && (!!event.isRegistered || isCreator || isSuperAdmin(user))
  const { posts: boardPosts, refetch: refetchBoard } = useBoard('event', event?.id, canAccessEventBoard)
  const eventBoardMessages = useMemo(() => boardPosts.map(boardPostToMessage), [boardPosts])

  useEffect(() => {
    if (!loading && event && !hasTrackedView.current) {
      hasTrackedView.current = true
      const isPast = event.date ? new Date(event.date + 'T23:59:59') < new Date() : false
      track('event_viewed', { eventId, title: event.title, isPast, source: 'event_detail' })
    }
  }, [loading, event, eventId])

  const handleCreateThreadPost = async (body: string) => {
    if (!event?.id) return
    await createBoardPost('event', event.id, body)
    track('event_board_post_created', { eventId, source: 'event_detail' })
    track('content_created', {
      content_type: 'post',
      surface: 'event_board_web',
      board_kind: 'event',
      parent_id: event.id,
      character_count: body?.length ?? 0,
    })
    await refetchBoard()
  }

  const openThreadPost = (message: BoardMessage) => {
    if (!event?.id) return
    track('event_board_post_opened', { eventId, postId: message.id, source: 'event_detail' })
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
    track('event_board_thread_closed', { eventId, source: 'event_detail' })
    setThreadDetailPost(null)
  }

  const handleDelete = async () => {
    if (!event) return
    const ok = typeof window !== 'undefined' && window.confirm(`Delete "${event.title}"? This cannot be undone.`)
    if (!ok) return
    try {
      setIsDeleting(true)
      track('event_deleted', { eventId, source: 'event_detail' })
      await removeEvent(event.id)
      router.replace('/')
    } catch (err: any) {
      window.alert(err?.message || 'Failed to delete event')
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.panelBg }}>
        <ActivityIndicator size="large" color="#E8862A" />
      </View>
    )
  }

  if (!event) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.panelBg }}>
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Event not found</Text>
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
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10 }}
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

  const seoTitle = event.title || 'Event'
  const seoDesc =
    event.description && event.description.length > 30
      ? event.description
      : `${event.title} on ${event.date}` +
        (event.address ? ` at ${event.address}` : '') +
        '. Find details and RSVP on Chinmaya Janata.'
  const eventJsonLd = buildEventJsonLd(event)
  const isExternalOnly = !!event.signupUrl && !event.allowJanataSignup

  return (
    <View style={{ flex: 1, backgroundColor: colors.panelBg }}>
      <SeoHead
        title={seoTitle}
        description={seoDesc}
        path={`/events/${event.id}`}
        ogImage={event.image || undefined}
        jsonLd={eventJsonLd}
      />
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <ChevronLeft size={20} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Back</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {canEdit && !isPast && (
            <Pressable onPress={() => { track('event_edit_opened', { eventId, source: 'event_detail' }); router.push(`/events/form?id=${event.id}`) }} style={{ padding: 8 }} accessibilityLabel="Edit event">
              <Pencil size={18} color={colors.textSecondary} />
            </Pressable>
          )}
          {canEdit && (
            <Pressable onPress={handleDelete} disabled={isDeleting} style={{ padding: 8, opacity: isDeleting ? 0.5 : 1 }} accessibilityLabel="Delete event">
              <Trash2 size={18} color="#DC2626" />
            </Pressable>
          )}
          <Pressable
            onPress={() => {
              track('event_shared', { eventId, source: 'event_detail' })
              if (typeof navigator !== 'undefined' && navigator.share) {
                navigator.share({ title: event.title, text: `Check out ${event.title} on Chinmaya Janata!` }).catch(() => {})
              } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href)
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Share this event"
            style={{ padding: 8 }}
          >
            <Share2 size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Title + Badge */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, gap: 10 }}>
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: colors.text, flex: 1 }}>{event.title}</Text>
        {event.isRegistered && <View style={{ marginTop: 4 }}><Badge label="Going" variant="going" /></View>}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {/* DETAILS */}
        <DetailSection title="Details" first>
          <View style={{ gap: 16 }}>
            {event.date && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Clock size={18} color="#E8862A" />
                <Text style={{ color: colors.text, fontSize: 15 }}>
                  {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {event.time ? ` · ${event.time}` : ''}
                </Text>
              </View>
            )}

            {event.address && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <MapPin size={18} color="#E8862A" style={{ marginTop: 1 }} />
                <Text style={{ color: colors.text, fontSize: 15, flex: 1 }}>{event.address}</Text>
              </View>
            )}

            {event.pointOfContact && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <User size={18} color="#E8862A" />
                <Text style={{ color: colors.text, fontSize: 15 }}>Contact: {event.pointOfContact}</Text>
              </View>
            )}

            {event.description && (
              <Text style={{ color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 2 }}>{event.description}</Text>
            )}
          </View>
        </DetailSection>

        {/* ATTENDEES — hidden when registration is external-only */}
        {!isExternalOnly && (
          <DetailSection title="Attendees" count={event.attendees} contentStyle={{ gap: 4 }}>
            {attendees.length > 0 ? (
              attendees.map((a) => (
                <View key={a.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
                  <Avatar name={a.name} size={40} image={a.image} />
                  <Text style={{ color: colors.text, fontSize: 15, flex: 1 }}>{a.name}</Text>
                </View>
              ))
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}>
                <Users size={18} color={colors.textMuted} />
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>No attendees yet — be the first to RSVP.</Text>
              </View>
            )}
          </DetailSection>
        )}

        {/* COORDINATOR ROSTER — creator/admin only: full list w/ emails + guests + CSV export */}
        {canEdit && (
          <View style={{ paddingHorizontal: 20 }}>
            <EventAttendeeRoster eventId={event.id} eventTitle={event.title} />
          </View>
        )}

        {/* COMMENTS */}
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
            <View style={{ paddingHorizontal: 16 }}>
              <LockedComments colors={colors} />
            </View>
          )}
        </DetailSection>
      </ScrollView>

      {/* Action button(s) — three modes:
          1. signupUrl + allowJanataSignup → Janata primary, external alt
          2. signupUrl only → external referrer, no native RSVP
          3. no signupUrl → native Register / Cancel */}
      {!isPast && (
        <View style={{ padding: 16, gap: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
          {event.signupUrl && event.allowJanataSignup ? (
            <>
              {event.isRegistered ? (
                <DestructiveButton
                  onPress={() => {
                    if (user?.username) {
                      track('event_unregistered', { eventId, source: 'event_detail' })
                      toggleRegistration(user.username)
                    }
                  }}
                  disabled={isToggling}
                  loading={isToggling}
                >
                  Cancel Registration
                </DestructiveButton>
              ) : (
                <PrimaryButton
                  onPress={() => {
                    if (!user) {
                      track('event_guest_rsvp_opened', { eventId, source: 'event_detail' })
                      setShowGuestRsvp(true)
                    } else if (user.username) {
                      track('event_registered', { eventId, source: 'event_detail' })
                      toggleRegistration(user.username)
                    }
                  }}
                  disabled={isToggling}
                  loading={isToggling}
                >
                  Attend on Janata
                </PrimaryButton>
              )}
              <Pressable
                onPress={() => {
                  track('event_external_signup_pressed', { eventId, signupUrl: event.signupUrl, source: 'event_detail' })
                  Linking.openURL(event.signupUrl!)
                }}
                style={{ paddingVertical: 12, alignItems: 'center' }}
                accessibilityLabel={`Sign up at ${hostnameOf(event.signupUrl)}`}
              >
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: '#E8862A' }}>
                  Or sign up at {hostnameOf(event.signupUrl)}
                </Text>
              </Pressable>
            </>
          ) : event.signupUrl ? (
            <>
              <PrimaryButton onPress={() => {
                track('event_external_signup_pressed', { eventId, signupUrl: event.signupUrl, source: 'event_detail' })
                Linking.openURL(event.signupUrl!)
              }}>
                Sign up at {hostnameOf(event.signupUrl)}
              </PrimaryButton>
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
                Registration handled on the official site
              </Text>
            </>
          ) : event.isRegistered ? (
            <DestructiveButton
              onPress={() => {
                if (user?.username) {
                  track('event_unregistered', { eventId, source: 'event_detail' })
                  toggleRegistration(user.username)
                }
              }}
              disabled={isToggling}
              loading={isToggling}
            >
              Cancel Registration
            </DestructiveButton>
          ) : (
            <PrimaryButton
              onPress={() => {
                if (!user) {
                  track('event_guest_rsvp_opened', { eventId, source: 'event_detail' })
                  setShowGuestRsvp(true)
                } else if (user.username) {
                  track('event_registered', { eventId, source: 'event_detail' })
                  toggleRegistration(user.username)
                }
              }}
              disabled={isToggling}
              loading={isToggling}
            >
              Register
            </PrimaryButton>
          )}
        </View>
      )}

      <GuestRsvpSheet
        visible={showGuestRsvp}
        onClose={() => setShowGuestRsvp(false)}
        eventId={eventId}
        eventTitle={event?.title}
      />
    </View>
  )
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
