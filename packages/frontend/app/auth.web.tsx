import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useUser } from '../components/contexts'
import { useAnalytics } from '../utils/analytics'
import { validateEmail, validatePassword } from '../utils'
import PasswordStrength from '../components/auth/PasswordStrength'
import { ImageCarousel } from '../components/auth/ImageCarousel'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const swamiChinmayanandaJpg = require('../assets/images/landing/Swami Chinmayananda.jpg')
const swamiChinmayanandaAlt = require('../assets/images/landing/Swami Chinmayananda (1).jpg')
const swamiChinmayanandaOption2 = require('../assets/images/landing/Swami Chinmayananda Option 2.jpeg')
import DevPanel from '../components/DevPanel'
import Logo from '../components/ui/Logo'
import { API_BASE_URL } from '../src/config/api'

// __DEV__ is a React Native/Expo global — always false in production builds.
// EXPO_PUBLIC_SHOW_DEV_TOOLS=1 also enables the dev/demo tools (set on the
// isolated v2 preview build) so role-switching works for demos there too.
const isDev =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  process.env.EXPO_PUBLIC_SHOW_DEV_TOOLS === '1'

// Inject CSS for placeholder, hover, and mobile-specific styles (web only)
if (typeof document !== 'undefined') {
  const id = 'auth-web-styles'
  if (!document.getElementById(id)) {
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      .auth-input::placeholder { color: #9CA3AF; }
      .auth-input:disabled { opacity: 0.6; cursor: not-allowed; }
      .auth-input { font-size: 16px !important; } /* Prevent iOS zoom on focus */
      .auth-submit:hover:not(:disabled) { background-color: #B91C1C !important; }
      @supports (min-height: 100dvh) {
        .auth-root { min-height: 100dvh !important; }
      }
    `
    document.head.appendChild(style)
  }
}

type AuthStep = 'initial' | 'login' | 'invite-code' | 'signup'

const AUTH_CAROUSEL_IMAGES = [
  swamiChinmayanandaJpg,
  swamiChinmayanandaAlt,
  swamiChinmayanandaOption2,
]

export default function AuthScreen() {
  const router = useRouter()
  const { checkUserExists, login, signup, loading } = useUser()
  const { track } = useAnalytics()

  // Read mode, returnTo, inviteCode, and email from URL params
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const initialMode = urlParams?.get('mode')
  const returnTo = urlParams?.get('returnTo')
  const urlInviteCode = urlParams?.get('inviteCode')
  const urlEmail = urlParams?.get('email') ?? ''

  // When inviteCode is provided via URL (e.g. from public explore flow),
  // skip the invite-code step and go straight to signup.
  // mode=login is meaningful only when we also have an email — otherwise we'd
  // render a login screen with a disabled empty email field that the user
  // can't edit, which is a dead-end. Fall back to the initial step instead.
  const [authStep, setAuthStep] = useState<AuthStep>(
    initialMode === 'login' && urlEmail ? 'login'
      : initialMode === 'signup' && urlInviteCode ? 'signup'
      : 'initial'
  )
  const [username, setUsername] = useState(urlEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteCode, setInviteCode] = useState(urlInviteCode || '')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [showDevPanel, setShowDevPanel] = useState(false)
  // Focus state for input styling
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false)
  const [inviteCodeFocused, setInviteCodeFocused] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // --- Auth Handlers (same logic as auth.tsx) ---

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
        router.replace(returnTo || '/(tabs)')
      } else {
        track('login_failed', { source: 'auth', reason: result.message })
        setErrors({ form: result.message || 'Username or password is incorrect.' })
      }
    } catch (e: any) {
      track('login_failed', { source: 'auth', reason: 'network_error' })
      setErrors({ form: 'Failed to connect to server. Please try again.' })
    }
  }, [username, password, login, router, track])

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
        router.replace(returnTo ? `/onboarding?returnTo=${encodeURIComponent(returnTo)}` : '/onboarding')
      } else {
        track('signup_failed', { source: 'auth', reason: result.message })
        setErrors({ form: result.message || 'Failed to sign up. Please try again.' })
      }
    } catch (e: any) {
      track('signup_failed', { source: 'auth', reason: 'network_error' })
      setErrors({ form: 'Failed to connect to server. Please try again.' })
    }
  }, [username, password, confirmPassword, inviteCode, signup, router, track])

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

  const handleSubmit = useCallback(
    (e?: any) => {
      if (e) {
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

  const handleUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value)
    setErrors((prev) => ({ ...prev, username: '' }))
  }, [])

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setErrors((prev) => ({ ...prev, password: '' }))
  }, [])

  const handleConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    setErrors((prev) => ({ ...prev, confirmPassword: '' }))
  }, [])

  const handleInviteCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInviteCode(e.target.value)
    setErrors((prev) => ({ ...prev, inviteCode: '' }))
  }, [])

  const isButtonDisabled =
    loading ||
    (authStep === 'initial' && !username) ||
    (authStep === 'invite-code' && !inviteCode) ||
    (authStep !== 'initial' && authStep !== 'invite-code' && !password) ||
    (authStep === 'signup' && !confirmPassword)

  const errorMessages = Object.values(errors).filter(Boolean)

  // --- Input style helpers ---

  const baseInputStyle: React.CSSProperties = {
    width: '100%',
    height: 48,
    minHeight: 44,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#D6D3D1',
    borderRadius: 8,
    padding: '0 16px',
    fontSize: 16,
    fontFamily: 'Inclusive Sans, sans-serif',
    color: '#1C1917',
    backgroundColor: '#FAFAF7',
    outline: 'none',
    boxSizing: 'border-box' as const,
    WebkitAppearance: 'none' as const,
  }

  const focusInputStyle: React.CSSProperties = {
    borderColor: '#C2410C',
    boxShadow: '0 0 0 3px rgba(194,65,12,0.1)',
    backgroundColor: '#FFFFFF',
  }

  const getInputStyle = (focused: boolean): React.CSSProperties => ({
    ...baseInputStyle,
    ...(focused ? focusInputStyle : {}),
  })

  // --- Heading and subtitle per step ---

  const heading =
    authStep === 'login'
      ? 'Welcome back.'
      : authStep === 'invite-code'
        ? 'Enter invite code.'
        : authStep === 'signup'
          ? 'Join the community.'
          : 'Welcome.'

  const subtitle =
    authStep === 'login'
      ? 'Enter your password to continue'
      : authStep === 'invite-code'
        ? 'Enter your beta invite code to proceed'
        : authStep === 'signup'
          ? 'Create your account to get started'
          : 'Enter your email to get started'

  const buttonText = loading
    ? 'Please wait...'
    : authStep === 'login'
      ? 'Sign In'
      : authStep === 'invite-code'
        ? 'Verify Code'
        : authStep === 'signup'
          ? 'Create Account'
          : 'Continue'
  const isNarrowWeb = viewportWidth < 1024
  const isMobile = viewportWidth < 640

  return (
    <div
      className="auth-root"
      style={{
        display: 'flex',
        flexDirection: isNarrowWeb ? 'column' : 'row',
        minHeight: '100vh',
        backgroundColor: '#FAFAF7',
      }}
    >
      {/* Left: Image Carousel */}
      {!isNarrowWeb && (
        <div style={{ width: '50%', position: 'relative' }}>
          <ImageCarousel images={AUTH_CAROUSEL_IMAGES} />
        </div>
      )}

      {/* Right: Form */}
      <div
        style={{
          width: isNarrowWeb ? '100%' : '50%',
          backgroundColor: '#FAFAF7',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          flex: 1,
        }}
      >
        {/* Top nav: back to landing (left) + Discover (right) */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '16px 16px' : '24px 32px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => { track('auth_back_to_home_pressed', { source: 'auth' }); router.push('/landing') }}
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
          >
            &larr; Back to home
          </button>
          <button
            onClick={() => { track('auth_discover_pressed', { source: 'auth' }); router.push('/(tabs)') }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 4px',
              margin: '-8px -4px',
              fontSize: 14,
              fontFamily: 'Inclusive Sans, sans-serif',
              fontWeight: '500',
              color: '#C2410C',
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Discover &rarr;
          </button>
        </nav>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'center',
            padding: isMobile ? '8px 16px 24px' : isNarrowWeb ? '0 20px 32px' : 0,
          }}
        >
        <div style={{ maxWidth: 400, width: '100%', padding: isNarrowWeb ? 0 : '0 48px' }}>
          {/* Back button (login/signup steps) */}
          {authStep !== 'initial' && (
            <button
              onClick={handleBack}
              style={{
                color: '#78716C',
                fontSize: 14,
                fontFamily: 'Inclusive Sans, sans-serif',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: '12px 16px 12px 0',
                marginBottom: 12,
                marginLeft: -4,
                minHeight: 44,
                minWidth: 44,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              &larr; Back
            </button>
          )}

          {/* Janata logo */}
          <div
            onClick={() => { track('auth_logo_pressed', { source: 'auth' }); router.push('/landing') }}
            role="link"
            style={{ marginBottom: isMobile ? 32 : 48, cursor: 'pointer' }}
          >
            <Logo size={isMobile ? 28 : 32} />
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: '"Inclusive Sans", sans-serif',
              fontSize: isMobile ? 28 : isNarrowWeb ? 32 : 36,
              fontWeight: '400',
              color: '#1C1917',
              marginBottom: 8,
              marginTop: 0,
            }}
          >
            {heading}
          </h1>

          {/* Subtitle */}
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

          {/* Error alert box */}
          {errorMessages.length > 0 && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 16,
              }}
            >
              {errorMessages.map((msg, idx) => (
                <p
                  key={idx}
                  style={{
                    color: '#EF4444',
                    fontSize: 14,
                    fontFamily: 'Inclusive Sans, sans-serif',
                    margin: 0,
                  }}
                >
                  {msg}
                </p>
              ))}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {/* Email input */}
            <input
              className="auth-input"
              type="email"
              placeholder="Email"
              value={username}
              onChange={handleUsernameChange}
              disabled={authStep !== 'initial'}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              style={getInputStyle(emailFocused)}
            />

            {/* Password input (login) */}
            {authStep === 'login' && (
              <input
                className="auth-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                style={getInputStyle(passwordFocused)}
              />
            )}

            {/* Invite code input (invite-code step) */}
            {authStep === 'invite-code' && (
              <input
                className="auth-input"
                type="text"
                placeholder="Invite Code"
                value={inviteCode}
                onChange={handleInviteCodeChange}
                autoComplete="off"
                onFocus={() => setInviteCodeFocused(true)}
                onBlur={() => setInviteCodeFocused(false)}
                style={getInputStyle(inviteCodeFocused)}
              />
            )}

            {/* Password + PasswordStrength + Confirm (signup) */}
            {authStep === 'signup' && (
              <>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  style={getInputStyle(passwordFocused)}
                />

                <PasswordStrength password={password} show={password.length > 0} />

                <input
                  className="auth-input"
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  autoComplete="new-password"
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  style={getInputStyle(confirmPasswordFocused)}
                />
              </>
            )}

            {/* Submit button */}
            <button
              className="auth-submit"
              type="submit"
              disabled={isButtonDisabled}
              style={{
                width: '100%',
                height: 48,
                minHeight: 44,
                backgroundColor: '#C2410C',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontFamily: 'Inclusive Sans, sans-serif',
                fontWeight: '500',
                cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                marginTop: 8,
                opacity: isButtonDisabled ? 0.4 : 1,
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              {buttonText}
            </button>
          </form>

          {/* Toggle links */}
          {authStep === 'initial' && (
            <p
              style={{
                fontSize: 14,
                color: '#78716C',
                textAlign: 'center',
                marginTop: 16,
                fontFamily: 'Inclusive Sans, sans-serif',
              }}
            >
              Don't have an account?{' '}
              <span
                role="button"
                tabIndex={0}
                onClick={async () => {
                  if (!username) {
                    setErrors({ username: 'Please enter your email first.' })
                    return
                  }
                  if (!validateEmail(username)) {
                    setErrors({ username: 'You must enter a valid email address.' })
                    return
                  }
                  track('auth_create_account_pressed', { source: 'auth' })
                  try {
                    const exists = await checkUserExists(username)
                    if (exists) {
                      setErrors({ form: 'An account with this email already exists. Please log in.' })
                      setAuthStep('login')
                    } else {
                      setAuthStep('signup')
                    }
                  } catch (e: any) {
                    setErrors({ form: e.message || 'Failed to connect to server.' })
                  }
                }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    if (!username) {
                      setErrors({ username: 'Please enter your email first.' })
                      return
                    }
                    if (!validateEmail(username)) {
                      setErrors({ username: 'You must enter a valid email address.' })
                      return
                    }
                    track('auth_create_account_pressed', { source: 'auth' })
                    try {
                      const exists = await checkUserExists(username)
                      if (exists) {
                        setErrors({ form: 'An account with this email already exists. Please log in.' })
                        setAuthStep('login')
                      } else {
                        setAuthStep('signup')
                      }
                    } catch (e: any) {
                      setErrors({ form: e.message || 'Failed to connect to server.' })
                    }
                  }
                }}
                style={{
                  color: '#C2410C',
                  cursor: 'pointer',
                  padding: '8px 4px',
                  margin: '-8px -4px',
                  display: 'inline-block',
                }}
              >
                Create one
              </span>
            </p>
          )}

          {authStep === 'login' && (
            <p
              style={{
                fontSize: 14,
                color: '#78716C',
                textAlign: 'center',
                marginTop: 16,
                fontFamily: 'Inclusive Sans, sans-serif',
              }}
            >
              <span
                role="button"
                tabIndex={0}
                onClick={() => { track('auth_forgot_password_pressed', { source: 'auth' }); router.push('/auth/forgot') }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    track('auth_forgot_password_pressed', { source: 'auth' })
                    router.push('/auth/forgot')
                  }
                }}
                style={{
                  color: '#C2410C',
                  cursor: 'pointer',
                  padding: '8px 4px',
                  margin: '-8px -4px',
                  display: 'inline-block',
                }}
              >
                Forgot password?
              </span>
            </p>
          )}

          {/* Discreet dev/demo tools — fixed bottom-left circle, dev/preview only */}
          {isDev && (
            <button
              onClick={() => setShowDevPanel(true)}
              aria-label="Developer tools"
              style={{
                position: 'fixed',
                left: 20,
                bottom: 24,
                width: 44,
                height: 44,
                borderRadius: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#E7E5E4',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                fontFamily: 'monospace',
                fontSize: 16,
                color: '#57534E',
                zIndex: 50,
              }}
            >
              &lt;/&gt;
            </button>
          )}

          {/* DevPanel */}
          {isDev && showDevPanel && (
            <DevPanel visible={showDevPanel} onClose={() => setShowDevPanel(false)} />
          )}

          {/* Footer text */}
          <p
            style={{
              fontSize: 13,
              color: '#A8A29E',
              textAlign: 'center',
              marginTop: isMobile ? 24 : 32,
              fontFamily: 'Inclusive Sans, sans-serif',
              paddingBottom: isMobile ? 16 : 0,
            }}
          >
            By continuing, you agree to our{' '}
            <span
              role="link"
              tabIndex={0}
              onClick={() => { track('terms_viewed', { source: 'auth' }); router.push('/terms') }}
              onKeyDown={(e) => { if (e.key === 'Enter') { track('terms_viewed', { source: 'auth' }); router.push('/terms') } }}
              style={{ color: '#C2410C', cursor: 'pointer' }}
            >
              Terms of Service
            </span>
            {' '}and{' '}
            <span
              role="link"
              tabIndex={0}
              onClick={() => { track('privacy_policy_viewed', { source: 'auth' }); router.push('/privacy') }}
              onKeyDown={(e) => { if (e.key === 'Enter') { track('privacy_policy_viewed', { source: 'auth' }); router.push('/privacy') } }}
              style={{ color: '#C2410C', cursor: 'pointer' }}
            >
              Privacy Policy
            </span>
          </p>

        </div>
        </div>
      </div>
    </div>
  )
}
