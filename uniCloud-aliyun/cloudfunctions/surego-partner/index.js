'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const posts = db.collection('surego-partner-posts');
const intents = db.collection('surego-partner-intents');
const follows = db.collection('surego-follows');
const conversations = db.collection('surego-conversations');
const messages = db.collection('surego-messages');
const activities = db.collection('surego-activities');
const uniIdUsers = db.collection('uni-id-users');

const postTypes = ['time_box', 'long_term', 'project'];
const postStatuses = ['open', 'matched', 'converted', 'paused', 'closed'];
const postModerationStatuses = ['pending', 'approved', 'rejected', 'hidden', 'visible'];
const publicPostModerationStatuses = ['approved', 'visible'];
const intentStatuses = ['pending', 'accepted', 'rejected'];
const topicOptions = {
  hackathon: '黑客松组队',
  course: '课程作业',
  startup: '创业 Demo'
};

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

function normalizePostModerationStatus(status = 'pending') {
  return postModerationStatuses.includes(status) ? status : 'pending';
}

function normalizeIntentStatus(status = 'pending') {
  return intentStatuses.includes(status) ? status : 'pending';
}

function normalizeTags(tags) {
  return Array.isArray(tags) ? tags.map(String).filter(Boolean).slice(0, 6) : [];
}

function normalizeImages(images) {
  const items = Array.isArray(images) ? images : [images];
  return items
    .map((item) => {
      if (typeof item === 'string') return { url: item, fileID: item };
      const url = String(item?.url || item?.fileID || item?.file_id || item?.src || '').trim();
      if (!url) return null;
      return {
        url,
        fileID: item.fileID || item.file_id || url
      };
    })
    .filter(Boolean)
    .slice(0, 9);
}

function normalizeWechatQr(value) {
  return normalizeImages(value)[0] || null;
}

function getWechatQrUrl(record = {}) {
  const direct = String(record.wechat_qr_url || record.wechatQrUrl || '').trim();
  if (direct) return direct;
  return normalizeWechatQr(record.wechat_qr || record.wechatQr)?.url || '';
}

function canViewPostWechat(post = {}, user = {}, viewerIntentStatus = '') {
  if (user.exists && (user.isOps || String(post.creator_id || post.creatorId || '') === user.uid)) return true;
  return viewerIntentStatus === 'accepted';
}

function sanitizePostContactFields(record = {}, options = {}) {
  const canViewWechat = Boolean(options.canViewWechat);
  const wechatId = String(record.wechat_id || record.wechatId || '').trim();
  const wechatQrUrl = getWechatQrUrl(record);
  const wechatQr = normalizeWechatQr(record.wechat_qr || record.wechatQr || wechatQrUrl);
  return {
    wechatId: canViewWechat ? wechatId : '',
    wechat_id: canViewWechat ? wechatId : '',
    wechatQr: canViewWechat ? wechatQr : null,
    wechat_qr: canViewWechat ? wechatQr : null,
    wechatQrUrl: canViewWechat ? wechatQrUrl : '',
    wechat_qr_url: canViewWechat ? wechatQrUrl : '',
    canViewWechat
  };
}

function normalizeTopicKey(topicKey = '') {
  const key = String(topicKey || '').trim();
  return Object.prototype.hasOwnProperty.call(topicOptions, key) ? key : '';
}

function getTopicLabel(topicKey = '') {
  const key = normalizeTopicKey(topicKey);
  return key ? topicOptions[key] : '';
}

function normalizeFilterList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  return String(value || '').split(/[,\s，、]+/).map((item) => item.trim()).filter(Boolean);
}

function buildPostFilterText(record = {}) {
  return [
    record.title,
    record.scene,
    record.type,
    record.type_label,
    record.typeLabel,
    record.topic_key,
    record.topicKey,
    record.topic_label,
    record.topicLabel,
    record.description,
    record.detail,
    record.expectation,
    record.location,
    record.schedule,
    ...(Array.isArray(record.fit_tags || record.fitTags) ? (record.fit_tags || record.fitTags) : []),
    ...(Array.isArray(record.tags) ? record.tags : []),
    ...(Array.isArray(record.wants) ? record.wants : [])
  ].map((entry) => String(entry || '').toLowerCase()).join(' ');
}

function matchesPostTextFilters(record = {}, payload = {}) {
  const topicKey = normalizeTopicKey(payload.topicKey || payload.topic_key);
  const legacyTagsAny = normalizeFilterList(payload.legacyTagsAny || payload.legacy_tags_any);
  if (topicKey && normalizeTopicKey(record.topic_key || record.topicKey) !== topicKey) {
    if (legacyTagsAny.length === 0) return false;
    const legacyText = buildPostFilterText(record);
    if (!legacyTagsAny.some((tag) => legacyText.includes(String(tag).toLowerCase()))) return false;
  }

  const keyword = String(payload.keyword || '').trim().toLowerCase();
  const tagsAny = normalizeFilterList(payload.tagsAny || payload.tags_any);
  if (!keyword && tagsAny.length === 0) return true;

  const filterText = buildPostFilterText(record);
  if (keyword && !filterText.includes(keyword)) return false;
  if (tagsAny.length > 0 && !tagsAny.some((tag) => filterText.includes(String(tag).toLowerCase()))) return false;
  return true;
}

function buildListPostWhere(payload = {}) {
  const where = {
    status: dbCmd.in(['open', 'matched']),
    moderation_status: dbCmd.in(publicPostModerationStatuses)
  };
  const type = String(payload.type || '').trim();
  if (type && postTypes.includes(type)) {
    where.type = type;
  }
  const scene = String(payload.scene || '').trim();
  if (scene) {
    where.scene = scene;
  }
  const topicKey = normalizeTopicKey(payload.topicKey || payload.topic_key);
  const hasLegacyTopicFallback = normalizeFilterList(payload.legacyTagsAny || payload.legacy_tags_any).length > 0;
  if (topicKey && !hasLegacyTopicFallback) {
    where.topic_key = topicKey;
  }
  return where;
}

function isPubliclyVisiblePost(record = {}) {
  return ['open', 'matched'].includes(normalizePostStatus(record.status))
    && publicPostModerationStatuses.includes(normalizePostModerationStatus(record.moderation_status || record.moderationStatus));
}

function normalizePost(record = {}, options = {}) {
  const viewerIntent = record.viewerIntent || record.viewer_intent || null;
  const viewerIntentStatus = record.viewerIntentStatus || record.viewer_intent_status || viewerIntent?.status || '';
  const viewerConversationId = record.viewerConversationId || record.viewer_conversation_id || viewerIntent?.conversationId || viewerIntent?.conversation_id || '';
  const images = normalizeImages(record.images || record.image || record.cover);
  const primaryImage = record.image || record.cover || images[0]?.url || '';
  const contactFields = sanitizePostContactFields(record, options);
  return {
    ...record,
    id: record._id || record.id,
    type: normalizeType(record.type),
    topicKey: record.topic_key || record.topicKey || '',
    topic_key: record.topic_key || record.topicKey || '',
    topicLabel: record.topic_label || record.topicLabel || getTopicLabel(record.topic_key || record.topicKey),
    topic_label: record.topic_label || record.topicLabel || getTopicLabel(record.topic_key || record.topicKey),
    creatorId: record.creator_id || record.creatorId || '',
    creator_id: record.creator_id || record.creatorId || '',
    typeLabel: record.type_label || record.typeLabel || '',
    images,
    image: primaryImage,
    cover: record.cover || primaryImage,
    connectionMode: record.connection_mode || record.connectionMode || '',
    address: record.address || '',
    latitude: record.latitude || '',
    longitude: record.longitude || '',
    ...contactFields,
    fitTags: record.fit_tags || record.fitTags || [],
    intentCount: Number(record.intent_count || record.intentCount) || 0,
    followCount: Number(record.follow_count || record.followCount) || 0,
    viewerIntent,
    viewer_intent: viewerIntent,
    viewerIntentStatus,
    viewer_intent_status: viewerIntentStatus,
    viewerConversationId,
    viewer_conversation_id: viewerConversationId,
    status: normalizePostStatus(record.status),
    moderationStatus: normalizePostModerationStatus(record.moderation_status || record.moderationStatus),
    moderation_status: normalizePostModerationStatus(record.moderation_status || record.moderationStatus),
    moderationNote: record.moderation_note || record.moderationNote || '',
    moderation_note: record.moderation_note || record.moderationNote || '',
    moderatedAt: record.moderated_at || record.moderatedAt || '',
    moderated_at: record.moderated_at || record.moderatedAt || '',
    moderatedBy: record.moderated_by || record.moderatedBy || '',
    moderated_by: record.moderated_by || record.moderatedBy || '',
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
  const topicKey = normalizeTopicKey(payload.topicKey || payload.topic_key);
  const images = normalizeImages(payload.images || payload.image || payload.cover);
  const primaryImage = payload.image || payload.cover || images[0]?.url || '';
  const wechatQr = normalizeWechatQr(payload.wechatQr || payload.wechat_qr || payload.wechatQrUrl || payload.wechat_qr_url);
  const wechatQrUrl = getWechatQrUrl({
    wechatQr,
    wechatQrUrl: payload.wechatQrUrl || payload.wechat_qr_url
  });
  return {
    title: String(payload.title || '').trim(),
    type: normalizeType(payload.type),
    kind: payload.kind || '',
    scene: payload.scene || '',
    type_label: payload.typeLabel || payload.type_label || '',
    topic_key: topicKey,
    topic_label: payload.topicLabel || payload.topic_label || getTopicLabel(topicKey),
    creator_id: user.uid,
    creator: payload.creator || user.profile.nickname || user.profile.username || 'SureGo 用户',
    avatar: payload.avatar || user.profile.avatar || user.profile.avatar_file?.url || '/static/userImg/user.png',
    images: normalizeImages(payload.images || payload.image || payload.cover),
    image: primaryImage,
    cover: primaryImage,
    city: payload.city || '杭州',
    location: payload.location || '',
    address: payload.address || '',
    latitude: payload.latitude || '',
    longitude: payload.longitude || '',
    wechat_id: String(payload.wechatId || payload.wechat_id || '').trim(),
    wechat_qr: wechatQr || {},
    wechat_qr_url: wechatQrUrl,
    schedule: payload.schedule || '',
    connection_mode: payload.connectionMode || payload.connection_mode || '',
    description: payload.description || '',
    expectation: payload.expectation || '',
    fit_tags: normalizeTags(payload.fitTags || payload.fit_tags || payload.tags),
    status: 'open',
    moderation_status: 'pending',
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

function normalizeIdList(ids = []) {
  return Array.from(new Set((Array.isArray(ids) ? ids : []).map(String).filter(Boolean)));
}

function buildInvitedUserIds(post = {}, payload = {}) {
  const creatorId = String(post.creator_id || post.creatorId || '');
  return normalizeIdList(payload.invitedUserIds || payload.invited_user_ids || payload.participantIds || payload.participant_ids || [])
    .filter((userId) => String(userId) !== creatorId);
}

function buildSourcePartnerIntentIds(payload = {}) {
  return normalizeIdList(payload.sourcePartnerIntentIds || payload.source_partner_intent_ids || []);
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
  const participant_ids = buildParticipantIds(post, payload.confirmedParticipantIds || payload.confirmed_participant_ids || []);
  const invited_user_ids = buildInvitedUserIds(post, payload);
  const source_partner_intent_ids = buildSourcePartnerIntentIds(payload);
  const participantCount = participant_ids.length;
  const plannedCount = Math.max(participantCount + invited_user_ids.length, 1);
  const title = String(payload.title || post.title || '').trim() || '新的成行活动';
  const available = payload.time || post.available || post.schedule || '时间待定';
  const locationRange = payload.location || post.locationRange || post.location || '地点待确认';
  const maxParticipants = Number(payload.maxParticipants || payload.max_participants) || (visibility === 'public' ? Math.max(plannedCount + 2, 6) : Math.max(plannedCount, 2));
  return {
    title,
    category: mapPartnerSceneToActivityCategory(post.scene, post.type),
    creator_id: post.creator_id || post.creatorId || '',
    organizer: post.author || post.creator || 'SureGo 用户',
    organizer_avatar: post.avatar || '/static/userImg/user.png',
    cover: '/static/logo.png',
    date: payload.date || (visibility === 'public' ? '本周待定' : '待邀请确认'),
    time: available,
    end_time: '',
    location: locationRange,
    address: locationRange,
    city: post.city || '天津',
    city_code: post.city_code || '',
    district: post.district || '',
    latitude: 0,
    longitude: 0,
    max_participants: maxParticipants,
    has_participant_limit: true,
    require_approval: visibility === 'public',
    party_mode: 'free',
    amount: Number(payload.amount) || 0,
    description: payload.description || post.detail || post.description || '',
    questions: [],
    status: 'reviewing',
    moderation_status: 'pending',
    visibility,
    source: payload.source || 'partner_post',
    source_partner_post_id: post._id || post.id || '',
    source_partner_intent_ids,
    invited_user_ids,
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
    sourcePartnerIntentIds: activity.source_partner_intent_ids || [],
    source_partner_intent_ids: activity.source_partner_intent_ids || [],
    invitedUserIds: activity.invited_user_ids || [],
    invited_user_ids: activity.invited_user_ids || [],
    participantIds: activity.participant_ids || [],
    createdAt: activity.created_at || '',
    updatedAt: activity.updated_at || '',
    moderationStatus: activity.moderation_status || 'pending'
  };
}

async function getPost(id) {
  const result = await posts.doc(id).get();
  return (result.data || [])[0] || null;
}

async function canManagePost(id, user) {
  const post = await getPost(id);
  return Boolean(post && (String(post.creator_id || '') === user.uid || user.isOps));
}

async function findViewerIntentForPost(partnerPostId, user = {}) {
  if (!user.exists || !user.uid || user.uid === 'mock_user') return null;
  const result = await intents.where({
    partner_post_id: String(partnerPostId || ''),
    user_id: user.uid
  }).limit(1).get();
  const found = (result.data || [])[0];
  return found ? normalizeIntent(found) : null;
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
    const needsTextFilter = Boolean(String(payload.keyword || '').trim() || normalizeFilterList(payload.tagsAny || payload.tags_any).length);
    const queryLimit = needsTextFilter ? 100 : Math.min(requestedLimit, 100);
    const result = await posts
      .where(buildListPostWhere(payload))
      .orderBy('created_at', 'desc')
      .limit(queryLimit)
      .get();
    const items = (result.data || [])
      .filter((item) => matchesPostTextFilters(item, payload))
      .slice(0, Math.min(requestedLimit, 100));
    return {
      code: 0,
      data: items.map(normalizePost)
    };
  }

  if (action === 'detailPost') {
    const post = await getPost(payload.id);
    if (!post) return { code: 0, data: null };
    const canView = isPubliclyVisiblePost(post)
      || (user.exists && (user.isOps || String(post.creator_id || '') === user.uid));
    if (!canView) return { code: 'FORBIDDEN', message: 'This partner post is not visible.' };
    const viewerIntent = await findViewerIntentForPost(payload.id, user);
    const viewerIntentStatus = viewerIntent?.status || '';
    const canViewWechat = canViewPostWechat(post, user, viewerIntentStatus);
    return {
      code: 0,
      data: normalizePost({
        ...post,
        viewerIntent,
        viewer_intent: viewerIntent,
        viewerIntentStatus,
        viewer_intent_status: viewerIntentStatus,
        viewerConversationId: viewerIntent?.conversationId || viewerIntent?.conversation_id || '',
        viewer_conversation_id: viewerIntent?.conversationId || viewerIntent?.conversation_id || ''
      }, { canViewWechat })
    };
  }

  if (action === 'createPost') {
    if (!user.exists || !user.uid || user.uid === 'mock_user') return authRequired();
    const rawTopicKey = String(payload.topicKey || payload.topic_key || '').trim();
    if (rawTopicKey && !normalizeTopicKey(rawTopicKey)) {
      return { code: 'VALIDATION_ERROR', message: 'Unsupported partner post topic.' };
    }
    const record = buildPostRecord(payload, user);
    if (!record.title) return { code: 'VALIDATION_ERROR', message: 'Title is required.' };
    if (!record.description) return { code: 'VALIDATION_ERROR', message: 'Description is required.' };
    const result = await posts.add(record);
    return {
      code: 0,
      data: normalizePost({
        ...record,
        _id: result.id || result._id
      }, { canViewWechat: true })
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
    if (!isPubliclyVisiblePost(post)) {
      return { code: 'POST_NOT_VISIBLE', message: 'Partner post is not open for intents.' };
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
    const activity = buildConvertedActivityRecord(post, payload);
    const addResult = await activities.add(activity);
    const activityId = addResult.id || addResult._id;
    await posts.doc(partnerPostId).update({
      status: 'converted',
      source_activity_id: activityId,
      updated_at: now()
    });
    await Promise.all((activity.invited_user_ids || [])
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
