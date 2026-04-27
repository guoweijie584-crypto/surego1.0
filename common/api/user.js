import { getCurrentUserProfile } from '@/common/api/auth.js'

const STORAGE_KEY = 'surego_current_user'

const defaultUser = {
  nickname: '吴哈哈',
  avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=Lucky',
  credit: 100,
  mbti: 'ENFP',
  bio: '爱摄影、爱生活的斜杠青年',
  quote: '希望能在这里遇到更多志同道合的小伙伴，一起探索城市里的光影。'
}

function readUser() {
  const currentUser = getCurrentUserProfile()
  return {
    ...defaultUser,
    uid: currentUser.uid,
    userId: currentUser.userId,
    nickname: currentUser.nickname || defaultUser.nickname,
    avatar: currentUser.avatar || defaultUser.avatar,
    ...(uni.getStorageSync(STORAGE_KEY) || {})
  }
}

export function getCurrentUser() {
  return Promise.resolve(readUser())
}

export function updateCurrentUser(payload) {
  const next = {
    ...readUser(),
    nickname: payload.nickname || defaultUser.nickname,
    avatar: payload.avatar || defaultUser.avatar,
    credit: Number(payload.credit) || defaultUser.credit,
    mbti: payload.mbti || '',
    bio: payload.bio || '',
    quote: payload.quote || ''
  }
  uni.setStorageSync(STORAGE_KEY, next)
  return Promise.resolve(next)
}
