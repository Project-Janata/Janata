import React from 'react'
import { View, Text, Pressable, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { Plus, User } from 'lucide-react-native'
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
  showPlus?: boolean
  onPlusPress?: () => void
  rightContent?: React.ReactNode
}

export default function TabHeader({
  title,
  showLogo = false,
  transparent = false,
  pillTitle = false,
  borderAvatar = false,
  showPlus = false,
  onPlusPress,
  rightContent,
}: TabHeaderProps) {
  const router = useRouter()
  const { user } = useUser()
  const { isDark } = useTheme()
  const posthog = usePostHog()
  const { triggerCreate } = useHeaderAction()
  const insets = useSafeAreaInsets()

  const bgColor = transparent ? 'transparent' : isDark ? '#000000' : '#FFFFFF'
  const textColor = transparent ? '#FFFFFF' : isDark ? '#FAFAF9' : '#1F1D1B'

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || ''

  const profileImage = user?.profileImage

  const handleProfilePress = () => {
    posthog?.capture('nav_menu_opened')
    if (Platform.OS === 'web') {
      // web handled by rightContent
    } else {
      router.push('/settings/preferences')
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
                  color: isDark ? '#FAFAF9' : '#1F1D1B',
                }}
              >
                {title}
              </Text>
            </View>
          ) : (
            <Text
              style={{
                fontFamily: 'Inclusive Sans',
                fontSize: 22,
                color: textColor,
              }}
            >
              {title}
            </Text>
          )
        ) : null}
      </View>

      {/* Right: Actions + Profile */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {rightContent}
        {showPlus ? (
          <Pressable
            onPress={onPlusPress || triggerCreate}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: transparent
                ? 'rgba(255,255,255,0.4)'
                : isDark
                  ? '#404040'
                  : '#D6D3D1',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus
              size={18}
              color={transparent ? '#FFFFFF' : isDark ? '#FAFAF9' : '#1C1917'}
              strokeWidth={2}
            />
          </Pressable>
        ) : null}
        {user ? (
          <Pressable
            onPress={handleProfilePress}
            style={
              borderAvatar
                ? {
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                    overflow: 'hidden',
                  }
                : undefined
            }
          >
            <Avatar
              image={profileImage || undefined}
              name={displayName}
              size={36}
            />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => router.push('/auth')}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: transparent
                ? 'rgba(255,255,255,0.4)'
                : isDark
                  ? '#404040'
                  : '#D6D3D1',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User
              size={18}
              color={transparent ? '#FFFFFF' : isDark ? '#FAFAFA' : '#1C1917'}
            />
          </Pressable>
        )}
      </View>
    </View>
  )
}
