import { USE_UNICLOUD } from '@/common/config/runtime.js'
import { callSuregoFunction } from '@/common/api/cloud.js'
import { getCurrentUserId, getCurrentUserProfile, saveCurrentUserProfile, setMockLogin } from '@/common/api/auth.js'

const STORAGE_KEY = 'surego_current_user'

const defaultUser = {
  nickname: '吴哈哈',
  avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Lucky',
  credit: 100,
  mbti: 'ENFP',
  bio: '爱摄影、爱生活的斜杠青年',
  quote: '希望能在这里遇到更多志同道合的小伙伴，一起探索城市里的光影。'
}

function readLocalUser() {
  const currentUser = getCurrentUserProfile()
  return {
    ...defaultUser,
    ...currentUser,
    ...(uni.getStorageSync(STORAGE_KEY) || {})
  }
}

function writeLocalUser(payload) {
  const next = {
    ...readLocalUser(),
    uid: payload.uid || payload.userId || getCurrentUserId(),
    userId: payload.userId || payload.uid || getCurrentUserId(),
    nickname: payload.nickname || defaultUser.nickname,
    avatar: payload.avatar || defaultUser.avatar,
    credit: Number(payload.credit) || defaultUser.credit,
    mbti: payload.mbti || '',
    bio: payload.bio || '',
    quote: payload.quote || ''
  }
  uni.setStorageSync(STORAGE_KEY, next)
  saveCurrentUserProfile(next)
  return next
}

export function syncCurrentUserProfile(payload = {}) {
  const next = writeLocalUser(payload)
  setMockLogin(next)
  return Promise.resolve(next)
}

export async function getCurrentUser() {
  if (USE_UNICLOUD) {
    try {
      const user = await callSuregoFunction('surego-user', 'profile', { userId: getCurrentUserId() })
      return user ? writeLocalUser(user) : readLocalUser()
    } catch (error) {
      return readLocalUser()
    }
  }
  return readLocalUser()
}

export async function updateCurrentUser(payload) {
  const next = writeLocalUser(payload)
  if (USE_UNICLOUD) {
    try {
      const user = await callSuregoFunction('surego-user', 'updateProfile', next)
      return user ? writeLocalUser(user) : next
    } catch (error) {
      return next
    }
  }
  return next
}
