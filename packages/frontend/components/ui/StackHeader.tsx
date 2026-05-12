import React from 'react'
import { View, Pressable, StatusBar } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { useColors } from '../../hooks/useColors'
import { Text } from './Text'

interface StackHeaderProps {
  title: string
  onBack?: () => void
  right?: React.ReactNode
}

export default function StackHeader({ title, onBack, right }: StackHeaderProps) {
  const router = useRouter()
  const c = useColors()
  const insets = useSafeAreaInsets()

  return (
    <View style={{ backgroundColor: c.card }}>
      <StatusBar barStyle={c.text === '#FAFAFA' ? 'light-content' : 'dark-content'} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: Math.max(insets.top, 8),
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        }}
      >
        <Pressable onPress={onBack ?? (() => router.back())} style={{ padding: 8, marginLeft: -8 }} hitSlop={8}>
          <ChevronLeft size={22} color={c.icon} />
        </Pressable>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 22, color: c.text, letterSpacing: -0.5, flex: 1, marginLeft: 4 }}>
          {title}
        </Text>
        {right ?? <View style={{ width: 36 }} />}
      </View>
    </View>
  )
}
