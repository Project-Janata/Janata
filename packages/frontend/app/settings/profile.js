System.register(["react/jsx-runtime", "react", "react-native", "react-native-safe-area-context", "lucide-react-native", "expo-router", "../../components/contexts", "../../components/BirthdatePicker", "../../utils/api"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, react_native_safe_area_context_1, lucide_react_native_1, expo_router_1, contexts_1, BirthdatePicker_1, api_1, ImagePicker, PREFERENCE_OPTIONS;
    var __moduleName = context_1 && context_1.id;
    function formatBirthday(date) {
        if (!date)
            return '';
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    function toISODate(date) {
        if (!date)
            return '';
        return date.toISOString().split('T')[0];
    }
    function parseISODate(str) {
        if (!str)
            return null;
        const d = new Date(str + 'T00:00:00');
        return isNaN(d.getTime()) ? null : d;
    }
    function ProfileNative() {
        const router = expo_router_1.useRouter();
        const pathname = expo_router_1.usePathname();
        const { user, updateProfile, setUser } = contexts_1.useUser();
        const { isDark } = contexts_1.useTheme();
        const [isEditing, setIsEditing] = react_1.useState(false);
        const [isSaving, setIsSaving] = react_1.useState(false);
        const [errors, setErrors] = react_1.useState({});
        const getDisplayName = () => {
            if (user?.firstName && user?.lastName)
                return `${user.firstName} ${user.lastName}`;
            if (user?.firstName)
                return user.firstName;
            return user?.username || '';
        };
        const getInitials = () => {
            if (user?.firstName && user?.lastName) {
                return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
            }
            if (user?.firstName)
                return user.firstName[0].toUpperCase();
            if (user?.username)
                return user.username[0].toUpperCase();
            return '?';
        };
        const [profileData, setProfileData] = react_1.useState({
            name: getDisplayName(),
            bio: user?.bio || '',
            birthday: user?.dateOfBirth ? new Date(user.dateOfBirth) : null,
            interests: user?.interests || [],
            profileImage: user?.profileImage || null,
            centerID: user?.centerID || null,
        });
        const [allCenters, setAllCenters] = react_1.useState([]);
        const [centerSearch, setCenterSearch] = react_1.useState('');
        const [centerResults, setCenterResults] = react_1.useState([]);
        const [showCenterPicker, setShowCenterPicker] = react_1.useState(false);
        const [centerSearchLoading, setCenterSearchLoading] = react_1.useState(false);
        const centerSearchTimer = react_1.useRef(null);
        const draftName = react_1.useRef(profileData.name);
        const draftBio = react_1.useRef(profileData.bio);
        const draftBirthday = react_1.useRef(profileData.birthday);
        const savedInterests = react_1.useRef(profileData.interests);
        const savedProfileImage = react_1.useRef(profileData.profileImage);
        const savedCenterID = react_1.useRef(profileData.centerID);
        const [profileImageChanged, setProfileImageChanged] = react_1.useState(false);
        const handleAvatarPress = async () => {
            if (!ImagePicker) {
                react_native_1.Alert.alert('Error', 'Image picker is not available on this device');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            if (!result.canceled && result.assets.length > 0) {
                setProfileData((prev) => ({ ...prev, profileImage: result.assets[0].uri }));
                setProfileImageChanged(true);
            }
        };
        react_1.useEffect(() => {
            if (user && !isEditing) {
                setProfileData((prev) => ({
                    ...prev,
                    name: getDisplayName() || prev.name,
                    bio: user.bio || prev.bio,
                    profileImage: user.profileImage || prev.profileImage,
                    interests: user.interests || prev.interests,
                    centerID: user.centerID || prev.centerID,
                }));
            }
        }, [
            user?.firstName,
            user?.lastName,
            user?.profileImage,
            user?.bio,
            user?.interests,
            user?.centerID,
        ]);
        react_1.useEffect(() => {
            const loadCenters = async () => {
                try {
                    const centers = await api_1.fetchCenters();
                    setAllCenters(centers);
                }
                catch (e) {
                    // Silently fail
                }
            };
            loadCenters();
        }, []);
        react_1.useEffect(() => {
            if (centerSearchTimer.current) {
                clearTimeout(centerSearchTimer.current);
            }
            if (centerSearch.length >= 3) {
                setCenterSearchLoading(true);
                centerSearchTimer.current = setTimeout(async () => {
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(centerSearch)}&format=json&limit=1&countrycodes=us`);
                        if (response.ok) {
                            const data = await response.json();
                            if (data.length > 0) {
                                const userLat = parseFloat(data[0].lat);
                                const userLon = parseFloat(data[0].lon);
                                const centersWithDistance = allCenters
                                    .filter((c) => c.latitude != null && c.longitude != null)
                                    .map((center) => ({
                                    ...center,
                                    distance: Math.sqrt(Math.pow((center.latitude - userLat) * 69, 2) +
                                        Math.pow((center.longitude - userLon) * 54.6, 2)),
                                }))
                                    .sort((a, b) => a.distance - b.distance)
                                    .slice(0, 5);
                                setCenterResults(centersWithDistance);
                                setShowCenterPicker(true);
                            }
                        }
                    }
                    catch (e) {
                        // Silently fail
                    }
                    finally {
                        setCenterSearchLoading(false);
                    }
                }, 500);
            }
            else {
                setCenterResults([]);
                setShowCenterPicker(false);
            }
            return () => {
                if (centerSearchTimer.current) {
                    clearTimeout(centerSearchTimer.current);
                }
            };
        }, [centerSearch, allCenters]);
        react_1.useEffect(() => {
            draftName.current = profileData.name;
            draftBio.current = profileData.bio;
        }, [profileData.name, profileData.bio]);
        const readDrafts = () => ({
            name: draftName.current,
            bio: draftBio.current,
            birthday: draftBirthday.current,
            interests: profileData.interests,
            centerID: profileData.centerID,
        });
        const validateForm = () => {
            const drafts = readDrafts();
            const newErrors = {};
            if (!drafts.name.trim())
                newErrors.name = 'Name is required';
            if (!drafts.birthday)
                newErrors.birthday = 'Birthday is required';
            if (profileData.interests.length === 0)
                newErrors.interests = 'At least one interest must be selected';
            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        };
        const handleEdit = () => {
            draftName.current = profileData.name;
            draftBio.current = profileData.bio;
            draftBirthday.current = profileData.birthday;
            savedInterests.current = [...profileData.interests];
            savedProfileImage.current = profileData.profileImage;
            savedCenterID.current = profileData.centerID;
            setIsEditing(true);
        };
        const handleCancel = () => {
            draftBirthday.current = profileData.birthday;
            setProfileData((prev) => ({
                ...prev,
                interests: savedInterests.current,
                profileImage: savedProfileImage.current,
                centerID: savedCenterID.current,
            }));
            setProfileImageChanged(false);
            setErrors({});
            setIsEditing(false);
        };
        const handleSave = async () => {
            if (!validateForm())
                return;
            const drafts = readDrafts();
            setProfileData((prev) => ({
                ...prev,
                name: drafts.name,
                bio: drafts.bio,
                birthday: drafts.birthday,
            }));
            setIsSaving(true);
            try {
                const nameParts = drafts.name.trim().split(' ');
                let profileImageBase64;
                if (profileImageChanged && profileData.profileImage) {
                    try {
                        const response = await fetch(profileData.profileImage);
                        if (!response.ok) {
                            throw new Error(`Fetch failed: ${response.status}`);
                        }
                        const blob = await response.blob();
                        profileImageBase64 = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = () => reject(new Error('Failed to read blob'));
                            reader.readAsDataURL(blob);
                        });
                    }
                    catch (e) {
                        console.error('Error converting image:', e);
                        setErrors((prev) => ({
                            ...prev,
                            profileImage: 'Failed to upload image. Please try again.',
                        }));
                        setIsSaving(false);
                        return;
                    }
                }
                const result = await updateProfile({
                    firstName: nameParts[0],
                    lastName: nameParts.slice(1).join(' '),
                    bio: drafts.bio || '',
                    interests: drafts.interests,
                    ...(drafts.centerID ? { centerID: drafts.centerID } : {}),
                    ...(drafts.birthday ? { dateOfBirth: drafts.birthday.toISOString().split('T')[0] } : {}),
                    ...(profileImageBase64 ? { profileImage: profileImageBase64 } : {}),
                });
                if (!result.success) {
                    setErrors((prev) => ({ ...prev, form: result.message || 'Failed to save profile' }));
                    setIsSaving(false);
                    return;
                }
                setProfileImageChanged(false);
                if (user) {
                    setUser({ ...user, originalImage: profileData.profileImage });
                }
                setIsEditing(false);
                setErrors({});
            }
            catch (error) {
                if (__DEV__)
                    console.error('Error saving profile:', error);
                setIsEditing(false);
                setErrors({});
            }
            finally {
                setIsSaving(false);
            }
        };
        const handlePreferenceToggle = (preference) => {
            if (!isEditing)
                return;
            setProfileData((prev) => ({
                ...prev,
                interests: prev.interests.includes(preference)
                    ? prev.interests.filter((p) => p !== preference)
                    : [...prev.interests, preference],
            }));
        };
        const labelColor = isDark ? '#78716C' : '#A8A29E';
        const textColor = isDark ? '#F5F5F5' : '#1C1917';
        const mutedTextColor = isDark ? '#A8A29E' : '#78716C';
        const borderColor = isDark ? '#262626' : '#E5E7EB';
        const cardBg = isDark ? '#171717' : '#FFFFFF';
        const chipBg = isDark ? '#262626' : '#F3F0ED';
        const labelStyle = {
            fontFamily: 'Inclusive Sans',
            fontSize: 12,
            color: labelColor,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 6,
        };
        const inputStyle = {
            fontFamily: 'Inclusive Sans',
            fontSize: 15,
            color: textColor,
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor,
            backgroundColor: cardBg,
        };
        const multilineInputStyle = {
            ...inputStyle,
            minHeight: 100,
        };
        return (_jsxs(react_native_safe_area_context_1.SafeAreaView, { style: { flex: 1, backgroundColor: isDark ? '#171717' : '#FAFAF7' }, edges: ['top', 'bottom'], children: [_jsxs(react_native_1.View, { style: {
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 8,
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderColor,
                        backgroundColor: isDark ? '#171717' : '#FAFAF7',
                    }, children: [_jsx(react_native_1.Pressable, { onPress: () => router.back(), style: { padding: 8 }, children: _jsx(lucide_react_native_1.ArrowLeft, { size: 24, color: textColor }) }), _jsx(react_native_1.Text, { style: { fontSize: 17, fontWeight: '600', color: textColor }, children: "Profile" }), _jsx(react_native_1.Pressable, { onPress: isEditing ? handleSave : handleEdit, disabled: isSaving, style: { padding: 8, minWidth: 40, alignItems: 'center' }, children: isSaving ? (_jsx(react_native_1.ActivityIndicator, { size: "small", color: "#C2410C" })) : isEditing ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: '#C2410C' }, children: "Save" })) : (_jsx(lucide_react_native_1.Pencil, { size: 20, color: "#C2410C" })) })] }), _jsxs(react_native_1.ScrollView, { style: { flex: 1, backgroundColor: isDark ? '#171717' : '#FAFAF7' }, children: [_jsxs(react_native_1.View, { style: {
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                                paddingTop: 28,
                                paddingBottom: 24,
                                paddingHorizontal: 20,
                                gap: 16,
                            }, children: [_jsxs(react_native_1.View, { style: { position: 'relative' }, children: [profileData.profileImage ? (_jsx(react_native_1.Image, { source: { uri: profileData.profileImage }, style: {
                                                width: 88,
                                                height: 88,
                                                borderRadius: 44,
                                                borderWidth: 3,
                                                borderColor: cardBg,
                                                backgroundColor: '#D6D3D1',
                                            } })) : (_jsx(react_native_1.View, { style: {
                                                width: 88,
                                                height: 88,
                                                borderRadius: 44,
                                                borderWidth: 3,
                                                borderColor: cardBg,
                                                backgroundColor: '#C2410C',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }, children: _jsx(react_native_1.Text, { style: { color: '#fff', fontSize: 28, fontWeight: '600' }, children: getInitials() }) })), isEditing && (_jsx(react_native_1.Pressable, { style: {
                                                position: 'absolute',
                                                bottom: -6,
                                                right: -6,
                                                width: 44,
                                                height: 44,
                                                borderRadius: 22,
                                                backgroundColor: '#C2410C',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderWidth: 2,
                                                borderColor: isDark ? '#171717' : '#FAFAF7',
                                            }, onPress: handleAvatarPress, children: _jsx(lucide_react_native_1.Camera, { size: 16, color: "#fff" }) }))] }), _jsxs(react_native_1.View, { style: { flex: 1, minWidth: 0, justifyContent: 'center', paddingTop: 2 }, children: [isEditing ? (_jsx(react_native_1.TextInput, { defaultValue: profileData.name, onChangeText: (v) => {
                                                draftName.current = v;
                                            }, placeholderTextColor: "#9ca3af", style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 22,
                                                color: textColor,
                                                letterSpacing: -0.5,
                                                marginBottom: 6,
                                                width: '100%',
                                                padding: 0,
                                                textAlign: 'left',
                                            } })) : (_jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 22,
                                                color: textColor,
                                                letterSpacing: -0.5,
                                                marginBottom: 6,
                                            }, children: profileData.name || '—' })), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: mutedTextColor }, children: user?.email || (user?.username ? `@${user.username}` : '') || '—' }), isEditing && user?.email && user.email !== user.username && (_jsxs(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 13,
                                                color: mutedTextColor,
                                                marginTop: 4,
                                            }, children: ["@", user.username] }))] })] }), _jsxs(react_native_1.View, { style: { paddingHorizontal: 20, gap: 20 }, children: [_jsxs(react_native_1.View, { children: [_jsx(react_native_1.Text, { style: labelStyle, children: "Bio" }), isEditing ? (_jsx(react_native_1.TextInput, { defaultValue: profileData.bio, onChangeText: (v) => {
                                                draftBio.current = v;
                                            }, multiline: true, textAlignVertical: "top", placeholderTextColor: "#9ca3af", style: multilineInputStyle })) : (_jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 15,
                                                color: mutedTextColor,
                                                lineHeight: 22,
                                            }, children: profileData.bio || '—' })), errors.bio && (_jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 13,
                                                color: '#DC2626',
                                                marginTop: 6,
                                            }, children: errors.bio }))] }), _jsxs(react_native_1.View, { children: [_jsx(react_native_1.Text, { style: labelStyle, children: "Birthday" }), isEditing ? (_jsx(BirthdatePicker_1.default, { value: draftBirthday.current ?? undefined, onChange: (d) => {
                                                draftBirthday.current = d;
                                            } })) : (_jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 16,
                                                color: textColor,
                                                lineHeight: 24,
                                            }, children: formatBirthday(profileData.birthday) || '—' })), errors.birthday && (_jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 13,
                                                color: '#DC2626',
                                                marginTop: 6,
                                            }, children: errors.birthday }))] }), _jsxs(react_native_1.View, { children: [_jsx(react_native_1.Text, { style: labelStyle, children: "Center" }), isEditing ? (_jsxs(react_native_1.View, { style: {
                                                position: 'relative',
                                                marginBottom: showCenterPicker && centerResults.length > 0 ? 200 : 0,
                                            }, children: [_jsx(react_native_1.TextInput, { value: centerSearch ||
                                                        allCenters.find((c) => c.centerID === profileData.centerID)?.name ||
                                                        '', onChangeText: (text) => {
                                                        setCenterSearch(text);
                                                        if (text.length < 3)
                                                            setShowCenterPicker(false);
                                                        if (text === '')
                                                            setProfileData((prev) => ({ ...prev, centerID: null }));
                                                    }, onFocus: () => {
                                                        if (centerResults.length > 0)
                                                            setShowCenterPicker(true);
                                                    }, placeholder: "Search by city or town", placeholderTextColor: "#9ca3af", style: inputStyle }), centerSearchLoading && (_jsx(react_native_1.View, { style: { position: 'absolute', right: 12, top: 14 }, children: _jsx(react_native_1.ActivityIndicator, { size: "small", color: "#C2410C" }) })), showCenterPicker && centerResults.length > 0 && (_jsx(react_native_1.View, { style: {
                                                        position: 'absolute',
                                                        top: '100%',
                                                        left: 0,
                                                        right: 0,
                                                        backgroundColor: cardBg,
                                                        borderRadius: 12,
                                                        borderWidth: 1,
                                                        borderColor,
                                                        maxHeight: 200,
                                                        zIndex: 200,
                                                        marginTop: 8,
                                                        shadowColor: '#000',
                                                        shadowOffset: { width: 0, height: 2 },
                                                        shadowOpacity: 0.1,
                                                        shadowRadius: 8,
                                                        elevation: 5,
                                                    }, children: centerResults.map((center) => (_jsx(react_native_1.Pressable, { onPress: () => {
                                                            setProfileData((prev) => ({ ...prev, centerID: center.centerID }));
                                                            setCenterSearch('');
                                                            setShowCenterPicker(false);
                                                        }, style: {
                                                            paddingHorizontal: 16,
                                                            paddingVertical: 12,
                                                            borderBottomWidth: 1,
                                                            borderBottomColor: borderColor,
                                                            backgroundColor: profileData.centerID === center.centerID
                                                                ? '#C2410C' + '20'
                                                                : 'transparent',
                                                        }, children: _jsx(react_native_1.Text, { style: {
                                                                fontFamily: 'Inclusive Sans',
                                                                fontSize: 14,
                                                                color: profileData.centerID === center.centerID ? '#C2410C' : textColor,
                                                            }, children: center.name }) }, center.centerID))) }))] })) : (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, children: [_jsx(lucide_react_native_1.MapPin, { size: 18, color: mutedTextColor, style: { marginTop: 2 } }), _jsx(react_native_1.Text, { style: {
                                                        fontFamily: 'Inclusive Sans',
                                                        fontSize: 15,
                                                        color: mutedTextColor,
                                                        flex: 1,
                                                        lineHeight: 22,
                                                    }, children: profileData.centerID
                                                        ? allCenters.find((c) => c.centerID === profileData.centerID)?.name || '—'
                                                        : '—' })] }))] }), _jsxs(react_native_1.View, { children: [_jsx(react_native_1.Text, { style: labelStyle, children: "Interests" }), _jsx(react_native_1.View, { style: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, children: PREFERENCE_OPTIONS.map((pref) => {
                                                const selected = profileData.interests.includes(pref);
                                                return (_jsx(react_native_1.Pressable, { onPress: () => handlePreferenceToggle(pref), disabled: !isEditing, style: {
                                                        paddingHorizontal: 18,
                                                        paddingVertical: 12,
                                                        borderRadius: 100,
                                                        minHeight: 44,
                                                        justifyContent: 'center',
                                                        backgroundColor: selected ? '#C2410C' : chipBg,
                                                        opacity: !isEditing && !selected ? 0.5 : 1,
                                                    }, children: _jsx(react_native_1.Text, { style: {
                                                            fontFamily: 'Inclusive Sans',
                                                            fontSize: 14,
                                                            color: selected ? '#FFFFFF' : mutedTextColor,
                                                        }, children: pref }) }, pref));
                                            }) }), errors.interests && (_jsx(react_native_1.Text, { style: {
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 13,
                                                color: '#DC2626',
                                                marginTop: 8,
                                            }, children: errors.interests }))] }), (errors.form || errors.profileImage) && (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: '#DC2626', marginTop: 8 }, children: errors.form || errors.profileImage })), isEditing && (_jsx(react_native_1.View, { style: { flexDirection: 'row', gap: 12, marginTop: 8 }, children: _jsx(react_native_1.Pressable, { onPress: handleCancel, style: {
                                            flex: 1,
                                            paddingVertical: 14,
                                            borderRadius: 12,
                                            minHeight: 48,
                                            backgroundColor: isDark ? '#262626' : '#F3F0ED',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: textColor }, children: "Cancel" }) }) }))] }), _jsx(react_native_1.View, { style: { height: 40 } })] })] }));
    }
    exports_1("default", ProfileNative);
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
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            },
            function (expo_router_1_1) {
                expo_router_1 = expo_router_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (BirthdatePicker_1_1) {
                BirthdatePicker_1 = BirthdatePicker_1_1;
            },
            function (api_1_1) {
                api_1 = api_1_1;
            }
        ],
        execute: function () {
            ImagePicker = null;
            try {
                ImagePicker = require('expo-image-picker');
            }
            catch (e) {
                // Native module not linked
            }
            PREFERENCE_OPTIONS = [
                'Satsangs',
                'Bhiksha',
                'Global events',
                'Local events',
                'Casual',
                'Formal',
            ];
        }
    };
});
