'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const profileCollection = db.collection('surego-users');
const uniIdUsers = db.collection('uni-id-users');
const activityCollection = db.collection('surego-activities');
const applicationCollection = db.collection('surego-applications');
const checkinCollection = db.collection('surego-checkins');
const followCollection = db.collection('surego-follows');

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

function normalizeMetricNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
}

function normalizeOptionalMetricNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : null;
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

function normalizeVisibility(visibility = 'public') {
  return ['public', 'members_only'].includes(visibility) ? visibility : 'public';
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
  const followingCount = normalizeMetricNumber(record.followingCount ?? record.following_count ?? record.followCount ?? record.follow_count ?? 0);
  const followerCount = normalizeMetricNumber(record.followerCount ?? record.follower_count ?? record.fansCount ?? record.fans_count ?? 0);
  const fulfillmentSuccessCount = normalizeMetricNumber(record.fulfillmentSuccessCount ?? record.fulfillment_success_count ?? 0);
  const fulfillmentTotalCount = normalizeMetricNumber(record.fulfillmentTotalCount ?? record.fulfillment_total_count ?? 0);
  const fulfillmentRate = normalizeOptionalMetricNumber(
    record.fulfillmentSuccessRate ?? record.fulfillment_success_rate ?? record.fulfillmentRate ?? record.fulfillment_rate
  );
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
    mobile: record.mobile || record.phone || '',
    phone: record.phone || record.mobile || '',
    profileTags: record.profile_tags || record.profileTags || [],
    profile_tags: record.profile_tags || record.profileTags || [],
    credit: Number(record.credit) || 100,
    followingCount,
    following_count: followingCount,
    followerCount,
    follower_count: followerCount,
    fansCount: followerCount,
    fans_count: followerCount,
    fulfillmentSuccessRate: fulfillmentRate,
    fulfillment_success_rate: fulfillmentRate,
    fulfillmentRate,
    fulfillment_rate: fulfillmentRate,
    fulfillmentSuccessCount,
    fulfillment_success_count: fulfillmentSuccessCount,
    fulfillmentTotalCount,
    fulfillment_total_count: fulfillmentTotalCount,
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
  const visibility = normalizeVisibility(item.visibility);
  if (rawStatus === 'rejected' || rawStatus === 'hidden') return false;
  return visibility === 'public'
    && publicLifecycleStatuses.includes(status)
    && publicModerationStatuses.includes(moderationStatus)
    && !isActivityDateExpiredForFeed(item);
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

function parseActivityDate(activity = {}) {
  const value = activity.dateValue || activity.date_value || activity.startAt || activity.start_at;
  if (value) {
    const parsed = new Date(String(value).replace(/\./g, '-'));
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const dateText = String(activity.date || '').trim();
  const isoMatched = dateText.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatched) {
    const parsed = new Date(Number(isoMatched[1]), Number(isoMatched[2]) - 1, Number(isoMatched[3]));
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const cnMatched = dateText.match(/(\d{1,2})月(\d{1,2})日/);
  if (cnMatched) {
    const parsed = new Date();
    parsed.setMonth(Number(cnMatched[1]) - 1, Number(cnMatched[2]));
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }
  return null;
}

function isActivityDateExpiredForFeed(item = {}) {
  const parsed = parseActivityDate(item);
  if (!parsed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return parsed.getTime() < today.getTime();
}

function isCompletedForFulfillment(activity = {}) {
  const status = normalizeStatus(activity.status || activity.lifecycleStatus);
  if (status === 'finished') return true;
  if (status === 'cancelled') return false;
  return isActivityDateExpiredForFeed(activity);
}

function normalizePublicProfile(record = {}, activitySummary = {}) {
  const profile = normalizeProfile(record);
  const profileFollowerCount = normalizeMetricNumber(profile.followerCount ?? profile.follower_count ?? profile.fansCount ?? profile.fans_count ?? 0);
  const hasSummaryFollowerCount = activitySummary.followerCount !== undefined
    || activitySummary.follower_count !== undefined
    || activitySummary.fansCount !== undefined
    || activitySummary.fans_count !== undefined;
  const followerCount = hasSummaryFollowerCount
    ? normalizeMetricNumber(activitySummary.followerCount ?? activitySummary.follower_count ?? activitySummary.fansCount ?? activitySummary.fans_count ?? 0)
    : profileFollowerCount;
  const followedByMe = Boolean(activitySummary.followedByMe ?? activitySummary.followed_by_me ?? false);
  const hasSummarySuccessCount = activitySummary.fulfillmentSuccessCount !== undefined
    || activitySummary.fulfillment_success_count !== undefined;
  const hasSummaryTotalCount = activitySummary.fulfillmentTotalCount !== undefined
    || activitySummary.fulfillment_total_count !== undefined;
  const hasSummaryFulfillmentRate = activitySummary.fulfillmentSuccessRate !== undefined
    || activitySummary.fulfillment_success_rate !== undefined
    || activitySummary.fulfillmentRate !== undefined
    || activitySummary.fulfillment_rate !== undefined;
  const fulfillmentSuccessCount = normalizeMetricNumber(
    hasSummarySuccessCount
      ? (activitySummary.fulfillmentSuccessCount ?? activitySummary.fulfillment_success_count)
      : (profile.fulfillmentSuccessCount ?? profile.fulfillment_success_count ?? 0)
  );
  const fulfillmentTotalCount = normalizeMetricNumber(
    hasSummaryTotalCount
      ? (activitySummary.fulfillmentTotalCount ?? activitySummary.fulfillment_total_count)
      : (profile.fulfillmentTotalCount ?? profile.fulfillment_total_count ?? 0)
  );
  const fulfillmentRate = normalizeOptionalMetricNumber(
    hasSummaryFulfillmentRate
      ? (activitySummary.fulfillmentSuccessRate ?? activitySummary.fulfillment_success_rate ?? activitySummary.fulfillmentRate ?? activitySummary.fulfillment_rate)
      : (profile.fulfillmentSuccessRate ?? profile.fulfillment_success_rate ?? profile.fulfillmentRate ?? profile.fulfillment_rate)
  );
  return {
    uid: profile.uid || profile.userId,
    userId: profile.userId || profile.uid,
    nickname: profile.nickname,
    avatar: profile.avatar,
    profileCompletedAt: profile.profileCompletedAt,
    mbti: profile.mbti,
    bio: profile.bio,
    quote: profile.quote,
    profileTags: profile.profileTags || profile.profile_tags || [],
    profile_tags: profile.profileTags || profile.profile_tags || [],
    credit: profile.credit,
    followingCount: profile.followingCount,
    following_count: profile.following_count,
    followerCount,
    follower_count: followerCount,
    fansCount: followerCount,
    fans_count: followerCount,
    followedByMe,
    followed_by_me: followedByMe,
    fulfillmentSuccessRate: fulfillmentRate,
    fulfillment_success_rate: fulfillmentRate,
    fulfillmentRate,
    fulfillment_rate: fulfillmentRate,
    fulfillmentSuccessCount,
    fulfillment_success_count: fulfillmentSuccessCount,
    fulfillmentTotalCount,
    fulfillment_total_count: fulfillmentTotalCount,
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
    applicationCollection.where({ user_id: userId, status: 'approved' }).limit(1000).get(),
    applicationCollection.where({ userId: userId, status: 'approved' }).limit(1000).get()
  ]);
  const seen = new Set();
  return [...(snakeResult.data || []), ...(camelResult.data || [])].filter((item) => {
    const key = String(item._id || item.id || `${item.activity_id || item.activityId}:${item.user_id || item.userId}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function listCheckedActivityIdsForUser(userId) {
  const [snakeResult, camelResult] = await Promise.all([
    checkinCollection.where({ user_id: userId, status: 'checked' }).limit(1000).get(),
    checkinCollection.where({ userId: userId, status: 'checked' }).limit(1000).get()
  ]);
  const ids = new Set();
  for (const item of [...(snakeResult.data || []), ...(camelResult.data || [])]) {
    const activityId = String(item.activity_id || item.activityId || '').trim();
    if (activityId) ids.add(activityId);
  }
  return ids;
}

async function countUserFollowers(userId) {
  const targetId = String(userId || '').trim();
  if (!targetId) return 0;
  const [snakeResult, camelResult] = await Promise.all([
    followCollection
      .where({
        target_type: 'user',
        target_id: targetId
      })
      .limit(1000)
      .get(),
    followCollection
      .where({
        targetType: 'user',
        targetId
      })
      .limit(1000)
      .get()
  ]);
  const seen = new Set();
  for (const item of [...(snakeResult.data || []), ...(camelResult.data || [])]) {
    const followerId = String(item.user_id || item.userId || item.follower_id || item.followerId || '').trim();
    if (followerId) seen.add(followerId);
  }
  return seen.size;
}

async function syncUserFollowerCount(userId, followerCount) {
  const targetId = String(userId || '').trim();
  if (!targetId) return;
  const found = await findByUserId(targetId);
  const payload = {
    follower_count: normalizeMetricNumber(followerCount, 0),
    fans_count: normalizeMetricNumber(followerCount, 0),
    updated_at: now()
  };
  if (found?._id) {
    await profileCollection.doc(found._id).update(payload);
    return;
  }
  await profileCollection.add({
    user_id: targetId,
    nickname: '',
    avatar: '',
    credit: 100,
    roles: [DEFAULT_ROLE],
    ...payload,
    created_at: now()
  });
}

async function listFollowRecords(targetUserId, followerUserId) {
  const targetId = String(targetUserId || '').trim();
  const followerId = String(followerUserId || '').trim();
  if (!targetId || !followerId) return [];
  const [snakeResult, camelResult] = await Promise.all([
    followCollection
      .where({
        target_type: 'user',
        target_id: targetId,
        user_id: followerId
      })
      .limit(1000)
      .get(),
    followCollection
      .where({
        targetType: 'user',
        targetId,
        userId: followerId
      })
      .limit(1000)
      .get()
  ]);
  const seen = new Set();
  return [...(snakeResult.data || []), ...(camelResult.data || [])].filter((item) => {
    const id = String(item._id || '');
    if (id && seen.has(id)) return false;
    if (id) seen.add(id);
    return true;
  });
}

async function countUserFollowing(userId) {
  const followerId = String(userId || '').trim();
  if (!followerId) return 0;
  const [snakeResult, camelResult] = await Promise.all([
    followCollection
      .where({
        target_type: 'user',
        user_id: followerId
      })
      .limit(1000)
      .get(),
    followCollection
      .where({
        targetType: 'user',
        userId: followerId
      })
      .limit(1000)
      .get()
  ]);
  const seen = new Set();
  for (const item of [...(snakeResult.data || []), ...(camelResult.data || [])]) {
    const targetId = String(item.target_id || item.targetId || '').trim();
    if (targetId) seen.add(targetId);
  }
  return seen.size;
}

async function syncUserFollowingCount(userId) {
  const followerId = String(userId || '').trim();
  if (!followerId) return;
  const followingCount = await countUserFollowing(followerId);
  const found = await findByUserId(followerId);
  if (!found?._id) return;
  await profileCollection.doc(found._id).update({
    following_count: followingCount,
    updated_at: now()
  });
}

async function isFollowingUser(targetUserId, followerUserId) {
  const targetId = String(targetUserId || '').trim();
  const followerId = String(followerUserId || '').trim();
  if (!targetId || !followerId || targetId === followerId) return false;
  const result = await listFollowRecords(targetId, followerId);
  return Boolean(result[0]);
}

function normalizeUserFollowResult(targetUserId, followedByMe, followerCount) {
  const targetId = String(targetUserId || '').trim();
  const count = normalizeMetricNumber(followerCount, 0);
  return {
    targetUserId: targetId,
    target_user_id: targetId,
    followedByMe: Boolean(followedByMe),
    followed_by_me: Boolean(followedByMe),
    followerCount: count,
    follower_count: count,
    fansCount: count,
    fans_count: count
  };
}

async function followUser(targetUserId, followerUserId) {
  const targetId = String(targetUserId || '').trim();
  const followerId = String(followerUserId || '').trim();
  if (!targetId || !followerId || targetId === followerId) {
    return normalizeUserFollowResult(targetId, false, await countUserFollowers(targetId));
  }
  const existing = await listFollowRecords(targetId, followerId);
  if (!existing[0]) {
    await followCollection.add({
      target_type: 'user',
      target_id: targetId,
      user_id: followerId,
      targetType: 'user',
      targetId,
      userId: followerId,
      created_at: now()
    });
  }
  const followerCount = await countUserFollowers(targetId);
  await Promise.all([
    syncUserFollowerCount(targetId, followerCount),
    syncUserFollowingCount(followerId)
  ]);
  return normalizeUserFollowResult(targetId, true, followerCount);
}

async function unfollowUser(targetUserId, followerUserId) {
  const targetId = String(targetUserId || '').trim();
  const followerId = String(followerUserId || '').trim();
  if (!targetId || !followerId) {
    return normalizeUserFollowResult(targetId, false, await countUserFollowers(targetId));
  }
  const result = await listFollowRecords(targetId, followerId);
  await Promise.all(result
    .filter((item) => item._id)
    .map((item) => followCollection.doc(item._id).remove().catch(() => null)));
  const followerCount = await countUserFollowers(targetId);
  await Promise.all([
    syncUserFollowerCount(targetId, followerCount),
    syncUserFollowingCount(followerId)
  ]);
  return normalizeUserFollowResult(targetId, false, followerCount);
}

async function listPublicActivitiesForUser(userId) {
  const [hostedSnakeResult, hostedCamelResult, approvedApplications, checkedActivityIds, followerCount] = await Promise.all([
    activityCollection.where({ creator_id: userId }).limit(1000).get(),
    activityCollection.where({ creatorId: userId }).limit(1000).get(),
    listApprovedApplicationsForUser(userId),
    listCheckedActivityIdsForUser(userId),
    countUserFollowers(userId)
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
  const approvedActivityItems = dedupeActivitiesById(joinedResult.data || []);
  const joined = approvedActivityItems
    .filter(isPubliclyVisibleActivity)
    .filter((activity) => pickActivityCreatorId(activity) !== userId)
    .map((activity) => ({ ...activity, publicRelation: 'joined' }));

  const publicActivities = dedupeActivitiesById([...hosted, ...joined])
    .sort((a, b) => getActivitySortTime(b) - getActivitySortTime(a));
  const fulfillmentActivityIds = approvedActivityItems
    .filter((activity) => pickActivityCreatorId(activity) !== userId)
    .filter(isCompletedForFulfillment)
    .map(pickActivityId)
    .filter(Boolean);
  const fulfillmentSuccessCount = fulfillmentActivityIds
    .filter((activityId) => checkedActivityIds.has(activityId)).length;
  const fulfillmentTotalCount = fulfillmentActivityIds.length;
  const fulfillmentSuccessRate = fulfillmentTotalCount
    ? Math.round((fulfillmentSuccessCount / fulfillmentTotalCount) * 100)
    : null;

  return {
    activityCount: publicActivities.length,
    hostedCount: hosted.length,
    joinedCount: joined.length,
    followerCount,
    follower_count: followerCount,
    fansCount: followerCount,
    fans_count: followerCount,
    fulfillmentSuccessRate,
    fulfillment_success_rate: fulfillmentSuccessRate,
    fulfillmentRate: fulfillmentSuccessRate,
    fulfillment_rate: fulfillmentSuccessRate,
    fulfillmentSuccessCount,
    fulfillment_success_count: fulfillmentSuccessCount,
    fulfillmentTotalCount,
    fulfillment_total_count: fulfillmentTotalCount,
    recentActivities: publicActivities.slice(0, 3).map((activity) => normalizePublicActivity(activity, activity.publicRelation || 'joined'))
  };
}

async function findByUserId(userId) {
  const result = await profileCollection.where({ user_id: String(userId || '') }).limit(1).get();
  return (result.data || [])[0] || null;
}

async function findProfilesByUserId(userId) {
  const id = String(userId || '');
  if (!id) return [];
  const result = await profileCollection.where({ user_id: id }).limit(100).get();
  return result.data || [];
}

function pickProfileMergeTarget(items = []) {
  return [...items].sort((left, right) => {
    const leftCompleted = Number(left.profile_completed_at || left.profileCompletedAt || 0);
    const rightCompleted = Number(right.profile_completed_at || right.profileCompletedAt || 0);
    if (leftCompleted !== rightCompleted) return rightCompleted - leftCompleted;
    return Number(right.updated_at || right.created_at || 0) - Number(left.updated_at || left.created_at || 0);
  })[0] || null;
}

function mergeProfileRecord(base = {}, next = {}) {
  return {
    ...base,
    ...next,
    nickname: next.nickname || base.nickname || '',
    avatar: next.avatar || base.avatar || '',
    avatar_file_id: next.avatar_file_id || base.avatar_file_id || '',
    profile_completed_at: next.profile_completed_at || base.profile_completed_at || 0,
    mbti: next.mbti || base.mbti || '',
    bio: next.bio || base.bio || '',
    quote: next.quote || base.quote || '',
    mobile: next.mobile || next.phone || base.mobile || base.phone || '',
    phone: next.phone || next.mobile || base.phone || base.mobile || '',
    profile_tags: Array.isArray(next.profile_tags || next.profileTags)
      ? (next.profile_tags || next.profileTags)
      : (base.profile_tags || base.profileTags || []),
    credit: Number(next.credit || base.credit) || 100,
    following_count: normalizeMetricNumber(next.following_count ?? next.followingCount ?? base.following_count ?? base.followingCount ?? 0),
    follower_count: normalizeMetricNumber(next.follower_count ?? next.followerCount ?? next.fans_count ?? next.fansCount ?? base.follower_count ?? base.followerCount ?? base.fans_count ?? base.fansCount ?? 0),
    fulfillment_success_rate: normalizeOptionalMetricNumber(next.fulfillment_success_rate ?? next.fulfillmentSuccessRate ?? next.fulfillment_rate ?? next.fulfillmentRate ?? base.fulfillment_success_rate ?? base.fulfillmentSuccessRate ?? base.fulfillment_rate ?? base.fulfillmentRate),
    fulfillment_success_count: normalizeMetricNumber(next.fulfillment_success_count ?? next.fulfillmentSuccessCount ?? base.fulfillment_success_count ?? base.fulfillmentSuccessCount ?? 0),
    fulfillment_total_count: normalizeMetricNumber(next.fulfillment_total_count ?? next.fulfillmentTotalCount ?? base.fulfillment_total_count ?? base.fulfillmentTotalCount ?? 0),
    roles: next.roles?.length ? next.roles : normalizeRoles(base.roles),
    updated_at: now()
  };
}

async function upsertProfileByUserId(userId, payload = {}) {
  const records = await findProfilesByUserId(userId);
  const target = pickProfileMergeTarget(records);
  if (target) {
    const merged = mergeProfileRecord(target, payload);
    delete merged._id;
    await profileCollection.doc(target._id).update(merged);
    await Promise.all(records
      .filter((item) => item._id && item._id !== target._id)
      .map((item) => profileCollection.doc(item._id).remove().catch(() => null)));
    return normalizeProfile({ ...target, ...merged });
  }
  const record = {
    ...payload,
    user_id: userId,
    created_at: now()
  };
  const result = await profileCollection.add(record);
  return normalizeProfile({ ...record, _id: result.id || result._id });
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

function isTokenOwnedByUser(userRecord = {}, uniIdToken = '') {
  const token = String(uniIdToken || '');
  if (!userRecord || !token) return false;
  const tokens = Array.isArray(userRecord.token) ? userRecord.token : [userRecord.token];
  return tokens.some((item) => {
    if (!item) return false;
    return String(typeof item === 'string' ? item : item.token || item.value || '') === token;
  });
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
  const uid = String(event.userId || event.uid || payload.uid || payload.userId || payload.user_id || '');
  if (!uid || uid === 'mock_user') {
    return { uid, roles: [], exists: false, tokenValid: false, isAdmin: false, isOps: false };
  }
  const userRecord = await findUniIdUser(uid);
  const tokenValid = isTokenOwnedByUser(userRecord, event.uniIdToken);
  if (!tokenValid) {
    return { uid, roles: [], exists: false, tokenValid: false, isAdmin: false, isOps: false };
  }
  const roles = await ensureDefaultRole(uid);
  if (!roles) {
    return { uid, roles: [], exists: false, tokenValid: false, isAdmin: false, isOps: false };
  }
  return {
    uid,
    roles,
    exists: true,
    tokenValid,
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
    mobile: payload.mobile || payload.phone || '',
    phone: payload.phone || payload.mobile || '',
    profile_tags: Array.isArray(payload.profileTags || payload.profile_tags)
      ? (payload.profileTags || payload.profile_tags)
      : [],
    credit: Number(payload.credit) || 100,
    following_count: normalizeMetricNumber(payload.following_count ?? payload.followingCount ?? payload.followCount ?? payload.follow_count ?? 0),
    follower_count: normalizeMetricNumber(payload.follower_count ?? payload.followerCount ?? payload.fans_count ?? payload.fansCount ?? 0),
    fulfillment_success_rate: normalizeOptionalMetricNumber(payload.fulfillment_success_rate ?? payload.fulfillmentSuccessRate ?? payload.fulfillment_rate ?? payload.fulfillmentRate),
    fulfillment_success_count: normalizeMetricNumber(payload.fulfillment_success_count ?? payload.fulfillmentSuccessCount ?? 0),
    fulfillment_total_count: normalizeMetricNumber(payload.fulfillment_total_count ?? payload.fulfillmentTotalCount ?? 0),
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

  if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();

  if (action === 'profile') {
    const profileUserId = payload.userId || payload.user_id || user.uid;
    const [found, uniIdUser] = await Promise.all([
      findByUserId(profileUserId),
      findUniIdUser(profileUserId)
    ]);
    const authContext = {
      authUid: user.uid,
      tokenValid: user.tokenValid,
      isOps: user.isOps,
      isAdmin: user.isAdmin
    };
    return {
      code: 0,
      data: found
        ? normalizeProfile({ ...found, mobile: found.mobile || uniIdUser?.mobile || '', phone: found.phone || uniIdUser?.mobile || '', roles: user.roles, ...authContext })
        : normalizeProfile({ user_id: user.uid, mobile: uniIdUser?.mobile || '', phone: uniIdUser?.mobile || '', roles: user.roles, ...authContext })
    };
  }

  if (action === 'publicProfile') {
    const targetUserId = String(payload.targetUserId || payload.target_user_id || payload.profileUserId || payload.profile_user_id || '').trim();
    if (!targetUserId) return { code: 'USER_NOT_FOUND', message: 'Target user does not exist.' };
    const [found, uniIdUser, activitySummary] = await Promise.all([
      findByUserId(targetUserId),
      findUniIdUser(targetUserId),
      listPublicActivitiesForUser(targetUserId)
    ]);
    activitySummary.followedByMe = await isFollowingUser(targetUserId, user.uid);
    activitySummary.followed_by_me = activitySummary.followedByMe;
    return {
      code: 0,
      data: normalizePublicProfile(found || {
        user_id: targetUserId,
        nickname: uniIdUser?.nickname || uniIdUser?.username || '',
        avatar: uniIdUser?.avatar || ''
      }, activitySummary)
    };
  }

  if (action === 'followUser') {
    const targetUserId = String(payload.targetUserId || payload.target_user_id || payload.profileUserId || payload.profile_user_id || '').trim();
    if (!targetUserId) return { code: 'USER_NOT_FOUND', message: 'Target user does not exist.' };
    return {
      code: 0,
      data: await followUser(targetUserId, user.uid)
    };
  }

  if (action === 'unfollowUser') {
    const targetUserId = String(payload.targetUserId || payload.target_user_id || payload.profileUserId || payload.profile_user_id || '').trim();
    if (!targetUserId) return { code: 'USER_NOT_FOUND', message: 'Target user does not exist.' };
    return {
      code: 0,
      data: await unfollowUser(targetUserId, user.uid)
    };
  }

  if (action === 'updateProfile') {
    const profile = buildProfile(payload, user);
    return {
      code: 0,
      data: await upsertProfileByUserId(user.uid, profile)
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
    if (!currentTarget) {
      return { code: 'USER_NOT_FOUND', message: 'Target user does not exist.' };
    }
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
