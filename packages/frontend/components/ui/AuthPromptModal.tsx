import { useEffect } from 'react'
import { View, Text, Pressable, Modal, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useDetailColors } from '../../hooks/useDetailColors'
import PrimaryButton from './buttons/PrimaryButton'
import SecondaryButton from './buttons/SecondaryButton'

interface AuthPromptModalProps {
  visible: boolean
  onClose: () => void
  returnTo: string
  eventTitle?: string
}

export default function AuthPromptModal({ visible, onClose, returnTo, eventTitle }: AuthPromptModalProps) {
  const router = useRouter()
  const colors = useDetailColors()

  const encoded = encodeURIComponent(returnTo)

  const handleSignUp = () => {
    onClose()
    router.push(`/auth?mode=signup&returnTo=${encoded}&inviteCode=PUBLIC-EXPLORE`)
  }

  const handleLogIn = () => {
    onClose()
    router.push(`/auth?mode=login&returnTo=${encoded}`)
  }

  // Web: close on Escape key
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [visible, onClose])

  if (!visible) return null

  // Use a portal-style overlay on web for better z-index handling
  if (Platform.OS === 'web') {
    return (
      <View
        style={{
          position: 'fixed' as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}
      >
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
        />
        <View
          style={{
            backgroundColor: colors.panelBg,
            borderRadius: 16,
            padding: 28,
            width: 360,
            maxWidth: '90%',
            gap: 16,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
          }}
        >
          <Text style={{ fontSize: 20, fontFamily: 'Inclusive Sans', color: colors.text, textAlign: 'center' }}>
            Sign up to attend
          </Text>
          <Text style={{ fontSize: 15, fontFamily: 'Inclusive Sans', color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
            {eventTitle
              ? `Create a free account to register for ${eventTitle}`
              : 'Create a free account to register for events'}
          </Text>
          <View style={{ gap: 10, marginTop: 4 }}>
            <PrimaryButton onPress={handleSignUp}>
              Sign Up
            </PrimaryButton>
            <SecondaryButton onPress={handleLogIn}>
              Log In
            </SecondaryButton>
          </View>
          <Pressable onPress={onClose} style={{ alignSelf: 'center', paddingTop: 4 }}>
            <Text style={{ fontSize: 14, fontFamily: 'Inclusive Sans', color: colors.textMuted }}>
              Maybe later
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }

  // Native fallback using Modal
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
        />
        <View
          style={{
            backgroundColor: colors.panelBg,
            borderRadius: 16,
            padding: 28,
            width: 360,
            maxWidth: '90%',
            gap: 16,
          }}
        >
          <Text style={{ fontSize: 20, fontFamily: 'Inclusive Sans', color: colors.text, textAlign: 'center' }}>
            Sign up to attend
          </Text>
          <Text style={{ fontSize: 15, fontFamily: 'Inclusive Sans', color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
            {eventTitle
              ? `Create a free account to register for ${eventTitle}`
              : 'Create a free account to register for events'}
          </Text>
          <View style={{ gap: 10, marginTop: 4 }}>
            <PrimaryButton onPress={handleSignUp}>
              Sign Up
            </PrimaryButton>
            <SecondaryButton onPress={handleLogIn}>
              Log In
            </SecondaryButton>
          </View>
          <Pressable onPress={onClose} style={{ alignSelf: 'center', paddingTop: 4 }}>
            <Text style={{ fontSize: 14, fontFamily: 'Inclusive Sans', color: colors.textMuted }}>
              Maybe later
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
