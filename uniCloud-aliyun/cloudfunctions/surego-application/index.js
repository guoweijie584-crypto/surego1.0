'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const collection = db.collection('surego-applications');
const activityCollection = db.collection('surego-activities');
const suregoUsers = db.collection('surego-users');
const {
  authRequired,
  cleanArray,
  cleanEnum,
  cleanId,
  cleanString,
  forbidden,
  invalid,
  now,
  ok,
  requireAuth,
  unknownAction
} = require('surego-security');

const PUBLIC_STATUSES = ['published', 'recruiting', 'formed'];
const PUBLIC_MODERATION_STATUSES = ['approved', 'visible'];
const REVIEW_STATUSES = ['approved', 'rejected'];

async function getActivity(activityId) {
  const result = await activityCollection.doc(String(activityId || '')).get();
  return (result.data || [])[0] || null;
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
  let result = await collection.where({
    activity_id: String(activityId || ''),
    user_id: String(userId || '')
  }).orderBy('created_at', 'desc').limit(1).get();
  if (!(result.data || []).length) {
    result = await collection.where({
      activityId: String(activityId || ''),
      userId: String(userId || '')
    }).orderBy('created_at', 'desc').limit(1).get();
  }
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
    activityId: String(payload.activityId || payload.activity_id),
    activity_id: String(payload.activityId || payload.activity_id),
    userId,
    user_id: userId,
    nickname: cleanString(payload.nickname || payload.applicantName || payload.applicant_name, { max: 40 }),
    avatar: cleanString(payload.avatar || payload.applicantAvatar || payload.applicant_avatar, { max: 500 }),
    applicant_name: cleanString(payload.applicantName || payload.applicant_name || payload.nickname, { max: 40 }),
    applicant_avatar: cleanString(payload.applicantAvatar || payload.applicant_avatar || payload.avatar, { max: 500 }),
    gender: cleanEnum(payload.gender, ['male', 'female', ''], ''),
    mbti: cleanString(payload.mbti, { max: 8 }),
    message: cleanString(payload.message, { max: 200 }),
    answers: cleanArray(payload.answers, { max: 10 }).map((item) => cleanString(item, { max: 200 })),
    status: payload.status,
    review_note: cleanString(payload.reviewNote || payload.review_note, { max: 200 }),
    reject_reason: cleanString(payload.rejectReason || payload.reject_reason, { max: 200 }),
    reviewer_id: payload.reviewerId || payload.reviewer_id || '',
    created_at: payload.createdAt || payload.created_at || now(),
    reviewed_at: payload.reviewedAt || payload.reviewed_at || ''
  };
  if (!record.id) delete record.id;
  return record;
}

function isActivityOpenForApplication(activity = {}) {
  const status = String(activity.status || '');
  const moderationStatus = String(activity.moderation_status || activity.moderationStatus || '');
  if (!PUBLIC_STATUSES.includes(status)) return false;
  if (!PUBLIC_MODERATION_STATUSES.includes(moderationStatus)) return false;
  if (activity.has_participant_limit === true || activity.hasParticipantLimit === true) {
    const maxParticipants = Number(activity.max_participants || activity.maxParticipants || 0);
    const participantCount = Number(activity.participant_count || activity.participantCount || 0);
    if (maxParticipants > 0 && participantCount >= maxParticipants) return false;
  }
  return true;
}

function deriveApplicationStatus(activity = {}) {
  return activity.require_approval === false || activity.requireApproval === false ? 'approved' : 'pending';
}

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};
  const user = await requireAuth(event);
  if (!user) return authRequired();

  if (action === 'submit') {
    const activityId = String(payload.activityId || payload.activity_id || '');
    const activity = await getActivity(activityId);
    if (!activity) {
      return { code: 'NOT_FOUND', message: 'Activity not found.' };
    }
    if (String(activity.creator_id || activity.creatorId || '') === user.uid) {
      return forbidden('Creator cannot apply to own activity.');
    }
    if (!isActivityOpenForApplication(activity)) {
      return forbidden('This activity is not open for application.');
    }
    const existing = await getExistingApplication(activityId, user.uid);
    if (existing) {
      return ok(normalizeApplication(existing));
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
      gender: payload.gender,
      mbti: payload.mbti,
      message: payload.message,
      answers: payload.answers,
      status: deriveApplicationStatus(activity),
      created_at: now()
    });
    const result = await collection.add(application);
    return ok(normalizeApplication({
        ...application,
        id: result.id
    }));
  }

  if (action === 'getMineByActivity') {
    const target = await getExistingApplication(payload.activityId || payload.activity_id, user.uid);
    return ok(target ? normalizeApplication(target) : null);
  }

  if (action === 'listMine') {
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
    return ok(items.map(normalizeApplication));
  }

  if (action === 'listByActivity') {
    const activityId = String(payload.activityId || payload.activity_id);
    const canManage = await canManageActivity(activityId, user);
    const [snakeResult, camelResult] = await Promise.all([
      collection.where(canManage ? { activity_id: activityId } : { activity_id: activityId, user_id: user.uid }).orderBy('created_at', 'desc').get(),
      collection.where(canManage ? { activityId } : { activityId, userId: user.uid }).orderBy('created_at', 'desc').get()
    ]);
    const seen = new Set();
    const items = [...(snakeResult.data || []), ...(camelResult.data || [])].filter((item) => {
      const key = String(item._id || item.id || `${item.activity_id || item.activityId}:${item.user_id || item.userId}`);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return ok(items.map(normalizeApplication));
  }

  if (action === 'review') {
    const nextStatus = cleanEnum(payload.status, REVIEW_STATUSES, '');
    if (!nextStatus) return invalid('Review status must be approved or rejected.');
    const id = cleanId(payload.id);
    const existing = await collection.doc(id).get();
    const target = (existing.data || [])[0];
    if (!target || !(await canManageActivity(target.activity_id || target.activityId, user))) {
      return forbidden('Only the activity creator can review applications.');
    }
    const activity = await getActivity(target.activity_id || target.activityId);
    if (nextStatus === 'approved' && activity && (activity.has_participant_limit === true || activity.hasParticipantLimit === true)) {
      const maxParticipants = Number(activity.max_participants || activity.maxParticipants || 0);
      const participantCount = Number(activity.participant_count || activity.participantCount || 0);
      if (maxParticipants > 0 && participantCount >= maxParticipants && target.status !== 'approved') {
        return forbidden('This activity is already full.');
      }
    }
    const reviewedAt = now();
    const beforeStatus = target.status;
    await collection.doc(id).update({
      status: nextStatus,
      review_note: payload.reviewNote || payload.review_note || '',
      reject_reason: payload.rejectReason || payload.reject_reason || '',
      reviewer_id: user.uid,
      reviewed_at: reviewedAt
    });
    if (beforeStatus !== 'approved' && nextStatus === 'approved') {
      await activityCollection.doc(target.activity_id || target.activityId).update({
        participantCount: dbCmd.inc(1),
        participant_count: dbCmd.inc(1),
        updated_at: reviewedAt
      });
    } else if (beforeStatus === 'approved' && nextStatus !== 'approved') {
      await activityCollection.doc(target.activity_id || target.activityId).update({
        participantCount: dbCmd.inc(-1),
        participant_count: dbCmd.inc(-1),
        updated_at: reviewedAt
      });
    }
    return ok(normalizeApplication({
        id,
        activityId: target.activity_id || target.activityId,
        activity_id: target.activity_id || target.activityId,
        userId: target.user_id || target.userId,
        user_id: target.user_id || target.userId,
        status: nextStatus,
        reviewNote: payload.reviewNote || payload.review_note || '',
        rejectReason: payload.rejectReason || payload.reject_reason || '',
        reviewerId: user.uid,
        reviewed_at: reviewedAt
    }));
  }

  return unknownAction();
};
