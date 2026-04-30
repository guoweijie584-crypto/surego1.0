import { isLoggedIn } from '@/common/api/auth.js'

function buildQuery(params = {}) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
}

function goToUrl(url, options = {}) {
  if (options.root) {
    uni.reLaunch({ url })
    return
  }

  if (options.replace) {
    uni.redirectTo({ url })
    return
  }

  uni.navigateTo({ url })
}

const DEFAULT_WINDOW_WIDTH = 375

function getWindowMetrics() {
  try {
    if (typeof uni.getWindowInfo === 'function') {
      return uni.getWindowInfo() || {}
    }
  } catch (error) {
    // Fall through to the older API for older base libraries.
  }

  try {
    return uni.getSystemInfoSync() || {}
  } catch (error) {
    return {}
  }
}

function getMenuButtonRect() {
  try {
    if (typeof uni.getMenuButtonBoundingClientRect === 'function') {
      return uni.getMenuButtonBoundingClientRect() || null
    }
  } catch (error) {
    return null
  }
  return null
}

function pxToRpx(px, windowWidth = DEFAULT_WINDOW_WIDTH) {
  const safeWidth = Number(windowWidth) || DEFAULT_WINDOW_WIDTH
  return Math.ceil((Number(px) || 0) * 750 / safeWidth)
}

export function getMiniProgramNavMetrics(options = {}) {
  const windowInfo = getWindowMetrics()
  const menuRect = getMenuButtonRect()
  const windowWidth = Number(windowInfo.windowWidth || windowInfo.screenWidth || DEFAULT_WINDOW_WIDTH)
  const statusBarHeight = Number(windowInfo.statusBarHeight || 0)
  const fallbackTop = statusBarHeight + 8
  const fallbackHeight = 32
  const fallbackWidth = 96
  const fallbackLeft = windowWidth - fallbackWidth - 8

  const capsuleTopPx = Number(menuRect?.top || fallbackTop)
  const capsuleHeightPx = Number(menuRect?.height || fallbackHeight)
  const capsuleBottomPx = Number(menuRect?.bottom || capsuleTopPx + capsuleHeightPx)
  const capsuleLeftPx = Number(menuRect?.left || fallbackLeft)
  const bottomGapPx = Number(options.bottomGapPx ?? 10)
  const rightGapPx = Number(options.rightGapPx ?? 10)
  const rightReservePx = Math.max(0, windowWidth - capsuleLeftPx) + rightGapPx
  const navHeightPx = capsuleBottomPx + bottomGapPx

  return {
    windowWidth,
    statusBarHeight,
    capsuleTopPx,
    capsuleHeightPx,
    capsuleBottomPx,
    capsuleLeftPx,
    navHeightPx,
    rightReservePx,
    navHeightRpx: pxToRpx(navHeightPx, windowWidth),
    capsuleTopRpx: pxToRpx(capsuleTopPx, windowWidth),
    capsuleHeightRpx: pxToRpx(capsuleHeightPx, windowWidth),
    capsuleLeftRpx: pxToRpx(capsuleLeftPx, windowWidth),
    rightReserveRpx: pxToRpx(rightReservePx, windowWidth),
    leftLimitRpx: pxToRpx(capsuleLeftPx, windowWidth)
  }
}

export function getCapsuleSafeRightRpx(extraRight = 16) {
  const metrics = getMiniProgramNavMetrics({ rightGapPx: extraRight })
  return metrics.rightReserveRpx
}

export function getMiniProgramNavStyle(options = {}) {
  const metrics = getMiniProgramNavMetrics(options)
  return {
    height: `${metrics.navHeightRpx}rpx`
  }
}

export function getMiniProgramNavRowStyle(options = {}) {
  const metrics = getMiniProgramNavMetrics(options)
  const leftPadding = Number(options.leftPaddingRpx ?? 34)
  const rightPadding = Math.max(Number(options.minRightPaddingRpx ?? 24), metrics.rightReserveRpx)
  return {
    height: `${metrics.capsuleHeightRpx}rpx`,
    marginTop: `${metrics.capsuleTopRpx}rpx`,
    paddingLeft: `${leftPadding}rpx`,
    paddingRight: `${rightPadding}rpx`
  }
}

export function getMiniProgramNavActionsStyle(options = {}) {
  const metrics = getMiniProgramNavMetrics(options)
  const leftReserve = Number(options.leftReserveRpx ?? 0)
  const maxWidth = Math.max(80, metrics.leftLimitRpx - leftReserve)
  return {
    maxWidth: `${maxWidth}rpx`
  }
}

export function getMiniProgramNavContentStyle(options = {}) {
  const metrics = getMiniProgramNavMetrics(options)
  const gap = Number(options.gapRpx ?? 28)
  return {
    paddingTop: `${metrics.navHeightRpx + gap}rpx`
  }
}

export function getCapsuleSafeAreaStyle(options = {}) {
  return {
    ...getMiniProgramNavStyle(options),
    ...getMiniProgramNavRowStyle(options)
  }
}

export function goAuthLogin(params = {}) {
  const query = buildQuery(params)
  uni.navigateTo({
    url: `/pages/auth/login${query ? `?${query}` : ''}`
  })
}

export function guardLoginAction(nextUrl, options = {}) {
  if (isLoggedIn()) {
    goToUrl(nextUrl, options)
    return true
  }

  goAuthLogin({ redirect: nextUrl })
  return false
}

export function goActivityDetail(id, options = {}) {
  goToUrl(`/pages/activity/detail?id=${encodeURIComponent(id)}`, options)
}

export function goActivityMembers(id, options = {}) {
  goToUrl(`/pages/activity/members?id=${encodeURIComponent(id)}`, options)
}

export function goActivityRegister(id) {
  guardLoginAction(`/pages/activity/register?id=${encodeURIComponent(id)}`)
}

export function goActivityCreate() {
  guardLoginAction('/pages/activity/create')
}

export function goDiscover() {
  goDiscoverRoot()
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

export function goOpsUsers() {
  guardLoginAction('/pages/ops/users')
}

export function goActivityEdit(id) {
  uni.navigateTo({
    url: `/pages/activity/edit?id=${encodeURIComponent(id)}`
  })
}

export function goManageDashboard(id, options = {}) {
  guardLoginAction(`/pages/manage/dashboard?id=${encodeURIComponent(id)}`, options)
}

export function goManageCheckin(id, options = {}) {
  guardLoginAction(`/pages/manage/checkin?id=${encodeURIComponent(id)}`, options)
}

export function goParticipantDashboard(id, options = {}) {
  goToUrl(`/pages/participant/dashboard?id=${encodeURIComponent(id)}`, options)
}

export function goOrderDetail(id, options = {}) {
  guardLoginAction(`/pages/order/detail?id=${encodeURIComponent(id)}`, options)
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

export function goPayment(params = {}, options = {}) {
  const query = buildQuery(params)
  guardLoginAction(`/pages/payment/index${query ? `?${query}` : ''}`, options)
}

export function goSuccess(params = {}) {
  const query = buildQuery(params)
  uni.redirectTo({
    url: `/pages/status/success${query ? `?${query}` : ''}`
  })
}

export function goHomeRoot() {
  uni.reLaunch({
    url: '/pages/home/index'
  })
}

export function goDiscoverRoot() {
  uni.reLaunch({
    url: '/pages/discover/index'
  })
}

export function goBackOrFallback(fallbackUrl = '/pages/home/index') {
  const safeFallbackUrl = typeof fallbackUrl === 'string' ? fallbackUrl : '/pages/home/index'
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
    return
  }

  if (safeFallbackUrl === '/pages/home/index') {
    goHomeRoot()
    return
  }

  if (safeFallbackUrl === '/pages/discover/index') {
    goDiscoverRoot()
    return
  }

  uni.redirectTo({ url: safeFallbackUrl })
}

export function goBackHome() {
  goBackOrFallback('/pages/home/index')
}

export function showComingSoon(title = '功能开发中') {
  uni.showToast({
    title,
    icon: 'none'
  })
}
