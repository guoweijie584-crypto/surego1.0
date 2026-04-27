import { activities, findActivityById } from '@/common/mock/activities.js'
import { USE_UNICLOUD } from '@/common/config/runtime.js'
import { callSuregoFunction } from '@/common/api/cloud.js'

const STORAGE_KEY = 'surego_created_activities'

function readCreatedActivities() {
  return uni.getStorageSync(STORAGE_KEY) || []
}

function writeCreatedActivities(items) {
  uni.setStorageSync(STORAGE_KEY, items)
}

function buildActivityFromForm(form, id = `local_${Date.now()}`) {
  return {
    id,
    title: form.title,
    organizer: form.organizer || '吴哈哈',
    organizerAvatar: form.organizerAvatar || 'https://api.dicebear.com/7.x/avataaars/png?seed=Lucky',
    image: form.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=900',
    category: form.category,
    date: form.date,
    dateValue: form.dateValue,
    dayOfWeek: form.dayOfWeek || '',
    time: form.time,
    endTime: form.endTime,
    location: form.location,
    distance: form.distance || '0.6',
    participantCount: Number(form.participantCount) || 1,
    maxParticipants: Number(form.maxParticipants) || 10,
    hasParticipantLimit: Boolean(form.hasParticipantLimit),
    partyMode: form.partyMode,
    price: form.partyMode === 'free' ? '免费' : String(form.amount || 0),
    amount: Number(form.amount) || 0,
    requireApproval: Boolean(form.requireApproval),
    isCreator: form.isCreator !== undefined ? Boolean(form.isCreator) : true,
    status: form.status || 'hosting',
    viewCount: Number(form.viewCount) || 0,
    likeCount: Number(form.likeCount) || 0,
    description: form.description,
    questions: form.questions || [],
    tags: form.tags || [form.category, form.partyMode]
  }
}

function listLocalActivities() {
  return Promise.resolve([...readCreatedActivities(), ...activities])
}

export async function listActivities() {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-activity', 'list', { limit: 50 })
    } catch (error) {
      return listLocalActivities()
    }
  }
  return listLocalActivities()
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

function getLocalActivityDetail(id) {
  const created = readCreatedActivities()
  const found = created.find((item) => item.id === String(id))
  return Promise.resolve(found || findActivityById(id))
}

export async function getActivityDetail(id) {
  if (USE_UNICLOUD && !String(id).startsWith('local_')) {
    try {
      const detail = await callSuregoFunction('surego-activity', 'detail', { id })
      return detail || findActivityById(id)
    } catch (error) {
      return getLocalActivityDetail(id)
    }
  }
  return getLocalActivityDetail(id)
}

function createLocalActivity(form) {
  const created = readCreatedActivities()
  const activity = buildActivityFromForm(form)

  writeCreatedActivities([activity, ...created])
  return Promise.resolve(activity)
}

export async function createActivity(form) {
  const activity = buildActivityFromForm(form, '')
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-activity', 'create', activity)
    } catch (error) {
      return createLocalActivity(form)
    }
  }
  return createLocalActivity(form)
}

function updateLocalActivityStatus(id, status) {
  const created = readCreatedActivities()
  const next = created.map((item) => (item.id === String(id) ? { ...item, status } : item))
  writeCreatedActivities(next)
  return Promise.resolve({ id, status })
}

export async function updateActivityStatus(id, status) {
  if (USE_UNICLOUD && !String(id).startsWith('local_')) {
    try {
      return await callSuregoFunction('surego-activity', 'updateStatus', { id, status })
    } catch (error) {
      return updateLocalActivityStatus(id, status)
    }
  }
  return updateLocalActivityStatus(id, status)
}

function updateLocalActivity(id, form) {
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

export async function updateActivity(id, form) {
  if (USE_UNICLOUD && !String(id).startsWith('local_')) {
    try {
      return await callSuregoFunction('surego-activity', 'update', { id, ...form })
    } catch (error) {
      return updateLocalActivity(id, form)
    }
  }
  return updateLocalActivity(id, form)
}

export async function listMyActivities() {
  const all = await listActivities()
  return Promise.resolve({
    hosting: all.filter((item) => item.isCreator || item.status === 'hosting'),
    joined: all.filter((item) => item.status === 'approved'),
    pending: all.filter((item) => item.status === 'pending' || uni.getStorageSync(`surego_application_${item.id}`))
  })
}
