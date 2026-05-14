'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const posts = db.collection('surego-partner-posts');
const intents = db.collection('surego-partner-intents');
const follows = db.collection('surego-follows');
const conversations = db.collection('surego-conversations');
const messages = db.collection('surego-messages');
const activities = db.collection('surego-activities');
const activityApplications = db.collection('surego-applications');
const uniIdUsers = db.collection('uni-id-users');

const postTypes = ['time_box', 'long_term', 'project'];
const postStatuses = ['open', 'matched', 'converted', 'paused', 'closed'];
const intentStatuses = ['pending', 'accepted', 'rejected'];

function now() {
  return Date.now();
}

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
    isOps: roles.includes('admin') || roles.includes('operator'),
    profile: userRecord || {}
  };
}

function authRequired() {
  return {
    code: 'AUTH_REQUIRED',
    message: 'Please login before operating SureGo partner data.'
  };
}

function normalizeType(type = 'time_box') {
  return postTypes.includes(type) ? type : 'time_box';
}

function normalizePostStatus(status = 'open') {
  return postStatuses.includes(status) ? status : 'open';
}

function normalizeIntentStatus(status = 'pending') {
  return intentStatuses.includes(status) ? status : 'pending';
}

function normalizeTags(tags) {
  return Array.isArray(tags) ? tags.map(String).filter(Boolean).slice(0, 6) : [];
}

function normalizePost(record = {}) {
  return {
    ...record,
    id: record._id || record.id,
    type: normalizeType(record.type),
    creatorId: record.creator_id || record.creatorId || '',
    creator_id: record.creator_id || record.creatorId || '',
    typeLabel: record.type_label || record.typeLabel || '',
    connectionMode: record.connection_mode || record.connectionMode || '',
    fitTags: record.fit_tags || record.fitTags || [],
    intentCount: Number(record.intent_count || record.intentCount) || 0,
    followCount: Number(record.follow_count || record.followCount) || 0,
    status: normalizePostStatus(record.status),
    createdAt: record.created_at || record.createdAt || '',
    updatedAt: record.updated_at || record.updatedAt || ''
  };
}

function normalizeIntent(record = {}) {
  return {
    ...record,
    id: record._id || record.id,
    partnerPostId: record.partner_post_id || record.partnerPostId || '',
    partner_post_id: record.partner_post_id || record.partnerPostId || '',
    userId: record.user_id || record.userId || '',
    user_id: record.user_id || record.userId || '',
    status: normalizeIntentStatus(record.status),
    conversationId: record.conversation_id || record.conversationId || '',
    conversation_id: record.conversation_id || record.conversationId || '',
    createdAt: record.created_at || record.createdAt || '',
    updatedAt: record.updated_at || record.updatedAt || ''
  };
}

function normalizeConversation(record = {}) {
  return {
    ...record,
    id: record._id || record.id,
    partnerPostId: record.partner_post_id || record.partnerPostId || '',
    partner_post_id: record.partner_post_id || record.partnerPostId || '',
    participantIds: record.participant_ids || record.participantIds || [],
    participant_ids: record.participant_ids || record.participantIds || [],
    status: record.status || 'open',
    lastMessage: record.last_message || record.lastMessage || '',
    createdAt: record.created_at || record.createdAt || '',
    updatedAt: record.updated_at || record.updatedAt || ''
  };
}

function buildPostRecord(payload = {}, user = {}) {
  return {
    title: String(payload.title || '').trim(),
    type: normalizeType(payload.type),
    creator_id: user.uid,
    creator: payload.creator || user.profile.nickname || user.profile.username || 'SureGo 用户',
    avatar: payload.avatar || user.profile.avatar || user.profile.avatar_file?.url || '/static/userImg/user.png',
    city: payload.city || '杭州',
    location: payload.location || '',
    schedule: payload.schedule || '',
    connection_mode: payload.connectionMode || payload.connection_mode || '',
    description: payload.description || '',
    expectation: payload.expectation || '',
    fit_tags: normalizeTags(payload.fitTags || payload.fit_tags || payload.tags),
    status: normalizePostStatus(payload.status || 'open'),
    intent_count: Number(payload.intentCount || payload.intent_count) || 0,
    follow_count: Number(payload.followCount || payload.follow_count) || 0,
    created_at: now(),
    updated_at: now()
  };
}

function buildParticipantIds(post = {}, participantIds = []) {
  const creatorId = String(post.creator_id || post.creatorId || '');
  return Array.from(new Set([creatorId, ...(Array.isArray(participantIds) ? participantIds : []).map(String).filter(Boolean)].filter(Boolean)));
}

function mapPartnerSceneToActivityCategory(scene = '', type = 'time_box') {
  if (scene === 'sport') return '运动';
  if (scene === 'study') return '学习/自习';
  if (scene === 'game') return '游戏/娱乐';
  if (scene === 'project' || type === 'project') return '项目组队';
  return '饭搭子/探店';
}

function buildConvertedActivityRecord(post = {}, payload = {}) {
  const visibility = payload.visibility === 'members_only' ? 'members_only' : 'public';
  const participant_ids = buildParticipantIds(post, payload.participantIds || payload.participant_ids || []);
  const participantCount = participant_ids.length;
  const title = String(payload.title || post.title || '').trim() || '新的成行活动';
  const available = post.available || post.schedule || '时间待定';
  const locationRange = post.locationRange || post.location || '地点待确认';
  return {
    title,
    category: mapPartnerSceneToActivityCategory(post.scene, post.type),
    creator_id: post.creator_id || post.creatorId || '',
    organizer: post.author || post.creator || 'SureGo 用户',
    organizer_avatar: post.avatar || '/static/userImg/user.png',
    cover: '/static/logo.png',
    date: visibility === 'public' ? '本周待定' : '已与成员确认',
    time: available,
    end_time: '',
    location: locationRange,
    address: locationRange,
    city: post.city || '天津',
    city_code: post.city_code || '',
    district: post.district || '',
    latitude: 0,
    longitude: 0,
    max_participants: visibility === 'public' ? Math.max(participantCount + 2, 6) : Math.max(participantCount, 2),
    has_participant_limit: true,
    require_approval: visibility === 'public',
    party_mode: 'free',
    amount: 0,
    description: post.detail || post.description || '',
    questions: [],
    status: visibility === 'public' ? 'recruiting' : 'formed',
    moderation_status: 'approved',
    visibility,
    source: payload.source || 'partner_post',
    source_partner_post_id: post._id || post.id || '',
    participant_ids,
    created_at: now(),
    updated_at: now()
  };
}

function normalizeActivityPayload(id, activity = {}) {
  return {
    ...activity,
    id,
    activityId: id,
    creatorId: activity.creator_id || '',
    visibility: activity.visibility || 'public',
    source: activity.source || 'partner_post',
    sourcePartnerPostId: activity.source_partner_post_id || '',
    participantIds: activity.participant_ids || [],
    createdAt: activity.created_at || '',
    updatedAt: activity.updated_at || '',
    moderationStatus: activity.moderation_status || 'approved'
  };
}

async function createApprovedApplicationsForActivity(activityId = '', participantIds = []) {
  const ids = Array.from(new Set((participantIds || []).map(String).filter(Boolean)));
  if (!activityId || !ids.length) return;
  for (const userId of ids) {
    const existing = await activityApplications.where({ activity_id: activityId, user_id: userId }).limit(1).get();
    if ((existing.data || [])[0]) continue;
    await activityApplications.add({
      activity_id: activityId,
      user_id: userId,
      status: 'approved',
      created_at: now()
    });
  }
}

async function getPost(id) {
  const result = await posts.doc(id).get();
  return (result.data || [])[0] || null;
}

async function canManagePost(id, user) {
  const post = await getPost(id);
  return Boolean(post && (String(post.creator_id || '') === user.uid || user.isOps));
}

async function ensureConversationForIntent(intent = {}, post = {}) {
  const partnerPostId = String(intent.partner_post_id || intent.partnerPostId || '');
  const creatorId = String(post.creator_id || post.creatorId || '');
  const intentUserId = String(intent.user_id || intent.userId || '');
  const participantIds = [creatorId, intentUserId].filter(Boolean);
  const existing = await conversations.where({
    partner_post_id: partnerPostId
  }).limit(1).get();
  const found = (existing.data || []).find((item) => {
    const ids = (item.participant_ids || []).map(String);
    return participantIds.every((id) => ids.includes(String(id)));
  });
  if (found) return normalizeConversation(found);

  const record = {
    partner_post_id: partnerPostId,
    participant_ids: participantIds,
    status: 'open',
    last_message: '搭子意向已通过，可以开始沟通',
    created_at: now(),
    updated_at: now()
  };
  const result = await conversations.add(record);
  return normalizeConversation({
    ...record,
    _id: result.id || result._id
  });
}

async function createMessage(payload = {}) {
  if (!payload.user_id) return null;
  if (payload.event_key) {
    const existing = await messages.where({
      user_id: payload.user_id,
      event_key: payload.event_key
    }).limit(1).get();
    const found = (existing.data || [])[0];
    if (found) return found;
  }
  const record = {
    ...payload,
    read: false,
    created_at: now(),
    updated_at: ''
  };
  const result = await messages.add(record);
  return {
    ...record,
    _id: result.id || result._id
  };
}

exports.main = async (event) => {
  const action = event.action;
  const payload = event.payload || {};
  const user = await resolveUserContext(event, payload);

  if (action === 'listPosts') {
    const requestedLimit = Number(payload.limit) > 0 ? Number(payload.limit) : 50;
    const result = await posts
      .where({ status: dbCmd.in(['open', 'matched']) })
      .orderBy('created_at', 'desc')
      .limit(Math.min(requestedLimit, 100))
      .get();
    return {
      code: 0,
      data: (result.data || []).map(normalizePost)
    };
  }

  if (action === 'detailPost') {
    const post = await getPost(payload.id);
    if (!post) return { code: 0, data: null };
    const canView = ['open', 'matched'].includes(normalizePostStatus(post.status))
      || (user.exists && (user.isOps || String(post.creator_id || '') === user.uid));
    if (!canView) return { code: 'FORBIDDEN', message: 'This partner post is not visible.' };
    return {
      code: 0,
      data: normalizePost(post)
    };
  }

  if (action === 'createPost') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const record = buildPostRecord(payload, user);
    if (!record.title) return { code: 'VALIDATION_ERROR', message: 'Title is required.' };
    if (!record.schedule) return { code: 'VALIDATION_ERROR', message: 'Schedule is required.' };
    if (!record.location) return { code: 'VALIDATION_ERROR', message: 'Location is required.' };
    if (!record.description) return { code: 'VALIDATION_ERROR', message: 'Description is required.' };
    const result = await posts.add(record);
    return {
      code: 0,
      data: normalizePost({
        ...record,
        _id: result.id || result._id
      })
    };
  }

  if (action === 'listMine') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const result = await posts.where({ creator_id: user.uid }).orderBy('created_at', 'desc').limit(payload.limit || 100).get();
    return {
      code: 0,
      data: (result.data || []).map(normalizePost)
    };
  }

  if (action === 'createIntent') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const partnerPostId = String(payload.partnerPostId || payload.partner_post_id || '');
    const post = await getPost(partnerPostId);
    if (!post) return { code: 'NOT_FOUND', message: 'Partner post not found.' };
    if (String(post.creator_id || '') === user.uid) {
      return { code: 'FORBIDDEN', message: 'Creator cannot send intent to own partner post.' };
    }
    const existing = await intents.where({ partner_post_id: partnerPostId, user_id: user.uid }).limit(1).get();
    const found = (existing.data || [])[0];
    if (found) {
      return {
        code: 0,
        data: normalizeIntent(found)
      };
    }
    const record = {
      partner_post_id: partnerPostId,
      user_id: user.uid,
      nickname: user.profile.nickname || user.profile.username || 'SureGo 用户',
      avatar: user.profile.avatar || user.profile.avatar_file?.url || '/static/userImg/user.png',
      message: payload.message || '',
      status: 'pending',
      conversation_id: '',
      created_at: now(),
      updated_at: ''
    };
    const result = await intents.add(record);
    await posts.doc(partnerPostId).update({
      intent_count: dbCmd.inc(1),
      updated_at: now()
    });
    await createMessage({
      user_id: post.creator_id,
      partner_post_id: partnerPostId,
      type: 'partner',
      title: '新的搭子意向',
      content: `${record.nickname} 想和你建立连接`,
      event_key: `partner:intent:${partnerPostId}:${user.uid}`
    });
    return {
      code: 0,
      data: normalizeIntent({
        ...record,
        _id: result.id || result._id
      })
    };
  }

  if (action === 'listIntents') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const partnerPostId = String(payload.partnerPostId || payload.partner_post_id || '');
    if (!(await canManagePost(partnerPostId, user))) {
      return { code: 'FORBIDDEN', message: 'Only the creator can view partner intents.' };
    }
    const result = await intents.where({ partner_post_id: partnerPostId }).orderBy('created_at', 'desc').get();
    return {
      code: 0,
      data: (result.data || []).map(normalizeIntent)
    };
  }

  if (action === 'updateIntentStatus') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const existingResult = await intents.doc(payload.id).get();
    const intent = (existingResult.data || [])[0];
    if (!intent) return { code: 'NOT_FOUND', message: 'Partner intent not found.' };
    const post = await getPost(intent.partner_post_id);
    if (!post || (String(post.creator_id || '') !== user.uid && !user.isOps)) {
      return { code: 'FORBIDDEN', message: 'Only the creator can review partner intents.' };
    }
    const status = normalizeIntentStatus(payload.status);
    const conversation = status === 'accepted'
      ? await ensureConversationForIntent(intent, post)
      : null;
    await intents.doc(payload.id).update({
      status,
      ...(conversation?.id ? { conversation_id: conversation.id } : {}),
      updated_at: now()
    });
    await createMessage({
      user_id: intent.user_id,
      partner_post_id: intent.partner_post_id,
      ...(conversation?.id ? { conversation_id: conversation.id } : {}),
      type: 'partner',
      title: status === 'accepted' ? '搭子意向已通过' : '搭子意向已处理',
      content: status === 'accepted' ? '对方通过了你的搭子意向' : '对方已处理你的搭子意向',
      event_key: `partner:intent-review:${payload.id}:${status}`
    });
    return {
      code: 0,
      data: normalizeIntent({
        ...intent,
        status,
        ...(conversation?.id ? { conversation_id: conversation.id } : {}),
        updated_at: now()
      })
    };
  }

  if (action === 'getConversation') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const result = await conversations.doc(payload.id).get();
    const conversation = (result.data || [])[0];
    if (!conversation) return { code: 0, data: null };
    const participantIds = (conversation.participant_ids || []).map(String);
    if (!participantIds.includes(user.uid) && !user.isOps) {
      return { code: 'FORBIDDEN', message: 'You cannot view this conversation.' };
    }
    return {
      code: 0,
      data: normalizeConversation(conversation)
    };
  }

  if (action === 'listConversations') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const result = await conversations.where({
      participant_ids: user.uid
    }).orderBy('updated_at', 'desc').limit(payload.limit || 100).get();
    return {
      code: 0,
      data: (result.data || []).map(normalizeConversation)
    };
  }

  if (action === 'ensureGroupConversation') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const partnerPostId = String(payload.partnerPostId || payload.partner_post_id || '');
    const post = await getPost(partnerPostId);
    if (!post || (String(post.creator_id || '') !== user.uid && !user.isOps)) {
      return { code: 'FORBIDDEN', message: 'Only the creator can create a partner group conversation.' };
    }
    const participant_ids = buildParticipantIds(post, payload.participantIds || payload.participant_ids || []);
    const existingResult = await conversations.where({
      partner_post_id: partnerPostId
    }).limit(20).get();
    const found = (existingResult.data || []).find((item) => {
      const ids = (item.participant_ids || []).map(String).sort();
      return item.status === 'group' && ids.join(',') === [...participant_ids].sort().join(',');
    });
    if (found) {
      return { code: 0, data: normalizeConversation(found) };
    }
    const record = {
      partner_post_id: partnerPostId,
      participant_ids,
      status: 'group',
      last_message: '已为这次搭子沟通创建临时群聊，可统一确认时间、地点和注意事项。',
      created_at: now(),
      updated_at: now()
    };
    const result = await conversations.add(record);
    return {
      code: 0,
      data: normalizeConversation({
        ...record,
        _id: result.id || result._id
      })
    };
  }

  if (action === 'convertToActivity') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const partnerPostId = String(payload.partnerPostId || payload.partner_post_id || '');
    const post = await getPost(partnerPostId);
    if (!post || (String(post.creator_id || '') !== user.uid && !user.isOps)) {
      return { code: 'FORBIDDEN', message: 'Only the creator can convert this partner post.' };
    }
    const requestedParticipantPayload = {
      participant_ids: payload.participantIds || payload.participant_ids || []
    };
    const activity = buildConvertedActivityRecord(post, {
      ...payload,
      ...requestedParticipantPayload
    });
    const addResult = await activities.add(activity);
    const activityId = addResult.id || addResult._id;
    await createApprovedApplicationsForActivity(
      activityId,
      (activity.participant_ids || []).filter((userId) => String(userId) !== String(post.creator_id || ''))
    );
    await posts.doc(partnerPostId).update({
      status: 'converted',
      source_activity_id: activityId,
      updated_at: now()
    });
    await Promise.all((activity.participant_ids || [])
      .filter((userId) => String(userId) !== String(post.creator_id || ''))
      .map((userId) => createMessage({
        user_id: userId,
        partner_post_id: partnerPostId,
        activity_id: activityId,
        type: 'activity',
        title: activity.visibility === 'public' ? '已约成公开活动' : '已约成私密活动',
        content: activity.visibility === 'public'
          ? '你们已约成新的活动，后续还可以继续公开招人。'
          : '你们已约成新的私密活动，只有相关成员可以看到。',
        event_key: `partner:converted:${activityId}:${userId}`
      })));
    return {
      code: 0,
      data: {
        ...normalizeActivityPayload(activityId, activity),
        source_partner_post_id: partnerPostId
      }
    };
  }

  if (action === 'followPost') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const partnerPostId = String(payload.partnerPostId || payload.partner_post_id || '');
    const existing = await follows.where({
      target_type: 'partner_post',
      target_id: partnerPostId,
      user_id: user.uid
    }).limit(1).get();
    const found = (existing.data || [])[0];
    if (found) return { code: 0, data: found };
    const record = {
      target_type: 'partner_post',
      target_id: partnerPostId,
      user_id: user.uid,
      created_at: now()
    };
    const result = await follows.add(record);
    await posts.doc(partnerPostId).update({
      follow_count: dbCmd.inc(1),
      updated_at: now()
    });
    return {
      code: 0,
      data: {
        ...record,
        id: result.id || result._id
      }
    };
  }

  return {
    code: 'UNKNOWN_ACTION',
    message: `Unsupported action: ${action}`
  };
};
