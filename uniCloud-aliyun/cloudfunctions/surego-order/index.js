'use strict';

const db = uniCloud.database();
const collection = db.collection('surego-orders');

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};

  if (action === 'create') {
    return collection.add({
      ...payload,
      status: payload.status || 'pending',
      created_at: Date.now()
    });
  }

  if (action === 'markPaid') {
    return collection.doc(payload.id).update({
      status: 'paid',
      paid_at: Date.now()
    });
  }

  if (action === 'list') {
    return collection.orderBy('created_at', 'desc').limit(payload.limit || 20).get();
  }

  return {
    code: 'UNKNOWN_ACTION',
    message: `Unsupported action: ${action}`
  };
};
