import { USE_UNICLOUD } from '../config/runtime.js'
import { callSuregoFunction, handleSuregoCloudError } from '@/common/api/cloud.js'
import { getCurrentUserId } from '@/common/api/auth.js'
import { createMessage } from '@/common/api/message.js'

const STORAGE_KEY = 'surego_orders'
const ORDER_STATUSES = ['pending', 'paid', 'refund_requested', 'refunded', 'closed']

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
    refund_requested: '退款申请中',
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

function normalizeOrders(items = []) {
  return items.map(normalizeOrder)
}

function createLocalOrder(payload) {
  const now = Date.now()
  const order = normalizeOrder({
    id: payload.id || `order_${now}`,
    activityId: String(payload.activityId || ''),
    userId: payload.userId || getCurrentUserId(),
    type: payload.type || 'sincerity',
    amount: Number(payload.amount) || 0,
    status: 'pending',
    activityTitle: payload.activityTitle || payload.title || '',
    activityCover: payload.activityCover || payload.image || '',
    refundNote: '',
    closeReason: '',
    createdAt: now,
    updatedAt: now,
    paidAt: '',
    refundedAt: '',
    closedAt: ''
  })
  const items = readOrders()
  writeOrders([order, ...items.filter((item) => item.id !== order.id)])
  return Promise.resolve(order)
}

function mergeOrderCache(order) {
  const normalized = normalizeOrder(order)
  const items = readOrders()
  writeOrders([normalized, ...items.filter((item) => item.id !== normalized.id)])
  return normalized
}

function replaceOrderCache(orders = []) {
  const normalized = normalizeOrders(orders)
  const byId = new Map()
  normalized.forEach((item) => byId.set(item.id, item))
  writeOrders(Array.from(byId.values()))
  return Array.from(byId.values())
}

async function safeCreateMessage(payload) {
  try {
    return await createMessage(payload)
  } catch (error) {
    return null
  }
}

function getOrderMessageCopy(status, order = {}) {
  const title = order.activityTitle || '活动订单'
  const labels = {
    paid: {
      title: '支付成功',
      content: `《${title}》订单支付成功，入场凭证已更新。`
    },
    closed: {
      title: '订单已关闭',
      content: order.closeReason
        ? `《${title}》订单已关闭：${order.closeReason}`
        : `《${title}》订单已关闭。`
    },
    refunded: {
      title: '退款已记录',
      content: order.refundNote
        ? `《${title}》退款已记录：${order.refundNote}`
        : `《${title}》退款已记录。`
    },
    refund_requested: {
      title: '退款申请已提交',
      content: order.refundNote
        ? `《${title}》退款申请已提交：${order.refundNote}`
        : `《${title}》退款申请已提交。`
    }
  }
  return labels[status] || null
}

async function notifyOrderStatus(order = {}, status = '', options = {}) {
  const nextOrder = normalizeOrder({
    ...(options.order || {}),
    ...order,
    activityId: order.activityId || order.activity_id || options.activityId || options.order?.activityId || options.order?.activity_id,
    userId: order.userId || order.user_id || options.userId || options.order?.userId || options.order?.user_id,
    activityTitle: order.activityTitle || options.activityTitle || options.title || options.order?.activityTitle,
    activityCover: order.activityCover || options.activityCover || options.image || options.order?.activityCover,
    refundNote: order.refundNote || options.refundNote || options.order?.refundNote,
    closeReason: order.closeReason || options.closeReason || options.order?.closeReason
  })
  const copy = getOrderMessageCopy(status, nextOrder)
  if (!copy) return null

  return safeCreateMessage({
    userId: nextOrder.userId || getCurrentUserId(),
    eventKey: `order:status:${nextOrder.id || options.orderId || nextOrder.activityId}:${status}`,
    type: 'activity',
    title: copy.title,
    content: copy.content,
    sender: 'SureGo',
    activityId: nextOrder.activityId,
    read: false
  })
}

function getLocalOrderForActivity(activityId, userId = getCurrentUserId()) {
  const order = readOrders().find((item) => item.activityId === String(activityId) && item.userId === userId)
  return Promise.resolve(order ? normalizeOrder(order) : null)
}

function ensureLocalOrderForActivity(payload) {
  const items = readOrders()
  const found = items.find((item) => item.activityId === String(payload.activityId) && item.userId === (payload.userId || getCurrentUserId()))
  if (found) {
    const nextOrder = normalizeOrder({
      ...found,
      updatedAt: Date.now()
    })
    writeOrders(items.map((item) => (item.id === found.id ? nextOrder : item)))
    return Promise.resolve(nextOrder)
  }
  return createLocalOrder(payload)
}

function updateLocalOrderStatus(id, status, options = {}) {
  const nextStatus = normalizeOrderStatus(status)
  const now = Date.now()
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

function listLocalOrders(userId = getCurrentUserId()) {
  return Promise.resolve(readOrders().filter((item) => item.userId === userId).map(normalizeOrder))
}

function listLocalOrdersByActivity(activityId) {
  return Promise.resolve(readOrders().filter((item) => item.activityId === String(activityId)).map(normalizeOrder))
}

export async function createOrder(payload) {
  const orderPayload = {
    id: payload.id,
    activityId: payload.activityId,
    userId: payload.userId || getCurrentUserId(),
    type: payload.type || 'sincerity',
    amount: Number(payload.amount) || 0,
    activityTitle: payload.activityTitle || payload.title || '',
    activityCover: payload.activityCover || payload.image || ''
  }
  if (USE_UNICLOUD) {
    try {
      return mergeOrderCache(await callSuregoFunction('surego-order', 'create', orderPayload))
    } catch (error) {
      return handleSuregoCloudError(error, () => createLocalOrder(orderPayload))
    }
  }
  return createLocalOrder(orderPayload)
}

export async function getOrderForActivity(activityId, userId = getCurrentUserId()) {
  if (USE_UNICLOUD) {
    try {
      const order = await callSuregoFunction('surego-order', 'getForActivity', { activityId, userId })
      return order ? mergeOrderCache(order) : getLocalOrderForActivity(activityId, userId)
    } catch (error) {
      return handleSuregoCloudError(error, () => getLocalOrderForActivity(activityId, userId))
    }
  }
  return getLocalOrderForActivity(activityId, userId)
}

export async function ensureOrderForActivity(payload) {
  if (USE_UNICLOUD) {
    try {
      return mergeOrderCache(await callSuregoFunction('surego-order', 'ensureForActivity', {
        activityId: payload.activityId,
        userId: payload.userId || getCurrentUserId()
      }))
    } catch (error) {
      return handleSuregoCloudError(error, () => ensureLocalOrderForActivity(payload))
    }
  }
  return ensureLocalOrderForActivity(payload)
}

export async function updateOrderStatus(id, status, options = {}) {
  return Promise.reject({
    code: 'STATUS_UPDATE_DISABLED',
    message: 'Generic order status updates are disabled.'
  })
}

export function markOrderPaid() {
  return Promise.reject({
    code: 'PAYMENT_REQUIRED',
    message: 'Payment must be confirmed by a trusted payment callback.'
  })
}

export async function refundOrder(id, refundNote = '退款状态已登记', options = {}) {
  let order
  if (USE_UNICLOUD) {
    try {
      order = mergeOrderCache(await callSuregoFunction('surego-order', 'refund', { id, refundNote }))
    } catch (error) {
      order = await handleSuregoCloudError(error, () => updateLocalOrderStatus(id, 'refund_requested', { refundNote, ...options }))
    }
  } else {
    order = await updateLocalOrderStatus(id, 'refund_requested', { refundNote, ...options })
  }
  await notifyOrderStatus(order, 'refund_requested', { ...options, refundNote })
  return order
}

export async function closeOrder(id, closeReason = '订单已关闭', options = {}) {
  let order
  if (USE_UNICLOUD) {
    try {
      order = mergeOrderCache(await callSuregoFunction('surego-order', 'close', { id, closeReason }))
    } catch (error) {
      order = await handleSuregoCloudError(error, () => updateLocalOrderStatus(id, 'closed', { closeReason, ...options }))
    }
  } else {
    order = await updateLocalOrderStatus(id, 'closed', { closeReason, ...options })
  }
  await notifyOrderStatus(order, 'closed', { ...options, closeReason })
  return order
}

export async function getOrderDetail(id) {
  if (USE_UNICLOUD) {
    try {
      const order = await callSuregoFunction('surego-order', 'getDetail', { id })
      return order ? mergeOrderCache(order) : Promise.resolve(null)
    } catch (error) {
      return handleSuregoCloudError(error, () => Promise.resolve(readOrders().find((item) => item.id === id) || null))
    }
  }
  return Promise.resolve(readOrders().find((item) => item.id === id) || null)
}

export async function listOrders(userId = getCurrentUserId()) {
  if (USE_UNICLOUD) {
    try {
      const orders = await callSuregoFunction('surego-order', 'list', { userId, limit: 50 })
      return Array.isArray(orders) ? replaceOrderCache(orders) : listLocalOrders(userId)
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

export async function listOrdersByActivity(activityId) {
  if (USE_UNICLOUD) {
    try {
      const orders = await callSuregoFunction('surego-order', 'listByActivity', { activityId, limit: 100 })
      return Array.isArray(orders) ? replaceOrderCache(orders) : listLocalOrdersByActivity(activityId)
    } catch (error) {
      return handleSuregoCloudError(error, () => listLocalOrdersByActivity(activityId))
    }
  }
  return listLocalOrdersByActivity(activityId)
}
