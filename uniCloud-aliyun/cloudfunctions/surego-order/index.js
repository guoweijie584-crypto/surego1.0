'use strict';

const db = uniCloud.database();
const collection = db.collection('surego-orders');
const activityCollection = db.collection('surego-activities');
const applicationCollection = db.collection('surego-applications');
const {
  authRequired,
  cleanId,
  cleanString,
  forbidden,
  invalid,
  now,
  ok,
  requireAuth,
  unknownAction
} = require('surego-security');

const ORDER_STATUSES = ['pending', 'paid', 'refund_requested', 'refunded', 'closed'];
const PAYABLE_ACTIVITY_TYPES = ['sincerity', 'ticket'];

async function getActivity(activityId) {
  const result = await activityCollection.doc(String(activityId || '')).get();
  return (result.data || [])[0] || null;
}

async function canManageActivity(activityId, user) {
  if (user.isOps) return true;
  const activity = await getActivity(activityId);
  return Boolean(activity && String(activity.creator_id || activity.creatorId || '') === user.uid);
}

async function canEditOrder(id, user) {
  const result = await collection.doc(id).get();
  const found = (result.data || [])[0];
  return Boolean(found && String(found.user_id || found.userId || '') === user.uid);
}

async function getOrder(id) {
  const result = await collection.doc(cleanId(id)).get();
  return (result.data || [])[0] || null;
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
  const seen = new Set();
  return (result.data || [])
    .filter((item) => {
      const key = String(item._id || item.id || `${item.activity_id || item.activityId}:${item.user_id || item.userId}`);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(normalizeOrder);
}

function buildRecord(payload = {}) {
  const activityId = cleanId(payload.activityId || payload.activity_id);
  const userId = cleanId(payload.userId || payload.user_id);
  const record = {
    activityId,
    activity_id: activityId,
    userId,
    user_id: userId,
    type: cleanString(payload.type, { max: 20 }),
    amount: Number(payload.amount) || 0,
    status: normalizeStatus(payload.status || 'pending'),
    activity_title: cleanString(payload.activityTitle || payload.activity_title || payload.title, { max: 80 }),
    activity_cover: cleanString(payload.activityCover || payload.activity_cover || payload.image, { max: 500 }),
    refund_note: cleanString(payload.refundNote || payload.refund_note, { max: 200 }),
    close_reason: cleanString(payload.closeReason || payload.close_reason, { max: 200 }),
    updated_at: now()
  };
  if (payload.id) record.id = payload.id;
  if (payload.created_at || payload.createdAt) {
    record.created_at = payload.created_at || payload.createdAt;
  } else {
    record.created_at = now();
  }
  return record;
}

async function findOrderByActivity(payload = {}) {
  const activityId = cleanId(payload.activityId || payload.activity_id);
  const userId = cleanId(payload.userId || payload.user_id);
  let result = await collection.where({ activity_id: activityId, user_id: userId }).limit(1).get();
  if (!(result.data || []).length) {
    result = await collection.where({ activityId, userId }).limit(1).get();
  }
  return (result.data || [])[0] || null;
}

async function getApprovedApplication(activityId, userId) {
  let result = await applicationCollection.where({ activity_id: activityId, user_id: userId, status: 'approved' }).limit(1).get();
  if (!(result.data || []).length) {
    result = await applicationCollection.where({ activityId, userId, status: 'approved' }).limit(1).get();
  }
  return (result.data || [])[0] || null;
}

async function buildOrderForActivity(activityId, user) {
  const activity = await getActivity(activityId);
  if (!activity) return { error: { code: 'NOT_FOUND', message: 'Activity not found.' } };
  if (String(activity.creator_id || activity.creatorId || '') === user.uid) {
    return { error: forbidden('Creator does not need an order for own activity.') };
  }
  const type = String(activity.party_mode || activity.partyMode || '');
  if (!PAYABLE_ACTIVITY_TYPES.includes(type)) {
    return { error: invalid('This activity does not require an order.') };
  }
  const application = await getApprovedApplication(activityId, user.uid);
  if (!application) {
    return { error: forbidden('Approved application is required before creating an order.') };
  }
  return {
    order: buildRecord({
      activityId,
      userId: user.uid,
      user_id: user.uid,
      type,
      amount: Number(activity.amount) || 0,
      status: 'pending',
      activityTitle: activity.title || '',
      activityCover: activity.cover || activity.image || ''
    })
  };
}

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};
  const user = await requireAuth(event);

  if (!user) return authRequired();

  if (action === 'create' || action === 'ensureForActivity') {
    const activityId = cleanId(payload.activityId || payload.activity_id);
    const found = await findOrderByActivity({ activityId, userId: user.uid, user_id: user.uid });
    if (found) return ok(normalizeOrder(found));

    const built = await buildOrderForActivity(activityId, user);
    if (built.error) return built.error;
    const result = await collection.add(built.order);
    return ok(normalizeOrder({ ...built.order, id: result.id }));
  }

  if (action === 'getForActivity') {
    const found = await findOrderByActivity({ ...payload, userId: user.uid, user_id: user.uid });
    return ok(found ? normalizeOrder(found) : null);
  }

  if (action === 'getDetail') {
    const result = await collection.doc(cleanId(payload.id)).get();
    const found = (result.data || [])[0] || null;
    if (found && String(found.user_id || found.userId || '') !== user.uid && !(await canManageActivity(found.activity_id || found.activityId, user))) {
      return forbidden('You cannot read this order.');
    }
    return ok(found ? normalizeOrder(found) : null);
  }

  if (action === 'updateStatus' || action === 'markPaid') {
    const id = cleanId(payload.id);
    const requestedStatus = action === 'markPaid' ? 'paid' : normalizeStatus(payload.status);
    if (!user.isOps || payload.trusted !== true) {
      return forbidden('Order status can only be updated by a trusted payment callback or operator.');
    }
    if (!(await canEditOrder(id, user)) && !user.isOps) {
      return forbidden('You cannot update this order.');
    }
    const patch = {
      status: requestedStatus,
      updated_at: now()
    };
    if (requestedStatus === 'paid') patch.paid_at = now();
    if (requestedStatus === 'refunded') {
      patch.refunded_at = now();
      patch.refund_note = cleanString(payload.refundNote || payload.refund_note, { max: 200 });
    }
    if (requestedStatus === 'closed') {
      patch.closed_at = now();
      patch.close_reason = cleanString(payload.closeReason || payload.close_reason, { max: 200 });
    }
    await collection.doc(id).update(patch);
    return ok(normalizeOrder({ id, ...patch }));
  }

  if (action === 'refund') {
    const id = cleanId(payload.id);
    const order = await getOrder(id);
    if (!order || String(order.user_id || order.userId || '') !== user.uid) {
      return forbidden('You cannot request refund for this order.');
    }
    if (normalizeStatus(order.status) !== 'paid') {
      return forbidden('Only paid orders can request a refund.');
    }
    const patch = {
      status: 'refund_requested',
      refund_note: cleanString(payload.refundNote || payload.refund_note || 'Refund requested.', { max: 200 }),
      updated_at: now()
    };
    await collection.doc(id).update(patch);
    return ok(normalizeOrder({ id, ...patch }));
  }

  if (action === 'close') {
    const id = cleanId(payload.id);
    const order = await getOrder(id);
    if (!order || String(order.user_id || order.userId || '') !== user.uid) {
      return forbidden('You cannot close this order.');
    }
    if (normalizeStatus(order.status) !== 'pending') {
      return forbidden('Only pending orders can be closed by the user.');
    }
    const closedAt = now();
    const patch = {
      status: 'closed',
      close_reason: cleanString(payload.closeReason || payload.close_reason || 'Order closed.', { max: 200 }),
      closed_at: closedAt,
      updated_at: closedAt
    };
    await collection.doc(id).update(patch);
    return ok(normalizeOrder({ id, ...patch }));
  }

  if (action === 'list') {
    const [snakeResult, camelResult] = await Promise.all([
      collection.where({ user_id: user.uid }).orderBy('created_at', 'desc').limit(payload.limit || 20).get(),
      collection.where({ userId: user.uid }).orderBy('created_at', 'desc').limit(payload.limit || 20).get()
    ]);
    return ok(normalizeList({ data: [...(snakeResult.data || []), ...(camelResult.data || [])] }));
  }

  if (action === 'listByActivity') {
    const activityId = cleanId(payload.activityId || payload.activity_id);
    if (!(await canManageActivity(activityId, user))) {
      return forbidden('Only the activity creator can list activity orders.');
    }
    const [snakeResult, camelResult] = await Promise.all([
      collection.where({ activity_id: activityId }).orderBy('created_at', 'desc').limit(payload.limit || 100).get(),
      collection.where({ activityId }).orderBy('created_at', 'desc').limit(payload.limit || 100).get()
    ]);
    return ok(normalizeList({ data: [...(snakeResult.data || []), ...(camelResult.data || [])] }));
  }

  return unknownAction();
};
