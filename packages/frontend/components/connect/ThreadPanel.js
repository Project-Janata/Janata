System.register(["react/jsx-runtime", "react-native", "lucide-react-native", "../ui"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_native_1, lucide_react_native_1, ui_1;
    var __moduleName = context_1 && context_1.id;
    function ThreadPanel({ messages, colors, emptyTitle, emptySubtitle, composerPlaceholder, composerState = 'open', lockedTitle, lockedSubtitle, primaryActionLabel, secondaryActionLabel, onPrimaryAction, onSecondaryAction, scrollable = false, bottomInset = 0, visibleLabel, onMessagePress, showComposer = true, showSource = false, }) {
        if (composerState === 'locked') {
            return (_jsx(LockedBoardState, { colors: colors, title: lockedTitle || 'For verified members', subtitle: lockedSubtitle ||
                    "Boards are conversations between verified CHYKs at a center. Get verified and you're in.", primaryActionLabel: primaryActionLabel || 'Redeem invite', secondaryActionLabel: secondaryActionLabel || 'Apply', onPrimaryAction: onPrimaryAction, onSecondaryAction: onSecondaryAction, bottomInset: bottomInset }));
        }
        const content = (_jsxs(react_native_1.View, { children: [showComposer ? (_jsx(BoardComposer, { colors: colors, placeholder: composerPlaceholder, visibleLabel: visibleLabel })) : null, messages.length > 0 ? (_jsx(react_native_1.View, { children: messages.map((message) => (_jsx(BoardPostCard, { message: message, colors: colors, showSource: showSource, onPress: onMessagePress ? () => onMessagePress(message) : undefined }, message.id))) })) : (_jsx(EmptyBoardState, { colors: colors, title: emptyTitle, subtitle: emptySubtitle }))] }));
        return (_jsx(react_native_1.View, { style: { flex: 1, backgroundColor: colors.panelBg }, children: scrollable ? (_jsx(react_native_1.ScrollView, { style: { flex: 1 }, contentContainerStyle: { paddingBottom: Math.max(bottomInset, 0) + 16 }, keyboardShouldPersistTaps: "handled", showsVerticalScrollIndicator: false, children: content })) : (content) }));
    }
    exports_1("ThreadPanel", ThreadPanel);
    function BoardComposer({ colors, placeholder, visibleLabel, }) {
        return (_jsxs(react_native_1.View, { style: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: visibleLabel ? 16 : 10 }, children: [_jsxs(react_native_1.View, { style: {
                        minHeight: 58,
                        borderRadius: 16,
                        backgroundColor: colors.iconBoxBg,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        gap: 12,
                    }, children: [_jsx(ui_1.Avatar, { name: "Aditi Mehta", initials: "AM", size: 36, backgroundColor: "#0478A5" }), _jsx(react_native_1.TextInput, { editable: false, value: "", placeholder: placeholder, placeholderTextColor: colors.textMuted, style: {
                                flex: 1,
                                fontFamily: 'Inclusive Sans',
                                fontSize: 16,
                                color: colors.textSecondary,
                            } })] }), visibleLabel ? (_jsx(react_native_1.Text, { style: {
                        marginTop: 10,
                        fontFamily: 'Inclusive Sans',
                        fontSize: 13,
                        color: colors.textMuted,
                        lineHeight: 19,
                    }, children: visibleLabel })) : null] }));
    }
    function EmptyBoardState({ colors, title, subtitle, }) {
        return (_jsxs(react_native_1.View, { style: {
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 28,
                paddingTop: 72,
                paddingBottom: 88,
                gap: 12,
            }, children: [_jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: 19,
                        color: colors.text,
                        textAlign: 'center',
                    }, children: title }), _jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans',
                        fontSize: 14,
                        color: colors.textSecondary,
                        lineHeight: 22,
                        textAlign: 'center',
                    }, children: subtitle })] }));
    }
    function BoardPostCard({ message, colors, onPress, showSource = false, }) {
        const replies = message.replyCount ?? Math.max(1, message.author.verification === 'sevak' ? 1 : 2);
        const reactions = message.reactions ?? [
            { emoji: message.author.verification === 'sevak' ? '🪔' : '🙏', count: message.author.verification === 'sevak' ? 6 : 2 },
        ];
        const accent = colors.accent ?? '#E8862A';
        const accentSoft = colors.accentSoft ?? '#FFF7ED';
        const isFeedCard = showSource;
        const sourceIcon = message.sourceKind === 'event' ? (_jsx(lucide_react_native_1.CalendarDays, { size: 11, color: accent, strokeWidth: 2.4 })) : (_jsx(lucide_react_native_1.Building2, { size: 11, color: colors.textSecondary, strokeWidth: 2.3 }));
        return (_jsxs(react_native_1.Pressable, { disabled: !onPress, onPress: onPress, style: {
                marginHorizontal: isFeedCard ? 20 : 0,
                marginBottom: isFeedCard ? 12 : 0,
                paddingHorizontal: isFeedCard ? 14 : 20,
                paddingVertical: isFeedCard ? 14 : 18,
                borderRadius: isFeedCard ? 16 : 0,
                borderWidth: isFeedCard ? 1 : 0,
                borderColor: isFeedCard
                    ? message.pinned
                        ? '#FFE0C2'
                        : colors.border
                    : 'transparent',
                borderBottomWidth: isFeedCard ? 1 : 1,
                borderBottomColor: isFeedCard ? (message.pinned ? '#FFE0C2' : colors.border) : colors.border,
                backgroundColor: isFeedCard ? (colors.cardBg ?? '#FFFFFF') : 'transparent',
                shadowColor: message.pinned ? '#C2410C' : '#000000',
                shadowOpacity: isFeedCard ? (message.pinned ? 0.08 : 0.03) : 0,
                shadowRadius: isFeedCard ? 12 : 0,
                shadowOffset: { width: 0, height: 4 },
            }, children: [isFeedCard && message.sourceLabel ? (_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 }, children: [_jsx(react_native_1.View, { style: {
                                width: 20,
                                height: 20,
                                borderRadius: 6,
                                backgroundColor: message.sourceKind === 'event' ? accentSoft : colors.iconBoxBg,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }, children: sourceIcon }), _jsx(react_native_1.Text, { style: {
                                flex: 1,
                                fontFamily: 'Inclusive Sans',
                                fontSize: 12,
                                color: colors.textSecondary,
                            }, numberOfLines: 1, children: message.sourceLabel }), message.pinned ? _jsx(Pill, { label: "Pinned", colors: colors, tone: "accent" }) : null] })) : null, _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, children: [_jsx(ui_1.Avatar, { name: message.author.name, initials: message.author.initials, size: 42, backgroundColor: message.author.accentColor }), _jsxs(react_native_1.View, { style: { flex: 1, gap: 8 }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }, children: [_jsxs(react_native_1.View, { style: { flex: 1 }, children: [_jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }, children: [_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: isFeedCard ? 14 : 16, color: colors.text }, children: message.author.name }), message.author.verification === 'sevak' ? (_jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, letterSpacing: 0.4, color: '#C2410C' }, children: "SEVAK" })) : null, !isFeedCard && message.pinned ? _jsx(Pill, { label: "Pinned", colors: colors }) : null] }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted, marginTop: 2 }, children: message.timestamp })] }), !isFeedCard ? _jsx(lucide_react_native_1.MoreHorizontal, { size: 18, color: colors.textMuted }) : null] }), _jsx(react_native_1.Text, { style: {
                                        fontFamily: 'Inclusive Sans',
                                        fontSize: isFeedCard ? 14 : 17,
                                        lineHeight: isFeedCard ? 20 : 26,
                                        color: colors.textSecondary,
                                    }, children: message.body }), message.attachmentLabel ? (_jsx(react_native_1.View, { style: {
                                        marginTop: 2,
                                        height: 76,
                                        borderRadius: 18,
                                        backgroundColor: colors.iconBoxBg,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSecondary }, children: message.attachmentLabel }) })) : null, _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 }, children: [reactions.map((reaction, index) => (_jsx(ReactionPill, { emoji: reaction.emoji, count: reaction.count, colors: colors, active: index === 0 }, `${reaction.emoji}-${index}`))), _jsx(react_native_1.View, { style: {
                                                borderRadius: 999,
                                                borderWidth: 1,
                                                borderColor: colors.border,
                                                borderStyle: 'dashed',
                                                paddingHorizontal: 12,
                                                paddingVertical: 5,
                                            }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }, children: "+ React" }) }), _jsxs(react_native_1.View, { style: {
                                                marginLeft: isFeedCard ? 'auto' : 0,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 4,
                                            }, children: [isFeedCard ? _jsx(lucide_react_native_1.MessageCircle, { size: 13, color: accent, strokeWidth: 2.3 }) : null, _jsxs(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: accent }, children: [replies, " ", replies === 1 ? 'reply' : 'replies'] })] })] })] })] })] }));
    }
    exports_1("BoardPostCard", BoardPostCard);
    function ReactionPill({ emoji, count, colors, active, }) {
        return (_jsxs(react_native_1.View, { style: {
                borderRadius: 999,
                borderWidth: 1,
                borderColor: active ? colors.accentSoft ?? colors.border : colors.border,
                backgroundColor: active ? colors.accentSoft ?? colors.iconBoxBg : colors.iconBoxBg,
                paddingHorizontal: 10,
                paddingVertical: 5,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
            }, children: [_jsx(react_native_1.Text, { style: { fontSize: 13 }, children: emoji }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textSecondary }, children: count })] }));
    }
    function Pill({ label, colors, tone = 'neutral' }) {
        return (_jsx(react_native_1.View, { style: {
                borderRadius: 999,
                backgroundColor: tone === 'accent' ? colors.accentSoft ?? colors.iconBoxBg : colors.iconBoxBg,
                paddingHorizontal: 9,
                paddingVertical: 3,
            }, children: _jsx(react_native_1.Text, { style: {
                    fontFamily: 'Inclusive Sans',
                    fontSize: 12,
                    color: tone === 'accent' ? colors.accent ?? colors.textSecondary : colors.textSecondary,
                }, children: label }) }));
    }
    function LockedBoardState({ colors, title, subtitle, primaryActionLabel, secondaryActionLabel, onPrimaryAction, onSecondaryAction, bottomInset, }) {
        const accent = colors.accent ?? '#E8862A';
        return (_jsxs(react_native_1.View, { style: {
                flex: 1,
                minHeight: 460,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 26,
                paddingBottom: Math.max(bottomInset, 0) + 32,
                backgroundColor: colors.panelBg,
            }, children: [_jsx(react_native_1.View, { style: {
                        width: 86,
                        height: 86,
                        borderRadius: 43,
                        backgroundColor: colors.iconBoxBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 28,
                    }, children: _jsx(lucide_react_native_1.Lock, { size: 34, color: colors.textMuted, strokeWidth: 1.8 }) }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 21, color: colors.text, textAlign: 'center' }, children: title }), _jsx(react_native_1.Text, { style: {
                        marginTop: 16,
                        maxWidth: 360,
                        fontFamily: 'Inclusive Sans',
                        fontSize: 16,
                        lineHeight: 25,
                        color: colors.textSecondary,
                        textAlign: 'center',
                    }, children: subtitle }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', gap: 10, marginTop: 34, width: '100%', maxWidth: 430 }, children: [_jsx(react_native_1.Pressable, { onPress: onPrimaryAction, style: {
                                flex: 1,
                                minHeight: 50,
                                borderRadius: 999,
                                backgroundColor: accent,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: '#FFFFFF' }, children: primaryActionLabel }) }), _jsx(react_native_1.Pressable, { onPress: onSecondaryAction, style: {
                                flex: 1,
                                minHeight: 50,
                                borderRadius: 999,
                                borderWidth: 1,
                                borderColor: colors.border,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colors.cardBg ?? colors.panelBg,
                            }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.textSecondary }, children: secondaryActionLabel }) })] })] }));
    }
    return {
        setters: [
            function (jsx_runtime_1_1) {
                jsx_runtime_1 = jsx_runtime_1_1;
            },
            function (react_native_1_1) {
                react_native_1 = react_native_1_1;
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
