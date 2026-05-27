import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { ScrollView, View, Text, Pressable } from 'react-native'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  componentStack: string | null
  copied: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, componentStack: null, copied: false }
  }

  // Capture the error here (runs before render) so the fallback can show it
  // on first paint — componentDidCatch runs after render and would leave the
  // first paint empty.
  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log in prod too — silently swallowing crashes makes triage impossible.
    // The component stack lets us identify which JSX site rendered an
    // undefined element (the most common cause of React error #130 in prod).
    console.error('ErrorBoundary caught:', error, info.componentStack)
    if (typeof window !== 'undefined') {
      ;(window as any).__lastErrorInfo = {
        message: error?.message,
        stack: error?.stack,
        componentStack: info.componentStack,
      }
    }
    this.setState({ componentStack: info.componentStack ?? null })
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, componentStack: null, copied: false })
  }

  private buildErrorReport = (): string => {
    const { error, componentStack } = this.state
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    return [
      `Message: ${error?.message ?? '(no message)'}`,
      `URL: ${url}`,
      `UA: ${ua}`,
      '',
      'Stack:',
      error?.stack ?? '(no stack)',
      '',
      'Component stack:',
      componentStack ?? '(no component stack)',
    ].join('\n')
  }

  private handleCopyDetails = async () => {
    const text = this.buildErrorReport()
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        this.setState({ copied: true })
        setTimeout(() => this.setState({ copied: false }), 2000)
      }
    } catch {
      // Clipboard can be blocked (insecure context, denied permission). Users
      // can still read the on-screen text and screenshot it.
    }
  }

  /**
   * Recovery path for users whose session is the cause of the crash (stale
   * auth tokens, malformed cached state, etc.). Wipes localStorage,
   * sessionStorage, and cookies for the current origin, then hard-reloads —
   * the page comes back as if it's a first visit.
   *
   * "Try Again" alone wasn't enough: re-rendering with the same broken
   * persisted state just loops on the same crash.
   */
  private handleResetAndReload = () => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage?.clear()
    } catch {
      // Ignore — some browsers block storage access in private/incognito.
    }
    try {
      window.sessionStorage?.clear()
    } catch {
      // Ignore.
    }
    if (typeof document !== 'undefined') {
      try {
        const cookies = document.cookie.split(';')
        for (const c of cookies) {
          const eq = c.indexOf('=')
          const name = (eq > -1 ? c.substring(0, eq) : c).trim()
          if (!name) continue
          // Expire on this path and root domain, with and without leading dot.
          const host = window.location.hostname
          const stripped = host.replace(/^www\./, '')
          for (const domain of [host, '.' + stripped, stripped]) {
            document.cookie =
              name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; domain=' + domain
          }
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/'
        }
      } catch {
        // Ignore — best-effort.
      }
    }
    window.location.replace(window.location.pathname || '/')
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: '#1a1a1a',
              marginBottom: 8,
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#666',
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            An unexpected error occurred. Please try again.
          </Text>
          <Pressable
            onPress={this.handleRetry}
            style={{
              backgroundColor: '#ea580c',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 9999,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
              Try Again
            </Text>
          </Pressable>

          {typeof window !== 'undefined' && (
            <Pressable
              onPress={this.handleResetAndReload}
              style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 10 }}
            >
              <Text style={{ color: '#666', fontSize: 13, textDecorationLine: 'underline' }}>
                Still stuck? Reset session and reload
              </Text>
            </Pressable>
          )}

          {/* Beta-phase debug panel: full error message + stack trace + Copy
              details button. Useful for triaging phone-only crashes during
              beta/dev. Hidden in production builds (env unset on prod →
              undefined !== 'true').

              Devs can opt in by setting EXPO_PUBLIC_SHOW_DEBUG_DETAILS=true
              in `packages/frontend/.env` — see `.env.example`. */}
          {process.env.EXPO_PUBLIC_SHOW_DEBUG_DETAILS === 'true' && this.state.error && (
            <View
              style={{
                marginTop: 32,
                width: '100%',
                maxWidth: 640,
                borderWidth: 1,
                borderColor: '#e5e5e5',
                borderRadius: 8,
                padding: 12,
                backgroundColor: '#fafafa',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#666' }}>
                  Debug details (beta)
                </Text>
                <Pressable
                  onPress={this.handleCopyDetails}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: this.state.copied ? '#16a34a' : '#1a1a1a',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                    {this.state.copied ? 'Copied' : 'Copy details'}
                  </Text>
                </Pressable>
              </View>
              <Text
                selectable
                style={{ fontSize: 12, color: '#1a1a1a', marginBottom: 6 }}
              >
                {this.state.error.message || '(no message)'}
              </Text>
              <ScrollView style={{ maxHeight: 240 }} nestedScrollEnabled>
                <Text
                  selectable
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 11,
                    color: '#444',
                    lineHeight: 16,
                  }}
                >
                  {this.buildErrorReport()}
                </Text>
              </ScrollView>
            </View>
          )}
        </View>
      )
    }

    return this.props.children
  }
}
