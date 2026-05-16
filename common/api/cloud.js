import { shouldUseCloudFallback } from '../config/runtime.js'
import { getCurrentUserId, getCurrentUserProfile, logout } from '@/common/api/auth.js'

const UNI_ID_TOKEN_KEY = 'uni_id_token'
const AUTH_ERROR_CODES = ['AUTH_REQUIRED', 'TOKEN_EXPIRED', 'TOKEN_INVALID', 'SUREGO_AUTH_EXPIRED']

function isAuthErrorCode(code) {
  return AUTH_ERROR_CODES.includes(String(code || ''))
}

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
      const cloudError = {
        code: result.code,
        message: result.message || result.errMsg || result.code
      }
      if (isAuthErrorCode(cloudError.code)) {
        logout()
      }
      throw cloudError
    }
    return result.data !== undefined ? result.data : result
  } catch (error) {
    const code = error?.code || ''
    const message = error?.message || '云端服务暂不可用'
    if (isAuthErrorCode(code) || message.includes('AUTH_REQUIRED')) {
      logout()
    }
    if (!canFallbackToMock()) {
      uni.showToast({
        title: message,
        icon: 'none'
      })
    }
    throw {
      code: isAuthErrorCode(code) ? code : 'SUREGO_CLOUD_ERROR',
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
