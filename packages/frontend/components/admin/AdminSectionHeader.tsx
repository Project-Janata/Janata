import React from 'react'
import { View, Text, Pressable } from 'react-native'
import { useDetailColors } from '../../hooks/useDetailColors'

type SectionHeaderProps = {
  label: string
  actionLabel?: string
  onAction?: () => void
  colors: ReturnType<typeof useDetailColors>
}

export default function AdminSectionHeader({ label, actionLabel, onAction, colors }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 8,
      }}
    >
      <Text
        style={{
          fontFamily: 'Inclusive Sans',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: colors.textMuted,
        }}
      >
        {label}
      </Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction}>
          <Text
            style={{
              fontFamily: 'Inclusive Sans',
              fontSize: 11,
              color: '#E8862A',
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  )
}
