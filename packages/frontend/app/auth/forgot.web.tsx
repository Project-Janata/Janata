import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import Logo from '../../components/ui/Logo'
import PasswordStrength from '../../components/auth/PasswordStrength'
import { authClient } from '../../src/auth/authClient'
import { validateEmail, validatePassword } from '../../utils'

// One-time CSS injection for placeholder + hover + iOS zoom prevention.
if (typeof document !== 'undefined') {
  const id = 'auth-forgot-web-styles'
  if (!document.getElementById(id)) {
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      .auth-input::placeholder { color: #9CA3AF; }
      .auth-input:disabled { opacity: 0.6; cursor: not-allowed; }
      .auth-input { font-size: 16px !important; }
      .auth-submit:hover:not(:disabled) { background-color: #B91C1C !important; }
      .auth-link:hover { text-decoration: underline; }
    `
    document.head.appendChild(style)
  }
}

type Step = 'enter-email' | 'enter-code-and-password' | 'done'

const inputBase: React.CSSProperties = {
  width: '100%',
  height: 48,
  padding: '0 16px',
  border: '1px solid #E7E5E4',
  borderRadius: 8,
  backgroundColor: '#FFFFFF',
  color: '#1C1917',
  fontFamily: 'Inclusive Sans, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
}

const focusedInput: React.CSSProperties = {
  ...inputBase,
  borderColor: '#C2410C',
}

export default function ForgotPasswordScreen() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('enter-email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ [k: string]: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [resendBusy, setResendBusy] = useState(false)
  const [resendNotice, setResendNotice] = useState<string | null>(null)

  const [emailFocused, setEmailFocused] = useState(false)
  const [codeFocused, setCodeFocused] = useState(false)
  const [pwFocused, setPwFocused] = useState(false)
  const [pw2Focused, setPw2Focused] = useState(false)

  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024,
  )
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const isMobile = viewportWidth < 640

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
    router.replace('/auth?mode=login')
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
      setErrors({
        form: result.error.message || 'Could not send a reset code. Please try again.',
      })
      return
    }
    setStep('enter-code-and-password')
  }, [email])

  const resend = useCallback(async () => {
    setResendNotice(null)
    setErrors({})
    setResendBusy(true)
    const result = await authClient.requestPasswordReset(email.trim())
    setResendBusy(false)
    if (!result.success) {
      setErrors({
        form: result.error.message || 'Could not resend the code. Please try again.',
      })
      return
    }
    setResendNotice('We sent a new code. Check your inbox.')
  }, [email])

  const submitReset = useCallback(async () => {
    setErrors({})
    const trimmedCode = code.trim()
    if (!/^\d{6}$/.test(trimmedCode)) {
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

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (step === 'enter-email') submitEmail()
      else if (step === 'enter-code-and-password') submitReset()
    },
    [step, submitEmail, submitReset],
  )

  const errorMessages = Object.values(errors).filter(Boolean)
  const buttonDisabled =
    submitting ||
    (step === 'enter-email' && !email) ||
    (step === 'enter-code-and-password' && (!code || !password || !confirmPassword))

  const heading =
    step === 'enter-email'
      ? 'Reset your password.'
      : step === 'enter-code-and-password'
        ? 'Check your email.'
        : 'Password updated.'

  const subtitle =
    step === 'enter-email'
      ? "Enter the email on your account. We'll send you a 6-digit code."
      : step === 'enter-code-and-password'
        ? `We sent a code to ${email.trim().toLowerCase()}. It expires in 15 minutes.`
        : 'Your password has been reset. Sign in with your new password.'

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAFAF7',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? '16px 16px' : '24px 32px',
        }}
      >
        <button
          onClick={goBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 4px',
            margin: '-8px -4px',
            fontSize: 14,
            fontFamily: 'Inclusive Sans, sans-serif',
            color: '#78716C',
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Back"
        >
          &larr; Back
        </button>
      </nav>

      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          padding: isMobile ? '8px 16px 24px' : '0 20px 32px',
        }}
      >
        <div style={{ maxWidth: 400, width: '100%' }}>
          <div
            onClick={() => router.push('/landing')}
            role="link"
            style={{ marginBottom: isMobile ? 32 : 48, cursor: 'pointer' }}
          >
            <Logo size={isMobile ? 28 : 32} />
          </div>

          <h1
            style={{
              fontFamily: '"Inclusive Sans", sans-serif',
              fontSize: isMobile ? 28 : 36,
              fontWeight: 400,
              color: '#1C1917',
              marginBottom: 8,
              marginTop: 0,
            }}
          >
            {heading}
          </h1>
          <p
            style={{
              fontFamily: 'Inclusive Sans, sans-serif',
              fontSize: 16,
              color: '#78716C',
              marginBottom: 32,
              marginTop: 0,
            }}
          >
            {subtitle}
          </p>

          {errorMessages.length > 0 && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 16,
              }}
            >
              {errorMessages.map((m, i) => (
                <p
                  key={i}
                  style={{
                    color: '#EF4444',
                    fontSize: 14,
                    fontFamily: 'Inclusive Sans, sans-serif',
                    margin: 0,
                  }}
                >
                  {m}
                </p>
              ))}
            </div>
          )}

          {resendNotice && (
            <div
              style={{
                backgroundColor: '#ECFDF5',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 16,
              }}
            >
              <p
                style={{
                  color: '#047857',
                  fontSize: 14,
                  fontFamily: 'Inclusive Sans, sans-serif',
                  margin: 0,
                }}
              >
                {resendNotice}
              </p>
            </div>
          )}

          {step === 'done' ? (
            <button
              className="auth-submit"
              onClick={() => router.replace('/auth?mode=login')}
              style={{
                width: '100%',
                height: 48,
                backgroundColor: '#C2410C',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontFamily: 'Inclusive Sans, sans-serif',
                fontWeight: 500,
                cursor: 'pointer',
                marginTop: 8,
              }}
            >
              Back to sign in
            </button>
          ) : (
            <form
              onSubmit={onSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {step === 'enter-email' && (
                <input
                  className="auth-input"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrors((p) => ({ ...p, email: '' }))
                  }}
                  autoComplete="email"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  style={emailFocused ? focusedInput : inputBase}
                />
              )}

              {step === 'enter-code-and-password' && (
                <>
                  <input
                    className="auth-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      setErrors((p) => ({ ...p, code: '' }))
                    }}
                    maxLength={6}
                    onFocus={() => setCodeFocused(true)}
                    onBlur={() => setCodeFocused(false)}
                    style={{
                      ...(codeFocused ? focusedInput : inputBase),
                      letterSpacing: '6px',
                      fontFamily: 'monospace',
                    }}
                  />

                  <input
                    className="auth-input"
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setErrors((p) => ({ ...p, password: '' }))
                    }}
                    autoComplete="new-password"
                    onFocus={() => setPwFocused(true)}
                    onBlur={() => setPwFocused(false)}
                    style={pwFocused ? focusedInput : inputBase}
                  />

                  <PasswordStrength password={password} show={password.length > 0} />

                  <input
                    className="auth-input"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setErrors((p) => ({ ...p, confirmPassword: '' }))
                    }}
                    autoComplete="new-password"
                    onFocus={() => setPw2Focused(true)}
                    onBlur={() => setPw2Focused(false)}
                    style={pw2Focused ? focusedInput : inputBase}
                  />
                </>
              )}

              <button
                className="auth-submit"
                type="submit"
                disabled={buttonDisabled}
                style={{
                  width: '100%',
                  height: 48,
                  backgroundColor: '#C2410C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 16,
                  fontFamily: 'Inclusive Sans, sans-serif',
                  fontWeight: 500,
                  cursor: buttonDisabled ? 'not-allowed' : 'pointer',
                  marginTop: 8,
                  opacity: buttonDisabled ? 0.4 : 1,
                }}
              >
                {submitting
                  ? 'Please wait…'
                  : step === 'enter-email'
                    ? 'Send code'
                    : 'Reset password'}
              </button>

              {step === 'enter-code-and-password' && (
                <p style={{ textAlign: 'center', marginTop: 8, marginBottom: 0 }}>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (!resendBusy) resend()
                    }}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !resendBusy) {
                        e.preventDefault()
                        resend()
                      }
                    }}
                    className="auth-link"
                    style={{
                      color: '#C2410C',
                      cursor: resendBusy ? 'not-allowed' : 'pointer',
                      fontFamily: 'Inclusive Sans, sans-serif',
                      fontSize: 14,
                      fontWeight: 500,
                      opacity: resendBusy ? 0.6 : 1,
                    }}
                  >
                    {resendBusy ? 'Sending…' : "Didn't get it? Resend code"}
                  </span>
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
