import React from 'react'
import { View, Text, Image, useWindowDimensions } from 'react-native'

interface StepCardProps {
  number: string
  title: string
  description: string
  isMobile: boolean
}

function StepCard({ number, title, description, isMobile }: StepCardProps) {
  return (
    <View style={{ flex: 1, gap: 10 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: '#FFF7ED',
          borderWidth: 1,
          borderColor: '#FED7AA',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: '"Inclusive Sans", sans-serif',
            fontWeight: '400',
            fontSize: 16,
            color: '#C2410C',
          }}
        >
          {number}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: '"Inclusive Sans", sans-serif',
          fontWeight: '400',
          fontSize: isMobile ? 20 : 22,
          lineHeight: isMobile ? 26 : 28,
          color: '#1C1917',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: 'Inclusive Sans, sans-serif',
          fontWeight: '400',
          fontSize: isMobile ? 14 : 15,
          lineHeight: isMobile ? 22 : 24,
          color: '#57534E',
        }}
      >
        {description}
      </Text>
    </View>
  )
}

export function CommunitySection() {
  const { width } = useWindowDimensions()
  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1024

  return (
    <View
      style={{
        paddingHorizontal: isMobile ? 20 : isTablet ? 40 : 80,
        paddingVertical: isMobile ? 60 : isTablet ? 80 : 100,
        backgroundColor: '#FAFAF7',
      }}
    >
      {/* Header */}
      <View style={{ maxWidth: 720, marginBottom: isMobile ? 40 : 56 }}>
        <Text
          style={{
            fontFamily: 'Inclusive Sans, sans-serif',
            fontWeight: '600',
            fontSize: 12,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: '#C2410C',
            marginBottom: 16,
          }}
        >
          BUILT BY THE COMMUNITY
        </Text>

        <Text
          style={{
            fontFamily: '"Inclusive Sans", sans-serif',
            fontWeight: '400',
            fontSize: isMobile ? 32 : isTablet ? 40 : 48,
            lineHeight: isMobile ? 40 : isTablet ? 48 : 56,
            color: '#1C1917',
            marginBottom: 20,
          }}
        >
          Made by sevaks. Run by CHYKs.
        </Text>

        <Text
          style={{
            fontFamily: 'Inclusive Sans, sans-serif',
            fontWeight: '400',
            fontSize: isMobile ? 16 : 18,
            lineHeight: isMobile ? 26 : 30,
            color: '#57534E',
          }}
        >
          Janata is volunteer-led — built and maintained entirely by CHYKs across centers. No
          gatekeepers. No back-office team. The community runs it.
        </Text>
      </View>

      {/* Three steps */}
      <View
        style={{
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 32 : 48,
          marginBottom: isMobile ? 56 : 72,
        }}
      >
        <StepCard
          number="1"
          title="Any CHYK joins"
          description="Sign up in under a minute. Browse centers and events nearby with no extra hoops — even before you've made an account."
          isMobile={isMobile}
        />
        <StepCard
          number="2"
          title="Coordinators post"
          description="CHYK event coordinators are given permission to publish events for their center. Title, date, location — done in minutes."
          isMobile={isMobile}
        />
        <StepCard
          number="3"
          title="The community grows"
          description="Every event lands on the same map every CHYK is checking. Beyond your group chat, beyond your center."
          isMobile={isMobile}
        />
      </View>

      {/* Team strip */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#F5F0EB',
          paddingHorizontal: isMobile ? 24 : 32,
          paddingVertical: isMobile ? 28 : 32,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? 24 : 32,
        }}
      >
        <View style={{ flex: 1, maxWidth: 420 }}>
          <Text
            style={{
              fontFamily: 'Inclusive Sans, sans-serif',
              fontWeight: '600',
              fontSize: 11,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: '#C2410C',
              marginBottom: 8,
            }}
          >
            THE TEAM
          </Text>
          <Text
            style={{
              fontFamily: '"Inclusive Sans", sans-serif',
              fontWeight: '400',
              fontSize: isMobile ? 22 : 26,
              lineHeight: isMobile ? 28 : 32,
              color: '#1C1917',
              marginBottom: 8,
            }}
          >
            A team of sevaks across the Mission.
          </Text>
          <Text
            style={{
              fontFamily: 'Inclusive Sans, sans-serif',
              fontSize: isMobile ? 14 : 15,
              lineHeight: isMobile ? 22 : 24,
              color: '#78716C',
            }}
          >
            Eight CHYKs across cities and disciplines — engineering, design, product, and outreach.
            All volunteer, all on our own time.
          </Text>
        </View>

        <View
          style={{
            flex: isMobile ? undefined : 1.2,
            width: '100%',
            maxWidth: 520,
            aspectRatio: 16 / 9,
          }}
        >
          <Image
            source={require('../../assets/images/landing/team-grid.png')}
            resizeMode="contain"
            style={{ width: '100%', height: '100%' }}
          />
        </View>
      </View>
    </View>
  )
}
