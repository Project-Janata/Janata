import React, { useState } from 'react'
import {
  View,
  Text,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Pressable,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Code, ArrowLeft } from 'lucide-react-native'
import { useAnalytics } from '../utils/analytics'
import { AuthInput, Logo, PrimaryButton } from '../components/ui'
import { useTheme } from '../components/contexts'
import { PasswordStrength } from '../components'
import DevPanel from '../components/DevPanel'
import { useAuthFlow } from '../components/auth/useAuthFlow'

// __DEV__ is a React Native/Expo global — always false in production builds.
// EXPO_PUBLIC_SHOW_DEV_TOOLS=1 also enables the dev/demo tools (set on the
// isolated v2 preview build), so role-switching works for demos there too.
const isDev =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  process.env.EXPO_PUBLIC_SHOW_DEV_TOOLS === '1'

export default function AuthScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { isDark } = useTheme()
  const { track } = useAnalytics()

  // All auth state + handlers live in the shared hook (see auth.web.tsx — same
  // logic, different presentation). This file is RN markup only.
  const {
    authStep,
    username,
    password,
    confirmPassword,
    errorMessages,
    loading,
    inviterName,
    hasInvite,
    emailEditable,
    isButtonDisabled,
    heading,
    subtitle,
    changeUsername,
    changePassword,
    changeConfirm,
    handleSubmit,
    handleBack,
  } = useAuthFlow()

  const [showDevPanel, setShowDevPanel] = useState(false)

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
        {/* Discover link, top-right, initial step only. Lets a logged-out
            user browse the app before signing up (mirrors the web version). */}
        {authStep === 'initial' && (
          <Pressable
            onPress={() => { track('auth_discover_pressed', { source: 'auth' }); router.push('/(tabs)') }}
            className="absolute right-5"
            style={{ top: insets.top + 12, paddingHorizontal: 4, paddingVertical: 8 }}
          >
            <Text className="font-sans" style={{ fontSize: 14.5, fontWeight: '500', color: '#E8862A' }}>
              Discover →
            </Text>
          </Pressable>
        )}

        {/* Main content */}
        <View
          className="flex-1 justify-center items-center w-full px-6"
          style={{ paddingTop: 60, paddingBottom: 48 }}
        >
          {/* Container */}
          <View className="w-full" style={{ maxWidth: 400 }}>
            {/* Back Button */}
            {authStep !== 'initial' && (
              <TouchableOpacity
                onPress={handleBack}
                activeOpacity={0.7}
                className="flex-row items-center gap-2 mb-6 rounded-xl px-3 py-2 self-start"
                style={{ alignSelf: 'flex-start' }}
              >
                <ArrowLeft size={20} className={isDark ? 'text-white' : 'text-content'} />
                <Text className="font-sans font-medium text-content dark:text-content-dark">Back</Text>
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
                {heading}
              </Text>

              {/* What Janata is — first step only, so a new member knows what
                  they're signing into before entering an email. */}
              {authStep === 'initial' && !hasInvite && (
                <View style={{ marginTop: 12, gap: 9 }}>
                  {[
                    'Discover satsangs, camps, and classes near you',
                    'RSVP in a tap and see who else is going',
                    'Send messages to members in centers and your events.',
                  ].map((line) => (
                    <View key={line} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                      <Text style={{ color: '#E8862A', fontSize: 14, lineHeight: 22 }}>✓</Text>
                      <Text className="font-sans" style={{ flex: 1, fontSize: 14.5, lineHeight: 22, color: '#57534E' }}>{line}</Text>
                    </View>
                  ))}
                </View>
              )}

              <Text className="text-base font-sans mt-2" style={{ color: '#78716C' }}>
                {subtitle}
              </Text>
            </View>

            {/* Applied-invite bar (#403): the vouch carries into account
                creation, and is "held" when an email collision flips to login. */}
            {hasInvite && (authStep === 'signup' || authStep === 'login') && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: 'rgba(232,134,42,0.1)',
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  marginBottom: 16,
                }}
              >
                <Text style={{ fontSize: 15 }}>🪔</Text>
                <Text className="font-sans" style={{ flex: 1, fontSize: 14, lineHeight: 20, color: '#B05A12' }}>
                  <Text style={{ fontWeight: '700', color: '#E8862A' }}>
                    {inviterName ? `${inviterName}'s invite applied.` : 'Invite applied.'}
                  </Text>
                  {authStep === 'signup'
                    ? " You're a member the moment you finish."
                    : ' Held while you log in.'}
                </Text>
              </View>
            )}

            {/* Errors */}
            {errorMessages.length > 0 && (
              <View className="w-full font-sans bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 mb-4">
                {errorMessages.map((msg, idx) => (
                  <Text key={idx} className="text-red-500 text-sm font-sans">
                    {msg}
                  </Text>
                ))}
              </View>
            )}

            {/* Form */}
            <View className="gap-4">
              <View>
                <AuthInput
                  placeholder="Email"
                  onChangeText={changeUsername}
                  value={username}
                  secureTextEntry={false}
                  editable={emailEditable}
                />
              </View>
              {authStep === 'login' && (
                <View>
                  <AuthInput
                    placeholder="Password"
                    onChangeText={changePassword}
                    value={password}
                    secureTextEntry
                    autoComplete="password"
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
                      onChangeText={changePassword}
                      value={password}
                      secureTextEntry
                      autoComplete="password-new"
                      style={{}}
                    />
                  </View>
                  <View>
                    <AuthInput
                      placeholder="Confirm password"
                      onChangeText={changeConfirm}
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
                  : authStep === 'signup'
                    ? hasInvite
                      ? 'Accept Invite'
                      : 'Sign Up'
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

              {/* Have an invite? — manual code entry now that the typed step is
                  cut (form-03). Routes to the neutral paste screen (new-25). */}
              {authStep === 'initial' && (
                <Pressable
                  className="items-center mt-2"
                  onPress={() => { track('auth_have_invite_pressed', { source: 'auth' }); router.push('/join') }}
                >
                  <Text className="font-sans" style={{ fontSize: 14, color: '#78716C' }}>
                    Have an invite? <Text style={{ color: '#E8862A', fontWeight: '600' }}>Paste it</Text>
                  </Text>
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
