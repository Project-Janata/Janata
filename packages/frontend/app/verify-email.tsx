import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { AlertCircle, CheckCircle2, MailCheck } from 'lucide-react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text } from '../components/ui'
import { useUser } from '../components/contexts'
import { useColors } from '../hooks/useColors'
import { authClient } from '../src/auth/authClient'

type VerifyState = 'loading' | 'success' | 'error'

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export default function VerifyEmailScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ token?: string | string[] }>()
  const colors = useColors()
  const { user, setUser } = useUser()

  const token = useMemo(() => firstParam(params.token).trim(), [params.token])
  const [state, setState] = useState<VerifyState>('loading')
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    let cancelled = false

    async function verify() {
      if (!token) {
        setState('error')
        setMessage('This verification link is missing a token.')
        return
      }

      setState('loading')
      setMessage('Verifying your email...')
      const result = await authClient.verifyEmail(token)
      if (cancelled) return

      if (!result.success) {
        setState('error')
        setMessage(result.error.message || 'This verification link is invalid or expired.')
        return
      }

      if (user) {
        setUser(result.data.user)
      }
      setState('success')
      setMessage('Your email is verified. You can continue using Janata.')
    }

    verify()
    return () => {
      cancelled = true
    }
  }, [setUser, token, user])

  const isSuccess = state === 'success'
  const isLoading = state === 'loading'
  const Icon = isSuccess ? CheckCircle2 : state === 'error' ? AlertCircle : MailCheck

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View
        style={{
          width: '100%',
          maxWidth: 420,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          backgroundColor: colors.card,
          padding: 24,
          gap: 18,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            backgroundColor: isSuccess ? colors.successSoft : colors.accentSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Icon size={24} color={isSuccess ? colors.success : colors.accent} />
          )}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 24, lineHeight: 30, color: colors.text }}>
            {isLoading ? 'Checking your link' : isSuccess ? "You're verified" : "Couldn't verify email"}
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 22, color: colors.textMuted }}>
            {message}
          </Text>
        </View>

        {!isLoading && (
          <View style={{ gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace((isSuccess && user ? '/' : '/auth?mode=login') as never)}
              style={{
                minHeight: 48,
                borderRadius: 8,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
                {isSuccess && user ? 'Continue' : 'Sign in'}
              </Text>
            </Pressable>

            {state === 'error' && (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace('/verification' as never)}
                style={{
                  minHeight: 44,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 16,
                }}
              >
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>
                  How verification works
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  )
}
