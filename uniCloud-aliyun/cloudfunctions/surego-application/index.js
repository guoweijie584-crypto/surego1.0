'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const collection = db.collection('surego-applications');
const activityCollection = db.collection('surego-activities');
const uniIdUsers = db.collection('uni-id-users');
const suregoUsers = db.collection('surego-users');
const recruitableActivityStatuses = ['published', 'recruiting'];
const recruitableModerationStatuses = ['approved', 'visible'];

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

async function getActivity(activityId) {
  const result = await activityCollection.doc(String(activityId || '')).get();
  return (result.data || [])[0] || null;
}

function canApplyToActivity(activity = {}) {
  const status = normalizeActivityLifecycleStatus(activity.status || activity.lifecycleStatus);
  const moderationStatus = normalizeModerationStatus(activity.moderation_status || activity.moderationStatus);
  return recruitableActivityStatuses.includes(status) && recruitableModerationStatuses.includes(moderationStatus);
}

function normalizeActivityLifecycleStatus(status = 'recruiting') {
  const value = String(status || 'recruiting');
  return ['draft', 'reviewing', 'published', 'recruiting', 'formed', 'ongoing', 'finished', 'cancelled'].includes(value)
    ? value
    : 'recruiting';
}

function normalizeModerationStatus(status = 'pending') {
  const value = String(status || 'pending');
  return ['pending', 'approved', 'visible', 'rejected', 'hidden'].includes(value) ? value : 'pending';
}

async function getSuregoUserProfile(userId) {
  if (!userId) return null;
  try {
    const result = await suregoUsers.where({ user_id: String(userId) }).limit(1).get();
    return (result.data || [])[0] || null;
  } catch (error) {
    return null;
  }
}

async function getExistingApplication(activityId, userId) {
  const result = await collection.where({
    activity_id: String(activityId || ''),
    user_id: String(userId || '')
  }).orderBy('created_at', 'desc').limit(1).get();
  return (result.data || [])[0] || null;
}

async function canManageActivity(activityId, user) {
  if (user.isOps) return true;
  const activity = await getActivity(activityId);
  return Boolean(activity && String(activity.creator_id || activity.creatorId || '') === user.uid);
}

function normalizeApplication(item = {}) {
  return {
    ...item,
    id: item.id || item._id,
    activityId: item.activityId || item.activity_id,
    userId: item.userId || item.user_id,
    nickname: item.nickname || item.applicant_name || item.applicantName || '',
    avatar: item.avatar || item.applicant_avatar || item.applicantAvatar || '',
    applicantName: item.applicantName || item.applicant_name || item.nickname || '',
    applicantAvatar: item.applicantAvatar || item.applicant_avatar || item.avatar || '',
    reviewNote: item.reviewNote || item.review_note || '',
    rejectReason: item.rejectReason || item.reject_reason || '',
    reviewerId: item.reviewerId || item.reviewer_id || '',
    createdAt: item.createdAt || item.created_at,
    reviewedAt: item.reviewedAt || item.reviewed_at
  };
}

function normalizeList(result) {
  return (result.data || []).map(normalizeApplication);
}

function buildRecord(payload) {
  const userId = payload.userId || payload.user_id;
  const record = {
    ...payload,
    activityId: String(payload.activityId || payload.activity_id),
    activity_id: String(payload.activityId || payload.activity_id),
    userId,
    user_id: userId
  };
  if (!record.id) delete record.id;
  return record;
}

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};
  const user = await resolveUserContext(event, payload);

  if (action === 'submit') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const activityId = String(payload.activityId || payload.activity_id || '');
    const activity = await getActivity(activityId);
    if (!activity) {
      return { code: 'NOT_FOUND', message: 'Activity not found.' };
    }
    if (String(activity.creator_id || activity.creatorId || '') === user.uid) {
      return { code: 'FORBIDDEN', message: 'Creator cannot apply to own activity.' };
    }
    if (!canApplyToActivity(activity)) {
      return { code: 'ACTIVITY_NOT_RECRUITING', message: 'Activity is not recruiting.' };
    }
    const existing = await getExistingApplication(activityId, user.uid);
    if (existing) {
      return {
        code: 0,
        data: normalizeApplication(existing)
      };
    }
    const profile = await getSuregoUserProfile(user.uid);
    const application = buildRecord({
      ...payload,
      activityId,
      activity_id: activityId,
      userId: user.uid,
      user_id: user.uid,
      nickname: payload.nickname || payload.applicantName || payload.applicant_name || profile?.nickname || '',
      avatar: payload.avatar || payload.applicantAvatar || payload.applicant_avatar || profile?.avatar || '',
      applicant_name: payload.applicantName || payload.applicant_name || payload.nickname || profile?.nickname || '',
      applicant_avatar: payload.applicantAvatar || payload.applicant_avatar || payload.avatar || profile?.avatar || '',
      status: payload.status || 'pending',
      created_at: Date.now()
    });
    const result = await collection.add(application);
    return {
      code: 0,
      data: normalizeApplication({
        ...application,
        id: result.id
      })
    };
  }

  if (action === 'getMineByActivity') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const target = await getExistingApplication(payload.activityId || payload.activity_id, user.uid);
    return {
      code: 0,
      data: target ? normalizeApplication(target) : null
    };
  }

  if (action === 'listMine') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const requestedLimit = Math.min(Number(payload.limit) || 100, 100);
    const [snakeResult, camelResult] = await Promise.all([
      collection.where({ user_id: user.uid }).orderBy('created_at', 'desc').limit(requestedLimit).get(),
      collection.where({ userId: user.uid }).orderBy('created_at', 'desc').limit(requestedLimit).get()
    ]);
    const seen = new Set();
    const items = [...(snakeResult.data || []), ...(camelResult.data || [])]
      .filter((item) => {
        const key = String(item._id || item.id || `${item.activity_id || item.activityId}:${item.user_id || item.userId}`);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0))
      .slice(0, requestedLimit);
    return {
      code: 0,
      data: items.map(normalizeApplication)
    };
  }

  if (action === 'listByActivity') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const activityId = String(payload.activityId || payload.activity_id);
    const query = await canManageActivity(activityId, user)
      ? { activityId }
      : { activityId, userId: user.uid };
    const result = await collection.where(query).orderBy('created_at', 'desc').get();
    return {
      code: 0,
      data: normalizeList(result)
    };
  }

  if (action === 'review') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const existing = await collection.doc(payload.id).get();
    const target = (existing.data || [])[0];
    if (!target || !(await canManageActivity(target.activity_id || target.activityId, user))) {
      return { code: 'FORBIDDEN', message: 'Only the activity creator can review applications.' };
    }
    const reviewedAt = Date.now();
    const beforeStatus = target.status;
    await collection.doc(payload.id).update({
      status: payload.status,
      review_note: payload.reviewNote || payload.review_note || '',
      reject_reason: payload.rejectReason || payload.reject_reason || '',
      reviewer_id: user.uid,
      reviewed_at: reviewedAt
    });
    if (beforeStatus !== 'approved' && payload.status === 'approved') {
      await activityCollection.doc(target.activity_id || target.activityId).update({
        participantCount: dbCmd.inc(1),
        participant_count: dbCmd.inc(1),
        updated_at: reviewedAt
      });
    } else if (beforeStatus === 'approved' && payload.status !== 'approved') {
      await activityCollection.doc(target.activity_id || target.activityId).update({
        participantCount: dbCmd.inc(-1),
        participant_count: dbCmd.inc(-1),
        updated_at: reviewedAt
      });
    }
    return {
      code: 0,
      data: normalizeApplication({
        id: payload.id,
        activityId: target.activity_id || target.activityId,
        activity_id: target.activity_id || target.activityId,
        userId: target.user_id || target.userId,
        user_id: target.user_id || target.userId,
        status: payload.status,
        reviewNote: payload.reviewNote || payload.review_note || '',
        rejectReason: payload.rejectReason || payload.reject_reason || '',
        reviewerId: payload.reviewerId || payload.reviewer_id || '',
        reviewed_at: reviewedAt
      })
    };
  }

  return {
    code: 'UNKNOWN_ACTION',
    message: `Unsupported action: ${action}`
  };
};
