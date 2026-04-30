import { activities, findActivityById } from '@/common/mock/activities.js'
import { USE_UNICLOUD } from '../config/runtime.js'
import { callSuregoFunction, handleSuregoCloudError } from '@/common/api/cloud.js'
import { getCurrentUserId, getCurrentUserProfile } from '@/common/api/auth.js'

const STORAGE_KEY = 'surego_created_activities'
const MODERATION_STATUS_KEY = 'surego_moderation_activity_statuses'
const DEFAULT_CITY = '杭州'
const DEFAULT_CITY_CODE = '330100'
const CITY_OPTIONS = [
  { name: '杭州', code: '330100', desc: '西湖、武林、滨江正在成行' },
  { name: '上海', code: '310100', desc: '周末展览与城市漫游' },
  { name: '南京', code: '320100', desc: '咖啡、徒步、夜游小局' },
  { name: '北京', code: '110100', desc: '读书会与运动局预热' }
]

export const ACTIVITY_LIFECYCLE_STATUSES = ['draft', 'reviewing', 'published', 'recruiting', 'formed', 'ongoing', 'finished', 'cancelled']
export const APPLICATION_STATUSES = ['not_applied', 'pending', 'approved', 'rejected']

const legacyActivityStatusMap = {
  hosting: 'recruiting',
  not_applied: 'recruiting',
  pending: 'recruiting',
  approved: 'recruiting',
  rejected: 'recruiting'
}

export function normalizeActivityStatus(status = 'recruiting') {
  const mapped = legacyActivityStatusMap[status] || status
  return ACTIVITY_LIFECYCLE_STATUSES.includes(mapped) ? mapped : 'recruiting'
}

function normalizeApplicationStatus(status = 'not_applied') {
  return APPLICATION_STATUSES.includes(status) ? status : 'not_applied'
}

function readLocalApplication(activityId) {
  try {
    return uni.getStorageSync(`surego_application_${activityId}`) || null
  } catch (error) {
    return null
  }
}

function normalizeCityName(city = '') {
  return String(city || '').trim().replace(/市$/, '')
}

function normalizeCityCode(code = '') {
  return String(code || '').trim()
}

function inferCityName(item = {}) {
  const directCity = normalizeCityName(item.city || item.city_name)
  if (directCity) return directCity

  const location = `${item.location || ''} ${item.address || ''}`
  const matched = CITY_OPTIONS.find((city) => location.includes(city.name) || location.includes(`${city.name}市`))
  return matched?.name || DEFAULT_CITY
}

function inferCityCode(item = {}, cityName = DEFAULT_CITY) {
  const directCode = normalizeCityCode(item.cityCode || item.city_code)
  if (directCode) return directCode

  const matched = CITY_OPTIONS.find((city) => city.name === normalizeCityName(cityName))
  return matched?.code || DEFAULT_CITY_CODE
}

function activityMatchesCity(item = {}, city = DEFAULT_CITY, cityCode = '') {
  const targetCity = normalizeCityName(city || DEFAULT_CITY)
  const targetCode = normalizeCityCode(cityCode)
  const itemCity = normalizeCityName(item.city || inferCityName(item))
  const itemCode = normalizeCityCode(item.cityCode || item.city_code || inferCityCode(item, itemCity))
  const location = `${item.location || ''} ${item.address || ''}`

  if (targetCode && itemCode && itemCode === targetCode) return true
  if (targetCity && itemCity && itemCity === targetCity) return true
  return Boolean(targetCity && location.includes(targetCity))
}

export function isCurrentUserActivityCreator(item = {}) {
  const currentUserId = getCurrentUserId()
  const creatorId = item.creatorId || item.creator_id || ''
  return Boolean(currentUserId && creatorId && String(currentUserId) === String(creatorId))
}

export function normalizeActivityRecord(item = {}) {
  const id = item.id || item._id
  const localApplication = readLocalApplication(id)
  const legacyStatus = item.applicationStatus || item.application_status || localApplication?.status || item.status
  const moderationStatus = item.moderationStatus || item.moderation_status || 'visible'
  const creatorId = item.creatorId || item.creator_id || ''
  const city = inferCityName(item)
  const cityCode = inferCityCode(item, city)
  return {
    ...item,
    id,
    status: normalizeActivityStatus(item.status),
    lifecycleStatus: normalizeActivityStatus(item.lifecycleStatus || item.status),
    applicationStatus: normalizeApplicationStatus(legacyStatus),
    moderationStatus,
    moderation_status: moderationStatus,
    moderationNote: item.moderationNote || item.moderation_note || '',
    moderatedAt: item.moderatedAt || item.moderated_at || '',
    moderatedBy: item.moderatedBy || item.moderated_by || '',
    creatorId,
    creator_id: creatorId,
    city,
    cityCode,
    city_code: cityCode,
    district: item.district || '',
    isCreator: isCurrentUserActivityCreator({ ...item, creatorId })
  }
}

function readCreatedActivities() {
  return uni.getStorageSync(STORAGE_KEY) || []
}

function readModerationStatuses() {
  return uni.getStorageSync(MODERATION_STATUS_KEY) || {}
}

function applyModerationOverlay(item = {}) {
  const overlays = readModerationStatuses()
  const overlay = overlays[String(item.id || item._id)] || {}
  return normalizeActivityRecord({
    ...item,
    ...overlay
  })
}

function writeCreatedActivities(items) {
  uni.setStorageSync(STORAGE_KEY, items)
}

function buildActivityFromForm(form, id = `local_${Date.now()}`) {
  const currentUser = getCurrentUserProfile()
  const creatorId = form.creatorId || form.creator_id || currentUser.userId
  const city = normalizeCityName(form.city || DEFAULT_CITY)
  const cityCode = normalizeCityCode(form.cityCode || form.city_code || inferCityCode({ city }, city))
  return {
    id,
    title: form.title,
    creatorId,
    creator_id: creatorId,
    organizer: form.organizer || currentUser.nickname,
    organizerAvatar: form.organizerAvatar || currentUser.avatar,
    image: form.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=900',
    category: form.category,
    date: form.date,
    dateValue: form.dateValue,
    dayOfWeek: form.dayOfWeek || '',
    time: form.time,
    endTime: form.endTime,
    location: form.location,
    address: form.address || form.location,
    latitude: form.latitude || '',
    longitude: form.longitude || '',
    city,
    cityCode,
    city_code: cityCode,
    district: form.district || '',
    distance: form.distance || '0.6',
    participantCount: Number(form.participantCount) || 1,
    maxParticipants: Number(form.maxParticipants) || 10,
    hasParticipantLimit: Boolean(form.hasParticipantLimit),
    partyMode: form.partyMode,
    price: form.partyMode === 'free' ? '免费' : String(form.amount || 0),
    amount: Number(form.amount) || 0,
    requireApproval: Boolean(form.requireApproval),
    status: normalizeActivityStatus(form.status || 'recruiting'),
    lifecycleStatus: normalizeActivityStatus(form.status || 'recruiting'),
    applicationStatus: normalizeApplicationStatus(form.applicationStatus || 'not_applied'),
    viewCount: Number(form.viewCount) || 0,
    likeCount: Number(form.likeCount) || 0,
    description: form.description,
    questions: form.questions || [],
    tags: form.tags || [form.category, form.partyMode]
  }
}

function listLocalActivities() {
  return Promise.resolve([...readCreatedActivities(), ...activities].map(applyModerationOverlay))
}

export async function listActivities() {
  if (USE_UNICLOUD) {
    try {
      const result = await callSuregoFunction('surego-activity', 'list', { limit: 50 })
      return result.map(normalizeActivityRecord)
    } catch (error) {
      return handleSuregoCloudError(error, listLocalActivities)
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

export async function listActivitiesByCity(city = DEFAULT_CITY, cityCode = '') {
  const all = await listActivities()
  const targetCity = normalizeCityName(city || DEFAULT_CITY)
  const targetCode = normalizeCityCode(cityCode)
  if (!targetCity && !targetCode) return all
  return all.filter((item) => activityMatchesCity(item, targetCity, targetCode))
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
  return CITY_OPTIONS.map((city) => ({
    ...city,
    count: all.filter((item) => activityMatchesCity(item, city.name, city.code)).length
  }))
}

function getLocalActivityDetail(id) {
  const created = readCreatedActivities()
  const found = created.find((item) => item.id === String(id))
  return Promise.resolve(applyModerationOverlay(found || findActivityById(id)))
}

export async function getActivityDetail(id) {
  if (USE_UNICLOUD && !String(id).startsWith('local_')) {
    try {
      const detail = await callSuregoFunction('surego-activity', 'detail', { id })
      return normalizeActivityRecord(detail || findActivityById(id))
    } catch (error) {
      return handleSuregoCloudError(error, () => getLocalActivityDetail(id))
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
      return handleSuregoCloudError(error, () => createLocalActivity(form))
    }
  }
  return createLocalActivity(form)
}

function updateLocalActivityStatus(id, status) {
  const created = readCreatedActivities()
  const next = created.map((item) => (item.id === String(id) ? { ...item, status } : item))
  writeCreatedActivities(next)
  return Promise.resolve({ id, status: normalizeActivityStatus(status) })
}

export async function updateActivityStatus(id, status) {
  const nextStatus = normalizeActivityStatus(status)
  if (USE_UNICLOUD && !String(id).startsWith('local_')) {
    try {
      return await callSuregoFunction('surego-activity', 'updateStatus', { id, status: nextStatus })
    } catch (error) {
      return handleSuregoCloudError(error, () => updateLocalActivityStatus(id, nextStatus))
    }
  }
  return updateLocalActivityStatus(id, nextStatus)
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
    address: form.address || form.location,
    latitude: form.latitude || found.latitude || '',
    longitude: form.longitude || found.longitude || '',
    city: normalizeCityName(form.city || found.city || DEFAULT_CITY),
    cityCode: normalizeCityCode(form.cityCode || form.city_code || found.cityCode || found.city_code || DEFAULT_CITY_CODE),
    city_code: normalizeCityCode(form.cityCode || form.city_code || found.cityCode || found.city_code || DEFAULT_CITY_CODE),
    district: form.district || found.district || '',
    maxParticipants: Number(form.maxParticipants) || found.maxParticipants,
    hasParticipantLimit: Boolean(form.hasParticipantLimit),
    requireApproval: Boolean(form.requireApproval),
    partyMode: form.partyMode,
    amount: Number(form.amount) || 0,
    price: form.partyMode === 'free' ? '免费' : String(Number(form.amount) || 0),
    description: form.description,
    questions: form.questions || [],
    image: form.image || found.image,
    status: normalizeActivityStatus(form.status || found.status),
    lifecycleStatus: normalizeActivityStatus(form.status || found.status),
    tags: [form.category, form.partyMode]
  }

  writeCreatedActivities(created.map((item) => (item.id === String(id) ? nextActivity : item)))
  return Promise.resolve(nextActivity)
}

export async function updateActivity(id, form) {
  const city = normalizeCityName(form.city || DEFAULT_CITY)
  const cityCode = normalizeCityCode(form.cityCode || form.city_code || inferCityCode({ city }, city))
  const payload = {
    ...form,
    city,
    cityCode,
    city_code: cityCode
  }
  if (USE_UNICLOUD && !String(id).startsWith('local_')) {
    try {
      return await callSuregoFunction('surego-activity', 'update', { id, ...payload })
    } catch (error) {
      return handleSuregoCloudError(error, () => updateLocalActivity(id, payload))
    }
  }
  return updateLocalActivity(id, payload)
}

export async function listMyActivities() {
  const all = await listActivities()
  return Promise.resolve({
    hosting: all.filter((item) => isCurrentUserActivityCreator(item)),
    joined: all.filter((item) => item.applicationStatus === 'approved'),
    pending: all.filter((item) => item.applicationStatus === 'pending' || uni.getStorageSync(`surego_application_${item.id}`))
  })
}
