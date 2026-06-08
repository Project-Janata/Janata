import { useEffect } from 'react'
import { View, ActivityIndicator, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useUser } from '../../components/contexts'
import { useColors } from '../../hooks/useColors'
import { extractInviteCode } from '../../utils/validation'

/**
 * /i/[code] — the canonical invite link target (chinmayajanata.org/i/CODE, #104).
 *
 * A tapped invite link lands here. We normalize the code and hand off into the
 * signup flow with the invite applied, so the friend never types a code. The
 * richer invite-landing UI (vouch + "what is Janata") is owned by #403's
 * AuthFlowCore invite intent — this route is the plumbing that feeds it.
 *
 * NOTE: For the universal link to open the app (rather than the browser) on a
 * device, the /i path must also be registered in app.json (associatedDomains +
 * intentFilters). When the app isn't installed, this same route serves as the
 * web fallback.
 */
export default function InviteLinkScreen() {
  const router = useRouter()
  const c = useColors()
  const { isAuthenticated, loading } = useUser()
  const { code: raw } = useLocalSearchParams<{ code: string }>()
  const code = extractInviteCode(typeof raw === 'string' ? raw : '')

  useEffect(() => {
    if (loading) return
    if (!code) {
      router.replace('/auth')
      return
    }
    if (isAuthenticated) {
      // Already a member — nothing to redeem at signup. (#403 will turn this
      // into a one-tap "join this center?" confirm.)
      router.replace('/(tabs)')
      return
    }
    router.replace(`/auth?mode=signup&inviteCode=${encodeURIComponent(code)}`)
  }, [loading, code, isAuthenticated, router])

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg, gap: 12 }}>
      <ActivityIndicator color={c.accent} />
      <Text style={{ color: c.textMuted, fontSize: 14 }}>Opening your invite…</Text>
    </View>
  )
}
