'use strict';

const crypto = require('crypto');
const db = uniCloud.database();
const collection = db.collection('surego-checkins');
const codeCollection = db.collection('surego-checkin-codes');
const activityCollection = db.collection('surego-activities');
const applicationCollection = db.collection('surego-applications');
const orderCollection = db.collection('surego-orders');
const {
  authRequired,
  cleanId,
  cleanString,
  forbidden,
  invalid,
  now,
  ok,
  requireAuth,
  unknownAction,
  withSafeHandler
} = require('surego-security');

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

function isValidCheckinCode(code = '') {
  return /^SG[A-Z0-9]{12,64}$/.test(String(code || '').trim().toUpperCase());
}

function normalizeCheckinCode(code = '') {
  const matched = String(code || '').toUpperCase().match(/SG[A-Z0-9]{12,64}/);
  return matched ? matched[0] : '';
}

async function getActivity(activityId) {
  const result = await activityCollection.doc(cleanId(activityId)).get();
  return (result.data || [])[0] || null;
}

async function canManageActivity(activityId, user) {
  if (user.isOps) return true;
  const activity = await getActivity(activityId);
  return Boolean(activity && String(activity.creator_id || activity.creatorId || '') === user.uid);
}

async function canParticipantCheckIn(activityId, userId) {
  let applications = await applicationCollection
    .where({ activity_id: cleanId(activityId), user_id: cleanId(userId) })
    .limit(1)
    .get();
  if (!(applications.data || []).length) {
    applications = await applicationCollection
      .where({ activityId: cleanId(activityId), userId: cleanId(userId) })
      .limit(1)
      .get();
  }
  const application = (applications.data || [])[0];
  if (!application || application.status !== 'approved') return false;
  let orders = await orderCollection
    .where({ activity_id: cleanId(activityId), user_id: cleanId(userId) })
    .limit(1)
    .get();
  if (!(orders.data || []).length) {
    orders = await orderCollection
      .where({ activityId: cleanId(activityId), userId: cleanId(userId) })
      .limit(1)
      .get();
  }
  const order = (orders.data || [])[0];
  return !order || order.status === 'paid';
}

function buildRecord(payload = {}) {
  const checkedAt = now();
  return {
    activity_id: cleanId(payload.activityId || payload.activity_id),
    user_id: cleanId(payload.userId || payload.user_id),
    code: normalizeCheckinCode(payload.code),
    status: 'checked',
    checked_by: cleanId(payload.checkedBy || payload.checked_by),
    source: cleanString(payload.source || 'manual', { max: 20 }),
    remark: cleanString(payload.remark, { max: 120 }),
    checked_at: checkedAt,
    created_at: checkedAt
  };
}

async function findExistingCheckin(activityId, userId) {
  let result = await collection
    .where({ activity_id: cleanId(activityId), user_id: cleanId(userId) })
    .limit(1)
    .get();
  if (!(result.data || []).length) {
    result = await collection
      .where({ activityId: cleanId(activityId), userId: cleanId(userId) })
      .limit(1)
      .get();
  }
  return (result.data || [])[0] || null;
}

async function getActivityCheckins(activityId) {
  const result = await collection
    .where({ activity_id: cleanId(activityId) })
    .orderBy('checked_at', 'desc')
    .get();
  return normalizeList(result);
}

function generateCheckinCode() {
  return `SG${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
}

function buildCheckinId(activityId, userId) {
  return `checkin_${String(activityId || '').replace(/[^a-zA-Z0-9_-]/g, '_')}_${String(userId || '').replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}

async function main(event) {
  const action = event.action;
  const payload = event.payload || {};
  const user = await requireAuth(event);

  if (!user) return authRequired();

  if (action === 'createCode') {
    const activityId = cleanId(payload.activityId || payload.activity_id);
    const targetUserId = cleanId(payload.userId || payload.user_id || user.uid);
    if (targetUserId !== user.uid && !(await canManageActivity(activityId, user))) {
      return forbidden('You cannot create a check-in code for this user.');
    }
    if (!(await canParticipantCheckIn(activityId, targetUserId))) {
      return forbidden('This participant is not eligible for check-in.');
    }
    const code = generateCheckinCode();
    const record = {
      activity_id: activityId,
      user_id: targetUserId,
      code,
      created_by: user.uid,
      expires_at: now() + 5 * 60 * 1000,
      used: false,
      created_at: now()
    };
    await codeCollection.add(record);
    return ok({
      activityId,
      userId: targetUserId,
      code,
      expiresIn: 300
    });
  }

  if (action === 'confirm') {
    const activityId = cleanId(payload.activityId || payload.activity_id);
    const source = cleanString(payload.source || 'manual', { max: 20 });
    const code = normalizeCheckinCode(payload.code);
    if (!isValidCheckinCode(code)) {
      return invalid('Invalid SureGo check-in code.');
    }
    const activity = await getActivity(activityId);
    if (!activity) return { code: 'ACTIVITY_NOT_FOUND', message: 'Activity does not exist.' };
    if (!(await canManageActivity(activityId, user))) {
      return forbidden('Only the activity creator can check in participants.');
    }
    const codeResult = await codeCollection
      .where({ activity_id: activityId, code, used: false })
      .limit(1)
      .get();
    const codeRecord = (codeResult.data || [])[0];
    if (!codeRecord || Number(codeRecord.expires_at || 0) < now()) {
      return invalid('Check-in code is expired or invalid.');
    }
    const targetUserId = cleanId(codeRecord.user_id);
    const requestedUserId = cleanId(payload.userId || payload.user_id);
    if (requestedUserId && requestedUserId !== targetUserId) {
      return invalid('Check-in code does not belong to the selected participant.');
    }
    if (!(await canParticipantCheckIn(activityId, targetUserId))) {
      return forbidden('This participant is not eligible for check-in.');
    }
    const existing = await findExistingCheckin(activityId, targetUserId);
    if (existing) return ok(normalizeCheckin(existing));
    const record = buildRecord({
      activityId,
      userId: targetUserId,
      code,
      source,
      checkedBy: user.uid,
      remark: payload.remark
    });
    record._id = buildCheckinId(activityId, targetUserId);
    let result;
    try {
      result = await collection.add(record);
    } catch (error) {
      const concurrentExisting = await findExistingCheckin(activityId, targetUserId);
      if (concurrentExisting) return ok(normalizeCheckin(concurrentExisting));
      throw error;
    }
    await codeCollection.where({ _id: codeRecord._id || codeRecord.id, used: false }).update({
      used: true,
      used_at: now(),
      used_by: user.uid
    });
    return ok(normalizeCheckin({ ...record, _id: result.id || result._id || record._id }));
  }

  if (action === 'getForUser') {
    const activityId = cleanId(payload.activityId || payload.activity_id);
    const userId = cleanId(payload.userId || payload.user_id || user.uid);
    if (userId !== user.uid && !(await canManageActivity(activityId, user))) {
      return forbidden('You cannot read this check-in record.');
    }
    const found = await findExistingCheckin(activityId, userId);
    return ok(found ? normalizeCheckin(found) : null);
  }

  if (action === 'listByActivity') {
    const activityId = cleanId(payload.activityId || payload.activity_id);
    if (!(await canManageActivity(activityId, user))) {
      return forbidden('Only the activity creator can list check-ins.');
    }
    return ok(await getActivityCheckins(activityId));
  }

  if (action === 'summary') {
    const activityId = cleanId(payload.activityId || payload.activity_id);
    if (!(await canManageActivity(activityId, user))) {
      return forbidden('Only the activity creator can read check-in summary.');
    }
    const totalCount = Number(payload.totalCount || payload.total_count || 0);
    const items = await getActivityCheckins(activityId);
    return ok({
      activityId,
      checkedCount: items.length,
      totalCount,
      pendingCount: Math.max(0, totalCount - items.length),
      items
    });
  }

  return unknownAction();
}

exports.main = (event) => withSafeHandler(event, () => main(event));
