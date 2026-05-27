import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, Pressable, ActivityIndicator, TextInput, ScrollView } from 'react-native'
import { Bell, PaperPlaneTilt, Trash, CaretDown } from 'phosphor-react-native'
import AdminTable, { type Column } from './AdminTable'
import AdminSearchInput from './AdminSearchInput'
import ConfirmDialog from './ConfirmDialog'
import {
  fetchAdminNotifications,
  fetchAdminNotificationStats,
  adminSendNotification,
  adminDeleteNotification,
  type AdminNotification,
  type AdminNotificationStats,
} from '../../utils/api'
import { useDetailColors } from '../../hooks/useDetailColors'
import { useTheme } from '../contexts'

const NOTIFICATION_TYPE_NAMES: Record<number, string> = {
  1: 'Event Reminder',
  2: 'Event Created',
  3: 'Event Cancelled',
  4: 'Event Updated',
  5: 'Attendee Joined',
  6: 'Center Announcement',
  7: 'System Notification',
}

export default function NotificationsTab() {
  const colors = useDetailColors()
  const { isDark } = useTheme()
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [stats, setStats] = useState<AdminNotificationStats | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminNotification | null>(null)
  const [filterType, setFilterType] = useState<number | undefined>(undefined)

  // Send form state
  const [showSendForm, setShowSendForm] = useState(false)
  const [sendTitle, setSendTitle] = useState('')
  const [sendMessage, setSendMessage] = useState('')
  const [sendTypeId, setSendTypeId] = useState(7) // default System Notification
  const [sendBroadcast, setSendBroadcast] = useState(true)
  const [sendUserId, setSendUserId] = useState('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchAdminNotifications({ limit: 100, typeId: filterType })
      setNotifications(result.data)
      setTotal(result.total)
    } catch (err: any) {
      setError(err?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [filterType])

  const loadStats = useCallback(async () => {
    try {
      const s = await fetchAdminNotificationStats()
      setStats(s)
    } catch {
      // stats are non-critical
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    loadStats()
  }, [loadNotifications, loadStats])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await adminDeleteNotification(deleteTarget.id)
      setDeleteTarget(null)
      setSelectedId(null)
      loadNotifications()
      loadStats()
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  const handleSend = async () => {
    if (!sendTitle.trim() || !sendMessage.trim()) return
    try {
      setSending(true)
      setSendResult(null)
      const result = await adminSendNotification({
        title: sendTitle.trim(),
        message: sendMessage.trim(),
        typeId: sendTypeId,
        broadcast: sendBroadcast,
        userId: sendBroadcast ? undefined : sendUserId.trim() || undefined,
      })
      setSendResult(result.message)
      setSendTitle('')
      setSendMessage('')
      setSendUserId('')
      loadNotifications()
      loadStats()
    } catch (err: any) {
      setSendResult(`Error: ${err.message}`)
    } finally {
      setSending(false)
    }
  }

  const selected = notifications.find((n) => n.id === selectedId) ?? null

  const renderTypeBadge = (typeId: number) => {
    const name = NOTIFICATION_TYPE_NAMES[typeId] || `Type ${typeId}`
    const isSystem = typeId === 7
    const bg = isSystem
      ? isDark ? 'rgba(59,130,246,0.2)' : '#EFF6FF'
      : isDark ? 'rgba(232,134,42,0.2)' : '#FFF7ED'
    const textColor = isSystem
      ? isDark ? '#93C5FD' : '#2563EB'
      : isDark ? '#FBB86C' : '#C2410C'

    return (
      <View style={{ alignSelf: 'flex-start', backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 10, color: textColor }}>{name}</Text>
      </View>
    )
  }

  const renderReadStatus = (isRead: boolean) => {
    const bg = isRead
      ? isDark ? 'rgba(113,113,122,0.2)' : '#F4F4F5'
      : isDark ? 'rgba(22,163,74,0.2)' : '#F0FDF4'
    const textColor = isRead
      ? isDark ? '#A1A1AA' : '#71717A'
      : isDark ? '#4ADE80' : '#16A34A'

    return (
      <View style={{ alignSelf: 'flex-start', backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 10, color: textColor }}>
          {isRead ? 'Read' : 'Unread'}
        </Text>
      </View>
    )
  }

  const columns: Column<AdminNotification>[] = [
    {
      key: 'title',
      header: 'Title',
      flex: 2,
      render: (item) => (
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text }} numberOfLines={1}>
          {item.title}
        </Text>
      ),
    },
    {
      key: 'recipient',
      header: 'Recipient',
      flex: 1.5,
      render: (item) => (
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }} numberOfLines={1}>
          {item.recipientName}
        </Text>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      flex: 1.2,
      render: (item) => renderTypeBadge(item.typeId),
    },
    {
      key: 'status',
      header: 'Status',
      flex: 0.8,
      render: (item) => renderReadStatus(item.isRead),
    },
    {
      key: 'date',
      header: 'Date',
      flex: 1,
      render: (item) => (
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textMuted }}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      ),
    },
  ]

  if (loading && notifications.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#E8862A" />
      </View>
    )
  }

  if (error && notifications.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: '#DC2626', textAlign: 'center' }}>
          {error}
        </Text>
        <Pressable onPress={() => loadNotifications()} style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E8862A', borderRadius: 8 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: '#fff' }}>Retry</Text>
        </Pressable>
      </View>
    )
  }

  const inputBg = isDark ? '#262626' : '#fff'
  const inputBorder = isDark ? '#404040' : '#D6D3D1'
  const inputColor = isDark ? '#E5E5E5' : '#1C1917'

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={{ flex: 1, padding: 20 }}>
        {/* Stats bar */}
        {stats && (
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
            {[
              { label: 'Total', value: stats.total },
              { label: 'Unread', value: stats.unread },
              { label: 'Last 24h', value: stats.last24h },
            ].map((s) => (
              <View
                key={s.label}
                style={{
                  backgroundColor: isDark ? '#1a1a1a' : '#F5F5F4',
                  borderRadius: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: isDark ? '#262626' : '#E7E5E4',
                }}
              >
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
                  {s.label}
                </Text>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 20, color: colors.text }}>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Header row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 18, color: colors.text }}>
              Notifications ({total})
            </Text>

            {/* Type filter */}
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <Pressable
                onPress={() => setFilterType(undefined)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: filterType === undefined ? '#E8862A' : (isDark ? '#262626' : '#F5F5F4'),
                }}
              >
                <Text style={{
                  fontFamily: 'Inclusive Sans',
                  fontSize: 11,
                  color: filterType === undefined ? '#fff' : colors.textSecondary,
                }}>
                  All
                </Text>
              </Pressable>
              {[7, 6, 2, 3, 4].map((tid) => (
                <Pressable
                  key={tid}
                  onPress={() => setFilterType(filterType === tid ? undefined : tid)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: filterType === tid ? '#E8862A' : (isDark ? '#262626' : '#F5F5F4'),
                  }}
                >
                  <Text style={{
                    fontFamily: 'Inclusive Sans',
                    fontSize: 11,
                    color: filterType === tid ? '#fff' : colors.textSecondary,
                  }}>
                    {NOTIFICATION_TYPE_NAMES[tid]?.replace('Event ', '').replace('Center ', '')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            onPress={() => setShowSendForm(!showSendForm)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#E8862A',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <PaperPlaneTilt size={14} color="#fff" />
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: '#fff' }}>Send</Text>
          </Pressable>
        </View>

        {/* Send form */}
        {showSendForm && (
          <View style={{
            backgroundColor: isDark ? '#1a1a1a' : '#F5F5F4',
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: isDark ? '#262626' : '#E7E5E4',
          }}>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text, marginBottom: 12 }}>
              Send Notification
            </Text>

            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>Title</Text>
                <TextInput
                  value={sendTitle}
                  onChangeText={setSendTitle}
                  placeholder="Notification title"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    fontFamily: 'Inclusive Sans',
                    fontSize: 13,
                    color: inputColor,
                    backgroundColor: inputBg,
                    borderWidth: 1,
                    borderColor: inputBorder,
                    borderRadius: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                  }}
                />
              </View>
              <View style={{ width: 160 }}>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>Type</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                  {[7, 6].map((tid) => (
                    <Pressable
                      key={tid}
                      onPress={() => setSendTypeId(tid)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: sendTypeId === tid ? '#E8862A' : (isDark ? '#333' : '#E7E5E4'),
                      }}
                    >
                      <Text style={{
                        fontFamily: 'Inclusive Sans',
                        fontSize: 11,
                        color: sendTypeId === tid ? '#fff' : colors.textSecondary,
                      }}>
                        {NOTIFICATION_TYPE_NAMES[tid]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>Message</Text>
              <TextInput
                value={sendMessage}
                onChangeText={setSendMessage}
                placeholder="Notification message"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
                style={{
                  fontFamily: 'Inclusive Sans',
                  fontSize: 13,
                  color: inputColor,
                  backgroundColor: inputBg,
                  borderWidth: 1,
                  borderColor: inputBorder,
                  borderRadius: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  minHeight: 48,
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <Pressable
                onPress={() => setSendBroadcast(true)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <View style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: sendBroadcast ? '#E8862A' : colors.textMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {sendBroadcast && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E8862A' }} />}
                </View>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.text }}>Broadcast to all</Text>
              </Pressable>

              <Pressable
                onPress={() => setSendBroadcast(false)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <View style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: !sendBroadcast ? '#E8862A' : colors.textMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {!sendBroadcast && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E8862A' }} />}
                </View>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.text }}>Specific user</Text>
              </Pressable>

              {!sendBroadcast && (
                <TextInput
                  value={sendUserId}
                  onChangeText={setSendUserId}
                  placeholder="User ID"
                  placeholderTextColor={colors.textMuted}
                  style={{
                    fontFamily: 'Inclusive Sans',
                    fontSize: 12,
                    color: inputColor,
                    backgroundColor: inputBg,
                    borderWidth: 1,
                    borderColor: inputBorder,
                    borderRadius: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    width: 200,
                  }}
                />
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                onPress={handleSend}
                disabled={sending || !sendTitle.trim() || !sendMessage.trim()}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: sending || !sendTitle.trim() || !sendMessage.trim() ? (isDark ? '#444' : '#D6D3D1') : '#E8862A',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <PaperPlaneTilt size={14} color="#fff" />
                )}
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: '#fff' }}>
                  {sending ? 'Sending...' : sendBroadcast ? 'Send to All' : 'Send'}
                </Text>
              </Pressable>
              {sendResult && (
                <Text style={{
                  fontFamily: 'Inclusive Sans',
                  fontSize: 12,
                  color: sendResult.startsWith('Error') ? '#DC2626' : (isDark ? '#4ADE80' : '#16A34A'),
                }}>
                  {sendResult}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Table */}
        <AdminTable
          columns={columns}
          data={notifications}
          keyExtractor={(item) => item.id}
          selectedId={selectedId}
          onRowPress={(item) => setSelectedId(item.id === selectedId ? null : item.id)}
        />

        {notifications.length === 0 && !loading && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Bell size={32} color={colors.textMuted} />
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.textMuted, marginTop: 12 }}>
              No notifications yet
            </Text>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
              Send a notification or wire up triggers to see them here
            </Text>
          </View>
        )}
      </View>

      {/* Detail panel */}
      {selected && (
        <View style={{
          width: 320,
          borderLeftWidth: 1,
          borderLeftColor: colors.border,
          backgroundColor: colors.panelBg,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.text }} numberOfLines={1}>
              {selected.title}
            </Text>
            <Pressable onPress={() => setSelectedId(null)} hitSlop={8}>
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 18, color: colors.textMuted }}>x</Text>
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <View style={{ gap: 14 }}>
              {/* Message */}
              <View>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Message
                </Text>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text, lineHeight: 20 }}>
                  {selected.message}
                </Text>
              </View>

              {/* Recipient */}
              <View>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Recipient
                </Text>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text }}>
                  {selected.recipientName}
                </Text>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted }}>
                  @{selected.recipientUsername} / {selected.userId}
                </Text>
              </View>

              {/* Type & Status */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {renderTypeBadge(selected.typeId)}
                {renderReadStatus(selected.isRead)}
              </View>

              {/* Timestamps */}
              <View>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Created
                </Text>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSecondary }}>
                  {new Date(selected.createdAt).toLocaleString()}
                </Text>
              </View>

              {selected.readAt && (
                <View>
                  <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Read At
                  </Text>
                  <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSecondary }}>
                    {new Date(selected.readAt).toLocaleString()}
                  </Text>
                </View>
              )}

              {selected.actionUrl && (
                <View>
                  <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Action URL
                  </Text>
                  <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: '#E8862A' }}>
                    {selected.actionUrl}
                  </Text>
                </View>
              )}

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <Pressable
                  onPress={() => setDeleteTarget(selected)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: colors.iconBoxBg,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Trash size={14} color={isDark ? '#F87171' : '#DC2626'} />
                  <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: isDark ? '#F87171' : '#DC2626' }}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Delete Notification"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  )
}
