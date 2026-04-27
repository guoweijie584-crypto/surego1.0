'use strict';

const db = uniCloud.database();
const collection = db.collection('surego-activities');

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};

  if (action === 'list') {
    return collection.orderBy('created_at', 'desc').limit(payload.limit || 20).get();
  }

  if (action === 'detail') {
    return collection.doc(payload.id).get();
  }

  if (action === 'create') {
    return collection.add({
      ...payload,
      status: payload.status || 'published',
      created_at: Date.now(),
      updated_at: Date.now()
    });
  }

  if (action === 'updateStatus') {
    return collection.doc(payload.id).update({
      status: payload.status,
      updated_at: Date.now()
    });
  }

  return {
    code: 'UNKNOWN_ACTION',
    message: `Unsupported action: ${action}`
  };
};
