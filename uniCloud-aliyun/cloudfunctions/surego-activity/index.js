'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const collection = db.collection('surego-activities');
const applications = db.collection('surego-applications');
const uniIdUsers = db.collection('uni-id-users');

const lifecycleStatuses = ['draft', 'reviewing', 'published', 'recruiting', 'formed', 'ongoing', 'finished', 'cancelled'];
const publicLifecycleStatuses = ['published', 'recruiting', 'formed', 'ongoing'];
const publicModerationStatuses = ['approved', 'visible'];
const moderationStatuses = ['pending', 'approved', 'rejected', 'hidden', 'visible'];
const legacyStatusMap = {
  hosting: 'recruiting',
  not_applied: 'recruiting',
  pending: 'recruiting',
  approved: 'recruiting',
  rejected: 'recruiting'
};

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
  const uid = String(event.userId || event.uid || payload.uid || payload.userId || payload.user_id || '');
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

async function canEditActivity(id, user) {
  const result = await collection.doc(id).get();
  const found = (result.data || [])[0];
  return Boolean(found && String(found.creator_id || found.creatorId || '') === user.uid);
}

function normalizeStatus(status = 'recruiting') {
  const mapped = legacyStatusMap[status] || status;
  return lifecycleStatuses.includes(mapped) ? mapped : 'recruiting';
}

function normalizeModerationStatus(status = 'pending') {
  const nextStatus = status || 'pending';
  return moderationStatuses.includes(nextStatus) ? nextStatus : 'pending';
}

function isPubliclyVisibleActivity(item = {}) {
  const rawStatus = String(item.status || item.lifecycleStatus || '');
  const status = normalizeStatus(item.status || item.lifecycleStatus);
  const moderationStatus = normalizeModerationStatus(item.moderation_status || item.moderationStatus);
  if (rawStatus === 'rejected' || rawStatus === 'hidden') return false;
  return publicLifecycleStatuses.includes(status) && publicModerationStatuses.includes(moderationStatus);
}

function normalizeActivity(item = {}) {
  return {
    ...item,
    id: item.id || item._id,
    status: normalizeStatus(item.status),
    moderationStatus: normalizeModerationStatus(item.moderation_status || item.moderationStatus),
    moderation_status: normalizeModerationStatus(item.moderation_status || item.moderationStatus),
    moderationNote: item.moderation_note || item.moderationNote || '',
    moderatedAt: item.moderated_at || item.moderatedAt || '',
    moderatedBy: item.moderated_by || item.moderatedBy || '',
    createdAt: item.createdAt || item.created_at,
    updatedAt: item.updatedAt || item.updated_at
  };
}

function normalizeList(result) {
  return (result.data || []).map(normalizeActivity);
}

function withoutEmptyId(payload) {
  const next = { ...payload };
  if (!next.id) delete next.id;
  delete next['is' + 'Creator'];
  delete next.moderationStatus;
  delete next.moderation_status;
  delete next.moderationNote;
  delete next.moderation_note;
  delete next.moderatedAt;
  delete next.moderated_at;
  delete next.moderatedBy;
  delete next.moderated_by;
  return next;
}

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};
  const user = await resolveUserContext(event, payload);

  if (action === 'list') {
    const requestedLimit = Number(payload.limit) > 0 ? Number(payload.limit) : 20;
    const result = await collection.orderBy('created_at', 'desc').limit(Math.min(requestedLimit * 5, 100)).get();
    return {
      code: 0,
      data: normalizeList(result).filter(isPubliclyVisibleActivity).slice(0, requestedLimit)
    };
  }

  if (action === 'detail') {
    const result = await collection.doc(payload.id).get();
    const activity = normalizeActivity((result.data || [])[0]);
    if (!activity?.id) {
      return { code: 0, data: null };
    }
    const canView = isPubliclyVisibleActivity(activity)
      || (user.exists && (user.isOps || String(activity.creator_id || activity.creatorId || '') === user.uid));
    if (!canView) {
      return { code: 'FORBIDDEN', message: 'This activity is still under review.' };
    }
    return {
      code: 0,
      data: activity
    };
  }

  if (action === 'listMine') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const [createdResult, applicationResult] = await Promise.all([
      collection.where({ creator_id: user.uid }).orderBy('created_at', 'desc').limit(payload.limit || 100).get(),
      applications.where({ user_id: user.uid }).orderBy('created_at', 'desc').limit(payload.limit || 100).get()
    ]);
    const applicationItems = applicationResult.data || [];
    const applicationStatusByActivity = {};
    const activityIds = Array.from(new Set(applicationItems.map((item) => String(item.activity_id || item.activityId || '')).filter(Boolean)));
    const joinedResult = activityIds.length
      ? await collection.where({ _id: dbCmd.in(activityIds) }).limit(activityIds.length).get()
      : { data: [] };
    applicationItems.forEach((item) => {
      const activityId = String(item.activity_id || item.activityId || '');
      if (activityId) applicationStatusByActivity[activityId] = item.status || 'pending';
    });
    const withApplicationStatus = (item) => ({
      ...normalizeActivity(item),
      applicationStatus: applicationStatusByActivity[String(item._id || item.id)] || 'not_applied'
    });
    const joined = (joinedResult.data || []).map(withApplicationStatus);
    return {
      code: 0,
      data: {
        hosting: normalizeList(createdResult),
        joined: joined.filter((item) => item.applicationStatus === 'approved'),
        pending: joined.filter((item) => item.applicationStatus === 'pending')
      }
    };
  }

  if (action === 'create') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const activity = withoutEmptyId({
      ...payload,
      creatorId: user.uid,
      creator_id: user.uid,
      status: 'reviewing',
      created_at: Date.now(),
      updated_at: Date.now()
    });
    activity.moderation_status = 'pending';
    const result = await collection.add(activity);
    return {
      code: 0,
      data: normalizeActivity({
        ...activity,
        id: result.id
      })
    };
  }

  if (action === 'update') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const id = payload.id;
    if (!(await canEditActivity(id, user))) {
      return { code: 'FORBIDDEN', message: 'Only the creator can edit this activity.' };
    }
    const updatePayload = withoutEmptyId({
      ...payload,
      creatorId: user.uid,
      creator_id: user.uid,
      updated_at: Date.now()
    });
    delete updatePayload._id;
    await collection.doc(id).update(updatePayload);
    return {
      code: 0,
      data: normalizeActivity({
        ...updatePayload,
        id
      })
    };
  }

  if (action === 'updateStatus') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    if (!(await canEditActivity(payload.id, user))) {
      return { code: 'FORBIDDEN', message: 'Only the creator can update this activity.' };
    }
    await collection.doc(payload.id).update({
      status: normalizeStatus(payload.status),
      updated_at: Date.now()
    });
    return {
      code: 0,
      data: {
        id: payload.id,
        status: normalizeStatus(payload.status)
      }
    };
  }

  return {
    code: 'UNKNOWN_ACTION',
    message: `Unsupported action: ${action}`
  };
};
