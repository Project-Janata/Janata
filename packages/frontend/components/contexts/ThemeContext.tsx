// theme.tsx
import { useColorScheme as useNativeWindColorScheme } from 'nativewind'
import { useCallback, useContext, useEffect, useMemo, useRef, useState, createContext } from 'react'
import { Appearance, Platform, View, Animated } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supportsNativeDriver } from '../../utils/animation'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  /** The resolved, effective theme ("light" | "dark") */
  theme: ResolvedTheme
  /** What the user explicitly chose */
  preference: ThemePreference
  setPreference: (pref: ThemePreference) => void
  /** Convenience boolean */
  isDark: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@theme'
const isWeb = Platform.OS === 'web'

// ─── Storage helpers ──────────────────────────────────────────────────────────

function storageRead(): ThemePreference {
  if (isWeb && typeof window !== 'undefined') {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  }
  return 'system'
}

function storageWrite(pref: ThemePreference): void {
  if (isWeb && typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, pref)
  } else {
    AsyncStorage.setItem(STORAGE_KEY, pref).catch(() => {})
  }
}

// ─── Web DOM helper (Twitter-style: toggle class + colorScheme on <html>) ─────
//
// Twitter writes `color-scheme` on <html> and toggles a "dark" class so both
// Tailwind/NativeWind and native CSS `prefers-color-scheme` media queries stay
// in sync without a flash of unstyled content.

function applyToDOM(theme: ResolvedTheme): void {
  if (!isWeb || typeof document === 'undefined') return
  const root = document.documentElement

  // Add transition class for smooth theme changes
  root.classList.add('theme-transitioning')
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme

  // Remove transition class after animation completes
  setTimeout(() => {
    root.classList.remove('theme-transitioning')
  }, 300)
}

// ─── System-theme hook ────────────────────────────────────────────────────────

function useSystemTheme(): ResolvedTheme {
  const getSystem = (): ResolvedTheme => (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light')

  const [system, setSystem] = useState<ResolvedTheme>(getSystem)

  useEffect(() => {
    if (isWeb) {
      // On web, mirror the OS via a media-query listener (most reliable)
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => setSystem(e.matches ? 'dark' : 'light')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }

    // On native, re-read on mount in case Appearance was uninitialized
    // when the useState initializer ran (iOS cold start sometimes returns
    // null briefly). Then subscribe to OS changes via Appearance.
    setSystem(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light')
    const sub = Appearance.addChangeListener(({ colorScheme }) =>
      setSystem(colorScheme === 'dark' ? 'dark' : 'light')
    )
    return () => sub.remove()
  }, [])

  return system
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setColorScheme } = useNativeWindColorScheme()
  const system = useSystemTheme()
  const [preference, setPreferenceState] = useState<ThemePreference>(storageRead)
  const preferenceRef = useRef(preference)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const previousTheme = useRef<ResolvedTheme | null>(null)

  // Keep ref current so async callbacks always see the latest value
  useEffect(() => {
    preferenceRef.current = preference
  }, [preference])

  // ── On native: hydrate from AsyncStorage (web is sync via localStorage) ───
  useEffect(() => {
    if (isWeb) return
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v)
      })
      .catch(() => {})
  }, [])

  // ── Resolve: "system" falls back to OS preference ─────────────────────────
  const theme: ResolvedTheme = preference === 'system' ? system : preference

  // ── Apply to NativeWind + DOM on every change ──────────────────────────────
  useEffect(() => {
    // React Native's native AppearanceModule only accepts concrete color
    // schemes. Keep "system" as the stored preference, but apply the resolved
    // light/dark value on native to avoid Android startup crashes.
    setColorScheme(isWeb ? preference : theme)
    if (isWeb) {
      applyToDOM(theme)
    } else {
      // Native: Smooth crossfade transition (X/Twitter style)
      if (previousTheme.current !== null && previousTheme.current !== theme) {
        // Start at full opacity (showing old theme)
        fadeAnim.setValue(1)
        // Smoothly fade out to reveal new theme underneath
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: supportsNativeDriver,
        }).start()
      }
      previousTheme.current = theme
    }
  }, [theme, preference, setColorScheme, fadeAnim])

  // ── Public setter: update state + persist ─────────────────────────────────
  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref)
    storageWrite(pref)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, preference, setPreference, isDark: theme === 'dark' }),
    [theme, preference, setPreference]
  )

  // On web the <html> class handles everything; on native we need a root View
  // that carries the NativeWind dark-mode class so child components resolve
  // their dark: variants correctly.
  return (
    <ThemeContext.Provider value={value}>
      {isWeb ? (
        children
      ) : (
        <View className={`flex-1${theme === 'dark' ? ' dark' : ''}`} style={{ flex: 1 }}>
          {children}
          {/* Smooth crossfade overlay (X/Twitter style) - shows previous theme color */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: theme === 'dark' ? '#F5F5F4' : '#1A1A1A',
              opacity: fadeAnim,
            }}
          />
        </View>
      )}
    </ThemeContext.Provider>
  )
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
