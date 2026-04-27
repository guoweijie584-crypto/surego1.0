'use strict';

const db = uniCloud.database();
const collection = db.collection('surego-activities');

const lifecycleStatuses = ['draft', 'reviewing', 'published', 'recruiting', 'formed', 'ongoing', 'finished', 'cancelled'];
const legacyStatusMap = {
  hosting: 'recruiting',
  not_applied: 'recruiting',
  pending: 'recruiting',
  approved: 'recruiting',
  rejected: 'recruiting'
};

function normalizeStatus(status = 'recruiting') {
  const mapped = legacyStatusMap[status] || status;
  return lifecycleStatuses.includes(mapped) ? mapped : 'recruiting';
}

function normalizeActivity(item = {}) {
  return {
    ...item,
    id: item.id || item._id,
    status: normalizeStatus(item.status),
    moderationStatus: item.moderation_status || item.moderationStatus || 'visible',
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
  return next;
}

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};

  if (action === 'list') {
    const result = await collection.orderBy('created_at', 'desc').limit(payload.limit || 20).get();
    return {
      code: 0,
      data: normalizeList(result)
    };
  }

  if (action === 'detail') {
    const result = await collection.doc(payload.id).get();
    return {
      code: 0,
      data: normalizeActivity((result.data || [])[0])
    };
  }

  if (action === 'create') {
    const activity = withoutEmptyId({
      ...payload,
      status: normalizeStatus(payload.status),
      created_at: Date.now(),
      updated_at: Date.now()
    });
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
    const id = payload.id;
    const updatePayload = withoutEmptyId({
      ...payload,
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
