System.register(["react/jsx-runtime", "react", "react-native", "expo-router", "react-native-safe-area-context", "lucide-react-native", "posthog-react-native", "../../components/ui", "../../components/contexts", "../../components/contexts/HeaderActionContext", "../../hooks/useApiData", "../../utils/addressParsing", "../../components/connect"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, expo_router_1, react_native_safe_area_context_1, lucide_react_native_1, posthog_react_native_1, ui_1, contexts_1, HeaderActionContext_1, useApiData_1, addressParsing_1, connect_1;
    var __moduleName = context_1 && context_1.id;
    function formatEventDateLabel(date) {
        const parsed = new Date(`${date}T00:00:00`);
        if (Number.isNaN(parsed.getTime()))
            return 'EVENT';
        return parsed
            .toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        })
            .toUpperCase();
    }
    function sortUpcomingEvents(events) {
        const today = new Date().toISOString().split('T')[0];
        return [...events]
            .filter((event) => !event.date || event.date >= today)
            .sort((a, b) => {
            if (!a.date && !b.date)
                return 0;
            if (!a.date)
                return 1;
            if (!b.date)
                return -1;
            return a.date.localeCompare(b.date);
        });
    }
    function eventToBoard(event, fallbackCenterName) {
        return connect_1.buildEventBoard({
            id: `event-${event.id}`,
            title: event.title,
            dateLabel: formatEventDateLabel(event.date),
            centerLabel: fallbackCenterName || event.location || 'Event group',
            attendeesLabel: `${event.attendees || 0} going`,
        });
    }
    function haversineMiles(from, to) {
        if (!from ||
            !to ||
            !Number.isFinite(from.latitude) ||
            !Number.isFinite(from.longitude) ||
            !Number.isFinite(to.latitude) ||
            !Number.isFinite(to.longitude)) {
            return undefined;
        }
        const toRad = (value) => (value * Math.PI) / 180;
        const lat1 = toRad(from.latitude);
        const lat2 = toRad(to.latitude);
        const dLat = toRad(to.latitude - from.latitude);
        const dLng = toRad(to.longitude - from.longitude);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    function formatDistance(distanceMi) {
        if (distanceMi == null || !Number.isFinite(distanceMi))
            return undefined;
        if (distanceMi < 0.5)
            return 'Nearby';
        if (distanceMi < 10)
            return `${distanceMi.toFixed(1)} mi`;
        return `${Math.round(distanceMi)} mi`;
    }
    function centerToGroup(board, distanceMi) {
        const latest = board.messages[0];
        const distanceLabel = formatDistance(distanceMi);
        return {
            id: board.id,
            kind: 'center',
            title: board.centerName,
            eyebrow: 'Center board',
            subtitle: board.subtitle,
            meta: distanceLabel ? `${distanceLabel} away` : `${board.messages.length} posts`,
            preview: latest?.body || 'No posts yet.',
            unreadCount: 2,
            messages: board.messages,
            distanceMi,
        };
    }
    function eventToGroup(board, distanceMi) {
        const distanceLabel = formatDistance(distanceMi);
        return {
            id: board.id,
            kind: 'event',
            title: board.title,
            eyebrow: board.dateLabel,
            subtitle: `${board.centerLabel} - ${board.attendeesLabel}`,
            meta: distanceLabel ? `${distanceLabel} away` : `${board.messages.length} posts`,
            preview: board.preview,
            unreadCount: board.messages.length > 2 ? 1 : 0,
            messages: board.messages,
            distanceMi,
        };
    }
    function centerToNearbyGroup(center, events, anchor) {
        const distanceMi = haversineMiles(anchor, center);
        const eventCount = events.filter((event) => event.centerId === center.id).length;
        const locationLabel = addressParsing_1.extractCityState(center.address) || center.address || 'Center board';
        const distanceLabel = formatDistance(distanceMi);
        const subtitle = [
            locationLabel,
            distanceLabel ? `${distanceLabel} away` : null,
            eventCount > 0 ? `${eventCount} upcoming` : null,
        ].filter(Boolean).join(' - ');
        return centerToGroup(connect_1.buildCenterBoard({
            id: `center-${center.id}`,
            centerName: center.name,
            subtitle,
        }), distanceMi);
    }
    function sortGroupsByDistance(groups) {
        return [...groups].sort((a, b) => {
            const aDistance = a.distanceMi ?? Number.POSITIVE_INFINITY;
            const bDistance = b.distanceMi ?? Number.POSITIVE_INFINITY;
            if (aDistance !== bDistance)
                return aDistance - bDistance;
            if (a.kind !== b.kind)
                return a.kind === 'center' ? -1 : 1;
            return a.title.localeCompare(b.title);
        });
    }
    function matchesQuery(value, query) {
        return value.toLowerCase().includes(query.toLowerCase().trim());
    }
    function buildFeedPosts(groups) {
        const posts = groups.flatMap((group) => group.messages.map((message) => {
            const replies = group.messages.filter((candidate) => candidate.id !== message.id);
            return {
                ...message,
                id: `${group.id}-${message.id}`,
                sourceLabel: group.title,
                sourceKind: group.kind,
                sourceTitle: group.title,
                sourceSubtitle: group.subtitle,
                groupId: group.id,
                groupKind: group.kind,
                replyMessages: replies.slice(0, Math.max(message.replyCount ?? 2, 1)),
            };
        }));
        return posts.sort((a, b) => {
            if (a.pinned !== b.pinned)
                return a.pinned ? -1 : 1;
            return a.id < b.id ? 1 : -1;
        });
    }
    function FeedScreen() {
        const router = expo_router_1.useRouter();
        const navigation = expo_router_1.useNavigation();
        const { user } = contexts_1.useUser();
        const { isDark } = contexts_1.useTheme();
        const { width } = react_native_1.useWindowDimensions();
        const insets = react_native_safe_area_context_1.useSafeAreaInsets();
        const posthog = posthog_react_native_1.usePostHog();
        const detailTranslateX = react_1.useRef(new react_native_1.Animated.Value(width)).current;
        const { events: myEvents, loading: myEventsLoading } = useApiData_1.useMyEvents(user?.username);
        const { center, events: centerEvents, loading: centerLoading, } = useApiData_1.useCenterDetail(user?.centerID || '');
        const { allEvents, allCenters, loading: discoverLoading, } = useApiData_1.useDiscoverData('Centers', '', user?.id, false, false, user?.interests ?? undefined, user?.centerID);
        const isDesktop = width >= 980;
        const [query, setQuery] = react_1.useState('');
        const [selectedPostId, setSelectedPostId] = react_1.useState('');
        const [demoVerified, setDemoVerified] = react_1.useState(false);
        const [createPostOpen, setCreatePostOpen] = react_1.useState(false);
        const { setCreateHandler } = HeaderActionContext_1.useHeaderAction();
        react_1.useEffect(() => {
            setCreateHandler(() => setCreatePostOpen(true));
            return () => setCreateHandler(null);
        }, [setCreateHandler]);
        const colors = react_1.useMemo(() => isDark
            ? {
                page: '#1A1A1A',
                surface: '#171717',
                panel: '#1F1F1F',
                rail: '#171717',
                card: '#171717',
                cardActive: '#271F18',
                border: '#2B2B2B',
                borderStrong: '#3A332D',
                text: '#FAFAF9',
                textMuted: '#C0BAB2',
                textSoft: '#8B847C',
                orange: '#F97316',
                orangeSoft: 'rgba(249,115,22,0.15)',
                green: '#10B981',
                greenSoft: 'rgba(16,185,129,0.14)',
            }
            : {
                page: '#F5F5F4',
                surface: '#FFFFFF',
                panel: '#F7F4EF',
                rail: '#FFFFFF',
                card: '#FFFFFF',
                cardActive: '#FFF7ED',
                border: '#E7E0D8',
                borderStrong: '#F2C79C',
                text: '#1F1D1B',
                textMuted: '#625B54',
                textSoft: '#A79F97',
                orange: '#E8862A',
                orangeSoft: '#FFF3E4',
                green: '#059669',
                greenSoft: '#ECFDF5',
            }, [isDark]);
        const threadColors = react_1.useMemo(() => ({
            panelBg: colors.page,
            text: colors.text,
            textSecondary: colors.textMuted,
            textMuted: colors.textSoft,
            border: colors.border,
            iconBoxBg: colors.panel,
            cardBg: colors.card,
            avatarBorder: colors.surface,
            iconHeader: colors.textMuted,
            accent: colors.orange,
            accentSoft: colors.orangeSoft,
        }), [colors]);
        const isVerifiedMember = user?.isVerified === true || demoVerified;
        const canAccessBoards = !!user && isVerifiedMember;
        const userCenter = center || allCenters.find((item) => item.id === user?.centerID);
        const groups = react_1.useMemo(() => {
            if (user && !isVerifiedMember)
                return [];
            const nextGroups = [];
            if (user && isVerifiedMember) {
                const nearbyCenterGroups = allCenters.map((item) => centerToNearbyGroup(item, allEvents, userCenter));
                nextGroups.push(...nearbyCenterGroups);
                if (nearbyCenterGroups.length === 0 && center) {
                    nextGroups.push(centerToGroup(connect_1.buildCenterBoard({
                        id: `center-${center.id}`,
                        centerName: center.name,
                        subtitle: `${center.memberCount || 0} members - ${centerEvents.length} upcoming events`,
                    }), 0));
                }
            }
            else if (!user) {
                nextGroups.push(centerToGroup(connect_1.centerBoards[0]));
            }
            const registeredEvents = sortUpcomingEvents(myEvents);
            const registeredFromDiscover = sortUpcomingEvents(allEvents.filter((event) => event.isRegistered));
            const eventSource = registeredFromDiscover.length > 0 ? registeredFromDiscover : registeredEvents;
            const liveEventGroups = user && isVerifiedMember
                ? eventSource.map((event) => {
                    const eventDistance = haversineMiles(userCenter, {
                        latitude: event.latitude,
                        longitude: event.longitude,
                    });
                    return eventToGroup(eventToBoard(event, center?.name), eventDistance);
                })
                : [];
            if (liveEventGroups.length > 0) {
                nextGroups.push(...liveEventGroups);
            }
            else if (!user) {
                nextGroups.push(...connect_1.eventBoards.map(eventToGroup));
            }
            return sortGroupsByDistance(nextGroups);
        }, [allCenters, allEvents, center, centerEvents.length, isVerifiedMember, myEvents, user, userCenter]);
        const feedPosts = react_1.useMemo(() => buildFeedPosts(groups), [groups]);
        const filteredFeedPosts = react_1.useMemo(() => {
            if (!query.trim())
                return feedPosts;
            return feedPosts.filter((post) => matchesQuery(post.body, query) ||
                matchesQuery(post.author.name, query) ||
                matchesQuery(post.sourceTitle, query));
        }, [feedPosts, query]);
        const selectedPost = feedPosts.find((post) => post.id === selectedPostId) ?? feedPosts[0];
        const mobilePostOpen = !isDesktop && !!selectedPostId;
        const nativeDetailOpen = react_native_1.Platform.OS !== 'web' && mobilePostOpen;
        const listTopPadding = react_native_1.Platform.OS === 'web' ? 20 : 16;
        const isLoading = user ? myEventsLoading || centerLoading || discoverLoading : false;
        const nativeTabBarStyle = react_1.useMemo(() => ({
            backgroundColor: isDark ? '#171717' : '#FFFFFF',
            borderTopColor: isDark ? '#262626' : '#E7E5E4',
            height: 84,
            paddingTop: 8,
            paddingBottom: 18,
        }), [isDark]);
        react_1.useEffect(() => {
            setDemoVerified(false);
        }, [user?.id]);
        react_1.useEffect(() => {
            if (react_native_1.Platform.OS === 'web')
                return;
            navigation.setOptions({
                tabBarStyle: nativeDetailOpen ? { display: 'none' } : nativeTabBarStyle,
            });
            return () => {
                navigation.setOptions({ tabBarStyle: nativeTabBarStyle });
            };
        }, [navigation, nativeDetailOpen, nativeTabBarStyle]);
        react_1.useEffect(() => {
            if (react_native_1.Platform.OS === 'web')
                return;
            if (!nativeDetailOpen) {
                detailTranslateX.setValue(width);
                return;
            }
            react_native_1.Animated.timing(detailTranslateX, {
                toValue: 0,
                duration: 280,
                easing: react_native_1.Easing.out(react_native_1.Easing.cubic),
                useNativeDriver: true,
            }).start();
        }, [detailTranslateX, nativeDetailOpen, width]);
        const primeNativeDetailTransition = () => {
            if (react_native_1.Platform.OS !== 'web' && !isDesktop) {
                detailTranslateX.stopAnimation();
                detailTranslateX.setValue(width);
            }
        };
        const clearDetailSelection = () => {
            setSelectedPostId('');
        };
        const handleBoardAccessCta = () => {
            if (!user) {
                posthog?.capture('connect_signin_pressed', { source: 'feed_cta' });
                router.push('/auth');
                return;
            }
            posthog?.capture('connect_demo_verified');
            setDemoVerified(true);
        };
        const closeDetail = () => {
            if (react_native_1.Platform.OS !== 'web' && nativeDetailOpen) {
                detailTranslateX.stopAnimation();
                react_native_1.Animated.timing(detailTranslateX, {
                    toValue: width,
                    duration: 230,
                    easing: react_native_1.Easing.in(react_native_1.Easing.cubic),
                    useNativeDriver: true,
                }).start(({ finished }) => {
                    if (finished) {
                        clearDetailSelection();
                    }
                });
                return;
            }
            clearDetailSelection();
        };
        const openPost = (id) => {
            posthog?.capture('connect_feed_post_selected', { postId: id });
            primeNativeDetailTransition();
            setSelectedPostId(id);
        };
        if (isLoading) {
            return (_jsx(react_native_1.View, { style: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.page }, children: _jsx(react_native_1.ActivityIndicator, { size: "large", color: colors.orange }) }));
        }
        return (_jsxs(react_native_1.View, { style: { flex: 1, backgroundColor: colors.page }, children: [_jsxs(react_native_1.ScrollView, { contentContainerStyle: {
                        width: '100%',
                        maxWidth: isDesktop ? 1180 : 640,
                        alignSelf: 'center',
                        paddingHorizontal: isDesktop ? 24 : 16,
                        paddingTop: listTopPadding,
                        paddingBottom: react_native_1.Platform.OS === 'web' ? 40 : 112,
                        gap: 12,
                    }, showsVerticalScrollIndicator: false, children: [_jsx(FeedHeader, { query: query, colors: colors, mobileInDetail: mobilePostOpen && !nativeDetailOpen, onBack: closeDetail, onChangeQuery: setQuery }), !user ? (_jsx(SignInCallout, { colors: colors, onPress: () => {
                                posthog?.capture('connect_signin_pressed');
                                router.push('/auth');
                            } })) : null, _jsx(FeedWorkspace, { posts: filteredFeedPosts, selectedPost: selectedPost, colors: colors, threadColors: threadColors, isDesktop: isDesktop, canAccessBoards: canAccessBoards, isSignedIn: !!user, nativeDetailOpen: nativeDetailOpen, mobilePostOpen: mobilePostOpen, onRequestAccess: handleBoardAccessCta, onSelectPost: openPost })] }), nativeDetailOpen ? (_jsx(react_native_1.Animated.View, { style: {
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        backgroundColor: colors.surface,
                        transform: [{ translateX: detailTranslateX }],
                    }, children: _jsxs(react_native_1.KeyboardAvoidingView, { behavior: react_native_1.Platform.OS === 'ios' ? 'padding' : undefined, style: { flex: 1, backgroundColor: colors.surface }, children: [_jsx(NativeChatHeader, { colors: colors, insetsTop: insets.top, title: "Post", subtitle: selectedPost?.sourceTitle, hideAvatar: true, onBack: closeDetail }), _jsx(react_native_1.View, { style: { flex: 1 }, children: selectedPost ? (_jsx(PostThread, { post: selectedPost, colors: colors, fullScreen: true, bottomInset: insets.bottom })) : null })] }) })) : null, _jsx(CreatePostSheet, { visible: createPostOpen, colors: colors, groups: groups, onClose: () => setCreatePostOpen(false) })] }));
    }
    exports_1("default", FeedScreen);
    function FeedWorkspace({ posts, selectedPost, colors, threadColors, isDesktop, canAccessBoards, isSignedIn, nativeDetailOpen, mobilePostOpen, onRequestAccess, onSelectPost, }) {
        if (!canAccessBoards) {
            return (_jsx(connect_1.ThreadPanel, { messages: [], colors: threadColors, emptyTitle: "No posts yet", emptySubtitle: "Once your boards have posts, they will show up here.", composerPlaceholder: "Share something with the center...", composerState: "locked", lockedTitle: isSignedIn ? 'For verified members' : 'Sign in for member boards', lockedSubtitle: isSignedIn
                    ? "Boards are conversations between verified CHYKs at a center. Get verified and you're in."
                    : 'Sign in to see your center board, event boards, and member conversations.', primaryActionLabel: isSignedIn ? 'Redeem invite' : 'Sign in', secondaryActionLabel: isSignedIn ? 'Apply' : 'Learn more', onPrimaryAction: onRequestAccess, onSecondaryAction: onRequestAccess }));
        }
        if (isDesktop) {
            return (_jsxs(react_native_1.View, { style: { flexDirection: 'row', gap: 18, alignItems: 'flex-start' }, children: [_jsx(react_native_1.View, { style: { flex: 1.05, minWidth: 0 }, children: _jsx(FeedList, { posts: posts, colors: threadColors, onSelectPost: onSelectPost }) }), _jsx(react_native_1.View, { style: { flex: 0.95, minWidth: 0 }, children: selectedPost ? (_jsx(PostThread, { post: selectedPost, colors: colors })) : (_jsx(EmptyPanel, { title: "No posts found", subtitle: "Try a different search.", colors: colors })) })] }));
        }
        if (mobilePostOpen && !nativeDetailOpen && selectedPost) {
            return _jsx(PostThread, { post: selectedPost, colors: colors });
        }
        return _jsx(FeedList, { posts: posts, colors: threadColors, onSelectPost: onSelectPost });
    }
    function FeedList({ posts, colors, onSelectPost, }) {
        return (_jsx(connect_1.ThreadPanel, { messages: posts, colors: colors, emptyTitle: "No posts found", emptySubtitle: "Try a different search or check back after your next event.", composerPlaceholder: "Share something with your center...", showComposer: false, showSource: true, onMessagePress: (message) => onSelectPost(message.id) }));
    }
    function PostThread({ post, colors, fullScreen = false, bottomInset = 0, }) {
        const replies = post.replyMessages.slice(0, Math.max(post.replyCount ?? post.replyMessages.length, 1));
        const content = (_jsxs(react_native_1.View, { style: { paddingHorizontal: fullScreen ? 16 : 4, paddingTop: fullScreen ? 14 : 0, paddingBottom: 16 }, children: [_jsx(SourceBoardChip, { post: post, colors: colors }), _jsx(PostMessageBlock, { message: post, colors: colors, original: true }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 14 }, children: [_jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, letterSpacing: 0.5, color: colors.textSoft }, children: [replies.length, " ", replies.length === 1 ? 'REPLY' : 'REPLIES'] }), _jsx(react_native_1.View, { style: { flex: 1, height: 1, backgroundColor: colors.border } })] }), _jsx(react_native_1.View, { style: { gap: 16 }, children: replies.map((reply) => (_jsx(PostMessageBlock, { message: reply, colors: colors }, reply.id))) })] }));
        return (_jsxs(react_native_1.View, { style: { flex: fullScreen ? 1 : undefined, backgroundColor: colors.page }, children: [!fullScreen ? (_jsxs(react_native_1.View, { style: { paddingHorizontal: 4, paddingTop: 6, paddingBottom: 14, gap: 8 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.orange }, children: post.sourceLabel }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 24, lineHeight: 29, color: colors.text }, children: "Post" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, lineHeight: 20, color: colors.textMuted }, children: post.sourceSubtitle })] })) : null, fullScreen ? (_jsxs(_Fragment, { children: [_jsx(react_native_1.ScrollView, { style: { flex: 1 }, contentContainerStyle: { paddingBottom: 16 }, keyboardShouldPersistTaps: "handled", showsVerticalScrollIndicator: false, children: content }), _jsx(ThreadReplyComposer, { colors: colors, bottomInset: bottomInset })] })) : (_jsxs(react_native_1.View, { style: {
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.card,
                        overflow: 'hidden',
                    }, children: [content, _jsx(ThreadReplyComposer, { colors: colors, bottomInset: 0, compact: true })] }))] }));
    }
    function SourceBoardChip({ post, colors }) {
        const isEvent = post.groupKind === 'event';
        return (_jsxs(react_native_1.View, { style: {
                alignSelf: 'flex-start',
                borderRadius: 999,
                backgroundColor: colors.orangeSoft,
                paddingHorizontal: 11,
                paddingVertical: 7,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
            }, children: [isEvent ? (_jsx(lucide_react_native_1.CalendarDays, { size: 13, color: colors.orange, strokeWidth: 2.3 })) : (_jsx(lucide_react_native_1.Building2, { size: 13, color: colors.orange, strokeWidth: 2.3 })), _jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.orange }, children: [post.sourceTitle, " - Board"] })] }));
    }
    function PostMessageBlock({ message, colors, original = false, }) {
        const reactions = message.reactions ?? [];
        return (_jsxs(react_native_1.View, { style: { flexDirection: 'row', gap: original ? 12 : 10 }, children: [_jsx(ui_1.Avatar, { name: message.author.name, initials: message.author.initials, size: original ? 42 : 34, backgroundColor: message.author.accentColor }), _jsxs(react_native_1.View, { style: { flex: 1, minWidth: 0 }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: original ? 15 : 13, color: colors.text }, children: message.author.name }), message.author.verification === 'sevak' ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: '#C2410C' }, children: "SEVAK" })) : null, message.pinned ? (_jsx(react_native_1.View, { style: { borderRadius: 999, backgroundColor: colors.panel, paddingHorizontal: 8, paddingVertical: 3 }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted }, children: "Pinned" }) })) : null, _jsx(react_native_1.Text, { style: { marginLeft: 'auto', fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSoft }, children: message.timestamp })] }), _jsx(react_native_1.Text, { style: {
                                marginTop: original ? 8 : 5,
                                fontFamily: 'Inclusive Sans',
                                fontSize: original ? 16 : 14,
                                lineHeight: original ? 23 : 20,
                                color: colors.textMuted,
                            }, children: message.body }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginTop: 10 }, children: [reactions.map((reaction, index) => (_jsx(ReactionChip, { emoji: reaction.emoji, count: reaction.count, colors: colors, active: index === 0 }, `${reaction.emoji}-${index}`))), original ? (_jsx(react_native_1.View, { style: {
                                        borderRadius: 999,
                                        borderWidth: 1,
                                        borderStyle: 'dashed',
                                        borderColor: colors.border,
                                        paddingHorizontal: 10,
                                        paddingVertical: 5,
                                    }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSoft }, children: "+ React" }) })) : null] })] })] }));
    }
    function ReactionChip({ emoji, count, colors, active, }) {
        return (_jsxs(react_native_1.View, { style: {
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? colors.borderStrong : colors.border,
                backgroundColor: active ? colors.orangeSoft : colors.panel,
                paddingHorizontal: 10,
                paddingVertical: 5,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
            }, children: [_jsx(react_native_1.Text, { style: { fontSize: 13 }, children: emoji }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }, children: count })] }));
    }
    function ThreadReplyComposer({ colors, bottomInset, compact = false, }) {
        return (_jsx(react_native_1.View, { style: {
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: colors.surface,
                paddingTop: compact ? 9 : 10,
                paddingHorizontal: 12,
                paddingBottom: compact ? 12 : Math.max(bottomInset, 8) + 8,
            }, children: _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8 }, children: [_jsx(ui_1.Avatar, { name: "Aditi Mehta", initials: "AM", size: 30, backgroundColor: "#0478A5" }), _jsx(react_native_1.View, { style: {
                            flex: 1,
                            minHeight: 38,
                            borderRadius: 19,
                            backgroundColor: colors.panel,
                            paddingHorizontal: 14,
                            justifyContent: 'center',
                        }, children: _jsx(react_native_1.TextInput, { editable: false, placeholder: "Reply...", placeholderTextColor: colors.textSoft, style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.text } }) }), _jsx(react_native_1.View, { style: {
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: colors.orange,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }, children: _jsx(lucide_react_native_1.Send, { size: 15, color: "#FFFFFF" }) })] }) }));
    }
    function FeedHeader({ query, colors, mobileInDetail, onBack, onChangeQuery, }) {
        if (mobileInDetail) {
            return (_jsxs(react_native_1.Pressable, { onPress: onBack, style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    alignSelf: 'flex-start',
                    paddingVertical: 4,
                }, children: [_jsx(lucide_react_native_1.ArrowLeft, { size: 18, color: colors.textMuted }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.textMuted }, children: "Back" })] }));
        }
        return (_jsx(react_native_1.View, { style: { gap: 10 }, children: _jsx(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }, children: _jsxs(react_native_1.View, { style: {
                        flex: 1,
                        minHeight: 42,
                        borderRadius: 14,
                        backgroundColor: colors.panel,
                        paddingHorizontal: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                    }, children: [_jsx(lucide_react_native_1.Search, { size: 17, color: colors.textSoft }), _jsx(react_native_1.TextInput, { value: query, onChangeText: onChangeQuery, placeholder: "Search posts, people, groups", placeholderTextColor: colors.textSoft, style: {
                                flex: 1,
                                fontFamily: 'Inclusive Sans',
                                fontSize: 15,
                                color: colors.text,
                                paddingVertical: 9,
                            } })] }) }) }));
    }
    function NativeChatHeader({ colors, insetsTop, title, subtitle, hideAvatar, onBack, }) {
        return (_jsx(react_native_1.View, { style: {
                paddingTop: Math.max(insetsTop, 48) + 6,
                paddingHorizontal: 14,
                paddingBottom: 10,
                backgroundColor: colors.surface,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
            }, children: _jsxs(react_native_1.View, { style: { minHeight: 52, flexDirection: 'row', alignItems: 'center' }, children: [_jsxs(react_native_1.Pressable, { onPress: onBack, hitSlop: 10, style: {
                            width: 82,
                            minHeight: 42,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                        }, children: [_jsx(lucide_react_native_1.ArrowLeft, { size: 21, color: colors.orange }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.orange }, children: "Back" })] }), _jsxs(react_native_1.View, { style: { flex: 1, alignItems: 'center', gap: 4 }, children: [hideAvatar ? null : null, _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }, numberOfLines: 1, children: title }), subtitle ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textSoft }, numberOfLines: 1, children: subtitle })) : null] }), _jsx(react_native_1.View, { style: { width: 82 } })] }) }));
    }
    function CreatePostSheet({ visible, colors, groups, onClose, }) {
        const [body, setBody] = react_1.useState('');
        const [groupId, setGroupId] = react_1.useState();
        const [groupPickerOpen, setGroupPickerOpen] = react_1.useState(false);
        const sortedGroups = react_1.useMemo(() => {
            return [...groups].sort((a, b) => {
                if (a.kind !== b.kind)
                    return a.kind === 'center' ? -1 : 1;
                return a.title.localeCompare(b.title);
            });
        }, [groups]);
        const selectedGroup = sortedGroups.find((group) => group.id === groupId) ?? sortedGroups[0];
        react_1.useEffect(() => {
            if (!visible) {
                setBody('');
                setGroupPickerOpen(false);
                return;
            }
            if (!groupId && sortedGroups[0]) {
                setGroupId(sortedGroups[0].id);
            }
        }, [visible, groupId, sortedGroups]);
        const canPost = body.trim().length > 0 && !!selectedGroup;
        const handlePost = () => {
            if (!canPost)
                return;
            onClose();
        };
        return (_jsx(react_native_1.Modal, { visible: visible, animationType: "slide", presentationStyle: react_native_1.Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen', transparent: react_native_1.Platform.OS !== 'ios', onRequestClose: onClose, children: _jsxs(react_native_1.KeyboardAvoidingView, { behavior: react_native_1.Platform.OS === 'ios' ? 'padding' : undefined, style: { flex: 1, backgroundColor: colors.page }, children: [_jsxs(react_native_1.View, { style: {
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 16,
                            paddingTop: react_native_1.Platform.OS === 'ios' ? 14 : 18,
                            paddingBottom: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                        }, children: [_jsx(react_native_1.Pressable, { onPress: onClose, hitSlop: 8, style: { minWidth: 64 }, children: _jsx(lucide_react_native_1.X, { size: 22, color: colors.textMuted }) }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 16, color: colors.text }, children: "New post" }), _jsx(react_native_1.Pressable, { disabled: !canPost, onPress: handlePost, hitSlop: 8, style: {
                                    minWidth: 64,
                                    alignItems: 'flex-end',
                                    opacity: canPost ? 1 : 0.4,
                                }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.orange }, children: "Post" }) })] }), _jsxs(react_native_1.ScrollView, { style: { flex: 1 }, contentContainerStyle: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }, keyboardShouldPersistTaps: "handled", children: [_jsxs(react_native_1.View, { style: { marginBottom: 14 }, children: [_jsx(react_native_1.Text, { style: {
                                            fontFamily: 'Inclusive Sans',
                                            fontSize: 11,
                                            letterSpacing: 0.8,
                                            color: colors.textSoft,
                                            marginBottom: 8,
                                        }, children: "POST TO" }), _jsxs(react_native_1.Pressable, { onPress: () => setGroupPickerOpen((open) => !open), style: {
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 10,
                                            paddingHorizontal: 12,
                                            paddingVertical: 11,
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            backgroundColor: colors.card,
                                        }, children: [_jsx(react_native_1.View, { style: {
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: 9,
                                                    backgroundColor: colors.orangeSoft,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }, children: selectedGroup?.kind === 'event' ? (_jsx(lucide_react_native_1.CalendarDays, { size: 14, color: colors.orange, strokeWidth: 2.4 })) : (_jsx(lucide_react_native_1.Building2, { size: 14, color: colors.orange, strokeWidth: 2.4 })) }), _jsxs(react_native_1.View, { style: { flex: 1, minWidth: 0 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }, numberOfLines: 1, children: selectedGroup ? selectedGroup.title : 'Pick a group' }), selectedGroup ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSoft }, numberOfLines: 1, children: selectedGroup.kind === 'event' ? 'Event board' : 'Center board' })) : null] }), _jsx(lucide_react_native_1.ChevronDown, { size: 16, color: colors.textSoft })] }), groupPickerOpen ? (_jsx(react_native_1.View, { style: {
                                            marginTop: 8,
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            backgroundColor: colors.card,
                                            overflow: 'hidden',
                                        }, children: sortedGroups.map((group, index) => {
                                            const active = group.id === selectedGroup?.id;
                                            return (_jsxs(react_native_1.Pressable, { onPress: () => {
                                                    setGroupId(group.id);
                                                    setGroupPickerOpen(false);
                                                }, style: {
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                    paddingHorizontal: 12,
                                                    paddingVertical: 11,
                                                    backgroundColor: active ? colors.orangeSoft : colors.card,
                                                    borderBottomWidth: index < sortedGroups.length - 1 ? 1 : 0,
                                                    borderBottomColor: colors.border,
                                                }, children: [_jsx(react_native_1.View, { style: {
                                                            width: 24,
                                                            height: 24,
                                                            borderRadius: 7,
                                                            backgroundColor: colors.panel,
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }, children: group.kind === 'event' ? (_jsx(lucide_react_native_1.CalendarDays, { size: 12, color: colors.textMuted, strokeWidth: 2.3 })) : (_jsx(lucide_react_native_1.Building2, { size: 12, color: colors.textMuted, strokeWidth: 2.3 })) }), _jsx(react_native_1.Text, { style: {
                                                            flex: 1,
                                                            fontFamily: active ? 'Inclusive Sans' : 'Inclusive Sans',
                                                            fontSize: 14,
                                                            color: colors.text,
                                                        }, numberOfLines: 1, children: group.title })] }, group.id));
                                        }) })) : null] }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', gap: 12, marginTop: 4 }, children: [_jsx(ui_1.Avatar, { name: "You", initials: "YO", size: 38, backgroundColor: colors.orange }), _jsx(react_native_1.View, { style: { flex: 1, minWidth: 0 }, children: _jsx(react_native_1.TextInput, { autoFocus: true, multiline: true, value: body, onChangeText: setBody, placeholder: selectedGroup?.kind === 'event'
                                                ? `Share something with ${selectedGroup.title}...`
                                                : 'Share something with your center...', placeholderTextColor: colors.textSoft, style: {
                                                minHeight: 160,
                                                fontFamily: 'Inclusive Sans',
                                                fontSize: 16,
                                                lineHeight: 23,
                                                color: colors.text,
                                                textAlignVertical: 'top',
                                                paddingTop: 6,
                                            } }) })] }), _jsxs(react_native_1.Text, { style: {
                                    marginTop: 16,
                                    fontFamily: 'Inclusive Sans',
                                    fontSize: 12.5,
                                    color: colors.textSoft,
                                    lineHeight: 18,
                                }, children: ["Visible to verified members in ", selectedGroup?.title || 'your group', "."] })] })] }) }));
    }
    function EmptyPanel({ title, subtitle, colors }) {
        return (_jsxs(react_native_1.View, { style: { paddingVertical: 18, paddingHorizontal: 4, gap: 5 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 17, color: colors.text }, children: title }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, lineHeight: 20, color: colors.textMuted }, children: subtitle })] }));
    }
    function SignInCallout({ colors, onPress }) {
        return (_jsxs(react_native_1.View, { style: {
                backgroundColor: colors.orangeSoft,
                borderRadius: 18,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
            }, children: [_jsx(react_native_1.View, { style: {
                        width: 42,
                        height: 42,
                        borderRadius: 15,
                        backgroundColor: colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }, children: _jsx(lucide_react_native_1.UsersRound, { size: 20, color: colors.orange }) }), _jsxs(react_native_1.View, { style: { flex: 1 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 16, color: colors.text }, children: "Sign in for Feed" }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, lineHeight: 19, color: colors.textMuted }, children: "Your member feed, group boards, and announcements live here." })] }), _jsx(react_native_1.Pressable, { onPress: onPress, style: {
                        backgroundColor: colors.text,
                        borderRadius: 999,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                    }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.surface }, children: "Sign in" }) })] }));
    }
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
            function (react_native_safe_area_context_1_1) {
                react_native_safe_area_context_1 = react_native_safe_area_context_1_1;
            },
            function (lucide_react_native_1_1) {
                lucide_react_native_1 = lucide_react_native_1_1;
            },
            function (posthog_react_native_1_1) {
                posthog_react_native_1 = posthog_react_native_1_1;
            },
            function (ui_1_1) {
                ui_1 = ui_1_1;
            },
            function (contexts_1_1) {
                contexts_1 = contexts_1_1;
            },
            function (HeaderActionContext_1_1) {
                HeaderActionContext_1 = HeaderActionContext_1_1;
            },
            function (useApiData_1_1) {
                useApiData_1 = useApiData_1_1;
            },
            function (addressParsing_1_1) {
                addressParsing_1 = addressParsing_1_1;
            },
            function (connect_1_1) {
                connect_1 = connect_1_1;
            }
        ],
        execute: function () {
        }
    };
});
