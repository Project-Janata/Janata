import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useOnboarding } from '../contexts'
import { useState, useEffect, useRef } from 'react'
import { calculateDistance } from '../../utils/distance'
import { fetchCenters, CenterData } from '../../utils/api'
import { Check } from 'lucide-react-native'
import { PrimaryButton } from '../ui'

interface CenterWithDistance {
  id: string
  name: string
  latitude: number
  longitude: number
  distance: number
}

export default function Step3() {
  const { goToNextStep, centerID, setCenterID, skipOnboarding, returnTo, isSubmitting } = useOnboarding()
  const [searchInput, setSearchInput] = useState('')
  const [focusedField, setFocusedField] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedCenter, setSelectedCenter] = useState<CenterWithDistance | null>(null)
  const [nearbyCenters, setNearbyCenters] = useState<CenterWithDistance[]>([])
  const [allCenters, setAllCenters] = useState<CenterData[]>([])
  const [error, setError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Fetch real centers from API on mount
  useEffect(() => {
    let mounted = true
    const loadCenters = async () => {
      try {
        const centers = await fetchCenters()
        if (mounted && centers.length > 0) {
          setAllCenters(centers)
        }
      } catch {
        // Silently fail — geocode will still work with whatever centers we have
      }
    }
    loadCenters()
    return () => { mounted = false }
  }, [])

  // Geocode and find nearby centers
  const geocodeLocation = async (input: string) => {
    if (!input.trim()) {
      setNearbyCenters([])
      setShowSuggestions(false)
      return
    }

    if (allCenters.length === 0) {
      setError('Loading centers... please try again in a moment.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          input
        )}&format=json&limit=1&countrycodes=us`
      )

      if (!response.ok) {
        throw new Error('Failed to find location')
      }

      const data = await response.json()

      if (data.length === 0) {
        setError('Location not found')
        setNearbyCenters([])
        setShowSuggestions(false)
        setLoading(false)
        return
      }

      const userLat = parseFloat(data[0].lat)
      const userLon = parseFloat(data[0].lon)

      // Calculate distances for all centers and sort by distance
      const centersWithDistance: CenterWithDistance[] = allCenters
        .filter((c) => c.latitude != null && c.longitude != null)
        .map((center) => ({
          id: center.centerID,
          name: center.name,
          latitude: center.latitude,
          longitude: center.longitude,
          distance: calculateDistance(userLat, userLon, center.latitude, center.longitude),
        }))
        .sort((a, b) => a.distance - b.distance)

      setNearbyCenters(centersWithDistance)
      setShowSuggestions(true)
      setError('')

      // Auto-select nearest center
      if (centersWithDistance.length > 0) {
        setSelectedCenter(centersWithDistance[0])
        setCenterID(centersWithDistance[0].id)
      }
    } catch (err) {
      setError('Unable to find location')
      setNearbyCenters([])
      setShowSuggestions(false)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search as user types
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (searchInput.length >= 3) {
      debounceTimer.current = setTimeout(() => {
        geocodeLocation(searchInput)
      }, 500)
    } else {
      setNearbyCenters([])
      setShowSuggestions(false)
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchInput, allCenters])

  const handleSelectCenter = (center: CenterWithDistance) => {
    setSelectedCenter(center)
    setCenterID(center.id)
    setShowSuggestions(false)
  }

  const handleContinue = () => {
    if (!selectedCenter) {
      setError('Please search and select a center')
      return
    }
    goToNextStep()
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <View className="max-w-[720px] w-full flex-1 self-center px-6">
        <View className="flex-1 justify-center">
          <View className="w-full">
            {/* Header */}
            <View className="mb-8">
              <Text className="text-4xl font-sans font-bold text-content dark:text-content-dark text-center mb-3">
                Choose your center
              </Text>
              <Text className="text-lg font-sans text-stone-500 dark:text-stone-400 text-center">
                Enter your city or town to see nearby centers.
              </Text>
            </View>

            {/* Search Input */}
            <View className="w-full max-w-md self-center relative">
              <TextInput
                className={`w-full text-content dark:text-content-dark font-sans rounded-xl px-4 py-4 text-base bg-stone-100 dark:bg-stone-800 border-2 outline-none ${
                  focusedField ? 'border-primary' : 'border-transparent'
                } placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                placeholder="City or town name"
                value={searchInput}
                onChangeText={setSearchInput}
                onFocus={() => {
                  setFocusedField(true)
                  if (nearbyCenters.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
                onBlur={() => {
                  setFocusedField(false)
                }}
                placeholderTextColor="#9ca3af"
                autoCapitalize="words"
                returnKeyType="search"
              />
              {loading && (
                <View className="absolute right-4 top-0 bottom-0 justify-center">
                  <ActivityIndicator size="small" color="#f97316" />
                </View>
              )}

              {/* Suggestions Dropdown */}
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
                          index !== nearbyCenters.length - 1
                            ? 'border-b border-stone-200 dark:border-stone-700'
                            : ''
                        } ${
                          selectedCenter?.id === center.id ? 'bg-orange-50 dark:bg-orange-950' : ''
                        }`}
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
                                  <Text className="text-white text-xs font-sans font-bold">
                                    NEAREST
                                  </Text>
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

            {/* Error Message */}
            {error && (
              <View className="w-full max-w-md self-center mt-4 bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                <Text className="text-red-600 dark:text-red-400 font-sans text-center">
                  {error}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Button */}
        <View className="pb-6">
          <PrimaryButton
            onPress={handleContinue}
            disabled={!selectedCenter}
            style={{ width: '100%', maxWidth: 448, alignSelf: 'center' }}
          >
            Continue
          </PrimaryButton>
          {returnTo && (
            <Pressable onPress={skipOnboarding} disabled={isSubmitting} style={{ alignSelf: 'center', marginTop: 12 }}>
              <Text className="text-sm font-sans text-stone-400 dark:text-stone-500">
                Skip for now
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}
