import React, { useCallback, useEffect, useState } from 'react'
import {
  ScrollView,
  View,
  Pressable,
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native'
import {
  Eye,
  Shield,
  Info,
  ExternalLink,
  AlertTriangle,
  UserPlus,
  LogOut,
  ChevronRight,
  ChevronDown,
  Bell,
  BadgeCheck,
  MapPin,
  LockKeyhole,
  Link as LinkIcon,
  Copy,
  Check,
} from 'lucide-react-native'
import { useUser, useTheme } from '../../components/contexts'
import { useRouter } from 'expo-router'
import { DestructiveButton, SecondaryButton, Text, Avatar } from '../../components/ui'
import ThemeSelector from '../../components/settings/ThemeSelector'
import { useAnalytics } from '../../utils/analytics'
import { isSuperAdmin } from '../../utils/admin'
import { inviteClient } from '../../src/auth/inviteClient'
import { fetchCenters, type CenterData } from '../../utils/api'
import Constants from 'expo-constants'

const APP_VERSION = Constants.expoConfig?.version || '0.2.0'
const linkForCode = (code: string) => `https://chinmayajanata.org/i/${code}`

export default function Preferences() {
  const { isDark } = useTheme()
  const { deleteAccount, logout, user, getToken } = useUser()
  const router = useRouter()
  const [accountOpen, setAccountOpen] = useState(false)
  const [allCenters, setAllCenters] = useState<CenterData[]>([])
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteFailed, setInviteFailed] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)
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
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { track } = useAnalytics()
  const currentYear = new Date().getFullYear()

  const textColor = isDark ? '#FAFAFA' : '#1C1917'
  const mutedTextColor = isDark ? '#A8A29E' : '#78716C'
  const faintColor = isDark ? '#737373' : '#A8A29E'
  const borderColor = isDark ? '#262626' : '#ECE7DE'
  const cardBg = isDark ? '#262626' : '#FFFFFF'
  const pageBg = isDark ? '#1A1A1A' : '#F5F5F4'
  const iconColor = isDark ? '#A8A29E' : '#78716C'
  const surfaceBg = isDark ? '#1F1F1F' : '#F7F4EF'
  const rowPressedBg = isDark ? '#303030' : '#F0EDE8'
  const { width: viewportWidth } = useWindowDimensions()
  const isNarrowWeb = Platform.OS === 'web' && viewportWidth < 768
  const webPaddingH = isNarrowWeb ? 16 : viewportWidth < 1024 ? 32 : 60

  useEffect(() => {
    fetchCenters().then(setAllCenters).catch(() => {})
  }, [])

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

  const copyInviteLink = async () => {
    if (!inviteUrl) return
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl)
        setInviteCopied(true)
        setTimeout(() => setInviteCopied(false), 2000)
        track('invite_link_shared', {
          source: 'settings_web_profile_card',
          method: 'copy',
        })
      } else {
        Alert.alert('Copy link', inviteUrl)
      }
    } catch {
      Alert.alert('Copy failed', 'Please try again.')
    }
  }

  const handleLogout = async () => {
    track('nav_logout', { source: 'settings_web' })
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
    } catch (error) {
      track('delete_account_failed', { source: 'settings', reason: 'exception' })
      Alert.alert('Error', 'Failed to delete account. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const SettingsCard = ({
    icon,
    title,
    summary,
    children,
  }: {
    icon: React.ReactNode
    title: string
    summary: string
    children: React.ReactNode
  }) => (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 18,
        borderWidth: 1,
        borderColor,
        overflow: 'hidden',
      }}
    >
      <View style={{ padding: isNarrowWeb ? 18 : 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
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
              {summary}
            </Text>
          </View>
        </View>
      </View>
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: borderColor,
          padding: isNarrowWeb ? 18 : 22,
          paddingTop: isNarrowWeb ? 16 : 18,
        }}
      >
        {children}
      </View>
    </View>
  )

  const DisclosureSection = ({
    icon,
    title,
    summary,
    children,
  }: {
    icon: React.ReactNode
    title: string
    summary: string
    children: React.ReactNode
  }) => (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 18,
        borderWidth: 1,
        borderColor,
        overflow: 'hidden',
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: accountOpen }}
        onPress={() => setAccountOpen((value) => !value)}
        style={({ pressed }) => ({
          padding: isNarrowWeb ? 18 : 22,
          backgroundColor: pressed ? rowPressedBg : cardBg,
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
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
              {summary}
            </Text>
          </View>
          {accountOpen ? <ChevronDown size={18} color={iconColor} /> : <ChevronRight size={18} color={iconColor} />}
        </View>
      </Pressable>
      {accountOpen ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: borderColor,
            padding: isNarrowWeb ? 18 : 22,
            paddingTop: isNarrowWeb ? 16 : 18,
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  )

  const SettingsRow = ({
    icon,
    title,
    detail,
    onPress,
    destructive,
    external,
    isLast,
  }: {
    icon: React.ReactNode
    title: string
    detail?: string
    onPress: () => void
    destructive?: boolean
    external?: boolean
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
        backgroundColor: pressed ? rowPressedBg : 'transparent',
      })}
    >
      <View style={{ width: 22, alignItems: 'center' }}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontSize: 15, color: destructive ? '#DC2626' : textColor, fontWeight: destructive ? '600' : '500' }}>
          {title}
        </Text>
        {detail ? (
          <Text style={{ fontSize: 13, color: mutedTextColor, marginTop: 2 }} numberOfLines={2}>
            {detail}
          </Text>
        ) : null}
      </View>
      {external ? <ExternalLink size={17} color={iconColor} /> : <ChevronRight size={17} color={destructive ? '#DC2626' : iconColor} />}
    </Pressable>
  )

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
        padding: isNarrowWeb ? 18 : 22,
        borderRadius: 18,
        borderWidth: 1,
        borderColor,
        backgroundColor: pressed ? rowPressedBg : cardBg,
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

  const ProfileDetail = ({ label, value }: { label: string; value?: string | null }) => {
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

  const lookingFor = user?.lookingFor?.filter(Boolean).join(', ')
  const interests = user?.interests?.filter(Boolean).join(', ')
  const hasProfileDetails = !!(
    user?.bio ||
    user?.email ||
    user?.phoneNumber ||
    user?.school ||
    user?.work ||
    user?.region ||
    lookingFor ||
    interests ||
    homeCenter?.name
  )

  return (
    <ScrollView style={{ flex: 1, backgroundColor: pageBg }}>
      <View
        style={{
          maxWidth: 1080,
          width: '100%',
          alignSelf: 'center',
          paddingVertical: isNarrowWeb ? 20 : 36,
          paddingHorizontal: webPaddingH,
          gap: isNarrowWeb ? 18 : 24,
        }}
      >
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: isNarrowWeb ? 26 : 32, fontWeight: '700', color: textColor }}>
            Account settings
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 22, color: mutedTextColor, maxWidth: 660 }}>
            Manage your public profile, access, notifications, and account controls from one place.
          </Text>
        </View>

        <View
          style={{
            flexDirection: isNarrowWeb ? 'column' : 'row',
            alignItems: 'flex-start',
            gap: 24,
          }}
        >
          <View
            style={{
              width: isNarrowWeb ? '100%' : 300,
              backgroundColor: cardBg,
              borderRadius: 18,
              borderWidth: 1,
              borderColor,
              padding: 22,
              ...(isNarrowWeb ? {} : { position: 'sticky' as 'absolute', top: 88 }),
            }}
          >
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
              <View
                style={{
                  marginTop: 18,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: borderColor,
                  gap: 12,
                }}
              >
                <ProfileDetail label="Bio" value={user?.bio} />
                <ProfileDetail label="Email" value={user?.email} />
                <ProfileDetail label="Phone" value={user?.phoneNumber} />
                <ProfileDetail label="School" value={user?.school} />
                <ProfileDetail label="Work" value={user?.work} />
                <ProfileDetail label="Region" value={user?.region} />
                <ProfileDetail label="Looking for" value={lookingFor} />
                <ProfileDetail label="Interests" value={interests} />
              </View>
            ) : null}
            <SecondaryButton
              style={{ marginTop: 18, width: '100%' }}
              onPress={() => {
                track('nav_edit_profile', { source: 'settings_web_summary' })
                router.push('/edit-profile')
              }}
            >
              Edit public profile
            </SecondaryButton>
            {canInvite ? (
              <View
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: borderColor,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <UserPlus size={16} color="#C2410C" />
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
                    style={{
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor,
                      paddingVertical: 10,
                      alignItems: 'center',
                    }}
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
                      <Text
                        style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: textColor }}
                        numberOfLines={1}
                      >
                        {inviteUrl.replace(/^https?:\/\//, '')}
                      </Text>
                    </View>
                    <Pressable
                      onPress={copyInviteLink}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        borderRadius: 12,
                        paddingVertical: 12,
                        backgroundColor: inviteCopied ? surfaceBg : pressed ? '#D97520' : '#C2410C',
                      })}
                    >
                      {inviteCopied ? <Check size={16} color="#C2410C" /> : <Copy size={16} color="#FFFFFF" />}
                      <Text style={{ fontSize: 14, fontWeight: '600', color: inviteCopied ? '#C2410C' : '#FFFFFF' }}>
                        {inviteCopied ? 'Link copied' : 'Copy invite link'}
                      </Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={{ flex: 1, width: '100%', gap: 14 }}>
            {isSuperAdmin(user) ? (
              <ActionCard
                icon={<Shield size={18} color="#C2410C" />}
                title="Admin dashboard"
                detail="Manage centers, events, notifications, and moderation."
                onPress={() => {
                  track('settings_admin_dashboard_opened', { source: 'settings_web' })
                  router.push('/admin' as never)
                }}
              />
            ) : null}

            <ActionCard
              icon={<Bell size={18} color={iconColor} />}
              title="Notification preferences"
              detail="Events, center announcements, board replies, mentions, and push."
              onPress={() => {
                track('settings_notifications_pressed', { source: 'settings_web' })
                router.push('/settings/notifications')
              }}
            />

            <SettingsCard
              icon={<Eye size={18} color={iconColor} />}
              title="Appearance"
              summary="Light, dark, or automatic theme."
            >
              <ThemeSelector />
            </SettingsCard>

            <DisclosureSection
              icon={<LockKeyhole size={18} color={iconColor} />}
              title="Legal and account"
              summary={`Policies, version ${APP_VERSION}, sign out, and account deletion.`}
            >
              <SettingsRow
                icon={<Shield size={18} color={iconColor} />}
                title="Privacy policy"
                onPress={() => {
                  track('privacy_policy_viewed')
                  router.push('/privacy')
                }}
                external
              />
              <SettingsRow
                icon={<Info size={18} color={iconColor} />}
                title="Terms of service"
                onPress={() => {
                  track('terms_viewed')
                  router.push('/terms')
                }}
                external
              />
              <SettingsRow
                icon={<Info size={18} color={iconColor} />}
                title="Cookie policy"
                onPress={() => {
                  track('cookie_policy_viewed')
                  router.push('/cookies')
                }}
                external
              />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: borderColor,
                }}
              >
                <Text style={{ fontSize: 15, color: textColor }}>Version</Text>
                <Text style={{ fontSize: 14, color: mutedTextColor }}>{APP_VERSION}</Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: borderColor,
                }}
              >
                <Text style={{ fontSize: 15, color: textColor }}>Chinmaya Janata</Text>
                <Text style={{ fontSize: 14, color: mutedTextColor }}>{currentYear} Chinmaya Mission</Text>
              </View>
              <SettingsRow
                icon={<LogOut size={18} color="#DC2626" />}
                title="Log out"
                onPress={handleLogout}
                destructive
              />
              <View
                style={{
                  flexDirection: isNarrowWeb ? 'column' : 'row',
                  alignItems: isNarrowWeb ? 'stretch' : 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                  paddingTop: 16,
                }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#DC2626' }}>
                    Delete account
                  </Text>
                  <Text style={{ fontSize: 13, color: mutedTextColor, marginTop: 3 }}>
                    Permanently delete your account and all data.
                  </Text>
                </View>
                <DestructiveButton
                  style={{ alignSelf: isNarrowWeb ? 'stretch' : 'auto' }}
                  onPress={() => {
                    track('delete_account_started', { source: 'settings' })
                    setShowDeleteModal(true)
                  }}
                >
                  Delete account
                </DestructiveButton>
              </View>
            </DisclosureSection>
          </View>
        </View>
      </View>

      {/* Delete confirmation modal */}
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
              maxWidth: 400,
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
                  fontSize: 22,
                  fontWeight: '700',
                  color: textColor,
                  marginBottom: 8,
                }}
              >
                Delete Account?
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: mutedTextColor,
                  textAlign: 'center',
                  lineHeight: 22,
                }}
              >
                This action cannot be undone. All your data will be permanently deleted.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <View style={{ flex: 1 }}>
                <SecondaryButton onPress={() => {
                  track('delete_account_cancelled', { source: 'settings' })
                  setShowDeleteModal(false)
                }} disabled={isDeleting}>
                  Cancel
                </SecondaryButton>
              </View>
              <View style={{ flex: 1 }}>
                <DestructiveButton onPress={handleDeleteAccount} disabled={isDeleting} loading={isDeleting}>
                  Delete Forever
                </DestructiveButton>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}
