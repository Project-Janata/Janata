import { View, Text, TextInput } from 'react-native'
import { useOnboarding } from '../contexts'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { PrimaryButton } from '../ui'

export default function StepOne() {
  const { goToNextStep, firstName, setFirstName, lastName, setLastName } = useOnboarding()
  const [focusedField, setFocusedField] = useState<'first' | 'last' | null>(null)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const FieldError = ({ message }: { message?: string }) => {
    if (!message) return null
    return <Text className="text-red-500 text-sm mt-1 ml-1 font-sans">{message}</Text>
  }

  const errorMessages = Object.values(errors).filter(Boolean)

  // Clear errors on input change
  const handleFirstNameChange = (text: string) => {
    setFirstName(text)
    setErrors((prev) => ({ ...prev, firstName: '' }))
  }
  const handleLastNameChange = (text: string) => {
    setLastName(text)
    setErrors((prev) => ({ ...prev, lastName: '' }))
  }

  const handleContinue = () => {
    if (!firstName.trim()) {
      setErrors({ ...errors, firstName: 'First name is required' })
      return
    }
    if (!lastName.trim()) {
      setErrors({ ...errors, lastName: 'Last name is required' })
      return
    }
    setFirstName(firstName.trim())
    setLastName(lastName.trim())
    goToNextStep()
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <View className="max-w-[720px] w-full flex-1 self-center px-6">
        {/* Content Area */}
        <View className="flex-1 justify-center items-center">
          <View className="gap-4 w-full">
            <View className="gap-2">
              <Text className="text-4xl font-sans font-bold text-content dark:text-content-dark text-center">
                Welcome to Janata!
              </Text>
              <Text className="text-lg font-sans text-stone-500 dark:text-stone-400 text-center">
                Enter your name to get started with your journey.
              </Text>
            </View>

            {/* Input Fields */}
            <View className="gap-3 mt-8 w-full items-center">
              {errorMessages.length > 0 && (
                <View className=" font-sans bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 mb-4">
                  {errorMessages.map((msg, idx) => (
                    <Text key={idx} className="text-red-500 text-sm font-sans">
                      {msg}
                    </Text>
                  ))}
                </View>
              )}
              <TextInput
                className={`text-content dark:text-content-dark w-full max-w-md font-sans rounded-xl px-4 py-4 text-base bg-stone-100 dark:bg-stone-800 border-2 outline-none ${
                  focusedField === 'first' ? 'border-primary' : 'border-transparent'
                } placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                placeholder="First Name"
                value={firstName}
                onChangeText={handleFirstNameChange}
                onFocus={() => setFocusedField('first')}
                onBlur={() => setFocusedField(null)}
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                autoComplete="given-name"
                autoCorrect={false}
              />
              <TextInput
                className={`text-content dark:text-content-dark w-full max-w-md font-sans rounded-xl px-4 py-4 text-base bg-stone-100 dark:bg-stone-800 border-2 outline-none ${
                  focusedField === 'last' ? 'border-primary' : 'border-transparent'
                } placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                placeholder="Last Name"
                value={lastName}
                onChangeText={handleLastNameChange}
                onFocus={() => setFocusedField('last')}
                onBlur={() => setFocusedField(null)}
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                autoComplete="family-name"
                autoCorrect={false}
              />
            </View>
          </View>
        </View>

        {/* Button Area */}
        <View className="pb-6">
          <PrimaryButton
            onPress={handleContinue}
            disabled={!firstName.trim() || !lastName.trim()}
            style={{ width: '100%', maxWidth: 448, alignSelf: 'center' }}
          >
            Continue
          </PrimaryButton>
        </View>
      </View>
    </SafeAreaView>
  )
}
