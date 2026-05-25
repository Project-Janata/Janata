import { View, Text, Pressable } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { House, Compass, Newspaper, MessageSquare } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useUser, useTheme } from '../contexts'
import Avatar from './Avatar'

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: House },
  { label: 'Explore', href: '/explore', icon: Compass },
  { label: 'Feed', href: '/feed', icon: Newspaper },
  { label: 'Messages', href: '/chat', icon: MessageSquare },
  { label: 'Profile', href: '/profile', icon: null },
] as const

export default function WebBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const { isDark } = useTheme()
  const insets = useSafeAreaInsets()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const ACTIVE = '#E8862A'
  const inactive = isDark ? '#A8A29E' : '#78716C'

  return (
    <View
      style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: isDark ? '#262626' : '#E7E5E4',
        backgroundColor: isDark ? '#171717' : '#FFFFFF',
        paddingTop: 8,
        paddingBottom: Math.max(insets.bottom, 8),
      }}
    >
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const on = isActive(href)
        const color = on ? ACTIVE : inactive
        return (
          <Pressable
            key={href}
            onPress={() => router.push(href as never)}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }}
          >
            {href === '/profile' ? (
              <Avatar
                image={user?.profileImage ?? undefined}
                name={
                  user?.firstName
                    ? `${user.firstName} ${user.lastName ?? ''}`.trim()
                    : user?.username
                }
                size={24}
                style={{ borderWidth: on ? 2 : 0, borderColor: ACTIVE }}
              />
            ) : Icon ? (
              <Icon size={24} color={color} />
            ) : null}
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 10, color }}>{label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}
