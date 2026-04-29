import { USE_UNICLOUD, shouldUseCloudFallback } from '../config/runtime.js'
import { callSuregoFunction, handleSuregoCloudError } from '@/common/api/cloud.js'
import { DEFAULT_USER_AVATAR, DEFAULT_USER_NICKNAME, getCurrentUserId, getCurrentUserProfile, isLoggedIn, saveCurrentUserProfile, setMockLogin } from '@/common/api/auth.js'

const STORAGE_KEY = 'surego_current_user'
const LEGACY_MOCK_NICKNAME = String.fromCharCode(21556, 21704, 21704)

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
    quote: payload.quote || current.quote || ''
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
  if (USE_UNICLOUD) {
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

function buildLocalUserProfiles(ids) {
  return ids.map((id) => ({
    uid: id,
    userId: id,
    nickname: id === getCurrentUserId() ? getCurrentUserProfile().nickname : `用户 ${id.slice(-4)}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(id)}`
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
      avatar: id === current.userId || id === current.uid ? current.avatar : `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(id)}`
    }
  })
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
