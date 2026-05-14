import { partnerPosts, findPartnerPostById } from '@/common/mock/partners.js'
import { USE_UNICLOUD, shouldUseReferenceMockPreview } from '../config/runtime.js'
import { callSuregoFunction, handleSuregoCloudError } from '@/common/api/cloud.js'
import { getCurrentUserId, getCurrentUserProfile } from '@/common/api/auth.js'
import { createMessage } from '@/common/api/message.js'

const POSTS_KEY = 'surego_partner_posts'
const INTENTS_KEY = 'surego_partner_intents'
const FOLLOWS_KEY = 'surego_partner_follows'
const CONVERSATIONS_KEY = 'surego_partner_conversations'
const DEFAULT_AVATAR = '/static/userImg/user.png'
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
  }
]

export const PARTNER_POST_TYPES = [
  { key: 'time_box', label: '约个时间', description: '为一次明确时间的见面、体验或同去计划找搭子' },
  { key: 'long_term', label: '长期搭子', description: '为持续的运动、学习、饭搭子或兴趣习惯找稳定同伴' },
  { key: 'project', label: '项目组队', description: '为作品集、比赛、课程或创业小项目找队友' }
]

export const PARTNER_POST_STATUS_META = {
  open: { key: 'open', label: '招募中', tone: 'green', rank: 10 },
  matched: { key: 'matched', label: '已匹配', tone: 'blue', rank: 20 },
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

function normalizeType(type = 'time_box') {
  return PARTNER_POST_TYPES.some((item) => item.key === type) ? type : 'time_box'
}

function getTypeLabel(type = 'time_box') {
  return PARTNER_POST_TYPES.find((item) => item.key === normalizeType(type))?.label || '约个时间'
}

function normalizeStatus(status = 'open') {
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

function isCurrentUserCreator(item = {}) {
  const currentUserId = getCurrentUserId()
  const creatorId = item.creatorId || item.creator_id || ''
  return Boolean(currentUserId && creatorId && String(currentUserId) === String(creatorId))
}

function normalizePartnerPost(item = {}) {
  const id = item.id || item._id
  const type = normalizeType(item.type)
  const creatorId = item.creatorId || item.creator_id || ''
  return {
    ...item,
    id,
    type,
    typeLabel: item.typeLabel || item.type_label || getTypeLabel(type),
    creatorId,
    creator_id: creatorId,
    creator: item.creator || item.creator_name || 'SureGo 用户',
    avatar: normalizeAvatar(item.avatar || item.creator_avatar),
    city: item.city || '天津',
    location: item.location || item.city || '待定',
    schedule: item.schedule || item.time || '时间待定',
    connectionMode: item.connectionMode || item.connection_mode || '发出意向后互相确认',
    description: item.description || '',
    expectation: item.expectation || '',
    fitTags: normalizeTags(item.fitTags || item.fit_tags || item.tags),
    status: normalizeStatus(item.status),
    intentCount: Number(item.intentCount || item.intent_count) || 0,
    followCount: Number(item.followCount || item.follow_count) || 0,
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    updatedAt: item.updatedAt || item.updated_at || '',
    isCreator: isCurrentUserCreator({ ...item, creatorId })
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

function listLocalPartnerPosts() {
  return Promise.resolve([
    ...readPosts(),
    ...partnerPosts
  ].map(normalizePartnerPost).sort((a, b) => {
    const rankDiff = PARTNER_POST_STATUS_META[a.status].rank - PARTNER_POST_STATUS_META[b.status].rank
    if (rankDiff !== 0) return rankDiff
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  }))
}

export async function listPartnerPosts(options = {}) {
  if (shouldUseReferenceMockPreview()) {
    return listLocalPartnerPosts()
  }
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      const items = await callSuregoFunction('surego-partner', 'listPosts', options)
      return Array.isArray(items) ? items.map(normalizePartnerPost) : []
    } catch (error) {
      return handleSuregoCloudError(error, () => listLocalPartnerPosts())
    }
  }
  return listLocalPartnerPosts()
}

function getLocalPartnerPostDetail(id) {
  const found = readPosts().find((item) => String(item.id) === String(id)) || findPartnerPostById(id)
  return Promise.resolve(found ? normalizePartnerPost(found) : null)
}

export async function getPartnerPostDetail(id) {
  if (shouldUseReferenceMockPreview()) {
    return getLocalPartnerPostDetail(id)
  }
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview() && !String(id).startsWith('local_partner_')) {
    try {
      const detail = await callSuregoFunction('surego-partner', 'detailPost', { id })
      return detail ? normalizePartnerPost(detail) : null
    } catch (error) {
      return handleSuregoCloudError(error, () => getLocalPartnerPostDetail(id))
    }
  }
  return getLocalPartnerPostDetail(id)
}

function buildPartnerPostFromForm(form = {}, id = `local_partner_${Date.now()}`) {
  const currentUser = getCurrentUserProfile()
  const creatorId = form.creatorId || form.creator_id || currentUser.userId || currentUser.uid
  return normalizePartnerPost({
    id,
    title: String(form.title || '').trim(),
    type: normalizeType(form.type),
    creatorId,
    creator_id: creatorId,
    creator: form.creator || currentUser.nickname,
    avatar: form.avatar || currentUser.avatar,
    city: form.city || '天津',
    location: form.location || form.city || '待定',
    schedule: form.schedule || '',
    connectionMode: form.connectionMode || form.connection_mode || '',
    description: form.description || '',
    expectation: form.expectation || '',
    fitTags: normalizeTags(form.fitTags || form.fit_tags || form.tags),
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
    return all.filter((item) => item.isCreator)
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
    status: 'pending'
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
  return Promise.resolve(readIntents().filter((item) => String(item.partnerPostId || item.partner_post_id) === String(partnerPostId)).map(normalizeIntent))
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
