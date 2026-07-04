import React from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg'
import type { IntroStep } from './IntroSteps'

type IntroCardProps = {
  step: IntroStep
  /** Width of the pager viewport so each card fills exactly one page. */
  width: number
  /** Page index — used to give each card's gradient a unique id. */
  index: number
}

const GLOW_SIZE = 240
const ART_SIZE = 140

/**
 * A single full-bleed intro card: a 3D object render floating over a warm
 * radial glow, then headline and supporting body. Sized to fill one pager
 * page; content is vertically centered and breathable. Works in light + dark
 * (the art is a transparent PNG; the glow is brand-orange at low opacity).
 */
export default function IntroCard({ step, width, index }: IntroCardProps) {
  // Each card needs its own gradient id. On iOS react-native-svg (Fabric), the
  // same paint-server id reused across sibling <Svg> nodes collides, which
  // knocks out rendering on the later cards. A per-index id keeps them isolated.
  const glowId = `introGlow-${index}`
  return (
    <View style={{ width }} className="flex-1 items-center justify-center px-6">
      <View className="w-full max-w-md items-center gap-7">
        {/* Visual: warm glow halo behind a 3D object render */}
        <View style={{ width: GLOW_SIZE, height: GLOW_SIZE }} className="items-center justify-center">
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#F6A93B" stopOpacity={0.32} />
                <Stop offset="0.55" stopColor="#F6A93B" stopOpacity={0.12} />
                <Stop offset="1" stopColor="#F6A93B" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${glowId})`} />
          </Svg>
          <Image
            source={step.image}
            style={{ width: ART_SIZE, height: ART_SIZE }}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>

        {/* Copy */}
        <View className="gap-3">
          <Text className="text-3xl font-sans font-bold text-content dark:text-content-dark text-center">
            {step.title}
          </Text>
          <Text className="text-lg font-sans text-stone-500 dark:text-stone-400 text-center leading-7">
            {step.body}
          </Text>
        </View>
      </View>
    </View>
  )
}
