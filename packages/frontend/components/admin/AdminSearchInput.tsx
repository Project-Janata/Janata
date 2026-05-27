import React from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import { MagnifyingGlass } from 'phosphor-react-native'
import { useDetailColors } from '../../hooks/useDetailColors'

type AdminSearchInputProps = {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
}

export default function AdminSearchInput({
  value,
  onChangeText,
  placeholder = 'Search...',
}: AdminSearchInputProps) {
  const colors = useDetailColors()

  return (
    <View style={[styles.container, { backgroundColor: colors.iconBoxBg }]}>
      <MagnifyingGlass size={16} color={colors.textMuted} style={styles.icon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            color: colors.text,
            outlineStyle: 'none' as any,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Inclusive Sans',
    fontSize: 13,
    padding: 0,
  },
})
