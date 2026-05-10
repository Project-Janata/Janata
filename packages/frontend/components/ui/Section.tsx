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
  titleColor = '#A8A29E',
  borderColor,
}: SectionProps) {
  return (
    <View style={[{ marginBottom: 22, gap: 10 }, containerStyle]}>
      {title && (
        <Text
          style={{
            fontSize: 11,
            fontWeight: '400',
            color: titleColor,
            letterSpacing: 0.9,
            paddingHorizontal: 4,
          }}
        >
          {title}
        </Text>
      )}
      {children}
    </View>
  )
}
