import { USE_UNICLOUD } from '../config/runtime.js'
import { callSuregoFunction, handleSuregoCloudError } from '@/common/api/cloud.js'
import { getCurrentUserId } from '@/common/api/auth.js'

const STORAGE_KEY = 'surego_messages'

function readMessages() {
  return uni.getStorageSync(STORAGE_KEY) || []
}

function writeMessages(items) {
  uni.setStorageSync(STORAGE_KEY, items)
}

function isCurrentUserMessage(item, userId = getCurrentUserId()) {
  return Boolean(item?.userId && String(item.userId) === String(userId))
}

function buildMessage(payload = {}) {
  return {
    id: payload.id || `msg_${Date.now()}`,
    userId: payload.userId || payload.user_id || getCurrentUserId(),
    type: payload.type || 'system',
    title: payload.title || '',
    content: payload.content || '',
    sender: payload.sender || '',
    activityId: payload.activityId || payload.activity_id || '',
    read: Boolean(payload.read),
    createdAt: payload.createdAt || payload.created_at || new Date().toISOString()
  }
}

function createLocalMessage(payload) {
  const items = readMessages()
  const message = buildMessage(payload)

  writeMessages([message, ...items])
  return Promise.resolve(message)
}

export async function createMessage(payload) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-message', 'create', buildMessage(payload))
    } catch (error) {
      return handleSuregoCloudError(error, () => createLocalMessage(payload))
    }
  }
  return createLocalMessage(payload)
}

function listLocalMessages(userId = getCurrentUserId()) {
  return Promise.resolve(readMessages().filter((item) => isCurrentUserMessage(item, userId)))
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
