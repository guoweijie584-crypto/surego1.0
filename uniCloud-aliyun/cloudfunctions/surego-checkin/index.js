'use strict';

const db = uniCloud.database();
const collection = db.collection('surego-checkins');

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};

  if (action === 'createCode') {
    return {
      code: `SG${String(Date.now()).slice(-6)}`,
      expiresIn: 300
    };
  }

  if (action === 'confirm') {
    return collection.add({
      ...payload,
      status: 'checked',
      checked_at: Date.now(),
      created_at: Date.now()
    });
  }

  if (action === 'listByActivity') {
    return collection.where({ activity_id: payload.activity_id }).orderBy('checked_at', 'desc').get();
  }

  return {
    code: 'UNKNOWN_ACTION',
    message: `Unsupported action: ${action}`
  };
};
