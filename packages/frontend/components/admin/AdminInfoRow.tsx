import React from 'react'
import { View, Text } from 'react-native'
import { useDetailColors } from '../../hooks/useDetailColors'

type InfoRowProps = {
  icon: React.ReactNode
  text: string
  colors: ReturnType<typeof useDetailColors>
  textColor?: string
}

export default function AdminInfoRow({ icon, text, colors, textColor }: InfoRowProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {icon}
      <Text
        style={{
          fontFamily: 'Inclusive Sans',
          fontSize: 12,
          color: textColor ?? colors.text,
          flex: 1,
        }}
        numberOfLines={2}
      >
        {text}
      </Text>
    </View>
  )
}
