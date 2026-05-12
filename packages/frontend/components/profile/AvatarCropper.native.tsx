import React from 'react'
import { View, Text } from 'react-native'

export interface NativeAvatarCropperProps {
  visible: boolean
  imageUri: string
  onCropComplete: (blob: Blob) => void
  onCancel: () => void
}

export default function NativeAvatarCropper({ visible, imageUri, onCropComplete, onCancel }: NativeAvatarCropperProps) {
  if (!visible) return null

  return (
    <View>
      <Text>Native Avatar Cropper - {imageUri}</Text>
    </View>
  )
}
