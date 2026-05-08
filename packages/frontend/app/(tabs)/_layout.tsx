import { Tabs, useRouter } from 'expo-router'
import { Platform, StatusBar } from 'react-native'
import { useEffect } from 'react'
import { useUser, useTheme } from '../../components/contexts'
import { HeaderActionProvider } from '../../components/contexts/HeaderActionContext'
import { House, MessageSquare, Newspaper, Compass } from 'lucide-react-native'
import TabHeader from '../../components/ui/TabHeader'
import { usePostHog } from 'posthog-react-native'

/**
 * TabLayout Component - The main layout for the tab-based navigation.
 * @return {JSX.Element} A TabLayout component that sets up tab navigation with theming.
 */

export default function TabLayout() {
  const router = useRouter()
  const { user, loading } = useUser()
  const { isDark } = useTheme()
  const posthog = usePostHog()

  useEffect(() => {
    if (Platform.OS !== 'web' && !loading && !user) {
      router.replace('/auth')
    }
  }, [user, loading])

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
            tabBarStyle:
              Platform.OS === 'web'
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
              title: 'Home',
              header: () => <TabHeader showLogo />,
              tabBarIcon: ({ color, size }) => <House size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="explore"
            options={{
              title: 'Explore',
              headerTransparent: true,
              header: () => <TabHeader title="Explore" transparent pillTitle borderAvatar />,
              tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="feed"
            options={{
              title: 'Feed',
              header: () => <TabHeader title="Feed" showPlus />,
              tabBarIcon: ({ color, size }) => <Newspaper size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="chat"
            options={{
              title: 'Chat',
              header: () => <TabHeader title="Chat" showPlus />,
              tabBarIcon: ({ color, size }) => <MessageSquare size={size} color={color} />,
            }}
          />
        </Tabs>
      </HeaderActionProvider>
    </>
  )
}
