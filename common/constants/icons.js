export const SUREGO_ICON_TONES = {
  blue: '#2388ff',
  cyan: '#0ea5e9',
  violet: '#7c3aed',
  green: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  slate: '#334155'
}

export const SUREGO_ICONS = {
  search: { uni: 'search', tone: 'slate' },
  bell: { uni: 'notification-filled', tone: 'blue' },
  arrowRight: { uni: 'right', tone: 'slate' },
  settings: { uni: 'gear-filled', tone: 'blue' },

  navJourney: { uni: 'paperplane-filled', tone: 'blue' },
  navPartners: { uni: 'staff-filled', tone: 'blue' },
  navPublish: { uni: 'plusempty', tone: 'blue' },
  navMessages: { uni: 'notification-filled', tone: 'blue' },
  navProfile: { uni: 'person-filled', tone: 'blue' },

  sceneAll: { uni: 'star-filled', tone: 'blue' },
  sceneBoard: { uni: 'calendar', tone: 'violet' },
  sceneFood: { uni: 'shop', tone: 'amber' },
  sceneSport: { uni: 'staff', tone: 'green' },
  sceneStudy: { uni: 'compose', tone: 'cyan' },
  scenePhoto: { uni: 'image', tone: 'rose' },
  sceneGame: { uni: 'videocam-filled', tone: 'violet' },
  sceneFun: { uni: 'heart', tone: 'rose' },
  sceneProject: { uni: 'paperplane-filled', tone: 'blue' },
  sceneLongterm: { uni: 'auth-filled', tone: 'green' },

  calendar: { uni: 'calendar', tone: 'blue' },
  location: { uni: 'location', tone: 'cyan' },
  people: { uni: 'personadd', tone: 'blue' },
  chat: { uni: 'chat', tone: 'cyan' },
  scan: { uni: 'scan', tone: 'violet' },
  check: { uni: 'checkmarkempty', tone: 'green' },
  send: { uni: 'paperplane-filled', tone: 'blue' },
  shield: { uni: 'auth-filled', tone: 'blue' },
  wallet: { uni: 'wallet-filled', tone: 'amber' },
  login: { uni: 'personadd-filled', tone: 'blue' },
  mic: { uni: 'mic-filled', tone: 'blue' },
  emptyCalendar: { uni: 'calendar', tone: 'slate' },
  emptyPartner: { uni: 'personadd', tone: 'slate' },

  xiaohongshu: { src: 'https://cdn.simpleicons.org/xiaohongshu/FF2442', tone: 'rose' },
  douyin: { src: 'https://cdn.simpleicons.org/tiktok/111827', tone: 'slate' },
  github: { src: 'https://cdn.simpleicons.org/github/181717', tone: 'slate' },
  wechat: { src: 'https://cdn.simpleicons.org/wechat/07C160', tone: 'green' }
}

export function getSuregoIcon(name) {
  return SUREGO_ICONS[name] || { uni: name || 'info', tone: 'blue' }
}
