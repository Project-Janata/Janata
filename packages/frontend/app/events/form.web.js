System.register(["react/jsx-runtime", "react", "react-native", "expo-router", "lucide-react-native", "../../components/contexts", "../../hooks/useDetailColors", "../../components/ui", "../../utils/api"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, expo_router_1, lucide_react_native_1, contexts_1, useDetailColors_1, ui_1, api_1, todayLocalISODate, CATEGORY_OPTIONS;
    var __moduleName = context_1 && context_1.id;
    // ── Field row ────────────────────────────────────────────────────────────
    function FieldRow({ label, colors, error, required, hint, children, }) {
        return (_jsxs(react_native_1.View, { style: { gap: 6 }, children: [_jsxs(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: 11,
                        color: colors.textMuted,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                    }, children: [label, required ? _jsx(react_native_1.Text, { style: { color: '#E8862A' }, children: " *" }) : null] }), hint && !error ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textMuted }, children: hint })) : null, children, error ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: '#DC2626' }, children: error })) : null] }));
    }
    function NativeDateTimeInput({ type, value, onChange, min, hasError, colors, isDark, }) {
        return (_jsx("input", { type: type, value: value, onChange: (e) => onChange(e.target.value), min: min, style: {
                fontFamily: 'Inclusive Sans, -apple-system, sans-serif',
                fontSize: 15,
                color: colors.text,
                padding: '12px 14px',
                borderRadius: 10,
                border: `1px solid ${hasError ? '#DC2626' : colors.border}`,
                backgroundColor: colors.cardBg,
                outline: 'none',
                boxSizing: 'border-box',
                width: '100%',
                colorScheme: isDark ? 'dark' : 'light',
            } }));
    }
    // ── Main component ──────────────────────────────────────────────────────
    function EventFormPage() {
        const params = expo_router_1.useLocalSearchParams();
        const eventId = params.id;
        const isEdit = !!eventId;
        const router = expo_router_1.useRouter();
        const colors = useDetailColors_1.useDetailColors();
        const { isDark } = contexts_1.useTheme();
        const today = todayLocalISODate();
        const { width: viewportWidth } = react_native_1.useWindowDimensions();
        const isNarrow = viewportWidth < 768;
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
        const validate = react_1.useCallback(() => {
            const newErrors = {};
            if (!title.trim())
                newErrors.title = 'Title is required';
            if (!date.trim())
                newErrors.date = 'Date is required';
            if (!centerID)
                newErrors.center = 'Center is required';
            if (date && !newErrors.date) {
                // If time is missing, treat as end-of-day so today still passes the future-check
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
        }, [title, date, time, centerID, latitude, longitude, today]);
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
                if (isEdit && eventId) {
                    await api_1.updateEvent({ id: eventId, ...sharedFields });
                    router.replace(`/events/${eventId}`);
                }
                else {
                    const created = await api_1.createEvent(sharedFields);
                    router.replace(`/events/${created.id}`);
                }
            }
            catch (err) {
                setErrors({ submit: err?.message || 'Something went wrong. Please try again.' });
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
        // ── Loading ─────────────────────────────────────────────────────────
        if (loading) {
            return (_jsx(react_native_1.View, { style: { flex: 1, backgroundColor: colors.panelBg, justifyContent: 'center', alignItems: 'center' }, children: _jsx(react_native_1.ActivityIndicator, { size: "large", color: "#E8862A" }) }));
        }
        // ── Render ──────────────────────────────────────────────────────────
        return (_jsxs(react_native_1.View, { style: { flex: 1, backgroundColor: colors.panelBg }, children: [_jsx(react_native_1.View, { style: {
                        paddingHorizontal: isNarrow ? 16 : 40,
                        paddingTop: 20,
                        paddingBottom: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        maxWidth: 900,
                        width: '100%',
                        alignSelf: 'center',
                    }, children: _jsxs(react_native_1.View, { style: { gap: 4 }, children: [_jsxs(react_native_1.Pressable, { onPress: () => router.back(), style: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }, children: [_jsx(lucide_react_native_1.ChevronLeft, { size: 18, color: colors.iconHeader }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.iconHeader }, children: "Back" })] }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: isNarrow ? 22 : 28, color: colors.text, letterSpacing: -0.5 }, children: isEdit ? 'Edit Event' : 'Create Event' }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.textMuted, marginTop: 2 }, children: isEdit
                                    ? 'Update event details below'
                                    : 'Fill in the details to create a new event. Fields marked * are required.' })] }) }), _jsxs(react_native_1.ScrollView, { style: { flex: 1 }, contentContainerStyle: {
                        maxWidth: 900,
                        width: '100%',
                        alignSelf: 'center',
                        padding: isNarrow ? 20 : 40,
                        gap: 24,
                        paddingBottom: 120,
                    }, showsVerticalScrollIndicator: false, children: [errors.submit ? (_jsx(react_native_1.View, { style: {
                                padding: 12,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: '#DC2626',
                                backgroundColor: 'rgba(220,38,38,0.08)',
                            }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: '#DC2626' }, children: errors.submit }) })) : null, _jsx(FieldRow, { label: "Title", colors: colors, error: errors.title, required: true, children: _jsx(react_native_1.TextInput, { value: title, onChangeText: setTitle, placeholder: "e.g. Sunday Satsang with Swamiji", placeholderTextColor: colors.textMuted, style: inputStyle(!!errors.title) }) }), _jsx(FieldRow, { label: "Description", colors: colors, hint: "What will attendees experience? Speakers, agenda, what to bring.", children: _jsx(react_native_1.TextInput, { value: description, onChangeText: setDescription, placeholder: "Describe the event...", placeholderTextColor: colors.textMuted, multiline: true, textAlignVertical: "top", style: {
                                    ...inputStyle(),
                                    minHeight: 120,
                                } }) }), _jsxs(react_native_1.View, { style: { flexDirection: isNarrow ? 'column' : 'row', gap: isNarrow ? 24 : 28 }, children: [_jsx(react_native_1.View, { style: { flex: 1 }, children: _jsx(FieldRow, { label: "Date", colors: colors, error: errors.date, required: true, children: _jsx(NativeDateTimeInput, { type: "date", value: date, onChange: setDate, min: today, hasError: !!errors.date, colors: colors, isDark: isDark }) }) }), _jsx(react_native_1.View, { style: { flex: 1 }, children: _jsx(FieldRow, { label: "Time", colors: colors, error: errors.time, children: _jsx(NativeDateTimeInput, { type: "time", value: time, onChange: setTime, hasError: !!errors.time, colors: colors, isDark: isDark }) }) })] }), _jsxs(FieldRow, { label: "Center", colors: colors, error: errors.center, required: true, hint: "Picking a center auto-fills address & coordinates.", children: [_jsxs(react_native_1.Pressable, { onPress: () => setShowCenterPicker(!showCenterPicker), style: {
                                        ...inputStyle(!!errors.center),
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }, children: [_jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 15,
                                                color: centerName ? colors.text : colors.textMuted,
                                            }, children: centerName || 'Select a center...' }), _jsx(lucide_react_native_1.ChevronDown, { size: 16, color: colors.textMuted, style: { transform: [{ rotate: showCenterPicker ? '180deg' : '0deg' }] } })] }), showCenterPicker && (_jsx(react_native_1.View, { style: {
                                        marginLeft: 42,
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
                                                        }, children: center.address })) : null] }, center.centerID))), centers.length === 0 && (_jsx(react_native_1.View, { style: { paddingHorizontal: 14, paddingVertical: 16, alignItems: 'center' }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }, children: "No centers available" }) }))] }) }))] }), _jsx(FieldRow, { label: "Address", colors: colors, hint: "Where the event is held. Auto-filled from center if blank.", children: _jsx(react_native_1.TextInput, { value: address, onChangeText: setAddress, placeholder: "123 Main St, City, ST 12345", placeholderTextColor: colors.textMuted, style: inputStyle() }) }), _jsx(FieldRow, { label: "Point of Contact", colors: colors, hint: "Optional. Email or name attendees can reach.", children: _jsx(react_native_1.TextInput, { value: pointOfContact, onChangeText: setPointOfContact, placeholder: "contact@example.org", placeholderTextColor: colors.textMuted, style: inputStyle() }) }), _jsx(FieldRow, { label: "Image URL", colors: colors, hint: "Optional. A direct link to a JPG/PNG.", children: _jsx(react_native_1.TextInput, { value: image, onChangeText: setImage, placeholder: "https://...", placeholderTextColor: colors.textMuted, autoCapitalize: "none", style: inputStyle() }) }), _jsx(FieldRow, { label: "External info link", colors: colors, hint: "Optional. Page about the event on another site (e.g., chinmayamission.com).", children: _jsx(react_native_1.TextInput, { value: externalUrl, onChangeText: setExternalUrl, placeholder: "https://...", placeholderTextColor: colors.textMuted, autoCapitalize: "none", style: inputStyle() }) }), _jsxs(FieldRow, { label: "External signup URL", colors: colors, hint: "Optional. If attendees register on another site (Eventbrite, Google Form, etc.).", children: [_jsx(react_native_1.TextInput, { value: signupUrl, onChangeText: setSignupUrl, placeholder: "https://...", placeholderTextColor: colors.textMuted, autoCapitalize: "none", style: inputStyle() }), signupUrl.trim() ? (_jsxs(react_native_1.View, { style: {
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
                                                    }, children: "When off, the only signup option is the link above." })] }), _jsx(react_native_1.Switch, { value: allowJanataSignup, onValueChange: setAllowJanataSignup, trackColor: { true: '#E8862A', false: colors.border }, thumbColor: "#FFFFFF", ios_backgroundColor: colors.border, activeThumbColor: "#FFFFFF" })] })) : null] }), _jsx(FieldRow, { label: "Category", colors: colors, children: _jsx(react_native_1.View, { style: { flexDirection: 'row', gap: 8, marginLeft: 42, flexWrap: 'wrap' }, children: CATEGORY_OPTIONS.map((opt) => {
                                    const selected = category === opt.value;
                                    return (_jsx(react_native_1.Pressable, { onPress: () => setCategory(opt.value), style: {
                                            paddingHorizontal: 18,
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
                                }) }) }), _jsxs(react_native_1.View, { style: { gap: 12, marginTop: 4 }, children: [_jsxs(react_native_1.Pressable, { onPress: () => setShowAdvanced((v) => !v), style: { flexDirection: 'row', alignItems: 'center', gap: 8 }, accessibilityLabel: "Toggle advanced location options", children: [_jsx(lucide_react_native_1.ChevronDown, { size: 14, color: colors.textMuted, style: { transform: [{ rotate: showAdvanced ? '0deg' : '-90deg' }] } }), _jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 12,
                                                color: colors.textMuted,
                                                letterSpacing: 0.4,
                                                textTransform: 'uppercase',
                                            }, children: "Advanced location" }), (errors.latitude || errors.longitude) ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: '#DC2626' }, children: "\u00B7 check coordinates" })) : null] }), showAdvanced && (_jsx(FieldRow, { label: "Coordinates", colors: colors, error: errors.latitude || errors.longitude, hint: "Auto-filled when you pick a center. Override only if pin is wrong.", children: _jsxs(react_native_1.View, { style: { flexDirection: 'row', gap: 10, marginLeft: 42 }, children: [_jsx(react_native_1.TextInput, { value: latitude, onChangeText: setLatitude, placeholder: "Latitude", placeholderTextColor: colors.textMuted, style: {
                                                    ...inputStyle(!!errors.latitude),
                                                    marginLeft: 0,
                                                    flex: 1,
                                                } }), _jsx(react_native_1.TextInput, { value: longitude, onChangeText: setLongitude, placeholder: "Longitude", placeholderTextColor: colors.textMuted, style: {
                                                    ...inputStyle(!!errors.longitude),
                                                    marginLeft: 0,
                                                    flex: 1,
                                                } })] }) }))] })] }), _jsxs(react_native_1.View, { style: {
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                        padding: 16,
                        paddingHorizontal: isNarrow ? 16 : 40,
                        backgroundColor: colors.panelBg,
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        gap: 12,
                        maxWidth: 900,
                        width: '100%',
                        alignSelf: 'center',
                    }, children: [_jsx(ui_1.SecondaryButton, { onPress: () => router.back(), style: { paddingHorizontal: 24, paddingVertical: 12 }, children: "Cancel" }), _jsx(ui_1.PrimaryButton, { onPress: handleSave, disabled: saving, loading: saving, style: { paddingHorizontal: 32, paddingVertical: 12 }, children: isEdit ? 'Save Changes' : 'Create Event' })] })] }));
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
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (useDetailColors_1_1) {
                useDetailColors_1 = useDetailColors_1_1;
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
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
            CATEGORY_OPTIONS = [
                { value: undefined, label: 'None' },
                { value: 91, label: 'Satsang' },
                { value: 92, label: 'Bhiksha' },
            ];
        }
    };
});
