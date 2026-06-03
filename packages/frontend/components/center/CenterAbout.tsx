import React, { useState } from 'react'
import { View, TextInput, Pressable, ActivityIndicator } from 'react-native'
import { Pencil, Check, X } from 'lucide-react-native'
import { Text } from '../ui'
import { useColors } from '../../hooks/useColors'
import { adminUpdateCenter } from '../../utils/api'
import { useAnalytics } from '../../utils/analytics'

// Editable About + Point of Contact for a center (#285). Admins get an inline
// editor; everyone else sees read-only. Uses a local override so a save is
// reflected immediately without a parent refetch (useCenterDetail exposes none,
// and the desktop panel receives `center` as a prop).
export function CenterAbout({
  centerId,
  description,
  pointOfContact,
  canEdit,
}: {
  centerId: string
  description?: string | null
  pointOfContact?: string | null
  canEdit: boolean
}) {
  const c = useColors()
  const { track } = useAnalytics()
  const [desc, setDesc] = useState((description ?? '').trim())
  const [poc, setPoc] = useState((pointOfContact ?? '').trim())
  const [editing, setEditing] = useState(false)
  const [draftDesc, setDraftDesc] = useState(desc)
  const [draftPoc, setDraftPoc] = useState(poc)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasContent = !!desc || !!poc
  if (!hasContent && !canEdit) return null

  const startEdit = () => {
    setDraftDesc(desc)
    setDraftPoc(poc)
    setError(null)
    setEditing(true)
    track('center_about_edit_opened', { centerId })
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await adminUpdateCenter(centerId, {
        description: draftDesc.trim(),
        pointOfContact: draftPoc.trim() || null,
      })
      setDesc(draftDesc.trim())
      setPoc(draftPoc.trim())
      setEditing(false)
      track('center_about_saved', { centerId })
    } catch {
      setError('Could not save. Please try again.')
      track('center_about_save_failed', { centerId })
    } finally {
      setSaving(false)
    }
  }

  const label = (t: string) => (
    <Text style={{ fontSize: 11, letterSpacing: 0.8, color: c.textFaint }}>{t}</Text>
  )

  return (
    <View style={{ gap: 12 }}>
      {canEdit && !editing ? (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Pressable
            onPress={startEdit}
            accessibilityRole="button"
            accessibilityLabel="Edit about"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999, backgroundColor: c.accentSoft }}
          >
            <Pencil size={13} color={c.accent} />
            <Text style={{ fontSize: 12.5, color: c.accent, fontWeight: '600' }}>Edit</Text>
          </Pressable>
        </View>
      ) : null}

      {editing ? (
        <View style={{ gap: 12, borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, padding: 14 }}>
          <View style={{ gap: 4 }}>
            {label('DESCRIPTION')}
            <TextInput
              value={draftDesc}
              onChangeText={setDraftDesc}
              placeholder="Describe this center"
              placeholderTextColor={c.textFaint}
              multiline
              textAlignVertical="top"
              style={{ minHeight: 84, fontSize: 15, lineHeight: 21, color: c.text }}
            />
          </View>
          <View style={{ height: 1, backgroundColor: c.border }} />
          <View style={{ gap: 4 }}>
            {label('POINT OF CONTACT')}
            <TextInput
              value={draftPoc}
              onChangeText={setDraftPoc}
              placeholder="Name of the coordinator"
              placeholderTextColor={c.textFaint}
              style={{ fontSize: 15, color: c.text }}
            />
          </View>
          {error ? <Text style={{ fontSize: 13, color: '#DC2626' }}>{error}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
            <Pressable
              onPress={() => setEditing(false)}
              disabled={saving}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: c.border }}
            >
              <X size={15} color={c.textMuted} />
              <Text style={{ fontSize: 14, color: c.textMuted }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={saving}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: c.accent, opacity: saving ? 0.6 : 1 }}
            >
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Check size={15} color="#fff" />}
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Save</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {desc ? (
            <Text style={{ fontSize: 15, lineHeight: 22, color: c.text }}>{desc}</Text>
          ) : (
            <Text style={{ fontSize: 14, color: c.textMuted, fontStyle: 'italic' }}>No description yet.</Text>
          )}
          {poc ? (
            <Text style={{ fontSize: 14, color: c.textMuted }}>Point of Contact: {poc}</Text>
          ) : null}
        </View>
      )}
    </View>
  )
}
