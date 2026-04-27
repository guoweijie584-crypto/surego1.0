const STORAGE_KEY = 'surego_messages'

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
  return Promise.resolve(readMessages())
}

export function markMessageRead(id) {
  const next = readMessages().map((item) => (item.id === id ? { ...item, read: true } : item))
  writeMessages(next)
  return Promise.resolve(next.find((item) => item.id === id))
}
