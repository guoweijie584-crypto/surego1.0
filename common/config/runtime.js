export const APP_MODE = 'development'
export const USE_UNICLOUD = false
export const ALLOW_MOCK_FALLBACK = APP_MODE !== 'trial'

export function isTrialMode() {
  return APP_MODE === 'trial'
}

export function shouldUseCloudFallback() {
  return !isTrialMode() && ALLOW_MOCK_FALLBACK
}
