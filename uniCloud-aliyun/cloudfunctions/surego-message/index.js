'use strict';

const db = uniCloud.database();
const collection = db.collection('surego-messages');
const uniIdUsers = db.collection('uni-id-users');

function now() {
  return Date.now();
}

function normalizeRoles(roles) {
  if (!roles) return [];
  return Array.isArray(roles) ? roles.map(String) : [String(roles)];
}

async function findUniIdUser(userId) {
  if (!userId || userId === 'mock_user') return null;
  try {
    const result = await uniIdUsers.doc(String(userId)).get();
    return (result.data || [])[0] || null;
  } catch (error) {
    return null;
  }
}

function isTokenOwnedByUser(userRecord = {}, uniIdToken = '') {
  const token = String(uniIdToken || '');
  if (!userRecord || !token) return false;
  const tokens = Array.isArray(userRecord.token) ? userRecord.token : [userRecord.token];
  return tokens.some((item) => {
    if (!item) return false;
    return String(typeof item === 'string' ? item : item.token || item.value || '') === token;
  });
}

async function resolveUserContext(event = {}, payload = {}) {
  const uid = String(event.userId || event.uid || payload.uid || payload.userId || payload.user_id || '');
  const userRecord = await findUniIdUser(uid);
  const tokenValid = isTokenOwnedByUser(userRecord, event.uniIdToken);
  const roles = tokenValid ? normalizeRoles(userRecord?.role) : [];
  return {
    uid,
    roles,
    exists: Boolean(userRecord && tokenValid),
    isOps: roles.includes('admin') || roles.includes('operator')
  };
}

function authRequired() {
  return {
    code: 'AUTH_REQUIRED',
    message: 'Please login before operating SureGo data.'
  };
}

function normalizeMessage(record = {}) {
  return {
    id: record._id || record.id,
    userId: record.user_id || record.userId || '',
    eventKey: record.event_key || record.eventKey || '',
    type: record.type || 'system',
    title: record.title || '',
    content: record.content || '',
    sender: record.sender || '',
    activityId: record.activity_id || record.activityId || '',
    partnerPostId: record.partner_post_id || record.partnerPostId || '',
    conversationId: record.conversation_id || record.conversationId || '',
    read: Boolean(record.read),
    createdAt: record.created_at || record.createdAt || now(),
    updatedAt: record.updated_at || record.updatedAt || ''
  };
}

function normalizeList(result = {}) {
  return (result.data || []).map(normalizeMessage);
}

function buildRecord(payload = {}) {
  return {
    user_id: payload.userId || payload.user_id,
    activity_id: payload.activityId || payload.activity_id || '',
    event_key: payload.eventKey || payload.event_key || '',
    type: payload.type || 'system',
    title: payload.title || '',
    content: payload.content || '',
    sender: payload.sender || '',
    read: Boolean(payload.read),
    created_at: payload.createdAt || payload.created_at || now(),
    updated_at: payload.updatedAt || payload.updated_at || '',
    partner_post_id: payload.partnerPostId || payload.partner_post_id || '',
    conversation_id: payload.conversationId || payload.conversation_id || ''
  };
}

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};
  const user = await resolveUserContext(event, payload);

  if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();

  if (action === 'create') {
    const record = buildRecord(payload);
    if (record.event_key) {
      const existing = await collection
        .where({
          user_id: record.user_id,
          event_key: record.event_key
        })
        .limit(1)
        .get();
      const found = (existing.data || [])[0];
      if (found) {
        return {
          code: 0,
          data: normalizeMessage(found)
        };
      }
    }
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
    const userId = user.uid;
    const result = await collection.where({ user_id: userId }).orderBy('created_at', 'desc').get();
    return {
      code: 0,
      data: normalizeList(result)
    };
  }

  if (action === 'markRead') {
    const existing = await collection.doc(payload.id).get();
    const found = (existing.data || [])[0];
    if (found && String(found.user_id || found.userId || '') !== user.uid) {
      return { code: 'FORBIDDEN', message: 'You cannot update this message.' };
    }
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
    const userId = user.uid;
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
