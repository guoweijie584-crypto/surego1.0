export const APP_MODE = 'trial'
export const USE_UNICLOUD = true
export const ALLOW_MOCK_FALLBACK = APP_MODE !== 'trial'
export const REFERENCE_MOCK_PREVIEW = false

export function isTrialMode() {
  return APP_MODE === 'trial'
}

export function shouldUseReferenceMockPreview() {
  return REFERENCE_MOCK_PREVIEW
}

export function shouldUseCloudFallback() {
  return shouldUseReferenceMockPreview() || (!isTrialMode() && ALLOW_MOCK_FALLBACK)
}
