import { useEffect } from 'react'
import { View, ActivityIndicator, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useUser } from '../../components/contexts'
import { useColors } from '../../hooks/useColors'
import { extractInviteCode } from '../../utils/validation'

/**
 * /invite/[code] — canonical invite landing (chinmayajanata.org/invite/CODE).
 *
 * Reached two ways: directly via chinmayajanata.org/invite/CODE (universal link
 * or web fallback), or via the /i/[code] alias when janata.app/i/CODE opens the
 * app. Normalizes the code and hands off to signup with the invite applied.
 * Richer landing UI (vouch + onboarding intro) is #403's AuthFlowCore invite intent.
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
