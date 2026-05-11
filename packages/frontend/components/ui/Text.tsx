import React from 'react'
import { Text as RNText, TextProps as RNTextProps } from 'react-native'

export function Text({ style, ...props }: RNTextProps) {
  // Extract fontWeight from style if it exists
  const styleArray = Array.isArray(style) ? style : [style]
  const flatStyle = Object.assign({}, ...styleArray.filter(Boolean))
  const fontWeight = flatStyle?.fontWeight

  // Map fontWeight to the correct Inclusive Sans variant
  let fontFamily = 'Inclusive Sans' // Default to regular (400)

  if (fontWeight === '300' || fontWeight === 300) {
    fontFamily = 'Inclusive Sans Light'
  } else if (fontWeight === '500' || fontWeight === 500) {
    fontFamily = 'Inclusive Sans Medium'
  } else if (fontWeight === '600' || fontWeight === 600) {
    fontFamily = 'Inclusive Sans SemiBold'
  } else if (fontWeight === '700' || fontWeight === 700 || fontWeight === 'bold') {
    fontFamily = 'Inclusive Sans Bold'
  }

  // Remove fontWeight from style and add fontFamily
  const { fontWeight: _, ...restStyle } = flatStyle
  const newStyle = { ...restStyle, fontFamily }

  return <RNText {...props} style={newStyle} />
}
