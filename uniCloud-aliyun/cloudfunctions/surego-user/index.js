'use strict';

const db = uniCloud.database();
const profileCollection = db.collection('surego-users');
const uniIdUsers = db.collection('uni-id-users');

const ROLE_VALUES = ['user', 'operator', 'admin'];
const DEFAULT_ROLE = 'user';

function now() {
  return Date.now();
}

function normalizeRoles(roles) {
  const values = Array.isArray(roles) ? roles : [roles];
  const next = values
    .map((role) => String(role || '').trim().toLowerCase())
    .filter((role) => ROLE_VALUES.includes(role));
  return next.length ? Array.from(new Set(next)) : [DEFAULT_ROLE];
}

function hasAdminRole(roles) {
  return normalizeRoles(roles).includes('admin');
}

function hasOpsRole(roles) {
  const values = normalizeRoles(roles);
  return values.includes('admin') || values.includes('operator');
}

function authRequired() {
  return {
    code: 'AUTH_REQUIRED',
    message: 'Please login before operating SureGo data.'
  };
}

function permissionDenied() {
  return {
    code: 'PERMISSION_DENIED',
    message: 'Only administrators can update SureGo user roles.'
  };
}

function lastAdminRequired() {
  return {
    code: 'LAST_ADMIN_REQUIRED',
    message: 'At least one SureGo administrator must remain.'
  };
}

function normalizeProfile(record = {}) {
  const roles = normalizeRoles(record.roles || record.role);
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
    roles,
    role: roles,
    roleUpdatedAt: record.role_updated_at || record.roleUpdatedAt || 0,
    roleUpdatedBy: record.role_updated_by || record.roleUpdatedBy || '',
    createdAt: record.created_at || record.createdAt,
    updatedAt: record.updated_at || record.updatedAt
  };
}

function normalizeUser(record = {}, profile = {}) {
  const roles = normalizeRoles(record.role || profile.roles || profile.role);
  return {
    id: record._id || profile._id || '',
    uid: record._id || profile.user_id || '',
    userId: record._id || profile.user_id || '',
    nickname: profile.nickname || record.nickname || record.username || '',
    avatar: profile.avatar || record.avatar || '',
    roles,
    role: roles,
    lastLoginDate: record.last_login_date || record.lastLoginDate || 0,
    registerDate: record.register_date || record.registerDate || 0,
    roleUpdatedAt: profile.role_updated_at || profile.roleUpdatedAt || 0,
    roleUpdatedBy: profile.role_updated_by || profile.roleUpdatedBy || ''
  };
}

async function findByUserId(userId) {
  const result = await profileCollection.where({ user_id: String(userId || '') }).limit(1).get();
  return (result.data || [])[0] || null;
}

async function findUniIdUser(userId) {
  if (!userId) return null;
  try {
    const result = await uniIdUsers.doc(String(userId)).get();
    return (result.data || [])[0] || null;
  } catch (error) {
    return null;
  }
}

async function ensureDefaultRole(userId) {
  const user = await findUniIdUser(userId);
  if (!user) return [DEFAULT_ROLE];
  const roles = normalizeRoles(user.role);
  if (!Array.isArray(user.role) || !user.role.length) {
    await uniIdUsers.doc(String(userId)).update({ role: roles });
  }
  return roles;
}

async function resolveUserContext(event = {}, payload = {}) {
  const uid = String(event.userId || event.uid || payload.uid || payload.userId || payload.user_id || '');
  if (!uid || uid === 'mock_user') {
    return { uid, roles: [], isAdmin: false, isOps: false };
  }
  const roles = await ensureDefaultRole(uid);
  return {
    uid,
    roles,
    isAdmin: hasAdminRole(roles),
    isOps: hasOpsRole(roles)
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
    roles: normalizeRoles(user.roles),
    updated_at: now()
  };
}

async function countAdminUsers() {
  const result = await uniIdUsers.where({ role: db.command.in(['admin']) }).count();
  return Number(result.total || 0);
}

async function syncProfileRoles(userId, roles, operatorId) {
  const found = await findByUserId(userId);
  const payload = {
    roles,
    role_updated_at: now(),
    role_updated_by: operatorId,
    updated_at: now()
  };
  if (found) {
    await profileCollection.doc(found._id).update(payload);
    return normalizeProfile({ ...found, ...payload });
  }
  const record = {
    user_id: userId,
    nickname: '',
    avatar: '',
    credit: 100,
    ...payload,
    created_at: now()
  };
  const result = await profileCollection.add(record);
  return normalizeProfile({ ...record, _id: result.id || result._id });
}

async function listUsers() {
  const userResult = await uniIdUsers.limit(100).get();
  const users = userResult.data || [];
  const ids = users.map((item) => String(item._id || '')).filter(Boolean);
  const profileResult = ids.length
    ? await profileCollection.where({ user_id: db.command.in(ids) }).limit(ids.length).get()
    : { data: [] };
  const profileMap = {};
  for (const item of profileResult.data || []) {
    profileMap[String(item.user_id)] = item;
  }
  return users.map((item) => normalizeUser(item, profileMap[String(item._id)] || {}));
}

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};
  const user = await resolveUserContext(event, payload);

  if (!user.uid || user.uid === 'mock_user') return authRequired();

  if (action === 'profile') {
    const found = await findByUserId(payload.userId || payload.user_id || user.uid);
    return {
      code: 0,
      data: found
        ? normalizeProfile({ ...found, roles: user.roles })
        : normalizeProfile({ user_id: user.uid, roles: user.roles })
    };
  }

  if (action === 'updateProfile') {
    const found = await findByUserId(user.uid);
    const profile = buildProfile(payload, user);
    if (found) {
      await profileCollection.doc(found._id).update(profile);
      return {
        code: 0,
        data: normalizeProfile({ ...found, ...profile })
      };
    }
    const record = {
      ...profile,
      created_at: now()
    };
    const result = await profileCollection.add(record);
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
    const result = await profileCollection.where({ user_id: db.command.in(ids) }).limit(ids.length).get();
    return {
      code: 0,
      data: (result.data || []).map(normalizeProfile)
    };
  }

  if (action === 'listUsers') {
    if (!user.isAdmin) return permissionDenied();
    return {
      code: 0,
      data: await listUsers()
    };
  }

  if (action === 'updateUserRoles') {
    if (!user.isAdmin) return permissionDenied();
    const targetUserId = String(payload.targetUserId || payload.userId || payload.user_id || '');
    const roles = normalizeRoles(payload.roles || payload.role);
    if (!targetUserId) return authRequired();
    const currentTarget = await findUniIdUser(targetUserId);
    const previousRoles = normalizeRoles(currentTarget?.role);
    if (targetUserId === user.uid && previousRoles.includes('admin') && !roles.includes('admin')) {
      const adminCount = await countAdminUsers();
      if (adminCount <= 1) return lastAdminRequired();
    }
    await uniIdUsers.doc(targetUserId).update({ role: roles });
    const profile = await syncProfileRoles(targetUserId, roles, user.uid);
    return {
      code: 0,
      data: normalizeUser({ ...(currentTarget || {}), _id: targetUserId, role: roles }, profile)
    };
  }

  return {
    code: 'UNKNOWN_ACTION',
    message: `Unsupported action: ${action}`
  };
};
