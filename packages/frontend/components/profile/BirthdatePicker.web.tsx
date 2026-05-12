// BirthdatePicker.web.tsx
import React, { useState, useEffect } from 'react'
import { View, Text, Pressable } from 'react-native'
// --- NEW: Import Headless UI ---
import { Listbox, Transition } from '@headlessui/react'
import { ChevronDown } from 'lucide-react-native'

// --- Helper: Generate array of numbers ---
function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

// --- NEW: A fully styleable Select component ---
function Select({ label, value, options, onChange, className }) {
  // Find the currently selected option object
  const selectedOption = options.find((opt) => opt.value === value)

  return (
    <Listbox value={value} onChange={onChange}>
      <div className={`relative ${className}`}>
        {/* This is the "select" box */}
        <Listbox.Button
          aria-label={label}
          className="relative w-full font-sans text-base bg-stone-100 dark:bg-stone-800 text-content dark:text-content-dark py-[14px] px-4 rounded-lg border-2 border-transparent focus:border-primary outline-none text-left"
        >
          <span className="block truncate">{selectedOption?.label}</span>
          {/* A basic arrow. Replace with an SVG icon for best results. */}
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="text-stone-400 dark:text-stone-500 ml-3" />
          </span>
        </Listbox.Button>

        {/* This is the dropdown menu */}
        <Transition
          as={React.Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="mt-1 max-h-60 w-full overflow-auto rounded-md bg-background dark:bg-background-dark py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {options
              .filter((option) => option.value !== null) // <-- filter out placeholder
              .map((option) => (
                <Listbox.Option
                  key={option.value}
                  value={option.value}
                  className={({ active }) =>
                    `relative select-none py-2 px-4 font-sans ${
                      active ? 'bg-primary/10 text-primary' : 'text-content dark:text-content-dark'
                    }`
                  }
                >
                  {option.label}
                </Listbox.Option>
              ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  )
}

export default function BirthdatePicker({ value, onChange }) {
  const [date, setDate] = useState(value || new Date(2000, 0, 1))

  useEffect(() => {
    setDate(value || new Date(2000, 0, 1))
  }, [value])

  const currentYear = new Date().getFullYear()
  // Add placeholder options
  const years = [
    { label: 'Year', value: null },
    ...range(currentYear - 100, currentYear - 18)
      .reverse()
      .map((y) => ({ label: y, value: y })),
  ]
  const months = [
    { label: 'Month', value: null },
    ...Array.from({ length: 12 }, (_, i) => ({
      label: new Date(2000, i).toLocaleString('en-US', { month: 'long' }),
      value: i,
    })),
  ]
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const days = [
    { label: 'Day', value: null },
    ...range(1, daysInMonth).map((d) => ({ label: d, value: d })),
  ]

  // Set initial state to value prop if provided, otherwise null for placeholders
  const [dateParts, setDateParts] = useState(() => {
    if (value) {
      return {
        year: value.getFullYear(),
        month: value.getMonth(),
        day: value.getDate(),
      }
    }
    return {
      year: null,
      month: null,
      day: null,
    }
  })

  const handlePartChange = (part, newValue) => {
    const newParts = { ...dateParts, [part]: newValue }
    setDateParts(newParts)

    // Only call onChange when all parts are selected
    if (newParts.year !== null && newParts.month !== null && newParts.day !== null) {
      const selectedDate = new Date(newParts.year, newParts.month, newParts.day)
      const minAgeDate = new Date()
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 18)
      minAgeDate.setHours(0, 0, 0, 0)

      // Block under-18 (also covers future dates since minAgeDate < today)
      if (selectedDate <= minAgeDate) {
        onChange(selectedDate)
      }
    }
  }

  return (
    <View className="w-full max-w-[480px]" style={{ overflow: 'visible', zIndex: 50 }}>
      <View className="flex-row justify-between space-x-2">
        {/* Month */}
        <Select
          label="Month"
          value={dateParts.month}
          options={months}
          onChange={(val) => handlePartChange('month', val)}
          className="flex-[4]"
        />
        {/* Day */}
        <Select
          label="Day"
          value={dateParts.day}
          options={days}
          onChange={(val) => handlePartChange('day', val)}
          className="flex-[3]"
        />
        {/* Year */}
        <Select
          label="Year"
          value={dateParts.year}
          options={years}
          onChange={(val) => handlePartChange('year', val)}
          className="flex-[3]"
        />
      </View>
    </View>
  )
}
