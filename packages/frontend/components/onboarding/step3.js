System.register(["react/jsx-runtime", "react-native", "react-native-safe-area-context", "../contexts", "react", "../../utils/distance", "../../utils/api", "lucide-react-native", "../ui"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, react_native_safe_area_context_1, contexts_1, react_1, distance_1, api_1, lucide_react_native_1, ui_1;
    var __moduleName = context_1 && context_1.id;
    function Step3() {
        const { goToNextStep, centerID, setCenterID, skipOnboarding, returnTo, isSubmitting } = contexts_1.useOnboarding();
        const [searchInput, setSearchInput] = react_1.useState('');
        const [focusedField, setFocusedField] = react_1.useState(false);
        const [loading, setLoading] = react_1.useState(false);
        const [selectedCenter, setSelectedCenter] = react_1.useState(null);
        const [nearbyCenters, setNearbyCenters] = react_1.useState([]);
        const [allCenters, setAllCenters] = react_1.useState([]);
        const [error, setError] = react_1.useState('');
        const [showSuggestions, setShowSuggestions] = react_1.useState(false);
        const debounceTimer = react_1.useRef(null);
        // Fetch real centers from API on mount
        react_1.useEffect(() => {
            let mounted = true;
            const loadCenters = async () => {
                try {
                    const centers = await api_1.fetchCenters();
                    if (mounted && centers.length > 0) {
                        setAllCenters(centers);
                    }
                }
                catch {
                    // Silently fail — geocode will still work with whatever centers we have
                }
            };
            loadCenters();
            return () => { mounted = false; };
        }, []);
        // Geocode and find nearby centers
        const geocodeLocation = async (input) => {
            if (!input.trim()) {
                setNearbyCenters([]);
                setShowSuggestions(false);
                return;
            }
            if (allCenters.length === 0) {
                setError('Loading centers... please try again in a moment.');
                return;
            }
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&limit=1&countrycodes=us`);
                if (!response.ok) {
                    throw new Error('Failed to find location');
                }
                const data = await response.json();
                if (data.length === 0) {
                    setError('Location not found');
                    setNearbyCenters([]);
                    setShowSuggestions(false);
                    setLoading(false);
                    return;
                }
                const userLat = parseFloat(data[0].lat);
                const userLon = parseFloat(data[0].lon);
                // Calculate distances for all centers and sort by distance
                const centersWithDistance = allCenters
                    .filter((c) => c.latitude != null && c.longitude != null)
                    .map((center) => ({
                    id: center.centerID,
                    name: center.name,
                    latitude: center.latitude,
                    longitude: center.longitude,
                    distance: distance_1.calculateDistance(userLat, userLon, center.latitude, center.longitude),
                }))
                    .sort((a, b) => a.distance - b.distance);
                setNearbyCenters(centersWithDistance);
                setShowSuggestions(true);
                setError('');
                // Auto-select nearest center
                if (centersWithDistance.length > 0) {
                    setSelectedCenter(centersWithDistance[0]);
                    setCenterID(centersWithDistance[0].id);
                }
            }
            catch (err) {
                setError('Unable to find location');
                setNearbyCenters([]);
                setShowSuggestions(false);
            }
            finally {
                setLoading(false);
            }
        };
        // Debounced search as user types
        react_1.useEffect(() => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
            if (searchInput.length >= 3) {
                debounceTimer.current = setTimeout(() => {
                    geocodeLocation(searchInput);
                }, 500);
            }
            else {
                setNearbyCenters([]);
                setShowSuggestions(false);
            }
            return () => {
                if (debounceTimer.current) {
                    clearTimeout(debounceTimer.current);
                }
            };
        }, [searchInput, allCenters]);
        const handleSelectCenter = (center) => {
            setSelectedCenter(center);
            setCenterID(center.id);
            setShowSuggestions(false);
        };
        const handleContinue = () => {
            if (!selectedCenter) {
                setError('Please search and select a center');
                return;
            }
            goToNextStep();
        };
        return (_jsx(react_native_safe_area_context_1.SafeAreaView, { className: "flex-1 bg-white dark:bg-neutral-900", children: _jsxs(react_native_1.View, { className: "max-w-[720px] w-full flex-1 self-center px-6", children: [_jsx(react_native_1.View, { className: "flex-1 justify-center", children: _jsxs(react_native_1.View, { className: "w-full", children: [_jsxs(react_native_1.View, { className: "mb-8", children: [_jsx(react_native_1.Text, { className: "text-4xl font-sans font-bold text-content dark:text-content-dark text-center mb-3", children: "Choose your center" }), _jsx(react_native_1.Text, { className: "text-lg font-sans text-stone-500 dark:text-stone-400 text-center", children: "Enter your city or town to see nearby centers." })] }), _jsxs(react_native_1.View, { className: "w-full max-w-md self-center relative", children: [_jsx(react_native_1.TextInput, { className: `w-full text-content dark:text-content-dark font-sans rounded-xl px-4 py-4 text-base bg-stone-100 dark:bg-stone-800 border-2 outline-none ${focusedField ? 'border-primary' : 'border-transparent'} placeholder:text-gray-400 dark:placeholder:text-gray-500`, placeholder: "City or town name", value: searchInput, onChangeText: setSearchInput, onFocus: () => {
                                                setFocusedField(true);
                                                if (nearbyCenters.length > 0) {
                                                    setShowSuggestions(true);
                                                }
                                            }, onBlur: () => {
                                                setFocusedField(false);
                                            }, placeholderTextColor: "#9ca3af", autoCapitalize: "words", returnKeyType: "search" }), loading && (_jsx(react_native_1.View, { className: "absolute right-4 top-0 bottom-0 justify-center", children: _jsx(react_native_1.ActivityIndicator, { size: "small", color: "#f97316" }) })), showSuggestions && nearbyCenters.length > 0 && (_jsx(react_native_1.View, { className: "absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-xl border-2 border-stone-300 dark:border-stone-600 overflow-hidden shadow-xl", style: { zIndex: 50 }, children: _jsx(react_native_1.ScrollView, { style: { maxHeight: 240 }, children: nearbyCenters.map((center, index) => (_jsx(react_native_1.Pressable, { onPress: () => handleSelectCenter(center), className: `px-5 py-4 ${index !== nearbyCenters.length - 1
                                                        ? 'border-b border-stone-200 dark:border-stone-700'
                                                        : ''} ${selectedCenter?.id === center.id ? 'bg-orange-50 dark:bg-orange-950' : ''}`, children: _jsxs(react_native_1.View, { className: "flex-row justify-between items-center gap-3", children: [_jsxs(react_native_1.View, { className: "flex-1", children: [_jsxs(react_native_1.View, { className: "flex-row items-center gap-2 mb-1", children: [_jsx(react_native_1.Text, { className: `text-base font-sans font-semibold ${selectedCenter?.id === center.id
                                                                                    ? 'text-primary'
                                                                                    : 'text-content dark:text-content-dark'}`, children: center.name }), index === 0 && (_jsx(react_native_1.View, { className: "bg-primary rounded-full px-2 py-1", children: _jsx(react_native_1.Text, { className: "text-white text-xs font-sans font-bold", children: "NEAREST" }) }))] }), _jsxs(react_native_1.Text, { className: "text-sm font-sans text-stone-500 dark:text-stone-400", children: [center.distance.toFixed(1), " miles away"] })] }), selectedCenter?.id === center.id && (_jsx(lucide_react_native_1.Check, { className: "text-primary", size: 20, strokeWidth: 3 }))] }) }, center.id))) }) }))] }), error && (_jsx(react_native_1.View, { className: "w-full max-w-md self-center mt-4 bg-red-50 dark:bg-red-900/20 rounded-xl p-4", children: _jsx(react_native_1.Text, { className: "text-red-600 dark:text-red-400 font-sans text-center", children: error }) }))] }) }), _jsxs(react_native_1.View, { className: "pb-6", children: [_jsx(ui_1.PrimaryButton, { onPress: handleContinue, disabled: !selectedCenter, style: { width: '100%', maxWidth: 448, alignSelf: 'center' }, children: "Continue" }), returnTo && (_jsx(react_native_1.Pressable, { onPress: skipOnboarding, disabled: isSubmitting, style: { alignSelf: 'center', marginTop: 12 }, children: _jsx(react_native_1.Text, { className: "text-sm font-sans text-stone-400 dark:text-stone-500", children: "Skip for now" }) }))] })] }) }));
    }
    exports_1("default", Step3);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (react_native_safe_area_context_1_1) {
                react_native_safe_area_context_1 = react_native_safe_area_context_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (distance_1_1) {
                distance_1 = distance_1_1;
            },
            function (api_1_1) {
                api_1 = api_1_1;
            },
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            }
        ],
        execute: function () {
        }
    };
});
