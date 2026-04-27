'use strict';

const db = uniCloud.database();
const collection = db.collection('surego-activities');

function normalizeActivity(item = {}) {
  return {
    ...item,
    id: item.id || item._id,
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
      status: payload.status || 'hosting',
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
      status: payload.status,
      updated_at: Date.now()
    });
    return {
      code: 0,
      data: {
        id: payload.id,
        status: payload.status
      }
    };
  }

  return {
    code: 'UNKNOWN_ACTION',
    message: `Unsupported action: ${action}`
  };
};
