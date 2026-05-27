import React, { useState, useEffect, useMemo } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Buildings, CalendarDots, CaretDown, X } from 'phosphor-react-native'
import { Avatar } from '../ui'
import type { AppColors } from '../../tokens'

type GroupOption = {
  id: string
  kind: 'center' | 'event'
  title: string
}

export function CreatePostSheet({
  visible,
  colors,
  groups,
  onClose,
}: {
  visible: boolean
  colors: AppColors
  groups: GroupOption[]
  onClose: () => void
}) {
  const [body, setBody] = useState('')
  const [groupId, setGroupId] = useState<string | undefined>()
  const [groupPickerOpen, setGroupPickerOpen] = useState(false)

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => (a.kind !== b.kind ? (a.kind === 'center' ? -1 : 1) : a.title.localeCompare(b.title))),
    [groups]
  )
  const selectedGroup = sortedGroups.find((g) => g.id === groupId) ?? sortedGroups[0]

  useEffect(() => {
    if (!visible) { setBody(''); setGroupPickerOpen(false); return }
    if (!groupId && sortedGroups[0]) setGroupId(sortedGroups[0].id)
  }, [visible, groupId, sortedGroups])

  const canPost = body.trim().length > 0 && !!selectedGroup

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
      transparent={Platform.OS !== 'ios'}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Platform.OS === 'ios' ? 20 : 16, paddingTop: Platform.OS === 'ios' ? 14 : 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable onPress={onClose} hitSlop={8} style={{ minWidth: 64 }}>
            <X size={22} color={colors.textMuted} />
          </Pressable>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: colors.text }}>New post</Text>
          <Pressable disabled={!canPost} onPress={onClose} hitSlop={8} style={{ minWidth: 64, alignItems: 'flex-end', opacity: canPost ? 1 : 0.4 }}>
            <Text style={{ fontWeight: '500', fontSize: 15, color: colors.accent }}>Post</Text>
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          {/* Board picker */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 11, letterSpacing: 0.9, color: colors.textFaint, marginBottom: 8 }}>
              POST TO
            </Text>
            <Pressable
              onPress={() => setGroupPickerOpen((o) => !o)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                {selectedGroup?.kind === 'event'
                  ? <CalendarDots size={14} color={colors.accent} />
                  : <Buildings size={14} color={colors.accent} />}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }} numberOfLines={1}>
                  {selectedGroup ? selectedGroup.title : 'Pick a group'}
                </Text>
                {selectedGroup && (
                  <Text style={{ fontSize: 12, color: colors.textFaint }} numberOfLines={1}>
                    {selectedGroup.kind === 'event' ? 'Event board' : 'Center board'}
                  </Text>
                )}
              </View>
              <CaretDown size={16} color={colors.textFaint} />
            </Pressable>

            {groupPickerOpen && (
              <View style={{ marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden' }}>
                {sortedGroups.map((group, index) => {
                  const active = group.id === selectedGroup?.id
                  return (
                    <Pressable
                      key={group.id}
                      onPress={() => { setGroupId(group.id); setGroupPickerOpen(false) }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: active ? colors.accentSoft : colors.card, borderBottomWidth: index < sortedGroups.length - 1 ? 1 : 0, borderBottomColor: colors.border }}
                    >
                      <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' }}>
                        {group.kind === 'event'
                          ? <CalendarDots size={12} color={colors.textMuted} />
                          : <Buildings size={12} color={colors.textMuted} />}
                      </View>
                      <Text style={{ flex: 1, fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }} numberOfLines={1}>
                        {group.title}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            )}
          </View>

          {/* Composer */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <Avatar name="You" initials="YO" size={38} backgroundColor={colors.accent} />
            <TextInput
              autoFocus
              multiline
              value={body}
              onChangeText={setBody}
              placeholder={selectedGroup?.kind === 'event' ? `Share something with ${selectedGroup.title}...` : 'Share something with your center...'}
              placeholderTextColor={colors.textFaint}
              style={{ flex: 1, minHeight: 160, fontFamily: 'Inclusive Sans', fontSize: 16, lineHeight: 23, color: colors.text, textAlignVertical: 'top', paddingTop: 6 }}
            />
          </View>

          <Text style={{ marginTop: 16, fontSize: 12, lineHeight: 18, color: colors.textFaint }}>
            Visible to verified members in {selectedGroup?.title || 'your group'}.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}
