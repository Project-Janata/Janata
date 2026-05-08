import React, { useState, Suspense, useRef, useCallback, useMemo } from 'react'
import { EmptyState } from '../../components/ui/EmptyState'
import { DiscoverListSkeleton } from '../../components/ui/Skeleton'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Animated,
  PanResponder,
  StyleSheet,
  Image,
} from 'react-native'
import {
  MapPin,
  Search,
  Building2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react-native'
import { useRouter, useFocusEffect, useNavigation } from 'expo-router'
import { usePostHog } from 'posthog-react-native'
import { useTheme } from '../../components/contexts'
import { Badge, UnderlineTabBar, Avatar, FilterChip } from '../../components/ui'
import FilterPickerModal, { type FilterPickerOption } from '../../components/ui/FilterPickerModal'
import { useUser } from '../../components/contexts/UserContext'
import { useDiscoverData, type DiscoverFilter } from '../../hooks/useApiData'
import type { EventDisplay, DiscoverCenter, AttendeeInfo } from '../../utils/api'
import { extractCityState } from '../../utils/addressParsing'


// Lazy load Map to avoid loading heavy web dependencies on mobile web
const Map = React.lazy(() => import('../../components/Map'))

const FILTERS: { label: DiscoverFilter }[] = [
  { label: 'Events' },
  { label: 'Centers' },
  { label: 'Seva' },
]
