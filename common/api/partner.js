import { partnerPosts, findPartnerPostById } from '@/common/mock/partners.js'
import { USE_UNICLOUD, shouldUseReferenceMockPreview } from '../config/runtime.js'
import { callSuregoFunction, handleSuregoCloudError } from '@/common/api/cloud.js'
import { getCurrentUserId, getCurrentUserProfile } from '@/common/api/auth.js'
import { createMessage } from '@/common/api/message.js'

const POSTS_KEY = 'surego_partner_posts'
const INTENTS_KEY = 'surego_partner_intents'
const FOLLOWS_KEY = 'surego_partner_follows'
const CONVERSATIONS_KEY = 'surego_partner_conversations'
const ACTIVITIES_KEY = 'surego_created_activities'
const DEFAULT_AVATAR = '/static/userImg/user.png'
export const HACKATHON_TOPIC_KEY = 'hackathon'
export const PARTNER_TOPIC_OPTIONS = [
  { key: '', label: '普通项目', description: '默认项目组队，不进入专题专区' },
  { key: HACKATHON_TOPIC_KEY, label: '黑客松/赛事', description: '发布到黑客松组队专区' },
  { key: 'course', label: '课程作业', description: '课程项目、作业 Demo 或课堂展示组队' },
  { key: 'startup', label: '创业 Demo', description: '创业想法验证、商业计划或 Demo 组队' }
]
export const HACKATHON_PARTNER_TAGS = ['黑客松', '赛事', 'AI', '48h']
const DEFAULT_PARTNER_ACTIVITY_IMAGES = {
  sport: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Shuttlecock_on_a_badminton_court.jpg/1024px-Shuttlecock_on_a_badminton_court.jpg',
  photo: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=900',
  study: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=900',
  project: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=900',
  game: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=900',
  food: 'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?auto=format&fit=crop&q=80&w=900'
}
const REFERENCE_PREVIEW_OWNER_IDS = ['mock_user']
const REFERENCE_CONVERSATIONS = [
  {
    id: 'conv_canteen_rice',
    partnerPostId: 'canteen-rice-buddy',
    partner_post_id: 'canteen-rice-buddy',
    participantIds: ['mock_user', 'seed_food'],
    participant_ids: ['mock_user', 'seed_food'],
    status: 'open',
    lastMessage: '南门饭搭子已通过你的意向，可以先确认今晚 18:10 的集合时间。',
    createdAt: '2026-05-12T21:30:00.000Z',
    updatedAt: '2026-05-12T21:30:00.000Z'
  },
  {
    id: 'conv_switch_party',
    partnerPostId: 'switch-party',
    partner_post_id: 'switch-party',
    participantIds: ['mock_user', 'seed_switch', 'seed_xiaozhou'],
    participant_ids: ['mock_user', 'seed_switch', 'seed_xiaozhou'],
    status: 'group',
    lastMessage: 'Switch 派对当前 5 人，发起人正在确认最后 1 个名额。',
    createdAt: '2026-05-12T19:30:00.000Z',
    updatedAt: '2026-05-12T19:30:00.000Z'
  },
  {
    id: 'conv_weekly_lina',
    partnerPostId: 'weekly-badminton',
    partner_post_id: 'weekly-badminton',
    participantIds: ['mock_user', 'seed_lina'],
    participant_ids: ['mock_user', 'seed_lina'],
    status: 'open',
    lastMessage: '意向已通过，可以先确认第一次练球时间。',
    createdAt: '2026-05-14T13:35:00.000Z',
    updatedAt: '2026-05-14T13:35:00.000Z'
  },
  {
    id: 'conv_weekly_chen',
    partnerPostId: 'weekly-badminton',
    partner_post_id: 'weekly-badminton',
    participantIds: ['mock_user', 'seed_chen'],
    participant_ids: ['mock_user', 'seed_chen'],
    status: 'open',
    lastMessage: '双方已建立私聊，等待发起人确认是否邀请进活动。',
    createdAt: '2026-05-14T14:15:00.000Z',
    updatedAt: '2026-05-14T14:15:00.000Z'
  },
  {
    id: 'conv_photo_xinyi',
    partnerPostId: 'photo-graduation-owner',
    partner_post_id: 'photo-graduation-owner',
    participantIds: ['mock_user', 'seed_xinyi'],
    participant_ids: ['mock_user', 'seed_xinyi'],
    status: 'open',
    lastMessage: '可以先确认拍摄路线，再决定是否约成毕业季活动。',
    createdAt: '2026-05-14T17:08:00.000Z',
    updatedAt: '2026-05-14T17:08:00.000Z'
  }
]

const REFERENCE_INTENTS = [
  {
    id: 'intent_weekly_lina',
    partnerPostId: 'weekly-badminton',
    partner_post_id: 'weekly-badminton',
    userId: 'seed_lina',
    user_id: 'seed_lina',
    nickname: '林娜',
    avatar: '/static/userImg/user.png',
    message: '周二和周四晚上都可以，想先试约一次再固定下来。',
    status: 'accepted',
    conversationId: 'conv_weekly_lina',
    conversation_id: 'conv_weekly_lina',
    joinedCount: 9,
    createdAt: '2026-05-14T13:30:00.000Z'
  },
  {
    id: 'intent_weekly_chen',
    partnerPostId: 'weekly-badminton',
    partner_post_id: 'weekly-badminton',
    userId: 'seed_chen',
    user_id: 'seed_chen',
    nickname: '陈同学',
    avatar: '/static/userImg/user.png',
    message: '新手，能接受 AA 订场，希望找固定搭子。',
    status: 'accepted',
    conversationId: 'conv_weekly_chen',
    conversation_id: 'conv_weekly_chen',
    joinedCount: 6,
    createdAt: '2026-05-14T14:10:00.000Z'
  },
  {
    id: 'intent_weekly_yu',
    partnerPostId: 'weekly-badminton',
    partner_post_id: 'weekly-badminton',
    userId: 'seed_yu',
    user_id: 'seed_yu',
    nickname: '于同学',
    avatar: '/static/userImg/user.png',
    message: '本周日可以，想先看看场地和节奏。',
    status: 'pending',
    conversationId: '',
    conversation_id: '',
    joinedCount: 4,
    createdAt: '2026-05-14T15:00:00.000Z'
  },
  {
    id: 'intent_photo_xinyi',
    partnerPostId: 'photo-graduation-owner',
    partner_post_id: 'photo-graduation-owner',
    userId: 'seed_xinyi',
    user_id: 'seed_xinyi',
    nickname: '欣怡',
    avatar: '/static/userImg/user.png',
    message: '我也想拍北洋园和海河夜景，可以互拍，也能一起拼摄影师。',
    status: 'accepted',
    conversationId: 'conv_photo_xinyi',
    conversation_id: 'conv_photo_xinyi',
    joinedCount: 11,
    createdAt: '2026-05-14T17:05:00.000Z'
  },
  {
    id: 'intent_demo_qi',
    partnerPostId: 'campus-demo-owner',
    partner_post_id: 'campus-demo-owner',
    userId: 'seed_qi',
    user_id: 'seed_qi',
    nickname: '齐同学',
    avatar: '/static/userImg/user.png',
    message: '会做 Figma 和讲 Demo，周末两天可以投入。',
    status: 'pending',
    conversationId: '',
    conversation_id: '',
    joinedCount: 7,
    createdAt: '2026-05-14T12:20:00.000Z'
  }
]

export const PARTNER_POST_TYPES = [
  { key: 'time_box', label: '约个时间', description: '为一次明确时间的见面、体验或同去计划找搭子' },
  { key: 'long_term', label: '长期搭子', description: '为持续的运动、学习、饭搭子或兴趣习惯找稳定同伴' },
  { key: 'project', label: '项目组队', description: '为作品集、比赛、课程或创业小项目找队友' }
]

export const PARTNER_POST_STATUS_META = {
  open: { key: 'open', label: '招募中', tone: 'green', rank: 10 },
  matched: { key: 'matched', label: '已找到', tone: 'blue', rank: 20 },
  converted: { key: 'converted', label: '已转活动', tone: 'purple', rank: 25 },
  paused: { key: 'paused', label: '暂停', tone: 'amber', rank: 40 },
  closed: { key: 'closed', label: '已结束', tone: 'gray', rank: 60 }
}

export const PARTNER_INTENT_STATUS_META = {
  pending: { key: 'pending', label: '待确认', tone: 'amber' },
  accepted: { key: 'accepted', label: '已通过', tone: 'green' },
  rejected: { key: 'rejected', label: '未通过', tone: 'red' }
}

function readPosts() {
  return uni.getStorageSync(POSTS_KEY) || []
}

function writePosts(items) {
  uni.setStorageSync(POSTS_KEY, items)
}

function readIntents() {
  return uni.getStorageSync(INTENTS_KEY) || []
}

function writeIntents(items) {
  uni.setStorageSync(INTENTS_KEY, items)
}

function readFollows() {
  return uni.getStorageSync(FOLLOWS_KEY) || []
}

function writeFollows(items) {
  uni.setStorageSync(FOLLOWS_KEY, items)
}

function readConversations() {
  return uni.getStorageSync(CONVERSATIONS_KEY) || []
}

function writeConversations(items) {
  uni.setStorageSync(CONVERSATIONS_KEY, items)
}

function readCreatedActivities() {
  return uni.getStorageSync(ACTIVITIES_KEY) || []
}

function writeCreatedActivities(items) {
  uni.setStorageSync(ACTIVITIES_KEY, items)
}

function normalizeType(type = 'time_box') {
  return PARTNER_POST_TYPES.some((item) => item.key === type) ? type : 'time_box'
}

function mapTypeToKind(type = 'time_box') {
  if (type === 'long_term') return 'longterm'
  if (type === 'project') return 'project'
  return 'time'
}

function mapKindToType(kind = 'time') {
  if (kind === 'longterm') return 'long_term'
  if (kind === 'project') return 'project'
  return 'time_box'
}

function getTypeLabel(type = 'time_box') {
  return PARTNER_POST_TYPES.find((item) => item.key === normalizeType(type))?.label || '约个时间'
}

function normalizeStatus(status = 'open') {
  if (status === 'matched') return 'matched'
  return PARTNER_POST_STATUS_META[status] ? status : 'open'
}

function normalizeAvatar(avatar = '') {
  const value = String(avatar || '').trim()
  return value || DEFAULT_AVATAR
}

function normalizeTags(tags = []) {
  if (Array.isArray(tags)) return tags.map((item) => String(item).trim()).filter(Boolean).slice(0, 6)
  return String(tags || '').split(/[,\s，、]+/).map((item) => item.trim()).filter(Boolean).slice(0, 6)
}

function normalizeTopicKey(topicKey = '') {
  const key = String(topicKey || '').trim()
  return PARTNER_TOPIC_OPTIONS.some((item) => item.key === key) ? key : ''
}

function getTopicLabel(topicKey = '') {
  const key = normalizeTopicKey(topicKey)
  return PARTNER_TOPIC_OPTIONS.find((item) => item.key === key)?.label || ''
}

function normalizeFilterList(value = []) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  return String(value || '').split(/[,\s，、]+/).map((item) => item.trim()).filter(Boolean)
}

function buildPartnerFilterText(item = {}) {
  return [
    item.title,
    item.scene,
    item.type,
    item.typeLabel || item.type_label,
    item.topicKey || item.topic_key,
    item.topicLabel || item.topic_label,
    item.description,
    item.detail,
    item.expectation,
    item.location,
    item.schedule,
    ...(Array.isArray(item.fitTags || item.fit_tags) ? (item.fitTags || item.fit_tags) : []),
    ...(Array.isArray(item.tags) ? item.tags : []),
    ...(Array.isArray(item.wants) ? item.wants : [])
  ].map((entry) => String(entry || '').toLowerCase()).join(' ')
}

function matchesPartnerPostFilters(item = {}, options = {}) {
  const type = String(options.type || '').trim()
  if (type && normalizeType(type) !== item.type) return false

  const scene = String(options.scene || '').trim()
  if (scene && String(item.scene || '') !== scene) return false

  const topicKey = normalizeTopicKey(options.topicKey || options.topic_key)
  const legacyTagsAny = normalizeFilterList(options.legacyTagsAny || options.legacy_tags_any)
  if (topicKey) {
    const itemTopicKey = normalizeTopicKey(item.topicKey || item.topic_key)
    if (itemTopicKey !== topicKey) {
      if (legacyTagsAny.length === 0) return false
      const filterText = buildPartnerFilterText(item)
      if (!legacyTagsAny.some((tag) => filterText.includes(String(tag).toLowerCase()))) return false
    }
  }

  const keyword = String(options.keyword || '').trim().toLowerCase()
  const tagsAny = normalizeFilterList(options.tagsAny || options.tags_any)
  if (!keyword && tagsAny.length === 0) return true

  const filterText = buildPartnerFilterText(item)
  if (keyword && !filterText.includes(keyword)) return false
  if (tagsAny.length > 0 && !tagsAny.some((tag) => filterText.includes(String(tag).toLowerCase()))) return false
  return true
}

function isCurrentUserCreator(item = {}) {
  const currentUserId = getCurrentUserId()
  const creatorId = item.creatorId || item.creator_id || ''
  return Boolean(currentUserId && creatorId && String(currentUserId) === String(creatorId))
}

function isReferencePreviewOwner(item = {}) {
  const creatorId = String(item.creatorId || item.creator_id || '')
  return shouldUseReferenceMockPreview() && REFERENCE_PREVIEW_OWNER_IDS.includes(creatorId)
}

function normalizePartnerPost(item = {}) {
  const id = item.id || item._id
  const type = normalizeType(item.type || mapKindToType(item.kind))
  const topicKey = normalizeTopicKey(item.topicKey || item.topic_key)
  const creatorId = item.creatorId || item.creator_id || ''
  const detail = item.detail || item.description || ''
  const wants = normalizeTags(item.wants || item.fitTags || item.fit_tags || item.tags)
  const status = normalizeStatus(item.status)
  const viewerIntent = findViewerIntentForPost({ ...item, id })
  const viewerIntentStatus = item.viewerIntentStatus || item.viewer_intent_status || viewerIntent?.status || ''
  const viewerConversationId = item.viewerConversationId || item.viewer_conversation_id || viewerIntent?.conversationId || viewerIntent?.conversation_id || ''
  return {
    ...item,
    id,
    kind: item.kind || mapTypeToKind(type),
    type,
    typeLabel: item.typeLabel || item.type_label || getTypeLabel(type),
    topicKey,
    topic_key: topicKey,
    topicLabel: item.topicLabel || item.topic_label || getTopicLabel(topicKey),
    topic_label: item.topicLabel || item.topic_label || getTopicLabel(topicKey),
    creatorId,
    creator_id: creatorId,
    creator: item.creator || item.creator_name || 'SureGo 用户',
    author: item.author || item.creator || item.creator_name || 'SureGo 用户',
    avatar: normalizeAvatar(item.avatar || item.creator_avatar),
    city: item.city || '天津',
    location: item.location || item.city || '待定',
    locationRange: item.locationRange || item.location_range || item.location || item.city || '待定',
    schedule: item.schedule || item.time || '时间待定',
    available: item.available || item.available_text || item.schedule || item.time || '时间待定',
    connectionMode: item.connectionMode || item.connection_mode || '发出意向后互相确认',
    connectionRule: item.connectionRule || item.connection_rule || item.connectionMode || item.connection_mode || '发出意向后互相确认',
    description: item.description || detail,
    detail,
    expectation: item.expectation || '',
    wants,
    fitTags: normalizeTags(item.fitTags || item.fit_tags || item.tags),
    tags: normalizeTags(item.tags || item.fitTags || item.fit_tags || item.wants),
    status,
    interested: Number(item.interested || item.intentCount || item.intent_count) || 0,
    intentCount: Number(item.intentCount || item.intent_count) || 0,
    followCount: Number(item.followCount || item.follow_count) || 0,
    sourceActivityId: item.sourceActivityId || item.source_activity_id || '',
    viewerIntent,
    viewer_intent: viewerIntent,
    viewerIntentStatus,
    viewer_intent_status: viewerIntentStatus,
    viewerConversationId,
    viewer_conversation_id: viewerConversationId,
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    updatedAt: item.updatedAt || item.updated_at || '',
    isCreator: isCurrentUserCreator({ ...item, creatorId }) || isReferencePreviewOwner({ ...item, creatorId })
  }
}

function normalizeIntent(item = {}) {
  return {
    ...item,
    id: item.id || item._id,
    partnerPostId: item.partnerPostId || item.partner_post_id || '',
    partner_post_id: item.partnerPostId || item.partner_post_id || '',
    userId: item.userId || item.user_id || '',
    user_id: item.userId || item.user_id || '',
    nickname: item.nickname || item.user_name || 'SureGo 用户',
    avatar: normalizeAvatar(item.avatar || item.user_avatar),
    message: item.message || '',
    status: PARTNER_INTENT_STATUS_META[item.status] ? item.status : 'pending',
    conversationId: item.conversationId || item.conversation_id || '',
    conversation_id: item.conversationId || item.conversation_id || '',
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    updatedAt: item.updatedAt || item.updated_at || ''
  }
}

function findViewerIntentForPost(item = {}) {
  const explicit = item.viewerIntent || item.viewer_intent
  if (explicit) return normalizeIntent(explicit)
  const partnerPostId = item.id || item._id || item.partnerPostId || item.partner_post_id
  const userId = getCurrentUserId()
  if (!partnerPostId || !userId) return null
  const source = shouldUseReferenceMockPreview()
    ? [...readIntents(), ...REFERENCE_INTENTS]
    : readIntents()
  const found = source.find((intent) => (
    String(intent.partnerPostId || intent.partner_post_id) === String(partnerPostId)
      && String(intent.userId || intent.user_id) === String(userId)
  ))
  return found ? normalizeIntent(found) : null
}

function normalizeConversation(item = {}) {
  return {
    ...item,
    id: item.id || item._id,
    partnerPostId: item.partnerPostId || item.partner_post_id || '',
    partner_post_id: item.partnerPostId || item.partner_post_id || '',
    participantIds: item.participantIds || item.participant_ids || [],
    participant_ids: item.participantIds || item.participant_ids || [],
    status: item.status || 'open',
    lastMessage: item.lastMessage || item.last_message || '',
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    updatedAt: item.updatedAt || item.updated_at || ''
  }
}

function listLocalPartnerPosts(options = {}) {
  return Promise.resolve([
    ...readPosts(),
    ...partnerPosts
  ].map(normalizePartnerPost).filter((item) => matchesPartnerPostFilters(item, options)).sort((a, b) => {
    const rankDiff = PARTNER_POST_STATUS_META[a.status].rank - PARTNER_POST_STATUS_META[b.status].rank
    if (rankDiff !== 0) return rankDiff
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  }))
}

export async function listPartnerPosts(options = {}) {
  if (shouldUseReferenceMockPreview()) {
    return listLocalPartnerPosts(options)
  }
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      const items = await callSuregoFunction('surego-partner', 'listPosts', options)
      return Array.isArray(items) ? items.map(normalizePartnerPost) : []
    } catch (error) {
      if (options.allowFallback === false) throw error
      return handleSuregoCloudError(error, () => listLocalPartnerPosts(options))
    }
  }
  return listLocalPartnerPosts(options)
}

export async function listHackathonPartnerPosts(options = {}) {
  const tagsAny = [
    ...HACKATHON_PARTNER_TAGS,
    ...normalizeFilterList(options.tagsAny || options.tags_any)
  ]
  return listPartnerPosts({
    ...options,
    type: 'project',
    topicKey: options.topicKey || options.topic_key || HACKATHON_TOPIC_KEY,
    tagsAny,
    legacyTagsAny: tagsAny,
    allowFallback: false
  })
}

function getLocalPartnerPostDetail(id) {
  const found = readPosts().find((item) => String(item.id) === String(id)) || findPartnerPostById(id)
  return Promise.resolve(found ? normalizePartnerPost(found) : null)
}

export async function getPartnerPostDetail(id, options = {}) {
  if (shouldUseReferenceMockPreview()) {
    return getLocalPartnerPostDetail(id)
  }
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview() && !String(id).startsWith('local_partner_')) {
    try {
      const detail = await callSuregoFunction('surego-partner', 'detailPost', { id })
      return detail ? normalizePartnerPost(detail) : null
    } catch (error) {
      if (options.allowFallback === false) throw error
      return handleSuregoCloudError(error, () => getLocalPartnerPostDetail(id))
    }
  }
  return getLocalPartnerPostDetail(id)
}

function buildPartnerPostFromForm(form = {}, id = `local_partner_${Date.now()}`) {
  const currentUser = getCurrentUserProfile()
  const creatorId = form.creatorId || form.creator_id || currentUser.userId || currentUser.uid
  const type = normalizeType(form.type || mapKindToType(form.kind))
  const topicKey = normalizeTopicKey(form.topicKey || form.topic_key)
  const tags = normalizeTags(form.fitTags || form.fit_tags || form.tags)
  const wants = normalizeTags(form.wants || form.expectation)
  return normalizePartnerPost({
    id,
    title: String(form.title || '').trim(),
    kind: form.kind || mapTypeToKind(type),
    type,
    topicKey,
    topic_key: topicKey,
    topicLabel: form.topicLabel || form.topic_label || getTopicLabel(topicKey),
    topic_label: form.topicLabel || form.topic_label || getTopicLabel(topicKey),
    creatorId,
    creator_id: creatorId,
    creator: form.creator || currentUser.nickname,
    author: form.author || form.creator || currentUser.nickname,
    avatar: form.avatar || currentUser.avatar,
    city: form.city || '天津',
    location: form.location || form.city || '待定',
    locationRange: form.locationRange || form.location_range || form.location || form.city || '待定',
    schedule: form.schedule || '',
    available: form.available || form.available_text || form.schedule || '',
    connectionMode: form.connectionMode || form.connection_mode || '',
    connectionRule: form.connectionRule || form.connection_rule || form.connectionMode || form.connection_mode || '',
    description: form.description || form.detail || '',
    detail: form.detail || form.description || '',
    expectation: form.expectation || '',
    wants,
    fitTags: tags,
    tags,
    status: form.status || 'open',
    intentCount: form.intentCount || 0,
    followCount: form.followCount || 0,
    createdAt: new Date().toISOString()
  })
}

function createLocalPartnerPost(form = {}) {
  const items = readPosts()
  const post = buildPartnerPostFromForm(form)
  writePosts([post, ...items])
  return Promise.resolve(post)
}

export async function createPartnerPost(form = {}) {
  const post = buildPartnerPostFromForm(form, '')
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      return normalizePartnerPost(await callSuregoFunction('surego-partner', 'createPost', post))
    } catch (error) {
      return handleSuregoCloudError(error, () => createLocalPartnerPost(form))
    }
  }
  return createLocalPartnerPost(form)
}

export async function listMyPartnerPosts() {
  if (shouldUseReferenceMockPreview()) {
    const all = await listLocalPartnerPosts()
    return all.filter((item) => item.isCreator || isReferencePreviewOwner(item))
  }
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      const items = await callSuregoFunction('surego-partner', 'listMine', {})
      return Array.isArray(items) ? items.map(normalizePartnerPost) : []
    } catch (error) {
      return handleSuregoCloudError(error, async () => {
        const all = await listLocalPartnerPosts()
        return all.filter((item) => item.isCreator)
      })
    }
  }
  const all = await listLocalPartnerPosts()
  return all.filter((item) => item.isCreator)
}

async function createLocalPartnerIntent(payload = {}) {
  const user = getCurrentUserProfile()
  const partnerPostId = payload.partnerPostId || payload.partner_post_id
  const existing = readIntents().find((item) => (
    String(item.partnerPostId || item.partner_post_id) === String(partnerPostId)
      && String(item.userId || item.user_id) === String(user.userId)
  ))
  if (existing) return normalizeIntent(existing)

  const intent = normalizeIntent({
    id: `partner_intent_${Date.now()}`,
    partnerPostId,
    partner_post_id: partnerPostId,
    userId: user.userId,
    user_id: user.userId,
    nickname: user.nickname,
    avatar: user.avatar,
    message: payload.message || '',
    status: 'pending',
    conversationId: '',
    conversation_id: ''
  })
  writeIntents([intent, ...readIntents()])
  writePosts(readPosts().map((item) => (
    String(item.id) === String(partnerPostId)
      ? { ...item, intentCount: Number(item.intentCount || item.intent_count || 0) + 1 }
      : item
  )))
  await createMessage({
    userId: payload.creatorId || payload.creator_id || '',
    partnerPostId,
    type: 'partner',
    title: '新的搭子意向',
    content: `${user.nickname} 想和你建立连接`,
    eventKey: `partner:intent:${partnerPostId}:${user.userId}`
  })
  return intent
}

export async function createPartnerIntent(payload = {}) {
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      return normalizeIntent(await callSuregoFunction('surego-partner', 'createIntent', payload))
    } catch (error) {
      if (payload.allowFallback === false) throw error
      return handleSuregoCloudError(error, () => createLocalPartnerIntent(payload))
    }
  }
  return createLocalPartnerIntent(payload)
}

export async function listPartnerIntents(partnerPostId) {
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      const items = await callSuregoFunction('surego-partner', 'listIntents', { partnerPostId })
      return Array.isArray(items) ? items.map(normalizeIntent) : []
    } catch (error) {
      return handleSuregoCloudError(error, () => Promise.resolve(readIntents().filter((item) => String(item.partnerPostId || item.partner_post_id) === String(partnerPostId)).map(normalizeIntent)))
    }
  }
  const source = shouldUseReferenceMockPreview()
    ? [...readIntents(), ...REFERENCE_INTENTS]
    : readIntents()
  const seen = new Set()
  const items = source
    .filter((item) => String(item.partnerPostId || item.partner_post_id) === String(partnerPostId))
    .filter((item) => {
      const key = String(item.id || item._id || `${item.partner_post_id || item.partnerPostId}:${item.user_id || item.userId}`)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  return Promise.resolve(items.map(normalizeIntent))
}

export async function updatePartnerIntentStatus(id, status) {
  const nextStatus = PARTNER_INTENT_STATUS_META[status] ? status : 'pending'
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      return normalizeIntent(await callSuregoFunction('surego-partner', 'updateIntentStatus', { id, status: nextStatus }))
    } catch (error) {
      return handleSuregoCloudError(error, () => updateLocalPartnerIntentStatus(id, nextStatus))
    }
  }
  return updateLocalPartnerIntentStatus(id, nextStatus)
}

function updateLocalPartnerIntentStatus(id, status) {
  let updated = null
  const next = readIntents().map((item) => {
    if (String(item.id) !== String(id)) return item
    const conversation = status === 'accepted' ? ensureLocalConversationForIntent(item) : null
    updated = normalizeIntent({
      ...item,
      status,
      conversationId: conversation?.id || item.conversationId || item.conversation_id || '',
      conversation_id: conversation?.id || item.conversationId || item.conversation_id || '',
      updatedAt: new Date().toISOString()
    })
    return updated
  })
  writeIntents(next)
  return Promise.resolve(updated)
}

function ensureLocalConversationForIntent(intent = {}) {
  const partnerPostId = intent.partnerPostId || intent.partner_post_id || ''
  const userId = intent.userId || intent.user_id || ''
  const post = readPosts().find((item) => String(item.id) === String(partnerPostId)) || findPartnerPostById(partnerPostId) || {}
  const creatorId = post.creatorId || post.creator_id || ''
  const existing = readConversations().find((item) => (
    String(item.partnerPostId || item.partner_post_id) === String(partnerPostId)
      && (item.participantIds || item.participant_ids || []).map(String).includes(String(userId))
      && (item.participantIds || item.participant_ids || []).map(String).includes(String(creatorId))
  ))
  if (existing) return normalizeConversation(existing)
  const conversation = normalizeConversation({
    id: `conversation_${Date.now()}`,
    partnerPostId,
    partner_post_id: partnerPostId,
    participantIds: [creatorId, userId].filter(Boolean),
    participant_ids: [creatorId, userId].filter(Boolean),
    status: 'open',
    lastMessage: '搭子意向已通过，可以开始沟通',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
  writeConversations([conversation, ...readConversations()])
  return conversation
}

function getLocalPartnerPostById(partnerPostId) {
  return readPosts().find((item) => String(item.id) === String(partnerPostId)) || findPartnerPostById(partnerPostId) || null
}

function normalizeIdList(ids = []) {
  return Array.from(new Set((Array.isArray(ids) ? ids : []).map(String).filter(Boolean)))
}

function buildParticipantIds(partnerPostId, participantIds = []) {
  const post = getLocalPartnerPostById(partnerPostId) || {}
  const creatorId = post.creatorId || post.creator_id || ''
  return Array.from(new Set([creatorId, ...normalizeIdList(participantIds)].filter(Boolean)))
}

function buildInvitedUserIds(post = {}, options = {}) {
  const creatorId = String(post.creatorId || post.creator_id || getCurrentUserId() || '')
  return normalizeIdList(options.invitedUserIds || options.invited_user_ids || options.participantIds || options.participant_ids || [])
    .filter((userId) => String(userId) !== creatorId)
}

function buildSourcePartnerIntentIds(options = {}) {
  return normalizeIdList(options.sourcePartnerIntentIds || options.source_partner_intent_ids || [])
}

function ensureLocalGroupConversation(partnerPostId, participantIds = []) {
  const members = buildParticipantIds(partnerPostId, participantIds)
  if (members.length < 2) return null
  const existing = readConversations().find((item) => {
    const ids = (item.participantIds || item.participant_ids || []).map(String).sort()
    return String(item.partnerPostId || item.partner_post_id || '') === String(partnerPostId)
      && item.status === 'group'
      && ids.join(',') === [...members].sort().join(',')
  })
  if (existing) return normalizeConversation(existing)
  const conversation = normalizeConversation({
    id: `conversation_group_${Date.now()}`,
    partnerPostId,
    partner_post_id: partnerPostId,
    participantIds: members,
    participant_ids: members,
    status: 'group',
    lastMessage: '已为这次搭子沟通创建临时群聊，可统一确认时间、地点和注意事项。',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
  writeConversations([conversation, ...readConversations()])
  return conversation
}

function mapPartnerSceneToActivityCategory(scene = '', type = 'time_box') {
  if (scene === 'sport') return '运动'
  if (scene === 'study') return '学习/自习'
  if (scene === 'game') return '游戏/娱乐'
  if (scene === 'project' || type === 'project') return '项目组队'
  return '饭搭子/探店'
}

function getPartnerActivityImage(post = {}) {
  const explicitImage = post.image || post.cover || post.coverImage || post.cover_image || ''
  if (explicitImage && explicitImage !== '/static/logo.png') return explicitImage
  const scene = post.scene || ''
  const text = `${post.title || ''} ${(post.tags || []).join(' ')} ${(post.fitTags || []).join(' ')}`
  if (text.includes('羽毛球')) return DEFAULT_PARTNER_ACTIVITY_IMAGES.sport
  return DEFAULT_PARTNER_ACTIVITY_IMAGES[scene] || DEFAULT_PARTNER_ACTIVITY_IMAGES.food
}

function buildConvertedActivity(post = {}, options = {}) {
  const visibility = options.visibility === 'members_only' ? 'members_only' : 'public'
  const creatorId = post.creatorId || post.creator_id || getCurrentUserId()
  const participantIds = normalizeIdList(options.confirmedParticipantIds || options.confirmed_participant_ids || [creatorId])
  const invitedUserIds = buildInvitedUserIds(post, options)
  const sourcePartnerIntentIds = buildSourcePartnerIntentIds(options)
  const participantCount = participantIds.length
  const plannedCount = Math.max(participantCount + invitedUserIds.length, 1)
  const title = String(options.title || post.title || '').trim() || '新的成行活动'
  const available = options.time || post.available || post.schedule || '时间待定'
  const locationRange = options.location || post.locationRange || post.location || '地点待确认'
  const now = new Date().toISOString()
  const maxParticipants = Number(options.maxParticipants || options.max_participants) || (visibility === 'public' ? Math.max(plannedCount + 2, 6) : Math.max(plannedCount, 2))
  return {
    id: `local_${Date.now()}`,
    title,
    creatorId,
    creator_id: creatorId,
    organizer: post.author || post.creator || 'SureGo 用户',
    organizerAvatar: post.avatar || DEFAULT_AVATAR,
    image: getPartnerActivityImage(post),
    category: mapPartnerSceneToActivityCategory(post.scene, post.type),
    date: options.date || (visibility === 'public' ? '本周待定' : '待邀请确认'),
    dateValue: now,
    dayOfWeek: '',
    time: available,
    endTime: '',
    location: locationRange,
    address: locationRange,
    latitude: '',
    longitude: '',
    city: post.city || '天津',
    cityCode: post.cityCode || post.city_code || '',
    city_code: post.cityCode || post.city_code || '',
    district: post.district || '',
    distance: '0.6',
    participantCount,
    participant_count: participantCount,
    maxParticipants,
    max_participants: maxParticipants,
    hasParticipantLimit: true,
    has_participant_limit: true,
    partyMode: 'free',
    party_mode: 'free',
    price: '免费',
    amount: Number(options.amount) || 0,
    requireApproval: visibility === 'public',
    require_approval: visibility === 'public',
    status: visibility === 'public' ? 'recruiting' : 'formed',
    lifecycleStatus: visibility === 'public' ? 'recruiting' : 'formed',
    moderationStatus: 'approved',
    moderation_status: 'approved',
    applicationStatus: 'not_applied',
    viewCount: 0,
    likeCount: 0,
    description: options.description || post.detail || post.description || '',
    questions: [],
    tags: normalizeTags(post.tags || post.fitTags || post.wants),
    visibility,
    source: 'partner_post',
    sourcePartnerPostId: post.id,
    source_partner_post_id: post.id,
    sourcePartnerIntentIds,
    source_partner_intent_ids: sourcePartnerIntentIds,
    invitedUserIds,
    invited_user_ids: invitedUserIds,
    participantIds,
    participant_ids: participantIds,
    createdAt: now,
    created_at: now,
    updatedAt: now,
    updated_at: now
  }
}

function markLocalPostConverted(partnerPostId, activity = {}) {
  const nextCreatedPosts = readPosts().map((item) => (
    String(item.id) === String(partnerPostId)
      ? {
          ...item,
          status: 'converted',
          sourceActivityId: activity.id || '',
          source_activity_id: activity.id || '',
          updatedAt: new Date().toISOString()
        }
      : item
  ))
  writePosts(nextCreatedPosts)
}

async function notifyConvertedActivity(activity = {}, participantIds = [], visibility = 'public') {
  const title = activity.title || '新的成行活动'
  const messageTitle = visibility === 'public' ? '已约成公开活动' : '已约成私密活动'
  const content = visibility === 'public'
    ? `你们已约成「${title}」，活动会进入成行列表，后续还可以继续公开招人。`
    : `你们已约成「${title}」，活动只会对相关成员可见。`
  await Promise.all(participantIds.map((userId) => (
    createMessage({
      userId,
      type: 'activity',
      title: messageTitle,
      content,
      activityId: activity.id,
      partnerPostId: activity.sourcePartnerPostId || activity.source_partner_post_id || '',
      eventKey: `partner:converted:${activity.id}:${userId}`
    })
  )))
}

export async function followPartnerPost(partnerPostId) {
  const userId = getCurrentUserId()
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      return await callSuregoFunction('surego-partner', 'followPost', { partnerPostId })
    } catch (error) {
      return handleSuregoCloudError(error, () => followLocalPartnerPost(partnerPostId, userId))
    }
  }

  const follows = readFollows()
  const existing = follows.find((item) => (
    item.target_type === 'partner_post'
      && String(item.target_id) === String(partnerPostId)
      && String(item.user_id || item.userId) === String(userId)
  ))
  if (existing) return Promise.resolve(existing)
  return followLocalPartnerPost(partnerPostId, userId)
}

function followLocalPartnerPost(partnerPostId, userId = getCurrentUserId()) {
  const follow = {
    id: `follow_${Date.now()}`,
    target_type: 'partner_post',
    target_id: partnerPostId,
    user_id: userId,
    created_at: new Date().toISOString()
  }
  writeFollows([follow, ...readFollows()])
  writePosts(readPosts().map((item) => (
    String(item.id) === String(partnerPostId)
      ? { ...item, followCount: Number(item.followCount || item.follow_count || 0) + 1 }
      : item
  )))
  return Promise.resolve(follow)
}

export async function ensurePartnerGroupConversation(partnerPostId, participantIds = []) {
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      const conversation = await callSuregoFunction('surego-partner', 'ensureGroupConversation', {
        partnerPostId,
        participantIds
      })
      return conversation ? normalizeConversation(conversation) : null
    } catch (error) {
      return handleSuregoCloudError(error, () => Promise.resolve(ensureLocalGroupConversation(partnerPostId, participantIds)))
    }
  }
  return Promise.resolve(ensureLocalGroupConversation(partnerPostId, participantIds))
}

function convertLocalPartnerPostToActivity(payload = {}) {
  const post = getLocalPartnerPostById(payload.partnerPostId)
  if (!post) return Promise.resolve(null)
  const activity = buildConvertedActivity(post, payload)
  writeCreatedActivities([activity, ...readCreatedActivities()])
  markLocalPostConverted(post.id, activity)
  notifyConvertedActivity(
    activity,
    activity.invitedUserIds || activity.invited_user_ids || [],
    activity.visibility
  )
  return Promise.resolve(activity)
}

export async function convertPartnerPostToActivity(payload = {}) {
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      return await callSuregoFunction('surego-partner', 'convertToActivity', payload)
    } catch (error) {
      return handleSuregoCloudError(error, () => convertLocalPartnerPostToActivity(payload))
    }
  }
  return convertLocalPartnerPostToActivity(payload)
}

export async function getPartnerConversation(id) {
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      const conversation = await callSuregoFunction('surego-partner', 'getConversation', { id })
      return conversation ? normalizeConversation(conversation) : null
    } catch (error) {
      return handleSuregoCloudError(error, () => getLocalPartnerConversation(id))
    }
  }
  return getLocalPartnerConversation(id)
}

function getLocalPartnerConversation(id) {
  const source = shouldUseReferenceMockPreview()
    ? [...readConversations(), ...REFERENCE_CONVERSATIONS]
    : readConversations()
  const found = source.find((item) => String(item.id || item._id) === String(id))
  return Promise.resolve(found ? normalizeConversation(found) : null)
}

export async function listPartnerConversations() {
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      const items = await callSuregoFunction('surego-partner', 'listConversations', {})
      return Array.isArray(items) ? items.map(normalizeConversation) : []
    } catch (error) {
      return handleSuregoCloudError(error, () => Promise.resolve(readConversations().map(normalizeConversation)))
    }
  }
  const source = shouldUseReferenceMockPreview()
    ? [...readConversations(), ...REFERENCE_CONVERSATIONS]
    : readConversations()
  return Promise.resolve(source.map(normalizeConversation))
}
