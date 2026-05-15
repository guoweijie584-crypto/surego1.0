'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const collection = db.collection('surego-activities');
const applications = db.collection('surego-applications');
const uniIdUsers = db.collection('uni-id-users');

const lifecycleStatuses = ['draft', 'reviewing', 'published', 'recruiting', 'formed', 'ongoing', 'finished', 'cancelled'];
const publicLifecycleStatuses = ['published', 'recruiting', 'formed', 'ongoing'];
const publicModerationStatuses = ['approved', 'visible'];
const moderationStatuses = ['pending', 'approved', 'rejected', 'hidden', 'visible'];
const activityVisibilities = ['public', 'members_only'];
const activitySources = ['direct_activity', 'partner_post'];
const creatorStatusTransitions = {
  draft: ['reviewing'],
  reviewing: ['draft'],
  published: ['formed', 'cancelled'],
  recruiting: ['formed', 'cancelled'],
  formed: ['ongoing', 'cancelled'],
  ongoing: ['finished']
};
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

async function canEditActivity(id, user) {
  const result = await collection.doc(id).get();
  const found = (result.data || [])[0];
  return Boolean(found && String(found.creator_id || found.creatorId || '') === user.uid);
}

async function getCreatorActivity(id, user) {
  const result = await collection.doc(id).get();
  const found = (result.data || [])[0];
  if (!found || String(found.creator_id || found.creatorId || '') !== user.uid) return null;
  return found;
}

function normalizeStatus(status = 'recruiting') {
  const mapped = legacyStatusMap[status] || status;
  return lifecycleStatuses.includes(mapped) ? mapped : 'recruiting';
}

function normalizeModerationStatus(status = 'pending') {
  const nextStatus = status || 'pending';
  return moderationStatuses.includes(nextStatus) ? nextStatus : 'pending';
}

function normalizeVisibility(visibility = 'public') {
  return activityVisibilities.includes(visibility) ? visibility : 'public';
}

function normalizeSource(source = 'direct_activity') {
  return activitySources.includes(source) ? source : 'direct_activity';
}

function getAllowedStatusTransitions(activity = {}) {
  const status = normalizeStatus(activity.status || activity.lifecycleStatus);
  const moderationStatus = normalizeModerationStatus(activity.moderation_status || activity.moderationStatus);
  if (['hidden', 'rejected'].includes(moderationStatus)) return [];
  if (status === 'draft') return creatorStatusTransitions.draft;
  if (status === 'reviewing') return creatorStatusTransitions.reviewing;
  if (!publicModerationStatuses.includes(moderationStatus)) return [];
  return creatorStatusTransitions[status] || [];
}

function canTransitionStatus(activity = {}, nextStatus = '') {
  return getAllowedStatusTransitions(activity).includes(normalizeStatus(nextStatus));
}

function isPubliclyVisibleActivity(item = {}) {
  const rawStatus = String(item.status || item.lifecycleStatus || '');
  const status = normalizeStatus(item.status || item.lifecycleStatus);
  const moderationStatus = normalizeModerationStatus(item.moderation_status || item.moderationStatus);
  const visibility = normalizeVisibility(item.visibility);
  if (rawStatus === 'rejected' || rawStatus === 'hidden') return false;
  return visibility === 'public' && publicLifecycleStatuses.includes(status) && publicModerationStatuses.includes(moderationStatus);
}

function normalizeIdList(ids = []) {
  return Array.from(new Set((Array.isArray(ids) ? ids : []).map(String).filter(Boolean)));
}

function isActivityParticipant(item = {}, userId = '') {
  return Boolean(userId && normalizeIdList(item.participant_ids || item.participantIds || []).includes(String(userId)));
}

function isActivityInvitee(item = {}, userId = '') {
  return Boolean(userId && normalizeIdList(item.invited_user_ids || item.invitedUserIds || []).includes(String(userId)));
}

function normalizeActivity(item = {}) {
  return {
    ...item,
    id: item.id || item._id,
    status: normalizeStatus(item.status),
    moderationStatus: normalizeModerationStatus(item.moderation_status || item.moderationStatus),
    moderation_status: normalizeModerationStatus(item.moderation_status || item.moderationStatus),
    moderationNote: item.moderation_note || item.moderationNote || '',
    moderatedAt: item.moderated_at || item.moderatedAt || '',
    moderatedBy: item.moderated_by || item.moderatedBy || '',
    visibility: normalizeVisibility(item.visibility),
    source: normalizeSource(item.source),
    sourcePartnerPostId: item.source_partner_post_id || item.sourcePartnerPostId || '',
    source_partner_post_id: item.source_partner_post_id || item.sourcePartnerPostId || '',
    sourcePartnerIntentIds: item.source_partner_intent_ids || item.sourcePartnerIntentIds || [],
    source_partner_intent_ids: item.source_partner_intent_ids || item.sourcePartnerIntentIds || [],
    invitedUserIds: item.invited_user_ids || item.invitedUserIds || [],
    invited_user_ids: item.invited_user_ids || item.invitedUserIds || [],
    participantIds: item.participant_ids || item.participantIds || [],
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
  delete next['is' + 'Creator'];
  delete next.moderationStatus;
  delete next.moderation_status;
  delete next.moderationNote;
  delete next.moderation_note;
  delete next.moderatedAt;
  delete next.moderated_at;
  delete next.moderatedBy;
  delete next.moderated_by;
  return next;
}

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};
  const user = await resolveUserContext(event, payload);

  if (action === 'list') {
    const requestedLimit = Number(payload.limit) > 0 ? Number(payload.limit) : 20;
    const result = await collection.orderBy('created_at', 'desc').limit(Math.min(requestedLimit * 5, 100)).get();
    return {
      code: 0,
      data: normalizeList(result).filter(isPubliclyVisibleActivity).slice(0, requestedLimit)
    };
  }

  if (action === 'detail') {
    const result = await collection.doc(payload.id).get();
    const activity = normalizeActivity((result.data || [])[0]);
    if (!activity?.id) {
      return { code: 0, data: null };
    }
    const canView = isPubliclyVisibleActivity(activity)
      || (user.exists && (
        user.isOps
        || String(activity.creator_id || activity.creatorId || '') === user.uid
        || isActivityParticipant(activity, user.uid)
        || isActivityInvitee(activity, user.uid)
      ));
    if (!canView) {
      return { code: 'FORBIDDEN', message: 'This activity is still under review.' };
    }
    return {
      code: 0,
      data: activity
    };
  }

  if (action === 'listMine') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const [createdResult, invitedResult, snakeApplicationResult, camelApplicationResult] = await Promise.all([
      collection.where({ creator_id: user.uid }).orderBy('created_at', 'desc').limit(payload.limit || 100).get(),
      collection.where({ invited_user_ids: user.uid }).orderBy('created_at', 'desc').limit(payload.limit || 100).get(),
      applications.where({ user_id: user.uid }).orderBy('created_at', 'desc').limit(payload.limit || 100).get(),
      applications.where({ userId: user.uid }).orderBy('created_at', 'desc').limit(payload.limit || 100).get()
    ]);
    const seenApplications = new Set();
    const applicationItems = [...(snakeApplicationResult.data || []), ...(camelApplicationResult.data || [])]
      .filter((item) => {
        const key = String(item._id || item.id || `${item.activity_id || item.activityId}:${item.user_id || item.userId}`);
        if (seenApplications.has(key)) return false;
        seenApplications.add(key);
        return true;
      });
    const applicationStatusByActivity = {};
    const activityIds = Array.from(new Set(applicationItems.map((item) => String(item.activity_id || item.activityId || '')).filter(Boolean)));
    const joinedResult = activityIds.length
      ? await collection.where({ _id: dbCmd.in(activityIds) }).limit(activityIds.length).get()
      : { data: [] };
    applicationItems.forEach((item) => {
      const activityId = String(item.activity_id || item.activityId || '');
      if (activityId) applicationStatusByActivity[activityId] = item.status || 'pending';
    });
    const withApplicationStatus = (item) => ({
      ...normalizeActivity(item),
      applicationStatus: applicationStatusByActivity[String(item._id || item.id)] || 'not_applied'
    });
    const joined = (joinedResult.data || []).map(withApplicationStatus);
    const invited = normalizeList(invitedResult)
      .filter((item) => String(item.creator_id || item.creatorId || '') !== user.uid)
      .filter((item) => !applicationStatusByActivity[String(item._id || item.id)])
      .map((item) => ({
        ...item,
        applicationStatus: 'invited',
        application_status: 'invited'
      }));
    return {
      code: 0,
      data: {
        hosting: normalizeList(createdResult),
        joined: joined.filter((item) => item.applicationStatus === 'approved'),
        pending: joined.filter((item) => item.applicationStatus === 'pending'),
        rejected: joined.filter((item) => item.applicationStatus === 'rejected'),
        invited
      }
    };
  }

  if (action === 'create') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const activity = withoutEmptyId({
      ...payload,
      creatorId: user.uid,
      creator_id: user.uid,
      visibility: payload.visibility || 'public',
      source: payload.source || 'direct_activity',
      source_partner_post_id: payload.sourcePartnerPostId || payload.source_partner_post_id || '',
      source_partner_intent_ids: payload.sourcePartnerIntentIds || payload.source_partner_intent_ids || [],
      invited_user_ids: payload.invitedUserIds || payload.invited_user_ids || [],
      participant_ids: payload.participantIds || payload.participant_ids || [],
      status: 'reviewing',
      created_at: Date.now(),
      updated_at: Date.now()
    });
    activity.moderation_status = 'pending';
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
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const id = payload.id;
    if (!(await canEditActivity(id, user))) {
      return { code: 'FORBIDDEN', message: 'Only the creator can edit this activity.' };
    }
    const updatePayload = withoutEmptyId({
      ...payload,
      creatorId: user.uid,
      creator_id: user.uid,
      visibility: payload.visibility || 'public',
      source: payload.source || 'direct_activity',
      source_partner_post_id: payload.sourcePartnerPostId || payload.source_partner_post_id || '',
      source_partner_intent_ids: payload.sourcePartnerIntentIds || payload.source_partner_intent_ids || [],
      invited_user_ids: payload.invitedUserIds || payload.invited_user_ids || [],
      participant_ids: payload.participantIds || payload.participant_ids || [],
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
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const existing = await getCreatorActivity(payload.id, user);
    if (!existing) {
      return { code: 'FORBIDDEN', message: 'Only the creator can update this activity.' };
    }
    const nextStatus = normalizeStatus(payload.status);
    if (!canTransitionStatus(existing, nextStatus)) {
      return {
        code: 'INVALID_TRANSITION',
        message: `Cannot transition activity from ${normalizeStatus(existing.status)} to ${nextStatus}.`
      };
    }
    await collection.doc(payload.id).update({
      status: nextStatus,
      ...(nextStatus === 'reviewing' ? { moderation_status: 'pending' } : {}),
      updated_at: Date.now()
    });
    return {
      code: 0,
      data: {
        id: payload.id,
        status: nextStatus
      }
    };
  }

  return {
    code: 'UNKNOWN_ACTION',
    message: `Unsupported action: ${action}`
  };
};
