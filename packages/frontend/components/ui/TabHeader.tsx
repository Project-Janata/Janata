import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Plus, Settings, Bell } from 'lucide-react-native'
import { usePostHog } from 'posthog-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useUser } from '../contexts'
import { useColors } from '../../hooks/useColors'
import { useHeaderAction } from '../contexts/HeaderActionContext'
import Avatar from './Avatar'
import Logo from './Logo'

interface TabHeaderProps {
  title?: string
  showLogo?: boolean
  transparent?: boolean
  pillTitle?: boolean
  borderAvatar?: boolean
  action?: 'create' | 'notifications' | 'settings'
  onActionPress?: () => void
  rightContent?: React.ReactNode
  /**
   * Show the profile avatar as a top-right entry point to `/profile`.
   * Shown on native and on mobile web (matching iOS); desktop web uses its
   * own WebHeader avatar. Defaults to true; pass false on the profile screen.
   */
  showProfile?: boolean
}

export default function TabHeader({
  title,
  showLogo = false,
  transparent = false,
  pillTitle = false,
  borderAvatar: _borderAvatar,
  action,
  onActionPress,
  rightContent,
  showProfile = true,
}: TabHeaderProps) {
  const router = useRouter()
  const { user } = useUser()
  const c = useColors()
  const posthog = usePostHog()
  const { triggerCreate } = useHeaderAction()
  const insets = useSafeAreaInsets()

  const bgColor = transparent ? 'transparent' : c.card
  const textColor = transparent ? '#FFFFFF' : c.text
  const iconColor = transparent ? '#FFFFFF' : c.icon

  const handleActionPress = () => {
    if (onActionPress) return onActionPress()
    switch (action) {
      case 'create':
        posthog?.capture('nav_create_pressed')
        triggerCreate()
        break
      case 'notifications':
        router.push('/notifications' as never)
        break
      case 'settings':
        router.push('/settings' as never)
        break
    }
  }

  const actionIconProps = { size: 20, color: iconColor }
  const ActionIcon = () => {
    if (!action) return null
    switch (action) {
      case 'create':
        return <Plus {...actionIconProps} strokeWidth={2} />
      case 'notifications':
        return <Bell {...actionIconProps} />
      case 'settings':
        return <Settings {...actionIconProps} />
    }
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Math.max(insets.top, 8),
        paddingBottom: 12,
        paddingHorizontal: 16,
        backgroundColor: bgColor,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {showLogo ? (
          <Logo showText size={24} />
        ) : title ? (
          pillTitle ? (
            <View
              style={{
                backgroundColor: transparent ? 'rgba(0,0,0,0.55)' : c.surface,
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 6,
              }}
            >
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: textColor }}>
                {title}
              </Text>
            </View>
          ) : (
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 22, color: textColor }}>
              {title}
            </Text>
          )
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {rightContent}
        {action && (
          <Pressable
            onPress={handleActionPress}
            accessibilityRole="button"
            accessibilityLabel={
              action === 'create'
                ? 'Create'
                : action === 'notifications'
                  ? 'Notifications'
                  : 'Settings'
            }
            hitSlop={8}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: transparent
                ? 'rgba(0,0,0,0.35)'
                : c.surface,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <ActionIcon />
          </Pressable>
        )}
        {showProfile && user && (
          <Pressable
            onPress={() => {
              posthog?.capture('nav_profile_opened')
              router.push('/profile')
            }}
            accessibilityRole="button"
            accessibilityLabel="Profile"
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Avatar
              image={user.profileImage ?? undefined}
              name={
                user.firstName
                  ? `${user.firstName} ${user.lastName ?? ''}`.trim()
                  : user.username
              }
              size={32}
              style={
                transparent ? { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)' } : undefined
              }
            />
          </Pressable>
        )}
      </View>
    </View>
  )
}
