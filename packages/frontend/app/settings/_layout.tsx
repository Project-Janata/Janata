import React from 'react'
import { View, Text, Pressable, ScrollView, Platform, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, usePathname, Slot, Stack } from 'expo-router'
import { ArrowLeft, User, Settings as SettingsIcon } from 'lucide-react-native'
import { useTheme } from '../../components/contexts'
import Logo from '../../components/ui/Logo'

const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile', icon: User, path: '/settings/profile' },
  { id: 'preferences', label: 'Preferences', icon: SettingsIcon, path: '/settings/preferences' },
]

export default function SettingsLayout() {
  const router = useRouter()
  const pathname = usePathname()
  const { isDark } = useTheme()
  const { width } = useWindowDimensions()

  const showSidebar = Platform.OS === 'web' && width >= 768

  const handleTabPress = (path: string) => {
    router.push(path as any)
  }

  const handleClose = () => {
    router.push('/')
  }

  // Native: Stack with slide animation
  if (Platform.OS !== 'web') {
    return (
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="preferences" />
        <Stack.Screen name="profile" />
      </Stack>
    )
  }

  // Web: sidebar layout
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900" edges={['bottom']}>
        <View className="flex-1 flex-row">
          {showSidebar && (
            <View className="w-64 border-r border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900">
              <View className="p-6 border-b border-stone-200 dark:border-stone-700">
                <View className="flex-row items-center justify-between mb-2">
                  <Pressable
                    onPress={handleClose}
                    className="p-1"
                    style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
                  >
                    <ArrowLeft size={20} color={isDark ? '#a1a1aa' : '#71717a'} />
                  </Pressable>
                  <Text className="text-2xl font-sans font-bold text-content dark:text-content-dark">
                    Settings
                  </Text>
                  <View style={{ width: 44 }} />
                </View>
              </View>
              <ScrollView className="flex-1 p-3">
                {SETTINGS_TABS.map((tab) => {
                  const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/')
                  const Icon = tab.icon
                  return (
                    <Pressable
                      key={tab.id}
                      onPress={() => handleTabPress(tab.path)}
                      className={`flex-row items-center gap-3 px-4 py-3 rounded-xl mb-1 ${
                        isActive
                          ? 'bg-primary shadow-sm'
                          : 'bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                      style={{ minHeight: 44 }}
                    >
                      <Icon
                        size={20}
                        className={
                          isActive ? 'text-white' : 'text-stone-500 dark:text-stone-400'
                        }
                      />
                      <Text
                        className={`font-sans font-medium text-base ${
                          isActive ? 'text-white' : 'text-content dark:text-content-dark'
                        }`}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </View>
          )}
          <View className="flex-1">
            <Slot />
          </View>
        </View>
      </SafeAreaView>
    </>
  )
}
