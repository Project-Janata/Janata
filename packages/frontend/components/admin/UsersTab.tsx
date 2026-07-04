import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native'
import { Building2, Calendar, Shield } from 'lucide-react-native'
import AdminTable, { type Column } from './AdminTable'
import AdminDetailPanel from './AdminDetailPanel'
import AdminSearchInput from './AdminSearchInput'
import ConfirmDialog from './ConfirmDialog'
import {
  fetchAdminUsers,
  adminVerifyUser,
  adminDeleteUser,
  type UserData,
} from '../../utils/api'
import { useDetailColors } from '../../hooks/useDetailColors'
import { useTheme } from '../contexts'
import { Avatar } from '../ui'
import { useAnalytics } from '../../utils/analytics'

// ---------------------------------------------------------------------------
// Role badge config
// ---------------------------------------------------------------------------

const ROLE_COLORS = {
  super: { bg: 'rgba(232,134,42,0.2)', text: '#E8862A', label: 'Super' },
  verified: { bg: 'rgba(34,197,94,0.2)', text: '#22c55e', label: 'Verified' },
}

function getRoleBadgeType(user: UserData): 'super' | 'verified' | null {
  if (user.verificationLevel >= 107) return 'super'
  if (user.isVerified) return 'verified'
  return null
}

// ---------------------------------------------------------------------------
// Date formatter
// ---------------------------------------------------------------------------

function formatJoinDate(iso?: string): string {
  if (!iso) return 'Unknown'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// UsersTab
// ---------------------------------------------------------------------------

export default function UsersTab() {
  const colors = useDetailColors()
  const { isDark } = useTheme()
  const { width } = useWindowDimensions()
  const { track } = useAnalytics()
  const isCompact = width < 640

  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<UserData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const loadUsers = useCallback(async (q?: string) => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchAdminUsers({ q: q || undefined, limit: 100 })
      setUsers(result.data)
      setTotal(result.total)
    } catch (err: any) {
      if (__DEV__) console.error('Failed to load users:', err)
      setError(err?.message || 'Failed to load users. Are you logged in?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, loadUsers])

  // --- Table columns ---
  const columns: Column<UserData>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        flex: 2,
        render: (user: UserData) => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Avatar
              name={`${user.firstName} ${user.lastName}`}
              image={user.profileImage ?? undefined}
              size={22}
              style={{ marginRight: 8 }}
            />
            <Text
              style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text }}
              numberOfLines={1}
            >
              {user.firstName} {user.lastName}
            </Text>
          </View>
        ),
      },
      {
        key: 'email',
        header: 'Email',
        flex: 2,
        render: (user: UserData) => (
          <Text
            style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }}
            numberOfLines={1}
          >
            {user.email || user.username}
          </Text>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        flex: 1,
        render: (user: UserData) => {
          const badge = getRoleBadgeType(user)
          if (!badge) {
            return (
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }}>
                {'\u2014'}
              </Text>
            )
          }
          const rc = ROLE_COLORS[badge]
          return (
            <View
              style={{
                backgroundColor: rc.bg,
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 4,
                alignSelf: 'flex-start',
              }}
            >
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 10, color: rc.text }}>
                {rc.label}
              </Text>
            </View>
          )
        },
      },
    ],
    [colors],
  )

  // --- Actions ---
  const handleVerifyToggle = async () => {
    if (!selectedUser) return
    try {
      const result = await adminVerifyUser(selectedUser.id, {
        isVerified: !selectedUser.isVerified,
      })
      track('admin_user_verification_changed', { userId: selectedUser.id, source: 'admin' })
      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, isVerified: result.isVerified } : u
        )
      )
      setSelectedUser((prev) =>
        prev ? { ...prev, isVerified: result.isVerified } : null
      )
    } catch (err) {
      if (__DEV__) console.error('Failed to toggle verification:', err)
    }
  }

  const handleConfirmRemove = async () => {
    setConfirmDeleteVisible(false)
    if (!selectedUser) return
    try {
      await adminDeleteUser(selectedUser.id)
      track('admin_user_deleted', { userId: selectedUser.id, source: 'admin' })
      setSelectedUser(null)
      loadUsers(search)
    } catch (err) {
      if (__DEV__) console.error('Failed to delete user:', err)
    }
  }

  // --- Detail panel content ---
  const renderDetailContent = () => {
    if (!selectedUser) return null
    const u = selectedUser
    const badgeType = getRoleBadgeType(u)
    const isSuperAdmin = badgeType === 'super'

    return (
      <View>
        <View style={detailStyles.userHeader}>
          <Avatar
            name={`${u.firstName} ${u.lastName}`}
            image={u.profileImage ?? undefined}
            size={56}
          />
          <Text style={[detailStyles.userName, { color: colors.text }]}>
            {u.firstName} {u.lastName}
          </Text>
          <Text style={[detailStyles.userEmail, { color: colors.textMuted }]}>
            {u.email || u.username}
          </Text>
        </View>

        <View style={{ marginTop: 16 }}>
          <View style={infoStyles.row}>
            <View style={[infoStyles.iconBox, { backgroundColor: colors.iconBoxBg }]}>
              <Building2 size={14} color={colors.iconHeader} />
            </View>
            <Text style={[infoStyles.text, { color: colors.textSecondary }]}>
              {u.centerID || 'No center'}
            </Text>
          </View>
          <View style={infoStyles.row}>
            <View style={[infoStyles.iconBox, { backgroundColor: colors.iconBoxBg }]}>
              <Calendar size={14} color={colors.iconHeader} />
            </View>
            <Text style={[infoStyles.text, { color: colors.textSecondary }]}>
              Joined {formatJoinDate(u.createdAt)}
            </Text>
          </View>
          <View style={infoStyles.row}>
            <View style={[infoStyles.iconBox, { backgroundColor: colors.iconBoxBg }]}>
              <Shield size={14} color={u.isVerified ? '#22c55e' : colors.iconHeader} />
            </View>
            <Text style={[infoStyles.text, { color: u.isVerified ? '#22c55e' : colors.textMuted }]}>
              {u.isVerified ? 'Verified' : 'Not verified'}
              {isSuperAdmin ? ' (Super Admin)' : ''}
            </Text>
          </View>
        </View>

        <View style={detailStyles.actions}>
          <Pressable onPress={handleVerifyToggle} style={[detailStyles.actionBtn, { backgroundColor: colors.iconBoxBg }]}>
            <Text style={[detailStyles.actionBtnText, { color: colors.text }]}>
              {u.isVerified ? 'Unverify' : 'Verify'}
            </Text>
          </Pressable>
          <Pressable onPress={() => setConfirmDeleteVisible(true)} style={[detailStyles.actionBtn, { backgroundColor: colors.iconBoxBg }]}>
            <Text style={[detailStyles.actionBtnText, { color: '#ef4444' }]}>Remove User</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  if (loading && users.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#E8862A" />
      </View>
    )
  }

  if (error && users.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: '#DC2626', textAlign: 'center' }}>
          {error}
        </Text>
        <Pressable onPress={() => loadUsers()} style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E8862A', borderRadius: 8 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: '#fff' }}>Retry</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.tablePanel}>
        <View style={[styles.header, isCompact && styles.compactHeader]}>
          <Text style={[styles.title, { color: colors.text }]}>Users ({total})</Text>
          <View style={isCompact ? styles.compactSearchWrap : styles.searchWrap}>
            <AdminSearchInput value={search} onChangeText={setSearch} placeholder="Search users..." />
          </View>
        </View>

        <AdminTable
          columns={columns}
          data={users}
          keyExtractor={(u) => u.id}
          selectedId={selectedUser?.id ?? null}
          onRowPress={(item) =>
            setSelectedUser(item.id === selectedUser?.id ? null : item)
          }
        />
      </View>

      {selectedUser && (
        <AdminDetailPanel title="User Details" onClose={() => setSelectedUser(null)}>
          {renderDetailContent()}
        </AdminDetailPanel>
      )}

      <ConfirmDialog
        visible={confirmDeleteVisible}
        title="Remove User"
        message={`Are you sure you want to remove ${selectedUser?.firstName ?? ''} ${selectedUser?.lastName ?? ''}? This action cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmDeleteVisible(false)}
      />
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
  compactHeader: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 10,
  },
  title: { fontFamily: 'Inclusive Sans', fontSize: 16 },
  searchWrap: { width: 240 },
  compactSearchWrap: { width: '100%' },
})

const detailStyles = StyleSheet.create({
  userHeader: { alignItems: 'center', marginBottom: 8 },
  userName: { fontFamily: 'Inclusive Sans', fontSize: 16, marginTop: 8 },
  userEmail: { fontFamily: 'Inclusive Sans', fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { fontFamily: 'Inclusive Sans', fontSize: 13 },
})

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  iconBox: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  text: { fontFamily: 'Inclusive Sans', fontSize: 13, flex: 1 },
})
