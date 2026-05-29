import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
let ImagePicker: typeof import('expo-image-picker') | null = null
try {
  ImagePicker = require('expo-image-picker')
} catch {}

let ImageManipulator: typeof import('expo-image-manipulator') | null = null
try {
  ImageManipulator = require('expo-image-manipulator')
} catch {}
import { Camera, Check } from 'phosphor-react-native'
import { useUser } from '../contexts'
import { Text } from '../ui'
import { useColors } from '../../hooks/useColors'
import BirthdatePicker from './BirthdatePicker'
import { fetchCenters, CenterData } from '../../utils/api'

const INTEREST_OPTIONS = [
  'Satsangs',
  'Bhiksha',
  'Global events',
  'Local events',
  'Casual',
  'Formal',
]

interface Props {
  visible: boolean
  onClose: () => void
}

export default function EditProfileSheet({ visible, onClose }: Props) {
  const { user, updateProfile, setUser } = useUser()
  const c = useColors()

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [birthday, setBirthday] = useState<Date | null>(null)
  const [centerID, setCenterID] = useState<string | null>(null)
  const [interests, setInterests] = useState<string[]>([])
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [profileImageBase64, setProfileImageBase64] = useState<string | null>(null)
  const [imageChanged, setImageChanged] = useState(false)

  const [allCenters, setAllCenters] = useState<CenterData[]>([])
  const [centerSearch, setCenterSearch] = useState('')
  const [showCenterResults, setShowCenterResults] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (visible && user) {
      const displayName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.username || ''
      setName(displayName)
      setBio(user.bio || '')
      setBirthday(user.dateOfBirth ? new Date(user.dateOfBirth + 'T00:00:00') : null)
      setCenterID(user.centerID || null)
      setInterests(user.interests || [])
      setProfileImage(user.profileImage || null)
      setProfileImageBase64(null)
      setImageChanged(false)
      setCenterSearch('')
      setShowCenterResults(false)
      setErrors({})
    }
  }, [visible])

  useEffect(() => {
    fetchCenters()
      .then(setAllCenters)
      .catch(() => {})
  }, [])

  const filteredCenters =
    centerSearch.length >= 2
      ? allCenters
          .filter((c) => c.name.toLowerCase().includes(centerSearch.toLowerCase()))
          .slice(0, 6)
      : []

  const selectedCenterName = allCenters.find((c) => c.centerID === centerID)?.name

  const handleImagePick = async () => {
    if (!ImagePicker) {
      Alert.alert('Unavailable', 'Rebuild the app to enable photo picking.')
      return
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow access to your photo library.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    })

    if (result.canceled || !result.assets.length) return

    const uri = result.assets[0].uri

    if (ImageManipulator) {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      )
      setProfileImage(manipulated.uri)
      setProfileImageBase64(`data:image/jpeg;base64,${manipulated.base64}`)
    } else {
      setProfileImage(uri)
      setProfileImageBase64(null)
    }
    setImageChanged(true)
  }

  const handleSave = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrors({ name: 'Name is required' })
      return
    }
    setIsSaving(true)
    setErrors({})

    try {
      const nameParts = trimmedName.split(' ')
      const result = await updateProfile({
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
        bio,
        interests,
        ...(centerID ? { centerID } : {}),
        ...(birthday ? { dateOfBirth: birthday.toISOString().split('T')[0] } : {}),
        ...(imageChanged && profileImageBase64 ? { profileImage: profileImageBase64 } : {}),
      })

      if (!result.success) {
        setErrors({ form: result.message || 'Failed to save profile' })
        return
      }

      if (user && imageChanged && profileImage) {
        setUser({ ...user, originalImage: profileImage })
      }
      onClose()
    } catch {
      setErrors({ form: 'Failed to save profile. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  const getInitials = () => {
    const n = name.trim()
    if (!n) return '?'
    const parts = n.split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return n[0].toUpperCase()
  }

  const textColor = c.text
  const mutedColor = c.textMuted
  const borderColor = c.border
  const cardBg = c.card
  const pageBg = c.bg
  const inputBg = c.surface

  const inputStyle = {
    fontFamily: 'Inclusive Sans' as const,
    fontSize: 15,
    color: textColor,
    backgroundColor: inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  }

  const fieldLabelStyle = {
    fontFamily: 'Inclusive Sans' as const,
    fontSize: 12,
    color: mutedColor,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    marginBottom: 6,
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: pageBg,
          borderTopRightRadius: 24,
          borderTopLeftRadius: 24,
          overflow: 'hidden',
        }}
      >
        <SafeAreaView style={{ backgroundColor: cardBg }} edges={['top']}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderColor,
              backgroundColor: cardBg,
            }}
          >
            <Pressable onPress={onClose} hitSlop={8} style={{ minWidth: 60 }}>
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: mutedColor }}>
                Cancel
              </Text>
            </Pressable>
            <Text
              style={{
                fontFamily: 'Inclusive Sans',
                fontSize: 16,
                color: textColor,
                fontWeight: '600',
              }}
            >
              Edit Profile
            </Text>
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              hitSlop={8}
              style={{ minWidth: 60, alignItems: 'flex-end', opacity: isSaving ? 0.5 : 1 }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#C2410C" />
              ) : (
                <Text
                  style={{
                    fontFamily: 'Inclusive Sans',
                    fontSize: 15,
                    color: '#C2410C',
                    fontWeight: '600',
                  }}
                >
                  Save
                </Text>
              )}
            </Pressable>
          </View>
        </SafeAreaView>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, gap: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar */}
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Pressable onPress={handleImagePick} style={{ position: 'relative' }}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: c.borderStrong }}
                  />
                ) : (
                  <View
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: 44,
                      backgroundColor: '#C2410C',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 28, fontWeight: '600' }}>
                      {getInitials()}
                    </Text>
                  </View>
                )}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#C2410C',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: cardBg,
                  }}
                >
                  <Camera size={13} color="#fff" />
                </View>
              </Pressable>
              <Text
                style={{
                  fontFamily: 'Inclusive Sans',
                  fontSize: 13,
                  color: '#C2410C',
                  marginTop: 8,
                }}
              >
                Change Photo
              </Text>
            </View>

            {/* Name */}
            <View>
              <Text style={fieldLabelStyle}>Name</Text>
              <TextInput
                value={name}
                onChangeText={(v) => {
                  setName(v)
                  setErrors((p) => ({ ...p, name: '' }))
                }}
                placeholder="Full name"
                placeholderTextColor={mutedColor}
                style={inputStyle}
                autoCapitalize="words"
                autoComplete="name"
              />
              {errors.name ? (
                <Text
                  style={{
                    fontFamily: 'Inclusive Sans',
                    fontSize: 12,
                    color: c.error,
                    marginTop: 4,
                  }}
                >
                  {errors.name}
                </Text>
              ) : null}
            </View>

            {/* Bio */}
            <View>
              <Text style={fieldLabelStyle}>Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Write something about yourself"
                placeholderTextColor={mutedColor}
                multiline
                textAlignVertical="top"
                style={[inputStyle, { minHeight: 90 }]}
              />
            </View>

            {/* Birthday */}
            <View>
              <Text style={fieldLabelStyle}>Birthday</Text>
              <BirthdatePicker value={birthday ?? undefined} onChange={setBirthday} />
            </View>

            {/* Center */}
            <View>
              <Text style={fieldLabelStyle}>Center</Text>
              <TextInput
                value={centerSearch || selectedCenterName || ''}
                onChangeText={(text) => {
                  setCenterSearch(text)
                  setShowCenterResults(true)
                  if (text === '') setCenterID(null)
                }}
                onFocus={() => {
                  if (filteredCenters.length > 0) setShowCenterResults(true)
                }}
                onBlur={() => setTimeout(() => setShowCenterResults(false), 150)}
                placeholder="Search centers"
                placeholderTextColor={mutedColor}
                style={inputStyle}
              />
              {showCenterResults && filteredCenters.length > 0 && (
                <View
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor,
                    marginTop: 4,
                    overflow: 'hidden',
                  }}
                >
                  {filteredCenters.map((center, i) => (
                    <Pressable
                      key={center.centerID}
                      onPress={() => {
                        setCenterID(center.centerID)
                        setCenterSearch('')
                        setShowCenterResults(false)
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderBottomWidth: i < filteredCenters.length - 1 ? 1 : 0,
                        borderBottomColor: borderColor,
                        backgroundColor: centerID === center.centerID ? '#C2410C10' : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Inclusive Sans',
                          fontSize: 14,
                          color: centerID === center.centerID ? '#C2410C' : textColor,
                        }}
                      >
                        {center.name}
                      </Text>
                      {centerID === center.centerID && <Check size={16} color="#C2410C" />}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Interests */}
            <View>
              <Text style={fieldLabelStyle}>Interests</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {INTEREST_OPTIONS.map((option) => {
                  const selected = interests.includes(option)
                  return (
                    <Pressable
                      key={option}
                      onPress={() => toggleInterest(option)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 9,
                        borderRadius: 100,
                        borderWidth: 1.5,
                        borderColor: selected ? '#C2410C' : borderColor,
                        backgroundColor: selected ? '#C2410C10' : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Inclusive Sans',
                          fontSize: 14,
                          color: selected ? '#C2410C' : mutedColor,
                          fontWeight: selected ? '600' : '400',
                        }}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {errors.form ? (
              <Text
                style={{
                  fontFamily: 'Inclusive Sans',
                  fontSize: 13,
                  color: c.error,
                  textAlign: 'center',
                }}
              >
                {errors.form}
              </Text>
            ) : null}

            <View style={{ height: 20 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}
