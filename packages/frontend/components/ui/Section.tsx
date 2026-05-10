import React from 'react'
import { View, ViewStyle } from 'react-native'
import { Text } from './Text'

interface SectionProps {
  title?: string
  children: React.ReactNode
  containerStyle?: ViewStyle
  titleColor?: string
  borderColor?: string
}

export function Section({
  title,
  children,
  containerStyle,
  titleColor = '#78716C',
  borderColor = '#E5E7EB',
}: SectionProps) {
  return (
    <View style={[{ marginBottom: 24 }, containerStyle]}>
      {title && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: titleColor,
            textTransform: 'uppercase',
            paddingHorizontal: 16,
            paddingBottom: 8,
          }}
        >
          {title}
        </Text>
      )}
      <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor }}>
        {children}
      </View>
    </View>
  )
}
