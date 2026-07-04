import React from 'react'
import { View, Pressable, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, Slot, Stack } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { useTheme } from '../../components/contexts'
import { Text } from '../../components/ui'

// Settings is one combined page (Profile section + preferences) on web, and a
// stack on native. The old web sidebar (Profile / Preferences tabs) was removed
// because Profile now lives as the top section of the page — see
// settings/index.web.tsx. The /settings/profile route redirects here (#346).
export default function SettingsLayout() {
  const router = useRouter()
  const { isDark } = useTheme()

  // Native: stack with slide animation (unchanged)
  if (Platform.OS !== 'web') {
    return (
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="invite" />
        <Stack.Screen name="notifications" />
      </Stack>
    )
  }

  const handleClose = () => {
    if (router.canGoBack()) router.back()
    else router.push('/')
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? '#1A1A1A' : '#F5F5F4' }}
      edges={['top', 'bottom']}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#262626' : '#E7E5E4',
          backgroundColor: isDark ? '#171717' : '#FFFFFF',
        }}
      >
        <Pressable
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
        >
          <ArrowLeft size={22} color={isDark ? '#a1a1aa' : '#71717a'} />
        </Pressable>
        <Text style={{ fontSize: 18, color: isDark ? '#FAFAF9' : '#1C1917' }}>Settings</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
    </SafeAreaView>
  )
}
