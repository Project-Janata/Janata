import { View, Text, Pressable } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { House, Compass, Newspaper, Chat } from 'phosphor-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useUser } from '../contexts'
import Avatar from './Avatar'
import { useColors } from '../../hooks/useColors'

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: House },
  { label: 'Explore', href: '/explore', icon: Compass },
  { label: 'Feed', href: '/feed', icon: Newspaper },
  { label: 'Messages', href: '/chat', icon: Chat },
  { label: 'Profile', href: '/profile', icon: null },
] as const

export default function WebBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useUser()
  const c = useColors()
  const insets = useSafeAreaInsets()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const ACTIVE = c.accent
  const inactive = c.iconMuted

  return (
    <View
      style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: c.border,
        backgroundColor: c.rail,
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
