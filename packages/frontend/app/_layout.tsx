import '@expo/metro-runtime'
import { useEffect, useRef } from 'react'
import { ActivityIndicator, Animated, LogBox, Platform, Text, View } from 'react-native'

// Suppress non-fatal WorkletsTurboModule error in Expo Go (reanimated v4 compat)
LogBox.ignoreLogs(['Exception in HostFunction: <unknown>'])
import {
  InclusiveSans_300Light,
  InclusiveSans_400Regular,
  InclusiveSans_500Medium,
  InclusiveSans_600SemiBold,
  InclusiveSans_700Bold,
} from '@expo-google-fonts/inclusive-sans'
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
import '../globals.css'

export const unstable_settings = {
  initialRouteName: '(tabs)',
}

SplashScreen.preventAutoHideAsync()

const posthogHost =
  process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY
const posthogEnabled = posthogKey && posthogKey.trim().length > 0

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inclusive Sans': InclusiveSans_400Regular,
    'Inclusive Sans Bold': InclusiveSans_700Bold,
    'Inclusive Sans SemiBold': InclusiveSans_600SemiBold,
    'Inclusive Sans Medium': InclusiveSans_500Medium,
    'Inclusive Sans Light': InclusiveSans_300Light,
    'Inter': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'Inter SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter Light': require('../assets/fonts/Inter-Light.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded) {
      // Set default font family for all Text components
      const TextAny = Text as any
      const defaultProps = TextAny.defaultProps || {}
      TextAny.defaultProps = {
        ...defaultProps,
        style: [{ fontFamily: 'Inclusive Sans' }, defaultProps.style],
      }
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  return posthogEnabled ? (
    <PostHogProvider
      apiKey={posthogKey!.trim()}
      options={{
        host: posthogHost,
      }}
    >
      <ErrorBoundary>
        <CustomThemeProvider>
          <UserProvider>
            <RootLayoutNav />
          </UserProvider>
        </CustomThemeProvider>
      </ErrorBoundary>
    </PostHogProvider>
  ) : (
    <ErrorBoundary>
      <CustomThemeProvider>
        <UserProvider>
          <RootLayoutNav />
        </UserProvider>
      </CustomThemeProvider>
    </ErrorBoundary>
  )
}

function RootLayoutNav() {
  const { user, loading } = useUser()
  const { isDark } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const isAuthenticated = !!user

  useEffect(() => {
    if (loading) return

    const inAuthGroup = pathname.startsWith('/auth')
    const inOnboardingGroup = pathname.startsWith('/onboarding')
    const inLandingPage = pathname === '/landing'

    if (!isAuthenticated) {
      // Allow public pages through without redirect
      const isPublicPage =
        inAuthGroup ||
        inLandingPage ||
        pathname === '/' ||
        pathname.startsWith('/(tabs)') ||
        pathname.startsWith('/events/') ||
        pathname.startsWith('/center/') ||
        pathname.startsWith('/privacy') ||
        pathname.startsWith('/terms') ||
        pathname.startsWith('/cookies')

      if (!isPublicPage) {
        router.replace('/landing')
      }
    } else {
      // User IS authenticated

      // Check for completion flag OR fallback to checking fields
      const isComplete =
        user.profileComplete || (!!user.firstName && !!user.lastName)

      if (!isComplete) {
        // User needs to onboard
        if (!inOnboardingGroup) {
          router.replace('/onboarding')
        }
      } else {
        // User is fully onboarded
        if (inAuthGroup || inOnboardingGroup) {
          // Redirect away from auth/onboarding pages to Home
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ea580c" />
      </View>
    )
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <NavigationThemeProvider value={navTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="landing" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="events/index" options={{ headerShown: true, title: 'My Events', headerBackTitle: '' }} />
          <Stack.Screen name="events/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="events/form" options={{ headerShown: false }} />
          <Stack.Screen name="center/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="privacy" options={{ headerShown: Platform.OS !== 'web', title: 'Privacy Policy', headerBackTitle: '' }} />
          <Stack.Screen name="terms" options={{ headerShown: Platform.OS !== 'web', title: 'Terms of Service', headerBackTitle: '' }} />
          <Stack.Screen name="cookies" options={{ headerShown: Platform.OS !== 'web', title: 'Cookie Policy', headerBackTitle: '' }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
        </Stack>
      </NavigationThemeProvider>
    </Animated.View>
  )
}
