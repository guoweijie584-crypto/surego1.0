import { USE_UNICLOUD } from '@/common/config/runtime.js'
import { callSuregoFunction } from '@/common/api/cloud.js'
import { getCurrentUserId } from '@/common/api/auth.js'

const STORAGE_KEY = 'surego_checkins'

function readCheckins() {
  return uni.getStorageSync(STORAGE_KEY) || []
}

function writeCheckins(items) {
  uni.setStorageSync(STORAGE_KEY, items)
}

function buildCode(activityId) {
  return {
    activityId: String(activityId),
    code: `SG${String(Date.now()).slice(-6)}`,
    expiresIn: 300
  }
}

export function isValidCheckinCode(code = '') {
  return /^SG\d{4,}$/.test(String(code).trim())
}

function createLocalCheckinCode(activityId) {
  return Promise.resolve(buildCode(activityId))
}

export async function createCheckinCode(activityId) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-checkin', 'createCode', { activityId })
    } catch (error) {
      return createLocalCheckinCode(activityId)
    }
  }
  return createLocalCheckinCode(activityId)
}

function buildCheckin(payload) {
  const userId = payload.userId || getCurrentUserId()
  return {
    id: payload.id || `checkin_${Date.now()}`,
    activityId: String(payload.activityId),
    userId,
    code: payload.code || '',
    status: 'checked',
    source: payload.source || 'participant',
    remark: payload.remark || '',
    checkedBy: payload.checkedBy || payload.checked_by || getCurrentUserId(),
    checkedAt: payload.checkedAt || new Date().toISOString(),
    createdAt: payload.createdAt || payload.checkedAt || new Date().toISOString()
  }
}

function confirmLocalCheckin(payload) {
  if (!isValidCheckinCode(payload.code)) {
    uni.showToast({ title: '核销码格式不正确', icon: 'none' })
    return Promise.resolve(null)
  }
  const items = readCheckins()
  const userId = payload.userId || getCurrentUserId()
  const found = items.find((item) => item.activityId === String(payload.activityId) && item.userId === userId)
  if (found) {
    return Promise.resolve(found)
  }
  const checkin = buildCheckin(payload)

  writeCheckins([checkin, ...items])
  return Promise.resolve(checkin)
}

export async function confirmCheckin(payload) {
  if (!isValidCheckinCode(payload.code)) {
    uni.showToast({ title: '核销码格式不正确', icon: 'none' })
    return null
  }
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-checkin', 'confirm', buildCheckin(payload))
    } catch (error) {
      return confirmLocalCheckin(payload)
    }
  }
  return confirmLocalCheckin(payload)
}

function getLocalCheckinForUser(activityId, userId = getCurrentUserId()) {
  const found = readCheckins().find((item) => item.activityId === String(activityId) && item.userId === userId)
  return Promise.resolve(found || null)
}

export async function getCheckinForUser(activityId, userId = getCurrentUserId()) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-checkin', 'getForUser', { activityId, userId })
    } catch (error) {
      return getLocalCheckinForUser(activityId, userId)
    }
  }
  return getLocalCheckinForUser(activityId, userId)
}

export async function hasCheckedIn(activityId, userId = getCurrentUserId()) {
  const checkin = await getCheckinForUser(activityId, userId)
  return Boolean(checkin)
}

function listLocalCheckins(activityId) {
  return Promise.resolve(readCheckins().filter((item) => item.activityId === String(activityId)))
}

export async function listCheckins(activityId) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-checkin', 'listByActivity', { activityId })
    } catch (error) {
      return listLocalCheckins(activityId)
    }
  }
  return listLocalCheckins(activityId)
}

function getLocalCheckinSummary(activityId, totalCount = 0) {
  const items = readCheckins().filter((item) => item.activityId === String(activityId))
  return Promise.resolve({
    activityId: String(activityId),
    checkedCount: items.length,
    totalCount,
    pendingCount: Math.max(0, Number(totalCount) - items.length),
    items
  })
}

export async function getCheckinSummary(activityId, totalCount = 0) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-checkin', 'summary', { activityId, totalCount })
    } catch (error) {
      return getLocalCheckinSummary(activityId, totalCount)
    }
  }
  return getLocalCheckinSummary(activityId, totalCount)
}
