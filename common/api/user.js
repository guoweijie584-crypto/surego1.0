import { USE_UNICLOUD, shouldUseCloudFallback, shouldUseReferenceMockPreview } from '../config/runtime.js'
import { callSuregoFunction, handleSuregoCloudError } from '@/common/api/cloud.js'
import { DEFAULT_USER_AVATAR, DEFAULT_USER_NICKNAME, getCurrentUserId, getCurrentUserProfile, isLoggedIn, saveCurrentUserProfile, setMockLogin } from '@/common/api/auth.js'
import { isPubliclyVisibleActivity, listAllActivities, sortActivitiesByStatusPriority } from '@/common/api/activity.js'
import { listApplications } from '@/common/api/application.js'

const STORAGE_KEY = 'surego_current_user'
const LOCAL_FOLLOWS_KEY = 'surego_partner_follows'
const LOCAL_CHECKINS_KEY = 'surego_checkins'
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
const PROFILE_EXTRA_KEYS = [
  'followingCount',
  'following_count',
  'followerCount',
  'follower_count',
  'fansCount',
  'fans_count',
  'fulfillmentSuccessRate',
  'fulfillment_success_rate',
  'fulfillmentRate',
  'fulfillment_rate',
  'fulfillmentSuccessCount',
  'fulfillment_success_count',
  'fulfillmentTotalCount',
  'fulfillment_total_count',
  'partnerMatchedCount',
  'partner_matched_count',
  'partnerMatchSuccessCount',
  'partner_match_success_count',
  'reputationReviewCount',
  'reputation_review_count',
  'reviewCount',
  'review_count',
  'reputationTags',
  'reputation_tags',
  'profileTags',
  'profile_tags',
  'impressionTags',
  'impression_tags',
  'reputationReviews',
  'reputation_reviews',
  'reviews'
]

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
  const next = {
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
  for (const key of PROFILE_EXTRA_KEYS) {
    if (payload[key] !== undefined) {
      next[key] = payload[key]
    } else if (current[key] !== undefined) {
      next[key] = current[key]
    }
  }
  return next
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

export async function getCurrentUser(options = {}) {
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
      if (options.allowFallback === false) {
        throw error
      }
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

function normalizeMetricNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, number) : fallback
}

function normalizeOptionalMetricNumber(value) {
  if (value === undefined || value === null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, number) : null
}

function readLocalList(key) {
  try {
    const items = uni.getStorageSync(key)
    return Array.isArray(items) ? items : []
  } catch (error) {
    return []
  }
}

function countLocalUserFollowers(userId) {
  const targetUserId = String(userId || '').trim()
  if (!targetUserId) return 0
  const seen = new Set()
  readLocalList(LOCAL_FOLLOWS_KEY)
    .filter((item) => (
      String(item.target_type || item.targetType || '') === 'user'
        && String(item.target_id || item.targetId || '') === targetUserId
    ))
    .forEach((item) => {
      const followerId = String(item.user_id || item.userId || item.follower_id || item.followerId || '').trim()
      if (followerId) seen.add(followerId)
    })
  return seen.size
}

function isLocalFollowingUser(targetUserId, followerUserId = getCurrentUserId()) {
  const targetId = String(targetUserId || '').trim()
  const followerId = String(followerUserId || '').trim()
  if (!targetId || !followerId || targetId === followerId) return false
  return readLocalList(LOCAL_FOLLOWS_KEY).some((item) => (
    String(item.target_type || item.targetType || '') === 'user'
      && String(item.target_id || item.targetId || '') === targetId
      && String(item.user_id || item.userId || item.follower_id || item.followerId || '') === followerId
  ))
}

function writeLocalFollows(items) {
  uni.setStorageSync(LOCAL_FOLLOWS_KEY, Array.isArray(items) ? items : [])
}

function buildUserFollowPayload(targetUserId, followedByMe) {
  const targetId = String(targetUserId || '').trim()
  const followerCount = countLocalUserFollowers(targetId)
  return {
    targetUserId: targetId,
    target_user_id: targetId,
    followedByMe,
    followed_by_me: followedByMe,
    followerCount,
    follower_count: followerCount,
    fansCount: followerCount,
    fans_count: followerCount
  }
}

function followLocalUser(targetUserId, followerUserId = getCurrentUserId()) {
  const targetId = String(targetUserId || '').trim()
  const followerId = String(followerUserId || '').trim()
  if (!targetId || !followerId || targetId === followerId) {
    return Promise.resolve(buildUserFollowPayload(targetId, false))
  }
  const follows = readLocalList(LOCAL_FOLLOWS_KEY)
  const existing = follows.find((item) => (
    String(item.target_type || item.targetType || '') === 'user'
      && String(item.target_id || item.targetId || '') === targetId
      && String(item.user_id || item.userId || item.follower_id || item.followerId || '') === followerId
  ))
  if (existing) return Promise.resolve(buildUserFollowPayload(targetId, true))
  writeLocalFollows([
    {
      id: `follow_user_${Date.now()}`,
      target_type: 'user',
      target_id: targetId,
      user_id: followerId,
      created_at: new Date().toISOString()
    },
    ...follows
  ])
  return Promise.resolve(buildUserFollowPayload(targetId, true))
}

function unfollowLocalUser(targetUserId, followerUserId = getCurrentUserId()) {
  const targetId = String(targetUserId || '').trim()
  const followerId = String(followerUserId || '').trim()
  if (!targetId || !followerId) return Promise.resolve(buildUserFollowPayload(targetId, false))
  writeLocalFollows(readLocalList(LOCAL_FOLLOWS_KEY).filter((item) => !(
    String(item.target_type || item.targetType || '') === 'user'
      && String(item.target_id || item.targetId || '') === targetId
      && String(item.user_id || item.userId || item.follower_id || item.followerId || '') === followerId
  )))
  return Promise.resolve(buildUserFollowPayload(targetId, false))
}

function getLocalCheckedActivityIdsForUser(userId) {
  const targetUserId = String(userId || '').trim()
  const ids = new Set()
  if (!targetUserId) return ids
  readLocalList(LOCAL_CHECKINS_KEY)
    .filter((item) => (
      String(item.userId || item.user_id || '') === targetUserId
        && String(item.status || 'checked') === 'checked'
    ))
    .forEach((item) => {
      const activityId = String(item.activityId || item.activity_id || '').trim()
      if (activityId) ids.add(activityId)
    })
  return ids
}

function parseActivityDate(activity = {}) {
  const direct = activity.dateValue || activity.date_value || activity.startAt || activity.start_at
  if (direct) {
    const parsed = new Date(String(direct).replace(/\./g, '-'))
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  const dateText = String(activity.date || '').trim()
  const isoMatched = dateText.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)
  if (isoMatched) {
    const parsed = new Date(Number(isoMatched[1]), Number(isoMatched[2]) - 1, Number(isoMatched[3]))
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  const cnMatched = dateText.match(/(\d{1,2})月(\d{1,2})日/)
  if (cnMatched) {
    const parsed = new Date()
    parsed.setMonth(Number(cnMatched[1]) - 1, Number(cnMatched[2]))
    parsed.setHours(0, 0, 0, 0)
    return parsed
  }
  return null
}

function isCompletedForFulfillment(activity = {}) {
  const status = String(activity.status || activity.lifecycleStatus || '').trim()
  if (status === 'finished') return true
  if (status === 'cancelled') return false
  const parsed = parseActivityDate(activity)
  if (!parsed) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  parsed.setHours(0, 0, 0, 0)
  return parsed.getTime() < today.getTime()
}

function normalizePublicProfile(item = {}) {
  const uid = item.uid || item.userId || item.user_id || ''
  const recentActivities = item.recentActivities || item.recent_activities || []
  const followingCount = normalizeMetricNumber(item.followingCount ?? item.following_count ?? item.followCount ?? item.follow_count ?? 0)
  const followerCount = normalizeMetricNumber(item.followerCount ?? item.follower_count ?? item.fansCount ?? item.fans_count ?? 0)
  const followedByMe = Boolean(item.followedByMe ?? item.followed_by_me ?? false)
  const fulfillmentSuccessCount = normalizeMetricNumber(item.fulfillmentSuccessCount ?? item.fulfillment_success_count ?? 0)
  const fulfillmentTotalCount = normalizeMetricNumber(item.fulfillmentTotalCount ?? item.fulfillment_total_count ?? 0)
  const fulfillmentRate = normalizeOptionalMetricNumber(
    item.fulfillmentSuccessRate ?? item.fulfillment_success_rate ?? item.fulfillmentRate ?? item.fulfillment_rate
  )
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
    profileTags: item.profileTags || item.profile_tags || [],
    profile_tags: item.profileTags || item.profile_tags || [],
    followingCount,
    following_count: followingCount,
    followerCount,
    follower_count: followerCount,
    fansCount: followerCount,
    fans_count: followerCount,
    followedByMe,
    followed_by_me: followedByMe,
    fulfillmentSuccessRate: fulfillmentRate,
    fulfillment_success_rate: fulfillmentRate,
    fulfillmentRate,
    fulfillment_rate: fulfillmentRate,
    fulfillmentSuccessCount,
    fulfillment_success_count: fulfillmentSuccessCount,
    fulfillmentTotalCount,
    fulfillment_total_count: fulfillmentTotalCount,
    activityCount: normalizeMetricNumber(item.activityCount ?? item.activity_count ?? 0),
    hostedCount: normalizeMetricNumber(item.hostedCount ?? item.hosted_count ?? 0),
    joinedCount: normalizeMetricNumber(item.joinedCount ?? item.joined_count ?? 0),
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
      followerCount: 0,
      follower_count: 0,
      fansCount: 0,
      fans_count: 0,
      followedByMe: false,
      followed_by_me: false,
      fulfillmentSuccessRate: null,
      fulfillment_success_rate: null,
      fulfillmentSuccessCount: 0,
      fulfillment_success_count: 0,
      fulfillmentTotalCount: 0,
      fulfillment_total_count: 0,
      recentActivities: []
    }
  }

  const allActivities = await listAllActivities()
  const publicVisibleActivities = allActivities.filter(isPubliclyVisibleActivity)
  const hosted = publicVisibleActivities
    .filter((activity) => pickActivityCreatorId(activity) === targetUserId)
    .map((activity) => ({ ...activity, publicRelation: 'hosted' }))
  const joined = []
  const fulfillmentActivityIds = new Set()

  await Promise.all(allActivities.map(async (activity) => {
    const activityId = pickActivityId(activity)
    if (!activityId || pickActivityCreatorId(activity) === targetUserId) return
    const applications = await listApplications(activityId)
    const approved = applications.some((application) => (
      String(application.userId || application.user_id || '') === targetUserId
        && application.status === 'approved'
    ))
    if (!approved) return
    if (isPubliclyVisibleActivity(activity)) joined.push({ ...activity, publicRelation: 'joined' })
    if (isCompletedForFulfillment(activity)) fulfillmentActivityIds.add(activityId)
  }))

  const seen = new Set()
  const publicActivities = sortActivitiesByStatusPriority([...hosted, ...joined]).filter((activity) => {
    const activityId = pickActivityId(activity)
    if (!activityId || seen.has(activityId)) return false
    seen.add(activityId)
    return true
  })
  const checkedActivityIds = getLocalCheckedActivityIdsForUser(targetUserId)
  const fulfillmentSuccessCount = Array.from(fulfillmentActivityIds)
    .filter((activityId) => checkedActivityIds.has(activityId)).length
  const fulfillmentTotalCount = fulfillmentActivityIds.size
  const fulfillmentSuccessRate = fulfillmentTotalCount
    ? Math.round((fulfillmentSuccessCount / fulfillmentTotalCount) * 100)
    : null
  const followerCount = countLocalUserFollowers(targetUserId)
  const followedByMe = isLocalFollowingUser(targetUserId)

  return {
    activityCount: publicActivities.length,
    hostedCount: hosted.length,
    joinedCount: joined.length,
    followerCount,
    follower_count: followerCount,
    fansCount: followerCount,
    fans_count: followerCount,
    followedByMe,
    followed_by_me: followedByMe,
    fulfillmentSuccessRate,
    fulfillment_success_rate: fulfillmentSuccessRate,
    fulfillmentRate: fulfillmentSuccessRate,
    fulfillment_rate: fulfillmentSuccessRate,
    fulfillmentSuccessCount,
    fulfillment_success_count: fulfillmentSuccessCount,
    fulfillmentTotalCount,
    fulfillment_total_count: fulfillmentTotalCount,
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

export async function followUser(targetUserId) {
  const id = String(targetUserId || '').trim()
  if (!id) return buildUserFollowPayload('', false)
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      return await callSuregoFunction('surego-user', 'followUser', { targetUserId: id })
    } catch (error) {
      return handleSuregoCloudError(error, () => followLocalUser(id))
    }
  }
  return followLocalUser(id)
}

export async function unfollowUser(targetUserId) {
  const id = String(targetUserId || '').trim()
  if (!id) return buildUserFollowPayload('', false)
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      return await callSuregoFunction('surego-user', 'unfollowUser', { targetUserId: id })
    } catch (error) {
      return handleSuregoCloudError(error, () => unfollowLocalUser(id))
    }
  }
  return unfollowLocalUser(id)
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
