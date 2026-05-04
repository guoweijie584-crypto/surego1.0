const REFRESH_TEXT_KEY = 'surego_refresh_text'

export function makeRefreshHandler(loader, options = {}) {
  return async function handleRefresh() {
    try {
      await loader?.()
      if (options.successText) {
        uni.showToast({ title: options.successText, icon: 'none' })
      }
    } catch (error) {
      const message = error?.message || options.failText || '刷新失败，请稍后重试'
      uni.showToast({ title: message, icon: 'none' })
      throw error
    } finally {
      uni.stopPullDownRefresh?.()
    }
  }
}

export function withPullDownRefresh(pageStyle = {}) {
  return {
    ...pageStyle,
    enablePullDownRefresh: true
  }
}

export function setRefreshHint(text = '') {
  try {
    uni.setStorageSync(REFRESH_TEXT_KEY, String(text || ''))
  } catch (error) {
    // Ignore storage failures.
  }
}

export function getRefreshHint() {
  try {
    return uni.getStorageSync(REFRESH_TEXT_KEY) || ''
  } catch (error) {
    return ''
  }
}
