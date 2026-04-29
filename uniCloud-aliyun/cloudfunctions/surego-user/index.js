'use strict';

const db = uniCloud.database();
const collection = db.collection('surego-users');

function now() {
  return Date.now();
}

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

function normalizeProfile(record = {}) {
  return {
    ...record,
    id: record._id || record.id,
    userId: record.user_id || record.userId || '',
    uid: record.user_id || record.userId || '',
    nickname: record.nickname || '',
    avatar: record.avatar || '',
    avatarFileId: record.avatar_file_id || record.avatarFileId || '',
    profileCompletedAt: record.profile_completed_at || record.profileCompletedAt || 0,
    mbti: record.mbti || '',
    bio: record.bio || '',
    quote: record.quote || '',
    credit: Number(record.credit) || 100,
    roles: normalizeRoles(record.roles || record.role),
    createdAt: record.created_at || record.createdAt,
    updatedAt: record.updated_at || record.updatedAt
  };
}

function buildProfile(payload = {}, user) {
  return {
    user_id: user.uid,
    nickname: payload.nickname || '',
    avatar: payload.avatar || '',
    avatar_file_id: payload.avatarFileId || payload.avatar_file_id || '',
    profile_completed_at: payload.profileCompletedAt || payload.profile_completed_at || 0,
    mbti: payload.mbti || '',
    bio: payload.bio || '',
    quote: payload.quote || '',
    credit: Number(payload.credit) || 100,
    roles: normalizeRoles(payload.roles || payload.role || user.roles),
    updated_at: now()
  };
}

async function findByUserId(userId) {
  const result = await collection.where({ user_id: String(userId || '') }).limit(1).get();
  return (result.data || [])[0] || null;
}

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};
  const user = resolveUserContext(event, payload);

  if (!user.uid || user.uid === 'mock_user') return authRequired();

  if (action === 'profile') {
    const found = await findByUserId(payload.userId || payload.user_id || user.uid);
    return {
      code: 0,
      data: found ? normalizeProfile(found) : normalizeProfile({ user_id: user.uid, roles: user.roles })
    };
  }

  if (action === 'updateProfile') {
    const found = await findByUserId(user.uid);
    const profile = buildProfile(payload, user);
    if (found) {
      await collection.doc(found._id).update(profile);
      return {
        code: 0,
        data: normalizeProfile({ ...found, ...profile })
      };
    }
    const record = {
      ...profile,
      created_at: now()
    };
    const result = await collection.add(record);
    return {
      code: 0,
      data: normalizeProfile({ ...record, _id: result.id || result._id })
    };
  }

  if (action === 'getProfiles') {
    const ids = Array.from(new Set((payload.userIds || payload.user_ids || []).map(String).filter(Boolean)));
    if (!ids.length) {
      return { code: 0, data: [] };
    }
    const result = await collection.where({ user_id: db.command.in(ids) }).limit(ids.length).get();
    return {
      code: 0,
      data: (result.data || []).map(normalizeProfile)
    };
  }

  return {
    code: 'UNKNOWN_ACTION',
    message: `Unsupported action: ${action}`
  };
};
