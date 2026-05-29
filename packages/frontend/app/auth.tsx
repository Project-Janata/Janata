import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Pressable,
  TouchableOpacity,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Code, ArrowLeft } from 'lucide-react-native'
import { useAnalytics } from '../utils/analytics'
import { AuthInput, Logo, PrimaryButton } from '../components/ui'
import { useUser, useTheme } from '../components/contexts'
import { validateEmail, validatePassword } from '../utils'
import { PasswordStrength } from '../components'
import DevPanel from '../components/DevPanel'
import { API_BASE_URL } from '../src/config/api'
// __DEV__ is a React Native/Expo global — always false in production builds.
// EXPO_PUBLIC_SHOW_DEV_TOOLS=1 also enables the dev/demo tools (set on the
// isolated v2 preview build), so role-switching works for demos there too.
const isDev =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  process.env.EXPO_PUBLIC_SHOW_DEV_TOOLS === '1'

type AuthStep = 'initial' | 'login' | 'invite-code' | 'signup'

export default function AuthScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const { checkUserExists, login, signup, loading } = useUser()
  const { track } = useAnalytics()

  // Read params for deep-link support (e.g. from AuthPromptModal, or
  // /auth/forgot's "Back to sign in" button).
  const params = useLocalSearchParams<{ mode?: string; returnTo?: string; inviteCode?: string; email?: string }>()
  const urlInviteCode = params.inviteCode
  const urlEmail = typeof params.email === 'string' ? params.email : ''

  // mode=login is meaningful only when we also have an email — otherwise we'd
  // render a login screen with a disabled empty email field that the user
  // can't edit, which is a dead-end. Fall back to the initial step instead.
  const [authStep, setAuthStep] = useState<AuthStep>(
    params.mode === 'login' && urlEmail ? 'login'
      : params.mode === 'signup' && urlInviteCode ? 'signup'
      : 'initial'
  )
  const [username, setUsername] = useState(urlEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteCode, setInviteCode] = useState(urlInviteCode || '')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const [showDevPanel, setShowDevPanel] = useState(false)

  const handleContinue = useCallback(async () => {
    setErrors({})
    if (!username) {
      setErrors({ username: 'Please enter a username.' })
      return
    }
    if (!validateEmail(username)) {
      setErrors({ username: 'You must enter a valid email address.' })
      return
    }
    try {
      track('auth_email_submitted', { source: 'auth' })
      const exists = await checkUserExists(username)
      if (exists) {
        track('auth_user_exists', { source: 'auth' })
        setAuthStep('login')
      } else {
        track('auth_user_new', { source: 'auth' })
        setAuthStep('invite-code')
      }
    } catch (e: any) {
      track('auth_check_failed', { source: 'auth' })
      setErrors({ form: e.message || 'Failed to connect to server.' })
    }
  }, [username, checkUserExists, track])

  const handleLogin = useCallback(async () => {
    setErrors({})
    if (!username) {
      setErrors({ username: 'Please enter a username.' })
      return
    }

    if (!password) {
      setErrors({ password: 'Please enter your password.' })
      return
    }
    try {
      const result = await login(username, password)
      if (result.success) {
        track('login_success', { source: 'auth' })
        router.replace('/(tabs)')
      } else {
        track('login_failed', { source: 'auth', reason: result.message })
        setErrors({ form: result.message || 'Username or password is incorrect.' })
      }
    } catch (e: any) {
      track('login_failed', { source: 'auth', reason: 'network_error' })
      setErrors({ form: 'Failed to connect to server. Please try again.' })
    }
  }, [username, password, login, router, track])

  const handleInviteCodeContinue = useCallback(async () => {
    setErrors({})
    if (!inviteCode) {
      setErrors({ inviteCode: 'Please enter your invite code.' })
      return
    }
    try {
      track('auth_invite_code_submitted', { source: 'auth' })
      // Validate the invite code with the backend
      const response = await fetch(`${API_BASE_URL}/auth/validate-invite-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode }),
      })
      const data = await response.json()
      if (data.valid) {
        track('auth_invite_code_valid', { source: 'auth' })
        setAuthStep('signup')
      } else {
        track('auth_invite_code_invalid', { source: 'auth' })
        setErrors({ form: data.error || 'Invalid or inactive invite code.' })
      }
    } catch (e: any) {
      track('auth_invite_code_check_failed', { source: 'auth' })
      setErrors({ form: 'Failed to validate invite code. Please try again.' })
    }
  }, [inviteCode, track])

  const handleSignup = useCallback(async () => {
    setErrors({})
    if (!username) {
      setErrors({ username: 'Please enter a username.' })
      return
    }
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
      const result = await signup(username, password, inviteCode)
      if (result.success) {
        track('signup_success', { source: 'auth' })
        router.replace(params.returnTo ? `/onboarding?returnTo=${encodeURIComponent(params.returnTo)}` : '/onboarding')
      } else {
        track('signup_failed', { source: 'auth', reason: result.message })
        setErrors({ form: result.message || 'Failed to sign up. Please try again.' })
      }
    } catch (e: any) {
      track('signup_failed', { source: 'auth', reason: 'network_error' })
      setErrors({ form: 'Failed to connect to server. Please try again.' })
    }
  }, [username, password, confirmPassword, inviteCode, signup, router, track])

  const handleSubmit = useCallback(
    (e?: any) => {
      if (Platform.OS === 'web' && e) {
        e.preventDefault?.()
        e.stopPropagation?.()
      }

      if (authStep === 'login') {
        handleLogin()
      } else if (authStep === 'invite-code') {
        handleInviteCodeContinue()
      } else if (authStep === 'signup') {
        handleSignup()
      } else {
        handleContinue()
      }
    },
    [authStep, handleLogin, handleInviteCodeContinue, handleSignup, handleContinue]
  )

  const handleBack = useCallback(() => {
    track('auth_back_pressed', { source: 'auth', from_step: authStep })
    setAuthStep('initial')
    setPassword('')
    setConfirmPassword('')
    setInviteCode('')
    setErrors({})
  }, [authStep, track])

  const isButtonDisabled =
    loading ||
    (authStep === 'initial' && !username) ||
    (authStep === 'invite-code' && !inviteCode) ||
    (authStep !== 'initial' && authStep !== 'invite-code' && !password) ||
    (authStep === 'signup' && !confirmPassword)

  // Collect error messages to display
  const errorMessages = Object.values(errors).filter(Boolean)

  // Memoize input handlers to prevent recreation
  const handleUsernameChange = useCallback((text: string) => {
    setUsername(text)
    setErrors((prev) => ({ ...prev, username: '' }))
  }, [])

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text)
    setErrors((prev) => ({ ...prev, password: '' }))
  }, [])

  const handleConfirmPasswordChange = useCallback((text: string) => {
    setConfirmPassword(text)
    setErrors((prev) => ({ ...prev, confirmPassword: '' }))
  }, [])

  const handleInviteCodeChange = useCallback((text: string) => {
    setInviteCode(text)
    setErrors((prev) => ({ ...prev, inviteCode: '' }))
  }, [])

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="flex-1 bg-[#FAFAF7] dark:bg-background-dark"
        keyboardShouldPersistTaps="handled"
      >
        {/* Main content */}
        <View
          className="flex-1 justify-center items-center w-full px-6"
          style={{
            paddingTop: 60,
            paddingBottom: 48,
          }}
        >
          {/* Container */}
          <View
            className="w-full"
            style={{ maxWidth: 400 }}
          >
            {/* Back Button */}
            {authStep !== 'initial' && (
              <TouchableOpacity
                onPress={handleBack}
                activeOpacity={0.7}
                className="flex-row items-center gap-2 mb-6 rounded-xl px-3 py-2 self-start"
                style={{ alignSelf: 'flex-start' }}
              >
                <ArrowLeft
                  size={20}
                  className={isDark ? 'text-white' : 'text-content'}
                />
                <Text className="font-sans font-medium text-content dark:text-content-dark">
                  Back
                </Text>
              </TouchableOpacity>
            )}

            {/* Janata Wordmark */}
            <Pressable onPress={() => { track('auth_logo_pressed', { source: 'auth' }); router.push('/landing') }}>
              <Logo size={32} style={{ marginBottom: 32 }} />
            </Pressable>

            {/* Heading & Subtitle */}
            <View className="mb-6">
              <Text
                style={{ fontFamily: '"Inclusive Sans"', fontSize: 36, fontWeight: '400' }}
                className="text-content dark:text-content-dark"
              >
                {authStep === 'login'
                  ? 'Welcome back.'
                  : authStep === 'invite-code'
                  ? 'Enter invite code.'
                  : authStep === 'signup'
                  ? 'Join the community.'
                  : 'Welcome.'}
              </Text>

              <Text
                className="text-base font-sans mt-2"
                style={{ color: '#78716C' }}
              >
                {authStep === 'login'
                  ? 'Enter your password to continue'
                  : authStep === 'invite-code'
                  ? 'Enter your beta invite code to proceed'
                  : authStep === 'signup'
                  ? 'Create your account to get started'
                  : 'Enter your email to get started'}
              </Text>
            </View>

            {/* Form */}
            {errorMessages.length > 0 && (
              <View className="w-full font-sans bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 mb-4">
                {errorMessages.map((msg, idx) => (
                  <Text key={idx} className="text-red-500 text-sm font-sans">
                    {msg}
                  </Text>
                ))}
              </View>
            )}

            <View className="gap-4">
              <View>
                <AuthInput
                  placeholder="Email"
                  onChangeText={handleUsernameChange}
                  value={username}
                  secureTextEntry={false}
                  editable={authStep === 'initial'}
                />
              </View>
              {authStep === 'login' && (
                <View>
                  <AuthInput
                    placeholder="Password"
                    onChangeText={handlePasswordChange}
                    value={password}
                    secureTextEntry
                    autoComplete="password"
                    style={{}}
                  />
                </View>
              )}

              {authStep === 'invite-code' && (
                <View>
                  <AuthInput
                    placeholder="Invite Code"
                    onChangeText={handleInviteCodeChange}
                    value={inviteCode}
                    secureTextEntry={false}
                    autoComplete="off"
                    style={{}}
                  />
                </View>
              )}

              {authStep === 'signup' && (
                <>
                  <View>
                    <PasswordStrength password={password} show={password.length > 0} />
                    <AuthInput
                      placeholder="Password"
                      onChangeText={handlePasswordChange}
                      value={password}
                      secureTextEntry
                      autoComplete="password-new"
                      style={{}}
                    />
                  </View>
                  <View>
                    <AuthInput
                      placeholder="Confirm password"
                      onChangeText={handleConfirmPasswordChange}
                      value={confirmPassword}
                      secureTextEntry
                      autoComplete="password-new"
                      style={{}}
                    />
                  </View>
                </>
              )}

              {/* Submit Button */}
              <PrimaryButton
                onPress={handleSubmit}
                disabled={isButtonDisabled}
                loading={loading}
                style={{ marginTop: 8 }}
              >
               {authStep === 'login'
                   ? 'Log In'
                   : authStep === 'invite-code'
                   ? 'Verify Code'
                   : authStep === 'signup'
                   ? 'Sign Up'
                  : 'Continue'}
              </PrimaryButton>

              {/* Forgot Password (only on login) */}
              {authStep === 'login' && (
                <Pressable
                  className="items-center mt-2"
                  onPress={() => { track('auth_forgot_password_pressed', { source: 'auth' }); router.push('/auth/forgot') }}
                >
                  <Text className="text-primary font-sans font-medium">Forgot password?</Text>
                </Pressable>
              )}
            </View>

            {/* Footer Text */}
            <Text className="text-content dark:text-content-dark opacity-50 text-sm font-sans mt-8 text-center px-4">
              By continuing, you agree to our{' '}
              <Text
                className="text-primary font-sans"
                onPress={() => { track('terms_viewed', { source: 'auth' }); router.push('/terms') }}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text
                className="text-primary font-sans"
                onPress={() => { track('privacy_policy_viewed', { source: 'auth' }); router.push('/privacy') }}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
      {/* Discreet dev/demo tools — bottom-left circle, dev/preview only */}
      {isDev && (
        <Pressable
          onPress={() => setShowDevPanel(true)}
          accessibilityLabel="Developer tools"
          className="absolute left-5 bottom-10 w-11 h-11 rounded-full items-center justify-center bg-stone-200/90 dark:bg-neutral-800/90 active:opacity-70"
          style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}
        >
          <Code size={18} className={isDark ? 'text-white' : 'text-black'} />
        </Pressable>
      )}
      {isDev && showDevPanel && (
        <DevPanel visible={showDevPanel} onClose={() => setShowDevPanel(false)} />
      )}
    </KeyboardAvoidingView>
  )
}
