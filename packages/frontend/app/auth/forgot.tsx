import React, { useCallback, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { ArrowLeft } from 'phosphor-react-native'
import { useRouter } from 'expo-router'
import { AuthInput, Logo, PrimaryButton } from '../../components/ui'
import { useTheme } from '../../components/contexts'
import { PasswordStrength } from '../../components'
import { useColors } from '../../hooks/useColors'
import { authClient } from '../../src/auth/authClient'
import { validateEmail, validatePassword } from '../../utils'

type Step = 'enter-email' | 'enter-code-and-password' | 'done'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const c = useColors()

  const [step, setStep] = useState<Step>('enter-email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ [k: string]: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [resendBusy, setResendBusy] = useState(false)
  const [resendNotice, setResendNotice] = useState<string | null>(null)

  const goBack = useCallback(() => {
    if (step === 'enter-code-and-password') {
      setStep('enter-email')
      setCode('')
      setPassword('')
      setConfirmPassword('')
      setErrors({})
      setResendNotice(null)
      return
    }
    router.back()
  }, [step, router])

  const submitEmail = useCallback(async () => {
    setErrors({})
    const trimmed = email.trim()
    if (!trimmed) {
      setErrors({ email: 'Please enter your email.' })
      return
    }
    if (!validateEmail(trimmed)) {
      setErrors({ email: 'You must enter a valid email address.' })
      return
    }

    setSubmitting(true)
    const result = await authClient.requestPasswordReset(trimmed)
    setSubmitting(false)

    if (!result.success) {
      setErrors({ form: result.error.message || 'Could not send a reset code. Please try again.' })
      return
    }
    // Server always returns ok — advance regardless of whether the email
    // exists. Anti-enumeration design.
    setStep('enter-code-and-password')
  }, [email])

  const resend = useCallback(async () => {
    setResendNotice(null)
    setErrors({})
    setResendBusy(true)
    const result = await authClient.requestPasswordReset(email.trim())
    setResendBusy(false)
    if (!result.success) {
      setErrors({ form: result.error.message || 'Could not resend the code. Please try again.' })
      return
    }
    setResendNotice('We sent a new code. Check your inbox.')
  }, [email])

  const submitReset = useCallback(async () => {
    setErrors({})
    const trimmedCode = code.trim()
    if (!trimmedCode || trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
      setErrors({ code: 'Enter the 6-digit code from your email.' })
      return
    }
    if (!password) {
      setErrors({ password: 'Please choose a new password.' })
      return
    }
    const pw = validatePassword(password)
    if (!pw.isValid) {
      setErrors({ password: pw.errors[0] || 'Password does not meet complexity requirements.' })
      return
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match.' })
      return
    }

    setSubmitting(true)
    const result = await authClient.confirmPasswordReset(email.trim(), trimmedCode, password)
    setSubmitting(false)

    if (!result.success) {
      setErrors({ form: result.error.message || 'Code invalid or expired.' })
      return
    }
    setStep('done')
  }, [code, password, confirmPassword, email])

  const goToLogin = useCallback(() => {
    router.replace('/auth?mode=login')
  }, [router])

  const errorMessages = Object.values(errors).filter(Boolean)
  const buttonDisabled =
    submitting ||
    (step === 'enter-email' && !email) ||
    (step === 'enter-code-and-password' && (!code || !password || !confirmPassword))

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
        <View
          className="flex-1 justify-center items-center w-full px-6"
          style={{ paddingTop: 60, paddingBottom: 48 }}
        >
          <View className="w-full" style={{ maxWidth: 400 }}>
            {/* Back */}
            <TouchableOpacity
              onPress={goBack}
              activeOpacity={0.7}
              className="flex-row items-center gap-2 mb-6 rounded-xl px-3 py-2 self-start"
              style={{ alignSelf: 'flex-start' }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={20} className={isDark ? 'text-white' : 'text-content'} />
              <Text className="font-sans font-medium text-content dark:text-content-dark">
                Back
              </Text>
            </TouchableOpacity>

            <Pressable onPress={() => router.push('/landing')}>
              <Logo size={32} style={{ marginBottom: 32 }} />
            </Pressable>

            {/* Heading */}
            <View className="mb-6">
              <Text
                style={{ fontFamily: '"Inclusive Sans"', fontSize: 36, fontWeight: '400' }}
                className="text-content dark:text-content-dark"
              >
                {step === 'enter-email'
                  ? 'Reset your password.'
                  : step === 'enter-code-and-password'
                  ? 'Check your email.'
                  : 'Password updated.'}
              </Text>
              <Text className="text-base font-sans mt-2" style={{ color: c.textMuted }}>
                {step === 'enter-email'
                  ? 'Enter the email on your account. We\'ll send you a 6-digit code.'
                  : step === 'enter-code-and-password'
                  ? `We sent a code to ${email.trim().toLowerCase()}. It expires in 15 minutes.`
                  : 'Your password has been reset. Sign in with your new password.'}
              </Text>
            </View>

            {/* Errors */}
            {errorMessages.length > 0 && (
              <View className="w-full font-sans bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 mb-4">
                {errorMessages.map((m, i) => (
                  <Text key={i} className="text-red-500 text-sm font-sans">
                    {m}
                  </Text>
                ))}
              </View>
            )}

            {/* Resend notice (non-error) */}
            {resendNotice && (
              <View className="w-full font-sans bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3 mb-4">
                <Text className="text-green-700 dark:text-green-300 text-sm font-sans">
                  {resendNotice}
                </Text>
              </View>
            )}

            {/* Forms */}
            {step === 'enter-email' && (
              <View className="gap-4">
                <AuthInput
                  placeholder="Email"
                  onChangeText={(t: string) => {
                    setEmail(t)
                    setErrors((prev) => ({ ...prev, email: '' }))
                  }}
                  value={email}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                />
                <PrimaryButton
                  onPress={submitEmail}
                  disabled={buttonDisabled}
                  loading={submitting}
                  style={{ marginTop: 8 }}
                >
                  Send code
                </PrimaryButton>
              </View>
            )}

            {step === 'enter-code-and-password' && (
              <View className="gap-4">
                <AuthInput
                  placeholder="6-digit code"
                  onChangeText={(t: string) => {
                    setCode(t.replace(/\D/g, '').slice(0, 6))
                    setErrors((prev) => ({ ...prev, code: '' }))
                  }}
                  value={code}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  maxLength={6}
                />
                <View>
                  <PasswordStrength password={password} show={password.length > 0} />
                  <AuthInput
                    placeholder="New password"
                    onChangeText={(t: string) => {
                      setPassword(t)
                      setErrors((prev) => ({ ...prev, password: '' }))
                    }}
                    value={password}
                    secureTextEntry
                    autoComplete="password-new"
                  />
                </View>
                <AuthInput
                  placeholder="Confirm new password"
                  onChangeText={(t: string) => {
                    setConfirmPassword(t)
                    setErrors((prev) => ({ ...prev, confirmPassword: '' }))
                  }}
                  value={confirmPassword}
                  secureTextEntry
                  autoComplete="password-new"
                />
                <PrimaryButton
                  onPress={submitReset}
                  disabled={buttonDisabled}
                  loading={submitting}
                  style={{ marginTop: 8 }}
                >
                  Reset password
                </PrimaryButton>

                <Pressable
                  className="items-center mt-2"
                  onPress={resend}
                  disabled={resendBusy}
                  accessibilityRole="button"
                  accessibilityLabel="Resend code"
                >
                  <Text className="text-primary font-sans font-medium">
                    {resendBusy ? 'Sending…' : "Didn't get it? Resend code"}
                  </Text>
                </Pressable>
              </View>
            )}

            {step === 'done' && (
              <View className="gap-4">
                <PrimaryButton onPress={goToLogin} disabled={false} style={{ marginTop: 8 }}>
                  Back to sign in
                </PrimaryButton>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
