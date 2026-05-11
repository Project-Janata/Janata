import React from 'react'
import { View, Text, Pressable, Platform } from 'react-native'
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
  const btnBorder = transparent ? 'rgba(255,255,255,0.4)' : c.border

  const handleActionPress = () => {
    if (onActionPress) return onActionPress()
    switch (action) {
      case 'create':        posthog?.capture('nav_create_pressed'); triggerCreate(); break
      case 'notifications': router.push('/notifications' as never); break
      case 'settings':      router.push('/settings' as never); break
    }
  }

  const actionIconProps = { size: 18, color: iconColor }
  const ActionIcon = () => {
    if (!action) return null
    switch (action) {
      case 'create':        return <Plus {...actionIconProps} strokeWidth={2} />
      case 'notifications': return <Bell {...actionIconProps} />
      case 'settings':      return <Settings {...actionIconProps} />
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
            <View style={{ backgroundColor: transparent ? 'rgba(0,0,0,0.55)' : c.surface, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 }}>
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: textColor }}>{title}</Text>
            </View>
          ) : (
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 22, color: textColor }}>{title}</Text>
          )
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {rightContent}
        {action && (
          <Pressable
            onPress={handleActionPress}
            style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: btnBorder, alignItems: 'center', justifyContent: 'center' }}
          >
            <ActionIcon />
          </Pressable>
        )}
      </View>
    </View>
  )
}
