import { USE_UNICLOUD } from '../config/runtime.js'
import { callSuregoFunction, handleSuregoCloudError } from '@/common/api/cloud.js'
import { getCurrentUserId, isOpsUser } from '@/common/api/auth.js'
import { listActivities } from '@/common/api/activity.js'
import { listOrdersByActivity } from '@/common/api/order.js'
import { listApplications } from '@/common/api/application.js'
import { getCheckinSummary } from '@/common/api/checkin.js'
import { createMessage } from '@/common/api/message.js'

const REPORTS_KEY = 'surego_moderation_reports'
const ACTIVITY_STATUS_KEY = 'surego_moderation_activity_statuses'
const AUDIT_LOG_KEY = 'surego_moderation_audit_logs'

const REPORT_STATUSES = ['pending', 'resolved', 'rejected']
const ACTIVITY_MODERATION_STATUSES = ['visible', 'approved', 'rejected', 'hidden']

function now() {
  return new Date().toISOString()
}

function readStorage(key) {
  return uni.getStorageSync(key) || (key === ACTIVITY_STATUS_KEY ? {} : [])
}

function writeStorage(key, value) {
  uni.setStorageSync(key, value)
}

function normalizeReportStatus(status = 'pending') {
  return REPORT_STATUSES.includes(status) ? status : 'pending'
}

function normalizeModerationStatus(status = 'visible') {
  return ACTIVITY_MODERATION_STATUSES.includes(status) ? status : 'visible'
}

function normalizeReport(item = {}) {
  return {
    ...item,
    id: item.id || item._id || '',
    activityId: String(item.activityId || item.activity_id || ''),
    activityTitle: item.activityTitle || item.activity_title || '',
    reporterId: item.reporterId || item.reporter_id || getCurrentUserId(),
    reason: item.reason || 'content',
    note: item.note || '',
    status: normalizeReportStatus(item.status),
    reviewNote: item.reviewNote || item.review_note || '',
    handledBy: item.handledBy || item.handled_by || '',
    handledAt: item.handledAt || item.handled_at || '',
    createdAt: item.createdAt || item.created_at || now()
  }
}

function normalizeActivityModeration(item = {}) {
  const moderationStatus = normalizeModerationStatus(item.moderationStatus || item.moderation_status)
  return {
    ...item,
    id: String(item.id || item._id || item.activityId || item.activity_id || ''),
    moderationStatus,
    moderation_status: moderationStatus,
    moderationNote: item.moderationNote || item.moderation_note || '',
    moderatedBy: item.moderatedBy || item.moderated_by || '',
    moderatedAt: item.moderatedAt || item.moderated_at || ''
  }
}

function readReports() {
  return readStorage(REPORTS_KEY).map(normalizeReport)
}

function writeReports(items) {
  writeStorage(REPORTS_KEY, items.map(normalizeReport))
}

function readActivityStatuses() {
  return readStorage(ACTIVITY_STATUS_KEY)
}

function writeActivityStatus(activityId, payload) {
  const statuses = readActivityStatuses()
  statuses[String(activityId)] = normalizeActivityModeration({
    ...statuses[String(activityId)],
    ...payload,
    id: String(activityId)
  })
  writeStorage(ACTIVITY_STATUS_KEY, statuses)
  return statuses[String(activityId)]
}

function writeAuditLog(payload) {
  const logs = readStorage(AUDIT_LOG_KEY)
  const entry = {
    id: `audit_${Date.now()}`,
    operatorId: payload.operatorId || getCurrentUserId(),
    action: payload.action,
    targetType: payload.targetType,
    targetId: String(payload.targetId || ''),
    note: payload.note || '',
    createdAt: now()
  }
  writeStorage(AUDIT_LOG_KEY, [entry, ...logs])
  return entry
}

function createLocalReport(payload = {}) {
  const report = normalizeReport({
    id: payload.id || `report_${Date.now()}`,
    activityId: payload.activityId,
    activityTitle: payload.activityTitle || '',
    reporterId: payload.reporterId || getCurrentUserId(),
    reason: payload.reason || 'content',
    note: payload.note || '',
    status: 'pending',
    createdAt: now()
  })
  writeReports([report, ...readReports()])
  writeAuditLog({ action: 'report.create', targetType: 'report', targetId: report.id, note: report.reason })
  return Promise.resolve(report)
}

export async function createReport(payload = {}) {
  if (USE_UNICLOUD) {
    try {
      return normalizeReport(await callSuregoFunction('surego-moderation', 'createReport', {
        ...payload,
        reporterId: payload.reporterId || getCurrentUserId()
      }))
    } catch (error) {
      return handleSuregoCloudError(error, () => createLocalReport(payload))
    }
  }
  return createLocalReport(payload)
}

function listLocalReports(status = 'all') {
  const reports = readReports()
  if (!status || status === 'all') return Promise.resolve(reports)
  return Promise.resolve(reports.filter((item) => item.status === status))
}

export async function listReports(status = 'all') {
  if (USE_UNICLOUD) {
    try {
      const reports = await callSuregoFunction('surego-moderation', 'listReports', { status })
      return reports.map(normalizeReport)
    } catch (error) {
      return handleSuregoCloudError(error, () => listLocalReports(status))
    }
  }
  return listLocalReports(status)
}

async function notifyReportHandled(report) {
  if (!report?.reporterId) return
  await createMessage({
    userId: report.reporterId,
    type: 'system',
    title: report.status === 'resolved' ? '举报已处理' : '举报已关闭',
    content: report.reviewNote || '运营已处理你的活动举报。',
    activityId: report.activityId,
    read: false
  })
}

function updateLocalReportStatus(id, status, options = {}) {
  const nextStatus = normalizeReportStatus(status)
  const handledBy = options.handledBy || getCurrentUserId()
  const handledAt = now()
  const next = readReports().map((item) => (
    item.id === id
      ? normalizeReport({
          ...item,
          status: nextStatus,
          reviewNote: options.reviewNote || item.reviewNote,
          handledBy,
          handledAt
        })
      : item
  ))
  writeReports(next)
  writeAuditLog({ operatorId: handledBy, action: `report.${nextStatus}`, targetType: 'report', targetId: id, note: options.reviewNote || '' })
  return Promise.resolve(next.find((item) => item.id === id) || null)
}

export async function updateReportStatus(id, status, options = {}) {
  const payload = { id, status, ...options, handledBy: options.handledBy || getCurrentUserId() }
  let report
  if (USE_UNICLOUD) {
    try {
      report = normalizeReport(await callSuregoFunction('surego-moderation', 'updateReportStatus', payload))
    } catch (error) {
      report = await handleSuregoCloudError(error, () => updateLocalReportStatus(id, status, options))
    }
  } else {
    report = await updateLocalReportStatus(id, status, options)
  }
  await notifyReportHandled(report)
  return report
}

function mergeActivityModeration(activity) {
  const overlays = readActivityStatuses()
  return normalizeActivityModeration({
    ...activity,
    ...(overlays[String(activity.id)] || {})
  })
}

export async function listOpsActivities() {
  if (USE_UNICLOUD) {
    try {
      const items = await callSuregoFunction('surego-moderation', 'listOpsActivities', { limit: 100 })
      return items.map(normalizeActivityModeration)
    } catch (error) {
      return handleSuregoCloudError(error, async () => {
        const items = await listActivities()
        return items.map(mergeActivityModeration)
      })
    }
  }
  const items = await listActivities()
  return items.map(mergeActivityModeration)
}

async function notifyActivityModerated(activity) {
  const userId = activity.creatorId || activity.creator_id
  if (!userId) return
  const statusCopy = {
    approved: '活动已通过运营审核',
    rejected: '活动未通过运营审核',
    hidden: '活动已被运营下架',
    visible: '活动已恢复展示'
  }
  await createMessage({
    userId,
    type: 'system',
    title: statusCopy[activity.moderationStatus] || '活动状态已更新',
    content: activity.moderationNote || statusCopy[activity.moderationStatus] || '运营已更新活动状态。',
    activityId: activity.id,
    read: false
  })
}

function moderateLocalActivity(activityId, moderationStatus, options = {}) {
  const next = writeActivityStatus(activityId, {
    moderationStatus,
    moderationNote: options.moderationNote || '',
    moderatedBy: options.moderatedBy || getCurrentUserId(),
    moderatedAt: now()
  })
  writeAuditLog({ action: `activity.${next.moderationStatus}`, targetType: 'activity', targetId: activityId, note: next.moderationNote })
  return Promise.resolve(next)
}

export async function moderateActivity(activityId, moderationStatus, options = {}) {
  const payload = {
    activityId,
    moderationStatus: normalizeModerationStatus(moderationStatus),
    moderationNote: options.moderationNote || '',
    moderatedBy: options.moderatedBy || getCurrentUserId()
  }
  let activity
  if (USE_UNICLOUD) {
    try {
      activity = normalizeActivityModeration(await callSuregoFunction('surego-moderation', 'moderateActivity', payload))
    } catch (error) {
      activity = await handleSuregoCloudError(error, () => moderateLocalActivity(activityId, moderationStatus, options))
    }
  } else {
    activity = await moderateLocalActivity(activityId, moderationStatus, options)
  }
  await notifyActivityModerated(activity)
  return activity
}

async function getLocalOpsStats() {
  const [activities, reports] = await Promise.all([listOpsActivities(), listReports('all')])
  const activityApplications = await Promise.all(activities.map((item) => listApplications(item.id)))
  const activityOrders = await Promise.all(activities.map((item) => listOrdersByActivity(item.id)))
  const activityCheckins = await Promise.all(activities.map((item) => getCheckinSummary(item.id, item.participantCount || 0)))
  const orders = activityOrders.flat()
  const checkinTotal = activityCheckins.reduce((sum, item) => sum + Number(item.totalCount || 0), 0)
  const checkedTotal = activityCheckins.reduce((sum, item) => sum + Number(item.checkedCount || 0), 0)

  return {
    isOps: isOpsUser(),
    activityCount: activities.length,
    pendingReports: reports.filter((item) => item.status === 'pending').length,
    pendingActivities: activities.filter((item) => item.status === 'reviewing' || item.moderationStatus === 'visible').length,
    hiddenActivities: activities.filter((item) => item.moderationStatus === 'hidden').length,
    applicationCount: activityApplications.flat().length,
    orderCount: orders.length,
    paidOrderCount: orders.filter((item) => item.status === 'paid').length,
    pendingOrderCount: orders.filter((item) => item.status === 'pending').length,
    refundedOrderCount: orders.filter((item) => item.status === 'refunded').length,
    checkinRate: checkinTotal ? Math.round((checkedTotal / checkinTotal) * 100) : 0
  }
}

export async function getOpsStats() {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-moderation', 'getOpsStats', {})
    } catch (error) {
      return handleSuregoCloudError(error, getLocalOpsStats)
    }
  }
  return getLocalOpsStats()
}
