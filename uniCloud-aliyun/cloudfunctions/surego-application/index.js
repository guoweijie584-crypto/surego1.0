'use strict';

const db = uniCloud.database();
const collection = db.collection('surego-applications');

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};

  if (action === 'submit') {
    return collection.add({
      ...payload,
      status: payload.status || 'pending',
      created_at: Date.now()
    });
  }

  if (action === 'listByActivity') {
    return collection.where({ activity_id: payload.activity_id }).orderBy('created_at', 'desc').get();
  }

  if (action === 'review') {
    return collection.doc(payload.id).update({
      status: payload.status,
      reviewed_at: Date.now()
    });
  }

  return {
    code: 'UNKNOWN_ACTION',
    message: `Unsupported action: ${action}`
  };
};
