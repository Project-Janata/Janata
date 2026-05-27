import '@expo/metro-runtime'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, LogBox, Platform, Text, View, useWindowDimensions } from 'react-native'

// Suppress non-fatal WorkletsTurboModule error in Expo Go (reanimated v4 compat)
LogBox.ignoreLogs(['Exception in HostFunction: <unknown>'])
import {
  InclusiveSans_300Light,
  InclusiveSans_400Regular,
  InclusiveSans_500Medium,
  InclusiveSans_600SemiBold,
  InclusiveSans_700Bold,
} from '@expo-google-fonts/inclusive-sans'
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono'
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { SplashScreen, Stack, usePathname, useRouter } from 'expo-router'
import { PostHogProvider } from 'posthog-react-native'
import {
  UserProvider,
  useUser,
  ThemeProvider as CustomThemeProvider,
  useTheme,
} from '../components/contexts'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import WebBottomNav from '../components/ui/WebBottomNav'
import '../globals.css'

export const unstable_settings = {
  initialRouteName: '(tabs)',
}

SplashScreen.preventAutoHideAsync()

const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY
const posthogEnabled = posthogKey && posthogKey.trim().length > 0

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inclusive Sans': InclusiveSans_400Regular,
    'Inclusive Sans Bold': InclusiveSans_700Bold,
    'Inclusive Sans SemiBold': InclusiveSans_600SemiBold,
    'Inclusive Sans Medium': InclusiveSans_500Medium,
    'Inclusive Sans Light': InclusiveSans_300Light,
    'JetBrains Mono': JetBrainsMono_400Regular,
    'JetBrains Mono Bold': JetBrainsMono_700Bold,
  })

  const readyFlags = useRef({ auth: false, minTime: false })
  const hideStarted = useRef(false)

  const tryHide = useCallback(() => {
    if (hideStarted.current) return
    if (!readyFlags.current.auth || !readyFlags.current.minTime) return
    hideStarted.current = true
    SplashScreen.hideAsync().catch(() => {})
  }, [])

  useEffect(() => {
    if (!fontsLoaded) return
    const TextAny = Text as any
    const defaultProps = TextAny.defaultProps || {}
    TextAny.defaultProps = {
      ...defaultProps,
      style: [{ fontFamily: 'Inclusive Sans' }, defaultProps.style],
    }
    const timer = setTimeout(() => {
      readyFlags.current.minTime = true
      tryHide()
    }, 3000)
    return () => clearTimeout(timer)
  }, [fontsLoaded, tryHide])

  const handleAuthReady = useCallback(() => {
    readyFlags.current.auth = true
    tryHide()
  }, [tryHide])

  if (!fontsLoaded) return null

  return posthogEnabled ? (
    <PostHogProvider apiKey={posthogKey!.trim()} options={{ host: posthogHost }}>
      <ErrorBoundary>
        <CustomThemeProvider>
          <UserProvider>
            <RootLayoutNav onAuthReady={handleAuthReady} />
          </UserProvider>
        </CustomThemeProvider>
      </ErrorBoundary>
    </PostHogProvider>
  ) : (
    <ErrorBoundary>
      <CustomThemeProvider>
        <UserProvider>
          <RootLayoutNav onAuthReady={handleAuthReady} />
        </UserProvider>
      </CustomThemeProvider>
    </ErrorBoundary>
  )
}

function RootLayoutNav({ onAuthReady }: { onAuthReady: () => void }) {
  const { user, loading } = useUser()
  const { isDark } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const isAuthenticated = !!user
  const { width } = useWindowDimensions()
  // Mirrors the desktop WebHeader, which shows its nav regardless of auth —
  // only hide on the full-screen landing/auth/onboarding flows.
  const showBottomNav =
    Platform.OS === 'web' &&
    width < 768 &&
    !pathname.startsWith('/auth') &&
    !pathname.startsWith('/onboarding') &&
    pathname !== '/landing'

  useEffect(() => {
    if (!loading) {
      onAuthReady()
    }
  }, [loading, onAuthReady])

  useEffect(() => {
    if (loading) return

    const inAuthGroup = pathname.startsWith('/auth')
    const inOnboardingGroup = pathname.startsWith('/onboarding')
    const inLandingPage = pathname === '/landing'

    if (!isAuthenticated) {
      const isPublicPage =
        inAuthGroup ||
        inLandingPage ||
        pathname === '/' ||
        pathname.startsWith('/(tabs)') ||
        pathname === '/explore' ||
        pathname.startsWith('/explore/') ||
        pathname === '/feed' ||
        pathname.startsWith('/feed/') ||
        pathname.startsWith('/events/') ||
        pathname.startsWith('/center/') ||
        pathname.startsWith('/privacy') ||
        pathname.startsWith('/terms') ||
        pathname.startsWith('/cookies')

      if (!isPublicPage) {
        router.replace('/landing')
      }
    } else {
      const isComplete = user.profileComplete || (!!user.firstName && !!user.lastName)

      if (!isComplete) {
        if (!inOnboardingGroup) {
          router.replace('/onboarding')
        }
      } else {
        if (inAuthGroup || inOnboardingGroup) {
          router.replace('/')
        }
      }
    }
  }, [user, loading, pathname, isAuthenticated])

  const navTheme = isDark ? DarkTheme : DefaultTheme
  const prevIsDark = useRef(isDark)
  const fadeAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (prevIsDark.current !== isDark) {
      prevIsDark.current = isDark
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start()
    }
  }, [isDark, fadeAnim])

  if (loading) return null

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <NavigationThemeProvider value={navTheme}>
        <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="landing" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen
            name="events/index"
            options={{ headerShown: true, title: 'My Events', headerBackTitle: '' }}
          />
          <Stack.Screen name="events/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="events/form" options={{ headerShown: false }} />
          <Stack.Screen name="center/[id]" options={{ headerShown: false }} />
          <Stack.Screen
            name="privacy"
            options={{
              headerShown: Platform.OS !== 'web',
              title: 'Privacy Policy',
              headerBackTitle: '',
            }}
          />
          <Stack.Screen
            name="terms"
            options={{
              headerShown: Platform.OS !== 'web',
              title: 'Terms of Service',
              headerBackTitle: '',
            }}
          />
          <Stack.Screen
            name="cookies"
            options={{
              headerShown: Platform.OS !== 'web',
              title: 'Cookie Policy',
              headerBackTitle: '',
            }}
          />
          <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
          <Stack.Screen name="center-picker" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
        </Stack>
        </View>
        {showBottomNav && <WebBottomNav />}
      </NavigationThemeProvider>
    </Animated.View>
  )
}
