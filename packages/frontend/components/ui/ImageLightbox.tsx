// ImageLightbox — full-screen viewer for a single image (#382). RN Modal with a
// dark backdrop; dismiss by tapping anywhere, the X button, or Escape (web).
import React, { useEffect } from 'react'
import { Modal, Pressable, Image, View, Platform } from 'react-native'
import { X } from 'lucide-react-native'

export function ImageLightbox({
  uri,
  visible,
  onClose,
}: {
  uri: string
  visible: boolean
  onClose: () => void
}) {
  useEffect(() => {
    if (!visible || Platform.OS !== 'web' || typeof window === 'undefined') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, onClose])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        accessibilityLabel="Close image"
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' }}
      >
        <Image source={{ uri }} style={{ width: '92%', height: '85%' }} resizeMode="contain" />
        <View style={{ position: 'absolute', top: 0, right: 0 }} pointerEvents="box-none">
          <Pressable onPress={onClose} accessibilityLabel="Close" hitSlop={12} style={{ padding: 20 }}>
            <X size={28} color="#fff" />
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  )
}
