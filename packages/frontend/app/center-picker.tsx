import React, { useState, useEffect } from 'react'
import { View, TextInput, FlatList, Pressable } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Check } from 'phosphor-react-native'
import { useColors } from '../hooks/useColors'
import { Text, StackHeader } from '../components/ui'
import { fetchCenters, CenterData } from '../utils/api'
import { centerPickerStore } from '../utils/centerPickerStore'

export default function CenterPickerScreen() {
  const router = useRouter()
  const { currentCenterID } = useLocalSearchParams<{ currentCenterID?: string }>()
  const c = useColors()

  const [allCenters, setAllCenters] = useState<CenterData[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchCenters().then(setAllCenters).catch(() => {})
  }, [])

  const filtered = search.length >= 1
    ? allCenters.filter((center) => center.name.toLowerCase().includes(search.toLowerCase()))
    : allCenters

  const textColor = c.text
  const faintColor = c.textFaint
  const borderColor = c.border
  const cardBg = c.card
  const pageBg = c.bg
  const inputBg = c.surface

  return (
    <View style={{ flex: 1, backgroundColor: pageBg }}>
      <StackHeader title="Select Center" />

      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: cardBg,
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
      }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search centers..."
          placeholderTextColor={faintColor}
          autoFocus
          style={{
            fontFamily: 'Inclusive Sans',
            fontSize: 15,
            color: textColor,
            backgroundColor: inputBg,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.centerID}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              centerPickerStore.result = item.centerID
              router.back()
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 14,
              backgroundColor: cardBg,
              borderBottomWidth: 1,
              borderBottomColor: borderColor,
            }}
          >
            <Text style={{
              fontSize: 15,
              color: currentCenterID === item.centerID ? '#C2410C' : textColor,
              flex: 1,
            }}>
              {item.name}
            </Text>
            {currentCenterID === item.centerID && <Check size={16} color="#C2410C" />}
          </Pressable>
        )}
      />
    </View>
  )
}
