import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react-native'
import { Avatar } from '../../components/ui'
import { useColors } from '../../hooks/useColors'
import { useAnalytics } from '../../utils/analytics'
import { fetchPublicProfile, type EventData, type PublicProfileData } from '../../utils/api'

function roleLabel(level: number): string | null {
  if (level >= 1000008) return 'Global Head'
  if (level >= 1008) return 'Swami'
  if (level >= 107) return 'Brahmachari'
  if (level >= 54) return 'Sevak'
  if (level >= 45) return 'Verified member'
  return null
}

function displayName(profile: PublicProfileData | null): string {
  if (!profile) return 'Member'
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || 'Member'
}

function formatEventDate(value?: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function PublicMemberProfileScreen() {
  const colors = useColors()
  const router = useRouter()
  const { track } = useAnalytics()
  const { id: rawId } = useLocalSearchParams<{ id: string }>()
  const userId = typeof rawId === 'string' ? rawId : ''
  const [profile, setProfile] = useState<PublicProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!userId) {
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

    setLoading(true)
    fetchPublicProfile(userId)
      .then((nextProfile) => {
        if (cancelled) return
        setProfile(nextProfile)
        if (nextProfile) {
          track('public_profile_viewed', {
            user_id: nextProfile.id,
            verification_level: nextProfile.verificationLevel,
          })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [track, userId])

  const name = useMemo(() => displayName(profile), [profile])
  const role = profile ? roleLabel(profile.verificationLevel) : null
  const hostedEvents = profile?.hostedEvents ?? []

  const openEvent = useCallback(
    (event: EventData) => {
      track('event_list_item_pressed', {
        eventId: event.eventID,
        source: 'public_member_profile',
      })
      router.push(`/events/${event.eventID}` as never)
    },
    [router, track],
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={21} color={colors.accent} strokeWidth={2.3} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontFamily: 'Inclusive Sans',
            fontSize: 16,
            color: colors.text,
          }}
          numberOfLines={1}
        >
          Profile
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : !profile ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 20, color: colors.text }}>
            Member not found
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textMuted, textAlign: 'center' }}>
            This profile is not available.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            width: '100%',
            maxWidth: 720,
            alignSelf: 'center',
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 48,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center' }}>
            <Avatar image={profile.profileImage ?? undefined} name={name} size={92} />
            <Text
              style={{
                marginTop: 14,
                fontFamily: 'Inclusive Sans',
                fontSize: 26,
                color: colors.text,
                textAlign: 'center',
              }}
            >
              {name}
            </Text>
            {role ? (
              <View
                style={{
                  marginTop: 9,
                  borderRadius: 999,
                  backgroundColor: colors.accentSoft,
                  paddingHorizontal: 13,
                  paddingVertical: 6,
                }}
              >
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12.5, color: colors.accent }}>
                  {role}
                </Text>
              </View>
            ) : null}
            {profile.centerName ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 }}>
                <MapPin size={14} color={colors.textMuted} strokeWidth={2.2} />
                <Text style={{ fontSize: 14, color: colors.textMuted }} numberOfLines={1}>
                  {profile.centerName}
                </Text>
              </View>
            ) : null}
            {profile.bio ? (
              <Text
                style={{
                  maxWidth: 540,
                  marginTop: 16,
                  fontSize: 15,
                  lineHeight: 23,
                  color: colors.text,
                  textAlign: 'center',
                }}
              >
                {profile.bio}
              </Text>
            ) : null}
          </View>

          {profile.interests?.length ? (
            <Section title="Interests" colors={colors}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {profile.interests.map((interest) => (
                  <View
                    key={interest}
                    style={{
                      borderRadius: 999,
                      backgroundColor: colors.panel,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: colors.text }}>{interest}</Text>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}

          {profile.school || profile.work || profile.region ? (
            <Section title="About" colors={colors}>
              <View style={{ gap: 10 }}>
                {profile.school ? <InfoRow label="School" value={profile.school} colors={colors} /> : null}
                {profile.work ? <InfoRow label="Work" value={profile.work} colors={colors} /> : null}
                {profile.region ? <InfoRow label="Region" value={profile.region} colors={colors} /> : null}
              </View>
            </Section>
          ) : null}

          {hostedEvents.length ? (
            <Section title="Hosted Events" colors={colors}>
              <View style={{ gap: 10 }}>
                {hostedEvents.map((event) => (
                  <Pressable
                    key={event.eventID}
                    onPress={() => openEvent(event)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${event.title}`}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 12,
                      backgroundColor: colors.card,
                      padding: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: colors.accentSoft,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CalendarDays size={17} color={colors.accent} strokeWidth={2.3} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.text }} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={{ marginTop: 2, fontSize: 13, color: colors.textMuted }} numberOfLines={1}>
                        {[formatEventDate(event.date), event.address].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Section>
          ) : null}
        </ScrollView>
      )}
    </View>
  )
}

function Section({
  title,
  colors,
  children,
}: {
  title: string
  colors: ReturnType<typeof useColors>
  children: React.ReactNode
}) {
  return (
    <View style={{ marginTop: 28 }}>
      <Text
        style={{
          marginBottom: 10,
          fontSize: 11.5,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: colors.textFaint,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  )
}

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string
  value: string
  colors: ReturnType<typeof useColors>
}) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        backgroundColor: colors.card,
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}
    >
      <Text style={{ fontSize: 12, color: colors.textFaint }}>{label}</Text>
      <Text style={{ marginTop: 3, fontSize: 15, color: colors.text }}>{value}</Text>
    </View>
  )
}
