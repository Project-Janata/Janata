import React, { useState } from 'react'
import { View, Text, Pressable, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useTheme } from './contexts'

interface BirthdatePickerProps {
  value?: Date
  onChange: (date: Date) => void
}

export default function BirthdatePicker({ value, onChange }: BirthdatePickerProps) {
  const { isDark } = useTheme()
  const [pickerDate, setPickerDate] = useState(value || new Date(2000, 0, 1))
  const [show, setShow] = useState(false)

  const handleOpen = () => {
    setPickerDate(value || new Date(2000, 0, 1))
    setShow((s) => !s)
  }

  const handleChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false)
    if (selectedDate) {
      setPickerDate(selectedDate)
      onChange(selectedDate)
    }
  }

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const textColor = isDark ? '#FAFAFA' : '#1C1917'
  const mutedColor = isDark ? '#737373' : '#A8A29E'
  const accentColor = '#C2410C'

  return (
    <View>
      <Pressable onPress={handleOpen}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: value ? textColor : mutedColor, paddingTop: 6 }}>
          {value ? formatDate(value) : 'Select date'}
        </Text>
      </Pressable>

      {show && (
        <View style={{ marginTop: 8 }}>
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            maximumDate={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d })()}
            minimumDate={new Date(1900, 0, 1)}
            themeVariant={isDark ? 'dark' : 'light'}
          />
          {Platform.OS === 'ios' && (
            <Pressable
              onPress={() => { onChange(pickerDate); setShow(false) }}
              style={{
                marginTop: 8,
                backgroundColor: accentColor,
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: '#fff', fontWeight: '600' }}>
                Done
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  )
}
