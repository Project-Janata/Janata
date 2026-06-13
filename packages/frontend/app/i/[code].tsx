import { useEffect } from 'react'
import { View, ActivityIndicator, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useUser } from '../../components/contexts'
import { useColors } from '../../hooks/useColors'
import { extractInviteCode } from '../../utils/validation'

/**
 * /i/[code] — canonical invite landing (chinmayajanata.org/i/CODE).
 *
 * This is both the universal/app-link target and the web fallback when the
 * native app is not installed. It keeps the fallback intentionally small:
 * normalize the code and hand logged-out invitees into signup with the invite
 * applied. Richer vouch + onboarding intro UI is #403's AuthFlowCore work.
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
      // Already a member; #403 will replace this with the invite intent flow.
      router.replace('/(tabs)')
      return
    }
    router.replace(`/auth?mode=signup&inviteCode=${encodeURIComponent(code)}`)
  }, [loading, code, isAuthenticated, router])

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.bg,
        gap: 12,
      }}
    >
      <ActivityIndicator color={c.accent} />
      <Text style={{ color: c.textMuted, fontSize: 14 }}>Opening your invite...</Text>
    </View>
  )
}
