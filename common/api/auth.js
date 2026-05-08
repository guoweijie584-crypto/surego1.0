import { USE_UNICLOUD, isTrialMode, shouldUseCloudFallback } from '../config/runtime.js'

export const MOCK_USER_ID = 'mock_user'

const UNI_ID_USER_KEY = 'uni-id-pages-userInfo'
const UNI_ID_TOKEN_KEY = 'uni_id_token'
const UNI_ID_TOKEN_EXPIRED_KEY = 'uni_id_token_expired'
const LOCAL_USER_KEY = 'surego_current_user'
const MOCK_LOGIN_KEY = 'surego_mock_login'
const OPS_ROLES = ['admin', 'operator']
const LEGACY_MOCK_NICKNAME = String.fromCharCode(21556, 21704, 21704)
export const DEFAULT_USER_NICKNAME = '微信用户'
export const DEFAULT_USER_AVATAR = '/static/userImg/user.png'
const ANONYMOUS_USER = {
  uid: '',
  _id: '',
  userId: '',
  nickname: '未登录',
  avatar: DEFAULT_USER_AVATAR,
  credit: 0,
  mbti: '',
  bio: '登录后同步你的活动、订单和签到状态',
  quote: '授权微信登录后即可发起活动、报名入局和查看入场凭证。',
  role: [],
  isAnonymous: true
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

export function isSuregoProfileComplete(profile = {}) {
  const nickname = sanitizeNickname(profile.nickname, '')
  const hasIdentity = Boolean(profile.uid || profile.userId || profile._id)
  return Boolean(
    hasIdentity &&
    nickname &&
    nickname !== DEFAULT_USER_NICKNAME &&
    (profile.profileCompletedAt || profile.profile_completed_at || profile.nickname)
  )
}

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
  return pickOptionalUserId(...items) || MOCK_USER_ID
}

function pickOptionalUserId(...items) {
  for (const item of items) {
    const id = item?.uid || item?._id || item?.user_id || item?.userId
    if (id) return String(id)
  }
  return ''
}

function readUniIdToken() {
  try {
    const token = uni.getStorageSync(UNI_ID_TOKEN_KEY)
    return typeof token === 'string' ? token : ''
  } catch (error) {
    return ''
  }
}

function isStrictCloudAuthMode() {
  return USE_UNICLOUD && isTrialMode()
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
    nickname: sanitizeNickname(user.nickname || user.nickName || user.username || fallback.nickname),
    avatar: sanitizeAvatar(user.avatar || user.avatar_file?.url || fallback.avatar),
    avatarFileId: user.avatarFileId || user.avatar_file_id || user.avatar_file?.fileID || fallback.avatarFileId || '',
    profileCompletedAt: user.profileCompletedAt || user.profile_completed_at || fallback.profileCompletedAt || 0,
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
  if (isStrictCloudAuthMode()) {
    return pickOptionalUserId(cloudUser, uniIdUser)
  }
  return pickUserId(cloudUser, uniIdUser, localUser)
}

export function isLoggedIn() {
  const cloudUser = readCloudUserInfo()
  const uniIdUser = readStorage(UNI_ID_USER_KEY)
  const mockLogin = readStorage(MOCK_LOGIN_KEY)
  if (isStrictCloudAuthMode()) {
    return Boolean(readUniIdToken() && pickOptionalUserId(cloudUser, uniIdUser))
  }
  return Boolean(cloudUser.uid || cloudUser._id || uniIdUser.uid || uniIdUser._id || mockLogin.uid)
}

function getUserRoles(...items) {
  return items.flatMap((item) => {
    const role = item?.role || item?.roles || item?.permission || item?.permissions || []
    return Array.isArray(role) ? role : [role]
  }).filter(Boolean).map((role) => String(role).trim().toLowerCase())
}

export function hasOpsRole(profile = {}) {
  return getUserRoles(profile).some((role) => OPS_ROLES.includes(role))
}

export function isOpsUser() {
  const cloudUser = readCloudUserInfo()
  const uniIdUser = readStorage(UNI_ID_USER_KEY)
  const localUser = readStorage(LOCAL_USER_KEY)
  const mockLogin = readStorage(MOCK_LOGIN_KEY)
  if (isStrictCloudAuthMode() && !isLoggedIn()) {
    return false
  }
  const uid = pickUserId(cloudUser, uniIdUser, mockLogin, localUser)
  if (uid === MOCK_USER_ID) return shouldUseCloudFallback()
  return getUserRoles(cloudUser, uniIdUser, mockLogin, localUser).some((role) => OPS_ROLES.includes(role))
}

export function getCurrentUserProfile() {
  const cloudUser = readCloudUserInfo()
  const uniIdUser = readStorage(UNI_ID_USER_KEY)
  const localUser = readStorage(LOCAL_USER_KEY)
  const mockLogin = readStorage(MOCK_LOGIN_KEY)
  if (isStrictCloudAuthMode() && !isLoggedIn()) {
    return { ...ANONYMOUS_USER }
  }
  const uid = isStrictCloudAuthMode()
    ? pickUserId(cloudUser, uniIdUser, localUser)
    : pickUserId(cloudUser, uniIdUser, mockLogin, localUser)
  const nicknameSource = isStrictCloudAuthMode()
    ? (uniIdUser.nickname || uniIdUser.nickName || localUser.nickname)
    : (uniIdUser.nickname || uniIdUser.nickName || mockLogin.nickname || localUser.nickname)
  const avatarSource = isStrictCloudAuthMode()
    ? (uniIdUser.avatar || localUser.avatar)
    : (uniIdUser.avatar || mockLogin.avatar || localUser.avatar)
  const roles = isStrictCloudAuthMode()
    ? getUserRoles(cloudUser, uniIdUser)
    : getUserRoles(cloudUser, uniIdUser, mockLogin, localUser)

  return {
    uid,
    userId: uid,
    nickname: sanitizeNickname(nicknameSource),
    avatar: sanitizeAvatar(uniIdUser.avatar_file?.url || avatarSource),
    avatarFileId: uniIdUser.avatarFileId || uniIdUser.avatar_file_id || localUser.avatarFileId || '',
    profileCompletedAt: uniIdUser.profileCompletedAt || localUser.profileCompletedAt || 0,
    credit: Number(localUser.credit) || 100,
    mbti: localUser.mbti || 'ENFP',
    bio: localUser.bio || '爱摄影、爱生活的斜杠青年',
    quote: localUser.quote || '希望能在这里遇到更多志同道合的小伙伴，一起探索城市里的光影。',
    role: roles,
    roles
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
  if (!shouldUseCloudFallback()) {
    return {
      ...ANONYMOUS_USER,
      ...profile,
      uid: profile.uid || profile.userId || '',
      userId: profile.userId || profile.uid || ''
    }
  }
  const next = {
    uid: profile.uid || profile.userId || MOCK_USER_ID,
    userId: profile.userId || profile.uid || MOCK_USER_ID,
    nickname: sanitizeNickname(profile.nickname),
    avatar: sanitizeAvatar(profile.avatar)
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
  uni.setStorageSync(UNI_ID_USER_KEY, {
    uid: userInfo.uid,
    _id: userInfo._id,
    userId: userInfo.userId,
    nickname: userInfo.nickname,
    avatar: userInfo.avatar,
    avatarFileId: userInfo.avatarFileId,
    profileCompletedAt: userInfo.profileCompletedAt
  })
  const currentLocal = readStorage(LOCAL_USER_KEY)
  uni.setStorageSync(LOCAL_USER_KEY, {
    uid: userInfo.uid,
    userId: userInfo.userId,
    nickname: sanitizeNickname(userInfo.nickname || currentLocal.nickname),
    avatar: sanitizeAvatar(userInfo.avatar || currentLocal.avatar),
    avatarFileId: userInfo.avatarFileId || currentLocal.avatarFileId || '',
    profileCompletedAt: userInfo.profileCompletedAt || currentLocal.profileCompletedAt || 0
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
  if (!shouldUseCloudFallback()) {
    return Promise.reject(new Error('AUTH_REQUIRED'))
  }
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
    uid: profile.uid || profile.userId || current.uid,
    userId: profile.userId || profile.uid || current.userId,
    nickname: sanitizeNickname(profile.nickname || current.nickname),
    avatar: sanitizeAvatar(profile.avatar || current.avatar),
    avatarFileId: profile.avatarFileId || profile.avatar_file_id || current.avatarFileId || '',
    profileCompletedAt: profile.profileCompletedAt || profile.profile_completed_at || current.profileCompletedAt || 0,
    credit: Number(profile.credit) || Number(current.credit) || 100,
    mbti: profile.mbti || current.mbti || '',
    bio: profile.bio || current.bio || '',
    quote: profile.quote || current.quote || ''
  }
  uni.setStorageSync(LOCAL_USER_KEY, next)
  if (isLoggedIn()) {
    const savedUniIdUser = readStorage(UNI_ID_USER_KEY)
    uni.setStorageSync(UNI_ID_USER_KEY, {
      uid: next.uid,
      _id: next.uid,
      userId: next.userId,
      nickname: next.nickname,
      avatar: next.avatar,
      avatarFileId: next.avatarFileId,
      profileCompletedAt: next.profileCompletedAt,
      role: savedUniIdUser.role,
      roles: savedUniIdUser.roles
    })
  }
  if (shouldUseCloudFallback() && isLoggedIn()) {
    setMockLogin(next)
  }
  return next
}

export function clearAuthSession() {
  uni.removeStorageSync(MOCK_LOGIN_KEY)
  uni.removeStorageSync(UNI_ID_USER_KEY)
  uni.removeStorageSync(UNI_ID_TOKEN_KEY)
  uni.removeStorageSync(LOCAL_USER_KEY)
  uni.setStorageSync(UNI_ID_TOKEN_EXPIRED_KEY, 0)
}

export function logout() {
  clearAuthSession()
}
