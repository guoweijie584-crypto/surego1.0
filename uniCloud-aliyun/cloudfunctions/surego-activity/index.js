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

function normalizeRoles(roles) {
  if (!roles) return [];
  return Array.isArray(roles) ? roles.map(String) : [String(roles)];
}

function resolveUserContext(event = {}, payload = {}) {
  const uid = String(event.userId || event.uid || payload.uid || payload.userId || payload.user_id || '');
  const roles = normalizeRoles(event.roles || payload.roles || payload.role);
  return {
    uid,
    roles,
    isOps: roles.includes('admin') || roles.includes('operator')
  };
}

function authRequired() {
  return {
    code: 'AUTH_REQUIRED',
    message: 'Please login before operating SureGo data.'
  };
}

async function canEditActivity(id, user) {
  if (user.isOps) return true;
  const result = await collection.doc(id).get();
  const found = (result.data || [])[0];
  return Boolean(found && String(found.creator_id || found.creatorId || '') === user.uid);
}

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
  const user = resolveUserContext(event, payload);

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
    if (!user.uid || user.uid === 'mock_user') return authRequired();
    const activity = withoutEmptyId({
      ...payload,
      creatorId: user.uid,
      creator_id: user.uid,
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
    if (!user.uid || user.uid === 'mock_user') return authRequired();
    const id = payload.id;
    if (!(await canEditActivity(id, user))) {
      return { code: 'FORBIDDEN', message: 'Only the creator can edit this activity.' };
    }
    const updatePayload = withoutEmptyId({
      ...payload,
      creatorId: user.uid,
      creator_id: user.uid,
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
    if (!user.uid || user.uid === 'mock_user') return authRequired();
    if (!(await canEditActivity(payload.id, user))) {
      return { code: 'FORBIDDEN', message: 'Only the creator can update this activity.' };
    }
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
