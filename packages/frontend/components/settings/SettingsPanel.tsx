import React, { useEffect, useRef, useState } from 'react'
import { Animated, Text, Pressable, View, Image, Easing } from 'react-native'
import { useUser, useTheme } from '../contexts'
import { GearSix, SignOut, Sun, Moon, User, Monitor, Shield } from 'phosphor-react-native'
import { router, usePathname } from 'expo-router'
import ThemeSelector from './ThemeSelector'
import { Avatar } from '../ui'
import { isSuperAdmin } from '../../utils/admin'
import { useColors } from '../../hooks/useColors'

function SettingsPanel({ visible, onClose, onLogout }) {
  const opacityAnim = useRef(new Animated.Value(0)).current
  const translateYAnim = useRef(new Animated.Value(-20)).current
  const { user } = useUser()
  const { preference: themePreference, setPreference: setThemePreference, isDark } = useTheme()
  const c = useColors()
  const pathname = usePathname()
  const themeOptions = ['light', 'dark', 'system']
  const optionWidth = 70
  const indicatorPadding = 8
  const [selectedIndex, setSelectedIndex] = useState(themeOptions.indexOf(themePreference))
  const slideAnim = useRef(new Animated.Value(selectedIndex * optionWidth)).current
  const previousTheme = useRef(isDark)
  const isMountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // Stop all animations immediately on unmount
      opacityAnim.stopAnimation()
      translateYAnim.stopAnimation()
      slideAnim.stopAnimation()
    }
  }, [opacityAnim, translateYAnim, slideAnim])

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible])

  useEffect(() => {
    const idx = themeOptions.indexOf(themePreference)
    setSelectedIndex(idx)
    Animated.timing(slideAnim, {
      toValue: idx * optionWidth,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease),
    }).start()
  }, [themePreference])

  // Stop animations when theme changes
  useEffect(() => {
    if (previousTheme.current !== isDark) {
      opacityAnim.stopAnimation()
      translateYAnim.stopAnimation()

      // Set to final values to prevent flickering
      opacityAnim.setValue(1)
      translateYAnim.setValue(0)

      previousTheme.current = isDark
    }
  }, [isDark])

  if (!visible) return null

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.username || 'User'

  const profileImage = user?.profileImage
  const getInitials = () => {
    if (user?.firstName && user?.lastName)
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    if (user?.firstName) return user.firstName[0].toUpperCase()
    if (user?.username) return user.username[0].toUpperCase()
    return '?'
  }

  return (
    <>
      {/* Backdrop. position: 'fixed' is web CSS — honored by react-native-web
          at runtime but not in RN's ViewStyle type. This component renders
          inside WebHeader (web-only branch in app/(tabs)/_layout.tsx), so
          the cast is safe. */}
      <Pressable
        style={{
          position: 'fixed' as 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99,
        }}
        onPress={onClose}
      />

      {/* Settings Panel */}
      <Animated.View
        style={{
          position: 'fixed' as 'absolute',
          top: 56,
          right: 16,
          zIndex: 100,
          width: 248,
          backgroundColor: c.surface,
          borderColor: c.border,
          borderWidth: 1,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 8,
          padding: 16,
          elevation: 8,
          opacity: opacityAnim,
          transform: [{ translateY: translateYAnim }],
        }}
      >
        {/* Profile Info */}
        <View className="flex-row items-center mb-3">
          <Avatar
            image={profileImage || undefined}
            name={displayName}
            size={32}
            style={{ marginRight: 12 }}
          />
          <View className="flex-col flex-1">
            <Text className="text-lg font-sans text-content dark:text-content-dark -mb-0.5">
              {displayName}
            </Text>
            <Text
              className="text-sm font-sans text-contentStrong dark:text-contentStrong-dark"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {user?.username}
            </Text>
          </View>
        </View>

        {/* Separator Line */}
        <View className="h-[1px] bg-gray-200 dark:bg-neutral-800 mb-3" />

        {/* Profile Button */}
        <Pressable
          className={`flex-row items-center mb-2 p-2 rounded-lg ${
            pathname === '/settings/profile'
              ? 'bg-primary'
              : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
          }`}
          onPress={() => {
            onClose()
            router.push('/profile')
          }}
        >
          <User
            size={16}
            color={pathname === '/settings/profile' ? '#fff' : c.text}
            className="mr-3"
          />
          <Text
            className={`font-sans ${
              pathname === '/settings/profile'
                ? 'text-white font-sans'
                : 'text-content dark:text-content-dark'
            }`}
          >
            Profile
          </Text>
        </Pressable>
        <Pressable
          className={`flex-row items-center mb-2 p-2 rounded-lg ${
            pathname === '/settings/preferences'
              ? 'bg-primary'
              : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
          }`}
          onPress={() => {
            onClose()
            router.push('/settings/preferences')
          }}
        >
          <GearSix
            size={16}
            color={pathname === '/settings/preferences' ? '#fff' : c.text}
            className="mr-3"
          />
          <Text
            className={`font-sans ${
              pathname === '/settings/preferences'
                ? 'text-white font-sans'
                : 'text-content dark:text-content-dark'
            }`}
          >
            Preferences
          </Text>
        </Pressable>
        {isSuperAdmin(user) && (
          <Pressable
            className="flex-row items-center mb-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
            onPress={() => {
              onClose()
              router.push('/admin' as any)
            }}
          >
            <Shield size={16} color={c.accent} className="mr-3" />
            <Text style={{ fontFamily: 'Inclusive Sans', color: c.accent }}>Admin Dashboard</Text>
          </Pressable>
        )}

        {/* Separator Line */}
        <View className="h-[1px] bg-gray-200 dark:bg-neutral-800 mb-2" />

        {/* Appearance Slider */}
        <View className="mb-3">
          <Text className="text-sm font-sans text-content dark:text-content-dark mb-2">
            Appearance
          </Text>
          <ThemeSelector
            className="relative flex-row bg-gray-100 dark:bg-neutral-800 rounded-lg p-1"
            style={{ width: 218 }}
          />
        </View>

        {/* Separator Line */}
        <View className="h-[1px] bg-gray-200 dark:bg-neutral-800 mb-2" />

        {/* Log Out Button */}
        <Pressable
          onPress={onLogout}
          className="flex-row items-center p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <SignOut size={16} color={c.error} className="mr-3" />
          <Text className="text-red-600 dark:text-red-400 font-sans">Log Out</Text>
        </Pressable>
      </Animated.View>
    </>
  )
}

export default React.memo(SettingsPanel)
