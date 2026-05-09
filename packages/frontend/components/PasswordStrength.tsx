import React from 'react'
import { View, Text } from 'react-native'
import { Check, X } from 'lucide-react-native'

interface PasswordStrengthProps {
  password: string
  show: boolean
}

// UIC Password Strength Calculation
const calculatePasswordStrength = (
  password: string
): { score: number; strength: string; percent: number } => {
  let score = 0

  if (!password) return { score: 0, strength: 'Too Short', percent: 0 }

  // Length score
  score += password.length * 4

  // Uppercase letters
  const uppercase = password.match(/[A-Z]/g)
  if (uppercase) {
    score += (password.length - uppercase.length) * 2
  }

  // Lowercase letters
  const lowercase = password.match(/[a-z]/g)
  if (lowercase) {
    score += (password.length - lowercase.length) * 2
  }

  // Numbers
  const numbers = password.match(/[0-9]/g)
  if (numbers) {
    score += numbers.length * 4
  }

  // Symbols
  const symbols = password.match(/[^a-zA-Z0-9]/g)
  if (symbols) {
    score += symbols.length * 6
  }

  // Middle numbers or symbols
  const middleNumbersSymbols = password.slice(1, -1).match(/[^a-zA-Z]/g)
  if (middleNumbersSymbols) {
    score += middleNumbersSymbols.length * 2
  }

  // Requirements
  let requirementsMet = 0
  if (password.length >= 8) requirementsMet++
  if (/[A-Z]/.test(password)) requirementsMet++
  if (/[a-z]/.test(password)) requirementsMet++
  if (/[0-9]/.test(password)) requirementsMet++
  if (/[^a-zA-Z0-9]/.test(password)) requirementsMet++

  if (requirementsMet >= 3) {
    score += requirementsMet * 2
  }

  // Deductions

  // Letters only
  if (/^[a-zA-Z]+$/.test(password)) {
    score -= password.length
  }

  // Numbers only
  if (/^[0-9]+$/.test(password)) {
    score -= password.length
  }

  // Repeat characters
  const repeats = password.match(/(.)\1+/g)
  if (repeats) {
    repeats.forEach((repeat) => {
      score -= repeat.length - 1
    })
  }

  // Consecutive uppercase letters
  const consecutiveUpper = password.match(/[A-Z]{2,}/g)
  if (consecutiveUpper) {
    consecutiveUpper.forEach((match) => {
      score -= (match.length - 1) * 2
    })
  }

  // Consecutive lowercase letters
  const consecutiveLower = password.match(/[a-z]{2,}/g)
  if (consecutiveLower) {
    consecutiveLower.forEach((match) => {
      score -= (match.length - 1) * 2
    })
  }

  // Consecutive numbers
  const consecutiveNumbers = password.match(/[0-9]{2,}/g)
  if (consecutiveNumbers) {
    consecutiveNumbers.forEach((match) => {
      score -= (match.length - 1) * 2
    })
  }

  // Sequential letters (abc, xyz)
  for (let i = 0; i < password.length - 2; i++) {
    const char1 = password.charCodeAt(i)
    const char2 = password.charCodeAt(i + 1)
    const char3 = password.charCodeAt(i + 2)

    if (char2 === char1 + 1 && char3 === char2 + 1) {
      score -= 3
    }
    if (char2 === char1 - 1 && char3 === char2 - 1) {
      score -= 3
    }
  }

  // Sequential numbers (123, 987)
  for (let i = 0; i < password.length - 2; i++) {
    const num1 = parseInt(password[i])
    const num2 = parseInt(password[i + 1])
    const num3 = parseInt(password[i + 2])

    if (!isNaN(num1) && !isNaN(num2) && !isNaN(num3)) {
      if (num2 === num1 + 1 && num3 === num2 + 1) {
        score -= 3
      }
      if (num2 === num1 - 1 && num3 === num2 - 1) {
        score -= 3
      }
    }
  }

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score))

  // Determine strength label
  let strength = 'Too Short'
  if (password.length >= 8) {
    if (score < 20) strength = 'Very Weak'
    else if (score < 40) strength = 'Weak'
    else if (score < 60) strength = 'Fair'
    else if (score < 80) strength = 'Good'
    else strength = 'Strong'
  }

  return { score, strength, percent: score }
}

export default function PasswordStrength({ password, show }: PasswordStrengthProps) {
  if (!show) return null

  const { score, strength, percent } = calculatePasswordStrength(password)

  // Individual requirement checks
  const requirements = [
    {
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      label: 'One uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'One lowercase letter',
      met: /[a-z]/.test(password),
    },
    {
      label: 'One number',
      met: /[0-9]/.test(password),
    },
    {
      label: 'One special character (!@#$...)',
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ]

  // Determine color based on score
  const getStrengthColor = () => {
    if (score < 20) return 'bg-red-500'
    if (score < 40) return 'bg-orange-500'
    if (score < 60) return 'bg-amber-500'
    if (score < 80) return 'bg-lime-500'
    return 'bg-green-500'
  }

  const getStrengthTextColor = () => {
    if (score < 20) return 'text-red-600 dark:text-red-400'
    if (score < 40) return 'text-orange-600 dark:text-orange-400'
    if (score < 60) return 'text-amber-700 dark:text-amber-400'
    if (score < 80) return 'text-lime-700 dark:text-lime-400'
    return 'text-green-600 dark:text-green-400'
  }

  return (
    <View className="mt-3 gap-3">
      {/* Strength Bar */}
      <View className="gap-2">
        <View className="flex-row justify-between items-center">
          <Text className="text-sm font-sans font-medium text-content dark:text-content-dark">
            Password Strength
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className={`text-sm font-sans font-semibold ${getStrengthTextColor()}`}>
              {strength}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <View
            className={`h-full ${getStrengthColor()}`}
            style={{ width: `${percent}%` }}
          />
        </View>
      </View>

      {/* Requirements Checklist */}
      <View className="gap-2 bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-3 mb-3">
        <Text className="text-xs font-sans font-semibold text-content dark:text-content-dark mb-1">
          Password Requirements:
        </Text>
        {requirements.map((req, index) => (
          <View key={index} className="flex-row items-center gap-2">
            {req.met ? (
              <View className="w-4 h-4 rounded-full bg-green-500 items-center justify-center">
                <Check size={12} color="white" strokeWidth={3} />
              </View>
            ) : (
              <View className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 items-center justify-center">
                <X size={12} color="#9CA3AF" strokeWidth={2} />
              </View>
            )}
            <Text
              className={`text-xs font-sans ${
                req.met
                  ? 'text-green-600 dark:text-green-400 font-medium'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {req.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}
