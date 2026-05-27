import React, { useState, useEffect } from 'react'
import {
  View,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { useCallback } from 'react'
let ImagePicker: typeof import('expo-image-picker') | null = null
try {
  ImagePicker = require('expo-image-picker')
} catch {}

let ImageManipulator: typeof import('expo-image-manipulator') | null = null
try {
  ImageManipulator = require('expo-image-manipulator')
} catch {}
import { Camera, CaretRight } from 'phosphor-react-native'
import { useUser } from '../components/contexts'
import { useColors } from '../hooks/useColors'
import { Text, Section, StackHeader } from '../components/ui'
import BirthdatePicker from '../components/profile/BirthdatePicker'
import { fetchCenters, CenterData } from '../utils/api'
import { centerPickerStore } from '../utils/centerPickerStore'

const INTEREST_OPTIONS = [
  'Satsangs',
  'Bhiksha',
  'Global events',
  'Local events',
  'Casual',
  'Formal',
]

export default function EditProfileScreen() {
  const router = useRouter()
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

  useFocusEffect(useCallback(() => {
    if (centerPickerStore.result !== null) {
      setCenterID(centerPickerStore.result)
      centerPickerStore.result = null
    }
  }, []))

  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) {
      const displayName =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.username || ''
      setName(displayName)
      setBio(user.bio || '')
      setBirthday(user.dateOfBirth ? new Date(user.dateOfBirth.split('T')[0] + 'T00:00:00') : null)
      setCenterID(user.centerID || null)
      setInterests(user.interests || [])
      setProfileImage(user.profileImage || null)
      setProfileImageBase64(null)
      setImageChanged(false)
      setErrors({})
    }
  }, [])

  useEffect(() => {
    fetchCenters()
      .then(setAllCenters)
      .catch(() => {})
  }, [])

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
      router.back()
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
  const faintColor = c.textFaint
  const borderColor = c.border
  const cardBg = c.card
  const pageBg = c.bg

  const inputStyle = {
    fontSize: 15,
    color: textColor,
    backgroundColor: 'transparent' as const,
    paddingTop: 6,
  }

  const fieldLabelStyle = {
    fontSize: 11,
    color: faintColor,
    letterSpacing: 0.9,
    marginBottom: 4,
  }

  const cardSection = {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor,
    marginHorizontal: -16,
  }

  const rowStyle = {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: cardBg,
  }

  return (
    <View style={{ flex: 1 }}>
      <StackHeader title="Edit Profile" />

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: pageBg }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo */}
          <Section title="PHOTO" titleColor={faintColor}>
            <View style={cardSection}>
              <View style={[rowStyle, { alignItems: 'center' }]}>
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
                <Text style={{ fontSize: 13, color: '#C2410C', marginTop: 10 }}>
                  Change Photo
                </Text>
              </View>
            </View>
          </Section>

          {/* Info */}
          <Section title="INFO" titleColor={faintColor}>
            <View style={cardSection}>
              <View style={[rowStyle, { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
                <Text style={fieldLabelStyle}>NAME</Text>
                <TextInput
                  value={name}
                  onChangeText={(v) => {
                    setName(v)
                    setErrors((p) => ({ ...p, name: '' }))
                  }}
                  placeholder="Full name"
                  placeholderTextColor={faintColor}
                  style={inputStyle}
                  autoCapitalize="words"
                  autoComplete="name"
                />
                {errors.name ? (
                  <Text style={{ fontSize: 12, color: c.error, marginTop: 4 }}>
                    {errors.name}
                  </Text>
                ) : null}
              </View>
              <View style={rowStyle}>
                <Text style={fieldLabelStyle}>BIO</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Write something about yourself"
                  placeholderTextColor={faintColor}
                  multiline
                  textAlignVertical="top"
                  style={[inputStyle, { minHeight: 72 }]}
                />
              </View>
            </View>
          </Section>

          {/* Details */}
          <Section title="DETAILS" titleColor={faintColor}>
            <View style={cardSection}>
              <View style={[rowStyle, { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
                <Text style={fieldLabelStyle}>BIRTHDAY</Text>
                <BirthdatePicker value={birthday ?? undefined} onChange={setBirthday} />
              </View>
              <Pressable
                style={rowStyle}
                onPress={() => router.push({ pathname: '/center-picker', params: { currentCenterID: centerID || '' } })}
              >
                <Text style={fieldLabelStyle}>CENTER</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
                  <Text style={{ fontSize: 15, color: selectedCenterName ? textColor : faintColor, flex: 1 }}>
                    {selectedCenterName || 'Select a center'}
                  </Text>
                  <CaretRight size={18} color={faintColor} />
                </View>
              </Pressable>
            </View>
          </Section>

          {/* Interests */}
          <Section title="INTERESTS" titleColor={faintColor}>
            <View style={cardSection}>
              <View style={[rowStyle, { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }]}>
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
          </Section>

          {errors.form ? (
            <Text style={{ fontSize: 13, color: c.error, textAlign: 'center', marginBottom: 12 }}>
              {errors.form}
            </Text>
          ) : null}

          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={{
              backgroundColor: '#C2410C',
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ fontSize: 16, color: '#fff', fontWeight: '600' }}>
                Save Changes
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
