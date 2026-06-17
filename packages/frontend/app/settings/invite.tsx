import { View, Text, Share, Pressable, Platform, ActivityIndicator } from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { UserPlus, Link as LinkIcon, Check, Share2 } from 'lucide-react-native'
import { useUser } from '../../components/contexts'
import { StackHeader, GradientIconBadge } from '../../components/ui'
import { inviteClient, type InviteRole } from '../../src/auth/inviteClient'
import { useColors } from '../../hooks/useColors'
import { useAnalytics } from '../../utils/analytics'
import { hasAdminCapability, SEVAK_LEVEL } from '../../utils/admin'

const MONO_FONT = Platform.select({
  ios: 'JetBrains Mono',
  android: 'monospace',
  default: 'monospace',
})

const linkForCode = (code: string) => `https://chinmayajanata.org/i/${code}`

// Role → verification level the link grants (#451). Mirrors the backend
// INVITE_ROLE_LEVELS; used to reuse an existing link of the same role.
const ROLE_LEVEL: Record<InviteRole, number> = { member: 45, sevak: 54, admin: 108 }
const ROLE_LABEL: Record<InviteRole, string> = { member: 'Member', sevak: 'Sevak', admin: 'Admin' }
const ROLE_PHRASE: Record<InviteRole, string> = {
  member: 'a member',
  sevak: 'a sevak',
  admin: 'an admin',
}

// Copy text to the clipboard on web. Tries the async Clipboard API first
// (HTTPS / modern browsers), then falls back to a hidden-textarea +
// execCommand('copy') so copy still works on http:// or older browsers where
// `navigator.clipboard` is undefined. Returns whether the copy succeeded.
async function copyToClipboardWeb(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to the execCommand fallback
  }
  try {
    if (typeof document !== 'undefined') {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.top = '-9999px'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    }
  } catch {
    // ignore
  }
  return false
}

export default function InviteScreen() {
  const { getToken, user } = useUser()
  const c = useColors()
  const { track } = useAnalytics()
  const isWeb = Platform.OS === 'web'

  // Which roles this member may grant (#451): everyone shares a member link; a
  // sevak can also mint sevak links, an admin can mint admin links. Mirrors the
  // backend guardrail (can't grant above your own level), so the picker only
  // shows roles the server will accept.
  const level = user?.verificationLevel ?? 0
  const availableRoles: InviteRole[] = [
    'member',
    ...(level >= SEVAK_LEVEL ? (['sevak'] as InviteRole[]) : []),
    ...(hasAdminCapability(user) ? (['admin'] as InviteRole[]) : []),
  ]

  const [role, setRole] = useState<InviteRole>('member')
  const [code, setCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pressing, setPressing] = useState(false)

  const inviteUrl = code ? linkForCode(code) : null

  // One ready link per role: reuse the first usable code of that role, else mint
  // one. No user-facing "generate" step.
  const loadLink = useCallback(
    async (forRole: InviteRole) => {
      setLoading(true)
      setFailed(false)
      try {
        const token = await getToken()
        if (!token) {
          setFailed(true)
          return
        }
        const list = await inviteClient.listMyCodes(token)
        if (list.success) {
          const usable = list.data.codes.find(
            (e) => e.isUsable && e.verificationLevel === ROLE_LEVEL[forRole],
          )
          if (usable?.code) {
            setCode(usable.code)
            return
          }
        }
        const minted = await inviteClient.mintCode(
          token,
          forRole === 'member' ? {} : { role: forRole },
        )
        if (minted.success) {
          setCode(minted.data.code)
        } else {
          setFailed(true)
        }
      } catch {
        setFailed(true)
      } finally {
        setLoading(false)
      }
    },
    [getToken],
  )

  useEffect(() => {
    loadLink(role)
  }, [loadLink, role])

  // Single primary action: copy to clipboard on web, native share sheet on
  // device. The share sheet already offers every channel, so there are no
  // per-app tiles.
  const handleShare = async () => {
    if (!inviteUrl) return
    // Voice: no "verified" — in a hard gate every account is, so the promise is
    // "you're in instantly" (#440 copy decision).
    const blurb = 'Join me on Janata. This invite gets you in instantly.'
    let copySucceeded = false
    try {
      if (isWeb) {
        // Web: copy to clipboard (with execCommand fallback for non-HTTPS /
        // older browsers). Never fall through to the native Share sheet here.
        copySucceeded = await copyToClipboardWeb(inviteUrl)
        if (copySucceeded) {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }
      } else if (Platform.OS === 'ios') {
        // iOS treats `url` as its own share item (rich link preview), so the
        // message stays link-free to avoid the link appearing twice.
        await Share.share({ message: blurb, url: inviteUrl }, { subject: 'Join me on Janata' })
      } else {
        // Android's share intent ignores `url`, so the link must ride in the message.
        await Share.share({ message: `${blurb} ${inviteUrl}`, title: 'Join me on Janata' })
      }
    } catch {
      // user dismissed share / clipboard blocked — no-op
    }
    track('invite_link_shared', {
      source: 'invite_screen',
      method: isWeb ? 'copy' : 'share_sheet',
      invite_code: code,
      ...(isWeb ? { copy_succeeded: copySucceeded } : {}),
    })
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* On web the settings layout already renders a header bar; avoid a
          second one. Native shows the screen's own header. */}
      {!isWeb && <StackHeader title="Invite Friends" />}
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: 48,
          paddingHorizontal: 20,
        }}
      >
        <View style={{ width: '100%', maxWidth: 480, alignItems: 'center' }}>
          <GradientIconBadge size={96}>
            <UserPlus size={40} color="#fff" strokeWidth={2} />
          </GradientIconBadge>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 32, color: c.text, marginTop: 16 }}>
            Bring a friend
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: c.textMuted,
              marginTop: 8,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            {role === 'member'
              ? 'They get in instantly.'
              : `They join as ${ROLE_PHRASE[role]}, instantly.`}
          </Text>

          {/* Role picker (#451) — only shown to sevaks/admins, who can mint a
              link that lands the recipient at that role. */}
          {availableRoles.length > 1 && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
              {availableRoles.map((r) => {
                const active = r === role
                return (
                  <Pressable
                    key={r}
                    onPress={() => {
                      if (r !== role) {
                        track('invite_role_selected', { role: r })
                        setRole(r)
                      }
                    }}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      borderRadius: 999,
                      backgroundColor: active ? c.accent : c.surface,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: active ? c.textInverse : c.textMuted,
                      }}
                    >
                      {ROLE_LABEL[r]}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          )}

          <View style={{ width: '100%', marginTop: 32 }}>
            <Text style={{ fontSize: 11, letterSpacing: 0.9, color: c.textFaint, marginBottom: 10 }}>
              YOUR INVITE LINK
            </Text>

            {loading ? (
              <View
                style={{
                  height: 46,
                  borderRadius: 8,
                  backgroundColor: c.surface,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <ActivityIndicator color={c.accent} />
                <Text style={{ fontSize: 13, color: c.textMuted }}>Getting your link…</Text>
              </View>
            ) : failed ? (
              <Pressable
                onPress={() => loadLink(role)}
                style={{
                  height: 46,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: c.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 13, color: c.accent, fontWeight: '600' }}>
                  Couldn't load your link. Tap to retry.
                </Text>
              </Pressable>
            ) : (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: c.surface,
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                  }}
                >
                  <LinkIcon size={16} color={c.accent} />
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{ flex: 1, fontFamily: MONO_FONT, fontSize: 13, color: c.text }}
                  >
                    chinmayajanata.org/i/{code}
                  </Text>
                </View>

                <Pressable
                  onPress={handleShare}
                  onPressIn={() => setPressing(true)}
                  onPressOut={() => setPressing(false)}
                  style={{
                    marginTop: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderRadius: 12,
                    paddingVertical: 15,
                    backgroundColor: copied ? c.accentSoft : pressing ? c.accentPress : c.accent,
                  }}
                >
                  {copied ? (
                    <>
                      <Check size={16} color={c.accent} strokeWidth={2.5} />
                      <Text style={{ fontSize: 15, color: c.accent, fontWeight: '600' }}>
                        Link copied
                      </Text>
                    </>
                  ) : (
                    <>
                      <Share2 size={16} color="#fff" strokeWidth={2} />
                      <Text style={{ fontSize: 15, color: '#fff', fontWeight: '600' }}>
                        {isWeb ? 'Copy link' : 'Share link'}
                      </Text>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  )
}
