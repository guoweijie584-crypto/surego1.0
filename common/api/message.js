const STORAGE_KEY = 'surego_messages'

const defaultMessages = [
  {
    id: 'msg_default_apply',
    type: 'application',
    title: '新的加入申请',
    content: '申请加入你的「周末飞盘组」活动。',
    sender: '张伟',
    activityId: '103',
    read: false,
    createdAt: '2 分前'
  },
  {
    id: 'msg_default_start',
    type: 'activity',
    title: '活动即将开始',
    content: '你订阅的「碳酸泡泡艺术展」将在 30 分钟后开始。',
    activityId: '102',
    read: false,
    createdAt: '1 小时前'
  },
  {
    id: 'msg_default_system',
    type: 'system',
    title: '系统更新提示',
    content: '成行活动管理能力已进入小程序迁移阶段。',
    activityId: '',
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

export function createMessage(payload) {
  const items = readMessages()
  const message = {
    id: `msg_${Date.now()}`,
    type: payload.type || 'system',
    title: payload.title,
    content: payload.content,
    activityId: payload.activityId || '',
    read: false,
    createdAt: new Date().toISOString()
  }

  writeMessages([message, ...items])
  return Promise.resolve(message)
}

export function listMessages() {
  const items = readMessages()
  return Promise.resolve(items.length ? items : defaultMessages)
}

export function markMessageRead(id) {
  const items = readMessages()
  const next = (items.length ? items : defaultMessages).map((item) => (item.id === id ? { ...item, read: true } : item))
  writeMessages(next)
  return Promise.resolve(next.find((item) => item.id === id))
}

export function markAllMessagesRead() {
  const items = readMessages()
  const next = (items.length ? items : defaultMessages).map((item) => ({ ...item, read: true }))
  writeMessages(next)
  return Promise.resolve(next)
}
