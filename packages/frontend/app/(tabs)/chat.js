System.register(["react/jsx-runtime", "react", "react-native", "expo-router", "react-native-safe-area-context", "lucide-react-native", "posthog-react-native", "../../components/ui", "../../components/contexts", "../../components/connect"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, expo_router_1, react_native_safe_area_context_1, lucide_react_native_1, posthog_react_native_1, ui_1, contexts_1, connect_1;
    var __moduleName = context_1 && context_1.id;
    function dmToConversation(thread) {
        return {
            id: `dm-${thread.id}`,
            type: 'dm',
            title: thread.person.name,
            subtitle: thread.connectedSince,
            preview: thread.preview,
            lastActiveLabel: thread.lastActiveLabel,
            unread: thread.unread,
            avatarName: thread.person.name,
            avatarInitials: thread.person.initials,
            avatarColor: thread.person.accentColor,
            messages: thread.messages,
        };
    }
    function mockGroupChatToConversation(chat) {
        return {
            id: `groupchat-${chat.id}`,
            type: 'group',
            title: chat.title,
            subtitle: `${chat.kind === 'event' ? 'Event chat' : 'Center chat'} · ${chat.memberCount} members`,
            preview: chat.preview,
            lastActiveLabel: chat.lastActiveLabel,
            unread: chat.unreadCount > 0,
            groupKind: chat.kind,
            groupMembers: chat.members,
            messages: chat.messages.map((message) => ({
                id: message.id,
                sender: message.sender,
                timestamp: message.timestamp,
                body: message.body,
                authorName: message.authorName,
            })),
        };
    }
    function matchesQuery(value, query) {
        return value.toLowerCase().includes(query.toLowerCase().trim());
    }
    function ChatScreen() {
        const router = expo_router_1.useRouter();
        const navigation = expo_router_1.useNavigation();
        const { user } = contexts_1.useUser();
        const { isDark } = contexts_1.useTheme();
        const { width } = react_native_1.useWindowDimensions();
        const insets = react_native_safe_area_context_1.useSafeAreaInsets();
        const posthog = posthog_react_native_1.usePostHog();
        const detailTranslateX = react_1.useRef(new react_native_1.Animated.Value(width)).current;
        const isDesktop = width >= 980;
        const [query, setQuery] = react_1.useState('');
        const [selectedConversationId, setSelectedConversationId] = react_1.useState('');
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
        const canAccessBoards = !!user;
        const conversations = react_1.useMemo(() => {
            const mockGroupConversations = canAccessBoards
                ? connect_1.groupChats.map(mockGroupChatToConversation)
                : [];
            const dmConversations = connect_1.inboxThreads.map(dmToConversation);
            return [...mockGroupConversations, ...dmConversations];
        }, [canAccessBoards]);
        const filteredConversations = react_1.useMemo(() => {
            if (!query.trim())
                return conversations;
            return conversations.filter((conversation) => matchesQuery(conversation.title, query) ||
                matchesQuery(conversation.preview, query) ||
                matchesQuery(conversation.subtitle, query));
        }, [conversations, query]);
        const selectedConversation = conversations.find((conversation) => conversation.id === selectedConversationId) ??
            conversations[0];
        const mobileConversationOpen = !isDesktop && !!selectedConversationId;
        const nativeDetailOpen = react_native_1.Platform.OS !== 'web' && mobileConversationOpen;
        const listTopPadding = react_native_1.Platform.OS === 'web' ? 20 : Math.max(insets.top, 54) + 16;
        const nativeTabBarStyle = react_1.useMemo(() => ({
            backgroundColor: isDark ? '#171717' : '#FFFFFF',
            borderTopColor: isDark ? '#262626' : '#E7E5E4',
            height: 84,
            paddingTop: 8,
            paddingBottom: 18,
        }), [isDark]);
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
            setSelectedConversationId('');
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
        const openConversation = (id) => {
            posthog?.capture('connect_conversation_selected', { conversationId: id });
            primeNativeDetailTransition();
            setSelectedConversationId(id);
        };
        return (_jsxs(react_native_1.View, { style: { flex: 1, backgroundColor: colors.page }, children: [_jsxs(react_native_1.ScrollView, { contentContainerStyle: {
                        width: '100%',
                        maxWidth: isDesktop ? 1180 : 640,
                        alignSelf: 'center',
                        paddingHorizontal: isDesktop ? 24 : 16,
                        paddingTop: listTopPadding,
                        paddingBottom: react_native_1.Platform.OS === 'web' ? 40 : 112,
                        gap: 12,
                    }, showsVerticalScrollIndicator: false, children: [_jsx(ConnectHeader, { query: query, colors: colors, mobileInDetail: mobileConversationOpen && !nativeDetailOpen, onBack: closeDetail, onChangeQuery: setQuery }), !user ? (_jsx(SignInCallout, { colors: colors, onPress: () => {
                                posthog?.capture('connect_signin_pressed');
                                router.push('/auth');
                            } })) : null, _jsx(MessagesWorkspace, { conversations: filteredConversations, selectedConversation: selectedConversation, colors: colors, isDesktop: isDesktop, nativeDetailOpen: nativeDetailOpen, mobileConversationOpen: mobileConversationOpen, onSelectConversation: openConversation })] }), nativeDetailOpen ? (_jsx(react_native_1.Animated.View, { style: {
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        backgroundColor: colors.surface,
                        transform: [{ translateX: detailTranslateX }],
                    }, children: _jsxs(react_native_1.KeyboardAvoidingView, { behavior: react_native_1.Platform.OS === 'ios' ? 'padding' : undefined, style: { flex: 1, backgroundColor: colors.surface }, children: [_jsx(NativeChatHeader, { colors: colors, insetsTop: insets.top, title: selectedConversation ? selectedConversation.title : 'Chat', subtitle: selectedConversation?.subtitle, avatarName: selectedConversation?.avatarName, avatarInitials: selectedConversation?.avatarInitials, avatarColor: selectedConversation?.avatarColor, groupMembers: selectedConversation?.groupMembers, groupKind: selectedConversation?.groupKind, hideAvatar: !mobileConversationOpen, onBack: closeDetail }), _jsx(react_native_1.View, { style: { flex: 1 }, children: selectedConversation ? (_jsx(ConversationThread, { conversation: selectedConversation, colors: colors, fullScreen: true, bottomInset: insets.bottom })) : null })] }) })) : null] }));
    }
    exports_1("default", ChatScreen);
    function MessagesWorkspace({ conversations, selectedConversation, colors, isDesktop, nativeDetailOpen, mobileConversationOpen, onSelectConversation, }) {
        if (isDesktop) {
            return (_jsxs(react_native_1.View, { style: { flexDirection: 'row', gap: 18, alignItems: 'flex-start' }, children: [_jsx(react_native_1.View, { style: { width: 360 }, children: _jsx(ConversationList, { conversations: conversations, selectedConversationId: selectedConversation?.id, colors: colors, onSelectConversation: onSelectConversation }) }), _jsx(react_native_1.View, { style: { flex: 1, minWidth: 0 }, children: selectedConversation ? (_jsx(ConversationThread, { conversation: selectedConversation, colors: colors })) : (_jsx(EmptyPanel, { title: "No messages found", subtitle: "Try a different search.", colors: colors })) })] }));
        }
        if (mobileConversationOpen && !nativeDetailOpen && selectedConversation) {
            return _jsx(ConversationThread, { conversation: selectedConversation, colors: colors });
        }
        return (_jsxs(react_native_1.View, { style: { gap: 14 }, children: [_jsx(RequestsBanner, { colors: colors }), _jsx(ConversationList, { conversations: conversations, selectedConversationId: selectedConversation?.id, colors: colors, onSelectConversation: onSelectConversation })] }));
    }
    function NativeChatHeader({ colors, insetsTop, title, subtitle, avatarName, avatarInitials, avatarColor, groupMembers, groupKind, hideAvatar, onBack, }) {
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
                        }, children: [_jsx(lucide_react_native_1.ArrowLeft, { size: 21, color: colors.orange }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.orange }, children: "Back" })] }), _jsxs(react_native_1.View, { style: { flex: 1, alignItems: 'center', gap: 4 }, children: [hideAvatar ? null : groupMembers && groupMembers.length > 0 ? (_jsx(GroupConversationAvatar, { members: groupMembers, size: 36, colors: colors })) : groupKind ? (_jsx(GroupIcon, { kind: groupKind, colors: colors, active: true })) : (_jsx(ui_1.Avatar, { name: avatarName || title, initials: avatarInitials, size: 34, backgroundColor: avatarColor })), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }, numberOfLines: 1, children: title }), subtitle ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textSoft }, numberOfLines: 1, children: subtitle })) : null] }), _jsx(react_native_1.View, { style: { width: 82 } })] }) }));
    }
    function ConnectHeader({ query, colors, mobileInDetail, onBack, onChangeQuery, }) {
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
                    }, children: [_jsx(lucide_react_native_1.Search, { size: 17, color: colors.textSoft }), _jsx(react_native_1.TextInput, { value: query, onChangeText: onChangeQuery, placeholder: "Search messages", placeholderTextColor: colors.textSoft, style: {
                                flex: 1,
                                fontFamily: 'Inclusive Sans',
                                fontSize: 15,
                                color: colors.text,
                                paddingVertical: 9,
                            } })] }) }) }));
    }
    function ConversationList({ conversations, selectedConversationId, colors, onSelectConversation, }) {
        return (_jsxs(react_native_1.View, { style: { gap: 2 }, children: [conversations.length === 0 ? (_jsx(EmptyPanel, { title: "No messages found", subtitle: "Try a different search.", colors: colors })) : null, conversations.map((conversation) => (_jsx(react_native_1.Pressable, { onPress: () => onSelectConversation(conversation.id), style: {
                        paddingHorizontal: 4,
                        paddingVertical: 12,
                        borderRadius: 16,
                        backgroundColor: conversation.id === selectedConversationId ? colors.cardActive : 'transparent',
                    }, children: _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 11 }, children: [conversation.type === 'group' && conversation.groupMembers ? (_jsx(GroupConversationAvatar, { members: conversation.groupMembers, size: 44, colors: colors })) : (_jsx(ui_1.Avatar, { name: conversation.avatarName || conversation.title, initials: conversation.avatarInitials, size: 42, backgroundColor: conversation.avatarColor })), _jsxs(react_native_1.View, { style: { flex: 1, gap: 3 }, children: [_jsxs(react_native_1.View, { style: {
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 8,
                                        }, children: [_jsxs(react_native_1.View, { style: {
                                                    flex: 1,
                                                    minWidth: 0,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: 5,
                                                }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.text }, numberOfLines: 1, children: conversation.title }), conversation.type === 'group' && conversation.groupMembers ? (_jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textSoft }, children: ["- ", conversation.groupMembers.length] })) : null] }), _jsx(react_native_1.Text, { style: {
                                                    fontFamily: 'Inclusive Sans',
                                                    fontSize: 12,
                                                    color: conversation.unread ? colors.orange : colors.textSoft,
                                                }, children: conversation.lastActiveLabel })] }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSoft }, numberOfLines: 1, children: conversation.subtitle }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }, numberOfLines: 1, children: conversation.preview })] }), conversation.unread ? (_jsx(react_native_1.View, { style: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.orange } })) : null] }) }, conversation.id)))] }));
    }
    function ConversationThread({ conversation, colors, fullScreen = false, bottomInset = 0, }) {
        const messages = conversation.messages.map((message, index) => {
            const previous = conversation.messages[index - 1];
            const next = conversation.messages[index + 1];
            return (_jsx(MessageBubble, { message: message, previousSender: previous?.sender, nextSender: next?.sender, colors: colors, showAuthor: conversation.type === 'group' }, message.id));
        });
        return (_jsxs(react_native_1.View, { style: {
                flex: fullScreen ? 1 : undefined,
                backgroundColor: fullScreen ? colors.page : 'transparent',
                borderWidth: 0,
                borderColor: 'transparent',
                borderRadius: fullScreen ? 0 : 22,
                overflow: fullScreen ? 'visible' : 'hidden',
            }, children: [!fullScreen ? (_jsxs(react_native_1.View, { style: {
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                    }, children: [conversation.type === 'group' && conversation.groupMembers ? (_jsx(GroupConversationAvatar, { members: conversation.groupMembers, size: 44, colors: colors })) : (_jsx(ui_1.Avatar, { name: conversation.avatarName || conversation.title, initials: conversation.avatarInitials, size: 44, backgroundColor: conversation.avatarColor })), _jsxs(react_native_1.View, { style: { flex: 1 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 18, color: colors.text }, children: conversation.title }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }, children: conversation.subtitle })] })] })) : null, fullScreen ? (_jsxs(_Fragment, { children: [_jsx(react_native_1.ScrollView, { style: { flex: 1 }, contentContainerStyle: {
                                paddingHorizontal: 12,
                                paddingTop: 16,
                                paddingBottom: 18,
                                gap: 6,
                            }, keyboardShouldPersistTaps: "handled", showsVerticalScrollIndicator: false, children: messages }), _jsx(ChatComposer, { colors: colors, bottomInset: bottomInset, placeholder: conversation.type === 'group'
                                ? 'Message group'
                                : `Message ${conversation.title.split(' ')[0]}` })] })) : (_jsxs(_Fragment, { children: [_jsx(react_native_1.View, { style: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, gap: 6 }, children: messages }), _jsx(ChatComposer, { colors: colors, bottomInset: 0, placeholder: conversation.type === 'group' ? 'Message group' : 'Write a message...', compact: true })] }))] }));
    }
    function MessageBubble({ message, previousSender, nextSender, colors, showAuthor, }) {
        const isYou = message.sender === 'you';
        const isFirstInRun = previousSender !== message.sender;
        const isLastInRun = nextSender !== message.sender;
        const incomingBubble = colors.surface === '#171717' ? '#262626' : '#F5F0EB';
        return (_jsxs(react_native_1.View, { style: { gap: 4, marginTop: isFirstInRun ? 8 : 0 }, children: [isFirstInRun ? (_jsx(react_native_1.Text, { style: {
                        alignSelf: isYou ? 'flex-end' : 'flex-start',
                        paddingHorizontal: 8,
                        fontFamily: 'Inclusive Sans',
                        fontSize: 11,
                        color: colors.textSoft,
                    }, children: showAuthor && !isYou && message.authorName
                        ? `${message.authorName} · ${message.timestamp}`
                        : message.timestamp })) : null, _jsx(react_native_1.View, { style: {
                        alignSelf: isYou ? 'flex-end' : 'flex-start',
                        maxWidth: '78%',
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        backgroundColor: isYou ? colors.orangeSoft : incomingBubble,
                        borderWidth: 1,
                        borderColor: isYou ? colors.borderStrong : colors.border,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        borderBottomLeftRadius: isYou || !isLastInRun ? 20 : 6,
                        borderBottomRightRadius: isYou && isLastInRun ? 6 : 20,
                    }, children: _jsx(react_native_1.Text, { style: {
                            fontFamily: 'Inclusive Sans',
                            fontSize: 15,
                            lineHeight: 21,
                            color: colors.text,
                        }, children: message.body }) })] }));
    }
    function ChatComposer({ colors, bottomInset, placeholder, compact = false, }) {
        return (_jsx(react_native_1.View, { style: {
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: colors.surface,
                paddingTop: compact ? 9 : 10,
                paddingHorizontal: 12,
                paddingBottom: compact ? 12 : Math.max(bottomInset, 8) + 8,
            }, children: _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8 }, children: [_jsx(react_native_1.Pressable, { style: {
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.page,
                            borderWidth: 1,
                            borderColor: colors.border,
                        }, children: _jsx(lucide_react_native_1.Camera, { size: 16, color: colors.textMuted }) }), _jsx(react_native_1.View, { style: {
                            flex: 1,
                            minHeight: 38,
                            borderRadius: 19,
                            backgroundColor: colors.panel,
                            paddingHorizontal: 14,
                            justifyContent: 'center',
                        }, children: _jsx(react_native_1.TextInput, { editable: false, placeholder: placeholder, placeholderTextColor: colors.textSoft, style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.text } }) }), _jsx(react_native_1.View, { style: {
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: colors.orange,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }, children: _jsx(lucide_react_native_1.Send, { size: 15, color: "#FFFFFF" }) })] }) }));
    }
    function RequestsBanner({ colors }) {
        if (connect_1.connectionRequests.length === 0)
            return null;
        const previewNames = connect_1.connectionRequests
            .slice(0, 2)
            .map((request) => request.person.name.split(' ')[0])
            .join(', ');
        const subtitle = `${previewNames}${connect_1.connectionRequests.length > 2 ? ' and others' : ''} · met at recent events`;
        const stackPeople = connect_1.connectionRequests.slice(0, 3).map((request) => request.person);
        return (_jsxs(react_native_1.Pressable, { style: {
                backgroundColor: colors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
            }, children: [_jsx(RequestAvatarStack, { people: stackPeople, colors: colors }), _jsxs(react_native_1.View, { style: { flex: 1, minWidth: 0, gap: 2 }, children: [_jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }, numberOfLines: 1, children: [connect_1.connectionRequests.length, " message", ' ', connect_1.connectionRequests.length === 1 ? 'request' : 'requests'] }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12.5, color: colors.textMuted }, numberOfLines: 1, children: subtitle })] }), _jsx(lucide_react_native_1.ChevronRight, { size: 18, color: colors.textSoft })] }));
    }
    function RequestAvatarStack({ people, colors }) {
        return (_jsx(react_native_1.View, { style: { flexDirection: 'row' }, children: people.map((person, index) => (_jsx(react_native_1.View, { style: {
                    marginLeft: index === 0 ? 0 : -10,
                    borderWidth: 2,
                    borderColor: colors.card,
                    borderRadius: 16,
                }, children: _jsx(ui_1.Avatar, { name: person.name, initials: person.initials, size: 32, backgroundColor: person.accentColor }) }, person.id))) }));
    }
    function GroupConversationAvatar({ members, size = 44, colors, }) {
        const fallbackMember = { id: 'group', name: 'Group', initials: 'G' };
        const shown = members.length > 0 ? members.slice(0, 4) : [fallbackMember];
        const half = size / 2;
        return (_jsx(react_native_1.View, { style: {
                width: size,
                height: size,
                borderRadius: size / 2,
                overflow: 'hidden',
                backgroundColor: colors.panel,
                borderWidth: 1,
                borderColor: colors.border,
            }, children: shown.map((member, index) => (_jsx(react_native_1.View, { style: {
                    position: 'absolute',
                    left: (index % 2) * half,
                    top: Math.floor(index / 2) * half,
                    width: half,
                    height: half,
                    backgroundColor: member.accentColor || colors.orange,
                    alignItems: 'center',
                    justifyContent: 'center',
                }, children: _jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: Math.max(9, half * 0.42),
                        color: '#FFFFFF',
                    }, children: (member.initials || member.name || '?').slice(0, 1).toUpperCase() }) }, `${member.id}-${index}`))) }));
    }
    function GroupIcon({ kind, colors, active, }) {
        return (_jsx(react_native_1.View, { style: {
                width: 42,
                height: 42,
                borderRadius: 15,
                backgroundColor: active ? colors.orange : colors.orangeSoft,
                alignItems: 'center',
                justifyContent: 'center',
            }, children: kind === 'center' ? (_jsx(lucide_react_native_1.Building2, { size: 19, color: active ? '#FFFFFF' : colors.orange })) : (_jsx(lucide_react_native_1.CalendarDays, { size: 19, color: active ? '#FFFFFF' : colors.orange })) }));
    }
    function EmptyPanel({ title, subtitle, colors, }) {
        return (_jsxs(react_native_1.View, { style: { paddingVertical: 18, paddingHorizontal: 4, gap: 5 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 17, color: colors.text }, children: title }), _jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: 14,
                        lineHeight: 20,
                        color: colors.textMuted,
                    }, children: subtitle })] }));
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
                    }, children: _jsx(lucide_react_native_1.UsersRound, { size: 20, color: colors.orange }) }), _jsxs(react_native_1.View, { style: { flex: 1 }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 16, color: colors.text }, children: "Sign in for Connect" }), _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans',
                                fontSize: 13,
                                lineHeight: 19,
                                color: colors.textMuted,
                            }, children: "Your group chats, requests, and DMs live here." })] }), _jsx(react_native_1.Pressable, { onPress: onPress, style: {
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
            function (connect_1_1) {
                connect_1 = connect_1_1;
            }
        ],
        execute: function () {
        }
    };
});
