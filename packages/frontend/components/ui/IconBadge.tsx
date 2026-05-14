import React, { useRef } from 'react'
import { View } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'

interface IconBadgeProps {
  children: React.ReactNode
  size?: number
  color?: string
  gradient?: [string, string]
}

export function IconBadge({
  children,
  size = 96,
  color = '#fb923c',
  gradient,
}: IconBadgeProps) {
  const gradId = useRef(`grad-${Math.random().toString(36).slice(2)}`).current
  const radius = size * 0.225

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {gradient ? (
          <>
            <Defs>
              <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={gradient[0]} />
                <Stop offset="1" stopColor={gradient[1]} />
              </LinearGradient>
            </Defs>
            <Rect width={size} height={size} rx={radius} ry={radius} fill={`url(#${gradId})`} />
          </>
        ) : (
          <Rect width={size} height={size} rx={radius} ry={radius} fill={color} />
        )}
      </Svg>
      <View style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  )
}
