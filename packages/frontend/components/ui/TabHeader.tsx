import React from 'react'
import { View, Text, Pressable, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { Plus, User, Settings, Bell } from 'lucide-react-native'
import { usePostHog } from 'posthog-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useUser, useTheme } from '../contexts'
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
}

export default function TabHeader({
  title,
  showLogo = false,
  transparent = false,
  pillTitle = false,
  borderAvatar = false,
  action,
  onActionPress,
}: TabHeaderProps) {
  const router = useRouter()
  const { user } = useUser()
  const { isDark } = useTheme()
  const posthog = usePostHog()
  const { triggerCreate } = useHeaderAction()
  const insets = useSafeAreaInsets()

  const bgColor = transparent ? 'transparent' : isDark ? '#262626' : '#FFFFFF'
  const textColor = transparent ? '#FFFFFF' : isDark ? '#FAFAFA' : '#1C1917'
  const iconColor = transparent ? '#FFFFFF' : isDark ? '#FAFAFA' : '#1C1917'
  const btnBorderColor = transparent ? 'rgba(255,255,255,0.4)' : isDark ? '#404040' : '#D6D3D1'

  const displayName =
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || ''

  const profileImage = user?.profileImage

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

  const ActionIcon = () => {
    if (!action) return null
    const iconProps = { size: 18, color: iconColor }
    switch (action) {
      case 'create':
        return <Plus {...iconProps} strokeWidth={2} />
      case 'notifications':
        return <Bell {...iconProps} />
      case 'settings':
        return <Settings {...iconProps} />
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
      {/* Left: Title or Logo */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {showLogo ? (
          <Logo showText size={24} />
        ) : title ? (
          pillTitle ? (
            <View
              style={{
                backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inclusive Sans',
                  fontSize: 16,
                  color: isDark ? '#FAFAFA' : '#1C1917',
                }}
              >
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

      {/* Right: Action button + Avatar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {action ? (
          <Pressable
            onPress={handleActionPress}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: btnBorderColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActionIcon />
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}
