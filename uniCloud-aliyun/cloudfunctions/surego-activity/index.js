'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const collection = db.collection('surego-activities');
const applications = db.collection('surego-applications');
const {
  authRequired,
  cleanArray,
  cleanBool,
  cleanEnum,
  cleanId,
  cleanInt,
  cleanNumber,
  cleanString,
  cleanUrl,
  forbidden,
  invalid,
  now,
  ok,
  optionalAuth,
  requireAuth,
  unknownAction,
  withSafeHandler
} = require('surego-security');

const lifecycleStatuses = ['draft', 'reviewing', 'published', 'recruiting', 'formed', 'ongoing', 'finished', 'cancelled'];
const publicLifecycleStatuses = ['published', 'recruiting', 'formed', 'ongoing'];
const publicModerationStatuses = ['approved', 'visible'];
const moderationStatuses = ['pending', 'approved', 'rejected', 'hidden', 'visible'];
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
  if (rawStatus === 'rejected' || rawStatus === 'hidden') return false;
  return publicLifecycleStatuses.includes(status) && publicModerationStatuses.includes(moderationStatus);
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
    createdAt: item.createdAt || item.created_at,
    updatedAt: item.updatedAt || item.updated_at
  };
}

function normalizeList(result) {
  return (result.data || []).map(normalizeActivity);
}

function normalizeQuestionList(value) {
  return cleanArray(value, { max: 5 })
    .map((item) => cleanString(item, { max: 50 }))
    .filter(Boolean);
}

function normalizeLimit(value, fallback = 20, max = 100) {
  const next = Number(value);
  if (!Number.isInteger(next) || next <= 0) return fallback;
  return Math.min(next, max);
}

function normalizeSkip(value) {
  const next = Number(value);
  if (!Number.isInteger(next) || next < 0) return 0;
  return next;
}

function parseFiniteNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function sanitizeActivityPayload(payload = {}, options = {}) {
  const partyMode = cleanEnum(firstDefined(payload.partyMode, payload.party_mode), ['free', 'sincerity', 'ticket'], 'free');
  const rawAmount = parseFiniteNumber(payload.amount);
  if (partyMode !== 'free' && (rawAmount === null || rawAmount <= 0 || rawAmount > 99999)) return null;
  const amount = partyMode === 'free' ? 0 : Math.round(rawAmount * 100) / 100;
  const hasLimit = cleanBool(firstDefined(payload.hasParticipantLimit, payload.has_participant_limit), true);
  const rawMaxParticipants = parseFiniteNumber(firstDefined(payload.maxParticipants, payload.max_participants));
  if (hasLimit && (!Number.isInteger(rawMaxParticipants) || rawMaxParticipants < 1 || rawMaxParticipants > 500)) return null;
  const maxParticipants = hasLimit ? rawMaxParticipants : 0;
  const next = {
    title: cleanString(payload.title, { min: 1, max: 40 }),
    category: cleanString(payload.category, { max: 32, fallback: 'other' }) || 'other',
    organizer: cleanString(payload.organizer, { max: 40 }),
    cover: cleanUrl(payload.cover || payload.image),
    image: cleanUrl(payload.image || payload.cover),
    date: cleanString(payload.date, { min: 1, max: 20 }),
    time: cleanString(payload.time, { min: 1, max: 20 }),
    end_time: cleanString(payload.endTime || payload.end_time, { max: 20 }),
    location: cleanString(payload.location, { min: 1, max: 120 }),
    address: cleanString(payload.address, { max: 200 }),
    city: cleanString(payload.city, { max: 40 }),
    city_code: cleanString(payload.cityCode || payload.city_code, { max: 20 }),
    district: cleanString(payload.district, { max: 40 }),
    latitude: cleanNumber(payload.latitude, { min: -90, max: 90, fallback: 0 }),
    longitude: cleanNumber(payload.longitude, { min: -180, max: 180, fallback: 0 }),
    max_participants: maxParticipants,
    maxParticipants,
    has_participant_limit: hasLimit,
    hasParticipantLimit: hasLimit,
    require_approval: cleanBool(firstDefined(payload.requireApproval, payload.require_approval), true),
    requireApproval: cleanBool(firstDefined(payload.requireApproval, payload.require_approval), true),
    party_mode: partyMode,
    partyMode,
    amount,
    description: cleanString(payload.description, { min: 1, max: 300 }),
    questions: normalizeQuestionList(payload.questions),
    updated_at: now()
  };
  if (!next.title || !next.date || !next.time || !next.location || !next.description) {
    return null;
  }
  if (options.create) {
    next.status = 'reviewing';
    next.moderation_status = 'pending';
    next.created_at = now();
  } else {
    next.status = 'reviewing';
    next.moderation_status = 'pending';
  }
  return next;
}

async function main(event) {
  const action = event.action;
  const payload = event.payload || {};
  const user = await optionalAuth(event);

  if (action === 'list') {
    const requestedLimit = normalizeLimit(payload.limit, 20, 50);
    const skip = normalizeSkip(payload.skip || payload.offset);
    const result = await collection.orderBy('created_at', 'desc').skip(skip).limit(Math.min(requestedLimit * 5, 100)).get();
    const items = normalizeList(result).filter(isPubliclyVisibleActivity).slice(0, requestedLimit);
    return ok({
      items,
      page: {
        limit: requestedLimit,
        skip,
        nextSkip: items.length === requestedLimit ? skip + requestedLimit : null
      }
    });
  }

  if (action === 'detail') {
    const result = await collection.doc(payload.id).get();
    const activity = normalizeActivity((result.data || [])[0]);
    if (!activity?.id) {
      return ok(null);
    }
    const canView = isPubliclyVisibleActivity(activity)
      || (user && (user.isOps || String(activity.creator_id || activity.creatorId || '') === user.uid));
    if (!canView) {
      return forbidden('This activity is not publicly visible.');
    }
    return ok(activity);
  }

  if (action === 'listMine') {
    const currentUser = await requireAuth(event);
    if (!currentUser) return authRequired();
    const [createdSnakeResult, createdCamelResult, snakeApplicationResult, camelApplicationResult] = await Promise.all([
      collection.where({ creator_id: currentUser.uid }).orderBy('created_at', 'desc').limit(normalizeLimit(payload.limit, 100, 100)).get(),
      collection.where({ creatorId: currentUser.uid }).orderBy('created_at', 'desc').limit(normalizeLimit(payload.limit, 100, 100)).get(),
      applications.where({ user_id: currentUser.uid }).orderBy('created_at', 'desc').limit(normalizeLimit(payload.limit, 100, 100)).get(),
      applications.where({ userId: currentUser.uid }).orderBy('created_at', 'desc').limit(normalizeLimit(payload.limit, 100, 100)).get()
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
    const seenCreated = new Set();
    const createdItems = [...(createdSnakeResult.data || []), ...(createdCamelResult.data || [])].filter((item) => {
      const key = String(item._id || item.id || '');
      if (!key || seenCreated.has(key)) return false;
      seenCreated.add(key);
      return true;
    });
    const joined = (joinedResult.data || []).map(withApplicationStatus);
    return ok({
        hosting: createdItems.map(normalizeActivity),
        joined: joined.filter((item) => item.applicationStatus === 'approved'),
        pending: joined.filter((item) => item.applicationStatus === 'pending'),
        rejected: joined.filter((item) => item.applicationStatus === 'rejected')
    });
  }

  if (action === 'create') {
    const currentUser = await requireAuth(event);
    if (!currentUser) return authRequired();
    const activity = sanitizeActivityPayload(payload, { create: true });
    if (!activity) return invalid('Activity title, date, time, location and description are required.');
    activity.creatorId = currentUser.uid;
    activity.creator_id = currentUser.uid;
    const result = await collection.add(activity);
    return ok(normalizeActivity({
        ...activity,
        id: result.id
    }));
  }

  if (action === 'update') {
    const currentUser = await requireAuth(event);
    if (!currentUser) return authRequired();
    const id = cleanId(payload.id);
    if (!id || !(await canEditActivity(id, currentUser))) {
      return forbidden('Only the creator can edit this activity.');
    }
    const existingResult = await collection.doc(id).get();
    const existing = (existingResult.data || [])[0];
    const clientVersion = payload.version || payload.updatedAt || payload.updated_at;
    if (clientVersion && existing?.updated_at && String(clientVersion) !== String(existing.updated_at)) {
      return { code: 'VERSION_CONFLICT', message: 'Activity has been updated. Please reload before saving.' };
    }
    const updatePayload = sanitizeActivityPayload(payload);
    if (!updatePayload) return invalid('Activity title, date, time, location and description are required.');
    updatePayload.creatorId = currentUser.uid;
    updatePayload.creator_id = currentUser.uid;
    await collection.doc(id).update(updatePayload);
    return ok(normalizeActivity({
        ...updatePayload,
        id
    }));
  }

  if (action === 'updateStatus') {
    const currentUser = await requireAuth(event);
    if (!currentUser) return authRequired();
    const existing = await getCreatorActivity(cleanId(payload.id), currentUser);
    if (!existing) {
      return forbidden('Only the creator can update this activity.');
    }
    const nextStatus = normalizeStatus(payload.status);
    if (!canTransitionStatus(existing, nextStatus)) {
      return invalid('Invalid activity status transition.');
    }
    await collection.doc(payload.id).update({
      status: nextStatus,
      ...(nextStatus === 'reviewing' ? { moderation_status: 'pending' } : {}),
      updated_at: now()
    });
    return ok({
        id: payload.id,
        status: nextStatus
    });
  }

  return unknownAction();
}

exports.main = (event) => withSafeHandler(event, () => main(event));
