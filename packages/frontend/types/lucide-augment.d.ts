/**
 * Module augmentation for phosphor-react-native.
 *
 * IconProps from phosphor-react-native accepts `color`, `size`, `weight`, and
 * `style` as props, but `className` (used by NativeWind) is not declared.
 * Adding it here augments the existing IconProps interface without touching
 * call sites. If a future phosphor-react-native release adds className
 * upstream, delete this file.
 */
import 'phosphor-react-native'
import type { StyleProp, ViewStyle } from 'react-native'

declare module 'phosphor-react-native' {
  interface IconProps {
    className?: string
    style?: StyleProp<ViewStyle>
  }
}
