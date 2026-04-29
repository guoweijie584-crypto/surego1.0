import { shouldUseCloudFallback } from '../config/runtime.js'
import { getCurrentUserId, getCurrentUserProfile } from '@/common/api/auth.js'

const UNI_ID_TOKEN_KEY = 'uni_id_token'

function readUniIdToken() {
  try {
    return uni.getStorageSync(UNI_ID_TOKEN_KEY) || ''
  } catch (error) {
    return ''
  }
}

export async function callSuregoFunction(name, action, payload = {}) {
  try {
    const uniIdToken = readUniIdToken()
    const userId = getCurrentUserId()
    const profile = getCurrentUserProfile()
    const response = await uniCloud.callFunction({
      name,
      data: {
        action,
        payload: {
          ...payload,
          userId: payload.userId || payload.user_id || userId
        },
        userId,
        roles: profile.role || profile.roles || [],
        uniIdToken
      }
    })
    const result = response?.result || {}
    if (result.code && result.code !== 0) {
      throw new Error(result.message || result.errMsg || result.code)
    }
    return result.data !== undefined ? result.data : result
  } catch (error) {
    const message = error?.message || '云端服务暂不可用'
    uni.showToast({
      title: message,
      icon: 'none'
    })
    throw {
      code: 'SUREGO_CLOUD_ERROR',
      message
    }
  }
}

export function canFallbackToMock() {
  return shouldUseCloudFallback()
}

export function handleSuregoCloudError(error, fallback) {
  if (canFallbackToMock() && typeof fallback === 'function') {
    return fallback(error)
  }
  const message = error?.message || '云端服务不可用，请稍后再试'
  uni.showToast({
    title: message,
    icon: 'none'
  })
  throw error
}
