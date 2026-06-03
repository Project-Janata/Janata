import React, { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Check } from 'lucide-react-native'
import type { AppColors } from '../../tokens'
import { CenterSearch } from '../center/CenterSearch'

type StepState = 'done' | 'active' | 'todo'

function StepDot({ index, state, colors }: { index: number; state: StepState; colors: AppColors }) {
  if (state === 'done') {
    return (
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.success,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Check size={16} color={colors.textInverse} strokeWidth={3} />
      </View>
    )
  }
  const active = state === 'active'
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: active ? colors.accent : colors.panel,
        borderWidth: active ? 0 : 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '700', color: active ? colors.textInverse : colors.textMuted }}>
        {index}
      </Text>
    </View>
  )
}

// State-aware setup panel for the right rail (desktop) / top of the stacked
// empty state (mobile). Walks a first-timer through the two steps that unlock
// the feed: sign in, then join a center. Steps collapse as they complete.
export function FeedSetupRail({
  colors,
  isSignedIn,
  onSignIn,
  onJoinCenter,
  onBrowseEvents,
}: {
  colors: AppColors
  isSignedIn: boolean
  onSignIn: () => void
  /** Resolve true on success. Guest mode routes to auth and may not resolve. */
  onJoinCenter: (centerId: string) => Promise<boolean> | void
  onBrowseEvents: () => void
}) {
  const [joiningId, setJoiningId] = useState<string | null>(null)

  const handleJoin = async (centerId: string) => {
    setJoiningId(centerId)
    try {
      await onJoinCenter(centerId)
    } finally {
      setJoiningId(null)
    }
  }

  const step1: StepState = isSignedIn ? 'done' : 'active'
  const step2: StepState = isSignedIn ? 'active' : 'todo'

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        backgroundColor: colors.card,
        padding: 18,
        gap: 4,
      }}
    >
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 17, color: colors.text }}>
        Finish setting up your feed
      </Text>
      <Text style={{ fontSize: 13, lineHeight: 18, color: colors.textMuted, marginBottom: 14 }}>
        Two quick steps and your community shows up here.
      </Text>

      {/* Step 1 — Sign in */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ alignItems: 'center' }}>
          <StepDot index={1} state={step1} colors={colors} />
          <View style={{ flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 4 }} />
        </View>
        <View style={{ flex: 1, paddingBottom: 16 }}>
          <Text
            style={{
              fontSize: 14.5,
              color: step1 === 'done' ? colors.textMuted : colors.text,
              fontWeight: step1 === 'active' ? '600' : '400',
            }}
          >
            {step1 === 'done' ? 'Signed in' : 'Sign in'}
          </Text>
          {step1 === 'active' ? (
            <Pressable
              onPress={onSignIn}
              accessibilityRole="button"
              style={{ marginTop: 10, backgroundColor: colors.accent, borderRadius: 999, paddingVertical: 11, alignItems: 'center' }}
            >
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.textInverse }}>
                Sign in to continue
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Step 2 — Join your center */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <StepDot index={2} state={step2} colors={colors} />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14.5,
              color: step2 === 'todo' ? colors.textMuted : colors.text,
              fontWeight: step2 === 'active' ? '600' : '400',
            }}
          >
            Join your center
          </Text>

          {step2 === 'active' ? (
            <View style={{ marginTop: 10, gap: 8 }}>
              <CenterSearch
                colors={colors}
                dense
                placeholder="Enter your city or town"
                busyCenterId={joiningId}
                onSelect={(center) => handleJoin(center.id)}
              />
              <Pressable onPress={onBrowseEvents} accessibilityRole="button" style={{ paddingTop: 2 }}>
                <Text style={{ fontSize: 12.5, color: colors.textMuted }}>
                  Or RSVP to an event to see its board.
                </Text>
              </Pressable>
            </View>
          ) : (
            <Text style={{ fontSize: 12.5, lineHeight: 17, color: colors.textFaint, marginTop: 2 }}>
              Your home center's board lands here once you join.
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}
