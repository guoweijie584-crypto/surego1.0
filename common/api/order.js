import { USE_UNICLOUD } from '@/common/config/runtime.js'
import { callSuregoFunction, handleSuregoCloudError } from '@/common/api/cloud.js'
import { getCurrentUserId } from '@/common/api/auth.js'

const STORAGE_KEY = 'surego_orders'
const ORDER_STATUSES = ['pending', 'paid', 'refunded', 'closed']

function readOrders() {
  return uni.getStorageSync(STORAGE_KEY) || []
}

function writeOrders(items) {
  uni.setStorageSync(STORAGE_KEY, items)
}

function normalizeOrderStatus(status = 'pending') {
  return ORDER_STATUSES.includes(status) ? status : 'pending'
}

export function getOrderStatusText(status) {
  const labels = {
    pending: '待支付',
    paid: '已支付',
    refunded: '已退款',
    closed: '已关闭'
  }
  return labels[normalizeOrderStatus(status)] || labels.pending
}

function normalizeOrder(item = {}) {
  const status = normalizeOrderStatus(item.status)
  return {
    ...item,
    id: item.id || item._id || '',
    activityId: String(item.activityId || item.activity_id || ''),
    userId: item.userId || item.user_id || getCurrentUserId(),
    type: item.type || 'sincerity',
    amount: Number(item.amount) || 0,
    status,
    statusText: getOrderStatusText(status),
    activityTitle: item.activityTitle || item.activity_title || '',
    activityCover: item.activityCover || item.activity_cover || '',
    refundNote: item.refundNote || item.refund_note || '',
    closeReason: item.closeReason || item.close_reason || '',
    createdAt: item.createdAt || item.created_at || '',
    updatedAt: item.updatedAt || item.updated_at || '',
    paidAt: item.paidAt || item.paid_at || '',
    refundedAt: item.refundedAt || item.refunded_at || '',
    closedAt: item.closedAt || item.closed_at || ''
  }
}

function buildOrder(payload, status = 'pending') {
  const now = new Date().toISOString()
  return {
    id: payload.id || `order_${Date.now()}`,
    activityId: String(payload.activityId),
    userId: payload.userId || getCurrentUserId(),
    type: payload.type,
    amount: Number(payload.amount) || 0,
    status: normalizeOrderStatus(payload.status || status),
    activityTitle: payload.activityTitle || payload.title || '',
    activityCover: payload.activityCover || payload.image || '',
    refundNote: payload.refundNote || '',
    closeReason: payload.closeReason || '',
    createdAt: payload.createdAt || now,
    updatedAt: now,
    paidAt: payload.paidAt || '',
    refundedAt: payload.refundedAt || '',
    closedAt: payload.closedAt || ''
  }
}

function createLocalOrder(payload) {
  const items = readOrders()
  const order = normalizeOrder(buildOrder(payload))

  writeOrders([order, ...items])
  return Promise.resolve(order)
}

export async function createOrder(payload) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-order', 'create', buildOrder(payload))
    } catch (error) {
      return handleSuregoCloudError(error, () => createLocalOrder(payload))
    }
  }
  return createLocalOrder(payload)
}

function getLocalOrderForActivity(activityId, userId = getCurrentUserId()) {
  const order = readOrders().find((item) => item.activityId === String(activityId) && item.userId === userId)
  return Promise.resolve(order ? normalizeOrder(order) : null)
}

export async function getOrderForActivity(activityId, userId = getCurrentUserId()) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-order', 'getForActivity', { activityId, userId })
    } catch (error) {
      return handleSuregoCloudError(error, () => getLocalOrderForActivity(activityId, userId))
    }
  }
  return getLocalOrderForActivity(activityId, userId)
}

function ensureLocalOrderForActivity(payload) {
  const items = readOrders()
  const found = items.find((item) => item.activityId === String(payload.activityId) && item.userId === (payload.userId || getCurrentUserId()))
  if (found) {
    const nextOrder = normalizeOrder({
      ...found,
      type: payload.type || found.type,
      amount: Number(payload.amount ?? found.amount) || 0,
      activityTitle: payload.activityTitle || found.activityTitle,
      activityCover: payload.activityCover || found.activityCover,
      updatedAt: new Date().toISOString()
    })
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
      return handleSuregoCloudError(error, () => ensureLocalOrderForActivity(payload))
    }
  }
  return ensureLocalOrderForActivity(payload)
}

function updateLocalOrderStatus(id, status, options = {}) {
  const nextStatus = normalizeOrderStatus(status)
  const now = new Date().toISOString()
  const next = readOrders().map((item) => (
    item.id === id
      ? normalizeOrder({
          ...item,
          status: nextStatus,
          refundNote: options.refundNote || item.refundNote || '',
          closeReason: options.closeReason || item.closeReason || '',
          paidAt: nextStatus === 'paid' ? (item.paidAt || now) : item.paidAt,
          refundedAt: nextStatus === 'refunded' ? now : item.refundedAt,
          closedAt: nextStatus === 'closed' ? now : item.closedAt,
          updatedAt: now
        })
      : item
  ))
  writeOrders(next)
  const found = next.find((item) => item.id === id)
  return Promise.resolve(found ? normalizeOrder(found) : null)
}

export async function updateOrderStatus(id, status, options = {}) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-order', 'updateStatus', { id, status, ...options })
    } catch (error) {
      return handleSuregoCloudError(error, () => updateLocalOrderStatus(id, status, options))
    }
  }
  return updateLocalOrderStatus(id, status, options)
}

export function markOrderPaid(id) {
  return updateOrderStatus(id, 'paid')
}

export async function refundOrder(id, refundNote = '模拟退款已记录') {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-order', 'refund', { id, refundNote })
    } catch (error) {
      return handleSuregoCloudError(error, () => updateLocalOrderStatus(id, 'refunded', { refundNote }))
    }
  }
  return updateLocalOrderStatus(id, 'refunded', { refundNote })
}

export async function closeOrder(id, closeReason = '订单已关闭') {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-order', 'close', { id, closeReason })
    } catch (error) {
      return handleSuregoCloudError(error, () => updateLocalOrderStatus(id, 'closed', { closeReason }))
    }
  }
  return updateLocalOrderStatus(id, 'closed', { closeReason })
}

function getLocalOrderDetail(id) {
  const order = readOrders().find((item) => item.id === id)
  return Promise.resolve(order ? normalizeOrder(order) : null)
}

export async function getOrderDetail(id) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-order', 'getDetail', { id })
    } catch (error) {
      return handleSuregoCloudError(error, () => getLocalOrderDetail(id))
    }
  }
  return getLocalOrderDetail(id)
}

function listLocalOrders(userId = getCurrentUserId()) {
  return Promise.resolve(readOrders().filter((item) => item.userId === userId).map(normalizeOrder))
}

export async function listOrders(userId = getCurrentUserId()) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-order', 'list', { userId, limit: 50 })
    } catch (error) {
      return handleSuregoCloudError(error, () => listLocalOrders(userId))
    }
  }
  return listLocalOrders(userId)
}

export async function listOrdersByStatus(status = 'all', userId = getCurrentUserId()) {
  const orders = await listOrders(userId)
  if (!status || status === 'all') return orders
  return orders.filter((item) => item.status === status)
}

function listLocalOrdersByActivity(activityId) {
  return Promise.resolve(readOrders().filter((item) => item.activityId === String(activityId)).map(normalizeOrder))
}

export async function listOrdersByActivity(activityId) {
  if (USE_UNICLOUD) {
    try {
      return await callSuregoFunction('surego-order', 'listByActivity', { activityId, limit: 100 })
    } catch (error) {
      return handleSuregoCloudError(error, () => listLocalOrdersByActivity(activityId))
    }
  }
  return listLocalOrdersByActivity(activityId)
}
