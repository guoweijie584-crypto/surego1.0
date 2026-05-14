import { USE_UNICLOUD, shouldUseReferenceMockPreview } from '../config/runtime.js'
import { callSuregoFunction, handleSuregoCloudError } from '@/common/api/cloud.js'
import { getCurrentUserId } from '@/common/api/auth.js'
import { createMessage } from '@/common/api/message.js'

const STORAGE_KEY = 'surego_orders'
const ORDER_STATUSES = ['pending', 'pending_payment', 'paid', 'frozen', 'refunding', 'refunded', 'settled', 'disputed', 'closed']

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
    pending_payment: '待支付',
    paid: '已支付',
    frozen: '已冻结',
    refunding: '退款处理中',
    refunded: '已退款',
    settled: '已结算',
    disputed: '争议处理中',
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

async function safeCreateMessage(payload) {
  try {
    return await createMessage(payload)
  } catch (error) {
    console.warn('[surego-message] create failed', error)
    return null
  }
}

function getOrderMessageCopy(status, order = {}) {
  const title = order.activityTitle || '活动订单'
  const labels = {
    paid: {
      title: '支付成功',
      content: `「${title}」订单支付成功，入场凭证已更新。`
    },
    frozen: {
      title: '占位已确认',
      content: `「${title}」已完成占位确认，活动开始前可在我的页查看后续凭证。`
    },
    closed: {
      title: '订单已关闭',
      content: order.closeReason
        ? `「${title}」订单已关闭：${order.closeReason}`
        : `「${title}」订单已关闭。`
    },
    refunding: {
      title: '退款处理中',
      content: order.refundNote
        ? `「${title}」退款处理中：${order.refundNote}`
        : `「${title}」退款处理中。`
    },
    refunded: {
      title: '退款已记录',
      content: order.refundNote
        ? `「${title}」退款已记录：${order.refundNote}`
        : `「${title}」退款已记录。`
    },
    settled: {
      title: '结算已完成',
      content: `「${title}」已完成结算，状态已同步到你的活动记录。`
    },
    disputed: {
      title: '订单存在争议',
      content: `「${title}」当前有争议待处理，请留意后续通知。`
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

function createLocalOrder(payload) {
  const items = readOrders()
  const order = normalizeOrder(buildOrder(payload))

  writeOrders([order, ...items])
  return Promise.resolve(order)
}

export async function createOrder(payload) {
  if (shouldUseReferenceMockPreview()) {
    return createLocalOrder(payload)
  }
  if (USE_UNICLOUD) {
    try {
      return normalizeOrder(await callSuregoFunction('surego-order', 'create', buildOrder(payload)))
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
  if (shouldUseReferenceMockPreview()) {
    return getLocalOrderForActivity(activityId, userId)
  }
  if (USE_UNICLOUD) {
    try {
      const order = await callSuregoFunction('surego-order', 'getForActivity', { activityId, userId })
      return order ? normalizeOrder(order) : null
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
  if (shouldUseReferenceMockPreview()) {
    return ensureLocalOrderForActivity(payload)
  }
  if (USE_UNICLOUD) {
    try {
      return normalizeOrder(await callSuregoFunction('surego-order', 'ensureForActivity', buildOrder(payload)))
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
  let order
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      order = normalizeOrder(await callSuregoFunction('surego-order', 'updateStatus', { id, status, ...options }))
    } catch (error) {
      order = await handleSuregoCloudError(error, () => updateLocalOrderStatus(id, status, options))
    }
  } else {
    order = await updateLocalOrderStatus(id, status, options)
  }
  await notifyOrderStatus(order, normalizeOrderStatus(status), options)
  return order
}

export function markOrderPaid(id, options = {}) {
  return updateOrderStatus(id, 'paid', options)
}

export function markOrderFrozen(id, options = {}) {
  return updateOrderStatus(id, 'frozen', options)
}

export async function refundOrder(id, refundNote = '退款状态已登记', options = {}) {
  let order
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      order = normalizeOrder(await callSuregoFunction('surego-order', 'refund', { id, refundNote }))
    } catch (error) {
      order = await handleSuregoCloudError(error, () => updateLocalOrderStatus(id, 'refunded', { refundNote, ...options }))
    }
  } else {
    order = await updateLocalOrderStatus(id, 'refunded', { refundNote, ...options })
  }
  await notifyOrderStatus(order, 'refunded', { ...options, refundNote })
  return order
}

export async function closeOrder(id, closeReason = '订单已关闭', options = {}) {
  let order
  if (USE_UNICLOUD && !shouldUseReferenceMockPreview()) {
    try {
      order = normalizeOrder(await callSuregoFunction('surego-order', 'close', { id, closeReason }))
    } catch (error) {
      order = await handleSuregoCloudError(error, () => updateLocalOrderStatus(id, 'closed', { closeReason, ...options }))
    }
  } else {
    order = await updateLocalOrderStatus(id, 'closed', { closeReason, ...options })
  }
  await notifyOrderStatus(order, 'closed', { ...options, closeReason })
  return order
}

function getLocalOrderDetail(id) {
  const order = readOrders().find((item) => item.id === id)
  return Promise.resolve(order ? normalizeOrder(order) : null)
}

export async function getOrderDetail(id) {
  if (shouldUseReferenceMockPreview()) {
    return getLocalOrderDetail(id)
  }
  if (USE_UNICLOUD) {
    try {
      const order = await callSuregoFunction('surego-order', 'getDetail', { id })
      return order ? normalizeOrder(order) : null
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
  if (shouldUseReferenceMockPreview()) {
    return listLocalOrders(userId)
  }
  if (USE_UNICLOUD) {
    try {
      const orders = await callSuregoFunction('surego-order', 'list', { userId, limit: 50 })
      return Array.isArray(orders) ? orders.map(normalizeOrder) : []
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
  if (shouldUseReferenceMockPreview()) {
    return listLocalOrdersByActivity(activityId)
  }
  if (USE_UNICLOUD) {
    try {
      const orders = await callSuregoFunction('surego-order', 'listByActivity', { activityId, limit: 100 })
      return Array.isArray(orders) ? orders.map(normalizeOrder) : []
    } catch (error) {
      return handleSuregoCloudError(error, () => listLocalOrdersByActivity(activityId))
    }
  }
  return listLocalOrdersByActivity(activityId)
}
