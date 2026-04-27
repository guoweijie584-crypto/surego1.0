import { USE_UNICLOUD } from '@/common/config/runtime.js'

export const MOCK_USER_ID = 'mock_user'

const UNI_ID_USER_KEY = 'uni-id-pages-userInfo'
const UNI_ID_TOKEN_KEY = 'uni_id_token'
const UNI_ID_TOKEN_EXPIRED_KEY = 'uni_id_token_expired'
const LOCAL_USER_KEY = 'surego_current_user'
const MOCK_LOGIN_KEY = 'surego_mock_login'
const OPS_ROLES = ['admin', 'operator']

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

function pickToken(payload = {}) {
  return payload?.newToken?.token || payload?.token || payload?.uniIdToken || ''
}

function pickTokenExpired(payload = {}) {
  return payload?.newToken?.tokenExpired || payload?.tokenExpired || payload?.uniIdTokenExpired || 0
}

function normalizeUniIdUser(payload = {}, fallback = {}) {
  const user = payload.userInfo || payload.user || payload
  const uid = pickUserId(
    { uid: payload.uid, _id: payload.uid },
    user,
    fallback
  )
  return {
    uid,
    _id: uid,
    userId: uid,
    nickname: user.nickname || user.nickName || user.username || fallback.nickname || '吴哈哈',
    avatar: user.avatar || user.avatar_file?.url || fallback.avatar || 'https://api.dicebear.com/7.x/avataaars/png?seed=Lucky',
    role: user.role || user.roles || fallback.role || []
  }
}

function requestWeixinLoginCode() {
  return new Promise((resolve, reject) => {
    if (typeof uni.login !== 'function') {
      reject(new Error('uni.login is unavailable'))
      return
    }
    uni.login({
      provider: 'weixin',
      success(res = {}) {
        if (res.code) {
          resolve(res.code)
          return
        }
        reject(new Error(res.errMsg || 'Weixin login code is empty'))
      },
      fail(error) {
        reject(error)
      }
    })
  })
}

export function getCurrentUserId() {
  const cloudUser = readCloudUserInfo()
  const uniIdUser = readStorage(UNI_ID_USER_KEY)
  const localUser = readStorage(LOCAL_USER_KEY)
  return pickUserId(cloudUser, uniIdUser, localUser)
}

export function isLoggedIn() {
  const cloudUser = readCloudUserInfo()
  const uniIdUser = readStorage(UNI_ID_USER_KEY)
  const mockLogin = readStorage(MOCK_LOGIN_KEY)
  return Boolean(cloudUser.uid || cloudUser._id || uniIdUser.uid || uniIdUser._id || mockLogin.uid)
}

function getUserRoles(...items) {
  return items.flatMap((item) => {
    const role = item?.role || item?.roles || item?.permission || item?.permissions || []
    return Array.isArray(role) ? role : [role]
  }).filter(Boolean).map(String)
}

export function isOpsUser() {
  const cloudUser = readCloudUserInfo()
  const uniIdUser = readStorage(UNI_ID_USER_KEY)
  const localUser = readStorage(LOCAL_USER_KEY)
  const mockLogin = readStorage(MOCK_LOGIN_KEY)
  const uid = pickUserId(cloudUser, uniIdUser, mockLogin, localUser)
  if (uid === MOCK_USER_ID) return true
  return getUserRoles(cloudUser, uniIdUser, mockLogin, localUser).some((role) => OPS_ROLES.includes(role))
}

export function getCurrentUserProfile() {
  const cloudUser = readCloudUserInfo()
  const uniIdUser = readStorage(UNI_ID_USER_KEY)
  const localUser = readStorage(LOCAL_USER_KEY)
  const mockLogin = readStorage(MOCK_LOGIN_KEY)
  const uid = pickUserId(cloudUser, uniIdUser, mockLogin, localUser)

  return {
    uid,
    userId: uid,
    nickname: uniIdUser.nickname || uniIdUser.nickName || mockLogin.nickname || localUser.nickname || '吴哈哈',
    avatar: uniIdUser.avatar || uniIdUser.avatar_file?.url || mockLogin.avatar || localUser.avatar || 'https://api.dicebear.com/7.x/avataaars/png?seed=Lucky',
    credit: Number(localUser.credit) || 100,
    mbti: localUser.mbti || 'ENFP',
    bio: localUser.bio || '爱摄影、爱生活的斜杠青年',
    quote: localUser.quote || '希望能在这里遇到更多志同道合的小伙伴，一起探索城市里的光影。'
  }
}

export function requireLogin(options = {}) {
  const profile = getCurrentUserProfile()
  if (!isLoggedIn() && !options.silent) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
  }
  return profile
}

export function setMockLogin(profile = {}) {
  const next = {
    uid: profile.uid || profile.userId || MOCK_USER_ID,
    userId: profile.userId || profile.uid || MOCK_USER_ID,
    nickname: profile.nickname || '吴哈哈',
    avatar: profile.avatar || 'https://api.dicebear.com/7.x/avataaars/png?seed=Lucky'
  }
  uni.setStorageSync(MOCK_LOGIN_KEY, next)
  uni.setStorageSync(LOCAL_USER_KEY, {
    ...readStorage(LOCAL_USER_KEY),
    ...next
  })
  return next
}

export function persistUniIdSession(payload = {}, fallbackProfile = {}) {
  const token = pickToken(payload)
  const tokenExpired = pickTokenExpired(payload)
  const userInfo = normalizeUniIdUser(payload, fallbackProfile)

  if (token) {
    uni.setStorageSync(UNI_ID_TOKEN_KEY, token)
  }
  if (tokenExpired) {
    uni.setStorageSync(UNI_ID_TOKEN_EXPIRED_KEY, tokenExpired)
  }
  uni.setStorageSync(UNI_ID_USER_KEY, userInfo)
  uni.setStorageSync(LOCAL_USER_KEY, {
    ...readStorage(LOCAL_USER_KEY),
    ...userInfo
  })
  return userInfo
}

async function loginWithUniIdCo(code, profile = {}) {
  if (typeof uniCloud === 'undefined' || typeof uniCloud.importObject !== 'function') {
    throw new Error('uni-id-co unavailable')
  }
  const uniIdCo = uniCloud.importObject('uni-id-co', { customUI: true })
  const result = await uniIdCo.loginByWeixin({ code })
  const user = persistUniIdSession(result, profile)
  return {
    mode: 'uni-id-co',
    uid: user.uid,
    user,
    raw: result
  }
}

async function loginWithUserCenter(code, profile = {}) {
  if (typeof uniCloud === 'undefined' || typeof uniCloud.callFunction !== 'function') {
    throw new Error('user-center unavailable')
  }
  const response = await uniCloud.callFunction({
    name: 'user-center',
    data: {
      action: 'loginByWeixin',
      params: { code }
    }
  })
  const result = response?.result || {}
  if (result.code && result.code !== 0) {
    throw new Error(result.message || result.errMsg || result.code)
  }
  const user = persistUniIdSession(result, profile)
  return {
    mode: 'user-center',
    uid: user.uid,
    user,
    raw: result
  }
}

export function loginWithMockFallback(profile = {}) {
  const user = setMockLogin(profile)
  return Promise.resolve({
    mode: 'mock',
    uid: user.uid,
    user,
    raw: user
  })
}

export async function loginWithWeixin(profile = {}) {
  let code = ''
  try {
    code = await requestWeixinLoginCode()
  } catch (error) {
    return loginWithMockFallback(profile)
  }

  try {
    return await loginWithUniIdCo(code, profile)
  } catch (error) {
    try {
      return await loginWithUserCenter(code, profile)
    } catch (fallbackError) {
      return loginWithMockFallback(profile)
    }
  }
}

export function saveCurrentUserProfile(profile = {}) {
  const current = getCurrentUserProfile()
  const next = {
    ...current,
    ...profile,
    uid: profile.uid || profile.userId || current.uid,
    userId: profile.userId || profile.uid || current.userId
  }
  uni.setStorageSync(LOCAL_USER_KEY, next)
  if (isLoggedIn()) {
    setMockLogin(next)
  }
  return next
}

export function logout() {
  uni.removeStorageSync(MOCK_LOGIN_KEY)
  uni.removeStorageSync(UNI_ID_USER_KEY)
  uni.removeStorageSync(UNI_ID_TOKEN_KEY)
  uni.setStorageSync(UNI_ID_TOKEN_EXPIRED_KEY, 0)
}
