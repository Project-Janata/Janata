import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, type TextInputProps } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PrimaryButton } from '../ui'
import { useOnboarding } from '../contexts'
import { useColors } from '../../hooks/useColors'

// ── StepLayout ───────────────────────────────────────────────────────────────
// Outer shell shared by all onboarding steps.

export function StepLayout({
  children,
  footer,
}: {
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <View className="max-w-[720px] w-full flex-1 self-center px-6">
        <View className="flex-1 justify-center">{children}</View>
        <View className="pb-6">{footer}</View>
      </View>
    </SafeAreaView>
  )
}

// ── StepHeading ──────────────────────────────────────────────────────────────

export function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="mb-8">
      <Text className="text-4xl font-sans font-bold text-content dark:text-content-dark text-center mb-3">
        {title}
      </Text>
      <Text className="text-lg font-sans text-stone-500 dark:text-stone-400 text-center">
        {subtitle}
      </Text>
    </View>
  )
}

// ── OnboardingInput ──────────────────────────────────────────────────────────

export function OnboardingInput({
  focused,
  ...props
}: TextInputProps & { focused?: boolean }) {
  const [internalFocused, setInternalFocused] = useState(false)
  const isFocused = focused ?? internalFocused
  const c = useColors()

  return (
    <TextInput
      className={`text-content dark:text-content-dark w-full font-sans rounded-xl px-4 py-4 text-base bg-stone-100 dark:bg-stone-800 border-2 outline-none ${
        isFocused ? 'border-primary' : 'border-transparent'
      } placeholder:text-gray-400 dark:placeholder:text-gray-500`}
      style={{ fontSize: 16 }}
      placeholderTextColor={c.textFaint}
      onFocus={(e) => {
        setInternalFocused(true)
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        setInternalFocused(false)
        props.onBlur?.(e)
      }}
      {...props}
    />
  )
}

// ── StepError ────────────────────────────────────────────────────────────────

export function StepError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <View className="w-full max-w-md self-center mt-4 bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
      <Text className="text-red-600 dark:text-red-400 font-sans text-center">{message}</Text>
    </View>
  )
}

// ── StepFooter ───────────────────────────────────────────────────────────────
// Continue button + optional "Skip for now" link.

export function StepFooter({
  onContinue,
  disabled,
  loading,
  label = 'Continue',
}: {
  onContinue: () => void
  disabled?: boolean
  loading?: boolean
  label?: string
}) {
  const { skipOnboarding, returnTo, isSubmitting } = useOnboarding()

  return (
    <>
      <PrimaryButton
        onPress={onContinue}
        disabled={disabled}
        loading={loading}
        style={{ width: '100%', maxWidth: 448, alignSelf: 'center' }}
      >
        {label}
      </PrimaryButton>
      {returnTo && (
        <Pressable
          onPress={skipOnboarding}
          disabled={isSubmitting}
          style={{ alignSelf: 'center', marginTop: 12 }}
        >
          <Text className="text-sm font-sans text-stone-400 dark:text-stone-500">
            Skip for now
          </Text>
        </Pressable>
      )}
    </>
  )
}
