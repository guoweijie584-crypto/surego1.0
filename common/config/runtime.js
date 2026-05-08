export const APP_MODE = 'trial'
export const USE_UNICLOUD = true
export const ALLOW_MOCK_FALLBACK = false

export function isTrialMode() {
  return APP_MODE === 'trial'
}

export function shouldUseCloudFallback() {
  return !isTrialMode() && ALLOW_MOCK_FALLBACK
}
