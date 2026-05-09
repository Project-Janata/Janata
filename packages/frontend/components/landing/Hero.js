System.register(["react/jsx-runtime", "react", "react-native", "expo-router", "../../hooks/useApiData"], function (exports_1, context_1) {
    "use strict";
    var jsx_runtime_1, react_1, react_native_1, expo_router_1, useApiData_1, FALLBACK_EVENT_IMAGES, EVENT_CARD_COLORS, FALLBACK_CARDS, TEAM;
    var __moduleName = context_1 && context_1.id;
    function formatEventDate(date, time) {
        // date is "YYYY-MM-DD"; time is a localized string like "6:00 PM"
        if (!date)
            return time || 'Upcoming';
        const parsed = new Date(`${date}T00:00:00`);
        if (isNaN(parsed.getTime()))
            return time || 'Upcoming';
        const month = parsed.toLocaleDateString('en-US', { month: 'short' });
        const day = parsed.getDate();
        return time ? `${month} ${day} · ${time}` : `${month} ${day}`;
    }
    function shortCenterAddress(address) {
        // Pull "City, State" out of full street address. Falls back to raw address.
        if (!address)
            return '';
        const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
        if (parts.length === 0)
            return '';
        if (parts.length === 1)
            return parts[0];
        // Last part often has "State ZIP" or "Country" — keep state token only
        const last = parts[parts.length - 1];
        const state = last.split(/\s+/)[0];
        const city = parts[parts.length - 2];
        return state ? `${city}, ${state}` : city;
    }
    function buildLiveCards(events, centers) {
        if (events.length === 0 && centers.length === 0)
            return [];
        const todayStr = new Date().toISOString().split('T')[0];
        const upcoming = events
            .filter((e) => !e.date || e.date >= todayStr)
            .sort((a, b) => a.date.localeCompare(b.date));
        const eventCards = upcoming.slice(0, 8).map((e, i) => ({
            type: 'event',
            title: e.title,
            subtitle: formatEventDate(e.date, e.time),
            color: EVENT_CARD_COLORS[i % EVENT_CARD_COLORS.length],
            image: e.image ? { uri: e.image } : FALLBACK_EVENT_IMAGES[i % FALLBACK_EVENT_IMAGES.length],
        }));
        const centerCards = centers.slice(0, 4).map((c) => ({
            type: 'center',
            title: c.name,
            subtitle: shortCenterAddress(c.address),
            color: '#F5F0EB',
            icon: (c.name?.[0] || 'C').toUpperCase(),
        }));
        const totalMembers = centers.reduce((sum, c) => sum + (c.memberCount ?? 0), 0);
        // Count events scheduled in the current calendar month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];
        const eventsThisMonth = events.filter((e) => e.date && e.date >= monthStart && e.date < monthEnd).length;
        const statCards = [];
        if (totalMembers > 0) {
            const formatted = totalMembers.toLocaleString();
            statCards.push({
                type: 'stat',
                title: `${formatted} Members`,
                subtitle: 'Across centers',
                color: '#F0FDF4',
                stat: formatted,
            });
        }
        if (eventsThisMonth > 0) {
            statCards.push({
                type: 'stat',
                title: `${eventsThisMonth} Events`,
                subtitle: 'This month',
                color: '#EFF6FF',
                stat: eventsThisMonth.toString(),
            });
        }
        if (centers.length > 0) {
            const centerCount = centers.length.toString();
            statCards.push({
                type: 'stat',
                title: `${centerCount} Centers`,
                subtitle: 'Worldwide',
                color: '#FFF7ED',
                stat: centerCount,
            });
        }
        // Interleave: event-heavy with centers/stats sprinkled in. Pattern: E,E,C,E,S,E,C,E,M,E,C,E
        const result = [];
        let ei = 0, ci = 0, si = 0;
        const accents = [...statCards]; // mutable queue of stat/map cards
        const ratio = [
            'event',
            'event',
            'center',
            'event',
            'accent',
            'event',
            'center',
            'event',
            'accent',
            'event',
            'center',
            'event',
            'accent',
            'event',
        ];
        for (const slot of ratio) {
            if (slot === 'event' && ei < eventCards.length) {
                result.push(eventCards[ei++]);
            }
            else if (slot === 'center' && ci < centerCards.length) {
                result.push(centerCards[ci++]);
            }
            else if (slot === 'accent' && si < accents.length) {
                result.push(accents[si++]);
            }
        }
        // Append any leftovers so nothing is dropped
        while (ei < eventCards.length)
            result.push(eventCards[ei++]);
        while (ci < centerCards.length)
            result.push(centerCards[ci++]);
        while (si < accents.length)
            result.push(accents[si++]);
        return result;
    }
    function ScrollCard({ card, width }) {
        const isLarge = width >= 240;
        const imageHeight = isLarge ? 132 : 100;
        const titleSize = isLarge ? 15 : 13;
        const subtitleSize = isLarge ? 12 : 11;
        const padding = isLarge ? 16 : 14;
        const radius = isLarge ? 16 : 14;
        const iconBoxSize = isLarge ? 44 : 40;
        const iconFontSize = isLarge ? 18 : 16;
        const statSize = isLarge ? 32 : 28;
        if (card.type === 'event') {
            return (_jsxs(react_native_1.View, { style: {
                    width,
                    backgroundColor: '#FFFFFF',
                    borderRadius: radius,
                    padding,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }, children: [card.image ? (_jsx(react_native_1.Image, { source: card.image, resizeMode: "cover", style: {
                            width: '100%',
                            height: imageHeight,
                            borderRadius: 8,
                            marginBottom: 10,
                        } })) : (_jsx(react_native_1.View, { style: {
                            width: '100%',
                            height: imageHeight,
                            borderRadius: 8,
                            backgroundColor: card.color,
                            marginBottom: 10,
                        } })), _jsx(react_native_1.Text, { style: {
                            fontFamily: 'Inclusive Sans, sans-serif',
                            fontWeight: '600',
                            fontSize: titleSize,
                            color: '#1C1917',
                            marginBottom: 3,
                        }, children: card.title }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans, sans-serif', fontSize: subtitleSize, color: '#78716C' }, children: card.subtitle })] }));
        }
        if (card.type === 'center') {
            return (_jsxs(react_native_1.View, { style: {
                    width,
                    backgroundColor: '#FFFFFF',
                    borderRadius: radius,
                    padding,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }, children: [_jsx(react_native_1.View, { style: {
                            width: iconBoxSize,
                            height: iconBoxSize,
                            borderRadius: 10,
                            backgroundColor: card.color,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }, children: _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans, sans-serif',
                                fontWeight: '700',
                                fontSize: iconFontSize,
                                color: '#C2410C',
                            }, children: card.icon }) }), _jsxs(react_native_1.View, { style: { flex: 1 }, children: [_jsx(react_native_1.Text, { style: {
                                    fontFamily: 'Inclusive Sans, sans-serif',
                                    fontWeight: '600',
                                    fontSize: titleSize,
                                    color: '#1C1917',
                                    marginBottom: 2,
                                }, children: card.title }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans, sans-serif', fontSize: subtitleSize, color: '#78716C' }, children: card.subtitle })] })] }));
        }
        // stat card
        return (_jsxs(react_native_1.View, { style: {
                width,
                backgroundColor: '#FFFFFF',
                borderRadius: radius,
                padding,
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }, children: [_jsx(react_native_1.Text, { style: {
                        fontFamily: '"Inclusive Sans", sans-serif',
                        fontWeight: '400',
                        fontSize: statSize,
                        color: '#C2410C',
                        marginBottom: 2,
                    }, children: card.stat }), _jsx(react_native_1.Text, { style: {
                        fontFamily: 'Inclusive Sans, sans-serif',
                        fontWeight: '600',
                        fontSize: titleSize,
                        color: '#1C1917',
                        marginBottom: 2,
                    }, children: card.title.replace(card.stat + ' ', '') }), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans, sans-serif', fontSize: subtitleSize, color: '#78716C' }, children: card.subtitle })] }));
    }
    function InfiniteScrollColumn({ cards, speed, offset, cardWidth, height, }) {
        // Duplicate cards for seamless loop
        const doubled = [...cards, ...cards];
        return (_jsx(react_native_1.View, { style: { overflow: 'hidden', height, marginTop: offset, paddingHorizontal: 14 }, children: _jsx("div", { style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    animation: `heroScroll ${speed}s linear infinite`,
                }, children: doubled.map((card, i) => (_jsx(ScrollCard, { card: card, width: cardWidth }, `${card.title}-${i}`))) }) }));
    }
    function AvatarStack() {
        return (_jsx(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center' }, children: TEAM.map((person, i) => (_jsxs("div", { className: "avatar-wrap", style: { marginLeft: i > 0 ? -10 : 0, cursor: 'default', zIndex: TEAM.length - i }, children: [_jsx("div", { className: "avatar-tooltip", children: person.name }), person.image ? (_jsx(react_native_1.Image, { source: person.image, style: {
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            borderWidth: 2,
                            borderColor: '#FAFAF7',
                        } })) : (_jsx(react_native_1.View, { style: {
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: person.color,
                            borderWidth: 2,
                            borderColor: '#FAFAF7',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }, children: _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans, sans-serif', fontWeight: '600', fontSize: 14, color: '#FFFFFF' }, children: person.name[0] }) }))] }, person.name))) }));
    }
    function HorizontalScrollRow({ cards }) {
        const doubled = [...cards, ...cards];
        return (_jsx(react_native_1.View, { style: { overflow: 'hidden', marginTop: 32, marginHorizontal: -20, position: 'relative', paddingVertical: 14 }, children: _jsx("div", { style: {
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 14,
                    animation: `heroScrollHorizontal 25s linear infinite`,
                }, children: doubled.map((card, i) => (_jsx(react_native_1.View, { style: { flexShrink: 0 }, children: _jsx(ScrollCard, { card: card, width: 220 }) }, `${card.title}-h-${i}`))) }) }));
    }
    function Hero() {
        const router = expo_router_1.useRouter();
        const { width } = react_native_1.useWindowDimensions();
        const isMobile = width < 768;
        const isTablet = width >= 768 && width < 1024;
        const { events } = useApiData_1.useEventList();
        const { centers } = useApiData_1.useCenterList();
        // Build live cards once data arrives. Need at least 6 to look reasonable in the
        // multi-column scroller; otherwise fall back to the curated set so the hero never
        // looks sparse during loading or in degraded states.
        const cards = react_1.useMemo(() => {
            const live = buildLiveCards(events, centers);
            return live.length >= 6 ? live : FALLBACK_CARDS;
        }, [events, centers]);
        // Estimate the right column's width so the floating card area never extends
        // past it into the headline text. The hero uses two flex:1 columns with
        // leftCol capped at maxWidth 560 — mirror that here so the cards fit.
        const heroPaddingTop = isMobile ? 60 : 100;
        const heroPaddingBottom = isMobile ? 40 : 80;
        const heroPaddingLeft = isMobile ? 20 : isTablet ? 40 : 80;
        const heroPaddingRight = isMobile ? 20 : 0;
        const cardsRightOffset = isTablet ? 54 : 34;
        const colGap = 14;
        const colInnerPadding = 14; // matches InfiniteScrollColumn paddingHorizontal
        const availInner = Math.max(0, width - heroPaddingLeft - heroPaddingRight);
        const leftColW = Math.min(560, availInner / 2);
        const rightColW = Math.max(0, availInner - leftColW);
        // The container is right-anchored with `right: -cardsRightOffset`, so its
        // width may exceed the right column by exactly that offset before its left
        // edge crosses into the leftCol.
        const maxCardsContainer = Math.floor(rightColW + cardsRightOffset);
        const fits = (cols, cw) => cols * cw + colInnerPadding * 2 * cols + colGap * (cols - 1) <= maxCardsContainer;
        let numColumns = 2;
        let cardWidth = 220;
        if (fits(3, 280)) {
            numColumns = 3;
            cardWidth = 280;
        }
        else if (fits(3, 260)) {
            numColumns = 3;
            cardWidth = 260;
        }
        else if (fits(3, 240)) {
            numColumns = 3;
            cardWidth = 240;
        }
        else if (fits(2, 280)) {
            numColumns = 2;
            cardWidth = 280;
        }
        else if (fits(2, 260)) {
            numColumns = 2;
            cardWidth = 260;
        }
        else if (fits(2, 240)) {
            numColumns = 2;
            cardWidth = 240;
        }
        else if (fits(2, 220)) {
            numColumns = 2;
            cardWidth = 220;
        }
        else {
            numColumns = 2;
            cardWidth = Math.max(180, Math.floor((maxCardsContainer - colInnerPadding * 4 - colGap) / 2));
        }
        const cardsContainerWidth = numColumns * cardWidth + colInnerPadding * 2 * numColumns + colGap * (numColumns - 1);
        const cardColumns = react_1.useMemo(() => {
            const cols = Array.from({ length: numColumns }, () => []);
            cards.forEach((card, i) => {
                cols[i % numColumns].push(card);
            });
            return cols;
        }, [cards, numColumns]);
        // Column scrollers must comfortably exceed the visible hero so a full
        // animation cycle is always covered as the cards translate vertically.
        const columnHeight = 1100;
        return (_jsxs(react_native_1.View, { style: {
                position: 'relative',
                overflow: 'hidden',
                paddingTop: heroPaddingTop,
                paddingBottom: heroPaddingBottom,
                paddingLeft: heroPaddingLeft,
                paddingRight: heroPaddingRight,
                minHeight: isMobile ? undefined : 656,
                backgroundColor: '#FAFAF7',
                flexDirection: isMobile ? 'column' : 'row',
            }, children: [_jsxs(react_native_1.View, { style: { flex: isMobile ? undefined : 1, maxWidth: isMobile ? undefined : 560, zIndex: 1 }, children: [_jsxs(react_native_1.View, { style: {
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 16,
                            }, children: [_jsx(react_native_1.View, { style: {
                                        backgroundColor: '#FFF7ED',
                                        borderWidth: 1,
                                        borderColor: '#FDBA74',
                                        paddingHorizontal: 10,
                                        paddingVertical: 4,
                                        borderRadius: 100,
                                    }, children: _jsx(react_native_1.Text, { style: {
                                            fontFamily: 'Inclusive Sans, sans-serif',
                                            fontWeight: '600',
                                            fontSize: 12,
                                            color: '#C2410C',
                                        }, children: "Beta" }) }), _jsx(react_native_1.Text, { style: {
                                        fontFamily: 'Inclusive Sans, sans-serif',
                                        fontSize: 13,
                                        color: '#A8A29E',
                                    }, children: "Currently available on web" })] }), _jsx(react_native_1.Text, { style: {
                                fontFamily: '"Inclusive Sans", sans-serif',
                                fontWeight: '400',
                                fontSize: isMobile ? 42 : isTablet ? 56 : 72,
                                lineHeight: isMobile ? 48 : isTablet ? 64 : 80,
                                letterSpacing: -0.02 * (isMobile ? 42 : isTablet ? 56 : 72),
                                color: '#1C1917',
                                marginBottom: 24,
                            }, children: 'Find your center.\nGrow together.' }), _jsx(react_native_1.Text, { style: {
                                fontFamily: 'Inclusive Sans, sans-serif',
                                fontWeight: '400',
                                fontSize: isMobile ? 16 : 20,
                                lineHeight: isMobile ? 26 : 32,
                                color: '#78716C',
                                marginBottom: 40,
                                maxWidth: 480,
                            }, children: "One place where any CHYK can find events and centers nearby, RSVP in a tap, and run their own events without juggling five group chats." }), _jsx(react_native_1.View, { style: {
                                flexDirection: isMobile ? 'column' : 'row',
                                gap: 16,
                                marginBottom: 48,
                            }, children: _jsx(react_native_1.Pressable, { onPress: () => router.push('/(tabs)'), className: "bg-primary active:bg-primary-press rounded-full", style: {
                                    paddingHorizontal: 28,
                                    paddingVertical: 14,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    ...(isMobile ? { width: '100%' } : {}),
                                }, children: _jsx(react_native_1.Text, { style: {
                                        fontFamily: 'Inclusive Sans, sans-serif',
                                        fontWeight: '500',
                                        fontSize: 16,
                                        color: '#FFFFFF',
                                    }, children: "Start Exploring \u2192" }) }) }), _jsxs(react_native_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 12 }, children: [_jsx(AvatarStack, {}), _jsx(react_native_1.Text, { style: { fontFamily: 'Inclusive Sans, sans-serif', fontSize: 14, color: '#78716C' }, children: "By CHYKs, for CHYKs." })] })] }), !isMobile && (_jsxs(react_native_1.View, { style: {
                        flex: 1,
                        position: 'relative',
                        minHeight: 560 + heroPaddingTop + heroPaddingBottom,
                        overflow: 'hidden',
                        paddingHorizontal: 14,
                        marginTop: -heroPaddingTop,
                        marginBottom: -heroPaddingBottom,
                    }, children: [_jsx(react_native_1.View, { style: {
                                position: 'absolute',
                                top: -120,
                                right: -cardsRightOffset,
                                width: cardsContainerWidth,
                                height: columnHeight + 200,
                                transform: 'rotate(-4deg)',
                                flexDirection: 'row',
                                gap: colGap,
                            }, children: cardColumns.map((colCards, i) => {
                                const speeds = [30, 25, 28];
                                const offsets = [0, -60, -30];
                                return (_jsx(InfiniteScrollColumn, { cards: colCards, cardWidth: cardWidth, height: columnHeight, speed: speeds[i % speeds.length], offset: offsets[i % offsets.length] }, i));
                            }) }), _jsx("div", { style: {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 120,
                                zIndex: 2,
                                pointerEvents: 'none',
                                background: 'linear-gradient(180deg, #FAFAF7 20%, rgba(250, 250, 247, 0))',
                            } }), _jsx("div", { style: {
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 140,
                                zIndex: 2,
                                pointerEvents: 'none',
                                background: 'linear-gradient(0deg, #FAFAF7 15%, rgba(250, 250, 247, 0))',
                            } })] }))] }));
    }
    exports_1("Hero", Hero);
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
            function (useApiData_1_1) {
                useApiData_1 = useApiData_1_1;
            }
        ],
        execute: function () {
            // Inject CSS keyframes for the infinite scroll animation (web only)
            if (react_native_1.Platform.OS === 'web' && typeof document !== 'undefined') {
                const id = 'hero-scroll-keyframes';
                if (!document.getElementById(id)) {
                    const style = document.createElement('style');
                    style.id = id;
                    style.textContent = `
      @keyframes heroScroll {
        0% { transform: translateY(0); }
        100% { transform: translateY(-50%); }
      }
      @keyframes heroScrollHorizontal {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .avatar-wrap {
        position: relative;
      }
      .avatar-wrap .avatar-tooltip {
        position: absolute;
        bottom: calc(100% + 6px);
        left: 50%;
        transform: translateX(-50%) scale(0.9);
        background: #1C1917;
        color: #fff;
        font-family: Inter, sans-serif;
        font-size: 11px;
        font-weight: 500;
        padding: 4px 10px;
        border-radius: 6px;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease, transform 0.15s ease;
      }
      .avatar-wrap .avatar-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: #1C1917;
      }
      .avatar-wrap:hover .avatar-tooltip {
        opacity: 1;
        transform: translateX(-50%) scale(1);
      }
      .avatar-wrap {
        transition: transform 0.15s ease, z-index 0s;
        z-index: 0;
      }
      .avatar-wrap:hover {
        transform: scale(1.25);
        z-index: 10;
      }
    `;
                    document.head.appendChild(style);
                }
            }
            FALLBACK_EVENT_IMAGES = [
                require('../../assets/images/landing/Swami Chinmayananda.jpg'),
                require('../../assets/images/landing/youth-group.jpg'),
                require('../../assets/images/landing/vedanta-class.jpg'),
                require('../../assets/images/landing/bala-vihar.jpg'),
                require('../../assets/images/landing/devi-group.jpg'),
                require('../../assets/images/landing/meditation.jpg'),
            ];
            EVENT_CARD_COLORS = ['#FED7AA', '#BFDBFE', '#D9F99D', '#FBCFE8', '#FDE68A', '#E9D5FF'];
            FALLBACK_CARDS = [
                {
                    type: 'event',
                    title: 'Geeta Chanting',
                    subtitle: 'Mar 15 · 6:00 PM',
                    color: '#FED7AA',
                    image: FALLBACK_EVENT_IMAGES[0],
                },
                { type: 'center', title: 'CM San Jose', subtitle: 'San Jose, CA', color: '#F5F0EB', icon: 'S' },
                { type: 'event', title: 'Youth Retreat', subtitle: 'Apr 2 · 9:00 AM', color: '#BFDBFE', image: FALLBACK_EVENT_IMAGES[1] },
                { type: 'stat', title: '1,240 Members', subtitle: 'Active this month', color: '#F0FDF4', stat: '1,240' },
                { type: 'event', title: 'Vedanta Course', subtitle: 'Mar 22 · 7:00 PM', color: '#D9F99D', image: FALLBACK_EVENT_IMAGES[2] },
                { type: 'center', title: 'CM Houston', subtitle: 'Houston, TX', color: '#F5F0EB', icon: 'H' },
                { type: 'event', title: 'Bala Vihar', subtitle: 'Every Sunday · 10 AM', color: '#FBCFE8', image: FALLBACK_EVENT_IMAGES[3] },
                { type: 'stat', title: '86 Events', subtitle: 'This month', color: '#EFF6FF', stat: '86' },
                { type: 'center', title: 'CM Chicago', subtitle: 'Chicago, IL', color: '#F5F0EB', icon: 'C' },
                { type: 'event', title: 'Devi Group', subtitle: 'Mar 18 · 7:30 PM', color: '#FDE68A', image: FALLBACK_EVENT_IMAGES[4] },
                { type: 'event', title: 'Meditation', subtitle: 'Daily · 6:00 AM', color: '#E9D5FF', image: FALLBACK_EVENT_IMAGES[5] },
            ];
            TEAM = [
                { name: 'Abhiram', image: require('../../assets/images/landing/abhiram.jpg') },
                { name: 'Kish', image: require('../../assets/images/landing/kish.jpg') },
                { name: 'Sahanav', image: require('../../assets/images/landing/sahanav.jpg') },
                { name: 'Divita', image: require('../../assets/images/landing/divita.jpg') },
                { name: 'Pranav', image: require('../../assets/images/landing/pranav.jpg') },
            ];
        }
    };
});
