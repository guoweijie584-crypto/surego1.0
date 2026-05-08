import { shouldUseCloudFallback } from '../config/runtime.js'
import { logout } from '@/common/api/auth.js'

const UNI_ID_TOKEN_KEY = 'uni_id_token'
const AUTH_ERROR_CODES = ['AUTH_REQUIRED', 'TOKEN_EXPIRED', 'TOKEN_INVALID', 'SUREGO_AUTH_EXPIRED']
const AUTH_MESSAGE = 'Please sign in again'
const CLOUD_ERROR_MESSAGE = 'Cloud service is temporarily unavailable'
const CLOUD_NETWORK_MESSAGE = 'Cloud request failed. Re-upload cloud functions and check cloud space binding.'
const ACTION_ERROR_MESSAGE = 'Operation failed'

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

function isRequestFail(error = {}) {
  const raw = String(error.errMsg || error.message || error.code || '')
  return raw.includes('request:fail') || raw.includes('connect') || raw.includes('timeout')
}

function buildError(code, message) {
  const error = new Error(message)
  error.code = code
  error.isSuregoCloudError = true
  return error
}

export async function callSuregoFunction(name, action, payload = {}) {
  try {
    const response = await uniCloud.callFunction({
      name,
      data: {
        action,
        payload,
        uniIdToken: readUniIdToken()
      }
    })
    const result = response?.result || {}
    if (result.code && result.code !== 0) {
      const code = String(result.code || '')
      const cloudError = buildError(code, isAuthErrorCode(code) ? AUTH_MESSAGE : ACTION_ERROR_MESSAGE)
      if (isAuthErrorCode(code)) logout()
      throw cloudError
    }
    return result.data !== undefined ? result.data : result
  } catch (error) {
    if (error?.isSuregoCloudError) throw error
    const code = error?.code || ''
    if (isAuthErrorCode(code)) logout()
    if (isAuthErrorCode(code)) throw buildError(code, AUTH_MESSAGE)
    if (isRequestFail(error)) throw buildError('SUREGO_NETWORK_ERROR', CLOUD_NETWORK_MESSAGE)
    throw buildError('SUREGO_CLOUD_ERROR', CLOUD_ERROR_MESSAGE)
  }
}

export function canFallbackToMock() {
  return shouldUseCloudFallback()
}

export function handleSuregoCloudError(error, fallback) {
  if (canFallbackToMock() && typeof fallback === 'function') {
    return fallback(error)
  }
  const message = isAuthErrorCode(error?.code) ? AUTH_MESSAGE : CLOUD_ERROR_MESSAGE
  const finalMessage = error?.code === 'SUREGO_NETWORK_ERROR' ? CLOUD_NETWORK_MESSAGE : message
  throw buildError(error?.code || 'SUREGO_CLOUD_ERROR', finalMessage)
}
