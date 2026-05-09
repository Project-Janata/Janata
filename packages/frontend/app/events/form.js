System.register(["react/jsx-runtime", "react", "react-native", "react-native-safe-area-context", "expo-router", "lucide-react-native", "@react-native-community/datetimepicker", "posthog-react-native", "../../components/ui", "../../hooks/useDetailColors", "../../utils/api"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, react_native_safe_area_context_1, expo_router_1, lucide_react_native_1, datetimepicker_1, posthog_react_native_1, ui_1, useDetailColors_1, api_1, todayLocalISODate, formatDateLabel, formatTimeLabel, CATEGORY_OPTIONS;
    var __moduleName = context_1 && context_1.id;
    // ── Header ──────────────────────────────────────────────────────────────
    function HeaderBar({ title, onBack, colors, }) {
        return (_jsxs(react_native_1.View, { style: {
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                gap: 10,
            }, children: [_jsx(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, children: _jsxs(react_native_1.Pressable, { onPress: onBack, style: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8, minHeight: 44, minWidth: 44 }, children: [_jsx(lucide_react_native_1.ChevronLeft, { size: 20, color: colors.iconHeader }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.iconHeader }, children: "Back" })] }) }), _jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: 20,
                        color: colors.text,
                        lineHeight: 26,
                    }, children: title })] }));
    }
    // ── Field row ───────────────────────────────────────────────────────────
    function FieldRow({ label, colors, error, required, hint, children, }) {
        return (_jsxs(react_native_1.View, { style: { gap: 6 }, children: [_jsxs(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: 11,
                        color: colors.textMuted,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                    }, children: [label, required ? _jsx(react_native_1.Text, { style: { color: '#E8862A' }, children: " *" }) : null] }), hint && !error ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textMuted }, children: hint })) : null, children, error ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: '#DC2626' }, children: error })) : null] }));
    }
    // ── Main component ──────────────────────────────────────────────────────
    function EventFormPage() {
        const params = expo_router_1.useLocalSearchParams();
        const eventId = params.id;
        const isEdit = !!eventId;
        const router = expo_router_1.useRouter();
        const colors = useDetailColors_1.useDetailColors();
        const posthog = posthog_react_native_1.usePostHog();
        const today = todayLocalISODate();
        const [loading, setLoading] = react_1.useState(isEdit);
        const [saving, setSaving] = react_1.useState(false);
        const [centers, setCenters] = react_1.useState([]);
        const [showCenterPicker, setShowCenterPicker] = react_1.useState(false);
        const [errors, setErrors] = react_1.useState({});
        // Form state
        const [title, setTitle] = react_1.useState('');
        const [description, setDescription] = react_1.useState('');
        const [date, setDate] = react_1.useState('');
        const [time, setTime] = react_1.useState('');
        const [address, setAddress] = react_1.useState('');
        const [latitude, setLatitude] = react_1.useState('');
        const [longitude, setLongitude] = react_1.useState('');
        const [centerID, setCenterID] = react_1.useState('');
        const [centerName, setCenterName] = react_1.useState('');
        const [pointOfContact, setPointOfContact] = react_1.useState('');
        const [image, setImage] = react_1.useState('');
        const [category, setCategory] = react_1.useState(undefined);
        const [externalUrl, setExternalUrl] = react_1.useState('');
        const [signupUrl, setSignupUrl] = react_1.useState('');
        const [allowJanataSignup, setAllowJanataSignup] = react_1.useState(true);
        const [showAdvanced, setShowAdvanced] = react_1.useState(false);
        const [showDatePicker, setShowDatePicker] = react_1.useState(false);
        const [showTimePicker, setShowTimePicker] = react_1.useState(false);
        // Load centers + event data (if editing)
        react_1.useEffect(() => {
            let mounted = true;
            const load = async () => {
                try {
                    const allCenters = await api_1.fetchCenters();
                    if (!mounted)
                        return;
                    setCenters(allCenters);
                    if (isEdit && eventId) {
                        const event = await api_1.fetchEvent(eventId);
                        if (!mounted)
                            return;
                        if (event) {
                            setTitle(event.title || '');
                            setDescription(event.description || '');
                            if (event.date) {
                                const d = new Date(event.date);
                                const yyyy = d.getFullYear();
                                const mm = String(d.getMonth() + 1).padStart(2, '0');
                                const dd = String(d.getDate()).padStart(2, '0');
                                const hh = String(d.getHours()).padStart(2, '0');
                                const mi = String(d.getMinutes()).padStart(2, '0');
                                setDate(`${yyyy}-${mm}-${dd}`);
                                setTime(`${hh}:${mi}`);
                            }
                            setAddress(event.address || '');
                            setLatitude(event.latitude != null ? String(event.latitude) : '');
                            setLongitude(event.longitude != null ? String(event.longitude) : '');
                            setCenterID(event.centerID || '');
                            setPointOfContact(event.pointOfContact || '');
                            setImage(event.image || '');
                            setCategory(event.category ?? undefined);
                            setExternalUrl(event.externalUrl || '');
                            setSignupUrl(event.signupUrl || '');
                            setAllowJanataSignup(event.allowJanataSignup ?? true);
                            const matchingCenter = allCenters.find((c) => c.centerID === event.centerID);
                            if (matchingCenter)
                                setCenterName(matchingCenter.name);
                        }
                    }
                }
                catch (err) {
                    if (__DEV__)
                        console.warn('[EventForm]', err);
                }
                finally {
                    if (mounted)
                        setLoading(false);
                }
            };
            load();
            return () => { mounted = false; };
        }, [eventId, isEdit]);
        const validate = () => {
            const newErrors = {};
            if (!title.trim())
                newErrors.title = 'Title is required';
            if (!date.trim())
                newErrors.date = 'Date is required';
            if (!centerID)
                newErrors.center = 'Center is required';
            if (date && !newErrors.date) {
                const eventDateTime = new Date(`${date}T${time || '23:59'}:00`);
                if (!isNaN(eventDateTime.getTime()) && eventDateTime <= new Date()) {
                    if (date < today) {
                        newErrors.date = 'Date must be today or later';
                    }
                    else {
                        newErrors.time = 'Time must be in the future';
                    }
                }
            }
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            if (!latitude || isNaN(lat) || lat < -90 || lat > 90) {
                newErrors.latitude = 'Valid latitude required (-90 to 90)';
            }
            if (!longitude || isNaN(lng) || lng < -180 || lng > 180) {
                newErrors.longitude = 'Valid longitude required (-180 to 180)';
            }
            setErrors(newErrors);
            if (newErrors.latitude || newErrors.longitude)
                setShowAdvanced(true);
            return Object.keys(newErrors).length === 0;
        };
        const buildDateISO = () => {
            if (!time.trim())
                return `${date}T12:00:00`;
            return `${date}T${time}:00`;
        };
        const handleSave = async () => {
            if (!validate())
                return;
            setSaving(true);
            try {
                const sharedFields = {
                    title: title.trim(),
                    description: description.trim(),
                    date: buildDateISO(),
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    address: address.trim() || undefined,
                    centerID,
                    pointOfContact: pointOfContact.trim() || undefined,
                    image: image.trim() || undefined,
                    category,
                    externalUrl: externalUrl.trim() || null,
                    signupUrl: signupUrl.trim() || null,
                    // Toggle is only meaningful when there's an external signup URL.
                    // Without one, native signups are always on.
                    allowJanataSignup: signupUrl.trim() ? allowJanataSignup : true,
                };
                let savedId = eventId;
                if (isEdit && eventId) {
                    await api_1.updateEvent({ id: eventId, ...sharedFields });
                    posthog?.capture('event_updated', { eventId, title: title.trim() });
                }
                else {
                    const created = await api_1.createEvent(sharedFields);
                    savedId = created.id;
                    posthog?.capture('event_created', { title: title.trim(), centerID });
                }
                if (savedId)
                    router.replace(`/events/${savedId}`);
            }
            catch (err) {
                const msg = err?.message || 'Something went wrong. Please try again.';
                posthog?.capture('event_create_failed', { error: msg, isEdit });
                setErrors({ submit: msg });
            }
            finally {
                setSaving(false);
            }
        };
        const selectCenter = (center) => {
            setCenterID(center.centerID);
            setCenterName(center.name);
            if (!latitude && center.latitude)
                setLatitude(String(center.latitude));
            if (!longitude && center.longitude)
                setLongitude(String(center.longitude));
            if (!address && center.address)
                setAddress(center.address);
            setShowCenterPicker(false);
        };
        // ── Input styling helper ────────────────────────────────────────────
        const inputStyle = (hasError) => ({
            fontFamily: 'Inclusive Sans',
            fontSize: 15,
            color: colors.text,
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: hasError ? '#DC2626' : colors.border,
            backgroundColor: colors.cardBg,
        });
        const pickerFieldStyle = (hasError) => ({
            ...inputStyle(hasError),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        });
        // ── Loading ─────────────────────────────────────────────────────────
        if (loading) {
            return (_jsx(react_native_safe_area_context_1.SafeAreaView, { style: { flex: 1, backgroundColor: colors.panelBg }, children: _jsx(react_native_1.View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center' }, children: _jsx(react_native_1.ActivityIndicator, { size: "large", color: "#E8862A" }) }) }));
        }
        // ── Render ──────────────────────────────────────────────────────────
        return (_jsxs(react_native_safe_area_context_1.SafeAreaView, { style: { flex: 1, backgroundColor: colors.panelBg }, children: [_jsx(HeaderBar, { title: isEdit ? 'Edit Event' : 'Create Event', onBack: () => router.back(), colors: colors }), _jsxs(react_native_1.ScrollView, { style: { flex: 1 }, contentContainerStyle: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120, gap: 20 }, showsVerticalScrollIndicator: false, keyboardShouldPersistTaps: "handled", children: [errors.submit ? (_jsx(react_native_1.View, { style: {
                                padding: 12,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: '#DC2626',
                                backgroundColor: 'rgba(220,38,38,0.08)',
                            }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: '#DC2626' }, children: errors.submit }) })) : null, _jsx(FieldRow, { label: "Title", colors: colors, error: errors.title, required: true, children: _jsx(react_native_1.TextInput, { value: title, onChangeText: setTitle, placeholder: "Sunday Satsang with Swamiji", placeholderTextColor: colors.textMuted, style: inputStyle(!!errors.title) }) }), _jsx(FieldRow, { label: "Description", colors: colors, hint: "What attendees will experience.", children: _jsx(react_native_1.TextInput, { value: description, onChangeText: setDescription, placeholder: "Describe the event...", placeholderTextColor: colors.textMuted, multiline: true, textAlignVertical: "top", style: {
                                    ...inputStyle(),
                                    minHeight: 100,
                                } }) }), _jsxs(FieldRow, { label: "Date", colors: colors, error: errors.date, required: true, children: [_jsxs(react_native_1.Pressable, { onPress: () => setShowDatePicker(true), style: pickerFieldStyle(!!errors.date), accessibilityLabel: "Pick a date", children: [_jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 15,
                                                color: date ? colors.text : colors.textMuted,
                                            }, children: date ? formatDateLabel(date) : 'Select a date' }), _jsx(lucide_react_native_1.ChevronDown, { size: 16, color: colors.textMuted })] }), showDatePicker && (_jsx(datetimepicker_1.default, { value: date ? new Date(`${date}T12:00:00`) : new Date(), mode: "date", display: react_native_1.Platform.OS === 'ios' ? 'inline' : 'default', minimumDate: new Date(), themeVariant: colors.text === '#FAFAFA' ? 'dark' : 'light', onChange: (event, picked) => {
                                        if (react_native_1.Platform.OS === 'android')
                                            setShowDatePicker(false);
                                        if (event.type === 'dismissed')
                                            return;
                                        if (picked) {
                                            const yyyy = picked.getFullYear();
                                            const mm = String(picked.getMonth() + 1).padStart(2, '0');
                                            const dd = String(picked.getDate()).padStart(2, '0');
                                            setDate(`${yyyy}-${mm}-${dd}`);
                                        }
                                    } })), react_native_1.Platform.OS === 'ios' && showDatePicker && (_jsx(react_native_1.Pressable, { onPress: () => setShowDatePicker(false), style: { alignSelf: 'flex-end', paddingHorizontal: 8, paddingVertical: 6 }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: '#E8862A' }, children: "Done" }) }))] }), _jsxs(FieldRow, { label: "Time", colors: colors, error: errors.time, children: [_jsxs(react_native_1.Pressable, { onPress: () => setShowTimePicker(true), style: pickerFieldStyle(!!errors.time), accessibilityLabel: "Pick a time", children: [_jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 15,
                                                color: time ? colors.text : colors.textMuted,
                                            }, children: time ? formatTimeLabel(time) : 'Select a time' }), _jsx(lucide_react_native_1.ChevronDown, { size: 16, color: colors.textMuted })] }), showTimePicker && (_jsx(datetimepicker_1.default, { value: time ? new Date(`2000-01-01T${time}:00`) : new Date(), mode: "time", display: react_native_1.Platform.OS === 'ios' ? 'spinner' : 'default', themeVariant: colors.text === '#FAFAFA' ? 'dark' : 'light', onChange: (event, picked) => {
                                        if (react_native_1.Platform.OS === 'android')
                                            setShowTimePicker(false);
                                        if (event.type === 'dismissed')
                                            return;
                                        if (picked) {
                                            const hh = String(picked.getHours()).padStart(2, '0');
                                            const mi = String(picked.getMinutes()).padStart(2, '0');
                                            setTime(`${hh}:${mi}`);
                                        }
                                    } })), react_native_1.Platform.OS === 'ios' && showTimePicker && (_jsx(react_native_1.Pressable, { onPress: () => setShowTimePicker(false), style: { alignSelf: 'flex-end', paddingHorizontal: 8, paddingVertical: 6 }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: '#E8862A' }, children: "Done" }) }))] }), _jsxs(FieldRow, { label: "Center", colors: colors, error: errors.center, required: true, hint: "Picking a center auto-fills address & coordinates.", children: [_jsxs(react_native_1.Pressable, { onPress: () => setShowCenterPicker(!showCenterPicker), style: pickerFieldStyle(!!errors.center), children: [_jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 15,
                                                color: centerName ? colors.text : colors.textMuted,
                                            }, children: centerName || 'Select a center...' }), _jsx(lucide_react_native_1.ChevronDown, { size: 16, color: colors.textMuted, style: { transform: [{ rotate: showCenterPicker ? '180deg' : '0deg' }] } })] }), showCenterPicker && (_jsx(react_native_1.View, { style: {
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        backgroundColor: colors.cardBg,
                                        maxHeight: 200,
                                        overflow: 'hidden',
                                    }, children: _jsxs(react_native_1.ScrollView, { nestedScrollEnabled: true, showsVerticalScrollIndicator: true, children: [centers.map((center) => (_jsxs(react_native_1.Pressable, { onPress: () => selectCenter(center), style: {
                                                    paddingHorizontal: 14,
                                                    paddingVertical: 12,
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: colors.border,
                                                    backgroundColor: center.centerID === centerID ? 'rgba(232,134,42,0.1)' : 'transparent',
                                                }, children: [_jsx(react_native_1.Text, { style: {
                                                            fontFamily: center.centerID === centerID ? 'Inclusive Sans' : 'Inclusive Sans',
                                                            fontSize: 14,
                                                            color: center.centerID === centerID ? '#E8862A' : colors.text,
                                                        }, children: center.name }), center.address ? (_jsx(react_native_1.Text, { style: {
                                                            fontFamily: 'Inclusive Sans',
                                                            fontSize: 12,
                                                            color: colors.textSecondary,
                                                            marginTop: 2,
                                                        }, children: center.address })) : null] }, center.centerID))), centers.length === 0 && (_jsx(react_native_1.View, { style: { paddingHorizontal: 14, paddingVertical: 16, alignItems: 'center' }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }, children: "No centers available" }) }))] }) }))] }), _jsx(FieldRow, { label: "Address", colors: colors, hint: "Auto-filled from center if blank.", children: _jsx(react_native_1.TextInput, { value: address, onChangeText: setAddress, placeholder: "123 Main St, City, ST 12345", placeholderTextColor: colors.textMuted, style: inputStyle() }) }), _jsx(FieldRow, { label: "Point of Contact", colors: colors, hint: "Optional. Email or name.", children: _jsx(react_native_1.TextInput, { value: pointOfContact, onChangeText: setPointOfContact, placeholder: "contact@example.org", placeholderTextColor: colors.textMuted, style: inputStyle() }) }), _jsx(FieldRow, { label: "Image URL", colors: colors, hint: "Optional. Direct link to a JPG/PNG.", children: _jsx(react_native_1.TextInput, { value: image, onChangeText: setImage, placeholder: "https://...", placeholderTextColor: colors.textMuted, autoCapitalize: "none", keyboardType: "url", style: inputStyle() }) }), _jsx(FieldRow, { label: "External info link", colors: colors, hint: "Optional. Page about the event on another site (e.g., chinmayamission.com).", children: _jsx(react_native_1.TextInput, { value: externalUrl, onChangeText: setExternalUrl, placeholder: "https://...", placeholderTextColor: colors.textMuted, autoCapitalize: "none", keyboardType: "url", style: inputStyle() }) }), _jsxs(FieldRow, { label: "External signup URL", colors: colors, hint: "Optional. If attendees register on another site (Eventbrite, Google Form, etc.).", children: [_jsx(react_native_1.TextInput, { value: signupUrl, onChangeText: setSignupUrl, placeholder: "https://...", placeholderTextColor: colors.textMuted, autoCapitalize: "none", keyboardType: "url", style: inputStyle() }), signupUrl.trim() ? (_jsxs(react_native_1.View, { style: {
                                        marginTop: 10,
                                        padding: 14,
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        borderColor: colors.border,
                                        backgroundColor: colors.cardBg,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 12,
                                    }, children: [_jsxs(react_native_1.View, { style: { flex: 1 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }, children: "Also accept Janata RSVPs" }), _jsx(react_native_1.Text, { style: {
                                                        fontFamily: 'Inclusive Sans',
                                                        fontSize: 12,
                                                        color: colors.textMuted,
                                                        marginTop: 2,
                                                    }, children: "When off, the only signup option is the link above." })] }), _jsx(react_native_1.Switch, { value: allowJanataSignup, onValueChange: setAllowJanataSignup, trackColor: { true: '#E8862A', false: colors.border }, thumbColor: "#FFFFFF", ios_backgroundColor: colors.border })] })) : null] }), _jsxs(react_native_1.View, { style: { gap: 10 }, children: [_jsxs(react_native_1.Pressable, { onPress: () => setShowAdvanced((v) => !v), style: { flexDirection: 'row', alignItems: 'center', gap: 6 }, accessibilityLabel: "Toggle advanced location options", children: [_jsx(lucide_react_native_1.ChevronDown, { size: 12, color: colors.textMuted, style: { transform: [{ rotate: showAdvanced ? '0deg' : '-90deg' }] } }), _jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 11,
                                                color: colors.textMuted,
                                                letterSpacing: 0.4,
                                                textTransform: 'uppercase',
                                            }, children: "Advanced location" }), (errors.latitude || errors.longitude) ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: '#DC2626' }, children: "\u00B7 check coordinates" })) : null] }), showAdvanced && (_jsx(FieldRow, { label: "Coordinates", colors: colors, error: errors.latitude || errors.longitude, hint: "Override only if the center's pin is wrong.", children: _jsxs(react_native_1.View, { style: { flexDirection: 'row', gap: 10 }, children: [_jsx(react_native_1.TextInput, { value: latitude, onChangeText: setLatitude, placeholder: "Latitude", placeholderTextColor: colors.textMuted, keyboardType: "numeric", style: { ...inputStyle(!!errors.latitude), flex: 1 } }), _jsx(react_native_1.TextInput, { value: longitude, onChangeText: setLongitude, placeholder: "Longitude", placeholderTextColor: colors.textMuted, keyboardType: "numeric", style: { ...inputStyle(!!errors.longitude), flex: 1 } })] }) }))] }), _jsx(FieldRow, { label: "Category", colors: colors, children: _jsx(react_native_1.View, { style: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, children: CATEGORY_OPTIONS.map((opt) => {
                                    const selected = category === opt.value;
                                    return (_jsx(react_native_1.Pressable, { onPress: () => setCategory(opt.value), style: {
                                            paddingHorizontal: 16,
                                            paddingVertical: 10,
                                            borderRadius: 100,
                                            minHeight: 40,
                                            justifyContent: 'center',
                                            backgroundColor: selected ? '#E8862A' : colors.iconBoxBg,
                                        }, children: _jsx(react_native_1.Text, { style: {
                                                fontFamily: selected ? 'Inclusive Sans' : 'Inclusive Sans',
                                                fontSize: 13,
                                                color: selected ? '#FFFFFF' : colors.textSecondary,
                                            }, children: opt.label }) }, opt.label));
                                }) }) })] }), _jsx(react_native_1.View, { style: {
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                        paddingHorizontal: 16,
                        paddingTop: 12,
                        paddingBottom: 28,
                        backgroundColor: colors.panelBg,
                    }, children: _jsx(ui_1.PrimaryButton, { onPress: handleSave, disabled: saving, loading: saving, children: isEdit ? 'Save Changes' : 'Create Event' }) })] }));
    }
    exports_1("default", EventFormPage);
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_1_1) {
                react_1 = react_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
            },
            function (react_native_safe_area_context_1_1) {
                react_native_safe_area_context_1 = react_native_safe_area_context_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            },
            function (datetimepicker_1_1) {
                datetimepicker_1 = datetimepicker_1_1;
            },
            function (posthog_react_native_1_1) {
                posthog_react_native_1 = posthog_react_native_1_1;
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            },
            function (useDetailColors_1_1) {
                useDetailColors_1 = useDetailColors_1_1;
            },
            function (api_1_1) {
                api_1 = api_1_1;
            }
        ],
        execute: function () {
            todayLocalISODate = () => {
                const d = new Date();
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            formatDateLabel = (iso) => {
                if (!iso)
                    return '';
                const [y, m, d] = iso.split('-').map(Number);
                if (!y || !m || !d)
                    return iso;
                return new Date(y, m - 1, d).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                });
            };
            formatTimeLabel = (hhmm) => {
                if (!hhmm)
                    return '';
                const [h, m] = hhmm.split(':').map(Number);
                if (isNaN(h) || isNaN(m))
                    return hhmm;
                const period = h >= 12 ? 'PM' : 'AM';
                const hour12 = h % 12 === 0 ? 12 : h % 12;
                return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
            };
            CATEGORY_OPTIONS = [
                { value: undefined, label: 'None' },
                { value: 91, label: 'Satsang' },
                { value: 92, label: 'Bhiksha' },
            ];
        }
    };
});
