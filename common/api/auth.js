import { USE_UNICLOUD } from '@/common/config/runtime.js'

export const MOCK_USER_ID = 'mock_user'

const UNI_ID_USER_KEY = 'uni-id-pages-userInfo'
const LOCAL_USER_KEY = 'surego_current_user'

function readStorage(key) {
  try {
    return uni.getStorageSync(key) || {}
  } catch (error) {
    return {}
  }
}

function readCloudUserInfo() {
  try {
    if (typeof uniCloud === 'undefined' || typeof uniCloud.getCurrentUserInfo !== 'function') {
      return {}
    }
    return uniCloud.getCurrentUserInfo() || {}
  } catch (error) {
    return {}
  }
}

function pickUserId(...items) {
  for (const item of items) {
    const id = item?.uid || item?._id || item?.user_id || item?.userId
    if (id) return String(id)
  }
  return MOCK_USER_ID
}

export function getCurrentUserId() {
  const cloudUser = readCloudUserInfo()
  const uniIdUser = readStorage(UNI_ID_USER_KEY)
  const localUser = readStorage(LOCAL_USER_KEY)
  return pickUserId(cloudUser, uniIdUser, localUser)
}

export function getCurrentUserProfile() {
  const cloudUser = readCloudUserInfo()
  const uniIdUser = readStorage(UNI_ID_USER_KEY)
  const localUser = readStorage(LOCAL_USER_KEY)
  const uid = pickUserId(cloudUser, uniIdUser, localUser)

  return {
    uid,
    userId: uid,
    nickname: uniIdUser.nickname || uniIdUser.nickName || localUser.nickname || '吴哈哈',
    avatar: uniIdUser.avatar || uniIdUser.avatar_file?.url || localUser.avatar || 'https://api.dicebear.com/7.x/avataaars/png?seed=Lucky',
    credit: Number(localUser.credit) || 100,
    mbti: localUser.mbti || 'ENFP',
    bio: localUser.bio || '爱摄影、爱生活的斜杠青年',
    quote: localUser.quote || '希望能在这里遇到更多志同道合的小伙伴，一起探索城市里的光影。'
  }
}

export function requireLogin(options = {}) {
  const profile = getCurrentUserProfile()
  if (USE_UNICLOUD && profile.uid === MOCK_USER_ID && !options.silent) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
  }
  return profile
}
