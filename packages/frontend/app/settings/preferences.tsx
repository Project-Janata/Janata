import React, { useState } from 'react'
import { View, Text, Pressable, ScrollView, StatusBar, Modal, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  ArrowLeft,
  User,
  Shield,
  Info,
  FileText,
  ChevronRight,
  LogOut,
  AlertTriangle,
} from 'lucide-react-native'
import { useUser, useTheme } from '../../components/contexts'
import { Avatar } from '../../components/ui'
import ThemeSelector from '../../components/ThemeSelector'
import { usePostHog } from 'posthog-react-native'
import Constants from 'expo-constants'

const APP_VERSION = Constants.expoConfig?.version || '0.2.0'

export default function PreferencesNative() {
  const router = useRouter()
  const { user, logout } = useUser()
  const { isDark } = useTheme()
  const { deleteAccount } = useUser()
  const posthog = usePostHog()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const currentYear = new Date().getFullYear()

  const textColor = isDark ? '#F5F5F5' : '#1C1917'
  const mutedTextColor = isDark ? '#A8A29E' : '#78716C'
  const borderColor = isDark ? '#262626' : '#E5E7EB'
  const cardBg = isDark ? '#171717' : '#FFFFFF'

  const handleLogout = async () => {
    posthog?.capture('nav_logout')
    await logout()
    router.replace('/auth')
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteAccount()
      if (result.success) {
        setShowDeleteModal(false)
        router.replace('/auth')
      } else {
        Alert.alert('Error', result.message || 'Failed to delete account')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const displayName =
    user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || ''

  const MenuRow = ({
    onPress,
    children,
    showArrow = true,
  }: {
    onPress: () => void
    children: React.ReactNode
    showArrow?: boolean
  }) => (
    <Pressable
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: cardBg,
      }}
      onPress={onPress}
    >
      {children}
      {showArrow && <ChevronRight size={20} color={textColor} />}
    </Pressable>
  )

  /** Static label/value row (e.g. About) — avoids MenuRow flex-start packing label + value together */
  const AboutInfoRow = ({
    icon: Icon,
    label,
    value,
    isLast,
  }: {
    icon: typeof Info
    label: string
    value: string
    isLast?: boolean
  }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: cardBg,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: borderColor,
        gap: 12,
      }}
    >
      <Icon size={20} color={textColor} />
      <Text
        style={{
          fontSize: 16,
          color: textColor,
          flex: 1,
          minWidth: 0,
        }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 15,
          color: mutedTextColor,
          textAlign: 'right',
          flexShrink: 0,
          maxWidth: '52%',
        }}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  )

  const Section = ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <View style={{ marginBottom: 24 }}>
      {title && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: mutedTextColor,
            textTransform: 'uppercase',
            paddingHorizontal: 16,
            paddingBottom: 8,
          }}
        >
          {title}
        </Text>
      )}
      <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor }}>{children}</View>
    </View>
  )

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? '#000' : '#fff' }}
      edges={['top', 'bottom']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 8,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderColor,
          backgroundColor: isDark ? '#000' : '#fff',
        }}
      >
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <ArrowLeft size={24} color={textColor} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '600', color: textColor }}>Preferences</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 8 }}>
        {/* Profile Card */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Avatar image={user?.profileImage || undefined} name={displayName} size={56} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: textColor }}>
                {displayName}
              </Text>
              {user?.username && (
                <Text style={{ fontSize: 14, color: mutedTextColor }}>@{user.username}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Account Section */}
        <Section title="Account">
          <MenuRow onPress={() => router.push('/settings/profile')} showArrow>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <User size={20} color={textColor} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 16, color: textColor }}>Edit Profile</Text>
            </View>
          </MenuRow>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <View style={{ paddingVertical: 14, paddingHorizontal: 16, backgroundColor: cardBg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 16, color: textColor, flex: 1 }}>Theme</Text>
            </View>
            <ThemeSelector />
          </View>
        </Section>

        {/* Regulatory */}
        <Section title="Regulatory">
          <MenuRow
            onPress={() => {
              posthog?.capture('privacy_policy_viewed')
              router.push('/privacy')
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Shield size={20} color={textColor} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 16, color: textColor }}>Privacy Policy</Text>
            </View>
          </MenuRow>
          <MenuRow
            onPress={() => {
              posthog?.capture('terms_viewed')
              router.push('/terms')
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <FileText size={20} color={textColor} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 16, color: textColor }}>Terms of Service</Text>
            </View>
          </MenuRow>
          <MenuRow
            onPress={() => {
              posthog?.capture('cookie_policy_viewed')
              router.push('/cookies')
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Info size={20} color={textColor} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 16, color: textColor }}>Cookie Policy</Text>
            </View>
          </MenuRow>
        </Section>

        {/* About */}
        <Section title="About">
          <AboutInfoRow icon={Info} label="Version" value={APP_VERSION} />
          <AboutInfoRow
            icon={Info}
            label="Chinmaya Janata"
            value={`© ${currentYear}\nChinmaya Mission`}
            isLast
          />
        </Section>

        {/* Account Actions */}
        <Section>
          <MenuRow onPress={handleLogout} showArrow={false}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <LogOut size={20} color="#ef4444" style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 16, color: '#ef4444', fontWeight: '600' }}>Log Out</Text>
            </View>
          </MenuRow>
          <MenuRow
            onPress={() => {
              posthog?.capture('delete_account_started')
              setShowDeleteModal(true)
            }}
            showArrow={false}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AlertTriangle size={20} color="#dc2626" style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 16, color: '#dc2626', fontWeight: '600' }}>
                Delete Account
              </Text>
            </View>
          </MenuRow>
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>

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
              <Text
                style={{ fontSize: 15, color: mutedTextColor, textAlign: 'center', lineHeight: 22 }}
              >
                This action cannot be undone. All your data will be permanently deleted.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Pressable
                onPress={() => setShowDeleteModal(false)}
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
                {isDeleting ? (
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                    Deleting...
                  </Text>
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
