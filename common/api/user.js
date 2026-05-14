import { USE_UNICLOUD, shouldUseCloudFallback, shouldUseReferenceMockPreview } from '../config/runtime.js'
import { callSuregoFunction, handleSuregoCloudError } from '@/common/api/cloud.js'
import { DEFAULT_USER_AVATAR, DEFAULT_USER_NICKNAME, getCurrentUserId, getCurrentUserProfile, isLoggedIn, saveCurrentUserProfile, setMockLogin } from '@/common/api/auth.js'
import { isPubliclyVisibleActivity, listAllActivities, sortActivitiesByStatusPriority } from '@/common/api/activity.js'
import { listApplications } from '@/common/api/application.js'

const STORAGE_KEY = 'surego_current_user'
const LEGACY_MOCK_NICKNAME = String.fromCharCode(21556, 21704, 21704)
const ROLE_VALUES = ['user', 'operator', 'admin']
const ROLE_LABELS = {
  user: '普通用户',
  operator: '运营人员',
  admin: '管理员'
}

const defaultUser = {
  nickname: DEFAULT_USER_NICKNAME,
  avatar: DEFAULT_USER_AVATAR,
  credit: 100,
  mbti: 'ENFP',
  bio: '爱摄影、爱生活的斜杠青年',
  quote: '希望能在这里遇到更多志同道合的小伙伴，一起探索城市里的光影。'
}

function sanitizeNickname(value, fallback = DEFAULT_USER_NICKNAME) {
  const nickname = String(value || '').trim()
  if (!nickname || nickname === '未登录' || nickname === LEGACY_MOCK_NICKNAME) {
    return fallback
  }
  return nickname
}

function sanitizeAvatar(value, fallback = DEFAULT_USER_AVATAR) {
  const avatar = String(value || '').trim()
  return avatar || fallback
}

function normalizeRoles(roles = []) {
  const values = Array.isArray(roles) ? roles : [roles]
  const next = values.map((role) => String(role || '').trim().toLowerCase()).filter((role) => ROLE_VALUES.includes(role))
  return next.length ? Array.from(new Set(next)) : ['user']
}

export function getRoleLabel(role) {
  return ROLE_LABELS[String(role || '').toLowerCase()] || '普通用户'
}

export function isAdminUser(profile = getCurrentUserProfile()) {
  return normalizeRoles(profile.roles || profile.role).includes('admin')
}

function readLocalUser() {
  const currentUser = getCurrentUserProfile()
  if (currentUser.isAnonymous) {
    return {
      ...defaultUser,
      ...currentUser
    }
  }
  const next = {
    ...defaultUser,
    ...currentUser,
    ...(uni.getStorageSync(STORAGE_KEY) || {})
  }
  return {
    ...next,
    nickname: sanitizeNickname(next.nickname),
    avatar: sanitizeAvatar(next.avatar)
  }
}

function buildUserPayload(payload = {}) {
  const current = readLocalUser()
  return {
    ...current,
    uid: payload.uid || payload.userId || getCurrentUserId(),
    userId: payload.userId || payload.uid || getCurrentUserId(),
    nickname: sanitizeNickname(payload.nickname || current.nickname),
    avatar: sanitizeAvatar(payload.avatar || current.avatar),
    avatarFileId: payload.avatarFileId || payload.avatar_file_id || current.avatarFileId || '',
    profileCompletedAt: payload.profileCompletedAt || payload.profile_completed_at || current.profileCompletedAt || 0,
    credit: Number(payload.credit) || Number(current.credit) || defaultUser.credit,
    mbti: payload.mbti || current.mbti || '',
    bio: payload.bio || current.bio || '',
    quote: payload.quote || current.quote || '',
    roles: normalizeRoles(payload.roles || payload.role || current.roles || current.role),
    role: normalizeRoles(payload.roles || payload.role || current.roles || current.role)
  }
}

function writeLocalUser(payload) {
  const next = buildUserPayload(payload)
  uni.setStorageSync(STORAGE_KEY, next)
  saveCurrentUserProfile(next)
  return next
}

export async function syncCurrentUserProfile(payload = {}) {
  const next = buildUserPayload({
    ...payload,
    profileCompletedAt: payload.profileCompletedAt || payload.profile_completed_at || Date.now()
  })
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      const user = await callSuregoFunction('surego-user', 'updateProfile', next)
      return writeLocalUser(user || next)
    } catch (error) {
      return handleSuregoCloudError(error, () => writeLocalUser(next))
    }
  }
  const saved = writeLocalUser(next)
  if (shouldUseCloudFallback()) {
    setMockLogin(saved)
  }
  return saved
}

export async function getCurrentUser() {
  if (shouldUseReferenceMockPreview()) {
    return readLocalUser()
  }
  if (USE_UNICLOUD && !isLoggedIn()) {
    return getCurrentUserProfile()
  }
  if (USE_UNICLOUD) {
    try {
      const user = await callSuregoFunction('surego-user', 'profile', { userId: getCurrentUserId() })
      return user ? writeLocalUser(user) : readLocalUser()
    } catch (error) {
      return handleSuregoCloudError(error, readLocalUser)
    }
  }
  return readLocalUser()
}

function normalizeUserRecord(item = {}) {
  const uid = item.uid || item.userId || item.user_id || item._id || ''
  const roles = normalizeRoles(item.roles || item.role)
  return {
    ...item,
    id: item.id || item._id || uid,
    uid,
    userId: uid,
    nickname: sanitizeNickname(item.nickname || item.username || item.mobile),
    avatar: sanitizeAvatar(item.avatar),
    roles,
    role: roles,
    roleText: roles.map(getRoleLabel).join('、'),
    lastLoginDate: item.lastLoginDate || item.last_login_date || 0,
    registerDate: item.registerDate || item.register_date || 0
  }
}

function pickActivityId(activity = {}) {
  return String(activity.id || activity._id || '')
}

function pickActivityCreatorId(activity = {}) {
  return String(activity.creatorId || activity.creator_id || '')
}

function normalizePublicActivity(activity = {}, relation = 'joined') {
  return {
    id: pickActivityId(activity),
    title: activity.title || 'SureGo 活动',
    image: activity.image || activity.cover || '',
    date: activity.date || '',
    time: activity.time || '',
    location: activity.location || activity.address || '',
    city: activity.city || '',
    relation
  }
}

function normalizePublicProfile(item = {}) {
  const uid = item.uid || item.userId || item.user_id || ''
  const recentActivities = item.recentActivities || item.recent_activities || []
  return {
    uid,
    userId: uid,
    nickname: sanitizeNickname(item.nickname || item.username || item.mobile),
    avatar: sanitizeAvatar(item.avatar),
    profileCompletedAt: item.profileCompletedAt || item.profile_completed_at || 0,
    credit: Number(item.credit) || 100,
    mbti: item.mbti || '',
    bio: item.bio || '',
    quote: item.quote || '',
    activityCount: Number(item.activityCount ?? item.activity_count ?? 0),
    hostedCount: Number(item.hostedCount ?? item.hosted_count ?? 0),
    joinedCount: Number(item.joinedCount ?? item.joined_count ?? 0),
    recentActivities: Array.isArray(recentActivities) ? recentActivities.map((activity) => normalizePublicActivity(activity, activity.relation || activity.publicRelation || 'joined')) : []
  }
}

async function listLocalPublicActivitiesForUser(userId) {
  const targetUserId = String(userId || '').trim()
  if (!targetUserId) {
    return {
      activityCount: 0,
      hostedCount: 0,
      joinedCount: 0,
      recentActivities: []
    }
  }

  const allActivities = (await listAllActivities()).filter(isPubliclyVisibleActivity)
  const hosted = allActivities
    .filter((activity) => pickActivityCreatorId(activity) === targetUserId)
    .map((activity) => ({ ...activity, publicRelation: 'hosted' }))
  const joined = []

  await Promise.all(allActivities.map(async (activity) => {
    const activityId = pickActivityId(activity)
    if (!activityId || pickActivityCreatorId(activity) === targetUserId) return
    const applications = await listApplications(activityId)
    const approved = applications.some((application) => (
      String(application.userId || application.user_id || '') === targetUserId
        && application.status === 'approved'
    ))
    if (approved) joined.push({ ...activity, publicRelation: 'joined' })
  }))

  const seen = new Set()
  const publicActivities = sortActivitiesByStatusPriority([...hosted, ...joined]).filter((activity) => {
    const activityId = pickActivityId(activity)
    if (!activityId || seen.has(activityId)) return false
    seen.add(activityId)
    return true
  })

  return {
    activityCount: publicActivities.length,
    hostedCount: hosted.length,
    joinedCount: joined.length,
    recentActivities: publicActivities.slice(0, 3).map((activity) => normalizePublicActivity(activity, activity.publicRelation || 'joined'))
  }
}

async function buildLocalPublicProfile(userId) {
  const [profile] = await getUserProfiles([userId])
  const activitySummary = await listLocalPublicActivitiesForUser(userId)
  return normalizePublicProfile({
    ...(profile || { uid: userId, userId }),
    ...activitySummary
  })
}

function listLocalUsers() {
  const current = getCurrentUserProfile()
  return Promise.resolve([normalizeUserRecord(current)])
}

export async function listUsers() {
  if (USE_UNICLOUD) {
    try {
      const users = await callSuregoFunction('surego-user', 'listUsers', {})
      return users.map(normalizeUserRecord)
    } catch (error) {
      return handleSuregoCloudError(error, listLocalUsers)
    }
  }
  return listLocalUsers()
}

export async function updateUserRoles(userId, roles = []) {
  const nextRoles = normalizeRoles(roles)
  if (USE_UNICLOUD) {
    try {
      return normalizeUserRecord(await callSuregoFunction('surego-user', 'updateUserRoles', {
        targetUserId: userId,
        roles: nextRoles
      }))
    } catch (error) {
      return handleSuregoCloudError(error, () => null)
    }
  }
  return normalizeUserRecord({ uid: userId, roles: nextRoles })
}

function buildLocalUserProfiles(ids) {
  return ids.map((id) => ({
    uid: id,
    userId: id,
    nickname: id === getCurrentUserId() ? getCurrentUserProfile().nickname : `用户 ${id.slice(-4)}`,
    avatar: '/static/userImg/user.png'
  }))
}

export async function getUserProfiles(userIds = []) {
  const ids = Array.from(new Set(userIds.map(String).filter(Boolean)))
  if (!ids.length) return []
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-user', 'getProfiles', { userIds: ids })
    } catch (error) {
      return handleSuregoCloudError(error, () => buildLocalUserProfiles(ids))
    }
  }
  return ids.map((id) => {
    const current = getCurrentUserProfile()
    return {
      uid: id,
      userId: id,
      nickname: id === current.userId || id === current.uid ? current.nickname : `用户 ${id.slice(-4)}`,
      avatar: id === current.userId || id === current.uid ? (current.avatar || '/static/userImg/user.png') : '/static/userImg/user.png'
    }
  })
}

export async function getUserProfileById(userId) {
  const id = String(userId || '').trim()
  if (!id) return normalizePublicProfile({})
  if (USE_UNICLOUD) {
    try {
      return normalizePublicProfile(await callSuregoFunction('surego-user', 'publicProfile', { targetUserId: id }))
    } catch (error) {
      return handleSuregoCloudError(error, () => buildLocalPublicProfile(id))
    }
  }
  return buildLocalPublicProfile(id)
}

export async function updateCurrentUser(payload) {
  const next = buildUserPayload({
    ...payload,
    profileCompletedAt: payload.profileCompletedAt || payload.profile_completed_at || Date.now()
  })
  if (USE_UNICLOUD) {
    try {
      const user = await callSuregoFunction('surego-user', 'updateProfile', next)
      return writeLocalUser(user || next)
    } catch (error) {
      return handleSuregoCloudError(error, () => writeLocalUser(next))
    }
  }
  return writeLocalUser(next)
}
