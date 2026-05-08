import { isLoggedIn } from '@/common/api/auth.js'

export const ROUTE_ALLOWLIST = new Set([
  '/pages/home/index',
  '/pages/discover/index',
  '/pages/discover/search',
  '/pages/discover/city',
  '/pages/calendar/index',
  '/pages/activity/detail',
  '/pages/activity/members',
  '/pages/activity/register',
  '/pages/activity/create',
  '/pages/activity/edit',
  '/pages/manage/dashboard',
  '/pages/manage/checkin',
  '/pages/participant/dashboard',
  '/pages/order/detail',
  '/pages/share/poster',
  '/pages/my/activities',
  '/pages/messages/index',
  '/pages/auth/login',
  '/pages/user/profile',
  '/pages/user/detail',
  '/pages/user/edit',
  '/pages/ops/dashboard',
  '/pages/ops/reports',
  '/pages/ops/users',
  '/pages/payment/index',
  '/pages/status/success',
  '/uni_modules/unicloud-city-select/pages/uni-city-list/uni-city-list'
])

function buildQuery(params = {}) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
}

export function normalizeInternalUrl(url, fallback = '/pages/home/index') {
  const safeFallback = typeof fallback === 'string' ? fallback : '/pages/home/index'
  const raw = String(url || '').trim()
  if (!raw || raw.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(raw)) {
    return safeFallback
  }
  const withoutHash = raw.split('#')[0]
  const questionIndex = withoutHash.indexOf('?')
  const path = questionIndex >= 0 ? withoutHash.slice(0, questionIndex) : withoutHash
  const query = questionIndex >= 0 ? withoutHash.slice(questionIndex + 1) : ''
  if (!path.startsWith('/') || !ROUTE_ALLOWLIST.has(path)) {
    return safeFallback
  }
  return query ? `${path}?${query}` : path
}

function goToUrl(url, options = {}) {
  const safeUrl = normalizeInternalUrl(url)
  if (options.root) {
    uni.reLaunch({ url: safeUrl })
    return
  }

  if (options.replace) {
    uni.redirectTo({ url: safeUrl })
    return
  }

  uni.navigateTo({ url: safeUrl })
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
    height: `${metrics.navHeightRpx}rpx`,
    boxSizing: 'border-box',
    padding: '0'
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
    paddingRight: `${rightPadding}rpx`,
    boxSizing: 'border-box',
    width: '100%',
    minWidth: 0
  }
}

export function getMiniProgramNavActionsStyle(options = {}) {
  const metrics = getMiniProgramNavMetrics(options)
  const leftReserve = Number(options.leftReserveRpx ?? 0)
  const maxWidth = Math.max(80, metrics.leftLimitRpx - leftReserve)
  return {
    maxWidth: `${maxWidth}rpx`,
    boxSizing: 'border-box',
    overflow: 'hidden',
    flexShrink: 0
  }
}

export function getMiniProgramNavContentStyle(options = {}) {
  const metrics = getMiniProgramNavMetrics(options)
  const gap = Number(options.gapRpx ?? 28)
  return {
    paddingTop: `${metrics.navHeightRpx + gap}rpx`,
    boxSizing: 'border-box'
  }
}

export function getCapsuleSafeAreaStyle(options = {}) {
  return {
    ...getMiniProgramNavStyle(options),
    ...getMiniProgramNavRowStyle(options)
  }
}

export function goAuthLogin(params = {}) {
  const query = buildQuery({
    ...params,
    redirect: params.redirect ? normalizeInternalUrl(params.redirect, '') : ''
  })
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
  goToUrl(`/pages/discover/search${query ? `?${query}` : ''}`)
}

export function goCityPicker() {
  goToUrl('/pages/discover/city')
}

export function goCalendar(date = '') {
  const query = buildQuery({ date })
  goToUrl(`/pages/calendar/index${query ? `?${query}` : ''}`)
}

export function goMessages() {
  goToUrl('/pages/messages/index')
}

export function goUserProfile() {
  goToUrl('/pages/user/profile')
}

export function goUserEdit() {
  guardLoginAction('/pages/user/edit')
}

export function goOpsDashboard(options = {}) {
  guardLoginAction('/pages/ops/dashboard', options)
}

export function goOpsReports(status = '', options = {}) {
  const query = buildQuery({ status })
  guardLoginAction(`/pages/ops/reports${query ? `?${query}` : ''}`, options)
}

export function goOpsUsers(options = {}) {
  guardLoginAction('/pages/ops/users', options)
}

export function goActivityEdit(id) {
  goToUrl(`/pages/activity/edit?id=${encodeURIComponent(id)}`)
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

export function goUserDetail(userId, options = {}) {
  const id = String(userId || '').trim()
  if (!id) {
    uni.showToast({ title: 'No user profile', icon: 'none' })
    return
  }
  const activityId = options.activityId || options.activity_id || ''
  const query = buildQuery({
    id,
    activityId
  })
  goToUrl(`/pages/user/detail${query ? `?${query}` : ''}`, options)
}

export function goOrderDetail(id, options = {}) {
  const activityId = options.activityId || options.activity_id || ''
  const query = buildQuery({
    id,
    activityId
  })
  guardLoginAction(`/pages/order/detail${query ? `?${query}` : ''}`, options)
}

export function goSharePoster(id) {
  goToUrl(`/pages/share/poster?id=${encodeURIComponent(id)}`)
}

export function goMyActivities() {
  goToUrl('/pages/my/activities')
}

export function goPayment(params = {}, options = {}) {
  const query = buildQuery(params)
  guardLoginAction(`/pages/payment/index${query ? `?${query}` : ''}`, options)
}

export function goSuccess(params = {}) {
  const query = buildQuery(params)
  uni.redirectTo({
    url: normalizeInternalUrl(`/pages/status/success${query ? `?${query}` : ''}`)
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
  const safeFallbackUrl = normalizeInternalUrl(fallbackUrl)
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

export function showComingSoon(title = 'Coming soon') {
  uni.showToast({
    title,
    icon: 'none'
  })
}
