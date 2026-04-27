'use strict';

const db = uniCloud.database();
const collection = db.collection('surego-checkins');

function now() {
  return Date.now();
}

function normalizeCheckin(record = {}) {
  return {
    id: record._id || record.id,
    activityId: record.activity_id || record.activityId || '',
    userId: record.user_id || record.userId || 'mock_user',
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
    user_id: payload.userId || payload.user_id || 'mock_user',
    code: payload.code || '',
    status: payload.status || 'checked',
    checked_by: payload.checkedBy || payload.checked_by || payload.userId || payload.user_id || 'mock_user',
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
      user_id: userId || 'mock_user'
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

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};

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
    const record = buildRecord(payload);
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
    const userId = payload.userId || payload.user_id || 'mock_user';
    const found = await findExistingCheckin(activityId, userId);
    return {
      code: 0,
      data: found ? normalizeCheckin(found) : null
    };
  }

  if (action === 'listByActivity') {
    const activityId = payload.activityId || payload.activity_id;
    return {
      code: 0,
      data: await getActivityCheckins(activityId)
    };
  }

  if (action === 'summary') {
    const activityId = payload.activityId || payload.activity_id;
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
