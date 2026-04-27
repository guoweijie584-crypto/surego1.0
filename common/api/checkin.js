const STORAGE_KEY = 'surego_checkins'

function readCheckins() {
  return uni.getStorageSync(STORAGE_KEY) || []
}

function writeCheckins(items) {
  uni.setStorageSync(STORAGE_KEY, items)
}

export function createCheckinCode(activityId) {
  const code = `SG${String(Date.now()).slice(-6)}`
  return Promise.resolve({
    activityId,
    code,
    expiresIn: 300
  })
}

export function confirmCheckin(payload) {
  const items = readCheckins()
  const checkin = {
    id: `checkin_${Date.now()}`,
    activityId: payload.activityId,
    userId: payload.userId || 'mock_user',
    code: payload.code,
    status: 'checked',
    checkedAt: new Date().toISOString()
  }

  writeCheckins([checkin, ...items])
  return Promise.resolve(checkin)
}

export function listCheckins(activityId) {
  return Promise.resolve(readCheckins().filter((item) => item.activityId === String(activityId)))
}
