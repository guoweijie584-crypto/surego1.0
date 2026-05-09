'use strict';

const db = uniCloud.database();
const reports = db.collection('surego-reports');
const activities = db.collection('surego-activities');
const auditLogs = db.collection('surego-audit-logs');
const applications = db.collection('surego-applications');
const orders = db.collection('surego-orders');
const checkins = db.collection('surego-checkins');
const {
  authRequired,
  cleanEnum,
  cleanId,
  cleanString,
  forbidden,
  invalid,
  now,
  ok,
  requireAuth,
  requireOps,
  unknownAction,
  withSafeHandler
} = require('surego-security');

const reportStatuses = ['pending', 'resolved', 'rejected'];
const activityStatuses = ['pending', 'visible', 'approved', 'rejected', 'hidden'];
const reportReasons = ['content', 'fraud', 'spam', 'privacy', 'other'];

function opsRequired() {
  return forbidden('Operator permission is required.');
}

function normalizeReportStatus(status = 'pending') {
  return reportStatuses.includes(status) ? status : 'pending';
}

function normalizeActivityStatus(status = 'pending', options = {}) {
  if (options.forWrite && status === 'visible') return 'approved';
  return activityStatuses.includes(status) ? status : 'pending';
}

function normalizeReport(record = {}) {
  return {
    id: record._id || record.id,
    activityId: record.activity_id || record.activityId || '',
    activityTitle: record.activity_title || record.activityTitle || '',
    reporterId: record.reporter_id || record.reporterId || '',
    reason: record.reason || 'content',
    note: record.note || '',
    status: normalizeReportStatus(record.status),
    reviewNote: record.review_note || record.reviewNote || '',
    handledBy: record.handled_by || record.handledBy || '',
    handledAt: record.handled_at || record.handledAt || '',
    createdAt: record.created_at || record.createdAt || now()
  };
}

function normalizeActivity(record = {}) {
  return {
    ...record,
    id: record._id || record.id,
    creatorId: record.creator_id || record.creatorId || '',
    moderationStatus: normalizeActivityStatus(record.moderation_status || record.moderationStatus || 'pending'),
    moderation_status: normalizeActivityStatus(record.moderation_status || record.moderationStatus || 'pending'),
    moderationNote: record.moderation_note || record.moderationNote || '',
    moderatedBy: record.moderated_by || record.moderatedBy || '',
    moderatedAt: record.moderated_at || record.moderatedAt || ''
  };
}

async function writeAuditLog(payload = {}) {
  await auditLogs.add({
    operator_id: payload.operatorId || payload.operator_id,
    action: payload.action,
    target_type: payload.targetType || payload.target_type,
    target_id: payload.targetId || payload.target_id || '',
    note: cleanString(payload.note, { max: 300 }),
    created_at: now()
  });
}

function normalizeReportList(result = {}) {
  return (result.data || []).map(normalizeReport);
}

function normalizeActivityList(result = {}) {
  return (result.data || []).map(normalizeActivity);
}

async function sumTotalParticipants() {
  const pageSize = 500;
  let skip = 0;
  let total = 0;
  while (true) {
    const result = await activities
      .field({ participantCount: true, participant_count: true })
      .skip(skip)
      .limit(pageSize)
      .get();
    const items = result.data || [];
    total += items.reduce((sum, item) => sum + Number(item.participantCount || item.participant_count || 0), 0);
    if (items.length < pageSize) break;
    skip += pageSize;
  }
  return total;
}

async function main(event) {
  const action = event.action;
  const payload = event.payload || {};
  const user = await requireAuth(event);

  if (!user) return authRequired();

  if (action === 'createReport') {
    const activityId = cleanId(payload.activityId || payload.activity_id);
    const activityResult = await activities.doc(activityId).get();
    const activity = (activityResult.data || [])[0];
    if (!activity) return { code: 'ACTIVITY_NOT_FOUND', message: 'Activity does not exist.' };
    if (String(activity.creator_id || activity.creatorId || '') === user.uid) {
      return forbidden('Creator cannot report own activity.');
    }
    const reason = cleanEnum(payload.reason, reportReasons, 'content');
    const existing = await reports.where({
      activity_id: activityId,
      reporter_id: user.uid,
      reason,
      status: 'pending'
    }).limit(1).get();
    const found = (existing.data || [])[0];
    if (found) return ok(normalizeReport(found));
    const record = {
      activity_id: activityId,
      activity_title: cleanString(activity.title || payload.activityTitle || payload.activity_title, { max: 80 }),
      reporter_id: user.uid,
      reason,
      note: cleanString(payload.note, { max: 300 }),
      status: 'pending',
      created_at: now(),
      updated_at: now()
    };
    const result = await reports.add(record);
    await writeAuditLog({ operatorId: record.reporter_id, action: 'report.create', targetType: 'report', targetId: result.id, note: record.reason });
    return ok(normalizeReport({ ...record, _id: result.id || result._id }));
  }

  if (action === 'listReports') {
    if (!requireOps(user)) return opsRequired();
    const status = payload.status;
    const query = status && status !== 'all' ? reports.where({ status: normalizeReportStatus(status) }) : reports;
    const result = await query.orderBy('created_at', 'desc').limit(payload.limit || 100).get();
    return ok(normalizeReportList(result));
  }

  if (action === 'updateReportStatus') {
    if (!requireOps(user)) return opsRequired();
    const id = cleanId(payload.id);
    const status = normalizeReportStatus(payload.status);
    const existing = await reports.doc(id).get();
    if (!(existing.data || [])[0]) return { code: 'REPORT_NOT_FOUND', message: 'Report does not exist.' };
    const updatePayload = {
      status,
      review_note: cleanString(payload.reviewNote || payload.review_note, { max: 300 }),
      handled_by: user.uid,
      handled_at: now(),
      updated_at: now()
    };
    await reports.doc(id).update(updatePayload);
    await writeAuditLog({ operatorId: updatePayload.handled_by, action: `report.${status}`, targetType: 'report', targetId: id, note: updatePayload.review_note });
    const result = await reports.doc(id).get();
    return ok(normalizeReport((result.data || [])[0] || { _id: id, ...updatePayload }));
  }

  if (action === 'listOpsActivities') {
    if (!requireOps(user)) return opsRequired();
    const result = await activities.orderBy('created_at', 'desc').limit(payload.limit || 100).get();
    return ok(normalizeActivityList(result));
  }

  if (action === 'moderateActivity') {
    if (!requireOps(user)) return opsRequired();
    const activityId = cleanId(payload.activityId || payload.activity_id || payload.id);
    const activityResult = await activities.doc(activityId).get();
    if (!(activityResult.data || [])[0]) return { code: 'ACTIVITY_NOT_FOUND', message: 'Activity does not exist.' };
    const moderationStatus = normalizeActivityStatus(payload.moderationStatus || payload.moderation_status, { forWrite: true });
    if (!activityStatuses.includes(moderationStatus)) return invalid('Invalid moderation status.');
    const updatePayload = {
      moderation_status: moderationStatus,
      ...(moderationStatus === 'approved' ? { status: 'recruiting' } : {}),
      moderation_note: cleanString(payload.moderationNote || payload.moderation_note, { max: 300 }),
      moderated_by: user.uid,
      moderated_at: now(),
      updated_at: now()
    };
    if (['rejected', 'hidden'].includes(moderationStatus) && !updatePayload.moderation_note) {
      return invalid('Moderation note is required for rejected or hidden activities.');
    }
    await activities.doc(activityId).update(updatePayload);
    await writeAuditLog({ operatorId: updatePayload.moderated_by, action: `activity.${moderationStatus}`, targetType: 'activity', targetId: activityId, note: updatePayload.moderation_note });
    const result = await activities.doc(activityId).get();
    return ok(normalizeActivity((result.data || [])[0] || { _id: activityId, ...updatePayload }));
  }

  if (action === 'getOpsStats') {
    if (!requireOps(user)) return opsRequired();
    const [
      activityCountResult,
      pendingReportResult,
      reviewingActivityResult,
      pendingModerationActivityResult,
      hiddenActivityResult,
      applicationCountResult,
      orderCountResult,
      paidOrderCountResult,
      pendingOrderCountResult,
      refundedOrderCountResult,
      checkinCountResult,
      totalParticipants
    ] = await Promise.all([
      activities.count(),
      reports.where({ status: 'pending' }).count(),
      activities.where({ status: 'reviewing' }).count(),
      activities.where({ moderation_status: 'pending' }).count(),
      activities.where({ moderation_status: 'hidden' }).count(),
      applications.count(),
      orders.count(),
      orders.where({ status: 'paid' }).count(),
      orders.where({ status: 'pending' }).count(),
      orders.where({ status: 'refunded' }).count(),
      checkins.count(),
      sumTotalParticipants()
    ]);
    const pendingActivities = Math.max(
      Number(reviewingActivityResult.total || 0),
      Number(pendingModerationActivityResult.total || 0)
    );
    const checkinCount = Number(checkinCountResult.total || 0);
    return ok({
      activityCount: Number(activityCountResult.total || 0),
      pendingReports: Number(pendingReportResult.total || 0),
      pendingActivities,
      hiddenActivities: Number(hiddenActivityResult.total || 0),
      applicationCount: Number(applicationCountResult.total || 0),
      orderCount: Number(orderCountResult.total || 0),
      paidOrderCount: Number(paidOrderCountResult.total || 0),
      pendingOrderCount: Number(pendingOrderCountResult.total || 0),
      refundedOrderCount: Number(refundedOrderCountResult.total || 0),
      checkinRate: totalParticipants ? Math.round((checkinCount / totalParticipants) * 100) : 0
    });
  }

  return unknownAction();
}

exports.main = (event) => withSafeHandler(event, () => main(event));
