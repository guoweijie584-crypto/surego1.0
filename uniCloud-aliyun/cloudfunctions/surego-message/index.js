'use strict';

const crypto = require('crypto');
const db = uniCloud.database();
const collection = db.collection('surego-messages');
const activityCollection = db.collection('surego-activities');
const applicationCollection = db.collection('surego-applications');
const orderCollection = db.collection('surego-orders');
const checkinCollection = db.collection('surego-checkins');
const {
  authRequired,
  cleanBool,
  cleanId,
  cleanString,
  forbidden,
  now,
  ok,
  requireAuth,
  unknownAction,
  withSafeHandler
} = require('surego-security');

const ALLOWED_TYPES = ['system', 'activity', 'application', 'order', 'checkin', 'report'];

function buildMessageId(userId, eventKey) {
  if (!eventKey) return '';
  const digest = crypto.createHash('sha1').update(`${userId}:${eventKey}`).digest('hex');
  return `msg_${digest}`;
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
    read: Boolean(record.read),
    createdAt: record.created_at || record.createdAt || now(),
    updatedAt: record.updated_at || record.updatedAt || ''
  };
}

function normalizeList(result = {}) {
  return (result.data || []).map(normalizeMessage);
}

function buildRecord(payload = {}) {
  const type = ALLOWED_TYPES.includes(payload.type) ? payload.type : 'system';
  const userId = cleanId(payload.userId || payload.user_id);
  const eventKey = cleanString(payload.eventKey || payload.event_key, { max: 160 });
  const record = {
    _id: payload._id || payload.id || buildMessageId(userId, eventKey),
    user_id: userId,
    activity_id: cleanId(payload.activityId || payload.activity_id),
    event_key: eventKey,
    type,
    title: cleanString(payload.title, { max: 40 }),
    content: cleanString(payload.content, { max: 300 }),
    sender: cleanString(payload.sender, { max: 40 }),
    read: cleanBool(payload.read, false),
    created_at: payload.createdAt || payload.created_at || now(),
    updated_at: payload.updatedAt || payload.updated_at || ''
  };
  if (!record._id) delete record._id;
  return record;
}

async function canCreateMessage(record, user) {
  if (!record.user_id || !record.title || !record.content) return false;
  if (user.isOps) return true;
  if (!record.event_key) return false;

  const activityId = record.activity_id;
  if (activityId) {
    const activityResult = await activityCollection.doc(activityId).get();
    const activity = (activityResult.data || [])[0];
    if (activity && String(activity.creator_id || activity.creatorId || '') === user.uid) {
      return true;
    }
    if (
      activity &&
      record.event_key.startsWith('application:submitted:') &&
      String(activity.creator_id || activity.creatorId || '') === record.user_id
    ) {
      const applicationResult = await applicationCollection.where({
        activity_id: activityId,
        user_id: user.uid
      }).limit(1).get();
      if ((applicationResult.data || []).length) return true;
    }
  }

  if (record.user_id === user.uid && record.event_key.startsWith('order:')) {
    const orderResult = await orderCollection.where({ user_id: user.uid }).limit(1).get();
    if ((orderResult.data || []).length) return true;
  }
  if (record.user_id === user.uid && record.event_key.startsWith('checkin:')) {
    const checkinResult = await checkinCollection.where({ user_id: user.uid }).limit(1).get();
    if ((checkinResult.data || []).length) return true;
  }
  if (record.event_key.startsWith('application:')) {
    const applicationResult = await applicationCollection.where({
      activity_id: activityId,
      user_id: record.user_id
    }).limit(1).get();
    if ((applicationResult.data || []).length) return true;
  }
  return false;
}

async function main(event) {
  const action = event.action;
  const payload = event.payload || {};
  const user = await requireAuth(event);

  if (!user) return authRequired();

  if (action === 'create') {
    const record = buildRecord(payload);
    if (!(await canCreateMessage(record, user))) {
      return forbidden('This message cannot be created by the current user.');
    }
    if (record.event_key) {
      const existing = await collection
        .where({ user_id: record.user_id, event_key: record.event_key })
        .limit(1)
        .get();
      const found = (existing.data || [])[0];
      if (found) return ok(normalizeMessage(found));
    }
    let result;
    try {
      result = await collection.add(record);
    } catch (error) {
      if (record.event_key) {
        const existing = await collection
          .where({ user_id: record.user_id, event_key: record.event_key })
          .limit(1)
          .get();
        const found = (existing.data || [])[0];
        if (found) return ok(normalizeMessage(found));
      }
      throw error;
    }
    return ok(normalizeMessage({ ...record, _id: result.id || result._id || record._id }));
  }

  if (action === 'list') {
    const result = await collection.where({ user_id: user.uid }).orderBy('created_at', 'desc').get();
    return ok(normalizeList(result));
  }

  if (action === 'markRead') {
    const id = cleanId(payload.id);
    const existing = await collection.doc(id).get();
    const found = (existing.data || [])[0];
    if (found && String(found.user_id || found.userId || '') !== user.uid) {
      return forbidden('You cannot update this message.');
    }
    await collection.doc(id).update({ read: true, updated_at: now() });
    const result = await collection.doc(id).get();
    return ok(normalizeMessage((result.data || [])[0] || { _id: id, read: true }));
  }

  if (action === 'markAllRead') {
    await collection.where({ user_id: user.uid }).update({ read: true, updated_at: now() });
    const result = await collection.where({ user_id: user.uid }).orderBy('created_at', 'desc').get();
    return ok(normalizeList(result));
  }

  return unknownAction();
}

exports.main = (event) => withSafeHandler(event, () => main(event));
