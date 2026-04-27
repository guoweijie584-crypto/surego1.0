import { activities, findActivityById } from '@/common/mock/activities.js'

const STORAGE_KEY = 'surego_created_activities'

function readCreatedActivities() {
  return uni.getStorageSync(STORAGE_KEY) || []
}

function writeCreatedActivities(items) {
  uni.setStorageSync(STORAGE_KEY, items)
}

export function listActivities() {
  return Promise.resolve([...readCreatedActivities(), ...activities])
}

export async function searchActivities(keyword = '') {
  const query = String(keyword || '').trim().toLowerCase()
  const all = await listActivities()
  if (!query) return all

  return all.filter((item) => {
    const haystack = [
      item.title,
      item.organizer,
      item.category,
      item.location,
      item.description,
      ...(item.tags || [])
    ].join(' ').toLowerCase()
    return haystack.includes(query)
  })
}

export async function listActivitiesByCategory(category = '全部') {
  const all = await listActivities()
  if (!category || category === '全部') return all
  return all.filter((item) => item.category === category)
}

export async function listActivitiesByCity(city = '杭州') {
  const all = await listActivities()
  if (!city || city === '杭州') return all
  return all.filter((item) => (item.location || '').includes(city))
}

export async function listActivitiesByDate(date = '') {
  const all = await listActivities()
  if (!date) return all
  return all.filter((item) => item.date === date)
}

export async function getActivityCalendar() {
  const all = await listActivities()
  return all.reduce((groups, item) => {
    const key = item.date || '待定'
    const found = groups.find((group) => group.date === key)
    if (found) {
      found.items.push(item)
    } else {
      groups.push({ date: key, dayOfWeek: item.dayOfWeek || '', items: [item] })
    }
    return groups
  }, [])
}

export async function getCityActivityStats() {
  const all = await listActivities()
  return [
    { name: '杭州', count: all.length, desc: '西湖、武林、滨江正在成行' },
    { name: '上海', count: all.filter((item) => (item.location || '').includes('上海')).length, desc: '周末展览与城市漫游' },
    { name: '南京', count: all.filter((item) => (item.location || '').includes('南京')).length, desc: '咖啡、徒步、夜游小局' },
    { name: '北京', count: all.filter((item) => (item.location || '').includes('北京')).length, desc: '读书会与运动局预热' }
  ]
}

export function getActivityDetail(id) {
  const created = readCreatedActivities()
  const found = created.find((item) => item.id === String(id))
  return Promise.resolve(found || findActivityById(id))
}

export function createActivity(form) {
  const created = readCreatedActivities()
  const now = Date.now()
  const activity = {
    id: `local_${now}`,
    title: form.title,
    organizer: '吴哈哈',
    organizerAvatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Lucky',
    image: form.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=900',
    category: form.category,
    date: form.date,
    dayOfWeek: form.dayOfWeek || '',
    time: form.time,
    endTime: form.endTime,
    location: form.location,
    distance: '0.6',
    participantCount: 1,
    maxParticipants: Number(form.maxParticipants) || 10,
    hasParticipantLimit: Boolean(form.hasParticipantLimit),
    partyMode: form.partyMode,
    price: form.partyMode === 'free' ? '免费' : String(form.amount || 0),
    amount: Number(form.amount) || 0,
    requireApproval: Boolean(form.requireApproval),
    isCreator: true,
    status: 'hosting',
    viewCount: 0,
    likeCount: 0,
    description: form.description,
    questions: form.questions || [],
    tags: [form.category, form.partyMode]
  }

  writeCreatedActivities([activity, ...created])
  return Promise.resolve(activity)
}

export function updateActivityStatus(id, status) {
  const created = readCreatedActivities()
  const next = created.map((item) => (item.id === String(id) ? { ...item, status } : item))
  writeCreatedActivities(next)
  return Promise.resolve({ id, status })
}

export function updateActivity(id, form) {
  const created = readCreatedActivities()
  const found = created.find((item) => item.id === String(id))
  if (!found) return Promise.resolve(null)

  const nextActivity = {
    ...found,
    title: form.title,
    category: form.category,
    date: form.date,
    dateValue: form.dateValue,
    time: form.time,
    endTime: form.endTime,
    location: form.location,
    maxParticipants: Number(form.maxParticipants) || found.maxParticipants,
    hasParticipantLimit: Boolean(form.hasParticipantLimit),
    requireApproval: Boolean(form.requireApproval),
    partyMode: form.partyMode,
    amount: Number(form.amount) || 0,
    price: form.partyMode === 'free' ? '免费' : String(Number(form.amount) || 0),
    description: form.description,
    questions: form.questions || [],
    image: form.image || found.image,
    tags: [form.category, form.partyMode]
  }

  writeCreatedActivities(created.map((item) => (item.id === String(id) ? nextActivity : item)))
  return Promise.resolve(nextActivity)
}

export function listMyActivities() {
  const all = [...readCreatedActivities(), ...activities]
  return Promise.resolve({
    hosting: all.filter((item) => item.isCreator || item.status === 'hosting'),
    joined: all.filter((item) => item.status === 'approved'),
    pending: all.filter((item) => item.status === 'pending' || uni.getStorageSync(`surego_application_${item.id}`))
  })
}
