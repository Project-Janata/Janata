import { useEffect, useRef } from 'react'
import { View, ActivityIndicator, useWindowDimensions } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

export default function ChatConversationDetailWeb() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isMobile = width < 768

  const initiallyMobile = useRef(isMobile)

  useEffect(() => {
    if (!initiallyMobile.current && id) {
      router.replace(`/?detail=chat&id=${id}`)
    } else if (!id) {
      router.replace('/')
    }
  }, [id, router])

  if (!isMobile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E8862A" />
      </View>
    )
  }

  // On mobile, import and render the native version
  const ChatConversationDetail = require('./[id]').default
  return <ChatConversationDetail />
}
