import { useEffect } from 'react'
import { View, Text, Pressable, ScrollView, Modal, Platform } from 'react-native'
import { Check } from 'phosphor-react-native'
import { useDetailColors } from '../../hooks/useDetailColors'
import { useColors } from '../../hooks/useColors'

export type FilterPickerOption<V> = {
  value: V
  label: string
  sublabel?: string
  count?: number
}

interface FilterPickerModalProps<V> {
  visible: boolean
  title: string
  options: FilterPickerOption<V>[]
  selected: V | null
  onSelect: (value: V) => void
  onClear: () => void
  onClose: () => void
}

export default function FilterPickerModal<V extends string | number>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClear,
  onClose,
}: FilterPickerModalProps<V>) {
  const colors = useDetailColors()
  const c = useColors()

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [visible, onClose])

  if (!visible) return null

  const renderRow = (opt: FilterPickerOption<V>) => {
    const isSelected = selected === opt.value
    return (
      <Pressable
        key={String(opt.value)}
        onPress={() => {
          onSelect(opt.value)
          onClose()
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, color: colors.text, fontFamily: 'Inclusive Sans' }}>
            {opt.label}
          </Text>
          {opt.sublabel && (
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              {opt.sublabel}
            </Text>
          )}
        </View>
        {opt.count !== undefined && (
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              fontFamily: 'Inclusive Sans',
              marginRight: isSelected ? 10 : 0,
              minWidth: 24,
              textAlign: 'right',
            }}
          >
            {opt.count}
          </Text>
        )}
        {isSelected && <Check size={18} color={c.accent} />}
      </Pressable>
    )
  }

  const sheet = (
    <View
      style={{
        backgroundColor: colors.panelBg,
        borderRadius: 16,
        width: 360,
        maxWidth: '90%',
        maxHeight: '80%',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 16, fontFamily: 'Inclusive Sans', color: colors.text }}>{title}</Text>
        <Pressable onPress={onClose}>
          <Text style={{ fontSize: 14, color: colors.textSecondary, fontFamily: 'Inclusive Sans' }}>
            Close
          </Text>
        </Pressable>
      </View>
      <ScrollView style={{ maxHeight: 480 }}>{options.map(renderRow)}</ScrollView>
      {selected !== null && (
        <Pressable
          onPress={() => {
            onClear()
            onClose()
          }}
          style={{
            paddingVertical: 14,
            alignItems: 'center',
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 14, color: c.accent, fontFamily: 'Inclusive Sans' }}>
            Clear selection
          </Text>
        </Pressable>
      )}
    </View>
  )

  if (Platform.OS === 'web') {
    return (
      <View
        style={{
          position: 'fixed' as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}
      >
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
        />
        {sheet}
      </View>
    )
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
        />
        {sheet}
      </View>
    </Modal>
  )
}
