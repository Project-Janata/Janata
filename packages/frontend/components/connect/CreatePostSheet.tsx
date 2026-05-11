import React, { useState, useEffect, useMemo } from 'react'
import {
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  Platform,
} from 'react-native'
import { X, ChevronDown, CalendarDays, Building2 } from 'lucide-react-native'
import { Avatar } from '../ui'
import type { ColorSet } from './types'

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
  colors: ColorSet
  groups: GroupOption[]
  onClose: () => void
}) {
  const [body, setBody] = useState('')
  const [groupId, setGroupId] = useState<string | undefined>()
  const [groupPickerOpen, setGroupPickerOpen] = useState(false)

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'center' ? -1 : 1
      return a.title.localeCompare(b.title)
    })
  }, [groups])
  const selectedGroup = sortedGroups.find((group) => group.id === groupId) ?? sortedGroups[0]

  useEffect(() => {
    if (!visible) {
      setBody('')
      setGroupPickerOpen(false)
      return
    }
    if (!groupId && sortedGroups[0]) {
      setGroupId(sortedGroups[0].id)
    }
  }, [visible, groupId, sortedGroups])

  const canPost = body.trim().length > 0 && !!selectedGroup
  const handlePost = () => {
    if (!canPost) return
    onClose()
  }

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
        style={{ flex: 1, backgroundColor: colors.page, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: Platform.OS === 'ios' ? 20 : 16,
            paddingTop: Platform.OS === 'ios' ? 14 : 18,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable onPress={onClose} hitSlop={8} style={{ minWidth: 64 }}>
            <X size={22} color={colors.textMuted} />
          </Pressable>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: colors.text }}>
            New post
          </Text>
          <Pressable
            disabled={!canPost}
            onPress={handlePost}
            hitSlop={8}
            style={{
              minWidth: 64,
              alignItems: 'flex-end',
              opacity: canPost ? 1 : 0.4,
            }}
          >
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.orange }}>
              Post
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: 14 }}>
            <Text
              style={{
                fontFamily: 'Inclusive Sans',
                fontSize: 11,
                letterSpacing: 0.8,
                color: colors.textSoft,
                marginBottom: 8,
              }}
            >
              POST TO
            </Text>
            <Pressable
              onPress={() => setGroupPickerOpen((open) => !open)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 12,
                paddingVertical: 11,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  backgroundColor: colors.orangeSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedGroup?.kind === 'event' ? (
                  <CalendarDays size={14} color={colors.orange} strokeWidth={2.4} />
                ) : (
                  <Building2 size={14} color={colors.orange} strokeWidth={2.4} />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }}
                  numberOfLines={1}
                >
                  {selectedGroup ? selectedGroup.title : 'Pick a group'}
                </Text>
                {selectedGroup ? (
                  <Text
                    style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSoft }}
                    numberOfLines={1}
                  >
                    {selectedGroup.kind === 'event' ? 'Event board' : 'Center board'}
                  </Text>
                ) : null}
              </View>
              <ChevronDown size={16} color={colors.textSoft} />
            </Pressable>

            {groupPickerOpen ? (
              <View
                style={{
                  marginTop: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  overflow: 'hidden',
                }}
              >
                {sortedGroups.map((group, index) => {
                  const active = group.id === selectedGroup?.id
                  return (
                    <Pressable
                      key={group.id}
                      onPress={() => {
                        setGroupId(group.id)
                        setGroupPickerOpen(false)
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 11,
                        backgroundColor: active ? colors.orangeSoft : colors.card,
                        borderBottomWidth: index < sortedGroups.length - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 7,
                          backgroundColor: colors.panel,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {group.kind === 'event' ? (
                          <CalendarDays size={12} color={colors.textMuted} strokeWidth={2.3} />
                        ) : (
                          <Building2 size={12} color={colors.textMuted} strokeWidth={2.3} />
                        )}
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          fontFamily: 'Inclusive Sans',
                          fontSize: 14,
                          color: colors.text,
                        }}
                        numberOfLines={1}
                      >
                        {group.title}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <Avatar name="You" initials="YO" size={38} backgroundColor={colors.orange} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <TextInput
                autoFocus
                multiline
                value={body}
                onChangeText={setBody}
                placeholder={
                  selectedGroup?.kind === 'event'
                    ? `Share something with ${selectedGroup.title}...`
                    : 'Share something with your center...'
                }
                placeholderTextColor={colors.textSoft}
                style={{
                  minHeight: 160,
                  fontFamily: 'Inclusive Sans',
                  fontSize: 16,
                  lineHeight: 23,
                  color: colors.text,
                  textAlignVertical: 'top',
                  paddingTop: 6,
                }}
              />
            </View>
          </View>

          <Text
            style={{
              marginTop: 16,
              fontFamily: 'Inclusive Sans',
              fontSize: 12.5,
              color: colors.textSoft,
              lineHeight: 18,
            }}
          >
            Visible to verified members in {selectedGroup?.title || 'your group'}.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}
