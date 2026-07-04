import React, { useState } from 'react'
import { Image, Text, View } from 'react-native'
import { User } from 'lucide-react-native'

interface AvatarProps {
  image?: string
  initials?: string
  name?: string
  size?: number
  style?: object
  backgroundColor?: string
}

export default function Avatar({ image, initials, name, size = 40, style, backgroundColor }: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const fontSize = size * 0.38
  const bgColor = backgroundColor || '#C2410C'

  // Empty string (not "?") when there's nothing to show — the render falls back
  // to a person icon instead (#380).
  const getInitials = () => {
    if (initials) return initials
    if (name) {
      const parts = name.split(' ')
      return parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase()
    }
    return ''
  }

  if (image && !imageError) {
    return (
      <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }, style]}>
        <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onError={() => setImageError(true)} />
      </View>
    )
  }

  const label = getInitials()
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }, style]}>
      {label ? (
        <Text style={{ fontWeight: '600', fontSize, color: '#FFFFFF' }}>
          {label}
        </Text>
      ) : (
        <User size={size * 0.5} color="#FFFFFF" strokeWidth={2} />
      )}
    </View>
  )
}
