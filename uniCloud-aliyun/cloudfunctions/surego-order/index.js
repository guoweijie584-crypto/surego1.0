'use strict';

const db = uniCloud.database();
const collection = db.collection('surego-orders');
const activityCollection = db.collection('surego-activities');
const uniIdUsers = db.collection('uni-id-users');
const ORDER_STATUSES = ['pending', 'pending_payment', 'paid', 'frozen', 'refunding', 'refunded', 'settled', 'disputed', 'closed'];

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

async function canManageActivity(activityId, user) {
  if (user.isOps) return true;
  const result = await activityCollection.doc(String(activityId || '')).get();
  const found = (result.data || [])[0];
  return Boolean(found && String(found.creator_id || found.creatorId || '') === user.uid);
}

async function canEditOrder(id, user) {
  const result = await collection.doc(id).get();
  const found = (result.data || [])[0];
  return Boolean(found && String(found.user_id || found.userId || '') === user.uid);
}

function normalizeStatus(status = 'pending') {
  return ORDER_STATUSES.includes(status) ? status : 'pending';
}

function normalizeOrder(item = {}) {
  return {
    ...item,
    id: item.id || item._id,
    activityId: item.activityId || item.activity_id,
    userId: item.userId || item.user_id,
    activityTitle: item.activityTitle || item.activity_title || '',
    activityCover: item.activityCover || item.activity_cover || '',
    refundNote: item.refundNote || item.refund_note || '',
    closeReason: item.closeReason || item.close_reason || '',
    status: normalizeStatus(item.status),
    createdAt: item.createdAt || item.created_at,
    updatedAt: item.updatedAt || item.updated_at,
    paidAt: item.paidAt || item.paid_at,
    refundedAt: item.refundedAt || item.refunded_at,
    closedAt: item.closedAt || item.closed_at
  };
}

function normalizeList(result) {
  return (result.data || []).map(normalizeOrder);
}

function buildRecord(payload = {}) {
  const activityId = String(payload.activityId || payload.activity_id || '');
  const userId = payload.userId || payload.user_id;
  const record = {
    ...payload,
    activityId,
    activity_id: activityId,
    userId,
    user_id: userId,
    amount: Number(payload.amount) || 0,
    status: normalizeStatus(payload.status),
    activity_title: payload.activityTitle || payload.activity_title || payload.title || '',
    activity_cover: payload.activityCover || payload.activity_cover || payload.image || '',
    refund_note: payload.refundNote || payload.refund_note || '',
    close_reason: payload.closeReason || payload.close_reason || '',
    updated_at: Date.now()
  };
  if (!record.id) delete record.id;
  delete record._id;
  if (!record.created_at) record.created_at = Date.now();
  return record;
}

async function findOrderByActivity(payload = {}) {
  const activityId = String(payload.activityId || payload.activity_id || '');
  const userId = payload.userId || payload.user_id;
  const result = await collection.where({ activityId, userId }).limit(1).get();
  return (result.data || [])[0] || null;
}

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};
  const user = await resolveUserContext(event, payload);

  if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();

  if (action === 'create') {
    const order = buildRecord({ ...payload, userId: user.uid, user_id: user.uid });
    const result = await collection.add(order);
    return {
      code: 0,
      data: normalizeOrder({
        ...order,
        id: result.id
      })
    };
  }

  if (action === 'ensureForActivity') {
    const nextPayload = { ...payload, userId: user.uid, user_id: user.uid };
    const found = await findOrderByActivity(nextPayload);
    if (found) {
      const nextOrder = buildRecord({
        ...found,
        ...nextPayload,
        id: found._id || found.id,
        created_at: found.created_at
      });
      await collection.doc(found._id || found.id).update(nextOrder);
      return {
        code: 0,
        data: normalizeOrder(nextOrder)
      };
    }

    const order = buildRecord(nextPayload);
    const result = await collection.add(order);
    return {
      code: 0,
      data: normalizeOrder({
        ...order,
        id: result.id
      })
    };
  }

  if (action === 'getForActivity') {
    const found = await findOrderByActivity({ ...payload, userId: user.uid, user_id: user.uid });
    return {
      code: 0,
      data: found ? normalizeOrder(found) : null
    };
  }

  if (action === 'getDetail') {
    const result = await collection.doc(payload.id).get();
    const found = (result.data || [])[0] || null;
    if (found && String(found.user_id || found.userId || '') !== user.uid && !(await canManageActivity(found.activity_id || found.activityId, user))) {
      return { code: 'FORBIDDEN', message: 'You cannot read this order.' };
    }
    return {
      code: 0,
      data: found ? normalizeOrder(found) : null
    };
  }

  if (action === 'updateStatus' || action === 'markPaid') {
    if (!(await canEditOrder(payload.id, user))) {
      return { code: 'FORBIDDEN', message: 'You cannot update this order.' };
    }
    const status = normalizeStatus(action === 'markPaid' ? 'paid' : payload.status);
    const patch = {
      status,
      updated_at: Date.now()
    };
    if (status === 'paid') patch.paid_at = Date.now();
    if (status === 'frozen') patch.paid_at = Date.now();
    if (status === 'refunded') {
      patch.refunded_at = Date.now();
      patch.refund_note = payload.refundNote || payload.refund_note || '';
    }
    if (status === 'refunding') {
      patch.refund_note = payload.refundNote || payload.refund_note || '';
    }
    if (status === 'closed') {
      patch.closed_at = Date.now();
      patch.close_reason = payload.closeReason || payload.close_reason || '';
    }
    await collection.doc(payload.id).update(patch);
    return {
      code: 0,
      data: normalizeOrder({
        id: payload.id,
        ...patch
      })
    };
  }

  if (action === 'refund') {
    if (!(await canEditOrder(payload.id, user))) {
      return { code: 'FORBIDDEN', message: 'You cannot refund this order.' };
    }
    const refundedAt = Date.now();
    const patch = {
      status: 'refunded',
      refund_note: payload.refundNote || payload.refund_note || '模拟退款已记录',
      refunded_at: refundedAt,
      updated_at: refundedAt
    };
    await collection.doc(payload.id).update(patch);
    return {
      code: 0,
      data: normalizeOrder({
        id: payload.id,
        ...patch
      })
    };
  }

  if (action === 'close') {
    if (!(await canEditOrder(payload.id, user))) {
      return { code: 'FORBIDDEN', message: 'You cannot close this order.' };
    }
    const closedAt = Date.now();
    const patch = {
      status: 'closed',
      close_reason: payload.closeReason || payload.close_reason || '订单已关闭',
      closed_at: closedAt,
      updated_at: closedAt
    };
    await collection.doc(payload.id).update(patch);
    return {
      code: 0,
      data: normalizeOrder({
        id: payload.id,
        ...patch
      })
    };
  }

  if (action === 'list') {
    const userId = user.uid;
    const result = await collection.where({ userId }).orderBy('created_at', 'desc').limit(payload.limit || 20).get();
    return {
      code: 0,
      data: normalizeList(result)
    };
  }

  if (action === 'listByActivity') {
    const activityId = String(payload.activityId || payload.activity_id || '');
    if (!(await canManageActivity(activityId, user))) {
      return { code: 'FORBIDDEN', message: 'Only the activity creator can list activity orders.' };
    }
    const result = await collection.where({ activityId }).orderBy('created_at', 'desc').limit(payload.limit || 100).get();
    return {
      code: 0,
      data: normalizeList(result)
    };
  }

  return {
    code: 'UNKNOWN_ACTION',
    message: `Unsupported action: ${action}`
  };
};
