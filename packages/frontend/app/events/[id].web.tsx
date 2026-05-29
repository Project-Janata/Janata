import { useEffect, useState, useRef } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator, useWindowDimensions, Linking } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  CaretLeft,
  ShareNetwork,
  MapPin,
  Users,
  User,
  Clock,
  CheckCircle,
  PencilSimple,
  Trash,
} from 'phosphor-react-native'
import { CaretLeft, ShareNetwork, MapPin, Users, User, Clock, CheckCircle, PencilSimple, Trash } from 'phosphor-react-native'
import { useUser } from '../../components/contexts'
import { useEventDetail } from '../../hooks/useApiData'
import { removeEvent } from '../../utils/api'
import { isSuperAdmin } from '../../utils/admin'
import Avatar from '../../components/ui/Avatar'
import Badge from '../../components/ui/Badge'
import UnderlineTabBar from '../../components/ui/UnderlineTabBar'
import PrimaryButton from '../../components/ui/buttons/PrimaryButton'
import DestructiveButton from '../../components/ui/buttons/DestructiveButton'
import AuthPromptModal from '../../components/ui/AuthPromptModal'
import { useDetailColors } from '../../hooks/useDetailColors'
import { buildEventBoard, ThreadPanel } from '../../components/boards'

function formatEventDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  if (isNaN(d.getTime())) return dateStr.toUpperCase()
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  return `${weekday}, ${month} ${d.getDate()}`
}

export default function EventDetailWeb() {
  const { id: rawId } = useLocalSearchParams()
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isMobile = width < 768

  const initiallyMobile = useRef(isMobile)

  useEffect(() => {
    if (!initiallyMobile.current && id) {
      router.replace(`/?detail=event&id=${id}`)
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

function MobileEventDetail({ eventId }: { eventId: string }) {
  const router = useRouter()
  const { user } = useUser()
  const { event, loading, toggleRegistration, isToggling, attendees, isCreator } = useEventDetail(
    eventId,
    user?.username,
    user?.id
  )
  const colors = useDetailColors()
  const [activeTab, setActiveTab] = useState('Details')
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isPast = event?.date ? new Date(event.date + 'T23:59:59') < new Date() : false
  const canEdit = !!user && (isSuperAdmin(user) || isCreator)
  const canPostToThread = !!user?.isVerified

  const handleDelete = async () => {
    if (!event) return
    const ok =
      typeof window !== 'undefined' &&
      window.confirm(`Delete "${event.title}"? This cannot be undone.`)
    if (!ok) return
    try {
      setIsDeleting(true)
      await removeEvent(event.id)
      router.replace('/')
    } catch (err: any) {
      window.alert(err?.message || 'Failed to delete event')
      setIsDeleting(false)
    }
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

  if (!event) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.panelBg,
        }}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Event not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#E8862A', fontSize: 16 }}>Go back</Text>
        </Pressable>
      </View>
    )
  }

  const eventBoard = buildEventBoard({
    id: event.id,
    title: event.title,
    dateLabel: formatEventDateLabel(event.date),
    centerLabel: event.location,
    attendeesLabel: `${event.attendees} going`,
  })

  return (
    <View style={{ flex: 1, backgroundColor: colors.panelBg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <CaretLeft size={20} color={colors.textSecondary} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <CaretLeft size={20} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Back</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {canEdit && !isPast && (
            <Pressable
              onPress={() => router.push(`/events/form?id=${event.id}`)}
              style={{ padding: 8 }}
              accessibilityLabel="Edit event"
            >
              <PencilSimple size={18} color={colors.textSecondary} />
            </Pressable>
          )}
          {canEdit && (
            <Pressable
              onPress={handleDelete}
              disabled={isDeleting}
              style={{ padding: 8, opacity: isDeleting ? 0.5 : 1 }}
              accessibilityLabel="Delete event"
            >
              <Trash size={18} color="#DC2626" />
            </Pressable>
          )}
          <Pressable
            onPress={() => {
              if (typeof navigator !== 'undefined' && navigator.share) {
                navigator
                  .share({
                    title: event.title,
                    text: `Check out ${event.title} on Chinmaya Janata!`,
                  })
                  .catch(() => {})
              } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href)
              }
            }}
            style={{ padding: 8 }}
          >
            <ShareNetwork size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Title + Badge */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, flex: 1 }}>{event.title}</Text>
        {event.isRegistered && <Badge label="Going" variant="going" />}
      </View>

      {/* Tabs */}
      <UnderlineTabBar
        tabs={['Details', 'Thread', 'People']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={{ Thread: eventBoard.messages.length }}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
        {activeTab === 'Details' ? (
          <>
            {/* Date & Time */}
            {event.date && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Clock size={18} color={colors.textSecondary} />
                <Text style={{ color: colors.text, fontSize: 15 }}>
                  {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                  {event.time ? ` · ${event.time}` : ''}
                </Text>
              </View>
            )}

            {/* Location */}
            {event.address && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MapPin size={18} color="#E8862A" />
                <Text style={{ color: colors.text, fontSize: 15 }}>{event.address}</Text>
              </View>
            )}

            {/* Attendees count — hidden when signup is external-only
                (the on-Janata count would always read 0). */}
            {!(event.signupUrl && !event.allowJanataSignup) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Users size={18} color={colors.textSecondary} />
                <Text style={{ color: colors.text, fontSize: 15 }}>
                  {event.attendees} {event.attendees === 1 ? 'person' : 'people'} attending
                </Text>
              </View>
            )}

            {/* Contact */}
            {event.pointOfContact && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <User size={18} color={colors.textSecondary} />
                <Text style={{ color: colors.text, fontSize: 15 }}>Contact: {event.pointOfContact}</Text>
              </View>
            )}

            {/* Description */}
            {event.description && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 }}>ABOUT</Text>
                <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>{event.description}</Text>
              </View>
            )}
          </>
        ) : activeTab === 'Thread' ? (
          <ThreadPanel
            messages={eventBoard.messages}
            colors={colors}
            emptyTitle="Be the first to post"
            emptySubtitle={`Ask about carpooling, what to bring, or anything else for the ${event.attendees} people going.`}
            composerPlaceholder="Write to the group..."
            composerState={canPostToThread ? 'open' : 'locked'}
          />
        ) : (
          <>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              {attendees.length} {attendees.length === 1 ? 'person' : 'people'} attending
            </Text>
            {attendees.map((a) => (
              <View key={a.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
                <Avatar name={a.name} size={40} image={a.image} />
                <Text style={{ color: colors.text, fontSize: 16, flex: 1 }}>
                  {a.name}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Action button(s) — three modes (matches EventDetailPanel.ActionBar):
          1. signupUrl + allowJanataSignup → Janata primary, external alt
          2. signupUrl only → external referrer, no native RSVP
          3. no signupUrl → native Register / Cancel */}
      {!isPast && (
        <View style={{ padding: 16, gap: 8 }}>
          {event.signupUrl && event.allowJanataSignup ? (
            <>
              {event.isRegistered ? (
                <DestructiveButton
                  onPress={() => user?.username && toggleRegistration(user.username)}
                  disabled={isToggling}
                  loading={isToggling}
                >
                  Cancel Registration
                </DestructiveButton>
              ) : (
                <PrimaryButton
                  onPress={() => {
                    if (!user) {
                      setShowAuthPrompt(true)
                    } else if (user.username) {
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
                onPress={() => Linking.openURL(event.signupUrl!)}
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
              <PrimaryButton onPress={() => Linking.openURL(event.signupUrl!)}>
                Sign up at {hostnameOf(event.signupUrl)}
              </PrimaryButton>
              <Text
                style={{
                  fontFamily: 'Inclusive Sans',
                  fontSize: 12,
                  color: colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                Registration handled on the official site
              </Text>
            </>
          ) : event.isRegistered ? (
            <DestructiveButton
              onPress={() => user?.username && toggleRegistration(user.username)}
              disabled={isToggling}
              loading={isToggling}
            >
              Cancel Registration
            </DestructiveButton>
          ) : (
            <PrimaryButton
              onPress={() => {
                if (!user) {
                  setShowAuthPrompt(true)
                } else if (user.username) {
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

      <AuthPromptModal
        visible={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        returnTo={`/events/${eventId}`}
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
