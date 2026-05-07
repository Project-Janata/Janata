import React from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { Map as MapIcon } from 'lucide-react-native'
import type { MapPoint } from '../../utils/api'

type TilePreview = {
  url: string
  markers: Array<{ id: string; type: 'center' | 'event'; x: number; y: number }>
}

type HomeMiniMapProps = {
  eventCount: number
  centerCount: number
  points: MapPoint[]
  userCenterID?: string | null
  tilePreview: TilePreview
  isDark: boolean
  onPress: () => void
}

export default function HomeMiniMap({
  eventCount,
  centerCount,
  tilePreview,
  isDark,
  onPress,
}: HomeMiniMapProps) {
  return (
    <View
      style={{
        height: 156,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: isDark ? '#26231F' : '#EDE6DA',
      }}
    >
      <Image
        source={{ uri: tilePreview.url }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          backgroundColor: isDark ? 'rgba(0,0,0,0.18)' : 'rgba(255,248,241,0.08)',
        }}
      />
      {tilePreview.markers.map((marker) => (
        <View
          key={marker.id}
          style={{
            position: 'absolute',
            left: `${marker.x}%`,
            top: `${marker.y}%`,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: marker.type === 'event' ? '#F25C05' : '#2563EB',
            borderWidth: 2,
            borderColor: '#FFFFFF',
            transform: [{ translateX: -12 }, { translateY: -12 }],
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
          }}
        />
      ))}
      <MapOverlay
        eventCount={eventCount}
        centerCount={centerCount}
        isDark={isDark}
        onPress={onPress}
      />
    </View>
  )
}

function MapOverlay({
  eventCount,
  centerCount,
  isDark,
  onPress,
}: {
  eventCount: number
  centerCount: number
  isDark: boolean
  onPress: () => void
}) {
  return (
    <>
      <Pressable
        accessibilityLabel="Open map"
        onPress={onPress}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          backgroundColor: 'transparent',
        }}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <View
          style={{
            position: 'absolute',
            left: 14,
            top: 14,
            borderRadius: 999,
            backgroundColor: isDark ? '#171717' : '#FFFFFF',
            paddingHorizontal: 12,
            paddingVertical: 7,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
          }}
        >
          <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: isDark ? '#FAFAFA' : '#1C1917' }}>
            {eventCount} events - {centerCount} centers nearby
          </Text>
        </View>
        <View
          style={{
            position: 'absolute',
            right: 14,
            bottom: 14,
            borderRadius: 999,
            backgroundColor: isDark ? '#171717' : '#FFFFFF',
            paddingHorizontal: 13,
            paddingVertical: 9,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
          }}
        >
          <MapIcon size={15} color="#E8862A" />
          <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: isDark ? '#FAFAFA' : '#1C1917' }}>
            Open map
          </Text>
        </View>
      </View>
    </>
  )
}
