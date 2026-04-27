'use strict';

const db = uniCloud.database();
const collection = db.collection('surego-orders');

function normalizeOrder(item = {}) {
  return {
    ...item,
    id: item.id || item._id,
    activityId: item.activityId || item.activity_id,
    userId: item.userId || item.user_id,
    createdAt: item.createdAt || item.created_at,
    updatedAt: item.updatedAt || item.updated_at,
    paidAt: item.paidAt || item.paid_at
  };
}

function normalizeList(result) {
  return (result.data || []).map(normalizeOrder);
}

function buildRecord(payload = {}) {
  const activityId = String(payload.activityId || payload.activity_id || '');
  const userId = payload.userId || payload.user_id || 'mock_user';
  const record = {
    ...payload,
    activityId,
    activity_id: activityId,
    userId,
    user_id: userId,
    amount: Number(payload.amount) || 0,
    status: payload.status || 'pending',
    updated_at: Date.now()
  };
  if (!record.id) delete record.id;
  delete record._id;
  if (!record.created_at) record.created_at = Date.now();
  return record;
}

async function findOrderByActivity(payload = {}) {
  const activityId = String(payload.activityId || payload.activity_id || '');
  const userId = payload.userId || payload.user_id || 'mock_user';
  const result = await collection.where({ activityId, userId }).limit(1).get();
  return (result.data || [])[0] || null;
}

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};

  if (action === 'create') {
    const order = buildRecord(payload);
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
    const found = await findOrderByActivity(payload);
    if (found) {
      const nextOrder = buildRecord({
        ...found,
        ...payload,
        id: found._id || found.id,
        created_at: found.created_at
      });
      await collection.doc(found._id || found.id).update(nextOrder);
      return {
        code: 0,
        data: normalizeOrder(nextOrder)
      };
    }

    const order = buildRecord(payload);
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
    const found = await findOrderByActivity(payload);
    return {
      code: 0,
      data: found ? normalizeOrder(found) : null
    };
  }

  if (action === 'updateStatus' || action === 'markPaid') {
    const status = action === 'markPaid' ? 'paid' : payload.status;
    const patch = {
      status,
      updated_at: Date.now()
    };
    if (status === 'paid') patch.paid_at = Date.now();
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
    const userId = payload.userId || payload.user_id || 'mock_user';
    const result = await collection.where({ userId }).orderBy('created_at', 'desc').limit(payload.limit || 20).get();
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
