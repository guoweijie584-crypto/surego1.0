import { USE_UNICLOUD } from '@/common/config/runtime.js'
import { callSuregoFunction } from '@/common/api/cloud.js'
import { getCurrentUserId } from '@/common/api/auth.js'

const STORAGE_KEY = 'surego_orders'

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
    userId: payload.userId || getCurrentUserId(),
    type: payload.type,
    amount: Number(payload.amount) || 0,
    status,
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

function createLocalOrder(payload) {
  const items = readOrders()
  const order = buildOrder(payload)

  writeOrders([order, ...items])
  return Promise.resolve(order)
}

export async function createOrder(payload) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-order', 'create', buildOrder(payload))
    } catch (error) {
      return createLocalOrder(payload)
    }
  }
  return createLocalOrder(payload)
}

function getLocalOrderForActivity(activityId, userId = getCurrentUserId()) {
  const order = readOrders().find((item) => item.activityId === String(activityId) && item.userId === userId)
  return Promise.resolve(order || null)
}

export async function getOrderForActivity(activityId, userId = getCurrentUserId()) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-order', 'getForActivity', { activityId, userId })
    } catch (error) {
      return getLocalOrderForActivity(activityId, userId)
    }
  }
  return getLocalOrderForActivity(activityId, userId)
}

function ensureLocalOrderForActivity(payload) {
  const items = readOrders()
  const found = items.find((item) => item.activityId === String(payload.activityId) && item.userId === (payload.userId || getCurrentUserId()))
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

  return createLocalOrder(payload)
}

export async function ensureOrderForActivity(payload) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-order', 'ensureForActivity', buildOrder(payload))
    } catch (error) {
      return ensureLocalOrderForActivity(payload)
    }
  }
  return ensureLocalOrderForActivity(payload)
}

function updateLocalOrderStatus(id, status) {
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

export async function updateOrderStatus(id, status) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-order', 'updateStatus', { id, status })
    } catch (error) {
      return updateLocalOrderStatus(id, status)
    }
  }
  return updateLocalOrderStatus(id, status)
}

export function markOrderPaid(id) {
  return updateOrderStatus(id, 'paid')
}

function listLocalOrders() {
  return Promise.resolve(readOrders())
}

export async function listOrders(userId = getCurrentUserId()) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-order', 'list', { userId, limit: 50 })
    } catch (error) {
      return listLocalOrders()
    }
  }
  return listLocalOrders()
}
