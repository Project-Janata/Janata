import React from 'react'
import { View, Text, type ViewStyle } from 'react-native'
import { useColors } from '../../hooks/useColors'

interface SectionProps {
  title?: string
  children: React.ReactNode
  containerStyle?: ViewStyle
  titleColor?: string
  borderColor?: string
}

export function Section({ title, children, containerStyle, titleColor, borderColor: _borderColor }: SectionProps) {
  const c = useColors()
  const labelColor = titleColor ?? c.textFaint
  return (
    <View style={[{ marginBottom: 22, gap: 10 }, containerStyle]}>
      {title && (
        <Text style={{ fontSize: 11, letterSpacing: 0.9, color: labelColor, paddingHorizontal: 4 }}>
          {title.toUpperCase()}
        </Text>
      )}
      {children}
    </View>
  )
}
