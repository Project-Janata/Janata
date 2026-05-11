import React from 'react'
import { View, Pressable, StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useTheme } from '../contexts'
import { Text } from './Text'

interface StackHeaderProps {
  title: string
  onBack?: () => void
  right?: React.ReactNode
}

export default function StackHeader({ title, onBack, right }: StackHeaderProps) {
  const router = useRouter()
  const { isDark } = useTheme()
  const insets = useSafeAreaInsets()

  const textColor = isDark ? '#FAFAFA' : '#1C1917'
  const borderColor = isDark ? '#262626' : '#ECE7DE'
  const cardBg = isDark ? '#262626' : '#FFFFFF'

  return (
    <View style={{ backgroundColor: cardBg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: Math.max(insets.top, 8),
          paddingBottom: 12,
          backgroundColor: cardBg,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
        }}
      >
        <Pressable
          onPress={onBack ?? (() => router.back())}
          style={{ padding: 8, marginLeft: -8 }}
          hitSlop={8}
        >
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <Text style={{ fontSize: 22, color: textColor, letterSpacing: -0.5, flex: 1, marginLeft: 4 }}>
          {title}
        </Text>
        {right ?? <View style={{ width: 36 }} />}
      </View>
    </View>
  )
}
