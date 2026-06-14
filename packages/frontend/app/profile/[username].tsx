import { useEffect, useState, useCallback } from 'react'
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ChevronLeft, MapPin } from 'lucide-react-native'
import Avatar from '../../components/ui/Avatar'
import { useColors } from '../../hooks/useColors'
import { useAnalytics } from '../../utils/analytics'
import { fetchPublicProfile, fetchUserPosts, type PublicProfile, type EventData } from '../../utils/api'

/** Role label from verification level (mirrors the self-profile thresholds). */
function roleLabel(vl: number): string | null {
  return vl >= 1000008
    ? 'Global Head'
    : vl >= 1008
      ? 'Swami'
      : vl >= 108
        ? 'Brahmachari'
        : vl >= 54
          ? 'Sevak'
          : vl >= 45
            ? 'Verified member'
            : null
}

/**
 * /profile/[username] — public member profile (#441). Any signed-in member can
 * open it by tapping a feed author: identity, role, home center, bio, interests,
 * and the events they host. Read-only; the safe-subset fields from the backend.
 */
export default function PublicProfileScreen() {
  const c = useColors()
  const router = useRouter()
  const { track } = useAnalytics()
  const { username: raw } = useLocalSearchParams<{ username: string }>()
  const username = typeof raw === 'string' ? raw : ''

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!username) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void (async () => {
      const [p, posts] = await Promise.all([fetchPublicProfile(username), fetchUserPosts(username)])
      if (cancelled) return
      setProfile(p)
      setEvents(posts)
      setLoading(false)
      if (p) track('profile_viewed', { username, verification_level: p.verificationLevel })
    })()
    return () => {
      cancelled = true
    }
  }, [username, track])

  const openEvent = useCallback(
    (id: string) => {
      track('event_list_item_pressed', { eventId: id, source: 'public_profile' })
      router.push(`/events/${id}`)
    },
    [router, track],
  )

  const fullName = profile ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() : ''
  const role = profile ? roleLabel(profile.verificationLevel) : null

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Back header */}
      <View style={{ paddingTop: 12 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10 }}
        >
          <ChevronLeft size={22} color={c.accent} />
          <Text style={{ fontSize: 15, color: c.accent }}>Back</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={c.accent} />
        </View>
      ) : !profile ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 22, color: c.text }}>Member not found</Text>
          <Text style={{ fontSize: 15, color: c.textMuted, textAlign: 'center' }}>
            This profile isn't available.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
          <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingTop: 8 }}>
            <Avatar image={profile.profileImage ?? undefined} name={fullName || profile.username} size={96} />
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 26, color: c.text, marginTop: 14, textAlign: 'center' }}>
              {fullName || profile.username}
            </Text>
            {role && (
              <View
                style={{
                  backgroundColor: c.accentSoft,
                  borderRadius: 999,
                  paddingVertical: 5,
                  paddingHorizontal: 14,
                  marginTop: 8,
                }}
              >
                <Text style={{ color: c.accent, fontSize: 13, fontWeight: '600' }}>{role}</Text>
              </View>
            )}
            {profile.centerName && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 }}>
                <MapPin size={14} color={c.textMuted} />
                <Text style={{ fontSize: 14, color: c.textMuted }}>{profile.centerName}</Text>
              </View>
            )}
            {profile.bio ? (
              <Text style={{ fontSize: 15, color: c.text, textAlign: 'center', lineHeight: 22, marginTop: 14 }}>
                {profile.bio}
              </Text>
            ) : null}
          </View>

          {profile.interests && profile.interests.length > 0 && (
            <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
              <Text style={{ fontSize: 11, letterSpacing: 0.9, color: c.textFaint, marginBottom: 10 }}>
                INTERESTS
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {profile.interests.map((tag) => (
                  <View key={tag} style={{ backgroundColor: c.surface, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 }}>
                    <Text style={{ fontSize: 13, color: c.text }}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {events.length > 0 && (
            <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
              <Text style={{ fontSize: 11, letterSpacing: 0.9, color: c.textFaint, marginBottom: 10 }}>
                EVENTS THEY HOST
              </Text>
              <View style={{ gap: 10 }}>
                {events.map((e) => (
                  <Pressable
                    key={e.eventID}
                    onPress={() => openEvent(e.eventID)}
                    style={{
                      backgroundColor: c.surface,
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }} numberOfLines={1}>
                      {e.title}
                    </Text>
                    {(e.date || e.address) && (
                      <Text style={{ fontSize: 13, color: c.textMuted, marginTop: 2 }} numberOfLines={1}>
                        {[e.date, e.address].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}
