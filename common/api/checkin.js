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
  return {
    id: payload.id || `checkin_${Date.now()}`,
    activityId: String(payload.activityId),
    userId: payload.userId || getCurrentUserId(),
    code: payload.code || '',
    status: 'checked',
    checkedAt: payload.checkedAt || new Date().toISOString()
  }
}

function confirmLocalCheckin(payload) {
  const items = readCheckins()
  const checkin = buildCheckin(payload)

  writeCheckins([checkin, ...items])
  return Promise.resolve(checkin)
}

export async function confirmCheckin(payload) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-checkin', 'confirm', buildCheckin(payload))
    } catch (error) {
      return confirmLocalCheckin(payload)
    }
  }
  return confirmLocalCheckin(payload)
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
