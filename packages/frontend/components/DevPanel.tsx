import React, { useState } from 'react'
import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useUser } from './contexts'

// Seeded demo/test accounts (created by the preview seeder + local seed).
// Password is the shared preview password.
const PREVIEW_PW = 'PreviewTest2026!'

type Role = { key: string; label: string; email: string; desc: string }
const ROLES: Role[] = [
  { key: 'unverified', label: 'Unverified user', email: 'unverified@chinmayajanata.org', desc: 'Fresh signup, not verified · lvl 30' },
  { key: 'member', label: 'Member', email: 'member@chinmayajanata.org', desc: 'Verified member, Boston center · lvl 45' },
  { key: 'sevak', label: 'Sevak', email: 'sevak@chinmayajanata.org', desc: 'Can pin + moderate boards · lvl 54' },
  { key: 'brahmachari', label: 'Brahmachari', email: 'brahmachari@chinmayajanata.org', desc: 'Acharya tier · lvl 108' },
  { key: 'admin', label: 'Admin', email: 'admin@chinmayajanata.org', desc: 'Full admin + moderation · lvl 110' },
]

export default function DevPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter()
  const { login, logout, user } = useUser()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!visible) return null

  const loginAs = async (role: Role) => {
    setError(null)
    setBusy(role.key)
    try {
      const res = await login(role.email, PREVIEW_PW)
      if (res?.success) {
        onClose()
        router.replace('/')
      } else {
        setError(res?.message || `Could not sign in as ${role.label}. Is this account seeded in this environment?`)
      }
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setBusy(null)
    }
  }

  const newUser = async () => {
    setError(null)
    setBusy('new')
    try { await logout() } catch { /* ignore */ }
    onClose()
    // Full first-timer walkthrough: explainer → auth/signup → onboarding → home.
    router.replace('/intro')
    setBusy(null)
  }

  const signOut = async () => {
    setError(null)
    setBusy('logout')
    try { await logout() } catch { /* ignore */ }
    onClose()
    router.replace('/auth')
    setBusy(null)
  }

  return (
    <View className="absolute inset-0 z-50 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
      <View className="bg-white dark:bg-neutral-900 rounded-2xl p-5 m-4" style={{ width: 340, maxWidth: '92%' }}>
        <View className="flex-row justify-between items-center mb-1">
          <Text className="font-sans font-bold text-lg text-content dark:text-content-dark">Dev / Demo tools</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close dev tools">
            <Text className="text-2xl text-gray-400">×</Text>
          </Pressable>
        </View>
        <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mb-4">
          {user ? `Signed in as ${user.email || user.username}` : 'Not signed in'}
        </Text>

        <Text className="font-sans font-semibold text-sm text-content dark:text-content-dark mb-2">Sign in as a role</Text>
        <View className="gap-2">
          {ROLES.map((r) => (
            <Pressable
              key={r.key}
              disabled={busy !== null}
              onPress={() => loginAs(r)}
              accessibilityLabel={`Sign in as ${r.label}`}
              className="flex-row items-center justify-between bg-stone-100 dark:bg-neutral-800 rounded-xl px-4 py-3 active:opacity-70"
            >
              <View className="flex-1 pr-2">
                <Text className="font-sans font-semibold text-content dark:text-content-dark">{r.label}</Text>
                <Text className="font-sans text-xs text-gray-500 dark:text-gray-400">{r.desc}</Text>
              </View>
              {busy === r.key ? <ActivityIndicator /> : <Text className="text-primary font-sans text-lg">→</Text>}
            </Pressable>
          ))}
        </View>

        <View className="mt-4 gap-2">
          <Pressable
            disabled={busy !== null}
            onPress={newUser}
            accessibilityLabel="Start as a new user"
            className="bg-primary rounded-xl px-4 py-3 active:opacity-80"
          >
            <Text className="text-white text-center font-sans font-semibold">New user — full walkthrough</Text>
          </Pressable>
          <Pressable
            disabled={busy !== null}
            onPress={signOut}
            accessibilityLabel="Sign out"
            className="rounded-xl px-4 py-3 active:opacity-70 border border-borderColor dark:border-borderColor-dark"
          >
            <Text className="text-center font-sans text-content dark:text-content-dark">Sign out</Text>
          </Pressable>
        </View>

        {error ? <Text className="font-sans text-xs text-red-500 mt-3">{error}</Text> : null}
        <Text className="font-sans text-[10px] text-gray-400 mt-4 text-center">Visible only in dev / preview builds.</Text>
      </View>
    </View>
  )
}
