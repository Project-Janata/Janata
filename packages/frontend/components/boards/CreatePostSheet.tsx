import React, { useState, useEffect, useMemo } from 'react'
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Building2, CalendarDays, ChevronDown, Globe2, ImagePlus, X } from 'lucide-react-native'
import { Avatar } from '../ui'
import { useUser } from '../contexts'
import type { AppColors } from '../../tokens'
import { useAnalytics } from '../../utils/analytics'
import { uploadBoardImage } from '../../utils/api'
import type { GroupKind } from './types'

let ImagePicker: typeof import('expo-image-picker') | null = null
try {
  ImagePicker = require('expo-image-picker')
} catch {}

type GroupOption = {
  id: string
  kind: GroupKind
  title: string
  parentId: string
}

const PUBLIC_GROUP: GroupOption = {
  id: 'public',
  kind: 'public',
  title: 'Public',
  parentId: '',
}

export function CreatePostSheet({
  visible,
  colors,
  groups,
  onClose,
  onSubmit,
}: {
  visible: boolean
  colors: AppColors
  groups: GroupOption[]
  onClose: () => void
  onSubmit?: (group: GroupOption, body: string, imageUrl?: string | null) => Promise<void> | void
}) {
  const { track } = useAnalytics()
  const { user } = useUser()
  const composerName =
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.username || 'You'
  const [body, setBody] = useState('')
  const [groupId, setGroupId] = useState<string | undefined>()
  const [groupPickerOpen, setGroupPickerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | { uri: string; name: string; type: string } | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
  }

  // Web image picker via a transient file input. Native uses pickImageNative.
  const pickImageWeb = () => {
    if (typeof document === 'undefined') return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) {
        clearImage()
        setImageFile(file)
        setImagePreview(URL.createObjectURL(file))
        track('board_post_image_added', { source: 'create_post_sheet' })
      }
    }
    input.click()
  }

  // Native image picker (expo-image-picker). Mirrors the web flow; the upload
  // takes the { uri, name, type } descriptor RN's FormData accepts.
  const pickImageNative = async () => {
    if (!ImagePicker) return
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.85,
    })
    if (result.canceled || !result.assets.length) return
    const asset = result.assets[0]
    clearImage()
    setImageFile({
      uri: asset.uri,
      name: asset.fileName || `photo-${asset.assetId ?? 'board'}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    })
    setImagePreview(asset.uri)
    track('board_post_image_added', { source: 'create_post_sheet' })
  }

  const sortedGroups = useMemo(() => {
    const boardGroups = groups
      .filter((group) => group.kind !== 'public')
      .sort((a, b) => (a.kind !== b.kind ? (a.kind === 'center' ? -1 : 1) : a.title.localeCompare(b.title)))
    return [PUBLIC_GROUP, ...boardGroups]
  }, [groups])
  const selectedGroup = sortedGroups.find((g) => g.id === groupId) ?? sortedGroups[0]
  const selectedGroupSubtitle =
    selectedGroup?.kind === 'public'
      ? 'Visible to all signed-in members'
      : selectedGroup?.kind === 'event'
        ? 'Event board'
        : 'Center board'

  useEffect(() => {
    if (!visible) { setBody(''); setGroupPickerOpen(false); clearImage(); return }
    if (!groupId && sortedGroups[0]) setGroupId(sortedGroups[0].id)
  }, [visible, groupId, sortedGroups])

  const canPost = (body.trim().length > 0 || !!imageFile) && !!selectedGroup && !submitting

  const handleSubmit = async () => {
    if (!canPost || !selectedGroup) return
    try {
      setSubmitting(true)
      let imageUrl: string | null = null
      if (imageFile) imageUrl = await uploadBoardImage(imageFile)
      await onSubmit?.(selectedGroup, body.trim(), imageUrl)
      track('board_post_created', {
        source: 'create_post_sheet',
        group_id: selectedGroup.id,
        group_kind: selectedGroup.kind,
        group_title: selectedGroup.title,
        body_length: body.trim().length,
        has_image: !!imageFile,
      })
      setBody('')
      clearImage()
      onClose()
    } catch (err) {
      track('board_post_create_failed', {
        source: 'create_post_sheet',
        group_id: selectedGroup.id,
        group_kind: selectedGroup.kind,
      })
      throw err
    } finally {
      setSubmitting(false)
    }
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
        style={{ flex: 1, backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Platform.OS === 'ios' ? 20 : 16, paddingTop: Platform.OS === 'ios' ? 14 : 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable onPress={() => { track('board_post_dismissed', { source: 'create_post_sheet', body_length: body.trim().length }); onClose() }} hitSlop={8} style={{ minWidth: 64 }}>
            <X size={22} color={colors.textMuted} />
          </Pressable>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: colors.text }}>New post</Text>
          <Pressable disabled={!canPost} onPress={handleSubmit} hitSlop={8} style={{ minWidth: 64, alignItems: 'flex-end', opacity: canPost ? 1 : 0.4 }}>
            <Text style={{ fontWeight: '500', fontSize: 15, color: colors.accent }}>
              {submitting ? 'Posting' : 'Post'}
            </Text>
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          {/* Board picker */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 11, letterSpacing: 0.9, color: colors.textFaint, marginBottom: 8 }}>
              POST TO
            </Text>
            <Pressable
              onPress={() => setGroupPickerOpen((o) => { const next = !o; if (next) track('board_group_picker_opened', { source: 'create_post_sheet', current_group_id: selectedGroup?.id, current_group_kind: selectedGroup?.kind }); return next })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                {selectedGroup?.kind === 'event'
                  ? <CalendarDays size={14} color={colors.accent} strokeWidth={2.4} />
                  : selectedGroup?.kind === 'public'
                    ? <Globe2 size={14} color={colors.accent} strokeWidth={2.4} />
                  : <Building2 size={14} color={colors.accent} strokeWidth={2.4} />}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }} numberOfLines={1}>
                  {selectedGroup ? selectedGroup.title : 'Pick a group'}
                </Text>
                {selectedGroup && (
                  <Text style={{ fontSize: 12, color: colors.textFaint }} numberOfLines={1}>
                    {selectedGroupSubtitle}
                  </Text>
                )}
              </View>
              <ChevronDown size={16} color={colors.textFaint} />
            </Pressable>

            {groupPickerOpen && (
              <View style={{ marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden' }}>
                {sortedGroups.map((group, index) => {
                  const active = group.id === selectedGroup?.id
                  return (
                    <Pressable
                      key={group.id}
                      onPress={() => { track('board_group_selected', { source: 'create_post_sheet', group_id: group.id, group_kind: group.kind, group_title: group.title }); setGroupId(group.id); setGroupPickerOpen(false) }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: active ? colors.accentSoft : colors.card, borderBottomWidth: index < sortedGroups.length - 1 ? 1 : 0, borderBottomColor: colors.border }}
                    >
                      <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' }}>
                        {group.kind === 'event'
                          ? <CalendarDays size={12} color={colors.textMuted} strokeWidth={2.3} />
                          : group.kind === 'public'
                            ? <Globe2 size={12} color={colors.textMuted} strokeWidth={2.3} />
                          : <Building2 size={12} color={colors.textMuted} strokeWidth={2.3} />}
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
            <Avatar image={user?.profileImage || undefined} name={composerName} size={38} backgroundColor={colors.accent} />
            <TextInput
              autoFocus
              multiline
              value={body}
              onChangeText={setBody}
              placeholder={
                selectedGroup?.kind === 'public'
                  ? 'Share something with Janata...'
                  : selectedGroup?.kind === 'event'
                    ? `Share something with ${selectedGroup.title}...`
                    : 'Share something with your center...'
              }
              placeholderTextColor={colors.textFaint}
              style={{ flex: 1, minHeight: 160, fontFamily: 'Inclusive Sans', fontSize: 16, lineHeight: 23, color: colors.text, textAlignVertical: 'top', paddingTop: 6 }}
            />
          </View>

          {imagePreview ? (
            <View style={{ marginTop: 14, alignSelf: 'flex-start' }}>
              <Image
                source={{ uri: imagePreview }}
                style={{ width: 168, height: 168, borderRadius: 14, backgroundColor: colors.panel }}
                resizeMode="cover"
              />
              <Pressable
                onPress={clearImage}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
                style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={15} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={Platform.OS === 'web' ? pickImageWeb : pickImageNative}
              accessibilityRole="button"
              style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: colors.border }}
            >
              <ImagePlus size={17} color={colors.accent} />
              <Text style={{ fontSize: 14, color: colors.text }}>Add photo</Text>
            </Pressable>
          )}

          <Text style={{ marginTop: 16, fontSize: 12, lineHeight: 18, color: colors.textFaint }}>
            {selectedGroup?.kind === 'public'
              ? 'Visible to signed-in Janata members.'
              : `Visible to members in ${selectedGroup?.title || 'your group'}.`}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}
