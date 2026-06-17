// Profile tab — native (iOS/Android). Direction B, stacked single column.
// Mirrors the web Profile (app/(tabs)/profile.web.tsx): a display-only social
// profile (identity + interests, then engagement: stats, upcoming events,
// centers). Editing lives on /edit-profile.
// The "You" header + settings gear are provided by the navigator (TabHeader).
import React, { useState, useCallback, useEffect } from 'react'
import { RefreshControl, ScrollView, View, Pressable, Image, Share } from 'react-native'
import { useRouter, useFocusEffect, useNavigation } from 'expo-router'
import {
  Pencil, Share2, ChevronRight, BadgeCheck,
  Megaphone, CalendarDays, Building2,
} from 'lucide-react-native'
import { useUser, useTheme } from '../../components/contexts'
import { Text } from '../../components/ui'
import { SignInCallout } from '../../components/boards/SignInCallout'
import TabHeader from '../../components/ui/TabHeader'
import { useAnalytics } from '../../utils/analytics'
import { LIGHT, DARK } from '../../tokens/colors'
import { extractCityState } from '../../utils/addressParsing'
import {
  fetchCenters, fetchUserEvents, fetchUserPosts, fetchUserGroups,
  type CenterData, type EventData,
} from '../../utils/api'

type CenterRow = Pick<CenterData, 'centerID' | 'name' | 'address' | 'image'>

function datePill(dateStr?: string | null): { m: string; d: string } {
  if (!dateStr) return { m: '', d: '' }
  const dt = new Date(dateStr + 'T00:00:00')
  if (isNaN(dt.getTime())) return { m: '', d: '' }
  return { m: dt.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(), d: String(dt.getDate()) }
}

export default function Profile() {
  const router = useRouter()
  const navigation = useNavigation()
  const { user, loading, refreshUser } = useUser()
  const { isDark } = useTheme()
  const c = isDark ? DARK : LIGHT
  const { track } = useAnalytics()

  const [allCenters, setAllCenters] = useState<CenterData[]>([])
  const [createdCount, setCreatedCount] = useState(0)
  const [events, setEvents] = useState<EventData[]>([])
  const [groups, setGroups] = useState<CenterData[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadProfile = useCallback(async () => {
    const requests: Promise<unknown>[] = [
      fetchCenters().then(setAllCenters).catch(() => {}),
    ]

    if (user?.username) {
      requests.push(
        refreshUser().catch(() => {}),
        fetchUserPosts(user.username).then((p) => setCreatedCount(p.length)).catch(() => {}),
        fetchUserEvents(user.username).then(setEvents).catch(() => {}),
        fetchUserGroups(user.username).then(setGroups).catch(() => {})
      )
    } else {
      setCreatedCount(0)
      setEvents([])
      setGroups([])
    }

    await Promise.all(requests)
  }, [refreshUser, user?.username])

  useFocusEffect(
    useCallback(() => {
      loadProfile()
    }, [loadProfile])
  )

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await loadProfile()
    } finally {
      setRefreshing(false)
    }
  }, [loadProfile])

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor="#C2410C"
      colors={['#C2410C']}
    />
  )

  const displayName =
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.username || 'You'
  const initials = (() => {
    if (user?.firstName && user?.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    if (user?.firstName) return user.firstName[0].toUpperCase()
    if (user?.username) return user.username[0].toUpperCase()
    return '?'
  })()
  const vl = user?.verificationLevel ?? 0
  const roleLabel =
    vl >= 1000008 ? 'Global Head'
      : vl >= 1008 ? 'Swami'
      : vl >= 108 ? 'Brahmachari'
      : vl >= 54 ? 'Sevak'
      : vl >= 45 ? 'Verified member'
      : null
  const homeCenter = allCenters.find((cc) => cc.centerID === user?.centerID)
  const centerRows = (() => {
    const byId = new Map<string, CenterRow>()
    if (user?.centerID) {
      byId.set(user.centerID, {
        centerID: user.centerID,
        name: homeCenter?.name ?? 'Your center',
        address: homeCenter?.address ?? null,
        image: homeCenter?.image ?? null,
      })
    }
    groups.forEach((group) => byId.set(group.centerID, group))
    return Array.from(byId.values())
  })()
  const interests = user?.interests || []
  const showActivityStats = createdCount > 0 || events.length > 0

  const today = new Date().toISOString().split('T')[0]
  const upcoming = [...events]
    .filter((e) => !e.date || e.date >= today)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .slice(0, 4)

  const onEdit = useCallback(() => {
    track('nav_edit_profile', { source: 'profile' })
    router.push('/edit-profile')
  }, [router, track])
  const onShare = useCallback(async () => {
    try {
      await Share.share({ message: `Check out ${displayName} on Janata!`, title: displayName })
      track('profile_shared', { source: 'profile', username: user?.username })
    } catch { /* dismissed */ }
  }, [displayName, track, user?.username])
  const onExplore = useCallback(() => {
    track('profile_explore_cta', { source: 'profile' })
    router.push('/explore')
  }, [router, track])

  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <TabHeader
          title="You"
          action="settings"
          showProfile={false}
          rightContent={
            user ? (
              <>
                <Pressable
                  onPress={onShare}
                  accessibilityRole="button"
                  accessibilityLabel="Share profile"
                  hitSlop={8}
                  style={({ pressed }) => ({
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: c.surface,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Share2 size={18} color={c.icon} />
                </Pressable>
                <Pressable
                  onPress={onEdit}
                  accessibilityRole="button"
                  accessibilityLabel="Edit profile"
                  hitSlop={8}
                  style={({ pressed }) => ({
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: c.surface,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Pencil size={18} color={c.icon} />
                </Pressable>
              </>
            ) : null
          }
        />
      ),
    })
  }, [navigation, user, c, onShare, onEdit])

  const card = { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 20 } as const

  const StatCard = ({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) => (
    <View style={[card, { flex: 1, padding: 14 }]}>
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 9 }}>{icon}</View>
      <Text style={{ fontSize: 22, fontWeight: '700', color: c.text }}>{value}</Text>
      <Text style={{ fontSize: 12.5, color: c.textMuted }}>{label}</Text>
    </View>
  )

  const SectionLabel = ({ children }: { children: string }) => (
    <Text style={{ fontSize: 12.5, fontWeight: '600', color: c.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12, marginTop: 24, marginLeft: 2 }}>{children}</Text>
  )

  // Guest state: a logged-out visitor can browse the read-only tabs, but the
  // "You" tab has no profile to show — invite them to sign in instead. Returns
  // early so none of the user.* access below runs for a guest.
  if (!user && !loading) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: c.bg }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 48 }}
        refreshControl={refreshControl}
      >
        <SignInCallout
          title="Sign in to Janata"
          subtitle="Sign in to set up your profile, RSVP to events, and join your boards."
          colors={c}
          ctaLabel="Sign in"
          onPress={() => {
            track('profile_signin_pressed', { source: 'profile_guest' })
            router.push('/auth')
          }}
        />
      </ScrollView>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 18, paddingBottom: 48 }}
      refreshControl={refreshControl}
    >
      {/* Profile card */}
      <View style={[card, { padding: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={{ width: 66, height: 66, borderRadius: 33, borderWidth: 3, borderColor: c.card, backgroundColor: c.surface }} />
          ) : (
            <View style={{ width: 66, height: 66, borderRadius: 33, borderWidth: 3, borderColor: c.card, backgroundColor: '#C2410C', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 23, fontWeight: '600' }}>{initials}</Text>
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: c.text }} numberOfLines={1}>{displayName}</Text>
            {roleLabel ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7, alignSelf: 'flex-start', backgroundColor: c.accentSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                <BadgeCheck size={13} color="#C2410C" />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#C2410C' }}>{roleLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {user?.bio ? (
          <Text style={{ fontSize: 14, lineHeight: 20, color: c.textSecondary, marginTop: 14 }}>{user.bio}</Text>
        ) : null}

        {interests.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
            {interests.map((it) => (
              <View key={it} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: c.bg, borderWidth: 1, borderColor: c.border }}>
                <Text style={{ fontSize: 12.5, color: c.textMuted }}>{it}</Text>
              </View>
            ))}
          </View>
        ) : null}

      </View>

      {/* Stats */}
      {showActivityStats ? (
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
          <StatCard icon={<Megaphone size={16} color="#C2410C" />} value={createdCount} label="Posts" />
          <StatCard icon={<CalendarDays size={16} color="#C2410C" />} value={events.length} label="Events" />
        </View>
      ) : null}

      {/* Your centers */}
      <SectionLabel>Your centers</SectionLabel>
      {centerRows.length > 0 ? (
        <View style={[card, { overflow: 'hidden' }]}>
          {centerRows.map((g, i) => (
            <Pressable
              key={g.centerID}
              onPress={() => { track('center_list_item_pressed', { centerId: g.centerID, source: 'profile' }); router.push(`/center/${g.centerID}`) }}
              style={{ flexDirection: 'row', gap: 13, alignItems: 'center', padding: 16, borderBottomWidth: i < centerRows.length - 1 ? 1 : 0, borderBottomColor: c.border }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {g.image ? <Image source={{ uri: g.image }} style={{ width: 40, height: 40 }} /> : <Building2 size={18} color="#C2410C" />}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 14.5, fontWeight: '600', color: c.text }} numberOfLines={1}>{g.name}</Text>
                <Text style={{ fontSize: 12.5, color: c.textMuted, marginTop: 2 }} numberOfLines={1}>{extractCityState(g.address ?? undefined) || 'Center'}</Text>
              </View>
              <ChevronRight size={16} color={c.iconMuted} />
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={[card, { padding: 24, alignItems: 'center' }]}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>No center yet</Text>
          <Text style={{ fontSize: 13.5, lineHeight: 20, color: c.textMuted, textAlign: 'center', marginTop: 4 }}>
            Find your Chinmaya center to connect with your local community.
          </Text>
          <Pressable onPress={onExplore} style={{ marginTop: 14, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, backgroundColor: '#C2410C' }}>
            <Text style={{ fontSize: 13.5, fontWeight: '600', color: '#fff' }}>Find a center</Text>
          </Pressable>
        </View>
      )}

      {/* Upcoming events */}
      <SectionLabel>Upcoming events</SectionLabel>
      {upcoming.length > 0 ? (
        <View style={[card, { overflow: 'hidden' }]}>
          {upcoming.map((e, i) => {
            const { m, d } = datePill(e.date)
            const centerName = allCenters.find((cc) => cc.centerID === e.centerID)?.name
            return (
              <Pressable
                key={e.eventID}
                onPress={() => { track('event_list_item_pressed', { eventId: e.eventID, source: 'profile' }); router.push(`/events/${e.eventID}`) }}
                style={{ flexDirection: 'row', gap: 13, alignItems: 'center', padding: 16, borderBottomWidth: i < upcoming.length - 1 ? 1 : 0, borderBottomColor: c.border }}
              >
                <View style={{ width: 46, height: 52, borderRadius: 12, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#C2410C', letterSpacing: 0.5 }}>{m}</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: c.text }}>{d}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 14.5, fontWeight: '600', color: c.text }} numberOfLines={1}>{e.title}</Text>
                  <Text style={{ fontSize: 12.5, color: c.textMuted, marginTop: 2 }} numberOfLines={1}>{centerName || extractCityState(e.address ?? undefined) || 'Event'}</Text>
                </View>
                <ChevronRight size={16} color={c.iconMuted} />
              </Pressable>
            )
          })}
        </View>
      ) : (
        <View style={[card, { padding: 24, alignItems: 'center' }]}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <CalendarDays size={20} color="#C2410C" />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: c.text }}>No upcoming events yet</Text>
          <Text style={{ fontSize: 13.5, lineHeight: 20, color: c.textMuted, textAlign: 'center', marginTop: 4 }}>
            RSVP to satsangs, study groups, and events near you — they'll show up here.
          </Text>
          <Pressable onPress={onExplore} style={{ marginTop: 14, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, backgroundColor: '#C2410C' }}>
            <Text style={{ fontSize: 13.5, fontWeight: '600', color: '#fff' }}>Explore events</Text>
          </Pressable>
        </View>
      )}

    </ScrollView>
  )
}
