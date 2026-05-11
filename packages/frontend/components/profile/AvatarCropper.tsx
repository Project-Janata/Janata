import { useRef, useCallback } from 'react'
import { View } from 'react-native'

interface Props {
  onCropComplete: (blob: Blob) => void
}

export function AvatarCropper({ onCropComplete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback((e: any) => {
    const file = e.target.files?.[0]
    if (file) {
      onCropComplete(file as unknown as Blob)
    }
  }, [onCropComplete])

  return (
    <View style={{ display: 'none' }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
      />
    </View>
  )
}
