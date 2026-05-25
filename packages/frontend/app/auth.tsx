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
import { usePostHog } from 'posthog-react-native'
import { AuthInput, Logo, PrimaryButton } from '../components/ui'
import { useUser, useTheme } from '../components/contexts'
import { validateEmail, validatePassword } from '../utils'
import { PasswordStrength } from '../components'
import DevPanel from '../components/DevPanel'
import { API_BASE_URL } from '../src/config/api'
// __DEV__ is a React Native/Expo global — always false in production builds
const isDev = typeof __DEV__ !== 'undefined' && __DEV__

type AuthStep = 'initial' | 'login' | 'invite-code' | 'signup'

export default function AuthScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const { checkUserExists, login, signup, loading } = useUser()
  const posthog = usePostHog()

  // Read params for deep-link support (e.g. from AuthPromptModal)
  const params = useLocalSearchParams<{ mode?: string; returnTo?: string; inviteCode?: string }>()
  const urlInviteCode = params.inviteCode

  const [authStep, setAuthStep] = useState<AuthStep>(
    params.mode === 'login' ? 'login'
      : params.mode === 'signup' && urlInviteCode ? 'signup'
      : 'initial'
  )
  const [username, setUsername] = useState('')
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
      posthog?.capture('auth_email_submitted')
      const exists = await checkUserExists(username)
      if (exists) {
        posthog?.capture('auth_user_exists')
        setAuthStep('login')
      } else {
        posthog?.capture('auth_user_new')
        setAuthStep('invite-code')
      }
    } catch (e: any) {
      posthog?.capture('auth_check_failed')
      setErrors({ form: e.message || 'Failed to connect to server.' })
    }
  }, [username, checkUserExists, posthog])

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
        router.replace('/(tabs)')
      } else {
        setErrors({ form: result.message || 'Username or password is incorrect.' })
      }
    } catch (e: any) {
      setErrors({ form: 'Failed to connect to server. Please try again.' })
    }
  }, [username, password, login, router])

  const handleInviteCodeContinue = useCallback(async () => {
    setErrors({})
    if (!inviteCode) {
      setErrors({ inviteCode: 'Please enter your invite code.' })
      return
    }
    try {
      posthog?.capture('auth_invite_code_submitted')
      // Validate the invite code with the backend
      const response = await fetch(`${API_BASE_URL}/auth/validate-invite-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode }),
      })
      const data = await response.json()
      if (data.valid) {
        posthog?.capture('auth_invite_code_valid')
        setAuthStep('signup')
      } else {
        posthog?.capture('auth_invite_code_invalid')
        setErrors({ form: data.error || 'Invalid or inactive invite code.' })
      }
    } catch (e: any) {
      posthog?.capture('auth_invite_code_check_failed')
      setErrors({ form: 'Failed to validate invite code. Please try again.' })
    }
  }, [inviteCode, posthog])

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
        router.replace(params.returnTo ? `/onboarding?returnTo=${encodeURIComponent(params.returnTo)}` : '/onboarding')
      } else {
        setErrors({ form: result.message || 'Failed to sign up. Please try again.' })
      }
    } catch (e: any) {
      setErrors({ form: 'Failed to connect to server. Please try again.' })
    }
  }, [username, password, confirmPassword, inviteCode, signup, router])

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
    setAuthStep('initial')
    setPassword('')
    setConfirmPassword('')
    setInviteCode('')
    setErrors({})
  }, [])

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
            <Pressable onPress={() => router.push('/landing')}>
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
                  onPress={() => router.push('/auth/forgot')}
                >
                  <Text className="text-primary font-sans font-medium">Forgot password?</Text>
                </Pressable>
              )}
            </View>

            {/* Dev Mode Button -- dev only */}
            {isDev && (
              <View className="mt-8 pt-6 border-t border-borderColor dark:border-borderColor-dark">
                <Pressable
                  onPress={() => setShowDevPanel(true)}
                  className="flex-row items-center justify-center bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl active:opacity-70"
                >
                  <Code size={18} className={isDark ? 'text-white' : 'text-black'} />
                  <Text className="ml-2 text-content dark:text-content-dark font-sans font-semibold">
                    Developer Mode
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Show DevPanel when Developer Mode is clicked */}
            {isDev && showDevPanel && (
              <DevPanel visible={showDevPanel} onClose={() => setShowDevPanel(false)} />
            )}

            {/* Footer Text */}
            <Text className="text-content dark:text-content-dark opacity-50 text-sm font-sans mt-8 text-center px-4">
              By continuing, you agree to our{' '}
              <Text
                className="text-primary font-sans"
                onPress={() => router.push('/terms')}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text
                className="text-primary font-sans"
                onPress={() => router.push('/privacy')}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
