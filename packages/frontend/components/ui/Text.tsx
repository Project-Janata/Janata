import React from 'react'
import { Text as RNText, type TextProps as RNTextProps } from 'react-native'

const INCLUSIVE_SANS_WEIGHTS: Record<string, string> = {
  '300': 'Inclusive Sans Light',
  '500': 'Inclusive Sans Medium',
  '600': 'Inclusive Sans SemiBold',
  '700': 'Inclusive Sans Bold',
  bold:  'Inclusive Sans Bold',
}

const INTER_WEIGHTS: Record<string, string> = {
  '300': 'Inter Light',
  '500': 'Inter Medium',
  '600': 'Inter SemiBold',
  '700': 'Inter Bold',
  bold:  'Inter Bold',
}

/**
 * Drop-in replacement for RN Text that maps fontWeight to the correct
 * named font variant for both Inclusive Sans (content) and Inter (UI/actions).
 */
export function Text({ style, ...props }: RNTextProps) {
  const styleArray = Array.isArray(style) ? style : [style]
  const flat = Object.assign({}, ...styleArray.filter(Boolean)) as Record<string, unknown>
  const { fontWeight, fontFamily: explicitFamily, ...rest } = flat

  const baseFamily = explicitFamily as string | undefined
  const weight = String(fontWeight ?? '')

  let fontFamily = baseFamily
  if (weight && baseFamily) {
    const map = baseFamily.startsWith('Inter') ? INTER_WEIGHTS : INCLUSIVE_SANS_WEIGHTS
    fontFamily = map[weight] ?? baseFamily
  }

  return <RNText {...props} style={{ ...(rest as object), fontFamily }} />
}
