import { useEffect } from 'react'
import { Image, Modal, Platform, Pressable, useWindowDimensions, View } from 'react-native'
import { X } from 'lucide-react-native'

interface ImageLightboxProps {
  visible: boolean
  imageUrl: string | null
  onClose: () => void
}

export default function ImageLightbox({ visible, imageUrl, onClose }: ImageLightboxProps) {
  const { width, height } = useWindowDimensions()

  // Web: dismiss on Escape key
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [visible, onClose])

  if (!visible || !imageUrl) return null

  const content = (
    <>
      {/* Backdrop tap closes */}
      <Pressable
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close image"
      />

      {/* Tapping the image itself does NOT close the lightbox */}
      <Pressable onPress={(e) => e.stopPropagation()} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={{ uri: imageUrl }}
          style={{ width: width * 0.9, height: height * 0.9 }}
          resizeMode="contain"
        />
      </Pressable>

      {/* Close button top-right */}
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={20} color="#fff" />
      </Pressable>
    </>
  )

  // Web: fixed overlay at high z-index (no raw Modal, which doesn't work well on web)
  if (Platform.OS === 'web') {
    return (
      <View
        style={{
          position: 'fixed' as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}
      >
        {content}
      </View>
    )
  }

  // Native: Modal handles Android back button via onRequestClose
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.9)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {content}
      </View>
    </Modal>
  )
}
