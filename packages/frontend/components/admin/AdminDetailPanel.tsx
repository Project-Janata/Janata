import React from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { X } from 'lucide-react-native'
import { useDetailColors } from '../../hooks/useDetailColors'

type AdminDetailPanelProps = {
  title: string
  onClose: () => void
  children: React.ReactNode
}

export default function AdminDetailPanel({ title, onClose, children }: AdminDetailPanelProps) {
  const colors = useDetailColors()
  const { width } = useWindowDimensions()
  const isCompact = width < 768

  return (
    <View
      style={[
        isCompact ? styles.compactContainer : styles.container,
        {
          backgroundColor: colors.panelBg,
          borderLeftColor: isCompact ? 'transparent' : colors.border,
        },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <X size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {children}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    borderLeftWidth: 1,
  },
  compactContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: 'Inclusive Sans',
    fontSize: 15,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
})
