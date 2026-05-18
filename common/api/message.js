import { USE_UNICLOUD, shouldUseReferenceMockPreview } from '../config/runtime.js'
import { callSuregoFunction, handleSuregoCloudError } from '@/common/api/cloud.js'
import { getCurrentUserId } from '@/common/api/auth.js'

const STORAGE_KEY = 'surego_messages'
const REFERENCE_NOTICES = [
  {
    id: 'n1',
    eventKey: 'reference:notice:n1',
    type: 'application',
    title: '约拍局申请已通过',
    content: '请在 2 小时内完成门票支付，超时名额将释放给候补。',
    sender: 'SureGo',
    activityId: 'photo-river',
    read: false,
    createdAt: '2026-05-14T08:05:00.000Z'
  },
  {
    id: 'n2',
    eventKey: 'reference:notice:n2',
    type: 'activity',
    title: '剧本杀局 24h 行前提醒',
    content: '请确认明晚 19:20 可准时到达沉浸剧场。',
    sender: '成行提醒',
    activityId: 'murder-night',
    read: false,
    createdAt: '2026-05-14T07:00:00.000Z'
  },
  {
    id: 'n3',
    eventKey: 'reference:notice:n3',
    type: 'activity',
    title: '你已进入微醺局候补第 2 位',
    content: '有人退出时会按顺序发送补位通知。',
    sender: '候补通知',
    activityId: 'tipsy-table',
    read: true,
    createdAt: '2026-05-13T20:30:00.000Z'
  },
  {
    id: 'n4',
    eventKey: 'reference:notice:n4',
    type: 'partner',
    title: '羽毛球长期搭子收到 3 个申请',
    content: '先看看对方时间和水平，再决定私聊或拉群。',
    sender: '搭子意向',
    partnerPostId: 'weekly-badminton',
    read: false,
    createdAt: '2026-05-13T18:00:00.000Z'
  },
  {
    id: 'n5',
    eventKey: 'reference:notice:n5',
    type: 'partner',
    title: '南门饭搭子通过了你的意向',
    content: '你们可以先私聊确认今晚吃饭时间。',
    sender: '私聊',
    partnerPostId: 'canteen-rice-buddy',
    conversationId: 'conv_canteen_rice',
    conversationType: 'private',
    read: true,
    createdAt: '2026-05-12T21:30:00.000Z'
  },
  {
    id: 'n6',
    eventKey: 'reference:notice:n6',
    type: 'partner',
    title: 'Switch 派对已建群',
    content: '当前 5 人，发起人正在确认最后 1 个名额。',
    sender: '群聊',
    partnerPostId: 'switch-party',
    conversationId: 'conv_switch_party',
    conversationType: 'group',
    read: true,
    createdAt: '2026-05-12T19:30:00.000Z'
  },
  {
    id: 'n7',
    eventKey: 'reference:notice:n7',
    type: 'partner',
    title: 'AI 黑客松组队已确认成员',
    content: '队长已确认队员，后续安排只对成员可见。',
    sender: '已成局',
    partnerPostId: 'hackathon-ai-front',
    read: true,
    createdAt: '2026-05-11T17:30:00.000Z'
  }
]

function readMessages() {
  return uni.getStorageSync(STORAGE_KEY) || []
}

function writeMessages(items) {
  uni.setStorageSync(STORAGE_KEY, items)
}

function buildReferenceNotices(userId = getCurrentUserId()) {
  return REFERENCE_NOTICES.map((item) => ({
    ...item,
    userId
  }))
}

function ensureReferenceNotices(userId = getCurrentUserId()) {
  const items = readMessages()
  const hasReferenceNotices = items.some((item) => String(item.eventKey || item.event_key || '').startsWith('reference:notice:'))
  if (hasReferenceNotices) return items
  const next = [...buildReferenceNotices(userId), ...items]
  writeMessages(next)
  return next
}

function isCurrentUserMessage(item, userId = getCurrentUserId()) {
  return Boolean(item?.userId && String(item.userId) === String(userId))
}

function buildMessage(payload = {}) {
  return {
    id: payload.id || `msg_${Date.now()}`,
    userId: payload.userId || payload.user_id || getCurrentUserId(),
    eventKey: payload.eventKey || payload.event_key || '',
    type: payload.type || 'system',
    title: payload.title || '',
    content: payload.content || '',
    sender: payload.sender || '',
    activityId: payload.activityId || payload.activity_id || '',
    partnerPostId: payload.partnerPostId || payload.partner_post_id || '',
    conversationId: payload.conversationId || payload.conversation_id || '',
    conversationType: payload.conversationType || payload.conversation_type || '',
    read: Boolean(payload.read),
    createdAt: payload.createdAt || payload.created_at || payload.sentAt || payload.sent_at || new Date().toISOString(),
    updatedAt: payload.updatedAt || payload.updated_at || ''
  }
}

function getMessageSortTime(item = {}) {
  const value = item.createdAt || item.created_at || item.updatedAt || item.updated_at || 0
  if (typeof value === 'number') return value
  const parsed = Date.parse(String(value))
  return Number.isNaN(parsed) ? 0 : parsed
}

function sortMessages(items = []) {
  return [...items].sort((a, b) => {
    if (Boolean(a.read) !== Boolean(b.read)) return a.read ? 1 : -1
    return getMessageSortTime(b) - getMessageSortTime(a)
  })
}

function createLocalMessage(payload) {
  const items = readMessages()
  const message = buildMessage(payload)
  if (message.eventKey) {
    const existing = items.find((item) => (
      String(item.userId || item.user_id || '') === String(message.userId)
        && String(item.eventKey || item.event_key || '') === String(message.eventKey)
    ))
    if (existing) return Promise.resolve(buildMessage(existing))
  }

  writeMessages([message, ...items])
  return Promise.resolve(message)
}

export async function createMessage(payload) {
  const nextPayload = {
    ...payload,
    createdAt: payload.createdAt || payload.created_at || new Date().toISOString()
  }
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-message', 'create', buildMessage(nextPayload))
    } catch (error) {
      return handleSuregoCloudError(error, () => createLocalMessage(nextPayload))
    }
  }
  return createLocalMessage(nextPayload)
}

function listLocalMessages(userId = getCurrentUserId()) {
  const items = shouldUseReferenceMockPreview() ? ensureReferenceNotices(userId) : readMessages()
  return Promise.resolve(sortMessages(items.filter((item) => isCurrentUserMessage(item, userId)).map(buildMessage)))
}

export async function listMessages() {
  const userId = getCurrentUserId()
  if (shouldUseReferenceMockPreview()) {
    return listLocalMessages(userId)
  }
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      const items = await callSuregoFunction('surego-message', 'list', { userId })
      return Array.isArray(items) ? sortMessages(items.map(buildMessage)) : []
    } catch (error) {
      return handleSuregoCloudError(error, () => listLocalMessages(userId))
    }
  }
  return listLocalMessages(userId)
}

export async function getUnreadMessageCount() {
  const items = await listMessages()
  return items.filter((item) => !item.read).length
}

function markLocalMessageRead(id, userId = getCurrentUserId()) {
  const items = readMessages()
  let marked = null
  const next = items.map((item) => {
    if (item.id === id && isCurrentUserMessage(item, userId)) {
      marked = { ...item, read: true }
      return marked
    }
    return item
  })
  writeMessages(next)
  return Promise.resolve(marked)
}

export async function markMessageRead(id) {
  if (shouldUseReferenceMockPreview()) {
    return markLocalMessageRead(id)
  }
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-message', 'markRead', { id })
    } catch (error) {
      return handleSuregoCloudError(error, () => markLocalMessageRead(id))
    }
  }
  return markLocalMessageRead(id)
}

function markAllLocalMessagesRead(userId = getCurrentUserId()) {
  const items = readMessages()
  const next = items.map((item) => (
    isCurrentUserMessage(item, userId)
      ? { ...item, read: true }
      : item
  ))
  writeMessages(next)
  return Promise.resolve(sortMessages(next.filter((item) => isCurrentUserMessage(item, userId)).map(buildMessage)))
}

export async function markAllMessagesRead() {
  const userId = getCurrentUserId()
  if (shouldUseReferenceMockPreview()) {
    return markAllLocalMessagesRead(userId)
  }
  if (USE_UNICLOUD) {
    try {
      const items = await callSuregoFunction('surego-message', 'markAllRead', { userId })
      return Array.isArray(items) ? sortMessages(items.map(buildMessage)) : []
    } catch (error) {
      return handleSuregoCloudError(error, () => markAllLocalMessagesRead(userId))
    }
  }
  return markAllLocalMessagesRead(userId)
}
