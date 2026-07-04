import React, { useMemo } from 'react'
import { View, Text, Pressable } from 'react-native'

function getWeekDays(): { dateStr: string; dayLetter: string; dayNum: number; isToday: boolean; date: Date }[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days: { dateStr: string; dayLetter: string; dayNum: number; isToday: boolean; date: Date }[] = []
  const letters = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  for (let offset = -3; offset <= 3; offset++) {
    const d = new Date(today)
    d.setDate(today.getDate() + offset)
    days.push({
      dateStr: d.toISOString().split('T')[0],
      dayLetter: letters[d.getDay()],
      dayNum: d.getDate(),
      isToday: offset === 0,
      date: d,
    })
  }
  return days
}

/**
 * Build the month/year label that sits above the week strip. Shows the year
 * once when all days share it; spans two months when the strip crosses a
 * boundary (e.g. "April – May 2026").
 */
function buildMonthLabel(days: { date: Date }[]): string {
  if (days.length === 0) return ''
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December']
  const first = days[0].date
  const last = days[days.length - 1].date
  const firstMonth = first.getMonth()
  const lastMonth = last.getMonth()
  const firstYear = first.getFullYear()
  const lastYear = last.getFullYear()
  if (firstYear === lastYear && firstMonth === lastMonth) {
    return `${months[firstMonth]} ${firstYear}`
  }
  if (firstYear === lastYear) {
    return `${months[firstMonth]} – ${months[lastMonth]} ${firstYear}`
  }
  return `${months[firstMonth]} ${firstYear} – ${months[lastMonth]} ${lastYear}`
}

type WeekCalendarProps = {
  eventDates: Set<string>
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
}

export default function WeekCalendar({ eventDates, selectedDate, onSelectDate }: WeekCalendarProps) {
  const weekDays = useMemo(() => getWeekDays(), [])
  const monthLabel = useMemo(() => buildMonthLabel(weekDays), [weekDays])

  return (
    <View>
      <Text
        className="text-[11px] font-sans text-stone-500 dark:text-stone-400 px-4 pt-2"
        style={{ letterSpacing: 0.3 }}
      >
        {monthLabel}
      </Text>
      <View className="flex-row justify-around px-3 py-2.5">
      {weekDays.map((d) => {
        const isSelected = selectedDate === d.dateStr
        const hasEvents = eventDates.has(d.dateStr)

        return (
          <Pressable
            key={d.dateStr}
            onPress={() => onSelectDate(isSelected ? null : d.dateStr)}
            className="items-center px-1"
            style={{ minWidth: 42 }}
          >
            <Text className="text-[11px] font-sans text-gray-400 dark:text-gray-500">
              {d.dayLetter}
            </Text>
            <View style={{ position: 'relative' }}>
              <View
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  isSelected
                    ? 'bg-primary'
                    : d.isToday
                      ? 'border-2 border-primary'
                      : ''
                }`}
              >
                <Text
                  className={`text-sm font-sans ${
                    isSelected
                      ? 'text-white'
                      : d.isToday
                        ? 'text-primary'
                        : 'text-content dark:text-content-dark'
                  }`}
                >
                  {d.dayNum}
                </Text>
              </View>
              {/* Event dot — overlaid top-right of number */}
              {hasEvents && (
                <View
                  className="w-2 h-2 rounded-full bg-primary"
                  style={{ position: 'absolute', top: 2, right: 2 }}
                />
              )}
            </View>
          </Pressable>
        )
      })}
      </View>
    </View>
  )
}
