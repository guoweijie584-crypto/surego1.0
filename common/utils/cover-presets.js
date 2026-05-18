export const COVER_CATEGORIES = ['剧本杀/桌游', '饭搭子/探店', '运动', '学习/自习', '约拍/展览/微醺']
export const FALLBACK_COVER_IMAGE = '/static/logo.png'

export const COVER_PRESETS = [
  {
    id: 'outdoor-picnic',
    category: '饭搭子/探店',
    title: '草坪野餐',
    tone: '#22c55e',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=900'
  },
  {
    id: 'outdoor-hike',
    category: '约拍/展览/微醺',
    title: '山野徒步',
    tone: '#16a34a',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=900'
  },
  {
    id: 'food-table',
    category: '饭搭子/探店',
    title: '餐桌小局',
    tone: '#f97316',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=900'
  },
  {
    id: 'food-brunch',
    category: '饭搭子/探店',
    title: '周末早午餐',
    tone: '#ef4444',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=900'
  },
  {
    id: 'sport-running',
    category: '运动',
    title: '城市夜跑',
    tone: '#0ea5e9',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=900'
  },
  {
    id: 'sport-court',
    category: '运动',
    title: '球场集合',
    tone: '#2563eb',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=900'
  },
  {
    id: 'study-books',
    category: '学习/自习',
    title: '读书会',
    tone: '#8b5cf6',
    image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&q=80&w=900'
  },
  {
    id: 'study-workshop',
    category: '学习/自习',
    title: '工作坊',
    tone: '#6366f1',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=900'
  },
  {
    id: 'exhibition-gallery',
    category: '约拍/展览/微醺',
    title: '美术馆',
    tone: '#14b8a6',
    image: 'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?auto=format&fit=crop&q=80&w=900'
  },
  {
    id: 'exhibition-museum',
    category: '约拍/展览/微醺',
    title: '城市展厅',
    tone: '#0891b2',
    image: 'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&q=80&w=900'
  },
  {
    id: 'night-bar',
    category: '剧本杀/桌游',
    title: '桌游小局',
    tone: '#111827',
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=900'
  },
  {
    id: 'night-live',
    category: '约拍/展览/微醺',
    title: 'Live House',
    tone: '#7c3aed',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=900'
  }
]

export function listCoverPresets(category = '') {
  const matched = COVER_PRESETS.filter((item) => item.category === category)
  return matched.length ? matched : COVER_PRESETS
}

export function getDefaultCoverPreset(category = '') {
  return listCoverPresets(category)[0] || COVER_PRESETS[0]
}

export function isPresetCover(image = '') {
  return COVER_PRESETS.some((item) => item.image === image)
}

export function pickRandomCoverPreset(category = '', seed = Date.now()) {
  const source = listCoverPresets(category)
  const index = Math.abs(Number(seed) || Date.now()) % source.length
  return source[index] || getDefaultCoverPreset(category)
}
