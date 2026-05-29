import React, { useState, useEffect } from 'react'
import { View, TextInput, FlatList, Pressable } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Check } from 'lucide-react-native'
import { useTheme } from '../components/contexts'
import { Text, StackHeader } from '../components/ui'
import { fetchCenters, CenterData } from '../utils/api'
import { centerPickerStore } from '../utils/centerPickerStore'
import { useAnalytics } from '../utils/analytics'

export default function CenterPickerScreen() {
  const router = useRouter()
  const { currentCenterID } = useLocalSearchParams<{ currentCenterID?: string }>()
  const { isDark } = useTheme()
  const { track } = useAnalytics()

  const [allCenters, setAllCenters] = useState<CenterData[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchCenters().then(setAllCenters).catch(() => {})
  }, [])

  const filtered = search.length >= 1
    ? allCenters.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : allCenters

  const textColor = isDark ? '#FAFAFA' : '#1C1917'
  const faintColor = isDark ? '#737373' : '#A8A29E'
  const borderColor = isDark ? '#262626' : '#ECE7DE'
  const cardBg = isDark ? '#262626' : '#FFFFFF'
  const pageBg = isDark ? '#1A1A1A' : '#F5F5F4'
  const inputBg = isDark ? '#333333' : '#F0EFED'

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
          onChangeText={(text) => {
            setSearch(text)
            if (text.length > 0) {
              track('center_picker_searched', { query: text, source: 'center_picker' })
            }
          }}
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
              track('center_picker_selected', {
                center_id: item.centerID,
                center_name: item.name,
                was_current: currentCenterID === item.centerID,
                search_query: search || null,
                source: 'center_picker',
              })
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
