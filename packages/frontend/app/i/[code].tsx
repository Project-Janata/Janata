import { useEffect, useState, useCallback } from 'react'
import { View, Text, Pressable, ActivityIndicator, Image, useWindowDimensions } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useUser } from '../../components/contexts'
import { useColors } from '../../hooks/useColors'
import { extractInviteCode } from '../../utils/validation'
import { inviteClient } from '../../src/auth/inviteClient'
import { INTRO_STEPS } from '../../components/intro/IntroSteps'
import IntroCard from '../../components/intro/IntroCard'
import PasteInvite from '../../components/invite/PasteInvite'
import { useAnalytics } from '../../utils/analytics'

/**
 * /i/[code] — Door 1, the invite landing (chinmayajanata.org/i/CODE).
 *
 * This is where a real member's invite link lands. It vouches ("Anand invited
 * you to Janata"), shows one strong hero, and hands off into signup with the
 * code applied — auth fires only at Accept (#403). #440 built the plumbing this
 * sits on (route, deep-link registration, register flips NORMAL_USER on a
 * consumed code). Four terminal states, never a silent redirect:
 *
 *   - valid + logged out → Door 1 vouch + Accept           (new-01/01b/02/03)
 *   - dead/expired code  → recovery, paste a fresh link     (new-04)
 *   - already logged in  → "you're already a member"        (new-05)
 */

type Phase = 'resolving' | 'valid' | 'invalid' | 'member' | 'error'

export default function InviteLinkScreen() {
  const router = useRouter()
  const c = useColors()
  const { track } = useAnalytics()
  const { width } = useWindowDimensions()
  const { authStatus, loading } = useUser()
  const isAuthenticated = authStatus === 'authenticated'
  const { code: raw } = useLocalSearchParams<{ code: string }>()
  const code = extractInviteCode(typeof raw === 'string' ? raw : '')

  const [phase, setPhase] = useState<Phase>('resolving')
  const [inviterName, setInviterName] = useState<string | null>(null)
  // Bumped by the retry button to re-run the lookup after a transient failure.
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (loading) return
    // Already a member: no signup ever (new-05).
    if (isAuthenticated) {
      setPhase('member')
      return
    }
    if (!code) {
      setPhase('invalid')
      return
    }
    let cancelled = false
    setPhase('resolving')
    inviteClient.lookup(code).then((res) => {
      if (cancelled) return
      if (res.status === 'valid') {
        setInviterName(res.inviterFirstName)
        setPhase('valid')
        track('door1_view', { has_inviter_name: !!res.inviterFirstName })
      } else if (res.status === 'invalid') {
        setPhase('invalid')
      } else {
        // Transient (network / rate limit) — let the visitor retry rather than
        // telling a real invitee their good code is dead.
        setPhase('error')
      }
    })
    return () => {
      cancelled = true
    }
    // `track` is intentionally excluded — including the (unstable) analytics fn
    // re-runs this effect every render, which storms the lookup endpoint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, code, isAuthenticated, reloadKey])

  // Carry the resolved inviter name forward so /auth shows the vouch without a
  // second lookup. Encoded; empty when nameless.
  const withInviter = useCallback(
    (mode: 'signup' | 'login') =>
      `/auth?mode=${mode}&inviteCode=${encodeURIComponent(code)}` +
      (inviterName ? `&inviter=${encodeURIComponent(inviterName)}` : ''),
    [code, inviterName],
  )

  const accept = useCallback(() => {
    track('invite_accept_tap', { invite_code: code })
    router.replace(withInviter('signup') as never)
  }, [code, router, track, withInviter])

  const logIn = useCallback(() => {
    // Hold the code so a returning member's account gets the upgrade (#403 slice 2).
    router.replace(withInviter('login') as never)
  }, [router, withInviter])

  const heroWidth = Math.min(width, 440)

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: '100%', maxWidth: 440, paddingHorizontal: 24, alignItems: 'center' }}>
        {phase === 'resolving' && (
          <View style={{ alignItems: 'center', gap: 12 }}>
            <ActivityIndicator color={c.accent} />
            <Text style={{ color: c.textMuted, fontSize: 14 }}>Opening your invite…</Text>
          </View>
        )}

        {phase === 'valid' && (
          <>
            {/* new-01 / new-01b — vouch banner; nameless when the resolver has no name */}
            <View
              style={{
                backgroundColor: c.accentSoft,
                borderRadius: 999,
                paddingVertical: 8,
                paddingHorizontal: 16,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: c.accent, fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
                {inviterName ? `${inviterName} invited you to Janata` : "You're invited to Janata"}
              </Text>
            </View>

            {/* new-02 — one strong hero, reusing the real onboarding intro art + copy */}
            <IntroCard step={INTRO_STEPS[0]} width={heroWidth} index={0} />

            {/* new-03 — Accept (primary) + Already a member (ghost) */}
            <View style={{ width: '100%', gap: 12, marginTop: 8 }}>
              <Pressable
                onPress={accept}
                style={{
                  backgroundColor: c.accent,
                  borderRadius: 12,
                  paddingVertical: 15,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: c.textInverse, fontSize: 16, fontWeight: '600' }}>
                  Accept invite
                </Text>
              </Pressable>
              <Pressable onPress={logIn} style={{ paddingVertical: 10, alignItems: 'center' }}>
                <Text style={{ color: c.textMuted, fontSize: 14 }}>
                  Already a member? <Text style={{ color: c.accent, fontWeight: '600' }}>Log in</Text>
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {phase === 'member' && (
          // new-05 — auto-logged-in: no signup, just back into the app.
          <View style={{ alignItems: 'center', gap: 16 }}>
            <Image
              source={INTRO_STEPS[2].image}
              style={{ width: 120, height: 120 }}
              resizeMode="contain"
            />
            <View style={{ gap: 6, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 26, color: c.text }}>
                You're already a member
              </Text>
              <Text style={{ fontSize: 15, color: c.textMuted, textAlign: 'center' }}>
                No need to sign up again.
              </Text>
            </View>
            <Pressable
              onPress={() => router.replace('/(tabs)')}
              style={{
                backgroundColor: c.accent,
                borderRadius: 12,
                paddingVertical: 15,
                paddingHorizontal: 48,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: c.textInverse, fontSize: 16, fontWeight: '600' }}>Open Janata</Text>
            </Pressable>
          </View>
        )}

        {phase === 'invalid' && (
          // new-04 — dead/expired code: recovery (error variant of new-25).
          // Never a silent dump into signup.
          <PasteInvite
            title="This invite isn't active"
            subtitle="The link may have expired. Paste a fresh invite, or ask a member for one."
          />
        )}

        {phase === 'error' && (
          // Transient failure (network / rate limit): retry, don't condemn the code.
          <View style={{ alignItems: 'center', gap: 16 }}>
            <View style={{ gap: 6, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 26, color: c.text, textAlign: 'center' }}>
                Couldn't open your invite
              </Text>
              <Text style={{ fontSize: 15, color: c.textMuted, textAlign: 'center', lineHeight: 22 }}>
                Check your connection and try again.
              </Text>
            </View>
            <Pressable
              onPress={() => setReloadKey((k) => k + 1)}
              style={{
                backgroundColor: c.accent,
                borderRadius: 12,
                paddingVertical: 15,
                paddingHorizontal: 48,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: c.textInverse, fontSize: 16, fontWeight: '600' }}>Try again</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  )
}
