'use strict';

const db = uniCloud.database();
const reports = db.collection('surego-reports');
const activities = db.collection('surego-activities');
const partners = db.collection('surego-partner-posts');
const auditLogs = db.collection('surego-audit-logs');
const applications = db.collection('surego-applications');
const orders = db.collection('surego-orders');
const checkins = db.collection('surego-checkins');
const uniIdUsers = db.collection('uni-id-users');

const reportStatuses = ['pending', 'resolved', 'rejected'];
const activityStatuses = ['pending', 'visible', 'approved', 'rejected', 'hidden'];
const partnerModerationStatuses = ['pending', 'visible', 'approved', 'rejected', 'hidden'];

function now() {
  return Date.now();
}

function normalizeRoles(roles) {
  if (!roles) return [];
  return Array.isArray(roles) ? roles.map(String) : [String(roles)];
}

async function findUniIdUser(userId) {
  if (!userId || userId === 'mock_user') return null;
  try {
    const result = await uniIdUsers.doc(String(userId)).get();
    return (result.data || [])[0] || null;
  } catch (error) {
    return null;
  }
}

function isTokenOwnedByUser(userRecord = {}, uniIdToken = '') {
  const token = String(uniIdToken || '');
  if (!userRecord || !token) return false;
  const tokens = Array.isArray(userRecord.token) ? userRecord.token : [userRecord.token];
  return tokens.some((item) => {
    if (!item) return false;
    return String(typeof item === 'string' ? item : item.token || item.value || '') === token;
  });
}

async function resolveUserContext(event = {}, payload = {}) {
  const uid = String(event.userId || event.uid || payload.uid || payload.userId || payload.user_id || payload.reporterId || payload.reporter_id || '');
  const userRecord = await findUniIdUser(uid);
  const tokenValid = isTokenOwnedByUser(userRecord, event.uniIdToken);
  const roles = tokenValid ? normalizeRoles(userRecord?.role) : [];
  return {
    uid,
    roles,
    exists: Boolean(userRecord && tokenValid),
    isOps: roles.includes('admin') || roles.includes('operator')
  };
}

function authRequired() {
  return {
    code: 'AUTH_REQUIRED',
    message: 'Please login before operating SureGo data.'
  };
}

function opsRequired() {
  return {
    code: 'FORBIDDEN',
    message: 'Operator permission is required.'
  };
}

function normalizeReportStatus(status = 'pending') {
  return reportStatuses.includes(status) ? status : 'pending';
}

function normalizeActivityStatus(status = 'pending', options = {}) {
  if (options.forWrite && status === 'visible') return 'approved';
  return activityStatuses.includes(status) ? status : 'pending';
}

function normalizePartnerModerationStatus(status = 'pending', options = {}) {
  if (options.forWrite && status === 'visible') return 'approved';
  return partnerModerationStatuses.includes(status) ? status : 'pending';
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

function normalizePartnerPost(record = {}) {
  return {
    ...record,
    id: record._id || record.id,
    creatorId: record.creator_id || record.creatorId || '',
    creator_id: record.creator_id || record.creatorId || '',
    moderationStatus: normalizePartnerModerationStatus(record.moderation_status || record.moderationStatus || 'pending'),
    moderation_status: normalizePartnerModerationStatus(record.moderation_status || record.moderationStatus || 'pending'),
    moderationNote: record.moderation_note || record.moderationNote || '',
    moderation_note: record.moderation_note || record.moderationNote || '',
    moderatedBy: record.moderated_by || record.moderatedBy || '',
    moderated_by: record.moderated_by || record.moderatedBy || '',
    moderatedAt: record.moderated_at || record.moderatedAt || '',
    moderated_at: record.moderated_at || record.moderatedAt || '',
    createdAt: record.created_at || record.createdAt || now(),
    updatedAt: record.updated_at || record.updatedAt || ''
  };
}

async function writeAuditLog(payload = {}) {
  await auditLogs.add({
    operator_id: payload.operatorId || payload.operator_id,
    action: payload.action,
    target_type: payload.targetType || payload.target_type,
    target_id: payload.targetId || payload.target_id || '',
    note: payload.note || '',
    created_at: now()
  });
}

function normalizeReportList(result = {}) {
  return (result.data || []).map(normalizeReport);
}

function normalizeActivityList(result = {}) {
  return (result.data || []).map(normalizeActivity);
}

function normalizePartnerPostList(result = {}) {
  return (result.data || []).map(normalizePartnerPost);
}

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};
  const user = await resolveUserContext(event, payload);

  if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();

  if (action === 'createReport') {
    const record = {
      activity_id: payload.activityId || payload.activity_id || '',
      activity_title: payload.activityTitle || payload.activity_title || '',
      reporter_id: user.uid,
      reason: payload.reason || 'content',
      note: payload.note || '',
      status: 'pending',
      created_at: now(),
      updated_at: now()
    };
    const result = await reports.add(record);
    await writeAuditLog({ operatorId: record.reporter_id, action: 'report.create', targetType: 'report', targetId: result.id, note: record.reason });
    return {
      code: 0,
      data: normalizeReport({
        ...record,
        _id: result.id || result._id
      })
    };
  }

  if (action === 'listReports') {
    if (!user.isOps) return opsRequired();
    const status = payload.status;
    const query = status && status !== 'all' ? reports.where({ status: normalizeReportStatus(status) }) : reports;
    const result = await query.orderBy('created_at', 'desc').limit(payload.limit || 100).get();
    return {
      code: 0,
      data: normalizeReportList(result)
    };
  }

  if (action === 'updateReportStatus') {
    if (!user.isOps) return opsRequired();
    const status = normalizeReportStatus(payload.status);
    const updatePayload = {
      status,
      review_note: payload.reviewNote || payload.review_note || '',
      handled_by: user.uid,
      handled_at: now(),
      updated_at: now()
    };
    await reports.doc(payload.id).update(updatePayload);
    await writeAuditLog({ operatorId: updatePayload.handled_by, action: `report.${status}`, targetType: 'report', targetId: payload.id, note: updatePayload.review_note });
    const result = await reports.doc(payload.id).get();
    return {
      code: 0,
      data: normalizeReport((result.data || [])[0] || { _id: payload.id, ...updatePayload })
    };
  }

  if (action === 'listOpsActivities') {
    if (!user.isOps) return opsRequired();
    const result = await activities.orderBy('created_at', 'desc').limit(payload.limit || 100).get();
    return {
      code: 0,
      data: normalizeActivityList(result)
    };
  }

  if (action === 'moderateActivity') {
    if (!user.isOps) return opsRequired();
    const activityId = payload.activityId || payload.activity_id || payload.id;
    const moderationStatus = normalizeActivityStatus(payload.moderationStatus || payload.moderation_status, { forWrite: true });
    const updatePayload = {
      moderation_status: moderationStatus,
      ...(moderationStatus === 'approved' ? { status: 'recruiting' } : {}),
      moderation_note: payload.moderationNote || payload.moderation_note || '',
      moderated_by: user.uid,
      moderated_at: now(),
      updated_at: now()
    };
    await activities.doc(activityId).update(updatePayload);
    await writeAuditLog({ operatorId: updatePayload.moderated_by, action: `activity.${moderationStatus}`, targetType: 'activity', targetId: activityId, note: updatePayload.moderation_note });
    const result = await activities.doc(activityId).get();
    return {
      code: 0,
      data: normalizeActivity((result.data || [])[0] || { _id: activityId, ...updatePayload })
    };
  }

  if (action === 'listOpsPartnerPosts') {
    if (!user.isOps) return opsRequired();
    const result = await partners.orderBy('created_at', 'desc').limit(payload.limit || 100).get();
    return {
      code: 0,
      data: normalizePartnerPostList(result)
    };
  }

  if (action === 'moderatePartnerPost') {
    if (!user.isOps) return opsRequired();
    const partnerPostId = payload.partnerPostId || payload.partner_post_id || payload.id;
    const moderationStatus = normalizePartnerModerationStatus(payload.moderationStatus || payload.moderation_status, { forWrite: true });
    const updatePayload = {
      moderation_status: moderationStatus,
      moderation_note: payload.moderationNote || payload.moderation_note || '',
      moderated_by: user.uid,
      moderated_at: now(),
      updated_at: now()
    };
    await partners.doc(partnerPostId).update(updatePayload);
    await writeAuditLog({ operatorId: updatePayload.moderated_by, action: `partner_post.${moderationStatus}`, targetType: 'partner_post', targetId: partnerPostId, note: updatePayload.moderation_note });
    const result = await partners.doc(partnerPostId).get();
    return {
      code: 0,
      data: normalizePartnerPost((result.data || [])[0] || { _id: partnerPostId, ...updatePayload })
    };
  }

  if (action === 'getOpsStats') {
    if (!user.isOps) return opsRequired();
    const [activityResult, partnerResult, reportResult, applicationResult, orderResult, checkinResult] = await Promise.all([
      activities.limit(1000).get(),
      partners.limit(1000).get(),
      reports.limit(1000).get(),
      applications.limit(1000).get(),
      orders.limit(1000).get(),
      checkins.limit(1000).get()
    ]);
    const activityItems = activityResult.data || [];
    const partnerItems = partnerResult.data || [];
    const reportItems = reportResult.data || [];
    const orderItems = orderResult.data || [];
    const checkinItems = checkinResult.data || [];
    const totalParticipants = activityItems.reduce((sum, item) => sum + Number(item.participantCount || item.participant_count || 0), 0);
    return {
      code: 0,
      data: {
        activityCount: activityItems.length,
        pendingReports: reportItems.filter((item) => item.status === 'pending').length,
        pendingActivities: activityItems.filter((item) => item.status === 'reviewing' || !item.moderation_status || item.moderation_status === 'pending').length,
        hiddenActivities: activityItems.filter((item) => item.moderation_status === 'hidden').length,
        partnerCount: partnerItems.length,
        pendingPartners: partnerItems.filter((item) => !item.moderation_status || item.moderation_status === 'pending').length,
        hiddenPartners: partnerItems.filter((item) => item.moderation_status === 'hidden').length,
        applicationCount: (applicationResult.data || []).length,
        orderCount: orderItems.length,
        paidOrderCount: orderItems.filter((item) => item.status === 'paid').length,
        pendingOrderCount: orderItems.filter((item) => item.status === 'pending').length,
        refundedOrderCount: orderItems.filter((item) => item.status === 'refunded').length,
        checkinRate: totalParticipants ? Math.round((checkinItems.length / totalParticipants) * 100) : 0
      }
    };
  }

  return {
    code: 'UNKNOWN_ACTION',
    message: `Unsupported action: ${action}`
  };
};
