import { USE_UNICLOUD } from '../config/runtime.js'
import { callSuregoFunction, handleSuregoCloudError } from '@/common/api/cloud.js'
import { getCurrentUserId } from '@/common/api/auth.js'

const STORAGE_KEY = 'surego_messages'
const MAX_CACHE_ITEMS = 300

function readMessages() {
  return uni.getStorageSync(STORAGE_KEY) || []
}

function writeMessages(items) {
  uni.setStorageSync(STORAGE_KEY, items.slice(0, MAX_CACHE_ITEMS))
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
    read: Boolean(payload.read),
    createdAt: payload.createdAt || payload.created_at || payload.sentAt || payload.sent_at || new Date().toISOString(),
    updatedAt: payload.updatedAt || payload.updated_at || ''
  }
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
  return Promise.resolve(readMessages().filter((item) => isCurrentUserMessage(item, userId)).map(buildMessage))
}

export async function listMessages() {
  const userId = getCurrentUserId()
  if (USE_UNICLOUD) {
    try {
      const items = await callSuregoFunction('surego-message', 'list', { userId })
      return Array.isArray(items) ? items : []
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
  return Promise.resolve(next.filter((item) => isCurrentUserMessage(item, userId)))
}

export async function markAllMessagesRead() {
  const userId = getCurrentUserId()
  if (USE_UNICLOUD) {
    try {
      const items = await callSuregoFunction('surego-message', 'markAllRead', { userId })
      return Array.isArray(items) ? items : []
    } catch (error) {
      return handleSuregoCloudError(error, () => markAllLocalMessagesRead(userId))
    }
  }
  return markAllLocalMessagesRead(userId)
}
