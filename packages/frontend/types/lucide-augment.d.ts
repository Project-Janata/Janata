/**
 * Module augmentation for lucide-react-native@1.8.
 *
 * LucideProps formally extends react-native-svg's SvgProps, which declares
 * `color?: ColorValue`. But under our React 19 / RN 0.83 toolchain TypeScript
 * resolves `LucideProps & RefAttributes<SVGSVGElement>` without picking up
 * the SvgProps members, so `<ChevronRight color="#000" />` fails to type-check
 * across ~200 call sites — even though the prop works correctly at runtime.
 *
 * `strokeWidth` and `className` are similarly accepted at runtime (via
 * SvgProps and NativeWind respectively) but missing from the resolved type.
 *
 * Adding them here augments the existing LucideProps interface without
 * touching call sites. If a future lucide-react-native release fixes the
 * type resolution upstream, delete this file.
 */
import 'lucide-react-native'
import type { StyleProp, ViewStyle } from 'react-native'

declare module 'lucide-react-native' {
  interface LucideProps {
    color?: string
    strokeWidth?: string | number
    className?: string
    style?: StyleProp<ViewStyle>
  }
}
