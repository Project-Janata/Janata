import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, Pressable, Image, Platform, useWindowDimensions, ScrollView } from 'react-native'

const TAB_DURATION = 5000 // 5 seconds per tab

// Inject CSS keyframes (web only)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const id = 'apppreview-keyframes'
  if (!document.getElementById(id)) {
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      @keyframes progressFill {
        0% { width: 0%; }
        100% { width: 100%; }
      }
      @keyframes fadeSlideIn {
        0% { opacity: 0; transform: translateY(12px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes popIn {
        0% { opacity: 0; transform: scale(0.85) translateY(8px); }
        60% { transform: scale(1.02) translateY(-2px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
    `
    document.head.appendChild(style)
  }
}

interface FeatureTab {
  number: string
  title: string
  heading: string
  description: string
}

const FEATURES: FeatureTab[] = [
  {
    number: '01',
    title: 'Discover centers',
    heading: 'Find your nearest Chinmaya Mission center',
    description:
      'A live map of every CM center. Tap any pin to see the acharya, schedule, address, and what’s coming up — even before you sign up.',
  },
  {
    number: '02',
    title: 'Show up & RSVP',
    heading: 'See who’s going before you walk in',
    description:
      'Browse events near you across every center. RSVP in one tap and see who else is coming — so you never have to walk into a room of strangers cold.',
  },
  {
    number: '03',
    title: 'Run your events',
    heading: 'Post once. Reach every CHYK nearby.',
    description:
      'For coordinators: create an event in under a minute, track RSVPs in real time, and reach CHYKs beyond your WhatsApp group. No flyer, no Google Form, no spreadsheet.',
  },
]

function TabPill({
  feature,
  isActive,
  onPress,
  cycleKey,
}: {
  feature: FeatureTab
  isActive: boolean
  onPress: () => void
  cycleKey: number
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: isActive ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.28)',
        borderRadius: 100,
        paddingHorizontal: 20,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.42)',
      }}
    >
      {isActive && (
        <div
          key={`prog-${cycleKey}`}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 3,
            backgroundColor: '#C2410C',
            borderRadius: 2,
            animation: `progressFill ${TAB_DURATION}ms linear forwards`,
          }}
        />
      )}
      <Text
        style={{
          fontFamily: 'Inclusive Sans, sans-serif',
          fontWeight: '600',
          fontSize: 11,
          color: isActive ? '#C2410C' : '#A8A29E',
          letterSpacing: 0.5,
        }}
      >
        {feature.number}
      </Text>
      <Text
        style={{
          fontFamily: 'Inclusive Sans, sans-serif',
          fontWeight: isActive ? '500' : '400',
          fontSize: 14,
          color: isActive ? '#292524' : '#78716C',
        }}
      >
        {feature.title}
      </Text>
    </Pressable>
  )
}

// ─── App-like mockup visuals (light theme matching landing page) ───

function MockupShell({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 4px 30px rgba(0,0,0,0.08)',
        borderWidth: 1,
        borderColor: '#E7E5E4',
        flex: 1,
        minHeight: 420,
      }}
    >
      {children}
    </View>
  )
}

function MockupSearchBar() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 10,
        paddingHorizontal: 12,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        gap: 8,
      }}
    >
      <View
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          borderWidth: 1.5,
          borderColor: '#9CA3AF',
        }}
      />
      <Text style={{ fontFamily: 'Inclusive Sans, sans-serif', fontSize: 12, color: '#9CA3AF' }}>
        Search events and centers...
      </Text>
    </View>
  )
}

function MockupFilterTabs({ active }: { active: string }) {
  const tabs = ['All', 'Going', 'Centers']
  return (
    <View
      style={{
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 12,
        gap: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
      }}
    >
      {tabs.map((tab) => (
        <View
          key={tab}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderBottomWidth: 2,
            borderBottomColor: tab === active ? '#E8862A' : 'transparent',
          }}
        >
          <Text
            style={{
              fontFamily: 'Inclusive Sans, sans-serif',
              fontWeight: tab === active ? '600' : '400',
              fontSize: 13,
              color: tab === active ? '#E8862A' : '#9CA3AF',
            }}
          >
            {tab}
          </Text>
        </View>
      ))}
    </View>
  )
}

function MockupDragHandle() {
  return (
    <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 8 }}>
      <View
        style={{
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: '#D1D5DB',
        }}
      />
    </View>
  )
}

function MockupDatePill({ month, day, accent }: { month: string; day: string; accent?: boolean }) {
  return (
    <View
      style={{
        width: 44,
        height: 50,
        borderRadius: 12,
        backgroundColor: accent ? '#FFF7ED' : '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text
        style={{
          fontFamily: 'Inclusive Sans, sans-serif',
          fontWeight: '600',
          fontSize: 9,
          color: '#E8862A',
          letterSpacing: 0.5,
        }}
      >
        {month}
      </Text>
      <Text
        style={{
          fontFamily: 'Inclusive Sans, sans-serif',
          fontWeight: '700',
          fontSize: 16,
          color: '#1C1917',
        }}
      >
        {day}
      </Text>
    </View>
  )
}

function MockupAvatarDots({ count }: { count: number }) {
  const colors = ['#E8862A', '#78716C', '#A8A29E', '#D6D3D1']
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
      <View style={{ flexDirection: 'row' }}>
        {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
          <View
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: colors[i],
              marginLeft: i === 0 ? 0 : -4,
              borderWidth: 1.5,
              borderColor: '#FFFFFF',
            }}
          />
        ))}
      </View>
      <Text style={{ fontFamily: 'Inclusive Sans, sans-serif', fontSize: 10, color: '#A8A29E' }}>
        {count} going
      </Text>
    </View>
  )
}

function MockupEventItem({
  month,
  day,
  title,
  time,
  location,
  attendees,
  isRegistered,
  delay,
}: {
  month: string
  day: string
  title: string
  time: string
  location: string
  attendees: number
  isRegistered?: boolean
  delay?: number
}) {
  return (
    <div style={{ animation: `fadeSlideIn 0.3s ease-out ${delay || 0}ms both` }}>
      <View
        style={{
          flexDirection: 'row',
          gap: 10,
          padding: 10,
          borderRadius: 14,
          backgroundColor: isRegistered ? '#FFF7ED' : 'transparent',
        }}
      >
        <MockupDatePill month={month} day={day} accent={isRegistered} />
        <View style={{ flex: 1, gap: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={{
                fontFamily: 'Inclusive Sans, sans-serif',
                fontWeight: '600',
                fontSize: 13,
                color: '#1C1917',
                flex: 1,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
            {isRegistered && (
              <View
                style={{
                  backgroundColor: 'rgba(232,134,42,0.15)',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Inclusive Sans, sans-serif',
                    fontWeight: '500',
                    fontSize: 9,
                    color: '#E8862A',
                  }}
                >
                  Going
                </Text>
              </View>
            )}
          </View>
          <Text style={{ fontFamily: 'Inclusive Sans, sans-serif', fontSize: 11, color: '#78716C' }}>
            {time}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 }}>
            <View
              style={{
                width: 3,
                height: 3,
                borderRadius: 1.5,
                backgroundColor: '#E8862A',
              }}
            />
            <Text
              style={{ fontFamily: 'Inclusive Sans, sans-serif', fontSize: 10, color: '#78716C' }}
              numberOfLines={1}
            >
              {location}
            </Text>
          </View>
          <MockupAvatarDots count={attendees} />
        </View>
      </View>
    </div>
  )
}

function MockupCenterItem({
  name,
  distance,
  events,
  isMember,
  delay,
}: {
  name: string
  distance: string
  events: number
  isMember?: boolean
  delay?: number
}) {
  return (
    <div style={{ animation: `fadeSlideIn 0.3s ease-out ${delay || 0}ms both` }}>
      <View
        style={{
          flexDirection: 'row',
          gap: 10,
          padding: 10,
          borderRadius: 14,
          backgroundColor: isMember ? '#FFF7ED' : 'transparent',
        }}
      >
        <View
          style={{
            width: 44,
            height: 50,
            borderRadius: 12,
            backgroundColor: 'rgba(232,134,42,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Text style={{ fontSize: 18 }}>🏛</Text>
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={{
                fontFamily: 'Inclusive Sans, sans-serif',
                fontWeight: '600',
                fontSize: 13,
                color: '#1C1917',
                flex: 1,
              }}
            >
              {name}
            </Text>
            {isMember && (
              <View
                style={{
                  backgroundColor: 'rgba(232,134,42,0.15)',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Inclusive Sans, sans-serif',
                    fontWeight: '500',
                    fontSize: 9,
                    color: '#E8862A',
                  }}
                >
                  Member
                </Text>
              </View>
            )}
          </View>
          <Text style={{ fontFamily: 'Inclusive Sans, sans-serif', fontSize: 11, color: '#78716C' }}>
            Center · {distance}
          </Text>
          {events > 0 && (
            <Text
              style={{
                fontFamily: 'Inclusive Sans, sans-serif',
                fontSize: 10,
                color: '#E8862A',
                marginTop: 1,
              }}
            >
              {events} events this week
            </Text>
          )}
        </View>
      </View>
    </div>
  )
}

// ─── Per-tab visuals ───

function DiscoverVisual() {
  return (
    <div key="discover" style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
      <MockupShell>
        {/* Map area */}
        <View style={{ height: 160, position: 'relative', overflow: 'hidden' }}>
          <Image
            source={require('../../assets/images/landing/map-preview.jpg')}
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
          />
          {/* Map pins overlay */}
          <View
            style={{
              position: 'absolute',
              top: 50,
              left: '30%',
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: '#E8862A',
              borderWidth: 2,
              borderColor: '#FFFFFF',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 80,
              left: '55%',
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#E8862A',
              opacity: 0.7,
              borderWidth: 2,
              borderColor: '#FFFFFF',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 35,
              left: '70%',
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#E8862A',
              opacity: 0.6,
              borderWidth: 2,
              borderColor: '#FFFFFF',
            }}
          />
        </View>
        {/* Bottom sheet */}
        <View
          style={{
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            marginTop: -16,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.04)',
          }}
        >
          <MockupDragHandle />
          <MockupSearchBar />
          <MockupFilterTabs active="Centers" />
          <View style={{ paddingHorizontal: 12, gap: 2 }}>
            <MockupCenterItem name="CM San Jose" distance="2.4 mi" events={5} isMember delay={200} />
            <MockupCenterItem name="CM Fremont" distance="8.1 mi" events={3} delay={350} />
            <MockupCenterItem name="CM Palo Alto" distance="12 mi" events={2} delay={500} />
          </View>
        </View>
      </MockupShell>
    </div>
  )
}

function MockupEventDetail({ delay }: { delay?: number }) {
  return (
    <div style={{ animation: `popIn 0.4s ease-out ${delay || 0}ms both` }}>
      <View
        style={{
          position: 'absolute',
          top: 40,
          left: 16,
          right: 16,
          bottom: 16,
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          zIndex: 10,
          overflow: 'hidden',
        }}
      >
        {/* Event header image */}
        <View
          style={{
            height: 100,
            backgroundColor: '#FFF7ED',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 32 }}>📖</Text>
        </View>
        <View style={{ padding: 16, gap: 10 }}>
          <Text
            style={{
              fontFamily: 'Inclusive Sans, sans-serif',
              fontWeight: '700',
              fontSize: 16,
              color: '#1C1917',
            }}
          >
            Bhagavad Gita Study
          </Text>
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 12 }}>📅</Text>
              <Text style={{ fontFamily: 'Inclusive Sans, sans-serif', fontSize: 12, color: '#57534E' }}>
                Today · 10:30 AM – 12:00 PM
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 12 }}>📍</Text>
              <Text style={{ fontFamily: 'Inclusive Sans, sans-serif', fontSize: 12, color: '#57534E' }}>
                CM San Jose · 1050 Park Ave
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontFamily: 'Inclusive Sans, sans-serif',
              fontSize: 12,
              lineHeight: 18,
              color: '#78716C',
              marginTop: 2,
            }}
          >
            Join us for Chapter 12: The Yoga of Devotion. Open to all levels.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <MockupAvatarDots count={14} />
          </View>
          <View
            style={{
              backgroundColor: '#E8862A',
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: 'center',
              marginTop: 6,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inclusive Sans, sans-serif',
                fontWeight: '600',
                fontSize: 13,
                color: '#FFFFFF',
              }}
            >
              Registered ✓
            </Text>
          </View>
        </View>
      </View>
    </div>
  )
}

function MockupAvatarPile({ count }: { count: number }) {
  const colors = ['#E8862A', '#9A3412', '#78716C', '#A8A29E', '#D6D3D1']
  const visible = Math.min(count, 5)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {Array.from({ length: visible }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: colors[i % colors.length],
            marginLeft: i === 0 ? 0 : -7,
            borderWidth: 2,
            borderColor: '#FFFFFF',
          }}
        />
      ))}
      {count > visible && (
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: '#F3F4F6',
            marginLeft: -7,
            borderWidth: 2,
            borderColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: 'Inclusive Sans, sans-serif',
              fontSize: 9,
              fontWeight: '600',
              color: '#57534E',
            }}
          >
            +{count - visible}
          </Text>
        </View>
      )}
    </View>
  )
}

function CoordinatorAttendeeRow({
  name,
  role,
  status,
  delay,
}: {
  name: string
  role: string
  status: 'going' | 'just-rsvpd'
  delay?: number
}) {
  return (
    <div style={{ animation: `fadeSlideIn 0.3s ease-out ${delay || 0}ms both` }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 8,
          paddingHorizontal: 4,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: '#E8862A',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: 'Inclusive Sans, sans-serif',
              fontWeight: '600',
              fontSize: 11,
              color: '#FFFFFF',
            }}
          >
            {name[0]}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: 'Inclusive Sans, sans-serif',
              fontWeight: '600',
              fontSize: 12,
              color: '#1C1917',
            }}
          >
            {name}
          </Text>
          <Text
            style={{
              fontFamily: 'Inclusive Sans, sans-serif',
              fontSize: 10,
              color: '#A8A29E',
            }}
          >
            {role}
          </Text>
        </View>
        {status === 'just-rsvpd' ? (
          <View
            style={{
              backgroundColor: '#DCFCE7',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inclusive Sans, sans-serif',
                fontWeight: '600',
                fontSize: 9,
                color: '#15803D',
              }}
            >
              Just RSVP'd
            </Text>
          </View>
        ) : (
          <Text
            style={{
              fontFamily: 'Inclusive Sans, sans-serif',
              fontSize: 10,
              color: '#A8A29E',
            }}
          >
            Going
          </Text>
        )}
      </View>
    </div>
  )
}

function CoordinatorVisual() {
  return (
    <div key="coordinator" style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
      <MockupShell>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              fontFamily: 'Inclusive Sans, sans-serif',
              fontWeight: '700',
              fontSize: 14,
              color: '#1C1917',
            }}
          >
            Manage event
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: '#DCFCE7',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 100,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#15803D',
              }}
            />
            <Text
              style={{
                fontFamily: 'Inclusive Sans, sans-serif',
                fontWeight: '600',
                fontSize: 10,
                color: '#15803D',
              }}
            >
              Live
            </Text>
          </View>
        </View>

        {/* Event card */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
          <View
            style={{
              backgroundColor: '#FFF7ED',
              borderRadius: 14,
              padding: 14,
              gap: 8,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inclusive Sans, sans-serif',
                fontWeight: '700',
                fontSize: 14,
                color: '#1C1917',
              }}
            >
              Spring CHYK Satsang
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text
                style={{
                  fontFamily: 'Inclusive Sans, sans-serif',
                  fontSize: 11,
                  color: '#57534E',
                }}
              >
                Sat, Apr 12 · 6:00 PM
              </Text>
              <View
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: '#A8A29E',
                }}
              />
              <Text
                style={{
                  fontFamily: 'Inclusive Sans, sans-serif',
                  fontSize: 11,
                  color: '#57534E',
                }}
              >
                CM Dallas
              </Text>
            </View>
          </View>
        </View>

        {/* Stats grid */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingTop: 12,
            gap: 8,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#F3F4F6',
              borderRadius: 10,
              padding: 10,
            }}
          >
            <Text
              style={{
                fontFamily: '"Inclusive Sans", sans-serif',
                fontSize: 22,
                color: '#C2410C',
                marginBottom: 2,
              }}
            >
              28
            </Text>
            <Text
              style={{
                fontFamily: 'Inclusive Sans, sans-serif',
                fontSize: 10,
                color: '#78716C',
              }}
            >
              Going
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#F3F4F6',
              borderRadius: 10,
              padding: 10,
            }}
          >
            <Text
              style={{
                fontFamily: '"Inclusive Sans", sans-serif',
                fontSize: 22,
                color: '#1C1917',
                marginBottom: 2,
              }}
            >
              94
            </Text>
            <Text
              style={{
                fontFamily: 'Inclusive Sans, sans-serif',
                fontSize: 10,
                color: '#78716C',
              }}
            >
              CHYKs reached
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#F3F4F6',
              borderRadius: 10,
              padding: 10,
            }}
          >
            <Text
              style={{
                fontFamily: '"Inclusive Sans", sans-serif',
                fontSize: 22,
                color: '#1C1917',
                marginBottom: 2,
              }}
            >
              5
            </Text>
            <Text
              style={{
                fontFamily: 'Inclusive Sans, sans-serif',
                fontSize: 10,
                color: '#78716C',
              }}
            >
              Centers
            </Text>
          </View>
        </View>

        {/* RSVP feed */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 14,
            flex: 1,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inclusive Sans, sans-serif',
                fontWeight: '600',
                fontSize: 11,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
                color: '#78716C',
              }}
            >
              Recent RSVPs
            </Text>
            <MockupAvatarPile count={28} />
          </View>
          <CoordinatorAttendeeRow
            name="Anika S."
            role="CM Frisco · new"
            status="just-rsvpd"
            delay={250}
          />
          <CoordinatorAttendeeRow
            name="Rohan P."
            role="CM Dallas"
            status="going"
            delay={400}
          />
          <CoordinatorAttendeeRow
            name="Meera K."
            role="CM Houston · visiting"
            status="going"
            delay={550}
          />
        </View>
      </MockupShell>
    </div>
  )
}

function EventsVisual() {
  return (
    <div key="events" style={{ animation: 'fadeSlideIn 0.4s ease-out' }}>
      <MockupShell>
        <View style={{ position: 'relative', flex: 1 }}>
          <MockupDragHandle />
          <MockupSearchBar />
          <MockupFilterTabs active="All" />
          <View style={{ paddingHorizontal: 12, gap: 2 }}>
            <MockupEventItem
              month="MAR"
              day="29"
              title="Bhagavad Gita Study"
              time="Today · 10:30 AM"
              location="CM San Jose"
              attendees={14}
              isRegistered
              delay={200}
            />
            <MockupEventItem
              month="APR"
              day="2"
              title="Youth Retreat"
              time="Sat · 9:00 AM"
              location="CM Fremont"
              attendees={48}
              delay={350}
            />
            <MockupEventItem
              month="APR"
              day="5"
              title="Devi Group"
              time="Mon · 7:30 PM"
              location="CM San Jose"
              attendees={22}
              delay={500}
            />
            <MockupEventItem
              month="APR"
              day="8"
              title="Vedanta Course"
              time="Thu · 7:00 PM"
              location="CM Palo Alto"
              attendees={18}
              delay={650}
            />
          </View>
          {/* Event detail overlay */}
          <MockupEventDetail delay={900} />
        </View>
      </MockupShell>
    </div>
  )
}


// ─── Main export ───

export function AppPreview() {
  const { width } = useWindowDimensions()
  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1024

  const [activeIndex, setActiveIndex] = useState(0)
  const [cycleKey, setCycleKey] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goToTab = useCallback((index: number) => {
    setActiveIndex(index)
    setCycleKey((k) => k + 1)
  }, [])

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      goToTab((activeIndex + 1) % FEATURES.length)
    }, TAB_DURATION)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [activeIndex, cycleKey, goToTab])

  const handleTabPress = (index: number) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    goToTab(index)
  }

  const activeFeature = FEATURES[activeIndex]
  const sectionPadding = isMobile ? 20 : isTablet ? 40 : 80

  const renderVisual = () => {
    switch (activeIndex) {
      case 0:
        return <DiscoverVisual />
      case 1:
        return <EventsVisual />
      case 2:
        return <CoordinatorVisual />
      default:
        return null
    }
  }

  const tabPills = FEATURES.map((feature, index) => (
    <TabPill
      key={feature.number}
      feature={feature}
      isActive={index === activeIndex}
      onPress={() => handleTabPress(index)}
      cycleKey={cycleKey}
    />
  ))

  return (
    <View
      style={{
        backgroundColor: '#F4DED7',
        paddingHorizontal: sectionPadding,
        paddingVertical: sectionPadding,
      }}
    >
      {/* Mobile: section label + tabs above, then content stacked */}
      {isMobile && (
        <>
          <Text
            style={{
              fontFamily: 'Inclusive Sans, sans-serif',
              fontWeight: '600',
              fontSize: 12,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: '#C2410C',
              marginBottom: 20,
            }}
          >
            THE PLATFORM
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 32 }}
            contentContainerStyle={{ flexDirection: 'row', gap: 10 }}
          >
            {tabPills}
          </ScrollView>
        </>
      )}

      {/* Side-by-side: text left, visual right */}
      <View
        style={{
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 32 : isTablet ? 40 : 60,
          alignItems: isMobile ? 'stretch' : 'center',
        }}
      >
        {/* Left: section label, tabs, heading + description */}
        <View
          style={{
            flex: isMobile ? undefined : 1,
          }}
        >
          {/* Desktop: section label + tabs inside left column */}
          {!isMobile && (
            <>
              <Text
                style={{
                  fontFamily: 'Inclusive Sans, sans-serif',
                  fontWeight: '600',
                  fontSize: 12,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: '#C2410C',
                  marginBottom: 20,
                }}
              >
                THE PLATFORM
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 32, flexWrap: 'wrap' }}>
                {tabPills}
              </View>
            </>
          )}

          <div
            key={`text-${cycleKey}`}
            style={{
              animation: 'fadeSlideIn 0.35s ease-out',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Text
              style={{
                fontFamily: '"Inclusive Sans", sans-serif',
                fontWeight: '400',
                fontSize: isMobile ? 28 : isTablet ? 32 : 40,
                lineHeight: isMobile ? 36 : isTablet ? 40 : 48,
                color: '#1C1917',
                marginBottom: 16,
              }}
            >
              {activeFeature.heading}
            </Text>

            <Text
              style={{
                fontFamily: 'Inclusive Sans, sans-serif',
                fontWeight: '400',
                fontSize: isMobile ? 15 : 18,
                lineHeight: isMobile ? 24 : 28,
                color: '#57534E',
              }}
            >
              {activeFeature.description}
            </Text>
          </div>
        </View>

        {/* Right: app mockup */}
        <View
          style={{
            flex: isMobile ? undefined : 1,
          }}
        >
          {renderVisual()}
        </View>
      </View>
    </View>
  )
}
