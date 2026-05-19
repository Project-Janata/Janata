import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native'
import { useOnboarding } from '../contexts'
import { useState, useEffect, useRef } from 'react'
import { calculateDistance } from '../../utils/distance'
import { fetchCenters, CenterData } from '../../utils/api'
import { Check } from 'lucide-react-native'
import { StepLayout, StepHeading, OnboardingInput, StepError, StepFooter } from './shared'

interface CenterWithDistance {
  id: string
  name: string
  latitude: number
  longitude: number
  distance: number
}

export default function Step3() {
  const { goToNextStep, setCenterID } = useOnboarding()
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedCenter, setSelectedCenter] = useState<CenterWithDistance | null>(null)
  const [nearbyCenters, setNearbyCenters] = useState<CenterWithDistance[]>([])
  const [allCenters, setAllCenters] = useState<CenterData[]>([])
  const [error, setError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let mounted = true
    fetchCenters()
      .then((centers) => { if (mounted && centers.length > 0) setAllCenters(centers) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  const geocodeLocation = async (input: string) => {
    if (!input.trim()) { setNearbyCenters([]); setShowSuggestions(false); return }
    if (allCenters.length === 0) { setError('Loading centers… please try again in a moment.'); return }

    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&limit=1&countrycodes=us`
      )
      if (!response.ok) throw new Error()
      const data = await response.json()
      if (data.length === 0) {
        setError('Location not found')
        setNearbyCenters([])
        setShowSuggestions(false)
        return
      }
      const userLat = parseFloat(data[0].lat)
      const userLon = parseFloat(data[0].lon)
      const sorted: CenterWithDistance[] = allCenters
        .filter((c) => c.latitude != null && c.longitude != null)
        .map((c) => ({
          id: c.centerID,
          name: c.name,
          latitude: c.latitude,
          longitude: c.longitude,
          distance: calculateDistance(userLat, userLon, c.latitude, c.longitude),
        }))
        .sort((a, b) => a.distance - b.distance)
      setNearbyCenters(sorted)
      setShowSuggestions(true)
      setError('')
      if (sorted.length > 0) { setSelectedCenter(sorted[0]); setCenterID(sorted[0].id) }
    } catch {
      setError('Unable to find location')
      setNearbyCenters([])
      setShowSuggestions(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (searchInput.length >= 3) {
      debounceTimer.current = setTimeout(() => geocodeLocation(searchInput), 500)
    } else {
      setNearbyCenters([])
      setShowSuggestions(false)
    }
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current) }
  }, [searchInput, allCenters])

  const handleSelectCenter = (center: CenterWithDistance) => {
    setSelectedCenter(center)
    setCenterID(center.id)
    setShowSuggestions(false)
  }

  const handleContinue = () => {
    if (!selectedCenter) { setError('Please search and select a center'); return }
    goToNextStep()
  }

  return (
    <StepLayout footer={
      <StepFooter onContinue={handleContinue} disabled={!selectedCenter} />
    }>
      <View className="w-full">
        <StepHeading
          title="Choose your center"
          subtitle="Enter your city or town to see nearby centers."
        />

        <View className="w-full max-w-md self-center relative">
          <OnboardingInput
            placeholder="City or town name"
            value={searchInput}
            onChangeText={setSearchInput}
            autoCapitalize="words"
            returnKeyType="search"
          />
          {loading && (
            <View className="absolute right-4 top-0 bottom-0 justify-center">
              <ActivityIndicator size="small" color="#f97316" />
            </View>
          )}

          {showSuggestions && nearbyCenters.length > 0 && (
            <View
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-xl border-2 border-stone-300 dark:border-stone-600 overflow-hidden shadow-xl"
              style={{ zIndex: 50 }}
            >
              <ScrollView style={{ maxHeight: 240 }}>
                {nearbyCenters.map((center, index) => (
                  <Pressable
                    key={center.id}
                    onPress={() => handleSelectCenter(center)}
                    className={`px-5 py-4 ${
                      index !== nearbyCenters.length - 1 ? 'border-b border-stone-200 dark:border-stone-700' : ''
                    } ${selectedCenter?.id === center.id ? 'bg-orange-50 dark:bg-orange-950' : ''}`}
                  >
                    <View className="flex-row justify-between items-center gap-3">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                          <Text
                            className={`text-base font-sans font-semibold ${
                              selectedCenter?.id === center.id
                                ? 'text-primary'
                                : 'text-content dark:text-content-dark'
                            }`}
                          >
                            {center.name}
                          </Text>
                          {index === 0 && (
                            <View className="bg-primary rounded-full px-2 py-1">
                              <Text className="text-white text-xs font-sans font-bold">NEAREST</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-sm font-sans text-stone-500 dark:text-stone-400">
                          {center.distance.toFixed(1)} miles away
                        </Text>
                      </View>
                      {selectedCenter?.id === center.id && (
                        <Check className="text-primary" size={20} strokeWidth={3} />
                      )}
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <StepError message={error} />
      </View>
    </StepLayout>
  )
}
