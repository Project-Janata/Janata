export type VerificationKind = 'member' | 'sevak' | 'admin'

export interface PersonSummary {
  id: string
  name: string
  initials: string
  subtitle?: string
  verification?: VerificationKind
  accentColor?: string
}

export interface BoardMessage {
  id: string
  author: PersonSummary
  timestamp: string
  body: string
  attachmentLabel?: string
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
} as const

export const eventBoards: EventBoard[] = [
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
      },
      {
        id: 'b2',
        author: people.ravi,
        timestamp: '4:02 PM',
        body: "Quick reminder we're starting at 9:30 sharp this time, not 10. Aarti at 9:00 for those who can make it.",
      },
      {
        id: 'b3',
        author: people.priya,
        timestamp: '8:11 AM',
        body: "I'd love a ride if you've still got room — I'm in Burlingame.",
      },
      {
        id: 'b4',
        author: people.karthik,
        timestamp: '9:47 AM',
        body: "Sharing a few photos from last week's session — hope folks who couldn't attend get a feel for it.",
        attachmentLabel: 'Photo · seva session',
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
      },
      {
        id: 's2',
        author: people.ravi,
        timestamp: 'Yesterday',
        body: 'I can cover gloves. Still need one more car from downtown if anyone is free.',
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
        id: 'c1',
        author: people.ravi,
        timestamp: '4:20 PM',
        body: 'Need two more volunteers for setup before Sunday satsang. Mostly chairs and AV. DM me if you can help.',
      },
      {
        id: 'c2',
        author: people.anjali,
        timestamp: 'Today',
        body: 'Carpool from Fremont has 2 open spots for tomorrow evening if anyone wants to join.',
      },
      {
        id: 'c3',
        author: people.karthik,
        timestamp: 'Yesterday',
        body: 'Uploading the chanting packet tonight so newer folks can print it ahead of class.',
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
  const template = centerBoards[0]
  return {
    ...template,
    id: input.id,
    centerName: input.centerName,
    subtitle: input.subtitle,
  }
}
