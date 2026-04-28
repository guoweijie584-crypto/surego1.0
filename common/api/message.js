import { USE_UNICLOUD } from '@/common/config/runtime.js'
import { callSuregoFunction, handleSuregoCloudError } from '@/common/api/cloud.js'
import { getCurrentUserId, MOCK_USER_ID } from '@/common/api/auth.js'

const STORAGE_KEY = 'surego_messages'

const defaultMessages = [
  {
    id: 'msg_default_apply',
    type: 'application',
    title: '新的加入申请',
    content: '有人申请加入你的活动，去管理页看看吧。',
    sender: '张伟',
    activityId: '103',
    userId: MOCK_USER_ID,
    read: false,
    createdAt: '2 分钟前'
  },
  {
    id: 'msg_default_start',
    type: 'activity',
    title: '活动即将开始',
    content: '你报名的活动将在 30 分钟后开始。',
    activityId: '102',
    userId: MOCK_USER_ID,
    read: false,
    createdAt: '1 小时前'
  },
  {
    id: 'msg_default_system',
    type: 'system',
    title: '系统更新提示',
    content: '成行活动管理能力已进入小程序迁移阶段。',
    activityId: '',
    userId: MOCK_USER_ID,
    read: true,
    createdAt: '昨天'
  }
]

function readMessages() {
  return uni.getStorageSync(STORAGE_KEY) || []
}

function writeMessages(items) {
  uni.setStorageSync(STORAGE_KEY, items)
}

function getSeedMessages() {
  return defaultMessages.map((item) => ({ ...item }))
}

function buildMessage(payload) {
  return {
    id: payload.id || `msg_${Date.now()}`,
    userId: payload.userId || getCurrentUserId(),
    type: payload.type || 'system',
    title: payload.title,
    content: payload.content,
    sender: payload.sender || '',
    activityId: payload.activityId || '',
    read: Boolean(payload.read),
    createdAt: payload.createdAt || new Date().toISOString()
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
  const items = readMessages()
  const source = items.length ? items : getSeedMessages()
  return Promise.resolve(source.filter((item) => !item.userId || item.userId === userId || item.userId === MOCK_USER_ID))
}

export async function listMessages(userId = getCurrentUserId()) {
  if (USE_UNICLOUD) {
    try {
      const items = await callSuregoFunction('surego-message', 'list', { userId })
      return items.length ? items : getSeedMessages()
    } catch (error) {
      return handleSuregoCloudError(error, () => listLocalMessages(userId))
    }
  }
  return listLocalMessages(userId)
}

function markLocalMessageRead(id) {
  const items = readMessages()
  const source = items.length ? items : getSeedMessages()
  const next = source.map((item) => (item.id === id ? { ...item, read: true } : item))
  writeMessages(next)
  return Promise.resolve(next.find((item) => item.id === id) || null)
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
  const source = items.length ? items : getSeedMessages()
  const next = source.map((item) => (
    !item.userId || item.userId === userId || item.userId === MOCK_USER_ID
      ? { ...item, read: true }
      : item
  ))
  writeMessages(next)
  return Promise.resolve(next)
}

export async function markAllMessagesRead(userId = getCurrentUserId()) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-message', 'markAllRead', { userId })
    } catch (error) {
      return handleSuregoCloudError(error, () => markAllLocalMessagesRead(userId))
    }
  }
  return markAllLocalMessagesRead(userId)
}
