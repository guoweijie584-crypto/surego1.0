import { isLoggedIn } from '@/common/api/auth.js'

function buildQuery(params = {}) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
}

export function goAuthLogin(params = {}) {
  const query = buildQuery(params)
  uni.navigateTo({
    url: `/pages/auth/login${query ? `?${query}` : ''}`
  })
}

export function guardLoginAction(nextUrl) {
  if (isLoggedIn()) {
    uni.navigateTo({ url: nextUrl })
    return true
  }

  goAuthLogin({ redirect: nextUrl })
  return false
}

export function goActivityDetail(id) {
  uni.navigateTo({
    url: `/pages/activity/detail?id=${encodeURIComponent(id)}`
  })
}

export function goActivityMembers(id) {
  uni.navigateTo({
    url: `/pages/activity/members?id=${encodeURIComponent(id)}`
  })
}

export function goActivityRegister(id) {
  guardLoginAction(`/pages/activity/register?id=${encodeURIComponent(id)}`)
}

export function goActivityCreate() {
  guardLoginAction('/pages/activity/create')
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
  guardLoginAction('/pages/user/edit')
}

export function goOpsDashboard() {
  guardLoginAction('/pages/ops/dashboard')
}

export function goOpsReports(status = '') {
  const query = buildQuery({ status })
  guardLoginAction(`/pages/ops/reports${query ? `?${query}` : ''}`)
}

export function goActivityEdit(id) {
  uni.navigateTo({
    url: `/pages/activity/edit?id=${encodeURIComponent(id)}`
  })
}

export function goManageDashboard(id) {
  guardLoginAction(`/pages/manage/dashboard?id=${encodeURIComponent(id)}`)
}

export function goManageCheckin(id) {
  guardLoginAction(`/pages/manage/checkin?id=${encodeURIComponent(id)}`)
}

export function goParticipantDashboard(id) {
  uni.navigateTo({
    url: `/pages/participant/dashboard?id=${encodeURIComponent(id)}`
  })
}

export function goOrderDetail(id) {
  guardLoginAction(`/pages/order/detail?id=${encodeURIComponent(id)}`)
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
  guardLoginAction(`/pages/payment/index${query ? `?${query}` : ''}`)
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
