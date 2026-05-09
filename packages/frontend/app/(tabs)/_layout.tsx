import { Tabs, usePathname, useRouter } from 'expo-router'
import { Platform, View, Text, Pressable, Image, StatusBar } from 'react-native'
import { useState, useEffect } from 'react'
import { useUser, useTheme } from '../../components/contexts'
import { HeaderActionProvider } from '../../components/contexts/HeaderActionContext'
import { House, MessageSquare, Newspaper, Compass, Plus, User, Bell } from 'lucide-react-native'
import SettingsPanel from '../../components/SettingsPanel'
import Logo from '../../components/ui/Logo'
import TabHeader from '../../components/ui/TabHeader'
import { Avatar } from '../../components/ui'
import { usePostHog } from 'posthog-react-native'

export default function TabLayout() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, logout } = useUser()
  const { isDark } = useTheme()
  const [settingsVisible, setSettingsVisible] = useState(false)
  const canCreate = !!user
  const posthog = usePostHog()
  const tabBarShowLabel = Platform.OS === 'web'

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

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Explore', href: '/explore' },
    { label: 'Feed', href: '/feed' },
    { label: 'Messages', href: '/chat' },
  ] as const

  const isRouteActive = (href: (typeof navItems)[number]['href']) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const WebHeader = () => {
    const webProfileImage = user?.profileImage
    const getInitials = () => {
      if (user?.firstName && user?.lastName)
        return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      if (user?.firstName) return user.firstName[0].toUpperCase()
      if (user?.username) return user.username[0].toUpperCase()
      return '?'
    }

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          height: 56,
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#262626' : '#E5E7EB',
        }}
      >
        {/* Left: Logo + Nav */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
          <Pressable
            onPress={() => router.push('/')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <Logo size={28} />
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {navItems.map(({ label, href }) => {
              const active = isRouteActive(href)
              return (
                <Pressable
                  key={href}
                  onPress={() => router.push(href)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: active
                      ? isDark
                        ? 'rgba(232,134,42,0.16)'
                        : '#FFF7ED'
                      : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: active ? 'Inclusive Sans' : 'Inclusive Sans',
                      fontSize: 14,
                      color: active ? '#E8862A' : isDark ? '#E7E5E4' : '#44403C',
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* Right: Actions + Profile */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {canCreate && (
            <Pressable
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                borderWidth: 1.5,
                borderColor: '#E8862A',
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
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: '#E8862A' }}>
                Create Event
              </Text>
            </Pressable>
          )}
          <Pressable
            style={{ width: 36, height: 36, borderRadius: 18, overflow: 'hidden' }}
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
      </View>
    )
  }

  const isWeb = Platform.OS === 'web'

  return (
    <>
      {Platform.OS !== 'web' && (
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
      )}
      <HeaderActionProvider>
        <Tabs
          screenOptions={{
            tabBarStyle: isWeb
              ? { display: 'none' }
              : {
                  backgroundColor: isDark ? '#171717' : '#FFFFFF',
                  borderTopColor: isDark ? '#262626' : '#E7E5E4',
                  height: 84,
                  paddingTop: 8,
                  paddingBottom: 24,
                },
            tabBarActiveTintColor: '#E8862A',
            tabBarInactiveTintColor: isDark ? '#A8A29E' : '#78716C',
            headerShown: true,
            headerShadowVisible: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              tabBarShowLabel: tabBarShowLabel,
              title: 'Home',
              header: isWeb
                ? () => <WebHeader />
                : () => (
                    <TabHeader
                      showLogo
                      rightContent={
                        <Pressable
                          onPress={() => router.push('/chat')}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            borderWidth: 1.5,
                            borderColor: isDark ? '#404040' : '#D6D3D1',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Bell size={17} color={isDark ? '#FAFAF9' : '#1C1917'} />
                        </Pressable>
                      }
                    />
                  ),
              tabBarIcon: ({ color, size }) => <House size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="explore"
            options={{
              tabBarShowLabel: false,
              title: 'Explore',
              headerTransparent: !isWeb,
              header: isWeb
                ? () => <WebHeader />
                : () => <TabHeader title="Explore" transparent pillTitle borderAvatar />,
              tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="feed"
            options={{
              tabBarShowLabel: false,
              title: 'Feed',
              header: isWeb ? () => <WebHeader /> : () => <TabHeader title="Feed" showPlus />,
              tabBarIcon: ({ color, size }) => <Newspaper size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="chat"
            options={{
              tabBarShowLabel: false,
              title: 'Chat',
              header: isWeb ? () => <WebHeader /> : () => <TabHeader title="Chat" showPlus />,
              tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
            }}
          />
        </Tabs>
      </HeaderActionProvider>
    </>
  )
}
