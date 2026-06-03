import React from 'react'
import { View, Text, Image } from 'react-native'
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
  const [imageError, setImageError] = React.useState(false)

  // Returns initials text, or null when there is nothing usable (show icon instead).
  const getInitials = (): string | null => {
    if (initials) return initials
    const trimmed = name?.trim()
    if (trimmed) {
      const parts = trimmed.split(' ')
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      }
      return trimmed.slice(0, 2).toUpperCase()
    }
    return null
  }

  const fontSize = size * 0.4
  const bgColor = backgroundColor || '#C2410C'

  if (image && !imageError) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        <Image
          source={{ uri: image }}
          style={{
            width: '100%',
            height: '100%',
          }}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      </View>
    )
  }

  const text = getInitials()

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {text ? (
        <Text
          style={{
            color: 'white',
            fontSize,
            fontWeight: '600',
          }}
        >
          {text}
        </Text>
      ) : (
        <User color="#FFFFFF" size={Math.round(size * 0.55)} />
      )}
    </View>
  )
}