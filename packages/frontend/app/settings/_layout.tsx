import React from 'react'
import { View, Text, Pressable, ScrollView, Platform, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, usePathname, Slot, Stack } from 'expo-router'
import { ArrowLeft, User, Settings as SettingsIcon } from 'lucide-react-native'
import { useTheme } from '../../components/contexts'

const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile', icon: User, path: '/settings/profile' },
  { id: 'index', label: 'Preferences', icon: SettingsIcon, path: '/settings' },
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
        <Stack.Screen name="index" />
        <Stack.Screen name="profile" />
      </Stack>
    )
  }

  // Web: sidebar layout
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#171717' : '#FFFFFF' }} edges={['bottom']}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {showSidebar && (
            <View style={{ width: 256, borderRightWidth: 1, borderRightColor: isDark ? '#44403C' : '#E7E5E4', backgroundColor: isDark ? '#1C1917' : '#FAFAF9' }}>
              <View style={{ padding: 24, borderBottomWidth: 1, borderBottomColor: isDark ? '#44403C' : '#E7E5E4' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Pressable
                    onPress={handleClose}
                    style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}
                  >
                    <ArrowLeft size={20} color={isDark ? '#a1a1aa' : '#71717a'} />
                  </Pressable>
                  <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 24, fontWeight: '700', color: isDark ? '#FAFAF9' : '#1C1917' }}>
                    Settings
                  </Text>
                  <View style={{ width: 44 }} />
                </View>
              </View>
              <ScrollView style={{ flex: 1, padding: 12 }}>
                {SETTINGS_TABS.map((tab) => {
                  const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/')
                  const Icon = tab.icon
                  return (
                    <Pressable
                      key={tab.id}
                      onPress={() => handleTabPress(tab.path)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 12,
                        marginBottom: 4,
                        minHeight: 44,
                        backgroundColor: isActive ? '#E8862A' : 'transparent',
                      }}
                    >
                      <Icon
                        size={20}
                        color={isActive ? '#FFFFFF' : isDark ? '#A8A29E' : '#78716C'}
                      />
                      <Text
                        style={{
                          fontFamily: 'Inclusive Sans',
                          fontWeight: '500',
                          fontSize: 16,
                          color: isActive ? '#FFFFFF' : isDark ? '#FAFAF9' : '#1C1917',
                        }}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Slot />
          </View>
        </View>
      </SafeAreaView>
    </>
  )
}
