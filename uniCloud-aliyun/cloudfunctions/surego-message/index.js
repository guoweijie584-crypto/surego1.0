'use strict';

const db = uniCloud.database();
const collection = db.collection('surego-messages');

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};

  if (action === 'create') {
    return collection.add({
      ...payload,
      read: false,
      created_at: Date.now()
    });
  }

  if (action === 'list') {
    return collection.where({ user_id: payload.user_id }).orderBy('created_at', 'desc').get();
  }

  if (action === 'markRead') {
    return collection.doc(payload.id).update({ read: true });
  }

  return {
    code: 'UNKNOWN_ACTION',
    message: `Unsupported action: ${action}`
  };
};
