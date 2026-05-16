export const APP_MODE = 'trial'
export const USE_UNICLOUD = true
export const ALLOW_MOCK_FALLBACK = APP_MODE !== 'trial'
export const ALLOW_LOCAL_DEV_MOCK_FALLBACK = true
export const TRIAL_STRICT_CLOUD_AUTH = false
export const REFERENCE_MOCK_PREVIEW = false

export function isTrialMode() {
  return APP_MODE === 'trial'
}

export function isTrialStrictCloudAuthMode() {
  return USE_UNICLOUD && isTrialMode() && TRIAL_STRICT_CLOUD_AUTH
}

function readNodeEnv() {
  try {
    return typeof process !== 'undefined' && process.env ? process.env.NODE_ENV : ''
  } catch (error) {
    return ''
  }
}

function readWeixinEnvVersion() {
  try {
    if (typeof wx !== 'undefined' && typeof wx.getAccountInfoSync === 'function') {
      return wx.getAccountInfoSync()?.miniProgram?.envVersion || ''
    }
  } catch (error) {
    return ''
  }
  return ''
}

export function isLocalDevMode() {
  const nodeEnv = readNodeEnv()
  const envVersion = readWeixinEnvVersion()
  return nodeEnv === 'development' || envVersion === 'develop'
}

export function shouldUseReferenceMockPreview() {
  return REFERENCE_MOCK_PREVIEW
}

export function shouldUseCloudFallback() {
  return shouldUseReferenceMockPreview()
    || (!isTrialMode() && ALLOW_MOCK_FALLBACK)
    || (USE_UNICLOUD && isTrialMode() && !isTrialStrictCloudAuthMode() && ALLOW_LOCAL_DEV_MOCK_FALLBACK && isLocalDevMode())
}
