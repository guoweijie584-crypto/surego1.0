const STORAGE_KEY = 'surego_orders'

function readOrders() {
  return uni.getStorageSync(STORAGE_KEY) || []
}

function writeOrders(items) {
  uni.setStorageSync(STORAGE_KEY, items)
}

export function createOrder(payload) {
  const items = readOrders()
  const order = {
    id: `order_${Date.now()}`,
    activityId: payload.activityId,
    userId: 'mock_user',
    type: payload.type,
    amount: Number(payload.amount) || 0,
    status: 'pending',
    createdAt: new Date().toISOString()
  }

  writeOrders([order, ...items])
  return Promise.resolve(order)
}

export function markOrderPaid(id) {
  const next = readOrders().map((item) => (item.id === id ? { ...item, status: 'paid' } : item))
  writeOrders(next)
  return Promise.resolve(next.find((item) => item.id === id))
}

export function listOrders() {
  return Promise.resolve(readOrders())
}
