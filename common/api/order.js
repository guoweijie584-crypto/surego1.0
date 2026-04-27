const STORAGE_KEY = 'surego_orders'
const CURRENT_USER_ID = 'mock_user'

function readOrders() {
  return uni.getStorageSync(STORAGE_KEY) || []
}

function writeOrders(items) {
  uni.setStorageSync(STORAGE_KEY, items)
}

function buildOrder(payload, status = 'pending') {
  return {
    id: payload.id || `order_${Date.now()}`,
    activityId: String(payload.activityId),
    userId: payload.userId || CURRENT_USER_ID,
    type: payload.type,
    amount: Number(payload.amount) || 0,
    status,
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export function createOrder(payload) {
  const items = readOrders()
  const order = buildOrder(payload)

  writeOrders([order, ...items])
  return Promise.resolve(order)
}

export function getOrderForActivity(activityId, userId = CURRENT_USER_ID) {
  const order = readOrders().find((item) => item.activityId === String(activityId) && item.userId === userId)
  return Promise.resolve(order || null)
}

export function ensureOrderForActivity(payload) {
  const items = readOrders()
  const found = items.find((item) => item.activityId === String(payload.activityId) && item.userId === (payload.userId || CURRENT_USER_ID))
  if (found) {
    const nextOrder = {
      ...found,
      type: payload.type || found.type,
      amount: Number(payload.amount ?? found.amount) || 0,
      updatedAt: new Date().toISOString()
    }
    writeOrders(items.map((item) => (item.id === found.id ? nextOrder : item)))
    return Promise.resolve(nextOrder)
  }

  return createOrder(payload)
}

export function updateOrderStatus(id, status) {
  const allowed = ['pending', 'paid', 'refunded', 'closed']
  const nextStatus = allowed.includes(status) ? status : 'pending'
  const next = readOrders().map((item) => (
    item.id === id
      ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() }
      : item
  ))
  writeOrders(next)
  return Promise.resolve(next.find((item) => item.id === id) || null)
}

export function markOrderPaid(id) {
  return updateOrderStatus(id, 'paid')
}

export function listOrders() {
  return Promise.resolve(readOrders())
}
