import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { Map as MapIcon } from 'lucide-react-native'
import CommunityMap from '../Map'
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
  points,
  userCenterID,
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
      <View
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        pointerEvents="none"
      >
        <CommunityMap
          points={points}
          userCenterID={userCenterID}
          showUserLocation={false}
          showControls={false}
          initialZoom={10}
          onPointPress={onPress}
        />
      </View>
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
          backgroundColor: isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.02)',
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
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: isDark ? '#FAFAFA' : '#1C1917' }}>
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
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: isDark ? '#FAFAFA' : '#1C1917' }}>
            Open map
          </Text>
        </View>
      </View>
    </>
  )
}
