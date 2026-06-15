import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Info,
  Link as LinkIcon,
  LockKeyhole,
  LogOut,
  MapPin,
  Pencil,
  Share2,
  Shield,
} from 'lucide-react-native'
import { useUser, useTheme } from '../../components/contexts'
import { Avatar, Text, StackHeader } from '../../components/ui'
import ThemeSelector from '../../components/settings/ThemeSelector'
import { useAnalytics } from '../../utils/analytics'
import { isSuperAdmin } from '../../utils/admin'
import { inviteClient } from '../../src/auth/inviteClient'
import { fetchCenters, type CenterData } from '../../utils/api'
import Constants from 'expo-constants'

const APP_VERSION = Constants.expoConfig?.version || '0.2.0'
const linkForCode = (code: string) => `https://chinmayajanata.org/i/${code}`

export default function PreferencesNative() {
  const router = useRouter()
  const { user, loading, logout, deleteAccount, getToken } = useUser()
  const { isDark } = useTheme()
  const { track } = useAnalytics()

  const [allCenters, setAllCenters] = useState<CenterData[]>([])
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteFailed, setInviteFailed] = useState(false)
  const [legalOpen, setLegalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    if (Platform.OS !== 'web' && !loading && !user) router.replace('/auth')
  }, [router, user, loading])

  useEffect(() => {
    fetchCenters().then(setAllCenters).catch(() => {})
  }, [])

  const textColor = isDark ? '#FAFAFA' : '#1C1917'
  const mutedTextColor = isDark ? '#A8A29E' : '#78716C'
  const faintColor = isDark ? '#737373' : '#A8A29E'
  const borderColor = isDark ? '#262626' : '#ECE7DE'
  const cardBg = isDark ? '#262626' : '#FFFFFF'
  const pageBg = isDark ? '#1A1A1A' : '#F5F5F4'
  const surfaceBg = isDark ? '#1F1F1F' : '#F7F4EF'
  const pressedBg = isDark ? '#303030' : '#F0EDE8'
  const iconColor = isDark ? '#A8A29E' : '#78716C'

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.username || 'You'
  const accountIdentifier = user?.email || user?.username || null
  const accountLabel = accountIdentifier
    ? accountIdentifier.includes('@') ? accountIdentifier : `@${accountIdentifier}`
    : null
  const vl = user?.verificationLevel ?? 0
  const roleLabel =
    vl >= 1000008 ? 'Global Head'
      : vl >= 1008 ? 'Swami'
      : vl >= 108 ? 'Brahmachari'
      : vl >= 54 ? 'Sevak'
      : vl >= 45 ? 'Verified member'
      : null
  const canInvite = vl >= 45
  const homeCenter = allCenters.find((center) => center.centerID === user?.centerID)
  const homeCenterLabel = homeCenter?.name || (user?.centerID ? 'Home center selected' : 'No home center yet')
  const lookingFor = Array.isArray(user?.lookingFor) ? user.lookingFor.filter(Boolean).join(', ') : ''
  const interests = Array.isArray(user?.interests) ? user.interests.filter(Boolean).join(', ') : ''
  const hasProfileDetails = !!(
    user?.bio ||
    user?.email ||
    user?.phoneNumber ||
    user?.school ||
    user?.work ||
    user?.region ||
    lookingFor ||
    interests
  )

  const loadInviteLink = useCallback(async () => {
    if (!user || !canInvite) {
      setInviteUrl(null)
      setInviteFailed(false)
      return
    }
    setInviteLoading(true)
    setInviteFailed(false)
    try {
      const token = await getToken()
      if (!token) {
        setInviteFailed(true)
        return
      }
      const list = await inviteClient.listMyCodes(token)
      if (list.success) {
        const usable = list.data.codes.find((entry) => entry.isUsable) ?? list.data.codes[0]
        if (usable?.code) {
          setInviteUrl(usable.shareUrl || linkForCode(usable.code))
          return
        }
      }
      const minted = await inviteClient.mintCode(token)
      if (minted.success) {
        setInviteUrl(minted.data.shareUrl || linkForCode(minted.data.code))
      } else {
        setInviteFailed(true)
      }
    } catch {
      setInviteFailed(true)
    } finally {
      setInviteLoading(false)
    }
  }, [canInvite, getToken, user])

  useEffect(() => {
    loadInviteLink()
  }, [loadInviteLink])

  const shareInviteLink = async () => {
    if (!inviteUrl) return
    try {
      await Share.share({
        title: 'Join me on Janata',
        message: `Join me on Janata. This invite gets you in instantly. ${inviteUrl}`,
        url: inviteUrl,
      })
      track('invite_link_shared', {
        source: 'settings_native_profile_card',
        method: 'share',
      })
    } catch {
      // Native share sheet can be dismissed without an actionable error.
    }
  }

  const handleLogout = async () => {
    track('nav_logout', { source: 'settings_native' })
    await logout()
    router.replace('/auth')
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteAccount()
      if (result.success) {
        track('account_deleted', { source: 'settings' })
        setShowDeleteModal(false)
        router.replace('/auth')
      } else {
        track('delete_account_failed', { source: 'settings', reason: result.message })
        Alert.alert('Error', result.message || 'Failed to delete account')
      }
    } catch {
      track('delete_account_failed', { source: 'settings', reason: 'exception' })
      Alert.alert('Error', 'Failed to delete account. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const Card = ({ children }: { children: React.ReactNode }) => (
    <View
      style={{
        backgroundColor: cardBg,
        borderWidth: 1,
        borderColor,
        borderRadius: 18,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  )

  const DetailItem = ({ label, value }: { label: string; value?: string | null }) => {
    if (!value) return null
    return (
      <View style={{ gap: 2 }}>
        <Text style={{ fontSize: 11, color: faintColor, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 13.5, color: textColor, lineHeight: 19 }} numberOfLines={2}>
          {value}
        </Text>
      </View>
    )
  }

  const ActionCard = ({
    icon,
    title,
    detail,
    onPress,
  }: {
    icon: React.ReactNode
    title: string
    detail: string
    onPress: () => void
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 18,
        borderRadius: 18,
        borderWidth: 1,
        borderColor,
        backgroundColor: pressed ? pressedBg : cardBg,
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: surfaceBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>{title}</Text>
        <Text style={{ fontSize: 13, color: mutedTextColor, marginTop: 2 }} numberOfLines={2}>
          {detail}
        </Text>
      </View>
      <ChevronRight size={18} color={iconColor} />
    </Pressable>
  )

  const LegalRow = ({
    icon,
    title,
    onPress,
    destructive,
    isLast,
  }: {
    icon: React.ReactNode
    title: string
    onPress: () => void
    destructive?: boolean
    isLast?: boolean
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: borderColor,
        backgroundColor: pressed ? pressedBg : 'transparent',
      })}
    >
      <View style={{ width: 22, alignItems: 'center' }}>{icon}</View>
      <Text style={{ flex: 1, fontSize: 15, color: destructive ? '#DC2626' : textColor, fontWeight: destructive ? '600' : '500' }}>
        {title}
      </Text>
      <ChevronRight size={17} color={destructive ? '#DC2626' : iconColor} />
    </Pressable>
  )

  return (
    <View style={{ flex: 1 }}>
      <StackHeader title="Settings" />

      <ScrollView
        style={{ flex: 1, backgroundColor: pageBg }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 18,
          paddingBottom: 40,
          gap: 14,
        }}
      >
        <Card>
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Avatar image={user?.profileImage || undefined} name={displayName} size={56} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: textColor }} numberOfLines={1}>
                  {displayName}
                </Text>
                {accountLabel ? (
                  <Text style={{ fontSize: 14, color: mutedTextColor, marginTop: 1 }} numberOfLines={1}>
                    {accountLabel}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={{ marginTop: 18, gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <BadgeCheck size={15} color={roleLabel ? '#C2410C' : faintColor} />
                <Text style={{ fontSize: 13.5, color: roleLabel ? '#C2410C' : mutedTextColor }}>
                  {roleLabel || 'Unverified account'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MapPin size={15} color={iconColor} />
                <Text style={{ fontSize: 13.5, color: mutedTextColor }}>{homeCenterLabel}</Text>
              </View>
            </View>

            {hasProfileDetails ? (
              <View style={{ marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: borderColor, gap: 12 }}>
                <DetailItem label="Bio" value={user?.bio} />
                <DetailItem label="Email" value={user?.email} />
                <DetailItem label="Phone" value={user?.phoneNumber} />
                <DetailItem label="School" value={user?.school} />
                <DetailItem label="Work" value={user?.work} />
                <DetailItem label="Region" value={user?.region} />
                <DetailItem label="Looking for" value={lookingFor} />
                <DetailItem label="Interests" value={interests} />
              </View>
            ) : null}

            <Pressable
              onPress={() => {
                track('nav_edit_profile', { source: 'settings_native_summary' })
                router.push('/edit-profile')
              }}
              style={({ pressed }) => ({
                marginTop: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 12,
                borderWidth: 1,
                borderColor,
                paddingVertical: 12,
                backgroundColor: pressed ? pressedBg : cardBg,
              })}
            >
              <Pencil size={16} color={textColor} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>Edit public profile</Text>
            </Pressable>

            {canInvite ? (
              <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: borderColor, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Share2 size={16} color="#C2410C" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>Invite link</Text>
                </View>
                {inviteLoading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
                    <ActivityIndicator color="#C2410C" />
                    <Text style={{ fontSize: 13, color: mutedTextColor }}>Getting your link...</Text>
                  </View>
                ) : inviteFailed ? (
                  <Pressable
                    onPress={loadInviteLink}
                    style={({ pressed }) => ({
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor,
                      paddingVertical: 10,
                      alignItems: 'center',
                      backgroundColor: pressed ? pressedBg : 'transparent',
                    })}
                  >
                    <Text style={{ fontSize: 13, color: '#C2410C', fontWeight: '600' }}>
                      Retry invite link
                    </Text>
                  </Pressable>
                ) : inviteUrl ? (
                  <>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        backgroundColor: surfaceBg,
                        borderRadius: 10,
                        paddingHorizontal: 10,
                        paddingVertical: 10,
                      }}
                    >
                      <LinkIcon size={15} color="#C2410C" />
                      <Text style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: textColor }} numberOfLines={1}>
                        {inviteUrl.replace(/^https?:\/\//, '')}
                      </Text>
                    </View>
                    <Pressable
                      onPress={shareInviteLink}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        borderRadius: 12,
                        paddingVertical: 12,
                        backgroundColor: pressed ? '#D97520' : '#C2410C',
                      })}
                    >
                      <Share2 size={16} color="#FFFFFF" />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Share invite link</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            ) : null}
          </View>
        </Card>

        {isSuperAdmin(user) ? (
          <ActionCard
            icon={<Shield size={18} color="#C2410C" />}
            title="Admin dashboard"
            detail="Manage centers, events, notifications, and moderation."
            onPress={() => {
              track('settings_admin_dashboard_opened', { source: 'settings_native' })
              router.push('/admin' as any)
            }}
          />
        ) : null}

        <ActionCard
          icon={<Bell size={18} color={iconColor} />}
          title="Notification preferences"
          detail="Events, center announcements, board replies, mentions, and push."
          onPress={() => {
            track('settings_notifications_pressed', { source: 'settings_native' })
            router.push('/settings/notifications')
          }}
        />

        <Card>
          <View style={{ padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  backgroundColor: surfaceBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Eye size={18} color={iconColor} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>Appearance</Text>
                <Text style={{ fontSize: 13, color: mutedTextColor, marginTop: 2 }}>
                  Light, dark, or automatic theme.
                </Text>
              </View>
            </View>
            <ThemeSelector />
          </View>
        </Card>

        <Card>
          <View style={{ paddingHorizontal: 18, paddingVertical: 4 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: legalOpen }}
              onPress={() => setLegalOpen((open) => !open)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                borderBottomWidth: legalOpen ? 1 : 0,
                borderBottomColor: borderColor,
                backgroundColor: pressed ? pressedBg : 'transparent',
              })}
            >
              <LockKeyhole size={18} color={iconColor} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>Legal and account</Text>
                <Text style={{ fontSize: 13, color: mutedTextColor, marginTop: 2 }}>
                  Policies, version {APP_VERSION}, sign out, and account deletion.
                </Text>
              </View>
              {legalOpen ? <ChevronDown size={18} color={iconColor} /> : <ChevronRight size={18} color={iconColor} />}
            </Pressable>
            {legalOpen ? (
              <>
                <LegalRow
                  icon={<Shield size={18} color={iconColor} />}
                  title="Privacy policy"
                  onPress={() => {
                    track('privacy_policy_viewed')
                    router.push('/privacy')
                  }}
                />
                <LegalRow
                  icon={<FileText size={18} color={iconColor} />}
                  title="Terms of service"
                  onPress={() => {
                    track('terms_viewed')
                    router.push('/terms')
                  }}
                />
                <LegalRow
                  icon={<Info size={18} color={iconColor} />}
                  title="Cookie policy"
                  onPress={() => {
                    track('cookie_policy_viewed')
                    router.push('/cookies')
                  }}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderColor }}>
                  <Text style={{ fontSize: 15, color: textColor }}>Version</Text>
                  <Text style={{ fontSize: 14, color: mutedTextColor }}>{APP_VERSION}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderColor }}>
                  <Text style={{ fontSize: 15, color: textColor }}>Chinmaya Janata</Text>
                  <Text style={{ fontSize: 14, color: mutedTextColor }}>{currentYear} Chinmaya Mission</Text>
                </View>
                <LegalRow
                  icon={<LogOut size={18} color="#DC2626" />}
                  title="Log out"
                  onPress={handleLogout}
                  destructive
                />
                <LegalRow
                  icon={<AlertTriangle size={18} color="#DC2626" />}
                  title="Delete account"
                  onPress={() => {
                    track('delete_account_started', { source: 'settings' })
                    setShowDeleteModal(true)
                  }}
                  destructive
                  isLast
                />
              </>
            ) : null}
          </View>
        </Card>
      </ScrollView>

      <Modal
        transparent
        visible={showDeleteModal}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 340,
              borderWidth: 1,
              borderColor: '#FECACA',
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: isDark ? 'rgba(220,38,38,0.15)' : '#FEE2E2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <AlertTriangle size={32} color="#DC2626" />
              </View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: textColor,
                  marginBottom: 8,
                  textAlign: 'center',
                }}
              >
                Delete Account?
              </Text>
              <Text style={{ fontSize: 15, color: mutedTextColor, textAlign: 'center', lineHeight: 22 }}>
                This action cannot be undone. All your data will be permanently deleted.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Pressable
                onPress={() => {
                  track('delete_account_cancelled', { source: 'settings' })
                  setShowDeleteModal(false)
                }}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: isDark ? '#1c1c1c' : '#f3f4f6',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: textColor }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteAccount}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: '#DC2626',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}
