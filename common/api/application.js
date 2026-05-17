import { USE_UNICLOUD, shouldUseReferenceMockPreview } from '../config/runtime.js'
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
  const next = [
    application,
    ...items.filter((item) => (
      item.id !== application.id
        && !(String(item.activityId) === String(application.activityId) && String(item.userId) === String(application.userId))
    ))
  ]
  writeApplications(next)
  uni.setStorageSync(`surego_application_${application.activityId}`, application)
}

function normalizeApplication(item = {}) {
  return {
    ...item,
    id: item.id || item._id || '',
    activityId: String(item.activityId || item.activity_id || ''),
    userId: item.userId || item.user_id || '',
    nickname: item.nickname || item.applicantName || item.applicant_name || '',
    avatar: item.avatar || item.applicantAvatar || item.applicant_avatar || '',
    applicantName: item.applicantName || item.applicant_name || item.nickname || '',
    applicantAvatar: item.applicantAvatar || item.applicant_avatar || item.avatar || '',
    reviewNote: item.reviewNote || item.review_note || '',
    rejectReason: item.rejectReason || item.reject_reason || '',
    reviewerId: item.reviewerId || item.reviewer_id || '',
    createdAt: item.createdAt || item.created_at || '',
    reviewedAt: item.reviewedAt || item.reviewed_at || ''
  }
}

function buildApplication(payload, id = `app_${Date.now()}`) {
  const profile = getCurrentUserProfile()
  return {
    id,
    activityId: String(payload.activityId),
    userId: payload.userId || getCurrentUserId(),
    nickname: payload.nickname || profile.nickname || '',
    avatar: payload.avatar || profile.avatar || '',
    applicantName: payload.applicantName || payload.applicant_name || profile.nickname || '',
    applicantAvatar: payload.applicantAvatar || payload.applicant_avatar || profile.avatar || '',
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

function adjustLocalActivityParticipantCount(activityId, delta = 0) {
  if (!activityId || !delta) return
  try {
    const key = 'surego_created_activities'
    const created = uni.getStorageSync(key) || []
    const next = created.map((item) => {
      if (String(item.id || item._id || '') !== String(activityId)) return item
      const currentCount = Number(item.participantCount || item.participant_count || 0)
      const nextCount = Math.max(0, currentCount + delta)
      return {
        ...item,
        participantCount: nextCount,
        participant_count: nextCount
      }
    })
    uni.setStorageSync(key, next)
  } catch (error) {
    console.warn('[surego-application] participant count sync failed', error)
  }
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
    eventKey: `application:submitted:${application.id || application._id || `${application.activityId || payload.activityId}:${application.userId || payload.userId || ''}`}`,
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
    eventKey: `application:reviewed:${application.id || application._id || `${application.activityId}:${application.userId}`}:${status}`,
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
  const userId = payload.userId || getCurrentUserId()
  const existing = items.find((item) => (
    String(item.activityId) === String(payload.activityId)
      && String(item.userId) === String(userId)
  )) || uni.getStorageSync(`surego_application_${payload.activityId}`)
  if (existing && String(existing.userId || '') === String(userId)) {
    return Promise.resolve(normalizeApplication(existing))
  }
  const application = buildApplication(payload)

  writeApplicationCache(application)
  return Promise.resolve(application)
}

export async function submitApplication(payload) {
  let application
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      application = await callSuregoFunction('surego-application', 'submit', buildApplication(payload, ''))
      application = normalizeApplication(application)
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

function getLocalApplicationForActivity(activityId, userId = getCurrentUserId()) {
  const cached = uni.getStorageSync(`surego_application_${activityId}`)
  if (cached && String(cached.userId || cached.user_id || '') === String(userId)) {
    return Promise.resolve(normalizeApplication(cached))
  }
  const found = readApplications().find((item) => (
    String(item.activityId || item.activity_id || '') === String(activityId)
      && String(item.userId || item.user_id || '') === String(userId)
  ))
  return Promise.resolve(found ? normalizeApplication(found) : null)
}

function getApplicationSortTime(application = {}) {
  const value = application.createdAt || application.created_at || application.reviewedAt || application.reviewed_at || 0
  if (typeof value === 'number') return value
  const parsed = Date.parse(String(value))
  return Number.isNaN(parsed) ? 0 : parsed
}

function listCurrentUserLocalApplications(userId = getCurrentUserId()) {
  if (!userId) return Promise.resolve([])
  const applications = readApplications()
    .filter((item) => String(item.userId || item.user_id || '') === String(userId))
    .map(normalizeApplication)
    .sort((a, b) => getApplicationSortTime(b) - getApplicationSortTime(a))
  return Promise.resolve(applications)
}

export async function listMyApplications() {
  const userId = getCurrentUserId()
  if (!userId) return []
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      const items = await callSuregoFunction('surego-application', 'listMine', { userId, limit: 100 })
      const applications = (items || []).map(normalizeApplication)
      applications.filter((item) => item.activityId).forEach(writeApplicationCache)
      return applications
    } catch (error) {
      return handleSuregoCloudError(error, () => listCurrentUserLocalApplications(userId))
    }
  }
  return listCurrentUserLocalApplications(userId)
}

export async function getApplicationForActivity(activityId) {
  const userId = getCurrentUserId()
  if (!activityId || !userId) return null
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      const application = await callSuregoFunction('surego-application', 'getMineByActivity', { activityId, userId })
      if (application) {
        const normalized = normalizeApplication(application)
        writeApplicationCache(normalized)
        return normalized
      }
      return null
    } catch (error) {
      return handleSuregoCloudError(error, () => getLocalApplicationForActivity(activityId, userId))
    }
  }
  return getLocalApplicationForActivity(activityId, userId)
}

function listLocalApplications(activityId) {
  return Promise.resolve(readApplications().filter((item) => item.activityId === String(activityId)))
}

export async function listApplications(activityId) {
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      const items = await callSuregoFunction('surego-application', 'listByActivity', { activityId })
      return (items || []).map(normalizeApplication)
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
  const before = readApplications().find((item) => item.id === review.id)
  const next = readApplications().map((item) => (item.id === review.id ? { ...item, ...review } : item))
  writeApplications(next)
  const found = next.find((item) => item.id === review.id)
  if (found) {
    uni.setStorageSync(`surego_application_${found.activityId}`, found)
    if (before?.status !== 'approved' && found.status === 'approved') {
      adjustLocalActivityParticipantCount(found.activityId, 1)
    } else if (before?.status === 'approved' && found.status !== 'approved') {
      adjustLocalActivityParticipantCount(found.activityId, -1)
    }
  }
  return Promise.resolve(found)
}

export async function reviewApplication(id, status, options = {}) {
  const review = buildReviewPayload({ id, status, ...options })
  const sourceApplication = options.application || {}
  let reviewed
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
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
