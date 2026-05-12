import React, { useEffect, useRef } from 'react'
import { Animated, View, type ViewStyle } from 'react-native'
import { useColors } from '../../hooks/useColors'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

function SkeletonBox({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const c = useColors()
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[{ width: width as number, height, borderRadius, backgroundColor: c.border, opacity }, style]}
    />
  )
}

export function EventCardSkeleton() {
  const c = useColors()
  return (
    <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 16 }}>
      <SkeletonBox width="60%" height={14} />
      <SkeletonBox width="40%" height={12} style={{ marginTop: 8 }} />
      <SkeletonBox width="80%" height={12} style={{ marginTop: 8 }} />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <SkeletonBox width={28} height={28} borderRadius={14} />
        <SkeletonBox width={28} height={28} borderRadius={14} />
        <SkeletonBox width={28} height={28} borderRadius={14} />
      </View>
    </View>
  )
}

export function CenterCardSkeleton() {
  const c = useColors()
  return (
    <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 16 }}>
      <SkeletonBox width="50%" height={14} />
      <SkeletonBox width="70%" height={12} style={{ marginTop: 8 }} />
    </View>
  )
}

export function DiscoverListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: 8, paddingTop: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>{i % 3 === 2 ? <CenterCardSkeleton /> : <EventCardSkeleton />}</View>
      ))}
    </View>
  )
}

export function DetailSkeleton() {
  return (
    <View style={{ padding: 20, gap: 16 }}>
      <SkeletonBox width="100%" height={200} borderRadius={12} />
      <SkeletonBox width="70%" height={20} />
      <SkeletonBox width="40%" height={14} />
      <SkeletonBox width="90%" height={14} />
      <SkeletonBox width="85%" height={14} />
      <SkeletonBox width="60%" height={14} />
    </View>
  )
}
