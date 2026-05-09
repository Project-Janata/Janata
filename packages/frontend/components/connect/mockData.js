System.register([], function (exports_1, context_1) {
    "use strict";
    var people, eventBoards, connectionRequests, connections, inboxThreads, unreadInboxCount, centerBoards, featuredHomeEvent, groupChats;
    var __moduleName = context_1 && context_1.id;
    function buildEventBoard(input) {
        const template = eventBoards[0];
        return {
            ...template,
            id: input.id,
            title: input.title,
            dateLabel: input.dateLabel,
            centerLabel: input.centerLabel,
            attendeesLabel: input.attendeesLabel,
        };
    }
    exports_1("buildEventBoard", buildEventBoard);
    function buildCenterBoard(input) {
        const template = centerBoards[0];
        return {
            ...template,
            id: input.id,
            centerName: input.centerName,
            subtitle: input.subtitle,
        };
    }
    exports_1("buildCenterBoard", buildCenterBoard);
    return {
        setters: [],
        execute: function () {
            people = {
                anjali: {
                    id: 'anjali',
                    name: 'Anjali Desai',
                    initials: 'AD',
                    subtitle: 'Chinmaya San Jose · Stanford GSB',
                    verification: 'member',
                    accentColor: '#0F766E',
                },
                ravi: {
                    id: 'ravi',
                    name: 'Ravi Iyer',
                    initials: 'RI',
                    subtitle: 'San Jose, CA · Apple',
                    verification: 'sevak',
                    accentColor: '#1D4ED8',
                },
                priya: {
                    id: 'priya',
                    name: 'Priya Menon',
                    initials: 'PM',
                    subtitle: 'Burlingame, CA',
                    verification: 'member',
                    accentColor: '#7C3AED',
                },
                karthik: {
                    id: 'karthik',
                    name: 'Karthik Subramanian',
                    initials: 'KS',
                    subtitle: 'Seattle, WA · Microsoft',
                    verification: 'member',
                    accentColor: '#0F766E',
                },
                meera: {
                    id: 'meera',
                    name: 'Meera Krishnan',
                    initials: 'MK',
                    subtitle: 'Chicago, IL · UChicago',
                    verification: 'member',
                    accentColor: '#0369A1',
                },
                vikram: {
                    id: 'vikram',
                    name: 'Vikram Shah',
                    initials: 'VS',
                    subtitle: 'Chinmaya Houston · CHYK since 2019',
                    verification: 'member',
                    accentColor: '#C2410C',
                },
                sneha: {
                    id: 'sneha',
                    name: 'Sneha Pillai',
                    initials: 'SP',
                    subtitle: 'Chinmaya San Jose',
                    verification: 'member',
                    accentColor: '#15803D',
                },
                rohit: {
                    id: 'rohit',
                    name: 'Rohit Patel',
                    initials: 'RP',
                    subtitle: 'Edison, NJ',
                    verification: 'member',
                    accentColor: '#B45309',
                },
                suresh: {
                    id: 'suresh',
                    name: 'Suresh Nair',
                    initials: 'SN',
                    subtitle: 'CCMT · Sevak',
                    verification: 'sevak',
                    accentColor: '#0369A1',
                },
                anand: {
                    id: 'anand',
                    name: 'Anand Raghavan',
                    initials: 'AR',
                    subtitle: 'Chinmaya Saaket',
                    verification: 'member',
                    accentColor: '#7C3AED',
                },
            };
            exports_1("eventBoards", eventBoards = [
                {
                    id: 'gita-12',
                    title: 'Bhagavad Gita Study · Ch. 12',
                    dateLabel: 'SAT, MAY 17',
                    centerLabel: 'Chinmaya San Jose',
                    attendeesLabel: '14 going',
                    preview: 'Anyone driving in from the Peninsula? Happy to coordinate a carpool.',
                    messages: [
                        {
                            id: 'b1',
                            author: people.anjali,
                            timestamp: '2:14 PM',
                            body: 'Anyone driving in from the Peninsula? Happy to coordinate a carpool — I have room for 3.',
                            reactions: [{ emoji: '🚗', count: 4 }, { emoji: '🙏', count: 2 }],
                            replyCount: 2,
                        },
                        {
                            id: 'b2',
                            author: people.ravi,
                            timestamp: '4:02 PM',
                            body: "Quick reminder we're starting at 9:30 sharp this time, not 10. Aarti at 9:00 for those who can make it.",
                            reactions: [{ emoji: '🪔', count: 6 }],
                            replyCount: 1,
                            pinned: true,
                        },
                        {
                            id: 'b3',
                            author: people.priya,
                            timestamp: '8:11 AM',
                            body: "I'd love a ride if you've still got room — I'm in Burlingame.",
                            reactions: [{ emoji: '🙋', count: 3 }],
                            replyCount: 1,
                        },
                        {
                            id: 'b4',
                            author: people.karthik,
                            timestamp: '9:47 AM',
                            body: "Sharing a few photos from last week's session — hope folks who couldn't attend get a feel for it.",
                            attachmentLabel: 'Photo · seva session',
                            reactions: [{ emoji: '📸', count: 5 }],
                            replyCount: 3,
                        },
                    ],
                },
                {
                    id: 'youth-seva',
                    title: 'Youth Seva Day',
                    dateLabel: 'SUN, MAY 25',
                    centerLabel: 'Chinmaya Mission Tri-State',
                    attendeesLabel: '22 going',
                    preview: 'Can someone bring extra gloves and water coolers?',
                    messages: [
                        {
                            id: 's1',
                            author: people.meera,
                            timestamp: 'Yesterday',
                            body: 'Can someone bring extra gloves and water coolers? The park contact said the drinking fountain is unreliable.',
                            reactions: [{ emoji: '🧤', count: 4 }],
                            replyCount: 2,
                        },
                        {
                            id: 's2',
                            author: people.ravi,
                            timestamp: 'Yesterday',
                            body: 'I can cover gloves. Still need one more car from downtown if anyone is free.',
                            reactions: [{ emoji: '🙏', count: 7 }],
                            replyCount: 1,
                        },
                    ],
                },
            ]);
            exports_1("connectionRequests", connectionRequests = [
                {
                    id: 'req-vikram',
                    person: people.vikram,
                    note: 'Met you at Vrindavan last summer — would love to stay in touch.',
                    receivedLabel: '1 sent',
                },
                {
                    id: 'req-sneha',
                    person: people.sneha,
                    note: 'Saw your post about med-school study groups.',
                    receivedLabel: 'REQUESTS · 2',
                },
            ]);
            exports_1("connections", connections = [
                {
                    ...people.anjali,
                    locationLine: 'Berkeley, CA · Stanford GSB',
                },
                {
                    ...people.karthik,
                    locationLine: 'Seattle, WA · Microsoft',
                },
                {
                    ...people.meera,
                    locationLine: 'Chicago, IL · UChicago',
                },
                {
                    ...people.ravi,
                    locationLine: 'San Jose, CA · Apple',
                },
            ]);
            exports_1("inboxThreads", inboxThreads = [
                {
                    id: 'thread-anjali',
                    person: people.anjali,
                    connectedSince: 'Connected since Apr 2026',
                    preview: 'Thanks! Will send the camp packet over.',
                    lastActiveLabel: '2h',
                    unread: true,
                    messages: [
                        {
                            id: 'm1',
                            sender: 'them',
                            timestamp: 'Tue · 4:14 PM',
                            body: "Hi! Saw on your profile you went through Vidyalaya in Mumbai — that's where I grew up too.",
                        },
                        {
                            id: 'm2',
                            sender: 'you',
                            timestamp: 'Tue · 5:02 PM',
                            body: 'Oh wow — small world. Which year did you finish?',
                        },
                        {
                            id: 'm3',
                            sender: 'them',
                            timestamp: 'Tue · 5:31 PM',
                            body: "2014. Was wondering if you'd ever sent the camp packet — I'm helping organize ours next month and Yatriji mentioned you had a good template.",
                        },
                        {
                            id: 'm4',
                            sender: 'you',
                            timestamp: 'Today · 8:22 AM',
                            body: 'Yes! Will dig it up and send tonight.',
                        },
                        {
                            id: 'm5',
                            sender: 'them',
                            timestamp: 'Today · 10:10 AM',
                            body: 'Thanks! Will send the camp packet over.',
                        },
                    ],
                },
                {
                    id: 'thread-karthik',
                    person: people.karthik,
                    connectedSince: 'Connected since Mar 2026',
                    preview: "Yeah, I'm there next weekend — coffee?",
                    lastActiveLabel: 'Yesterday',
                    unread: false,
                    messages: [
                        {
                            id: 'k1',
                            sender: 'them',
                            timestamp: 'Yesterday · 6:02 PM',
                            body: "You mentioned you'd done UChicago — curious what neighborhood you liked most when you were there.",
                        },
                        {
                            id: 'k2',
                            sender: 'you',
                            timestamp: 'Yesterday · 6:19 PM',
                            body: 'Hyde Park was home base, but I miss Andersonville the most.',
                        },
                        {
                            id: 'k3',
                            sender: 'them',
                            timestamp: 'Yesterday · 6:25 PM',
                            body: "Yeah, I'm there next weekend — coffee?",
                        },
                    ],
                },
                {
                    id: 'thread-meera',
                    person: people.meera,
                    connectedSince: 'Connected since Jan 2026',
                    preview: "You mentioned you'd done UChicago — c…",
                    lastActiveLabel: 'Mon',
                    unread: true,
                    messages: [
                        {
                            id: 'me1',
                            sender: 'them',
                            timestamp: 'Mon · 1:04 PM',
                            body: "You mentioned you'd done UChicago — could I ask a quick question about student housing?",
                        },
                    ],
                },
                {
                    id: 'thread-ravi',
                    person: people.ravi,
                    connectedSince: 'Connected since Dec 2025',
                    preview: 'Sounds good 🙏',
                    lastActiveLabel: 'Apr 28',
                    unread: false,
                    messages: [
                        {
                            id: 'r1',
                            sender: 'them',
                            timestamp: 'Apr 28 · 9:11 AM',
                            body: 'Sounds good 🙏',
                        },
                    ],
                },
            ]);
            exports_1("unreadInboxCount", unreadInboxCount = inboxThreads.filter((thread) => thread.unread).length);
            exports_1("centerBoards", centerBoards = [
                {
                    id: 'center-san-jose',
                    centerName: 'Chinmaya San Jose',
                    title: 'Center board',
                    subtitle: 'Verified CHYKs can coordinate rides, seva, and announcements here.',
                    messages: [
                        {
                            id: 'c1',
                            author: people.suresh,
                            timestamp: '2h',
                            body: 'Need two more volunteers for setup before Sunday satsang. Mostly chairs and AV. DM me if you can help.',
                            reactions: [
                                { emoji: '🙏', count: 8 },
                                { emoji: '🪔', count: 3 },
                            ],
                            replyCount: 5,
                            pinned: true,
                        },
                        {
                            id: 'c2',
                            author: people.priya,
                            timestamp: 'Yesterday',
                            body: "Mother's Day prep — sign-up sheet is open for cooking, decoration, and reception desk.",
                            reactions: [{ emoji: '❤️', count: 6 }],
                            replyCount: 4,
                        },
                        {
                            id: 'c3',
                            author: people.karthik,
                            timestamp: 'Mon',
                            body: 'Uploading the chanting packet tonight so newer folks can print it ahead of class.',
                            reactions: [{ emoji: '📄', count: 5 }],
                            replyCount: 1,
                        },
                    ],
                },
            ]);
            exports_1("featuredHomeEvent", featuredHomeEvent = {
                id: 'aradhana-2026',
                title: '33rd Mahasamadhi Aradhana Camp',
                dateLabel: 'Jul 30',
                timeLabel: '5:00 PM',
                locationLabel: 'Parsippany, NJ',
                countdownLabel: 'In 84 days',
                going: true,
                attendeesGoingLabel: '23 others going',
                attendees: [people.anjali, people.karthik, people.meera, people.ravi],
            });
            exports_1("groupChats", groupChats = [
                {
                    id: 'group-aradhana-carpool',
                    title: 'Aradhana carpool · NJ',
                    kind: 'event',
                    members: [people.anjali, people.karthik, people.rohit, people.meera],
                    memberCount: 8,
                    preview: "Rohit: I'm leaving at 7 sharp Sat morning.",
                    lastActiveLabel: '15m',
                    unreadCount: 3,
                    messages: [
                        {
                            id: 'gc-ar-1',
                            sender: 'them',
                            authorName: people.anjali.name,
                            authorInitials: people.anjali.initials,
                            authorAccent: people.anjali.accentColor,
                            timestamp: 'Yesterday · 6:02 PM',
                            body: 'Folks — sharing the carpool sheet, please add yourselves with pickup point and time.',
                        },
                        {
                            id: 'gc-ar-2',
                            sender: 'them',
                            authorName: people.karthik.name,
                            authorInitials: people.karthik.initials,
                            authorAccent: people.karthik.accentColor,
                            timestamp: 'Yesterday · 6:14 PM',
                            body: 'Added. Leaving Palo Alto 6 AM, can take 2.',
                        },
                        {
                            id: 'gc-ar-3',
                            sender: 'you',
                            timestamp: 'Yesterday · 6:20 PM',
                            body: 'I can take 3 from Fremont, leaving 5:30.',
                        },
                        {
                            id: 'gc-ar-4',
                            sender: 'them',
                            authorName: people.rohit.name,
                            authorInitials: people.rohit.initials,
                            authorAccent: people.rohit.accentColor,
                            timestamp: 'Today · 8:15 AM',
                            body: "I'm leaving at 7 sharp Sat morning. Two seats open from San Jose.",
                        },
                        {
                            id: 'gc-ar-5',
                            sender: 'them',
                            authorName: people.anjali.name,
                            authorInitials: people.anjali.initials,
                            authorAccent: people.anjali.accentColor,
                            timestamp: 'Today · 9:02 AM',
                            body: "Thanks all — pinning the sheet so it's easy to find.",
                        },
                    ],
                },
                {
                    id: 'group-saaket-sevak',
                    title: 'Saaket sevak team',
                    kind: 'center',
                    members: [people.priya, people.suresh, people.anand],
                    memberCount: 12,
                    preview: 'Priya: New roster pinned — please check.',
                    lastActiveLabel: '3h',
                    unreadCount: 0,
                    messages: [
                        {
                            id: 'gc-sk-1',
                            sender: 'them',
                            authorName: people.priya.name,
                            authorInitials: people.priya.initials,
                            authorAccent: people.priya.accentColor,
                            timestamp: 'Mon · 9:14 AM',
                            body: 'New volunteer roster for Mother\'s Day is up — please claim a slot by Wed.',
                        },
                        {
                            id: 'gc-sk-2',
                            sender: 'them',
                            authorName: people.suresh.name,
                            authorInitials: people.suresh.initials,
                            authorAccent: people.suresh.accentColor,
                            timestamp: 'Mon · 11:42 AM',
                            body: 'I have AV setup covered. Need someone on prasad coordination.',
                        },
                        {
                            id: 'gc-sk-3',
                            sender: 'you',
                            timestamp: 'Today · 11:08 AM',
                            body: "I'll take prasad coordination — will sync with the kitchen team tonight.",
                        },
                        {
                            id: 'gc-sk-4',
                            sender: 'them',
                            authorName: people.priya.name,
                            authorInitials: people.priya.initials,
                            authorAccent: people.priya.accentColor,
                            timestamp: 'Today · 1:55 PM',
                            body: 'Thanks! New roster pinned — please check.',
                        },
                    ],
                },
            ]);
        }
    };
});
