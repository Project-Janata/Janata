import React, { useState, useEffect } from 'react'
import { ScrollView, View, Pressable, Image, Share } from 'react-native'
import { BadgeCheck, Building2 } from 'lucide-react-native'
import { Badge, useRouter } from 'expo-router'
import { useUser, useTheme } from '../../components/contexts'
import { Section, Text } from '../../components/ui'
import TabHeader from '../../components/ui/TabHeader'
import {
  fetchCenters,
  fetchUserEvents,
  fetchUserGroups,
  fetchUserPosts,
  CenterData,
} from '../../utils/api'

export default function ProfileNative() {
  const router = useRouter()
  const { user, refreshUser } = useUser()
  const { isDark } = useTheme()
  const [allCenters, setAllCenters] = useState<CenterData[]>([])
  const [postCount, setPostCount] = useState(0)
  const [eventCount, setEventCount] = useState(0)
  const [groupCount, setGroupCount] = useState(0)
  const [userGroups, setUserGroups] = useState<CenterData[]>([])

  useEffect(() => {
    refreshUser()
    fetchCenters()
      .then(setAllCenters)
      .catch(() => {})
    if (user?.username) {
      fetchUserPosts(user.username)
        .then((p) => setPostCount(p.length))
        .catch(() => {})
      fetchUserEvents(user.username)
        .then((e) => setEventCount(e.length))
        .catch(() => {})
      fetchUserGroups(user.username)
        .then((g) => {
          setUserGroups(g)
          setGroupCount(g.length)
        })
        .catch(() => {})
    }
  }, [])

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`
    if (user?.firstName) return user.firstName
    return user?.username || ''
  }

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user?.firstName) return user.firstName[0].toUpperCase()
    if (user?.username) return user.username[0].toUpperCase()
    return '?'
  }

  const getUserRole = () => {
    const age = user?.dateOfBirth
      ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / 31557600000)
      : null
    if (age !== null && (user?.verificationLevel ?? 0) < 108) {
      if (age >= 18 && age <= 35) return 'CHYK'
      if (age > 35) return 'Sevak'
    } else {
      if (user?.verificationLevel ?? 0 >= 108) return 'Brahmachari'
      if (user?.verificationLevel ?? 0 >= 1008) return 'Swami'
      if (user?.verificationLevel ?? 0 >= 1000008) return 'Global Head'
    }
  }

  const getUserCity = () => {
    const center = allCenters.find((c) => c.centerID === user?.centerID)
    const addressParts = center?.address?.split(',')
    return `${addressParts?.[1]?.trim()}, ${addressParts?.[2]?.split(' ')[1] ?? null}`
  }

  const getDateJoined = () => {
    if (!user?.createdAt) return null
    const date = new Date(user.createdAt)
    return date.toLocaleDateString(undefined, { year: 'numeric' })
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${getDisplayName()} on Janata!`,
        title: getDisplayName(),
      })
    } catch {
      // Silently fail
    }
  }

  const textColor = isDark ? '#FAFAFA' : '#1C1917'
  const mutedTextColor = isDark ? '#A8A29E' : '#78716C'
  const borderColor = isDark ? '#262626' : '#ECE7DE'
  const cardBg = isDark ? '#262626' : '#FFFFFF'
  const chipBg = isDark ? '#333333' : '#F0EFED'

  const centerName = allCenters.find((c) => c.centerID === user?.centerID)?.name
  const interests = user?.interests || []
  const lookingFor = user?.lookingFor || []

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: isDark ? '#1A1A1A' : '#F5F5F4' }}>
        {/* Profile header */}
        <View style={{ paddingTop: 28, paddingHorizontal: 20, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
            {/* Avatar */}
            {user?.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  borderWidth: 3,
                  borderColor: cardBg,
                  backgroundColor: '#D6D3D1',
                }}
              />
            ) : (
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  borderWidth: 3,
                  borderColor: cardBg,
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

            {/* Name, role, email */}
            <View style={{ flex: 1, minWidth: 0, paddingTop: 4, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text
                  style={{
                    fontFamily: 'Inclusive Sans',
                    fontSize: 22,
                    color: textColor,
                    letterSpacing: -0.5,
                    flexShrink: 1,
                  }}
                  numberOfLines={1}
                >
                  {getDisplayName() || '—'}
                </Text>
                {getUserRole() && (
                  <View
                    style={{
                      backgroundColor: '#C2410C20',
                      paddingHorizontal: 5,
                      paddingVertical: 3,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Inclusive Sans',
                        fontSize: 10,
                        color: '#C2410C',
                        fontWeight: '700',
                        letterSpacing: 0.5,
                      }}
                    >
                      {getUserRole()}
                    </Text>
                  </View>
                )}
              </View>
              {getUserCity() && getDateJoined() ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Text
                    style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: mutedTextColor }}
                    numberOfLines={1}
                  >
                    {getUserCity()} • Member since {getDateJoined() || '—'}
                  </Text>
                </View>
              ) : null}
              {user?.isVerified ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <BadgeCheck size={14} color="#C2410C" />
                  <Text
                    style={{
                      fontFamily: 'Inclusive Sans',
                      fontSize: 13,
                      color: '#C2410C',
                      fontWeight: '600',
                    }}
                    numberOfLines={1}
                  >
                    Verified by {centerName}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Bio — no label, inline with header */}
          {user?.bio ? (
            <Text
              style={{
                fontSize: 15,
                color: textColor,
                lineHeight: 22,
              }}
            >
              {user.bio}
            </Text>
          ) : null}

          {/* About — minimal profile fields (#210). Empty fields don't render. */}
          {(user?.work || user?.school || user?.region) ? (
            <View style={{ marginTop: 12, gap: 4 }}>
              {user?.work ? (
                <Text style={{ fontSize: 14, color: textColor }}>{user.work}</Text>
              ) : null}
              {user?.school ? (
                <Text style={{ fontSize: 14, color: mutedTextColor }}>{user.school}</Text>
              ) : null}
              {user?.region ? (
                <Text style={{ fontSize: 14, color: mutedTextColor }}>{user.region}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Profile Stats */}
        <View
          style={{
            marginTop: 16,
            marginHorizontal: 20,
            borderWidth: 1,
            borderColor,
            borderRadius: 12,
            flexDirection: 'row',
            backgroundColor: cardBg,
            overflow: 'hidden',
          }}
        >
          {[
            { label: 'Events', value: eventCount },
            { label: 'Groups', value: groupCount },
            { label: 'Posts', value: postCount },
          ].map((stat, i, arr) => (
            <View
              key={stat.label}
              accessible
              accessibilityLabel={`${stat.value} ${stat.label}`}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: 4,
                borderRightWidth: i < arr.length - 1 ? 1 : 0,
                borderColor,
              }}
            >
              <Text
                style={{
                  fontFamily: 'Inclusive Sans',
                  fontSize: 20,
                  color: textColor,
                  fontWeight: '500',
                }}
              >
                {stat.value}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  fontFamily: 'Inclusive Sans',
                  fontSize: 11,
                  color: mutedTextColor,
                  marginTop: 2,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                }}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Edit / Share buttons */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            flexDirection: 'row',
            gap: 8,
          }}
        >
          <Pressable
            onPress={() => router.push('/edit-profile')}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 10,
              borderWidth: 1,
              borderColor,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: cardBg,
            }}
          >
            <Text
              style={{ fontSize: 14, color: textColor, fontWeight: '700' }}
            >
              Edit Profile
            </Text>
          </Pressable>
          <Pressable
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel="Share profile"
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 10,
              borderWidth: 1,
              borderColor,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: cardBg,
            }}
          >
            <Text
              style={{ fontSize: 14, color: textColor, fontWeight: '700' }}
            >
              Share
            </Text>
          </Pressable>
        </View>

        {/* Interests */}
        {interests.length > 0 ? (
          <View
            style={{
              paddingHorizontal: 20,
              marginTop: 16,
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {interests.map((interest) => (
              <View
                key={interest}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 100,
                  backgroundColor: chipBg,
                }}
              >
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: mutedTextColor }}>
                  {interest}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Looking for — multi-select chips (#210). Same UX as Interests. */}
        {lookingFor.length > 0 ? (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Text
              style={{
                fontFamily: 'Inclusive Sans',
                fontSize: 11,
                color: mutedTextColor,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              Looking for
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {lookingFor.map((option) => (
                <View
                  key={option}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 100,
                    backgroundColor: chipBg,
                  }}
                >
                  <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: mutedTextColor }}>
                    {option}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Communities */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Section title="COMMUNITIES" titleColor={mutedTextColor}>
            <View
              style={{
                marginTop: 16,
                borderWidth: 1,
                borderColor,
                borderRadius: 12,
                backgroundColor: cardBg,
                overflow: 'hidden',
              }}
            >
              {userGroups.length > 0 ? (
                userGroups.map((group) => (
                  <View
                    key={group.centerID}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 20,
                      backgroundColor: cardBg,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        backgroundColor: '#C2410C20',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Building2 size={16} color="#C2410C" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: textColor }}
                      >
                        {group.name}
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'Inclusive Sans',
                          fontSize: 13,
                          color: mutedTextColor,
                        }}
                      >
                        My center • {group.memberCount ?? 0} members
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View
                  style={{ paddingVertical: 14, paddingHorizontal: 20, backgroundColor: cardBg }}
                >
                  <Text
                    style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: mutedTextColor }}
                  >
                    No center selected
                  </Text>
                </View>
              )}
            </View>
          </Section>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}
