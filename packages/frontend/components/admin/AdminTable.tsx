import React, { useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useDetailColors } from '../../hooks/useDetailColors'

export type Column<T> = {
  key: string
  header: string
  flex: number
  render: (item: T) => React.ReactNode
}

type AdminTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  selectedId: string | null
  onRowPress: (item: T) => void
}

function AdminTableRow<T>({
  item,
  columns,
  isSelected,
  onPress,
}: {
  item: T
  columns: Column<T>[]
  isSelected: boolean
  onPress: () => void
}) {
  const colors = useDetailColors()
  const [hovered, setHovered] = useState(false)

  let rowBg = colors.panelBg
  if (isSelected) rowBg = 'rgba(232,134,42,0.06)'
  else if (hovered) rowBg = colors.cardBg

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.row,
        {
          backgroundColor: rowBg,
          borderBottomColor: colors.border,
          borderLeftColor: isSelected ? '#E8862A' : 'transparent',
          borderLeftWidth: 2,
        },
      ]}
    >
      {columns.map((col) => (
        <View key={col.key} style={{ flex: col.flex }}>
          {col.render(item)}
        </View>
      ))}
    </Pressable>
  )
}

export default function AdminTable<T>({
  columns,
  data,
  keyExtractor,
  selectedId,
  onRowPress,
}: AdminTableProps<T>) {
  const colors = useDetailColors()

  return (
    <View>
      {/* Header */}
      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
        {columns.map((col) => (
          <View key={col.key} style={{ flex: col.flex }}>
            <Text style={[styles.headerText, { color: colors.textMuted }]}>
              {col.header}
            </Text>
          </View>
        ))}
      </View>

      {/* Rows */}
      <ScrollView style={styles.scrollBody}>
        {data.map((item) => {
          const id = keyExtractor(item)
          return (
            <AdminTableRow
              key={id}
              item={item}
              columns={columns}
              isSelected={selectedId === id}
              onPress={() => onRowPress(item)}
            />
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerText: {
    fontFamily: 'Inclusive Sans',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollBody: {
    maxHeight: 600,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
})
