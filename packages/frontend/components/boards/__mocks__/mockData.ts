export type VerificationKind = 'member' | 'sevak' | 'admin'

export interface PersonSummary {
  id: string
  name: string
  initials: string
  subtitle?: string
  verification?: VerificationKind
  accentColor?: string
  /** Handle for linking to the public profile (#441). Absent for "You"/system. */
  username?: string
}

export interface BoardMessage {
  id: string
  author: PersonSummary
  timestamp: string
  body: string
  attachmentLabel?: string
  imageUrl?: string
  reactions?: Array<{ emoji: string; count: number }>
  replyCount?: number
  pinned?: boolean
  sourceLabel?: string
  sourceKind?: 'center' | 'event' | 'public'
}

export interface EventBoard {
  id: string
  title: string
  dateLabel: string
  centerLabel: string
  attendeesLabel: string
  preview: string
  messages: BoardMessage[]
}

export interface ConnectionRequest {
  id: string
  person: PersonSummary
  note: string
  receivedLabel: string
}

export interface Connection extends PersonSummary {
  locationLine: string
}

export interface DirectMessage {
  id: string
  sender: 'them' | 'you'
  timestamp: string
  body: string
}

export interface InboxThread {
  id: string
  person: PersonSummary
  connectedSince: string
  preview: string
  lastActiveLabel: string
  unread: boolean
  messages: DirectMessage[]
}

export interface GroupChatMessage {
  id: string
  sender: 'them' | 'you'
  authorName?: string
  authorInitials?: string
  authorAccent?: string
  timestamp: string
  body: string
}

export interface GroupChatThread {
  id: string
  title: string
  kind: 'center' | 'event'
  members: PersonSummary[]
  memberCount: number
  preview: string
  lastActiveLabel: string
  unreadCount: number
  messages: GroupChatMessage[]
}

export interface CenterBoard {
  id: string
  centerName: string
  title: string
  subtitle: string
  messages: BoardMessage[]
}

const people = {
  anjali: {
    id: 'anjali',
    name: 'Anjali Desai',
    initials: 'AD',
    subtitle: 'Chinmaya San Jose · Stanford GSB',
    verification: 'member' as const,
    accentColor: '#0F766E',
  },
  ravi: {
    id: 'ravi',
    name: 'Ravi Iyer',
    initials: 'RI',
    subtitle: 'San Jose, CA · Apple',
    verification: 'sevak' as const,
    accentColor: '#1D4ED8',
  },
  priya: {
    id: 'priya',
    name: 'Priya Menon',
    initials: 'PM',
    subtitle: 'Burlingame, CA',
    verification: 'member' as const,
    accentColor: '#7C3AED',
  },
  karthik: {
    id: 'karthik',
    name: 'Karthik Subramanian',
    initials: 'KS',
    subtitle: 'Seattle, WA · Microsoft',
    verification: 'member' as const,
    accentColor: '#0F766E',
  },
  meera: {
    id: 'meera',
    name: 'Meera Krishnan',
    initials: 'MK',
    subtitle: 'Chicago, IL · UChicago',
    verification: 'member' as const,
    accentColor: '#0369A1',
  },
  vikram: {
    id: 'vikram',
    name: 'Vikram Shah',
    initials: 'VS',
    subtitle: 'Chinmaya Houston · CHYK since 2019',
    verification: 'member' as const,
    accentColor: '#C2410C',
  },
  sneha: {
    id: 'sneha',
    name: 'Sneha Pillai',
    initials: 'SP',
    subtitle: 'Chinmaya San Jose',
    verification: 'member' as const,
    accentColor: '#15803D',
  },
  rohit: {
    id: 'rohit',
    name: 'Rohit Patel',
    initials: 'RP',
    subtitle: 'Edison, NJ',
    verification: 'member' as const,
    accentColor: '#B45309',
  },
  suresh: {
    id: 'suresh',
    name: 'Suresh Nair',
    initials: 'SN',
    subtitle: 'CCMT · Sevak',
    verification: 'sevak' as const,
    accentColor: '#0369A1',
  },
  anand: {
    id: 'anand',
    name: 'Anand Raghavan',
    initials: 'AR',
    subtitle: 'Chinmaya Saaket',
    verification: 'member' as const,
    accentColor: '#7C3AED',
  },
} as const

export const eventBoards: EventBoard[] = [
  {
    id: 'hanuman-chalisa-havan',
    title: 'Hanuman Chalisa Havan',
    dateLabel: 'SAT, MAY 16',
    centerLabel: 'Chinmaya Portland',
    attendeesLabel: '18 going',
    preview: 'Anyone familiar with the Shodasha Upachara Puja sequence? First-timer here.',
    messages: [
      {
        id: 'h1',
        author: people.suresh,
        timestamp: '8:00 AM',
        body: 'Havan begins at 8:30 sharp. Please arrive by 8:00 for setup. Bring marigolds if you can.',
        reactions: [{ emoji: '🪔', count: 9 }, { emoji: '🙏', count: 5 }],
        replyCount: 3,
        pinned: true,
      },
      {
        id: 'h2',
        author: people.priya,
        timestamp: '9:22 AM',
        body: "Anyone familiar with the Shodasha Upachara Puja sequence? Coming for the first time and want to follow along.",
        reactions: [{ emoji: '🙋', count: 4 }],
        replyCount: 2,
      },
      {
        id: 'h3',
        author: people.karthik,
        timestamp: '10:05 AM',
        body: "I'll have a printed cheat-sheet of the Hanuman Chalisa verses for anyone who needs it — just ask.",
        reactions: [{ emoji: '📄', count: 6 }],
        replyCount: 1,
      },
    ],
  },
  {
    id: 'chyk-memorial-day-camp',
    title: 'ChYK Memorial Day Camp',
    dateLabel: 'SAT, MAY 23 – MON, MAY 25',
    centerLabel: 'ChYK West Central Zone · Chicago',
    attendeesLabel: '31 going',
    preview: 'Packing list is finalized — layers for evening, rain jacket just in case.',
    messages: [
      {
        id: 'c1',
        author: people.meera,
        timestamp: 'Yesterday',
        body: 'Packing list is finalized. Layers for evening, rain jacket just in case. No outside food in the retreat center kitchen.',
        reactions: [{ emoji: '🎒', count: 11 }, { emoji: '🙏', count: 4 }],
        replyCount: 5,
        pinned: true,
      },
      {
        id: 'c2',
        author: people.vikram,
        timestamp: 'Yesterday',
        body: 'Reminder to fill out the waiver by midnight tonight — link is in the doc Meera shared.',
        reactions: [{ emoji: '✅', count: 7 }],
        replyCount: 2,
      },
      {
        id: 'c3',
        author: people.anand,
        timestamp: '7:45 AM',
        body: "Who's driving from downtown Chicago? Have two open seats if anyone needs a ride from the city.",
        reactions: [{ emoji: '🚗', count: 5 }],
        replyCount: 3,
      },
      {
        id: 'c4',
        author: people.rohit,
        timestamp: '9:12 AM',
        body: "Carpools are filling up fast — DM Anand if you're coming from downtown.",
        reactions: [{ emoji: '👆', count: 3 }],
        replyCount: 1,
      },
    ],
  },
]

export const connectionRequests: ConnectionRequest[] = [
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
]

export const connections: Connection[] = [
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
]

export const inboxThreads: InboxThread[] = [
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
]

export const unreadInboxCount = inboxThreads.filter((thread) => thread.unread).length

export const centerBoards: CenterBoard[] = [
  {
    id: 'center-san-jose',
    centerName: 'Chinmaya San Jose',
    title: 'Center board',
    subtitle: 'Verified CHYKs can coordinate rides, seva, and announcements here.',
    messages: [
      {
        id: 'csj1',
        author: people.suresh,
        timestamp: '2h',
        body: 'Need two more volunteers for setup before Sunday satsang. Mostly chairs and AV. DM me if you can help.',
        reactions: [{ emoji: '🙏', count: 8 }, { emoji: '🪔', count: 3 }],
        replyCount: 5,
        pinned: true,
      },
    ],
  },
  {
    id: 'center-houston',
    centerName: 'Chinmaya Houston',
    title: 'Center board',
    subtitle: 'Verified CHYKs can coordinate rides, seva, and announcements here.',
    messages: [
      {
        id: 'chou1',
        author: people.vikram,
        timestamp: '3h',
        body: 'GCC State Finals are this Saturday at Chinmaya Mangalam — come cheer on the participants! 🙏',
        reactions: [{ emoji: '🎉', count: 12 }, { emoji: '🙏', count: 6 }],
        replyCount: 4,
      },
    ],
  },
  {
    id: 'center-tri-state',
    centerName: 'Chinmaya Mission Tri-State',
    title: 'Center board',
    subtitle: 'Verified CHYKs can coordinate rides, seva, and announcements here.',
    messages: [
      {
        id: 'cnj1',
        author: people.rohit,
        timestamp: '1h',
        body: "33rd Aradhana Camp registration closes Friday — if you haven't signed up yet, now is the time.",
        reactions: [{ emoji: '🏕️', count: 14 }, { emoji: '🙏', count: 9 }],
        replyCount: 7,
        pinned: true,
      },
    ],
  },
]

export interface FeaturedHomeEvent {
  id: string
  title: string
  dateLabel: string
  timeLabel: string
  locationLabel: string
  countdownLabel: string
  going: boolean
  attendeesGoingLabel: string
  attendees: PersonSummary[]
}

export const featuredHomeEvent: FeaturedHomeEvent = {
  id: 'aradhana-2026',
  title: '33rd Mahasamadhi Aradhana Camp',
  dateLabel: 'Jul 30',
  timeLabel: '5:00 PM',
  locationLabel: 'Parsippany, NJ',
  countdownLabel: 'In 84 days',
  going: true,
  attendeesGoingLabel: '23 others going',
  attendees: [people.anjali, people.karthik, people.meera, people.ravi],
}

export const groupChats: GroupChatThread[] = [
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
]

export function buildEventBoard(input: {
  id: string
  title: string
  dateLabel: string
  centerLabel: string
  attendeesLabel: string
}): EventBoard {
  const template = eventBoards[0]
  return {
    ...template,
    id: input.id,
    title: input.title,
    dateLabel: input.dateLabel,
    centerLabel: input.centerLabel,
    attendeesLabel: input.attendeesLabel,
  }
}

export function buildCenterBoard(input: {
  id: string
  centerName: string
  subtitle: string
}): CenterBoard {
  const idx = input.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % centerBoards.length
  const template = centerBoards[idx]
  return {
    ...template,
    id: input.id,
    centerName: input.centerName,
    subtitle: input.subtitle,
  }
}
