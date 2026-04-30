import { USE_UNICLOUD } from '../config/runtime.js'
import { callSuregoFunction, handleSuregoCloudError } from '@/common/api/cloud.js'
import { getCurrentUserId, getCurrentUserProfile } from '@/common/api/auth.js'
import { createMessage } from '@/common/api/message.js'

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
    reviewNote: payload.reviewNote || '',
    rejectReason: payload.rejectReason || '',
    reviewerId: payload.reviewerId || '',
    createdAt: payload.createdAt || new Date().toISOString()
  }
}

function getSenderName() {
  const profile = getCurrentUserProfile()
  return profile.nickname || 'SureGo'
}

function getActivityTitle(source = {}) {
  return source.activityTitle || source.activity_title || source.title || '活动'
}

async function safeCreateMessage(payload) {
  try {
    return await createMessage(payload)
  } catch (error) {
    console.warn('[surego-message] create failed', error)
    return null
  }
}

async function notifyApplicationSubmitted(application = {}, payload = {}) {
  const creatorId = payload.activityCreatorId || payload.creatorId || payload.creator_id
  if (!creatorId) return null

  const title = getActivityTitle(payload)
  const isPending = application.status === 'pending'
  return safeCreateMessage({
    userId: creatorId,
    type: 'application',
    title: isPending ? '新的报名申请' : '新的报名加入',
    content: isPending
      ? `有人申请加入「${title}」，请前往管理页审核。`
      : `有人已报名加入「${title}」，可在管理页查看。`,
    sender: getSenderName(),
    activityId: application.activityId || payload.activityId,
    read: false
  })
}

async function notifyApplicationReviewed(application = {}, status = '') {
  if (!application.userId || !application.activityId) return null
  const approved = status === 'approved'
  const title = getActivityTitle(application)
  const note = approved ? application.reviewNote : application.rejectReason
  return safeCreateMessage({
    userId: application.userId,
    type: 'activity',
    title: approved ? '报名审核已通过' : '报名审核未通过',
    content: note
      ? `你在「${title}」的报名${approved ? '已通过' : '未通过'}：${note}`
      : `你在「${title}」的报名${approved ? '已通过' : '未通过'}。`,
    sender: getSenderName(),
    activityId: application.activityId,
    read: false
  })
}

function submitLocalApplication(payload) {
  const items = readApplications()
  const application = buildApplication(payload)

  writeApplications([application, ...items])
  uni.setStorageSync(`surego_application_${payload.activityId}`, application)
  return Promise.resolve(application)
}

export async function submitApplication(payload) {
  let application
  if (USE_UNICLOUD) {
    try {
      application = await callSuregoFunction('surego-application', 'submit', buildApplication(payload, ''))
      writeApplicationCache(application)
    } catch (error) {
      application = await handleSuregoCloudError(error, () => submitLocalApplication(payload))
    }
  } else {
    application = await submitLocalApplication(payload)
  }
  await notifyApplicationSubmitted(application, payload)
  return application
}

function listLocalApplications(activityId) {
  return Promise.resolve(readApplications().filter((item) => item.activityId === String(activityId)))
}

export async function listApplications(activityId) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-application', 'listByActivity', { activityId })
    } catch (error) {
      return handleSuregoCloudError(error, () => listLocalApplications(activityId))
    }
  }
  return listLocalApplications(activityId)
}

function buildReviewPayload(input = {}) {
  return {
    id: input.id,
    status: input.status,
    reviewNote: input.reviewNote || '',
    rejectReason: input.rejectReason || '',
    reviewerId: input.reviewerId || getCurrentUserId(),
    reviewedAt: input.reviewedAt || new Date().toISOString()
  }
}

function reviewLocalApplication(payload) {
  const review = buildReviewPayload(payload)
  const next = readApplications().map((item) => (item.id === review.id ? { ...item, ...review } : item))
  writeApplications(next)
  const found = next.find((item) => item.id === review.id)
  if (found) {
    uni.setStorageSync(`surego_application_${found.activityId}`, found)
  }
  return Promise.resolve(found)
}

export async function reviewApplication(id, status, options = {}) {
  const review = buildReviewPayload({ id, status, ...options })
  const sourceApplication = options.application || {}
  let reviewed
  if (USE_UNICLOUD) {
    try {
      reviewed = await callSuregoFunction('surego-application', 'review', review)
      const local = await reviewLocalApplication(review)
      reviewed = reviewed || local
    } catch (error) {
      reviewed = await handleSuregoCloudError(error, () => reviewLocalApplication(review))
    }
  } else {
    reviewed = await reviewLocalApplication(review)
  }

  const nextApplication = {
    ...sourceApplication,
    ...reviewed,
    id,
    status,
    activityId: reviewed?.activityId || reviewed?.activity_id || sourceApplication.activityId || sourceApplication.activity_id,
    userId: reviewed?.userId || reviewed?.user_id || sourceApplication.userId || sourceApplication.user_id,
    activityTitle: reviewed?.activityTitle || sourceApplication.activityTitle,
    reviewNote: reviewed?.reviewNote || sourceApplication.reviewNote || options.reviewNote || '',
    rejectReason: reviewed?.rejectReason || sourceApplication.rejectReason || options.rejectReason || ''
  }
  await notifyApplicationReviewed(nextApplication, status)
  return reviewed
}
