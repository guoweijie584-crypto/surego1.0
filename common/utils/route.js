function buildQuery(params = {}) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
}

export function goActivityDetail(id) {
  uni.navigateTo({
    url: `/pages/activity/detail?id=${encodeURIComponent(id)}`
  })
}

export function goActivityRegister(id) {
  uni.navigateTo({
    url: `/pages/activity/register?id=${encodeURIComponent(id)}`
  })
}

export function goActivityCreate() {
  uni.navigateTo({
    url: '/pages/activity/create'
  })
}

export function goManageDashboard(id) {
  uni.navigateTo({
    url: `/pages/manage/dashboard?id=${encodeURIComponent(id)}`
  })
}

export function goMyActivities() {
  uni.navigateTo({
    url: '/pages/my/activities'
  })
}

export function goPayment(params = {}) {
  const query = buildQuery(params)
  uni.navigateTo({
    url: `/pages/payment/index${query ? `?${query}` : ''}`
  })
}

export function goSuccess(params = {}) {
  const query = buildQuery(params)
  uni.redirectTo({
    url: `/pages/status/success${query ? `?${query}` : ''}`
  })
}

export function goBackHome() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
    return
  }

  uni.reLaunch({
    url: '/pages/home/index'
  })
}

export function showComingSoon(title = '功能开发中') {
  uni.showToast({
    title,
    icon: 'none'
  })
}
