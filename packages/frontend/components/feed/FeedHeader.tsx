import React from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { ArrowLeft, Search } from 'lucide-react-native'
import type { AppColors } from '../../tokens'

export function FeedHeader({
  query,
  colors,
  mobileInDetail,
  onBack,
  onChangeQuery,
}: {
  query: string
  colors: AppColors
  mobileInDetail: boolean
  onBack: () => void
  onChangeQuery: (query: string) => void
}) {
  if (mobileInDetail) {
    return (
      <Pressable
        onPress={onBack}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          alignSelf: 'flex-start',
          paddingVertical: 4,
        }}
      >
        <ArrowLeft size={18} color={colors.textMuted} />
        <Text style={{ fontSize: 15, color: colors.textMuted }}>
          Back
        </Text>
      </Pressable>
    )
  }

  return (
    <View style={{ gap: 10, marginBottom: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <View
          style={{
            flex: 1,
            minHeight: 42,
            borderRadius: 14,
            backgroundColor: colors.border,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Search size={17} color={colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={onChangeQuery}
            placeholder="Search posts and people"
            placeholderTextColor={colors.textFaint}
            style={{
              flex: 1,
              fontFamily: 'Inclusive Sans',
              fontSize: 15,
              color: colors.text,
              paddingVertical: 9,
            }}
          />
        </View>
      </View>
    </View>
  )
}
