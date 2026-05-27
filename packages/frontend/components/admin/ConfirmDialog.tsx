import React from 'react'
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native'
import { useColors } from '../../hooks/useColors'

type ConfirmDialogProps = {
  visible: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const c = useColors()

  if (!visible) return null

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[
            styles.dialog,
            {
              backgroundColor: c.card,
              borderColor: c.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
          <Text style={[styles.message, { color: c.textMuted }]}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={[styles.button, { backgroundColor: c.surface }]}
            >
              <Text style={[styles.buttonText, { color: c.textSecondary }]}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={[styles.button, { backgroundColor: c.error }]}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: 360,
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    fontFamily: 'Inclusive Sans',
    fontSize: 16,
    marginBottom: 8,
  },
  message: {
    fontFamily: 'Inclusive Sans',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  buttonText: {
    fontFamily: 'Inclusive Sans',
    fontSize: 14,
  },
})
