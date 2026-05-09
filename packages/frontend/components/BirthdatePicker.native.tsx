import React, { useState } from 'react'
import { View, Text, Pressable, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'

interface BirthdatePickerProps {
  value?: Date
  onChange: (date: Date) => void
}

export default function BirthdatePicker({ value, onChange }: BirthdatePickerProps) {
  const [date, setDate] = useState(value || new Date(2000, 0, 1))
  const [show, setShow] = useState(false)

  const handleChange = (event: any, selectedDate?: Date) => {
    // On Android, the picker closes automatically
    if (Platform.OS === 'android') {
      setShow(false)
    }

    if (selectedDate) {
      setDate(selectedDate)
      onChange(selectedDate)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <View className="p-4">
      <Pressable
        onPress={() => setShow(true)}
        className="bg-muted/50 dark:bg-muted-dark/10 py-3 px-4 rounded-lg border-2 border-transparent active:border-primary"
      >
        <Text className="font-sans text-base text-content dark:text-content-dark">
          {formatDate(date)}
        </Text>
      </Pressable>

      {show && (
        <View>
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            maximumDate={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d })()}
            minimumDate={new Date(1900, 0, 1)}
          />

          {/* iOS needs a done button */}
          {Platform.OS === 'ios' && (
            <Pressable
              onPress={() => {
                onChange(date)
                setShow(false)
              }}
              className="bg-primary py-3 px-4 rounded-lg mt-2"
            >
              <Text className="font-sans text-base text-white text-center font-semibold">
                Done
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  )
}
