'use strict';

const db = uniCloud.database();
const collection = db.collection('surego-messages');

function now() {
  return Date.now();
}

function normalizeMessage(record = {}) {
  return {
    id: record._id || record.id,
    userId: record.user_id || record.userId || 'mock_user',
    type: record.type || 'system',
    title: record.title || '',
    content: record.content || '',
    sender: record.sender || '',
    activityId: record.activity_id || record.activityId || '',
    read: Boolean(record.read),
    createdAt: record.created_at || record.createdAt || now()
  };
}

function normalizeList(result = {}) {
  return (result.data || []).map(normalizeMessage);
}

function buildRecord(payload = {}) {
  return {
    user_id: payload.userId || payload.user_id || 'mock_user',
    activity_id: payload.activityId || payload.activity_id || '',
    type: payload.type || 'system',
    title: payload.title || '',
    content: payload.content || '',
    sender: payload.sender || '',
    read: Boolean(payload.read),
    created_at: payload.createdAt || payload.created_at || now()
  };
}

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};

  if (action === 'create') {
    const record = buildRecord(payload);
    const result = await collection.add(record);
    return {
      code: 0,
      data: normalizeMessage({
        ...record,
        _id: result.id || result._id
      })
    };
  }

  if (action === 'list') {
    const userId = payload.userId || payload.user_id || 'mock_user';
    const result = await collection.where({ user_id: userId }).orderBy('created_at', 'desc').get();
    return {
      code: 0,
      data: normalizeList(result)
    };
  }

  if (action === 'markRead') {
    await collection.doc(payload.id).update({
      read: true,
      updated_at: now()
    });
    const result = await collection.doc(payload.id).get();
    return {
      code: 0,
      data: normalizeMessage((result.data || [])[0] || { _id: payload.id, read: true })
    };
  }

  if (action === 'markAllRead') {
    const userId = payload.userId || payload.user_id || 'mock_user';
    await collection.where({ user_id: userId }).update({
      read: true,
      updated_at: now()
    });
    const result = await collection.where({ user_id: userId }).orderBy('created_at', 'desc').get();
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
