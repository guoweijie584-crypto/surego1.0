'use strict';

const db = uniCloud.database();
const collection = db.collection('surego-checkins');
const activityCollection = db.collection('surego-activities');
const applicationCollection = db.collection('surego-applications');
const orderCollection = db.collection('surego-orders');
const uniIdUsers = db.collection('uni-id-users');

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
  const uid = String(event.userId || event.uid || payload.uid || payload.checkedBy || payload.checked_by || payload.userId || payload.user_id || '');
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

async function getActivity(activityId) {
  const result = await activityCollection.doc(String(activityId || '')).get();
  return (result.data || [])[0] || null;
}

async function canManageActivity(activityId, user) {
  if (user.isOps) return true;
  const activity = await getActivity(activityId);
  return Boolean(activity && String(activity.creator_id || activity.creatorId || '') === user.uid);
}

async function canParticipantCheckIn(activityId, userId) {
  const applications = await applicationCollection
    .where({ activityId: String(activityId || ''), userId })
    .limit(1)
    .get();
  const application = (applications.data || [])[0];
  if (!application || application.status !== 'approved') return false;
  const orders = await orderCollection
    .where({ activityId: String(activityId || ''), userId })
    .limit(1)
    .get();
  const order = (orders.data || [])[0];
  return !order || order.status === 'paid';
}

function normalizeCheckin(record = {}) {
  return {
    id: record._id || record.id,
    activityId: record.activity_id || record.activityId || '',
    userId: record.user_id || record.userId || '',
    code: record.code || '',
    status: record.status || 'checked',
    checkedBy: record.checked_by || record.checkedBy || '',
    source: record.source || 'manual',
    remark: record.remark || '',
    checkedAt: record.checked_at || record.checkedAt || now(),
    createdAt: record.created_at || record.createdAt || record.checked_at || now()
  };
}

function normalizeList(result = {}) {
  return (result.data || []).map(normalizeCheckin);
}

function buildRecord(payload = {}) {
  const checkedAt = payload.checkedAt || payload.checked_at || now();
  return {
    activity_id: String(payload.activityId || payload.activity_id || ''),
    user_id: payload.userId || payload.user_id,
    code: payload.code || '',
    status: payload.status || 'checked',
    checked_by: payload.checkedBy || payload.checked_by,
    source: payload.source || 'manual',
    remark: payload.remark || '',
    checked_at: checkedAt,
    created_at: payload.createdAt || payload.created_at || checkedAt
  };
}

async function findExistingCheckin(activityId, userId) {
  const result = await collection
    .where({
      activity_id: String(activityId || ''),
      user_id: userId
    })
    .limit(1)
    .get();
  return (result.data || [])[0] || null;
}

async function getActivityCheckins(activityId) {
  const result = await collection
    .where({ activity_id: String(activityId) })
    .orderBy('checked_at', 'desc')
    .get();
  return normalizeList(result);
}

function isValidCheckinCode(code = '') {
  return /^SG\d{4,}$/.test(String(code || '').trim());
}

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};
  const user = await resolveUserContext(event, payload);

  if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();

  if (action === 'createCode') {
    return {
      code: 0,
      data: {
        activityId: String(payload.activityId || payload.activity_id || ''),
        code: `SG${String(now()).slice(-6)}`,
        expiresIn: 300
      }
    };
  }

  if (action === 'confirm') {
    const source = payload.source || 'manual';
    if (!isValidCheckinCode(payload.code)) {
      return { code: 'INVALID_CHECKIN_CODE', message: 'Invalid SureGo check-in code.' };
    }
    const activity = await getActivity(payload.activityId || payload.activity_id);
    if (!activity) {
      return { code: 'ACTIVITY_NOT_FOUND', message: 'Activity does not exist.' };
    }
    const targetUserId = source === 'participant' ? user.uid : (payload.userId || payload.user_id);
    if (source !== 'participant' && !(await canManageActivity(payload.activityId || payload.activity_id, user))) {
      return { code: 'FORBIDDEN', message: 'Only the activity creator can check in participants.' };
    }
    if (source === 'participant' && !(await canParticipantCheckIn(payload.activityId || payload.activity_id, user.uid))) {
      return { code: 'FORBIDDEN', message: 'This participant is not eligible for check-in.' };
    }
    const record = buildRecord({
      ...payload,
      userId: targetUserId,
      user_id: targetUserId,
      checkedBy: user.uid,
      checked_by: user.uid
    });
    const existing = await findExistingCheckin(record.activity_id, record.user_id);
    if (existing) {
      return {
        code: 0,
        data: normalizeCheckin(existing)
      };
    }
    const result = await collection.add(record);
    return {
      code: 0,
      data: normalizeCheckin({
        ...record,
        _id: result.id || result._id
      })
    };
  }

  if (action === 'getForUser') {
    const activityId = payload.activityId || payload.activity_id;
    const userId = payload.userId || payload.user_id || user.uid;
    if (userId !== user.uid && !(await canManageActivity(activityId, user))) {
      return { code: 'FORBIDDEN', message: 'You cannot read this check-in record.' };
    }
    const found = await findExistingCheckin(activityId, userId);
    return {
      code: 0,
      data: found ? normalizeCheckin(found) : null
    };
  }

  if (action === 'listByActivity') {
    const activityId = payload.activityId || payload.activity_id;
    if (!(await canManageActivity(activityId, user))) {
      return { code: 'FORBIDDEN', message: 'Only the activity creator can list check-ins.' };
    }
    return {
      code: 0,
      data: await getActivityCheckins(activityId)
    };
  }

  if (action === 'summary') {
    const activityId = payload.activityId || payload.activity_id;
    if (!(await canManageActivity(activityId, user))) {
      return { code: 'FORBIDDEN', message: 'Only the activity creator can read check-in summary.' };
    }
    const totalCount = Number(payload.totalCount || payload.total_count || 0);
    const items = await getActivityCheckins(activityId);
    return {
      code: 0,
      data: {
        activityId: String(activityId || ''),
        checkedCount: items.length,
        totalCount,
        pendingCount: Math.max(0, totalCount - items.length),
        items
      }
    };
  }

  return {
    code: 'UNKNOWN_ACTION',
    message: `Unsupported action: ${action}`
  };
};
