import { useCallback, useEffect, useState } from 'react'
import { View, Text, Pressable, Modal, Platform, Image, TextInput } from 'react-native'
import { useRouter } from 'expo-router'
import { useUser } from '../contexts'
import { useAnalytics } from '../../utils/analytics'
import { validateEmail, validatePassword } from '../../utils'
import { extractInviteCode } from '../../utils/validation'
import PasswordStrength from '../auth/PasswordStrength'
import { useDetailColors } from '../../hooks/useDetailColors'
import PrimaryButton from './buttons/PrimaryButton'
import SecondaryButton from './buttons/SecondaryButton'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const swamiChinmayanandaJpg = require('../../assets/images/landing/Swami Chinmayananda.jpg')
const swamiChinmayanandaAlt = require('../../assets/images/landing/Swami Chinmayananda (1).jpg')
const swamiChinmayanandaOption2 = require('../../assets/images/landing/Swami Chinmayananda Option 2.jpeg')

const AUTH_CAROUSEL_IMAGES = [
  swamiChinmayanandaJpg,
  swamiChinmayanandaAlt,
  swamiChinmayanandaOption2,
]

type AuthStep = 'initial' | 'login' | 'signup'

interface AuthPromptModalProps {
  visible: boolean
  onClose: () => void
  returnTo: string
  eventTitle?: string
  title?: string
  subtitle?: string
  bullets?: string[]
}

export default function AuthPromptModal({
  visible,
  onClose,
  returnTo,
  eventTitle,
  title,
  subtitle,
  bullets,
}: AuthPromptModalProps) {
  const router = useRouter()
  const { login, signup, loading } = useUser()
  const { track } = useAnalytics()
  const colors = useDetailColors()
  const [viewportWidth, setViewportWidth] = useState(() =>
    Platform.OS === 'web' && typeof window !== 'undefined' ? window.innerWidth : 1024
  )
  const [authStep, setAuthStep] = useState<AuthStep>('initial')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const trimmedEmail = email.trim()

  const resetAuthState = useCallback(() => {
    setAuthStep('initial')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setErrors({})
  }, [])

  const closePrompt = useCallback(() => {
    resetAuthState()
    onClose()
  }, [onClose, resetAuthState])

  const validateEmailStep = useCallback(() => {
    setErrors({})
    if (!trimmedEmail) {
      setErrors({ email: 'Please enter your email.' })
      return false
    }
    if (!validateEmail(trimmedEmail)) {
      setErrors({ email: 'Enter a valid email address.' })
      return false
    }
    return true
  }, [trimmedEmail])

  const handleStartSignup = useCallback(() => {
    if (!validateEmailStep()) return
    track('auth_signup_started', { source: 'auth_modal' })
    setAuthStep('signup')
  }, [track, validateEmailStep])

  const handleStartLogin = useCallback(() => {
    if (!validateEmailStep()) return
    track('auth_login_started', { source: 'auth_modal' })
    setAuthStep('login')
  }, [track, validateEmailStep])

  const handleBack = useCallback(() => {
    track('auth_back_pressed', { source: 'auth_modal', from_step: authStep })
    setAuthStep('initial')
    setPassword('')
    setConfirmPassword('')
    setErrors({})
  }, [authStep, track])

  const handleLogin = useCallback(async () => {
    setErrors({})
    if (!password) {
      setErrors({ password: 'Please enter your password.' })
      return
    }

    try {
      const result = await login(trimmedEmail, password)
      if (result.success) {
        track('login_success', { source: 'auth_modal' })
        closePrompt()
        router.replace(returnTo ? (returnTo as never) : '/')
      } else {
        track('login_failed', { source: 'auth_modal', reason: result.message })
        setErrors({ form: result.message || 'Username or password is incorrect.' })
      }
    } catch {
      track('login_failed', { source: 'auth_modal', reason: 'network_error' })
      setErrors({ form: 'Failed to connect to server. Please try again.' })
    }
  }, [closePrompt, login, password, returnTo, router, track, trimmedEmail])

  const handleSignup = useCallback(async () => {
    setErrors({})
    if (!password) {
      setErrors({ password: 'Please enter a password.' })
      return
    }
    if (!validatePassword(password).isValid) {
      setErrors({ password: 'Password does not meet complexity requirements.' })
      return
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match.' })
      return
    }

    try {
      const result = await signup(trimmedEmail, password, extractInviteCode('PUBLIC-EXPLORE'))
      if (result.success) {
        track('signup_success', { source: 'auth_modal' })
        closePrompt()
        router.replace(returnTo ? (`/onboarding?returnTo=${encodeURIComponent(returnTo)}` as never) : '/onboarding')
      } else {
        track('signup_failed', { source: 'auth_modal', reason: result.message })
        setErrors({ form: result.message || 'Failed to sign up. Please try again.' })
      }
    } catch {
      track('signup_failed', { source: 'auth_modal', reason: 'network_error' })
      setErrors({ form: 'Failed to connect to server. Please try again.' })
    }
  }, [closePrompt, confirmPassword, password, returnTo, router, signup, track, trimmedEmail])

  // Web: close on Escape key
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePrompt()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [visible, closePrompt])

  useEffect(() => {
    if (!visible) resetAuthState()
  }, [resetAuthState, visible])

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return

    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (!visible) return null

  // Use a portal-style overlay on web for better z-index handling
  if (Platform.OS === 'web') {
    const isDesktop = viewportWidth >= 820
    const modalWidth = isDesktop ? 860 : 380
    const promptTitle = title ?? 'Sign up to attend.'
    const promptCopy = subtitle ?? (eventTitle
      ? `Create a free account to register for ${eventTitle}`
      : 'Create a free account to register for events')
    const promptBullets = bullets ?? [
      'RSVP in a tap and keep event details handy',
      'See updates from your center and community',
      'Discover more satsangs, camps, and classes nearby',
    ]
    const stepTitle = authStep === 'login'
      ? 'Welcome back.'
      : authStep === 'signup'
        ? 'Create your account.'
        : promptTitle
    const stepCopy = authStep === 'login'
      ? 'Enter your password to continue.'
      : authStep === 'signup'
        ? 'Set a password to continue to onboarding.'
        : promptCopy

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
          padding: isDesktop ? 24 : 16,
        }}
      >
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={closePrompt}
        />
        <View
          style={{
            backgroundColor: colors.panelBg,
            borderRadius: isDesktop ? 22 : 18,
            width: modalWidth,
            maxWidth: '100%',
            minHeight: isDesktop ? 520 : undefined,
            overflow: 'hidden',
            flexDirection: isDesktop ? 'row' : 'column',
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 14 },
          }}
        >
          {isDesktop && (
            <View style={{ width: '48%', position: 'relative', backgroundColor: '#E7D5CC' }}>
              <Image
                source={AUTH_CAROUSEL_IMAGES[0]}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
                resizeMode="cover"
              />
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: '58%',
                  backgroundImage: 'linear-gradient(to top, rgba(28,25,23,0.74), rgba(28,25,23,0.38), rgba(28,25,23,0))' as any,
                }}
              />
              <View style={{ position: 'absolute', left: 28, right: 28, bottom: 28, gap: 8 }}>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 24, lineHeight: 30, color: '#FFFFFF' }}>
                  Janata
                </Text>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, lineHeight: 21, color: '#F5F5F4' }}>
                  Community events, satsangs, and local gatherings in one place.
                </Text>
              </View>
            </View>
          )}

          <Pressable
            onPress={closePrompt}
            accessibilityRole="button"
            accessibilityLabel="Close sign up prompt"
            style={({ pressed }) => ({
              position: 'absolute',
              top: 14,
              right: 14,
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? 'rgba(28,25,23,0.10)' : isDesktop ? 'rgba(255,255,255,0.86)' : 'transparent',
              zIndex: 2,
            })}
          >
            <Text style={{ fontSize: 24, lineHeight: 26, fontFamily: 'Inclusive Sans', color: '#1C1917' }}>
              {'\u00d7'}
            </Text>
          </Pressable>

          <View
            style={{
              flex: 1,
              backgroundColor: '#FAFAF7',
              paddingHorizontal: isDesktop ? 48 : 28,
              paddingTop: isDesktop ? 64 : 58,
              paddingBottom: isDesktop ? 44 : 28,
              justifyContent: 'center',
            }}
          >
            <View style={{ gap: 20 }}>
              <View style={{ gap: 10 }}>
                <Text
                  style={{
                    fontSize: isDesktop ? 36 : 24,
                    lineHeight: isDesktop ? 42 : 30,
                    fontFamily: 'Inclusive Sans',
                    fontWeight: '400',
                    color: '#1C1917',
                  }}
                >
                  {stepTitle}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: 'Inclusive Sans',
                    color: '#78716C',
                    lineHeight: 24,
                  }}
                >
                  {stepCopy}
                </Text>
              </View>

              {isDesktop && authStep === 'initial' && (
                <View style={{ gap: 9 }}>
                  {promptBullets.map((line) => (
                    <View key={line} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                      <Text style={{ color: '#E8862A', fontSize: 15, lineHeight: 22 }}>{'\u2713'}</Text>
                      <Text style={{ flex: 1, fontFamily: 'Inclusive Sans', fontSize: 14.5, lineHeight: 22, color: '#57534E' }}>
                        {line}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ gap: 12, marginTop: 4 }}>
                {authStep !== 'initial' && (
                  <Pressable onPress={handleBack} style={{ alignSelf: 'flex-start', paddingVertical: 2 }}>
                    <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: '#E8862A' }}>
                      Back
                    </Text>
                  </Pressable>
                )}
                <TextInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value)
                    setErrors((prev) => ({ ...prev, email: '', form: '' }))
                  }}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={authStep === 'initial'}
                  placeholderTextColor="#9CA3AF"
                  style={{
                    width: '100%',
                    height: 48,
                    borderWidth: 1,
                    borderColor: '#D6D3D1',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    fontSize: 16,
                    fontFamily: 'Inclusive Sans',
                    color: authStep === 'initial' ? '#1C1917' : '#57534E',
                    backgroundColor: '#FFFFFF',
                  }}
                />
                {errors.email ? <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: '#B91C1C' }}>{errors.email}</Text> : null}

                {authStep !== 'initial' && (
                  <>
                    <TextInput
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value)
                        setErrors((prev) => ({ ...prev, password: '', form: '' }))
                      }}
                      placeholder="Password"
                      secureTextEntry
                      placeholderTextColor="#9CA3AF"
                      style={{
                        width: '100%',
                        height: 48,
                        borderWidth: 1,
                        borderColor: '#D6D3D1',
                        borderRadius: 8,
                        paddingHorizontal: 16,
                        fontSize: 16,
                        fontFamily: 'Inclusive Sans',
                        color: '#1C1917',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                    {errors.password ? <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: '#B91C1C' }}>{errors.password}</Text> : null}
                  </>
                )}

                {authStep === 'signup' && (
                  <>
                    <PasswordStrength password={password} show={password.length > 0} />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={(value) => {
                        setConfirmPassword(value)
                        setErrors((prev) => ({ ...prev, confirmPassword: '', form: '' }))
                      }}
                      placeholder="Confirm password"
                      secureTextEntry
                      placeholderTextColor="#9CA3AF"
                      style={{
                        width: '100%',
                        height: 48,
                        borderWidth: 1,
                        borderColor: '#D6D3D1',
                        borderRadius: 8,
                        paddingHorizontal: 16,
                        fontSize: 16,
                        fontFamily: 'Inclusive Sans',
                        color: '#1C1917',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                    {errors.confirmPassword ? <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: '#B91C1C' }}>{errors.confirmPassword}</Text> : null}
                  </>
                )}

                {errors.form ? <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: '#B91C1C', lineHeight: 18 }}>{errors.form}</Text> : null}

                {authStep === 'initial' ? (
                  <>
                    <PrimaryButton onPress={handleStartSignup} disabled={!trimmedEmail || loading} style={{ borderRadius: 8 }}>
                      Sign Up
                    </PrimaryButton>
                    <SecondaryButton
                      onPress={handleStartLogin}
                      disabled={!trimmedEmail || loading}
                      style={{ borderRadius: 8, backgroundColor: '#FFFFFF' }}
                    >
                      Log In
                    </SecondaryButton>
                  </>
                ) : authStep === 'login' ? (
                  <PrimaryButton onPress={handleLogin} disabled={!password || loading} style={{ borderRadius: 8 }}>
                    Log In
                  </PrimaryButton>
                ) : (
                  <PrimaryButton onPress={handleSignup} disabled={!password || !confirmPassword || loading} style={{ borderRadius: 8 }}>
                    Create Account
                  </PrimaryButton>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    )
  }

  // Native fallback using Modal
  const nativeTitle = authStep === 'login'
    ? 'Welcome back'
    : authStep === 'signup'
      ? 'Create your account'
      : title ?? 'Sign up to attend'
  const nativeCopy = authStep === 'login'
    ? 'Enter your password to continue.'
    : authStep === 'signup'
      ? 'Set a password to continue to onboarding.'
      : subtitle ?? (eventTitle
        ? `Create a free account to register for ${eventTitle}`
        : 'Create a free account to register for events')

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closePrompt}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={closePrompt}
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
            {nativeTitle}
          </Text>
          <Text style={{ fontSize: 15, fontFamily: 'Inclusive Sans', color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
            {nativeCopy}
          </Text>
          <View style={{ gap: 10, marginTop: 4 }}>
            {authStep !== 'initial' && (
              <Pressable onPress={handleBack} style={{ alignSelf: 'flex-start', paddingVertical: 2 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Inclusive Sans', color: '#E8862A' }}>
                  Back
                </Text>
              </Pressable>
            )}
            <TextInput
              value={email}
              onChangeText={(value) => {
                setEmail(value)
                setErrors((prev) => ({ ...prev, email: '', form: '' }))
              }}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={authStep === 'initial'}
              placeholderTextColor={colors.textMuted}
              style={{
                width: '100%',
                height: 48,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 16,
                fontSize: 16,
                fontFamily: 'Inclusive Sans',
                color: authStep === 'initial' ? colors.text : colors.textSecondary,
                backgroundColor: colors.cardBg,
              }}
            />
            {errors.email ? <Text style={{ fontSize: 13, fontFamily: 'Inclusive Sans', color: '#B91C1C' }}>{errors.email}</Text> : null}

            {authStep !== 'initial' && (
              <>
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value)
                    setErrors((prev) => ({ ...prev, password: '', form: '' }))
                  }}
                  placeholder="Password"
                  secureTextEntry
                  placeholderTextColor={colors.textMuted}
                  style={{
                    width: '100%',
                    height: 48,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    fontSize: 16,
                    fontFamily: 'Inclusive Sans',
                    color: colors.text,
                    backgroundColor: colors.cardBg,
                  }}
                />
                {errors.password ? <Text style={{ fontSize: 13, fontFamily: 'Inclusive Sans', color: '#B91C1C' }}>{errors.password}</Text> : null}
              </>
            )}

            {authStep === 'signup' && (
              <>
                <PasswordStrength password={password} show={password.length > 0} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value)
                    setErrors((prev) => ({ ...prev, confirmPassword: '', form: '' }))
                  }}
                  placeholder="Confirm password"
                  secureTextEntry
                  placeholderTextColor={colors.textMuted}
                  style={{
                    width: '100%',
                    height: 48,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    fontSize: 16,
                    fontFamily: 'Inclusive Sans',
                    color: colors.text,
                    backgroundColor: colors.cardBg,
                  }}
                />
                {errors.confirmPassword ? <Text style={{ fontSize: 13, fontFamily: 'Inclusive Sans', color: '#B91C1C' }}>{errors.confirmPassword}</Text> : null}
              </>
            )}

            {errors.form ? <Text style={{ fontSize: 13, fontFamily: 'Inclusive Sans', color: '#B91C1C', lineHeight: 18 }}>{errors.form}</Text> : null}

            {authStep === 'initial' ? (
              <>
                <PrimaryButton onPress={handleStartSignup} disabled={!trimmedEmail || loading}>
                  Sign Up
                </PrimaryButton>
                <SecondaryButton onPress={handleStartLogin} disabled={!trimmedEmail || loading}>
                  Log In
                </SecondaryButton>
              </>
            ) : authStep === 'login' ? (
              <PrimaryButton onPress={handleLogin} disabled={!password || loading}>
                Log In
              </PrimaryButton>
            ) : (
              <PrimaryButton onPress={handleSignup} disabled={!password || !confirmPassword || loading}>
                Create Account
              </PrimaryButton>
            )}
          </View>
          <Pressable onPress={closePrompt} style={{ alignSelf: 'center', paddingTop: 4 }}>
            <Text style={{ fontSize: 14, fontFamily: 'Inclusive Sans', color: colors.textMuted }}>
              Maybe later
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
