import React from 'react'
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native'
import { useTheme } from '../contexts'

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
  const { isDark } = useTheme()

  if (!visible) return null

  const dialogBg = isDark ? '#1a1a1a' : '#fff'
  const dialogBorder = isDark ? '#262626' : '#E7E5E4'
  const textColor = isDark ? '#F3F4F6' : '#1C1917'
  const secondaryText = isDark ? '#9CA3AF' : '#78716C'
  const cancelBg = isDark ? '#262626' : '#F5F5F4'
  const cancelText = isDark ? '#D6D3D1' : '#44403C'

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          style={[
            styles.dialog,
            {
              backgroundColor: dialogBg,
              borderColor: dialogBorder,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          <Text style={[styles.message, { color: secondaryText }]}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={[styles.button, { backgroundColor: cancelBg }]}
            >
              <Text style={[styles.buttonText, { color: cancelText }]}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={[styles.button, styles.confirmButton]}
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
  confirmButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    fontFamily: 'Inclusive Sans',
    fontSize: 14,
  },
})
