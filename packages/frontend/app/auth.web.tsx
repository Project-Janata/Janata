import React, { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useAnalytics } from '../utils/analytics'
import PasswordStrength from '../components/auth/PasswordStrength'
import { ImageCarousel } from '../components/auth/ImageCarousel'
import { useAuthFlow } from '../components/auth/useAuthFlow'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const swamiChinmayanandaJpg = require('../assets/images/landing/Swami Chinmayananda.jpg')
const swamiChinmayanandaAlt = require('../assets/images/landing/Swami Chinmayananda (1).jpg')
const swamiChinmayanandaOption2 = require('../assets/images/landing/Swami Chinmayananda Option 2.jpeg')
import DevPanel from '../components/DevPanel'
import Logo from '../components/ui/Logo'

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

const AUTH_CAROUSEL_IMAGES = [
  swamiChinmayanandaJpg,
  swamiChinmayanandaAlt,
  swamiChinmayanandaOption2,
]

export default function AuthScreen() {
  const router = useRouter()
  const { track } = useAnalytics()

  // Shared auth state machine (see auth.tsx — same logic, RN presentation).
  const {
    authStep,
    username,
    password,
    confirmPassword,
    errorMessages,
    loading,
    inviterName,
    hasInvite,
    isInviteWallEntry,
    emailEditable,
    isButtonDisabled,
    heading,
    subtitle,
    changeUsername,
    changePassword,
    changeConfirm,
    handleSubmit,
    handleBack,
    createAccount,
  } = useAuthFlow()

  // Web-only presentation state.
  const [showDevPanel, setShowDevPanel] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false)
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280,
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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
    borderColor: '#E8862A',
    boxShadow: '0 0 0 3px rgba(194,65,12,0.1)',
    backgroundColor: '#FFFFFF',
  }
  const getInputStyle = (focused: boolean): React.CSSProperties => ({
    ...baseInputStyle,
    ...(focused ? focusInputStyle : {}),
  })

  const buttonText = loading
    ? 'Please wait...'
    : authStep === 'login'
      ? 'Sign In'
      : authStep === 'signup'
        ? hasInvite
          ? 'Accept invite and create account'
          : 'Create Account'
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
        {/* Top nav: home mark (left) + guest browse (right) */}
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
            onClick={() => { track('auth_logo_pressed', { source: 'auth' }); router.push('/landing') }}
            aria-label="Go to Janata home"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              margin: 0,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Logo size={isMobile ? 28 : 32} />
          </button>
          <button
            onClick={() => { track('auth_browse_as_guest_pressed', { source: 'auth' }); router.push('/(tabs)') }}
            style={{
              backgroundColor: '#FAFAF7',
              border: '1px solid #D6D3D1',
              borderRadius: 8,
              cursor: 'pointer',
              padding: '0 16px',
              fontSize: 14,
              fontFamily: 'Inclusive Sans, sans-serif',
              fontWeight: '500',
              color: '#57534E',
              height: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Browse as guest
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

          {/* What Janata is — only on the first step, so a new beta tester knows
              what they're signing into before entering an email. On mobile the
              brand carousel is hidden, making this the only context shown. */}
          {authStep === 'initial' && !hasInvite && !isInviteWallEntry && (
            <div style={{ marginTop: 4, marginBottom: 24 }}>
              {[
                'Discover satsangs, camps, and classes near you',
                'RSVP in a tap and see who else is going',
                'Send messages to members in centers and your events.',
              ].map((line) => (
                <div key={line} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 9 }}>
                  <span style={{ color: '#E8862A', fontSize: 14, lineHeight: '22px' }}>✓</span>
                  <span style={{ fontFamily: 'Inclusive Sans, sans-serif', fontSize: 14.5, lineHeight: '22px', color: '#57534E' }}>{line}</span>
                </div>
              ))}
            </div>
          )}

          {/* Subtitle */}
          <p
            style={{
              fontFamily: 'Inclusive Sans, sans-serif',
              fontSize: 16,
              color: '#78716C',
              marginBottom: 8,
              marginTop: 0,
              lineHeight: '24px',
            }}
          >
            {subtitle}
          </p>

          {/* Applied-invite bar (#403): the vouch carries into account creation,
              and is "held" when an email collision flips to login. */}
          {hasInvite && (authStep === 'signup' || authStep === 'login') && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(232,134,42,0.1)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 15 }}>🪔</span>
              <span
                style={{
                  fontFamily: 'Inclusive Sans, sans-serif',
                  fontSize: 14,
                  lineHeight: '20px',
                  color: '#B05A12',
                }}
              >
                <span style={{ fontWeight: 700, color: '#E8862A' }}>
                  {inviterName ? `${inviterName}'s invite applied.` : 'Invite applied.'}
                </span>
                {authStep === 'signup'
                  ? " You're a member the moment you finish."
                  : ' Held while you log in.'}
              </span>
            </div>
          )}

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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email input */}
            <input
              className="auth-input"
              type="email"
              placeholder="Email"
              value={username}
              onChange={(e) => changeUsername(e.target.value)}
              disabled={!emailEditable}
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
                onChange={(e) => changePassword(e.target.value)}
                autoComplete="current-password"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                style={getInputStyle(passwordFocused)}
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
                  onChange={(e) => changePassword(e.target.value)}
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
                  onChange={(e) => changeConfirm(e.target.value)}
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
                backgroundColor: '#E8862A',
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
          {authStep === 'initial' && !hasInvite && !isInviteWallEntry && (
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
                onClick={createAccount}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); createAccount() } }}
                style={{
                  color: '#E8862A',
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

          {/* Have an invite? — manual code entry now that the typed step is cut
              (form-03). Routes to the neutral paste screen (new-25). */}
          {authStep === 'initial' && !hasInvite && (
            <p
              style={{
                fontSize: 14,
                color: '#78716C',
                textAlign: 'center',
                marginTop: 4,
                fontFamily: 'Inclusive Sans, sans-serif',
              }}
            >
              Have an invite?{' '}
              <span
                role="button"
                tabIndex={0}
                onClick={() => { track('auth_have_invite_pressed', { source: 'auth' }); router.push('/join') }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); track('auth_have_invite_pressed', { source: 'auth' }); router.push('/join') } }}
                style={{ color: '#E8862A', cursor: 'pointer', fontWeight: 600, padding: '8px 4px', margin: '-8px -4px', display: 'inline-block' }}
              >
                Paste it
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
                  color: '#E8862A',
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
              style={{ color: '#E8862A', cursor: 'pointer' }}
            >
              Terms of Service
            </span>
            {' '}and{' '}
            <span
              role="link"
              tabIndex={0}
              onClick={() => { track('privacy_policy_viewed', { source: 'auth' }); router.push('/privacy') }}
              onKeyDown={(e) => { if (e.key === 'Enter') { track('privacy_policy_viewed', { source: 'auth' }); router.push('/privacy') } }}
              style={{ color: '#E8862A', cursor: 'pointer' }}
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
