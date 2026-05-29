import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useDetailColors } from '../../hooks/useDetailColors'
import { useColors } from '../../hooks/useColors'
import { Avatar } from '../ui'

type UserRowProps = {
  name: string
  image: string | null
  actionLabel?: string
  onAction?: () => void
  colors: ReturnType<typeof useDetailColors>
  isDark: boolean
}

export default function AdminUserRow({ name, image, actionLabel, onAction, colors, isDark }: UserRowProps) {
  const c = useColors()
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.iconBoxBg,
        borderRadius: 8,
        padding: 8,
        marginBottom: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Avatar name={name} image={image ?? undefined} size={24} />
        <Text
          style={{
            fontFamily: 'Inclusive Sans',
            fontSize: 12,
            color: colors.text,
          }}
        >
          {name}
        </Text>
      </View>
      {actionLabel && onAction && (
        <Pressable onPress={onAction}>
          <Text
            style={{
              fontFamily: 'Inclusive Sans',
              fontSize: 11,
              color: c.error,
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  )
}
