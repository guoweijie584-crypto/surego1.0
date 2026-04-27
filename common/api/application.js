const STORAGE_KEY = 'surego_applications'

function readApplications() {
  return uni.getStorageSync(STORAGE_KEY) || []
}

function writeApplications(items) {
  uni.setStorageSync(STORAGE_KEY, items)
}

export function submitApplication(payload) {
  const items = readApplications()
  const application = {
    id: `app_${Date.now()}`,
    activityId: payload.activityId,
    userId: 'mock_user',
    gender: payload.gender,
    mbti: payload.mbti,
    message: payload.message,
    answers: payload.answers || [],
    status: payload.requireApproval ? 'pending' : 'approved',
    createdAt: new Date().toISOString()
  }

  writeApplications([application, ...items])
  uni.setStorageSync(`surego_application_${payload.activityId}`, application)
  return Promise.resolve(application)
}

export function listApplications(activityId) {
  return Promise.resolve(readApplications().filter((item) => item.activityId === String(activityId)))
}

export function reviewApplication(id, status) {
  const next = readApplications().map((item) => (item.id === id ? { ...item, status } : item))
  writeApplications(next)
  return Promise.resolve(next.find((item) => item.id === id))
}
