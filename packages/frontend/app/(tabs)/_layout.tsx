import { Link, Tabs, useRouter } from 'expo-router'
import { Platform, View, Text, Pressable, Image, StatusBar } from 'react-native'
import { useState, useEffect } from 'react'
import { useUser, useTheme } from '../../components/contexts'
import { MessagesSquare, Newspaper, Plus, User } from 'lucide-react-native'
import SettingsPanel from '../../components/SettingsPanel'
import Logo from '../../components/ui/Logo'
import { Avatar } from '../../components/ui'
import { usePostHog } from 'posthog-react-native'
import { Home, Compass } from 'lucide-react-native'

/**
 * TabLayout Component - The main layout for the tab-based navigation.
 * @return {JSX.Element} A TabLayout component that sets up tab navigation with theming.
 */

export default function TabLayout() {
  const router = useRouter()
  const { user, loading, logout } = useUser()
  const { isDark } = useTheme()
  const [settingsVisible, setSettingsVisible] = useState(false)
  // Beta: any signed-in user can create events. Backend enforces auth-only;
  // post-beta this becomes a coordinator-tier gate (issue #177).
  const canCreate = !!user
  const posthog = usePostHog()

  useEffect(() => {
    if (Platform.OS !== 'web' && !loading && !user) {
      router.replace('/auth')
    }
  }, [user, loading])

  const handleLogout = async () => {
    posthog?.capture('nav_logout')
    await logout()
    router.replace('/auth')
  }

  // Custom header for web - just the logo
  const HeaderTitle = () => {
    if (Platform.OS !== 'web') {
      return null // Use default title on mobile
    }

    return (
      <View className="flex-row items-center">
        <Logo size={28} />
      </View>
    )
  }

  const HeaderRight = () => {
    if (!user) {
      if (Platform.OS !== 'web') {
        return (
          <Pressable className="mr-4 p-1" onPress={() => router.push('/auth')}>
            <Avatar name="Sign In" size={36} />
          </Pressable>
        )
      }
      return (
        <Pressable
          accessibilityLabel="Sign in or sign up"
          onPress={() => {
            posthog?.capture('nav_signin_icon')
            router.push('/auth')
          }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: isDark ? '#404040' : '#D6D3D1',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
          }}
        >
          <User size={18} color={isDark ? '#FAFAFA' : '#1C1917'} />
        </Pressable>
      )
    }
    if (Platform.OS === 'web') {
      const webProfileImage = user?.profileImage
      const getInitials = () => {
        if (user?.firstName && user?.lastName)
          return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
        if (user?.firstName) return user.firstName[0].toUpperCase()
        if (user?.username) return user.username[0].toUpperCase()
        return '?'
      }

      return (
        <View className="flex-row items-center" style={{ gap: 8 }}>
          {canCreate && (
            <Pressable
              className="px-3 py-2 rounded-full flex-row items-center"
              style={{
                borderWidth: 1.5,
                borderColor: '#E8862A',
                backgroundColor: 'transparent',
                gap: 6,
              }}
              onPress={() => {
                posthog?.capture('nav_create_event')
                if (typeof window !== 'undefined') {
                  const isMobile = window.innerWidth < 768
                  if (isMobile) {
                    router.push('/events/form')
                  } else {
                    window.dispatchEvent(new CustomEvent('open-event-form'))
                  }
                }
              }}
            >
              <Plus size={16} color="#E8862A" />
              <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: '#E8862A' }}>
                Create Event
              </Text>
            </Pressable>
          )}
          <Pressable
            className="mr-4 rounded-full overflow-hidden"
            style={{ width: 36, height: 36 }}
            onPress={() => {
              posthog?.capture('nav_menu_opened')
              setSettingsVisible(true)
            }}
          >
            {webProfileImage ? (
              <Image source={{ uri: webProfileImage }} style={{ width: 36, height: 36 }} />
            ) : (
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#C2410C',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                  {getInitials()}
                </Text>
              </View>
            )}
          </Pressable>
          <SettingsPanel
            visible={settingsVisible}
            onClose={() => setSettingsVisible(false)}
            onLogout={handleLogout}
          />
        </View>
      )
    }

    // Native: tap profile → go directly to settings page (index.native.tsx)
    const displayName =
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.username || ''
    const profileImage = user?.profileImage

    return (
      <Pressable
        className="mr-4 p-2"
        onPress={() => {
          posthog?.capture('nav_menu_opened')
          router.push('/settings/preferences')
        }}
      >
        <Avatar image={profileImage || undefined} name={displayName} size={36} />
      </Pressable>
    )
  }

  return (
    <>
      {Platform.OS !== 'web' && (
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
      )}
      <Tabs
        screenOptions={{
          tabBarStyle:
            Platform.OS === 'ios' || Platform.OS === 'android'
              ? {
                  display: 'flex',
                  paddingTop: 6,
                  paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                  height: Platform.OS === 'ios' ? 80 : 60,
                }
              : undefined,
          tabBarItemStyle: {
            paddingVertical: 2,
          },
          tabBarLabelStyle: {
            marginTop: 1,
            fontSize: 10,
          },
          tabBarActiveTintColor: '#E8862A',
          tabBarInactiveTintColor: isDark ? '#A1A1AA' : '#4B5563',
          headerStyle: {
            backgroundColor: Platform.OS === 'web' ? (isDark ? '#171717' : '#fff') : 'transparent',
            borderBottomWidth: Platform.OS === 'web' ? 1 : 0,
            borderBottomColor:
              Platform.OS === 'web' ? (isDark ? '#262626' : '#E5E7EB') : 'transparent',
          },
          headerTitleStyle: {
            fontFamily: 'Inter-Bold',
          },
          headerTintColor: isDark ? '#fff' : '#000',
          headerTitle: Platform.OS === 'web' ? () => <HeaderTitle /> : undefined,
          headerTransparent: Platform.OS !== 'web',
          headerShadowVisible: Platform.OS === 'web',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
            headerRight: () => <HeaderRight />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
            headerRight: () => <HeaderRight />,
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            href: '/feed',
            title: 'Feed',
            tabBarIcon: ({ color, size }) => <Newspaper size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="connect"
          options={{
            href: '/connect',
            title: 'Connect',
            tabBarIcon: ({ color, size }) => <MessagesSquare size={size} color={color} />,
          }}
        />
      </Tabs>
    </>
  )
}
