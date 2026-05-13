import { useRef } from 'react'
import { View } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'

interface GradientIconBadgeProps {
  children: React.ReactNode
  size?: number
  colors?: [string, string]
}

export function GradientIconBadge({
  children,
  size = 96,
  colors = ['#fb923c', '#c2410c'],
}: GradientIconBadgeProps) {
  const gradId = useRef(`grad-${Math.random().toString(36).slice(2)}`).current
  const radius = size * 0.225

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </LinearGradient>
        </Defs>
        <Rect width={size} height={size} rx={radius} ry={radius} fill={`url(#${gradId})`} />
      </Svg>
      <View style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  )
}
