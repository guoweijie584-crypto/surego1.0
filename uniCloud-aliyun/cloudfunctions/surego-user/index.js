'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const profileCollection = db.collection('surego-users');
const uniIdUsers = db.collection('uni-id-users');
const activityCollection = db.collection('surego-activities');
const applicationCollection = db.collection('surego-applications');
const {
  authRequired: sharedAuthRequired,
  cleanArray,
  cleanId,
  cleanString,
  forbidden,
  invalid,
  ok,
  requireAuth,
  unknownAction,
  withSafeHandler
} = require('surego-security');

const ROLE_VALUES = ['user', 'operator', 'admin'];
const DEFAULT_ROLE = 'user';
const lifecycleStatuses = ['draft', 'reviewing', 'published', 'recruiting', 'formed', 'ongoing', 'finished', 'cancelled'];
const publicLifecycleStatuses = ['published', 'recruiting', 'formed', 'ongoing'];
const publicModerationStatuses = ['approved', 'visible'];
const moderationStatuses = ['pending', 'approved', 'rejected', 'hidden', 'visible'];
const legacyStatusMap = {
  hosting: 'recruiting',
  not_applied: 'recruiting',
  pending: 'recruiting',
  approved: 'recruiting',
  rejected: 'recruiting'
};

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
  return sharedAuthRequired();
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

function normalizeStatus(status = 'recruiting') {
  const mapped = legacyStatusMap[status] || status;
  return lifecycleStatuses.includes(mapped) ? mapped : 'recruiting';
}

function normalizeModerationStatus(status = 'pending') {
  const nextStatus = status || 'pending';
  return moderationStatuses.includes(nextStatus) ? nextStatus : 'pending';
}

function isPubliclyVisibleActivity(item = {}) {
  const rawStatus = String(item.status || item.lifecycleStatus || '');
  const status = normalizeStatus(item.status || item.lifecycleStatus);
  const moderationStatus = normalizeModerationStatus(item.moderation_status || item.moderationStatus);
  if (rawStatus === 'rejected' || rawStatus === 'hidden') return false;
  return publicLifecycleStatuses.includes(status) && publicModerationStatuses.includes(moderationStatus);
}

function pickActivityId(activity = {}) {
  return String(activity._id || activity.id || '');
}

function pickActivityCreatorId(activity = {}) {
  return String(activity.creator_id || activity.creatorId || '');
}

function normalizePublicActivity(activity = {}, relation = 'joined') {
  return {
    id: pickActivityId(activity),
    title: activity.title || 'SureGo 活动',
    image: activity.image || activity.cover || '',
    date: activity.date || '',
    time: activity.time || '',
    location: activity.location || activity.address || '',
    city: activity.city || '',
    relation
  };
}

function normalizePublicProfile(record = {}, activitySummary = {}) {
  const profile = normalizeProfile(record);
  return {
    nickname: profile.nickname,
    avatar: profile.avatar,
    profileCompletedAt: profile.profileCompletedAt,
    mbti: profile.mbti,
    bio: profile.bio,
    quote: profile.quote,
    credit: profile.credit,
    activityCount: Number(activitySummary.activityCount || 0),
    hostedCount: Number(activitySummary.hostedCount || 0),
    joinedCount: Number(activitySummary.joinedCount || 0),
    recentActivities: activitySummary.recentActivities || []
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

function dedupeActivitiesById(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const id = pickActivityId(item);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function getActivitySortTime(activity = {}) {
  return Number(activity.updated_at || activity.created_at || activity.dateValue || 0) || 0;
}

async function listApprovedApplicationsForUser(userId) {
  const [snakeResult, camelResult] = await Promise.all([
    applicationCollection.where({ user_id: userId, status: 'approved' }).limit(100).get(),
    applicationCollection.where({ userId: userId, status: 'approved' }).limit(100).get()
  ]);
  const seen = new Set();
  return [...(snakeResult.data || []), ...(camelResult.data || [])].filter((item) => {
    const key = String(item._id || item.id || `${item.activity_id || item.activityId}:${item.user_id || item.userId}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function listPublicActivitiesForUser(userId) {
  const [hostedSnakeResult, hostedCamelResult, approvedApplications] = await Promise.all([
    activityCollection.where({ creator_id: userId }).limit(100).get(),
    activityCollection.where({ creatorId: userId }).limit(100).get(),
    listApprovedApplicationsForUser(userId)
  ]);

  const hosted = dedupeActivitiesById([
    ...(hostedSnakeResult.data || []),
    ...(hostedCamelResult.data || [])
  ])
    .filter(isPubliclyVisibleActivity)
    .map((activity) => ({ ...activity, publicRelation: 'hosted' }));

  const joinedActivityIds = Array.from(new Set(approvedApplications.map((item) => String(item.activity_id || item.activityId || '')).filter(Boolean)));
  const joinedResult = joinedActivityIds.length
    ? await activityCollection.where({ _id: dbCmd.in(joinedActivityIds) }).limit(joinedActivityIds.length).get()
    : { data: [] };
  const joined = dedupeActivitiesById(joinedResult.data || [])
    .filter(isPubliclyVisibleActivity)
    .filter((activity) => pickActivityCreatorId(activity) !== userId)
    .map((activity) => ({ ...activity, publicRelation: 'joined' }));

  const publicActivities = dedupeActivitiesById([...hosted, ...joined])
    .sort((a, b) => getActivitySortTime(b) - getActivitySortTime(a));

  return {
    activityCount: publicActivities.length,
    hostedCount: hosted.length,
    joinedCount: joined.length,
    recentActivities: publicActivities.slice(0, 3).map((activity) => normalizePublicActivity(activity, activity.publicRelation || 'joined'))
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
  if (!user) return null;
  const roles = normalizeRoles(user.role);
  if (!Array.isArray(user.role) || !user.role.length) {
    await uniIdUsers.doc(String(userId)).update({ role: roles });
  }
  return roles;
}

async function resolveUserContext(event = {}, payload = {}) {
  const checked = await requireAuth(event);
  if (!checked) return { uid: '', roles: [], exists: false, isAdmin: false, isOps: false };
  const roles = await ensureDefaultRole(checked.uid);
  if (!roles) {
    return { uid: checked.uid, roles: [], exists: false, isAdmin: false, isOps: false };
  }
  return {
    uid: checked.uid,
    roles,
    exists: true,
    isAdmin: hasAdminRole(roles),
    isOps: hasOpsRole(roles)
  };
}

function buildProfile(payload = {}, user) {
  return {
    user_id: user.uid,
    nickname: cleanString(payload.nickname, { max: 40 }),
    avatar: cleanString(payload.avatar, { max: 500 }),
    avatar_file_id: cleanString(payload.avatarFileId || payload.avatar_file_id, { max: 500 }),
    profile_completed_at: payload.profileCompletedAt || payload.profile_completed_at || 0,
    mbti: cleanString(payload.mbti, { max: 8 }),
    bio: cleanString(payload.bio, { max: 160 }),
    quote: cleanString(payload.quote, { max: 120 }),
    credit: Number(payload.credit) || 100,
    roles: normalizeRoles(user.roles),
    updated_at: now()
  };
}

async function countAdminUsers() {
  const [arrayResult, stringResult] = await Promise.all([
    uniIdUsers.where({ role: db.command.in(['admin']) }).count(),
    uniIdUsers.where({ role: 'admin' }).count()
  ]);
  return Math.max(Number(arrayResult.total || 0), Number(stringResult.total || 0));
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

async function main(event) {
  const action = event.action;
  const payload = event.payload || {};
  const user = await resolveUserContext(event, payload);

  if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();

  if (action === 'profile') {
    const requestedUserId = cleanId(payload.userId || payload.user_id || user.uid);
    if (requestedUserId && requestedUserId !== user.uid && !user.isOps) {
      return forbidden('You cannot read another user profile.');
    }
    const found = await findByUserId(user.uid);
    return ok(found
        ? normalizeProfile({ ...found, roles: user.roles })
        : normalizeProfile({ user_id: user.uid, roles: user.roles })
    );
  }

  if (action === 'publicProfile') {
    const targetUserId = String(payload.targetUserId || payload.target_user_id || payload.profileUserId || payload.profile_user_id || '').trim();
    if (!targetUserId) return { code: 'USER_NOT_FOUND', message: 'Target user does not exist.' };
    const [found, uniIdUser, activitySummary] = await Promise.all([
      findByUserId(targetUserId),
      findUniIdUser(targetUserId),
      listPublicActivitiesForUser(targetUserId)
    ]);
    return ok(normalizePublicProfile(found || {
        user_id: targetUserId,
        nickname: uniIdUser?.nickname || uniIdUser?.username || '',
        avatar: uniIdUser?.avatar || ''
    }, activitySummary));
  }

  if (action === 'updateProfile') {
    const found = await findByUserId(user.uid);
    const profile = buildProfile(payload, user);
    if (found) {
      await profileCollection.doc(found._id).update(profile);
      return ok(normalizeProfile({ ...found, ...profile }));
    }
    const record = {
      ...profile,
      created_at: now()
    };
    const result = await profileCollection.add(record);
    return ok(normalizeProfile({ ...record, _id: result.id || result._id }));
  }

  if (action === 'getProfiles') {
    const ids = Array.from(new Set(cleanArray(payload.userIds || payload.user_ids, { max: 50 }).map(cleanId).filter(Boolean)));
    if (!ids.length) {
      return ok([]);
    }
    if (!user.isOps && !(ids.length === 1 && ids[0] === user.uid)) {
      return forbidden('Batch profile lookup is restricted.');
    }
    const result = await profileCollection.where({ user_id: db.command.in(ids) }).limit(ids.length).get();
    return ok((result.data || []).map(normalizeProfile));
  }

  if (action === 'listUsers') {
    if (!user.isAdmin) return permissionDenied();
    return ok(await listUsers());
  }

  if (action === 'updateUserRoles') {
    if (!user.isAdmin) return permissionDenied();
    const targetUserId = String(payload.targetUserId || payload.userId || payload.user_id || '');
    const roles = normalizeRoles(payload.roles || payload.role);
    if (!targetUserId) return invalid('Target user is required.');
    const currentTarget = await findUniIdUser(targetUserId);
    if (!currentTarget) {
      return { code: 'USER_NOT_FOUND', message: 'Target user does not exist.' };
    }
    const previousRoles = normalizeRoles(currentTarget?.role);
    if (previousRoles.includes('admin') && !roles.includes('admin')) {
      const adminCount = await countAdminUsers();
      if (adminCount <= 1) return lastAdminRequired();
    }
    await uniIdUsers.doc(targetUserId).update({ role: roles });
    const profile = await syncProfileRoles(targetUserId, roles, user.uid);
    return ok(normalizeUser({ ...(currentTarget || {}), _id: targetUserId, role: roles }, profile));
  }

  return unknownAction();
}

exports.main = (event) => withSafeHandler(event, () => main(event));
