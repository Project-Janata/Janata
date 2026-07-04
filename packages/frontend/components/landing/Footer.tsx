import React from 'react'
import { View, Text, Pressable, Linking, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import Logo from '../ui/Logo'

export function Footer() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1024

  return (
    <View style={{ backgroundColor: '#FAFAF7' }}>
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: '#E7E5E4',
          paddingHorizontal: isMobile ? 20 : isTablet ? 40 : 80,
          paddingTop: 48,
          paddingBottom: 48,
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 24 : undefined,
        }}
      >
        {/* Left: Logo + tagline */}
        <View style={{ maxWidth: 320 }}>
          <Logo size={32} style={{ marginBottom: 12 }} />
          <Text
            style={{
              fontFamily: 'Inclusive Sans, sans-serif',
              fontWeight: '400',
              fontSize: 14,
              lineHeight: 22,
              color: '#78716C',
            }}
          >
            Helping CHYKs stay connected to their Chinmaya Mission community.
          </Text>
        </View>

        {/* Right: Links */}
        <View style={{ flexDirection: 'row', gap: isMobile ? 20 : 32, alignItems: 'center' }}>
          <Pressable onPress={() => Linking.openURL('https://chinmayamission.com')}>
            <Text style={{ fontFamily: 'Inclusive Sans, sans-serif', fontSize: 14, color: '#78716C' }}>
              Chinmaya Mission
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push('/privacy')}>
            <Text style={{ fontFamily: 'Inclusive Sans, sans-serif', fontSize: 14, color: '#78716C' }}>
              Privacy Policy
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push('/terms')}>
            <Text style={{ fontFamily: 'Inclusive Sans, sans-serif', fontSize: 14, color: '#78716C' }}>
              Terms of Service
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Copyright */}
      <View
        style={{
          paddingHorizontal: isMobile ? 20 : isTablet ? 40 : 80,
          paddingBottom: 40,
        }}
      >
        <Text
          style={{
            fontFamily: 'Inclusive Sans, sans-serif',
            fontWeight: '400',
            fontSize: 13,
            color: '#A8A29E',
          }}
        >
          © 2026 Janata. Built with love by CHYKs.
        </Text>
      </View>
    </View>
  )
}
