import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, ActivityIndicator, TextInput } from 'react-native'
import { Copy, Users, ToggleLeft, ToggleRight, Plus, X, Ticket } from 'lucide-react-native'
import AdminTable, { type Column } from './AdminTable'
import AdminDetailPanel from './AdminDetailPanel'
import ConfirmDialog from './ConfirmDialog'
import {
  fetchAdminInviteCodes,
  adminCreateInviteCode,
  adminToggleInviteCode,
  fetchAdminInviteCodeUsers,
  type InviteCodeData,
  type UserData,
} from '../../utils/api'
import { useDetailColors } from '../../hooks/useDetailColors'
import { useTheme } from '../contexts'
import { Avatar } from '../ui'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso?: string): string {
  if (!iso) return 'Unknown'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// InviteCodesTab
// ---------------------------------------------------------------------------

export default function InviteCodesTab() {
  const colors = useDetailColors()
  const { isDark } = useTheme()

  const [codes, setCodes] = useState<InviteCodeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCode, setSelectedCode] = useState<InviteCodeData | null>(null)
  const [codeUsers, setCodeUsers] = useState<UserData[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Create form state
  const [showCreate, setShowCreate] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newVerLevel, setNewVerLevel] = useState('45')
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  // Toggle confirm
  const [confirmToggleVisible, setConfirmToggleVisible] = useState(false)

  const loadCodes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchAdminInviteCodes()
      setCodes(result.data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load invite codes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCodes()
  }, [loadCodes])

  // Load users when a code is selected
  useEffect(() => {
    if (!selectedCode) {
      setCodeUsers([])
      return
    }
    let cancelled = false
    setLoadingUsers(true)
    fetchAdminInviteCodeUsers(selectedCode.code)
      .then((users) => {
        if (!cancelled) setCodeUsers(users)
      })
      .catch(() => {
        if (!cancelled) setCodeUsers([])
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false)
      })
    return () => { cancelled = true }
  }, [selectedCode])

  // --- Table columns ---
  const columns: Column<InviteCodeData>[] = useMemo(
    () => [
      {
        key: 'code',
        header: 'Code',
        flex: 2,
        render: (item: InviteCodeData) => (
          <Text
            style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text, letterSpacing: 0.5 }}
            numberOfLines={1}
          >
            {item.code}
          </Text>
        ),
      },
      {
        key: 'label',
        header: 'Label',
        flex: 2,
        render: (item: InviteCodeData) => (
          <Text
            style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }}
            numberOfLines={1}
          >
            {item.label}
          </Text>
        ),
      },
      {
        key: 'usage',
        header: 'Signups',
        flex: 1,
        render: (item: InviteCodeData) => (
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }}>
            {item.usageCount}
          </Text>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        flex: 1,
        render: (item: InviteCodeData) => {
          const active = item.isActive
          return (
            <View
              style={{
                backgroundColor: active ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)',
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 4,
                alignSelf: 'flex-start',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inclusive Sans',
                  fontSize: 10,
                  color: active ? '#22c55e' : '#ef4444',
                }}
              >
                {active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          )
        },
      },
    ],
    [colors],
  )

  // --- Actions ---
  const handleToggle = async () => {
    setConfirmToggleVisible(false)
    if (!selectedCode) return
    try {
      await adminToggleInviteCode(selectedCode.code)
      // Refresh
      const result = await fetchAdminInviteCodes()
      setCodes(result.data)
      const updated = result.data.find((c) => c.code === selectedCode.code)
      if (updated) setSelectedCode(updated)
    } catch (err) {
      console.error('Failed to toggle invite code:', err)
    }
  }

  const handleCreate = async () => {
    setCreateError('')
    if (!newCode.trim()) {
      setCreateError('Code is required')
      return
    }
    if (!newLabel.trim()) {
      setCreateError('Label is required')
      return
    }
    const verLevel = parseInt(newVerLevel, 10)
    if (isNaN(verLevel) || verLevel < 0) {
      setCreateError('Valid verification level is required')
      return
    }

    try {
      setCreating(true)
      await adminCreateInviteCode({
        code: newCode.trim(),
        label: newLabel.trim(),
        verificationLevel: verLevel,
      })
      setNewCode('')
      setNewLabel('')
      setNewVerLevel('45')
      setShowCreate(false)
      loadCodes()
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create invite code')
    } finally {
      setCreating(false)
    }
  }

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code)
    }
  }

  // --- Detail panel ---
  const renderDetailContent = () => {
    if (!selectedCode) return null
    const c = selectedCode

    return (
      <View>
        <View style={detailStyles.header}>
          <View style={[detailStyles.iconCircle, { backgroundColor: c.isActive ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)' }]}>
            <Ticket size={24} color={c.isActive ? '#22c55e' : '#ef4444'} />
          </View>
          <Text style={[detailStyles.codeName, { color: colors.text }]}>{c.code}</Text>
          <Text style={[detailStyles.codeLabel, { color: colors.textMuted }]}>{c.label}</Text>
        </View>

        <View style={{ marginTop: 16 }}>
          <View style={infoStyles.row}>
            <View style={[infoStyles.iconBox, { backgroundColor: colors.iconBoxBg }]}>
              <Users size={14} color={colors.iconHeader} />
            </View>
            <Text style={[infoStyles.text, { color: colors.textSecondary }]}>
              {c.usageCount} signup{c.usageCount !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={infoStyles.row}>
            <View style={[infoStyles.iconBox, { backgroundColor: colors.iconBoxBg }]}>
              {c.isActive
                ? <ToggleRight size={14} color="#22c55e" />
                : <ToggleLeft size={14} color="#ef4444" />
              }
            </View>
            <Text style={[infoStyles.text, { color: c.isActive ? '#22c55e' : '#ef4444' }]}>
              {c.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <View style={infoStyles.row}>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textMuted }}>
              Verification Level: {c.verificationLevel} &middot; Created {formatDate(c.createdAt)}
            </Text>
          </View>
        </View>

        <View style={detailStyles.actions}>
          <Pressable
            onPress={() => handleCopyCode(c.code)}
            style={[detailStyles.actionBtn, { backgroundColor: colors.iconBoxBg }]}
          >
            <Copy size={14} color={colors.text} />
            <Text style={[detailStyles.actionBtnText, { color: colors.text, marginLeft: 6 }]}>Copy</Text>
          </Pressable>
          <Pressable
            onPress={() => setConfirmToggleVisible(true)}
            style={[detailStyles.actionBtn, { backgroundColor: colors.iconBoxBg }]}
          >
            <Text style={[detailStyles.actionBtnText, { color: c.isActive ? '#ef4444' : '#22c55e' }]}>
              {c.isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </Pressable>
        </View>

        {/* Users who used this code */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Signups ({codeUsers.length})
          </Text>
          {loadingUsers ? (
            <ActivityIndicator size="small" color="#E8862A" />
          ) : codeUsers.length === 0 ? (
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }}>
              No signups yet
            </Text>
          ) : (
            codeUsers.map((user) => (
              <View key={user.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Avatar
                  name={`${user.firstName} ${user.lastName}`}
                  image={user.profileImage ?? undefined}
                  size={24}
                  style={{ marginRight: 8 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text }} numberOfLines={1}>
                    {user.firstName} {user.lastName}
                  </Text>
                  <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted }} numberOfLines={1}>
                    {user.email || user.username}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    )
  }

  // --- Create form modal ---
  const renderCreateForm = () => {
    if (!showCreate) return null

    const inputStyle = {
      fontFamily: 'Inclusive Sans' as const,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.iconBoxBg,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    }

    return (
      <View style={[createStyles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[createStyles.modal, { backgroundColor: colors.panelBg, borderColor: colors.border }]}>
          <View style={createStyles.modalHeader}>
            <Text style={[createStyles.modalTitle, { color: colors.text }]}>Create Invite Link</Text>
            <Pressable onPress={() => { setShowCreate(false); setCreateError('') }}>
              <X size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <TextInput
            style={inputStyle}
            placeholder="Code (e.g. BETA-WAVE3)"
            placeholderTextColor={colors.textMuted}
            value={newCode}
            onChangeText={setNewCode}
            autoCapitalize="characters"
          />
          <TextInput
            style={inputStyle}
            placeholder="Label (e.g. Wave 3 - Extended testers)"
            placeholderTextColor={colors.textMuted}
            value={newLabel}
            onChangeText={setNewLabel}
          />
          <TextInput
            style={inputStyle}
            placeholder="Verification Level (default: 45)"
            placeholderTextColor={colors.textMuted}
            value={newVerLevel}
            onChangeText={setNewVerLevel}
            keyboardType="numeric"
          />

          {createError ? (
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: '#ef4444', marginBottom: 8 }}>
              {createError}
            </Text>
          ) : null}

          <Pressable
            onPress={handleCreate}
            disabled={creating}
            style={[createStyles.createBtn, creating && { opacity: 0.6 }]}
          >
            <Text style={createStyles.createBtnText}>
              {creating ? 'Creating...' : 'Create Link'}
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }

  if (loading && codes.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#E8862A" />
      </View>
    )
  }

  if (error && codes.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: '#DC2626', textAlign: 'center' }}>
          {error}
        </Text>
        <Pressable onPress={loadCodes} style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E8862A', borderRadius: 8 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: '#fff' }}>Retry</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.tablePanel}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Invite Links ({codes.length})</Text>
          <Pressable
            onPress={() => setShowCreate(true)}
            style={styles.addBtn}
          >
            <Plus size={14} color="#fff" />
            <Text style={styles.addBtnText}>New Link</Text>
          </Pressable>
        </View>

        <AdminTable
          columns={columns}
          data={codes}
          keyExtractor={(c) => c.code}
          selectedId={selectedCode?.code ?? null}
          onRowPress={(item) =>
            setSelectedCode(item.code === selectedCode?.code ? null : item)
          }
        />
      </View>

      {selectedCode && (
        <AdminDetailPanel title="Invite Link" onClose={() => setSelectedCode(null)}>
          {renderDetailContent()}
        </AdminDetailPanel>
      )}

      <ConfirmDialog
        visible={confirmToggleVisible}
        title={selectedCode?.isActive ? 'Deactivate Link' : 'Activate Link'}
        message={
          selectedCode?.isActive
            ? `Deactivating "${selectedCode?.code}" will prevent new signups with this code. Existing users are unaffected.`
            : `Reactivating "${selectedCode?.code}" will allow new signups with this code.`
        }
        confirmLabel={selectedCode?.isActive ? 'Deactivate' : 'Activate'}
        onConfirm={handleToggle}
        onCancel={() => setConfirmToggleVisible(false)}
      />

      {renderCreateForm()}
    </View>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  tablePanel: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontFamily: 'Inclusive Sans', fontSize: 16 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8862A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  addBtnText: { fontFamily: 'Inclusive Sans', fontSize: 13, color: '#fff' },
})

const detailStyles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 8 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  codeName: { fontFamily: 'Inclusive Sans', fontSize: 16, marginTop: 8, letterSpacing: 0.5 },
  codeLabel: { fontFamily: 'Inclusive Sans', fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontFamily: 'Inclusive Sans', fontSize: 13 },
})

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconBox: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  text: { fontFamily: 'Inclusive Sans', fontSize: 13, flex: 1 },
})

const createStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modal: {
    width: 400,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: { fontFamily: 'Inclusive Sans', fontSize: 16 },
  createBtn: {
    backgroundColor: '#E8862A',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  createBtnText: { fontFamily: 'Inclusive Sans', fontSize: 14, color: '#fff' },
})
