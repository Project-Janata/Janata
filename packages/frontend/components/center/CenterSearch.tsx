import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Building2, Check } from 'lucide-react-native'
import { useColors } from '../../hooks/useColors'
import type { AppColors } from '../../tokens'
import { calculateDistance } from '../../utils/distance'
import { fetchCenters, type CenterData } from '../../utils/api'

export interface CenterSearchResult {
  id: string
  name: string
  /** Miles from the searched location, when location-ranked. */
  distance?: number
}

// Shared center search: type a city or town, geocode it, and rank centers by
// distance (nearest first). Extracted from onboarding so the feed, onboarding,
// and any future "pick a center" surface use the exact same behavior. Styled
// from design tokens so it sits correctly in light/dark and in any container.
export function CenterSearch({
  onSelect,
  selectedCenterId,
  busyCenterId,
  colors: colorsProp,
  placeholder = 'Enter your city or town',
  autoFocus,
  dense = false,
  maxResults = 6,
  maxListHeight = 260,
  autoSelectNearest = false,
}: {
  onSelect: (center: CenterSearchResult) => void
  selectedCenterId?: string | null
  /** Center id currently being acted on (shows a spinner on that row). */
  busyCenterId?: string | null
  colors?: AppColors
  placeholder?: string
  autoFocus?: boolean
  /** Compact sizing for tight containers like the feed rail. */
  dense?: boolean
  maxResults?: number
  maxListHeight?: number
  /** Onboarding auto-picks the nearest center once results land. */
  autoSelectNearest?: boolean
}) {
  const fallbackColors = useColors()
  const colors = colorsProp ?? fallbackColors

  const [input, setInput] = useState('')
  const [allCenters, setAllCenters] = useState<CenterData[]>([])
  const [results, setResults] = useState<CenterSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSelectedFor = useRef<string>('')

  useEffect(() => {
    let mounted = true
    fetchCenters()
      .then((centers) => {
        if (mounted && centers.length > 0) setAllCenters(centers)
      })
      .catch(() => {
        // Silently fail — the field stays usable once centers load.
      })
    return () => {
      mounted = false
    }
  }, [])

  const geocode = async (query: string) => {
    if (allCenters.length === 0) {
      setError('Loading centers, try again in a moment.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us`
      )
      if (!res.ok) throw new Error('geocode failed')
      const data = await res.json()
      if (!data.length) {
        setResults([])
        setError('Location not found')
        return
      }
      const lat = parseFloat(data[0].lat)
      const lon = parseFloat(data[0].lon)
      const ranked: CenterSearchResult[] = allCenters
        .filter((c) => c.latitude != null && c.longitude != null)
        .map((c) => ({
          id: c.centerID,
          name: c.name,
          distance: calculateDistance(lat, lon, c.latitude, c.longitude),
        }))
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
        .slice(0, maxResults)
      setResults(ranked)
      setError('')
      if (autoSelectNearest && ranked.length > 0 && autoSelectedFor.current !== query) {
        autoSelectedFor.current = query
        onSelect(ranked[0])
      }
    } catch {
      setResults([])
      setError('Unable to find location')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current)
    if (input.trim().length >= 3) {
      debounce.current = setTimeout(() => geocode(input), 500)
    } else {
      setResults([])
      setError('')
    }
    return () => {
      if (debounce.current) clearTimeout(debounce.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, allCenters])

  const inputPaddingV = dense ? 9 : 14
  const inputFontSize = dense ? 14 : 16

  return (
    <View style={{ width: '100%' }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 14,
          paddingVertical: inputPaddingV,
          borderRadius: 12,
          backgroundColor: colors.panel,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          autoCapitalize="words"
          autoFocus={autoFocus}
          returnKeyType="search"
          style={{ flex: 1, fontSize: inputFontSize, color: colors.text, paddingVertical: 0, outlineStyle: 'none' } as any}
        />
        {loading ? <ActivityIndicator size="small" color={colors.accent} /> : null}
      </View>

      {error ? (
        <Text style={{ fontSize: 12.5, color: colors.textMuted, marginTop: 8 }}>{error}</Text>
      ) : null}

      {results.length > 0 ? (
        <ScrollView style={{ maxHeight: maxListHeight, marginTop: 8 }} keyboardShouldPersistTaps="handled">
          {results.map((center, index) => {
            const selected = selectedCenterId === center.id
            const busy = busyCenterId === center.id
            return (
              <Pressable
                key={center.id}
                onPress={() => onSelect(center)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={`Select ${center.name}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: dense ? 9 : 12,
                  paddingHorizontal: 4,
                }}
              >
                <View
                  style={{
                    width: dense ? 32 : 38,
                    height: dense ? 32 : 38,
                    borderRadius: dense ? 10 : 12,
                    backgroundColor: selected ? colors.accentSoft : colors.panel,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 size={dense ? 15 : 17} color={selected ? colors.accent : colors.textMuted} strokeWidth={2.3} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={{ fontSize: dense ? 13.5 : 15, color: selected ? colors.accent : colors.text, flexShrink: 1 }}
                      numberOfLines={1}
                    >
                      {center.name}
                    </Text>
                    {index === 0 ? (
                      <View style={{ backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 0.3, color: colors.textInverse }}>
                          NEAREST
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {center.distance != null ? (
                    <Text style={{ fontSize: 11.5, color: colors.textFaint, marginTop: 1 }}>
                      {center.distance.toFixed(1)} mi away
                    </Text>
                  ) : null}
                </View>
                {busy ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : selected ? (
                  <Check size={dense ? 17 : 20} color={colors.accent} strokeWidth={3} />
                ) : null}
              </Pressable>
            )
          })}
        </ScrollView>
      ) : null}
    </View>
  )
}
