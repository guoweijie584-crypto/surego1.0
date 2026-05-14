import { activities, findActivityById } from '@/common/mock/activities.js'
import { USE_UNICLOUD, shouldUseReferenceMockPreview } from '../config/runtime.js'
import { callSuregoFunction, handleSuregoCloudError } from '@/common/api/cloud.js'
import { getCurrentUserId, getCurrentUserProfile } from '@/common/api/auth.js'
import { listMyApplications } from '@/common/api/application.js'
import { getDefaultCoverPreset } from '@/common/utils/cover-presets.js'
import { CITY_OPTIONS, DEFAULT_CITY, DEFAULT_CITY_CODE, getCityCode, inferCityFromLocation, normalizeCityCode, normalizeCityName } from '@/common/utils/city.js'

const STORAGE_KEY = 'surego_created_activities'
const MODERATION_STATUS_KEY = 'surego_moderation_activity_statuses'
const DEFAULT_AVATAR = '/static/userImg/user.png'

export const ACTIVITY_LIFECYCLE_STATUSES = ['draft', 'reviewing', 'published', 'recruiting', 'formed', 'ongoing', 'finished', 'cancelled']
export const APPLICATION_STATUSES = ['not_applied', 'pending', 'approved', 'rejected']
export const PUBLIC_ACTIVITY_LIFECYCLE_STATUSES = ['published', 'recruiting', 'formed', 'ongoing']
export const PUBLIC_ACTIVITY_MODERATION_STATUSES = ['approved', 'visible']
export const ACTIVITY_VISIBILITIES = ['public', 'members_only']
export const ACTIVITY_SOURCES = ['direct_activity', 'partner_post']
export const ACTIVITY_STATUS_META = {
  ongoing: { key: 'ongoing', label: '进行中', tone: 'blue', group: 'active', rank: 10 },
  formed: { key: 'formed', label: '已成局', tone: 'green', group: 'active', rank: 20 },
  recruiting: { key: 'recruiting', label: '报名中', tone: 'green', group: 'active', rank: 30 },
  published: { key: 'published', label: '报名中', tone: 'green', group: 'active', rank: 30 },
  reviewing: { key: 'reviewing', label: '审核中', tone: 'amber', group: 'todo', rank: 40 },
  draft: { key: 'draft', label: '草稿', tone: 'gray', group: 'todo', rank: 50 },
  finished: { key: 'finished', label: '已结束', tone: 'gray', group: 'done', rank: 70 },
  rejected: { key: 'rejected', label: '审核驳回', tone: 'red', group: 'issue', rank: 80 },
  cancelled: { key: 'cancelled', label: '已取消', tone: 'red', group: 'cancelled', rank: 90 },
  hidden: { key: 'hidden', label: '已下架', tone: 'red', group: 'issue', rank: 100 }
}
export const ACTIVITY_STATUS_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'todo', label: '待处理' },
  { key: 'done', label: '已结束' },
  { key: 'cancelled', label: '已取消' },
  { key: 'issue', label: '异常' }
]
export const ACTIVITY_CREATOR_STATUS_TRANSITIONS = {
  draft: ['reviewing'],
  reviewing: ['draft'],
  published: ['formed', 'cancelled'],
  recruiting: ['formed', 'cancelled'],
  formed: ['ongoing', 'cancelled'],
  ongoing: ['finished']
}

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

export function getAllowedActivityStatusTransitions(activity = {}) {
  const status = normalizeActivityStatus(activity.status || activity.lifecycleStatus)
  const moderationStatus = normalizeModerationStatus(activity.moderationStatus || activity.moderation_status)
  if (['hidden', 'rejected'].includes(moderationStatus)) return []
  if (status === 'draft') return ACTIVITY_CREATOR_STATUS_TRANSITIONS.draft
  if (status === 'reviewing') return ACTIVITY_CREATOR_STATUS_TRANSITIONS.reviewing
  if (!PUBLIC_ACTIVITY_MODERATION_STATUSES.includes(moderationStatus)) return []
  return ACTIVITY_CREATOR_STATUS_TRANSITIONS[status] || []
}

export function canTransitionActivityStatus(activity = {}, nextStatus = '') {
  const normalizedNext = normalizeActivityStatus(nextStatus)
  return getAllowedActivityStatusTransitions(activity).includes(normalizedNext)
}

function assertActivityStatusTransition(activity = {}, nextStatus = '') {
  if (canTransitionActivityStatus(activity, nextStatus)) return
  const current = normalizeActivityStatus(activity.status || activity.lifecycleStatus)
  const next = normalizeActivityStatus(nextStatus)
  throw new Error(`不允许从${current}切换到${next}`)
}

function normalizeApplicationStatus(status = 'not_applied') {
  return APPLICATION_STATUSES.includes(status) ? status : 'not_applied'
}

function normalizeActivityVisibility(visibility = 'public') {
  return ACTIVITY_VISIBILITIES.includes(visibility) ? visibility : 'public'
}

function normalizeActivitySource(source = 'direct_activity') {
  return ACTIVITY_SOURCES.includes(source) ? source : 'direct_activity'
}

function normalizeModerationStatus(status = 'pending') {
  const nextStatus = status || 'pending'
  return ['pending', 'approved', 'rejected', 'hidden', 'visible'].includes(nextStatus) ? nextStatus : 'pending'
}

export function getActivityStatusMeta(activity = {}) {
  const status = normalizeActivityStatus(activity.status || activity.lifecycleStatus)
  const moderationStatus = normalizeModerationStatus(activity.moderationStatus || activity.moderation_status)

  if (moderationStatus === 'hidden') return ACTIVITY_STATUS_META.hidden
  if (moderationStatus === 'rejected') return ACTIVITY_STATUS_META.rejected
  if (status === 'cancelled') return ACTIVITY_STATUS_META.cancelled
  if (status === 'finished') return ACTIVITY_STATUS_META.finished
  if (moderationStatus === 'pending' && status !== 'draft') return ACTIVITY_STATUS_META.reviewing
  return ACTIVITY_STATUS_META[status] || ACTIVITY_STATUS_META.recruiting
}

function getActivitySortTime(activity = {}) {
  const candidates = [
    activity.dateValue,
    activity.startAt,
    activity.start_at,
    activity.date,
    activity.updatedAt,
    activity.updated_at,
    activity.createdAt,
    activity.created_at
  ]
  for (const value of candidates) {
    if (!value) continue
    if (typeof value === 'number') return value
    const parsed = Date.parse(String(value).replace(/\./g, '-'))
    if (!Number.isNaN(parsed)) return parsed
  }
  return Number.MAX_SAFE_INTEGER
}

export function sortActivitiesByStatusPriority(items = []) {
  return [...items].sort((a, b) => {
    const aMeta = getActivityStatusMeta(a)
    const bMeta = getActivityStatusMeta(b)
    if (aMeta.rank !== bMeta.rank) return aMeta.rank - bMeta.rank
    const timeDiff = getActivitySortTime(a) - getActivitySortTime(b)
    if (timeDiff !== 0) return timeDiff
    return String(b.updatedAt || b.updated_at || b.createdAt || b.created_at || '').localeCompare(String(a.updatedAt || a.updated_at || a.createdAt || a.created_at || ''))
  })
}

export function isHomeVisibleMyActivity(activity = {}) {
  return ['draft', 'reviewing', 'published', 'recruiting', 'formed', 'ongoing'].includes(getActivityStatusMeta(activity).key)
}

export function filterActivitiesByStatusGroup(items = [], filterKey = 'all') {
  const sorted = sortActivitiesByStatusPriority(items)
  if (!filterKey || filterKey === 'all') return sorted
  return sorted.filter((item) => getActivityStatusMeta(item).group === filterKey)
}

function normalizeOrganizerAvatar(avatar = '') {
  const value = String(avatar || '').trim()
  if (!value || value.includes('api.dicebear.com') || value.includes('avataaars')) return DEFAULT_AVATAR
  return value
}

export function isPubliclyVisibleActivity(item = {}) {
  const rawStatus = String(item.status || item.lifecycleStatus || '')
  const status = normalizeActivityStatus(item.status || item.lifecycleStatus)
  const moderationStatus = normalizeModerationStatus(item.moderationStatus || item.moderation_status)
  const visibility = normalizeActivityVisibility(item.visibility)
  if (rawStatus === 'rejected' || rawStatus === 'hidden') return false
  return visibility === 'public'
    && PUBLIC_ACTIVITY_LIFECYCLE_STATUSES.includes(status)
    && PUBLIC_ACTIVITY_MODERATION_STATUSES.includes(moderationStatus)
}

function isActivityParticipant(item = {}, userId = getCurrentUserId()) {
  const participantIds = item.participantIds || item.participant_ids || []
  return Boolean(userId && Array.isArray(participantIds) && participantIds.map(String).includes(String(userId)))
}

function canCurrentUserViewActivity(item = {}) {
  if (isPubliclyVisibleActivity(item)) return true
  if (isCurrentUserActivityCreator(item)) return true
  return isActivityParticipant(item)
}

function readLocalApplication(activityId) {
  try {
    return uni.getStorageSync(`surego_application_${activityId}`) || null
  } catch (error) {
    return null
  }
}

function inferCityName(item = {}) {
  const directCity = normalizeCityName(item.city || item.city_name)
  if (directCity) return directCity

  const location = `${item.location || ''} ${item.address || ''}`
  return inferCityFromLocation(location, { city: DEFAULT_CITY, cityCode: DEFAULT_CITY_CODE }).city
}

function inferCityCode(item = {}, cityName = DEFAULT_CITY) {
  const directCode = normalizeCityCode(item.cityCode || item.city_code)
  if (directCode) return directCode

  const inferredCode = getCityCode(cityName, '')
  if (inferredCode) return inferredCode
  return normalizeCityName(cityName) === DEFAULT_CITY ? DEFAULT_CITY_CODE : ''
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
  const moderationStatus = normalizeModerationStatus(item.moderationStatus || item.moderation_status)
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
    organizerAvatar: normalizeOrganizerAvatar(item.organizerAvatar || item.organizer_avatar),
    creatorId,
    creator_id: creatorId,
    city,
    cityCode,
    city_code: cityCode,
    district: item.district || '',
    visibility: normalizeActivityVisibility(item.visibility),
    source: normalizeActivitySource(item.source),
    sourcePartnerPostId: item.sourcePartnerPostId || item.source_partner_post_id || '',
    source_partner_post_id: item.sourcePartnerPostId || item.source_partner_post_id || '',
    participantIds: item.participantIds || item.participant_ids || [],
    participant_ids: item.participantIds || item.participant_ids || [],
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
  const visibility = normalizeActivityVisibility(form.visibility || 'public')
  const source = normalizeActivitySource(form.source || 'direct_activity')
  return {
    id,
    title: form.title,
    creatorId,
    creator_id: creatorId,
    organizer: form.organizer || currentUser.nickname,
    organizerAvatar: normalizeOrganizerAvatar(form.organizerAvatar || currentUser.avatar),
    image: form.image || getDefaultCoverPreset(form.category).image,
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
    status: normalizeActivityStatus(form.status || 'reviewing'),
    lifecycleStatus: normalizeActivityStatus(form.status || 'reviewing'),
    moderationStatus: 'pending',
    moderation_status: 'pending',
    applicationStatus: normalizeApplicationStatus(form.applicationStatus || 'not_applied'),
    visibility,
    source,
    sourcePartnerPostId: form.sourcePartnerPostId || form.source_partner_post_id || '',
    source_partner_post_id: form.sourcePartnerPostId || form.source_partner_post_id || '',
    participantIds: form.participantIds || form.participant_ids || [],
    participant_ids: form.participantIds || form.participant_ids || [],
    viewCount: Number(form.viewCount) || 0,
    likeCount: Number(form.likeCount) || 0,
    description: form.description,
    questions: form.questions || [],
    tags: form.tags || [form.category, form.partyMode]
  }
}

function markReferenceActivityApproved(item = {}) {
  return {
    visibility: 'public',
    source: 'direct_activity',
    moderationStatus: 'approved',
    moderation_status: 'approved',
    ...item
  }
}

function listLocalActivities() {
  return Promise.resolve([
    ...readCreatedActivities(),
    ...activities.map(markReferenceActivityApproved)
  ].map(applyModerationOverlay))
}

async function listPublicLocalActivities() {
  const all = await listLocalActivities()
  return all.filter(isPubliclyVisibleActivity)
}

export async function listActivities() {
  if (shouldUseReferenceMockPreview()) {
    return listPublicLocalActivities()
  }
  if (USE_UNICLOUD) {
    try {
      const result = await callSuregoFunction('surego-activity', 'list', { limit: 50 })
      return result.map(normalizeActivityRecord).filter(isPubliclyVisibleActivity)
    } catch (error) {
      return handleSuregoCloudError(error, listPublicLocalActivities)
    }
  }
  return listPublicLocalActivities()
}

export async function listAllActivities() {
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
  const source = found || markReferenceActivityApproved(findActivityById(id))
  const activity = applyModerationOverlay(source)
  return Promise.resolve(canCurrentUserViewActivity(activity) ? activity : null)
}

export async function getActivityDetail(id) {
  if (shouldUseReferenceMockPreview()) {
    return getLocalActivityDetail(id)
  }
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
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      return await callSuregoFunction('surego-activity', 'create', activity)
    } catch (error) {
      return handleSuregoCloudError(error, () => createLocalActivity(form))
    }
  }
  return createLocalActivity(form)
}

function updateLocalActivityStatus(id, status) {
  const nextStatus = normalizeActivityStatus(status)
  const created = readCreatedActivities()
  const found = created.find((item) => item.id === String(id))
  if (!found) {
    throw new Error('活动不存在或不可更新')
  }
  assertActivityStatusTransition(found, nextStatus)
  const next = created.map((item) => (
    item.id === String(id)
      ? {
          ...item,
          status: nextStatus,
          lifecycleStatus: nextStatus,
          ...(nextStatus === 'reviewing' ? { moderationStatus: 'pending', moderation_status: 'pending' } : {})
        }
      : item
  ))
  writeCreatedActivities(next)
  return Promise.resolve({ id, status: nextStatus })
}

export async function updateActivityStatus(id, status) {
  const nextStatus = normalizeActivityStatus(status)
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview() && !String(id).startsWith('local_')) {
    try {
      return await callSuregoFunction('surego-activity', 'updateStatus', { id, status: nextStatus })
    } catch (error) {
      if (['INVALID_TRANSITION', 'FORBIDDEN'].includes(String(error?.code || ''))) {
        throw error
      }
      return handleSuregoCloudError(error, () => updateLocalActivityStatus(id, nextStatus))
    }
  }
  return updateLocalActivityStatus(id, nextStatus)
}

function updateLocalActivity(id, form) {
  const created = readCreatedActivities()
  const found = created.find((item) => item.id === String(id))
  if (!found) return Promise.resolve(null)
  const nextCity = normalizeCityName(form.city || found.city || DEFAULT_CITY)
  const nextCityCode = normalizeCityCode(
    form.cityCode ||
    form.city_code ||
    inferCityCode({ city: nextCity }, nextCity) ||
    found.cityCode ||
    found.city_code ||
    (nextCity === DEFAULT_CITY ? DEFAULT_CITY_CODE : '')
  )

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
    city: nextCity,
    cityCode: nextCityCode,
    city_code: nextCityCode,
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
  const cityCode = normalizeCityCode(form.cityCode || form.city_code || inferCityCode({ city }, city) || (city === DEFAULT_CITY ? DEFAULT_CITY_CODE : ''))
  const payload = {
    ...form,
    city,
    cityCode,
    city_code: cityCode
  }
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview() && !String(id).startsWith('local_')) {
    try {
      return await callSuregoFunction('surego-activity', 'update', { id, ...payload })
    } catch (error) {
      return handleSuregoCloudError(error, () => updateLocalActivity(id, payload))
    }
  }
  return updateLocalActivity(id, payload)
}

export async function listMyActivities() {
  if (shouldUseReferenceMockPreview()) {
    return listMyLocalActivities()
  }
  if (USE_UNICLOUD) {
    try {
      const result = await callSuregoFunction('surego-activity', 'listMine', { limit: 100 })
      return {
        hosting: sortActivitiesByStatusPriority((result.hosting || []).map(normalizeActivityRecord)),
        joined: sortActivitiesByStatusPriority((result.joined || []).map(normalizeActivityRecord)),
        pending: sortActivitiesByStatusPriority([
          ...(result.pending || []),
          ...(result.rejected || [])
        ].map(normalizeActivityRecord))
      }
    } catch (error) {
      return handleSuregoCloudError(error, listMyLocalActivities)
    }
  }
  return listMyLocalActivities()
}

async function listCurrentUserApplications() {
  return listMyApplications()
}

function buildActivityWithApplication(activity = {}, application = {}) {
  const status = normalizeApplicationStatus(application.status || application.applicationStatus || 'pending')
  return normalizeActivityRecord({
    ...activity,
    application,
    applicationId: application.id || application._id || '',
    application_id: application.id || application._id || '',
    applicationStatus: status,
    application_status: status,
    reviewNote: application.reviewNote || application.review_note || activity.reviewNote || '',
    rejectReason: application.rejectReason || application.reject_reason || activity.rejectReason || ''
  })
}

async function listAppliedLocalActivities(all = []) {
  const currentUserId = getCurrentUserId()
  const applications = await listCurrentUserApplications()
  const activityById = all.reduce((map, item) => {
    map[String(item.id || item._id)] = item
    return map
  }, {})
  const applied = []
  const seen = new Set()

  applications.forEach((application) => {
    const activityId = String(application.activityId || application.activity_id || '')
    if (!activityId || seen.has(activityId)) return
    const activity = activityById[activityId]
    if (!activity) return
    if (currentUserId && isCurrentUserActivityCreator(activity)) return
    seen.add(activityId)
    applied.push(buildActivityWithApplication(activity, application))
  })

  all.forEach((activity) => {
    if (isActivityParticipant(activity, currentUserId) && !isCurrentUserActivityCreator(activity) && !seen.has(String(activity.id || activity._id || ''))) {
      const activityId = String(activity.id || activity._id || '')
      if (activityId) {
        seen.add(activityId)
        applied.push(buildActivityWithApplication(activity, {
          id: `participant_application_${activityId}`,
          activityId,
          activity_id: activityId,
          userId: currentUserId,
          user_id: currentUserId,
          status: 'approved'
        }))
      }
    }
    const activityId = String(activity.id || activity._id || '')
    const embeddedStatus = normalizeApplicationStatus(activity.applicationStatus || activity.application_status)
    if (!activityId || embeddedStatus === 'not_applied' || seen.has(activityId)) return
    if (currentUserId && isCurrentUserActivityCreator(activity)) return
    seen.add(activityId)
    applied.push(buildActivityWithApplication(activity, {
      id: `reference_application_${activityId}`,
      activityId,
      activity_id: activityId,
      userId: currentUserId,
      user_id: currentUserId,
      status: embeddedStatus
    }))
  })

  return {
    joined: sortActivitiesByStatusPriority(applied.filter((item) => item.applicationStatus === 'approved')),
    pending: sortActivitiesByStatusPriority(applied.filter((item) => ['pending', 'rejected'].includes(item.applicationStatus)))
  }
}

async function listMyLocalActivities() {
  const all = await listAllActivities()
  const applied = await listAppliedLocalActivities(all)
  return Promise.resolve({
    hosting: sortActivitiesByStatusPriority(all.filter((item) => isCurrentUserActivityCreator(item))),
    joined: applied.joined,
    pending: applied.pending
  })
}
