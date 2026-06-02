import React, { useState } from 'react'
import {
  ScrollView,
  View,
  Pressable,
  Linking,
  Modal,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Eye, Shield, Info, ExternalLink, AlertTriangle, UserPlus, LogOut, ChevronRight, User } from 'lucide-react-native'
import { useUser, useTheme } from '../../components/contexts'
import { useRouter } from 'expo-router'
import { DestructiveButton, SecondaryButton, Text, Avatar } from '../../components/ui'
import ThemeSelector from '../../components/settings/ThemeSelector'
import { useAnalytics } from '../../utils/analytics'
import Constants from 'expo-constants'

const APP_VERSION = Constants.expoConfig?.version || '0.2.0'

export default function Preferences() {
  const { isDark } = useTheme()
  const { deleteAccount, logout, user } = useUser()
  const router = useRouter()
  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.username || 'You'
  const vl = user?.verificationLevel ?? 0
  const roleLabel =
    vl >= 1000008 ? 'Global Head'
      : vl >= 1008 ? 'Swami'
      : vl >= 108 ? 'Brahmachari'
      : vl >= 54 ? 'Sevak'
      : vl >= 45 ? 'Verified member'
      : null
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
  const { width: viewportWidth } = useWindowDimensions()
  const isNarrowWeb = Platform.OS === 'web' && viewportWidth < 768
  const webPaddingH = isNarrowWeb ? 16 : viewportWidth < 1024 ? 32 : 60

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: pageBg }}>
      <View
        style={{
          maxWidth: 900,
          width: '100%',
          alignSelf: 'center',
          padding: isNarrowWeb ? 20 : 40,
          paddingHorizontal: webPaddingH,
          gap: isNarrowWeb ? 24 : 36,
        }}
      >
        {/* Profile — top section of the combined Settings page (#346/#330) */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <User size={20} color={iconColor} />
            <Text style={{ fontSize: 17, fontWeight: '600', color: textColor }}>Profile</Text>
          </View>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor,
              padding: isNarrowWeb ? 20 : 28,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <Avatar image={user?.profileImage || undefined} name={displayName} size={isNarrowWeb ? 56 : 64} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 18, color: textColor }} numberOfLines={1}>
                {displayName}
              </Text>
              {user?.username ? (
                <Text style={{ fontSize: 14, color: mutedTextColor, marginTop: 1 }} numberOfLines={1}>
                  @{user.username}
                </Text>
              ) : null}
              {roleLabel ? (
                <Text style={{ fontSize: 13, color: '#C2410C', marginTop: 3 }}>{roleLabel}</Text>
              ) : null}
            </View>
            <SecondaryButton
              onPress={() => {
                track('nav_edit_profile', { source: 'settings_web' })
                router.push('/edit-profile')
              }}
            >
              Edit
            </SecondaryButton>
          </View>
        </View>

        {/* Account Section (invite + log out — parity with the native settings) */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <UserPlus size={20} color={iconColor} />
            <Text style={{ fontSize: 17, fontWeight: '600', color: textColor }}>Account</Text>
          </View>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor,
              overflow: 'hidden',
            }}
          >
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isNarrowWeb ? 20 : 28,
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
              }}
              onPress={() => {
                track('settings_invite_pressed', { source: 'settings_web' })
                router.push('/settings/invite')
              }}
            >
              <Text style={{ fontSize: 15, color: textColor }}>Invite Friends</Text>
              <ChevronRight size={18} color={iconColor} />
            </Pressable>
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isNarrowWeb ? 20 : 28,
              }}
              onPress={handleLogout}
            >
              <Text style={{ fontSize: 15, color: '#DC2626' }}>Log Out</Text>
              <LogOut size={18} color="#DC2626" />
            </Pressable>
          </View>
        </View>

        {/* Appearance Section */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Eye size={20} color={iconColor} />
            <Text style={{ fontSize: 17, fontWeight: '600', color: textColor }}>Appearance</Text>
          </View>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor,
              padding: isNarrowWeb ? 20 : 28,
            }}
          >
            <ThemeSelector />
          </View>
        </View>

        {/* Privacy Section */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Shield size={20} color={iconColor} />
            <Text style={{ fontSize: 17, fontWeight: '600', color: textColor }}>Privacy</Text>
          </View>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor,
              overflow: 'hidden',
            }}
          >
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isNarrowWeb ? 20 : 28,
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
              }}
              onPress={() => {
                track('privacy_policy_viewed')
                router.push('/privacy')
              }}
            >
              <Text style={{ fontSize: 15, color: textColor }}>Privacy Policy</Text>
              <ExternalLink size={18} color={iconColor} />
            </Pressable>
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isNarrowWeb ? 20 : 28,
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
              }}
              onPress={() => {
                track('terms_viewed')
                router.push('/terms')
              }}
            >
              <Text style={{ fontSize: 15, color: textColor }}>Terms of Service</Text>
              <ExternalLink size={18} color={iconColor} />
            </Pressable>
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isNarrowWeb ? 20 : 28,
              }}
              onPress={() => {
                track('cookie_policy_viewed')
                router.push('/cookies')
              }}
            >
              <Text style={{ fontSize: 15, color: textColor }}>Cookie Policy</Text>
              <ExternalLink size={18} color={iconColor} />
            </Pressable>
          </View>
        </View>

        {/* About Section */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Info size={20} color={iconColor} />
            <Text style={{ fontSize: 17, fontWeight: '600', color: textColor }}>About</Text>
          </View>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              borderWidth: 1,
              borderColor,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isNarrowWeb ? 20 : 28,
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
              }}
            >
              <Text style={{ fontSize: 15, color: textColor }}>Version</Text>
              <Text style={{ fontSize: 14, color: mutedTextColor, textAlign: 'right' }}>
                {APP_VERSION}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isNarrowWeb ? 20 : 28,
              }}
            >
              <Text style={{ fontSize: 15, color: textColor }}>Chinmaya Janata</Text>
              <Text style={{ fontSize: 14, color: mutedTextColor, textAlign: 'right' }}>
                {currentYear} Chinmaya Mission
              </Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isNarrowWeb ? 20 : 28,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#FECACA',
              backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#FEF2F2',
            }}
          >
            <View style={{ gap: 4, flex: 1, marginRight: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#DC2626' }}>
                Danger Zone
              </Text>
              <Text style={{ fontSize: 13, color: mutedTextColor }}>
                Permanently delete your account and all data
              </Text>
            </View>
            <DestructiveButton
              onPress={() => {
                track('delete_account_started', { source: 'settings' })
                setShowDeleteModal(true)
              }}
            >
              Delete Account
            </DestructiveButton>
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
