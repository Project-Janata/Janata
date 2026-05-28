import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { Trash2, UserX, Flag, ScrollText, ArrowLeft } from 'lucide-react-native'
import AdminTable, { type Column } from './AdminTable'
import AdminDetailPanel from './AdminDetailPanel'
import ConfirmDialog from './ConfirmDialog'
import {
  fetchAdminModerationQueue,
  adminDeleteReportedPost,
  adminSuspendUser,
  fetchAdminModerationAudit,
  type ModerationQueueItem,
  type ModerationAuditEntry,
} from '../../utils/api'
import { useDetailColors } from '../../hooks/useDetailColors'

function formatDate(iso?: string): string {
  if (!iso) return 'Unknown'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type PendingAction =
  | { kind: 'delete' }
  | { kind: 'suspend'; durationDays?: number }
  | null

export default function ModerationTab() {
  const colors = useDetailColors()

  const [items, setItems] = useState<ModerationQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ModerationQueueItem | null>(null)
  const [includeResolved, setIncludeResolved] = useState(false)
  const [pending, setPending] = useState<PendingAction>(null)
  const [acting, setActing] = useState(false)

  // Audit log view
  const [showAudit, setShowAudit] = useState(false)
  const [audit, setAudit] = useState<ModerationAuditEntry[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchAdminModerationQueue({ includeResolved })
      setItems(result.data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load moderation queue.')
    } finally {
      setLoading(false)
    }
  }, [includeResolved])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  const loadAudit = useCallback(async () => {
    try {
      setAuditLoading(true)
      const result = await fetchAdminModerationAudit({ limit: 100 })
      setAudit(result.data)
    } catch {
      setAudit([])
    } finally {
      setAuditLoading(false)
    }
  }, [])

  useEffect(() => {
    if (showAudit) loadAudit()
  }, [showAudit, loadAudit])

  const columns: Column<ModerationQueueItem>[] = useMemo(
    () => [
      {
        key: 'post',
        header: 'Reported post',
        flex: 3,
        render: (item: ModerationQueueItem) => (
          <Text
            style={{
              fontFamily: 'Inclusive Sans',
              fontSize: 13,
              color: item.post.deletedAt ? colors.textMuted : colors.text,
              fontStyle: item.post.deletedAt ? 'italic' : 'normal',
            }}
            numberOfLines={1}
          >
            {item.post.deletedAt ? '(removed) ' : ''}
            {item.post.body || '(no text)'}
          </Text>
        ),
      },
      {
        key: 'author',
        header: 'Author',
        flex: 2,
        render: (item: ModerationQueueItem) => (
          <Text
            style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }}
            numberOfLines={1}
          >
            {item.post.author.firstName} {item.post.author.lastName}
          </Text>
        ),
      },
      {
        key: 'reports',
        header: 'Reports',
        flex: 1,
        render: (item: ModerationQueueItem) => (
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }}>
            {item.openReportCount}/{item.reportCount}
          </Text>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        flex: 1,
        render: (item: ModerationQueueItem) => {
          const open = item.status === 'open'
          return (
            <View
              style={{
                backgroundColor: open ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.18)',
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
                  color: open ? '#ef4444' : '#22c55e',
                }}
              >
                {open ? 'Open' : 'Resolved'}
              </Text>
            </View>
          )
        },
      },
    ],
    [colors],
  )

  const runPending = async () => {
    if (!selected || !pending) return
    try {
      setActing(true)
      if (pending.kind === 'delete') {
        await adminDeleteReportedPost(selected.post.id)
      } else {
        await adminSuspendUser(selected.post.author.id, {
          reason: selected.latestReason ?? 'Moderation action',
          durationDays: pending.durationDays,
        })
      }
      setPending(null)
      setSelected(null)
      await loadQueue()
    } catch (err) {
      console.error('Moderation action failed:', err)
    } finally {
      setActing(false)
    }
  }

  const renderDetail = () => {
    if (!selected) return null
    const it = selected
    return (
      <View>
        <View style={detailStyles.header}>
          <View style={[detailStyles.iconCircle, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
            <Flag size={22} color="#ef4444" />
          </View>
          <Text style={[detailStyles.title, { color: colors.text }]}>
            {it.openReportCount} open / {it.reportCount} total report
            {it.reportCount !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={[infoStyles.label, { color: colors.textMuted }]}>POST</Text>
          <Text style={[infoStyles.body, { color: it.post.deletedAt ? colors.textMuted : colors.text }]}>
            {it.post.deletedAt ? '(removed) ' : ''}
            {it.post.body || '(no text)'}
          </Text>
          <Text style={[infoStyles.meta, { color: colors.textMuted }]}>
            by {it.post.author.firstName} {it.post.author.lastName} &middot;{' '}
            {formatDate(it.post.createdAt)}
          </Text>
          {it.latestReason ? (
            <>
              <Text style={[infoStyles.label, { color: colors.textMuted, marginTop: 12 }]}>
                LATEST REASON
              </Text>
              <Text style={[infoStyles.body, { color: colors.textSecondary }]}>{it.latestReason}</Text>
            </>
          ) : null}
          <Text style={[infoStyles.meta, { color: colors.textMuted, marginTop: 8 }]}>
            Last reported {formatDate(it.latestReportAt)}
          </Text>
        </View>

        <View style={detailStyles.actions}>
          {!it.post.deletedAt ? (
            <Pressable
              onPress={() => setPending({ kind: 'delete' })}
              style={[detailStyles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.12)' }]}
            >
              <Trash2 size={14} color="#ef4444" />
              <Text style={[detailStyles.actionBtnText, { color: '#ef4444', marginLeft: 6 }]}>
                Remove post
              </Text>
            </Pressable>
          ) : (
            <View style={[detailStyles.actionBtn, { backgroundColor: colors.iconBoxBg }]}>
              <Text style={[detailStyles.actionBtnText, { color: colors.textMuted }]}>
                Already removed
              </Text>
            </View>
          )}
        </View>
        <View style={detailStyles.actions}>
          <Pressable
            onPress={() => setPending({ kind: 'suspend', durationDays: 7 })}
            style={[detailStyles.actionBtn, { backgroundColor: colors.iconBoxBg }]}
          >
            <UserX size={14} color={colors.text} />
            <Text style={[detailStyles.actionBtnText, { color: colors.text, marginLeft: 6 }]}>
              Suspend 7d
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setPending({ kind: 'suspend' })}
            style={[detailStyles.actionBtn, { backgroundColor: colors.iconBoxBg }]}
          >
            <UserX size={14} color="#ef4444" />
            <Text style={[detailStyles.actionBtnText, { color: '#ef4444', marginLeft: 6 }]}>
              Suspend indefinitely
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }

  const confirmCopy = (() => {
    if (!pending || !selected) return { title: '', message: '', label: '' }
    if (pending.kind === 'delete') {
      return {
        title: 'Remove post',
        message: 'This soft-deletes the post (hidden from feeds, kept for audit) and resolves its reports.',
        label: 'Remove',
      }
    }
    const who = `${selected.post.author.firstName} ${selected.post.author.lastName}`
    return {
      title: 'Suspend user',
      message: pending.durationDays
        ? `Suspend ${who}'s posting for ${pending.durationDays} days? They can still read; only posting is blocked.`
        : `Suspend ${who}'s posting indefinitely (until lifted)? They can still read; only posting is blocked.`,
      label: 'Suspend',
    }
  })()

  if (loading && items.length === 0 && !showAudit) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#E8862A" />
      </View>
    )
  }

  if (error && items.length === 0 && !showAudit) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: '#DC2626', textAlign: 'center' }}>
          {error}
        </Text>
        <Pressable
          onPress={loadQueue}
          style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E8862A', borderRadius: 8 }}
        >
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: '#fff' }}>Retry</Text>
        </Pressable>
      </View>
    )
  }

  if (showAudit) {
    return (
      <View style={styles.container}>
        <View style={styles.tablePanel}>
          <View style={styles.header}>
            <Pressable onPress={() => setShowAudit(false)} style={styles.linkBtn}>
              <ArrowLeft size={14} color="#E8862A" />
              <Text style={styles.linkBtnText}>Back to queue</Text>
            </Pressable>
            <Text style={[styles.title, { color: colors.text }]}>Audit log</Text>
          </View>
          {auditLoading ? (
            <ActivityIndicator color="#E8862A" style={{ marginTop: 24 }} />
          ) : (
            <View style={{ paddingHorizontal: 16 }}>
              {audit.length === 0 ? (
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }}>
                  No moderation actions yet.
                </Text>
              ) : (
                audit.map((a) => (
                  <View
                    key={a.id}
                    style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}
                  >
                    <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.text }}>
                      {a.action}
                      {a.reason ? ` — ${a.reason}` : ''}
                    </Text>
                    <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted }}>
                      {formatDate(a.createdAt)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.tablePanel}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Moderation queue ({items.length})
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => setIncludeResolved((v) => !v)}
              style={[styles.pill, includeResolved && styles.pillActive]}
            >
              <Text style={[styles.pillText, includeResolved && { color: '#fff' }]}>
                {includeResolved ? 'All' : 'Open only'}
              </Text>
            </Pressable>
            <Pressable onPress={() => setShowAudit(true)} style={styles.linkBtn}>
              <ScrollText size={14} color="#E8862A" />
              <Text style={styles.linkBtnText}>Audit log</Text>
            </Pressable>
          </View>
        </View>

        {items.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.textMuted }}>
              {includeResolved ? 'No reports yet.' : 'No open reports. All clear.'}
            </Text>
          </View>
        ) : (
          <AdminTable
            columns={columns}
            data={items}
            keyExtractor={(i) => i.post.id}
            selectedId={selected?.post.id ?? null}
            onRowPress={(item) =>
              setSelected(item.post.id === selected?.post.id ? null : item)
            }
          />
        )}
      </View>

      {selected && (
        <AdminDetailPanel title="Report" onClose={() => setSelected(null)}>
          {renderDetail()}
        </AdminDetailPanel>
      )}

      <ConfirmDialog
        visible={pending !== null}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmLabel={acting ? 'Working…' : confirmCopy.label}
        onConfirm={runPending}
        onCancel={() => setPending(null)}
      />
    </View>
  )
}

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
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(232,134,42,0.12)',
  },
  pillActive: { backgroundColor: '#E8862A' },
  pillText: { fontFamily: 'Inclusive Sans', fontSize: 13, color: '#E8862A' },
  linkBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: 6 },
  linkBtnText: { fontFamily: 'Inclusive Sans', fontSize: 13, color: '#E8862A' },
})

const detailStyles = StyleSheet.create({
  header: { alignItems: 'center', marginBottom: 8 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inclusive Sans', fontSize: 15, marginTop: 8, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { fontFamily: 'Inclusive Sans', fontSize: 13 },
})

const infoStyles = StyleSheet.create({
  label: {
    fontFamily: 'Inclusive Sans',
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  body: { fontFamily: 'Inclusive Sans', fontSize: 14, lineHeight: 20 },
  meta: { fontFamily: 'Inclusive Sans', fontSize: 12, marginTop: 4 },
})
