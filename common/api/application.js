import { USE_UNICLOUD } from '@/common/config/runtime.js'
import { callSuregoFunction } from '@/common/api/cloud.js'
import { getCurrentUserId } from '@/common/api/auth.js'

const STORAGE_KEY = 'surego_applications'

function readApplications() {
  return uni.getStorageSync(STORAGE_KEY) || []
}

function writeApplications(items) {
  uni.setStorageSync(STORAGE_KEY, items)
}

function writeApplicationCache(application) {
  const items = readApplications()
  const next = [application, ...items.filter((item) => item.id !== application.id)]
  writeApplications(next)
  uni.setStorageSync(`surego_application_${application.activityId}`, application)
}

function buildApplication(payload, id = `app_${Date.now()}`) {
  return {
    id,
    activityId: String(payload.activityId),
    userId: payload.userId || getCurrentUserId(),
    gender: payload.gender,
    mbti: payload.mbti,
    message: payload.message,
    answers: payload.answers || [],
    status: payload.status || (payload.requireApproval ? 'pending' : 'approved'),
    createdAt: payload.createdAt || new Date().toISOString()
  }
}

function submitLocalApplication(payload) {
  const items = readApplications()
  const application = buildApplication(payload)

  writeApplications([application, ...items])
  uni.setStorageSync(`surego_application_${payload.activityId}`, application)
  return Promise.resolve(application)
}

export async function submitApplication(payload) {
  if (USE_UNICLOUD) {
    try {
      const application = await callSuregoFunction('surego-application', 'submit', buildApplication(payload, ''))
      writeApplicationCache(application)
      return application
    } catch (error) {
      return submitLocalApplication(payload)
    }
  }
  return submitLocalApplication(payload)
}

function listLocalApplications(activityId) {
  return Promise.resolve(readApplications().filter((item) => item.activityId === String(activityId)))
}

export async function listApplications(activityId) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-application', 'listByActivity', { activityId })
    } catch (error) {
      return listLocalApplications(activityId)
    }
  }
  return listLocalApplications(activityId)
}

function reviewLocalApplication(id, status) {
  const next = readApplications().map((item) => (item.id === id ? { ...item, status } : item))
  writeApplications(next)
  return Promise.resolve(next.find((item) => item.id === id))
}

export async function reviewApplication(id, status) {
  if (USE_UNICLOUD) {
    try {
      const reviewed = await callSuregoFunction('surego-application', 'review', { id, status })
      const local = await reviewLocalApplication(id, status)
      return reviewed || local
    } catch (error) {
      return reviewLocalApplication(id, status)
    }
  }
  return reviewLocalApplication(id, status)
}
