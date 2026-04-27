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

export function goDiscover() {
  uni.navigateTo({
    url: '/pages/discover/index'
  })
}

export function goSearch(keyword = '') {
  const query = buildQuery({ keyword })
  uni.navigateTo({
    url: `/pages/discover/search${query ? `?${query}` : ''}`
  })
}

export function goCityPicker() {
  uni.navigateTo({
    url: '/pages/discover/city'
  })
}

export function goCalendar(date = '') {
  const query = buildQuery({ date })
  uni.navigateTo({
    url: `/pages/calendar/index${query ? `?${query}` : ''}`
  })
}

export function goMessages() {
  uni.navigateTo({
    url: '/pages/messages/index'
  })
}

export function goUserProfile() {
  uni.navigateTo({
    url: '/pages/user/profile'
  })
}

export function goUserEdit() {
  uni.navigateTo({
    url: '/pages/user/edit'
  })
}

export function goActivityEdit(id) {
  uni.navigateTo({
    url: `/pages/activity/edit?id=${encodeURIComponent(id)}`
  })
}

export function goManageDashboard(id) {
  uni.navigateTo({
    url: `/pages/manage/dashboard?id=${encodeURIComponent(id)}`
  })
}

export function goManageCheckin(id) {
  uni.navigateTo({
    url: `/pages/manage/checkin?id=${encodeURIComponent(id)}`
  })
}

export function goParticipantDashboard(id) {
  uni.navigateTo({
    url: `/pages/participant/dashboard?id=${encodeURIComponent(id)}`
  })
}

export function goSharePoster(id) {
  uni.navigateTo({
    url: `/pages/share/poster?id=${encodeURIComponent(id)}`
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
