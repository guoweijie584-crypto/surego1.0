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

export function listMyActivities() {
  const all = [...readCreatedActivities(), ...activities]
  return Promise.resolve({
    hosting: all.filter((item) => item.isCreator || item.status === 'hosting'),
    joined: all.filter((item) => item.status === 'approved'),
    pending: all.filter((item) => item.status === 'pending' || uni.getStorageSync(`surego_application_${item.id}`))
  })
}
