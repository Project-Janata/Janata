import { useState, useEffect, useCallback } from 'react'
import { View, Text, Pressable, Modal, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { useDetailColors } from '../../hooks/useDetailColors'
import { useAnalytics } from '../../utils/analytics'
import { validateEmail } from '../../utils'
import { attendEventGuest } from '../../utils/api'
import PrimaryButton from '../ui/buttons/PrimaryButton'

interface GuestRsvpSheetProps {
  visible: boolean
  onClose: () => void
  eventId: string
  eventTitle?: string
  // Fired once the guest is on the list (fresh RSVP or already-RSVPed) so the
  // opener can lock its CTA for the session — no double submissions.
  onRsvped?: () => void
}

type Status = 'form' | 'submitting' | 'success' | 'already' | 'requiresVerified' | 'error'

/**
 * Account-less RSVP sheet (new-11 / new-11b). The low-friction guest funnel:
 * name + email, no account. Backed by POST /attendEventGuest. Same component on
 * web and native (RN Modal). Cancel-via-email is a follow-up (needs prod Resend).
 */
export default function GuestRsvpSheet({ visible, onClose, eventId, eventTitle, onRsvped }: GuestRsvpSheetProps) {
  const colors = useDetailColors()
  const router = useRouter()
  const { track } = useAnalytics()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('form')
  const [errorMsg, setErrorMsg] = useState('')

  const reset = useCallback(() => {
    setName('')
    setEmail('')
    setStatus('form')
    setErrorMsg('')
  }, [])

  const close = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  useEffect(() => {
    if (!visible) reset()
  }, [visible, reset])

  const submit = useCallback(async () => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName) {
      setErrorMsg('Please enter your name.')
      return
    }
    if (!validateEmail(trimmedEmail)) {
      setErrorMsg('Enter a valid email address.')
      return
    }
    setErrorMsg('')
    setStatus('submitting')
    try {
      const res = await attendEventGuest(eventId, trimmedName, trimmedEmail)
      track('guest_rsvp_submit', { eventId, alreadyRsvped: res.alreadyRsvped })
      setStatus(res.alreadyRsvped ? 'already' : 'success')
      onRsvped?.()
    } catch (e: any) {
      if (e?.status === 403) {
        setStatus('requiresVerified')
      } else {
        setErrorMsg(e?.message || 'Could not RSVP. Please try again.')
        setStatus('error')
      }
    }
  }, [name, email, eventId, track, onRsvped])

  if (!visible) return null

  const forEvent = eventTitle ? ` to ${eventTitle}` : ''

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={close} />
        <View
          style={{
            backgroundColor: colors.panelBg,
            borderRadius: 16,
            padding: 28,
            width: 380,
            maxWidth: '100%',
            gap: 16,
          }}
        >
          {(status === 'form' || status === 'submitting' || status === 'error') && (
            <>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 22, fontFamily: 'Inclusive Sans', color: colors.text, textAlign: 'center' }}>
                  RSVP{forEvent}
                </Text>
                <Text style={{ fontSize: 15, fontFamily: 'Inclusive Sans', color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
                  Just your name and email. No account needed.
                </Text>
              </View>
              <View style={{ gap: 10 }}>
                <TextInput
                  value={name}
                  onChangeText={(v) => { setName(v); setErrorMsg('') }}
                  placeholder="Your name"
                  autoCapitalize="words"
                  placeholderTextColor={colors.textMuted}
                  style={inputStyle(colors)}
                />
                <TextInput
                  value={email}
                  onChangeText={(v) => { setEmail(v); setErrorMsg('') }}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={submit}
                  placeholderTextColor={colors.textMuted}
                  style={inputStyle(colors)}
                />
                {errorMsg ? (
                  <Text style={{ fontSize: 13, fontFamily: 'Inclusive Sans', color: '#B91C1C' }}>{errorMsg}</Text>
                ) : null}
                <PrimaryButton onPress={submit} disabled={status === 'submitting'}>
                  {status === 'submitting' ? 'RSVPing…' : 'RSVP'}
                </PrimaryButton>
              </View>
              <Pressable onPress={close} style={{ alignSelf: 'center', paddingTop: 2 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Inclusive Sans', color: colors.textMuted }}>Maybe later</Text>
              </Pressable>
            </>
          )}

          {status === 'success' && (
            <View style={{ gap: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 40 }}>🎉</Text>
              <Text style={{ fontSize: 22, fontFamily: 'Inclusive Sans', color: colors.text, textAlign: 'center' }}>
                You're going{forEvent}
              </Text>
              <Text style={{ fontSize: 14, fontFamily: 'Inclusive Sans', color: colors.textSecondary, textAlign: 'center', lineHeight: 21 }}>
                You're on the list — we'll send the details to your email. No account needed.
              </Text>
              <PrimaryButton onPress={close} style={{ alignSelf: 'stretch' }}>Done</PrimaryButton>
            </View>
          )}

          {status === 'already' && (
            <View style={{ gap: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontFamily: 'Inclusive Sans', color: colors.text, textAlign: 'center' }}>
                You're already on the list
              </Text>
              <Text style={{ fontSize: 14, fontFamily: 'Inclusive Sans', color: colors.textSecondary, textAlign: 'center', lineHeight: 21 }}>
                You already RSVPed{forEvent} with this email.
              </Text>
              <PrimaryButton onPress={close} style={{ alignSelf: 'stretch' }}>Done</PrimaryButton>
            </View>
          )}

          {status === 'requiresVerified' && (
            <View style={{ gap: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontFamily: 'Inclusive Sans', color: colors.text, textAlign: 'center' }}>
                This event needs an account
              </Text>
              <Text style={{ fontSize: 14, fontFamily: 'Inclusive Sans', color: colors.textSecondary, textAlign: 'center', lineHeight: 21 }}>
                Members join Janata by invite. Have one? Paste it to get in.
              </Text>
              <PrimaryButton
                onPress={() => { close(); router.push('/auth?invite=1') }}
                style={{ alignSelf: 'stretch' }}
              >
                Have an invite? Paste it
              </PrimaryButton>
              <Pressable onPress={close} style={{ paddingTop: 2 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Inclusive Sans', color: colors.textMuted }}>Maybe later</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

function inputStyle(colors: ReturnType<typeof useDetailColors>) {
  return {
    width: '100%' as const,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inclusive Sans',
    color: colors.text,
    backgroundColor: colors.cardBg,
  }
}
