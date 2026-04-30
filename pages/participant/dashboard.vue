<template>
  <view class="participant su-page">
    <view class="participant__nav" :style="navStyle">
      <view class="participant__nav-row" :style="navRowStyle">
      <view class="participant__nav-btn" @tap="goBackOrFallback">
        <uni-icons type="left" size="24" color="#0f172a" />
      </view>
      <text class="participant__nav-title">参与者中心</text>
      <view class="participant__nav-actions" :style="navActionsStyle">
        <view class="participant__nav-btn" @tap="goMessages">
          <uni-icons type="notification-filled" size="20" color="#0f172a" />
          <view v-if="unreadCount > 0" class="message-badge">
            <text>{{ unreadCount > 99 ? '99+' : unreadCount }}</text>
          </view>
        </view>
        <view class="participant__nav-btn" @tap="goActivityDetail(activity.id)">
          <uni-icons type="paperplane-filled" size="20" color="#0f172a" />
        </view>
      </view>
      </view>
    </view>

    <scroll-view scroll-y class="participant__scroll" :style="contentTopStyle">
      <view class="hero">
        <view class="hero__cover-wrap">
          <image class="hero__cover" :src="activity.image" mode="aspectFill" />
          <view class="hero__badge" :class="`hero__badge--${activity.partyMode}`">
            <text>{{ modeLabel }}</text>
          </view>
        </view>

        <view class="hero__content">
          <view class="hero__topline">
            <text class="hero__title">{{ activity.title }}</text>
            <text class="hero__state" :class="`hero__state--${applicationState.key}`">{{ applicationState.label }}</text>
          </view>
          <text class="hero__meta">{{ activity.date }} {{ activity.time }} - {{ activity.endTime }}</text>
          <text class="hero__meta">{{ activity.location }}</text>

          <view class="hero__chips">
            <text class="hero__chip">{{ paymentState.label }}</text>
            <text class="hero__chip hero__chip--alt">{{ checkinState.label }}</text>
          </view>
        </view>
      </view>

      <view class="panel">
        <view class="panel__head">
          <view>
            <text class="panel__title">入场凭证</text>
            <text class="panel__sub">ACCESS PASS</text>
          </view>
          <view class="panel__head-action" @tap="refreshEntryCode">
            <uni-icons type="refresh" size="18" color="#3b82f6" />
            <text>刷新</text>
          </view>
        </view>

        <view class="code-box">
          <text class="code-box__label">{{ entryLabel }}</text>
          <text class="code-box__code">{{ entryCode || '等待审核通过后生成' }}</text>
          <text class="code-box__hint">{{ entryHint }}</text>
          <text v-if="reviewFeedback" class="code-box__feedback" :class="{ 'code-box__feedback--danger': applicationState.key === 'rejected' }">
            {{ reviewFeedback }}
          </text>
        </view>

        <view class="action-row">
          <view class="action-row__btn" @tap="copyEntryCode">
            <uni-icons type="link" size="18" color="#0f172a" />
            <text>复制凭证</text>
          </view>
          <view class="action-row__btn action-row__btn--primary" @tap="handlePrimaryAction">
            <uni-icons :type="primaryIcon" size="18" color="#fff" />
            <text>{{ primaryActionText }}</text>
          </view>
        </view>
        <view v-if="order" class="order-strip" @tap="goOrderDetail(order.id)">
          <text>{{ order.type === 'ticket' ? '门票订单' : '诚意金订单' }}</text>
          <text>{{ getOrderStatusText(order.status) }} · 查看详情</text>
        </view>
      </view>

      <view class="stats">
        <view v-for="item in statCards" :key="item.label" class="stat" :class="`stat--${item.tone}`">
          <text class="stat__label">{{ item.label }}</text>
          <text class="stat__value">{{ item.value }}</text>
          <text class="stat__desc">{{ item.desc }}</text>
        </view>
      </view>

      <view class="panel">
        <view class="panel__head">
          <view>
            <text class="panel__title">相关消息</text>
            <text class="panel__sub">RELATED UPDATES</text>
          </view>
          <view class="panel__head-action" @tap="goMessages">
            <text>进入消息中心</text>
          </view>
        </view>

        <view v-if="relatedMessages.length === 0" class="empty">
          <uni-icons type="notification-filled" size="38" color="#cbd5e1" />
          <text>暂无活动相关消息</text>
        </view>

        <view v-for="item in relatedMessages" :key="item.id" class="message-card" @tap="handleMessageTap(item)">
          <view class="message-card__icon" :class="`message-card__icon--${item.type}`">
            <uni-icons :type="getMessageIcon(item)" size="20" color="#fff" />
          </view>
          <view class="message-card__body">
            <view class="message-card__row">
              <text class="message-card__title su-line-1">{{ item.title }}</text>
              <text class="message-card__time">{{ item.createdAt }}</text>
            </view>
            <text class="message-card__content su-line-2">{{ item.content }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getActivityDetail, getActivityStatusMeta } from '@/common/api/activity.js'
import { getCurrentUserId } from '@/common/api/auth.js'
import { listApplications } from '@/common/api/application.js'
import { buildParticipantCheckinCode, confirmCheckin, getCheckinForUser } from '@/common/api/checkin.js'
import { getUnreadMessageCount, listMessages, markMessageRead } from '@/common/api/message.js'
import { getOrderStatusText, listOrders } from '@/common/api/order.js'
import { createEmptyActivity } from '@/common/utils/activity-default.js'
import { getMiniProgramNavActionsStyle, getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goBackOrFallback, goMessages, goManageDashboard, goOrderDetail, goParticipantDashboard, goPayment } from '@/common/utils/route.js'

const activityId = ref('103')
const activity = ref(createEmptyActivity('103'))
const application = ref(null)
const order = ref(null)
const checkin = ref(null)
const entryCode = ref('')
const relatedMessages = ref([])
const unreadCount = ref(0)
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const navActionsStyle = getMiniProgramNavActionsStyle({ leftReserveRpx: 420 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 24 })

const modeLabel = computed(() => {
  if (activity.value.partyMode === 'sincerity') return `诚意金 ¥${activity.value.amount}`
  if (activity.value.partyMode === 'ticket') return `门票 ¥${activity.value.amount}`
  return '免费局'
})

const activityStatusMeta = computed(() => getActivityStatusMeta(activity.value))
const isTerminalActivity = computed(() => ['finished', 'cancelled', 'hidden', 'rejected'].includes(activityStatusMeta.value.key))

const applicationState = computed(() => {
  if (activity.value.isCreator) return { key: 'leader', label: '局长模式' }
  if (activity.value.applicationStatus === 'approved') return { key: 'approved', label: '已通过' }
  if (activity.value.applicationStatus === 'pending') return { key: 'pending', label: '审核中' }
  if (activity.value.applicationStatus === 'rejected') return { key: 'rejected', label: '未通过' }
  if (!application.value) return { key: 'none', label: '未报名' }
  return {
    key: application.value.status,
    label:
      application.value.status === 'approved'
        ? '已通过'
        : application.value.status === 'pending'
          ? '审核中'
          : '未通过'
  }
})

const reviewFeedback = computed(() => {
  const rejectReason = application.value?.rejectReason || activity.value.rejectReason || ''
  const reviewNote = application.value?.reviewNote || activity.value.reviewNote || ''
  if (applicationState.value.key === 'rejected') return rejectReason || '局长暂未填写拒绝原因'
  if (applicationState.value.key === 'approved') return reviewNote
  return ''
})

const paymentState = computed(() => {
  if (activity.value.partyMode === 'free') return { key: 'free', label: '无需支付', desc: '本局免费参与' }
  if (!order.value) return { key: 'pending', label: '待支付', desc: '进入支付页确认试运营订单' }
  if (order.value.status === 'paid') return { key: 'paid', label: '已支付', desc: `订单号 ${order.value.id}` }
  if (order.value.status === 'refunded') return { key: 'refunded', label: '已退款', desc: order.value.refundNote || '退款状态已登记' }
  if (order.value.status === 'closed') return { key: 'closed', label: '已关闭', desc: order.value.closeReason || '订单已关闭' }
  return { key: 'pending', label: '待支付', desc: '仍可继续确认' }
})

const checkinState = computed(() => {
  if (activity.value.isCreator) return { key: 'leader', label: '可管理签到', desc: '局长可直接进入管理台' }
  if (isTerminalActivity.value) return { key: 'closed', label: activityStatusMeta.value.label, desc: '当前活动不可继续现场签到' }
  if (activity.value.applicationStatus === 'pending' || applicationState.value.key === 'pending') {
    return { key: 'waiting', label: '等待审核', desc: '通过后生成入场凭证' }
  }
  if (checkin.value) return { key: 'done', label: '已签到', desc: `签到时间 ${checkin.value.checkedAt}` }
  if (activity.value.partyMode !== 'free' && paymentState.value.key !== 'paid') {
    return { key: 'pay', label: '先去支付', desc: '支付后可进入签到流程' }
  }
  return { key: 'ready', label: '待签到', desc: '到场后可完成核销' }
})

const entryLabel = computed(() => {
  if (activity.value.isCreator) return '局长管理码'
  if (isTerminalActivity.value) return activityStatusMeta.value.label
  if (applicationState.value.key === 'pending') return '等待审核'
  if (applicationState.value.key === 'rejected') return '未通过'
  if (paymentState.value.key === 'pending' && activity.value.partyMode !== 'free') return '待支付'
  if (checkin.value) return '已签到'
  return '入场凭证'
})

const entryHint = computed(() => {
  if (activity.value.isCreator) return '局长可进入管理台查看审核、签到和消息'
  if (isTerminalActivity.value) return '活动已进入终态，凭证仅作记录查看'
  if (applicationState.value.key === 'pending') return '审核通过后会自动生成凭证'
  if (applicationState.value.key === 'rejected') return reviewFeedback.value || '当前申请未通过，返回详情页查看原因'
  if (paymentState.value.key === 'pending' && activity.value.partyMode !== 'free') return '先完成支付，再进入签到'
  if (checkin.value) return '凭证已完成核销'
  return '可复制后在现场展示'
})

const statCards = computed(() => [
  { label: '报名状态', value: applicationState.value.label, desc: '当前入局审核结果', tone: applicationState.value.key === 'approved' ? 'green' : 'blue' },
  { label: '支付状态', value: paymentState.value.label, desc: paymentState.value.desc, tone: paymentState.value.key === 'paid' ? 'green' : 'orange' },
  { label: '签到状态', value: checkinState.value.label, desc: checkinState.value.desc, tone: checkinState.value.key === 'done' ? 'green' : 'dark' }
])

const primaryActionText = computed(() => {
  if (activity.value.isCreator) return '进入管理台'
  if (isTerminalActivity.value) return '查看活动详情'
  if (applicationState.value.key === 'pending') return '等待审核'
  if (applicationState.value.key === 'rejected') return '返回详情页'
  if (['refunded', 'closed'].includes(paymentState.value.key)) return '查看订单'
  if (activity.value.partyMode !== 'free' && paymentState.value.key !== 'paid') return '去支付'
  if (checkin.value) return '已完成签到'
  return '确认签到'
})

const primaryIcon = computed(() => {
  if (activity.value.isCreator) return 'staff-filled'
  if (activity.value.partyMode !== 'free' && paymentState.value.key !== 'paid') return 'wallet-filled'
  if (checkin.value) return 'checkmarkempty'
  return 'scan'
})

onLoad(async (query) => {
  activityId.value = (query && query.id) || '103'
  await loadState()
})

onShow(async () => {
  await loadState()
})

async function loadState() {
  const userId = getCurrentUserId()
  const [detail, applications, orders, currentCheckin, messages] = await Promise.all([
    getActivityDetail(activityId.value),
    listApplications(activityId.value),
    listOrders(),
    getCheckinForUser(activityId.value, userId),
    listMessages()
  ])

  activity.value = detail
  application.value = applications.find((item) => item.activityId === String(activityId.value)) || null
  order.value = orders.find((item) => item.activityId === String(activityId.value) && item.userId === userId) || null
  checkin.value = currentCheckin || null
  relatedMessages.value = messages.filter((item) => item.activityId === String(activityId.value)).slice(0, 3)
  unreadCount.value = messages.filter((item) => !item.read).length

  if (activity.value.isCreator || applicationState.value.key === 'approved') {
    entryCode.value = buildParticipantCheckinCode(activityId.value, userId)
  } else {
    entryCode.value = ''
  }
}

function getMessageIcon(item) {
  if (item.type === 'application') return 'personadd-filled'
  if (item.type === 'activity') return 'calendar'
  return 'notification-filled'
}

function refreshEntryCode() {
  if (!activity.value.isCreator && applicationState.value.key !== 'approved') {
    uni.showToast({ title: '审核通过后才能刷新凭证', icon: 'none' })
    return
  }

  Promise.resolve().then(() => {
    entryCode.value = buildParticipantCheckinCode(activityId.value, getCurrentUserId())
    uni.showToast({ title: '凭证已刷新', icon: 'none' })
  })
}

function copyEntryCode() {
  if (!entryCode.value) {
    uni.showToast({ title: '暂无可复制凭证', icon: 'none' })
    return
  }

  uni.setClipboardData({
    data: entryCode.value,
    success() {
      uni.showToast({ title: '已复制凭证', icon: 'none' })
    }
  })
}

async function handlePrimaryAction() {
  if (activity.value.isCreator) {
    goManageDashboard(activityId.value)
    return
  }

  if (isTerminalActivity.value) {
    goActivityDetail(activityId.value)
    return
  }

  if (applicationState.value.key === 'pending') {
    uni.showToast({ title: '等待局长审核', icon: 'none' })
    return
  }

  if (applicationState.value.key === 'rejected') {
    goActivityDetail(activityId.value)
    return
  }

  if (['refunded', 'closed'].includes(paymentState.value.key) && order.value) {
    goOrderDetail(order.value.id)
    return
  }

  if (activity.value.partyMode !== 'free' && paymentState.value.key !== 'paid') {
    goPayment({
      activityId: activityId.value,
      type: activity.value.partyMode,
      amount: activity.value.amount
    })
    return
  }

  if (checkin.value) {
    uni.showToast({ title: '已完成签到', icon: 'none' })
    return
  }

  if (paymentState.value.key === 'refunded' || paymentState.value.key === 'closed') {
    uni.showToast({ title: '订单状态不可签到', icon: 'none' })
    return
  }

  if (!entryCode.value) {
    entryCode.value = buildParticipantCheckinCode(activityId.value, getCurrentUserId())
  }

  await confirmCheckin({
    activityId: activityId.value,
    activityTitle: activity.value.title,
    code: entryCode.value,
    userId: getCurrentUserId(),
    source: 'participant',
    remark: '参与者中心确认签到'
  })
  await loadState()
  uni.showToast({ title: '签到成功', icon: 'none' })
}

async function handleMessageTap(item) {
  await markMessageRead(item.id)
  relatedMessages.value = relatedMessages.value.map((msg) => (msg.id === item.id ? { ...msg, read: true } : msg))
  unreadCount.value = await getUnreadMessageCount()

  if (item.type === 'application') {
    goManageDashboard(item.activityId)
    return
  }

  if ((item.type === 'activity' || item.type === 'system') && item.activityId) {
    const target = item.activityId === activity.value.id ? activity.value : await getActivityDetail(item.activityId)
    if (target?.isCreator) {
      goManageDashboard(item.activityId)
      return
    }
    if (['approved', 'pending'].includes(target?.applicationStatus)) {
      goParticipantDashboard(item.activityId)
      return
    }
    goActivityDetail(item.activityId)
    return
  }

  uni.showToast({ title: '已标记为已读', icon: 'none' })
}
</script>

<style scoped>
.participant {
  min-height: 100vh;
  background: #f8f9f9;
}

.participant__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  background: rgba(248, 249, 249, 0.92);
  backdrop-filter: blur(18px);
}

.participant__nav-row {
  display: flex;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
}

.participant__nav-btn,
.participant__nav-actions {
  display: flex;
  align-items: center;
}

.participant__nav-btn {
  position: relative;
  width: 72rpx;
  height: 72rpx;
  justify-content: center;
  border: 1rpx solid #f1f5f9;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.06);
}

.participant__nav-title {
  color: #0f172a;
  font-size: 32rpx;
  font-weight: 900;
}

.participant__nav-actions {
  gap: 12rpx;
  flex-shrink: 0;
  overflow: hidden;
}

.message-badge {
  position: absolute;
  top: 7rpx;
  right: 6rpx;
  display: flex;
  min-width: 30rpx;
  height: 30rpx;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  border: 4rpx solid #fff;
  border-radius: 999rpx;
  background: #ef4444;
  color: #fff;
  font-size: 18rpx;
  font-weight: 900;
  line-height: 1;
  box-sizing: border-box;
}

.participant__scroll {
  height: 100vh;
  box-sizing: border-box;
  padding-bottom: 60rpx;
}

.hero {
  margin: 0 34rpx 28rpx;
  overflow: hidden;
  border-radius: 40rpx;
  background: #fff;
  box-shadow: 0 22rpx 58rpx rgba(15, 23, 42, 0.06);
}

.hero__cover-wrap {
  position: relative;
  height: 320rpx;
}

.hero__cover {
  width: 100%;
  height: 100%;
}

.hero__badge {
  position: absolute;
  top: 24rpx;
  left: 24rpx;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  color: #fff;
  font-size: 20rpx;
  font-weight: 900;
  background: #22c55e;
}

.hero__badge--sincerity {
  background: #ef4444;
}

.hero__badge--ticket {
  background: #8b5cf6;
}

.hero__content {
  padding: 32rpx;
}

.hero__topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.hero__title {
  color: #0f172a;
  font-size: 38rpx;
  font-weight: 900;
  line-height: 1.4;
}

.hero__state {
  flex: 0 0 auto;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #e0e7ff;
  color: #4f46e5;
  font-size: 20rpx;
  font-weight: 900;
}

.hero__state--approved,
.hero__state--leader {
  background: #dcfce7;
  color: #16a34a;
}

.hero__state--pending {
  background: #fef3c7;
  color: #d97706;
}

.hero__state--rejected {
  background: #fee2e2;
  color: #ef4444;
}

.hero__meta {
  display: block;
  margin-top: 12rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.5;
}

.hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 22rpx;
}

.hero__chip {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #0f172a;
  color: #fff;
  font-size: 20rpx;
  font-weight: 900;
}

.hero__chip--alt {
  background: #e2e8f0;
  color: #334155;
}

.panel {
  margin: 0 34rpx 26rpx;
  padding: 30rpx;
  border-radius: 38rpx;
  background: #fff;
  box-shadow: 0 18rpx 46rpx rgba(15, 23, 42, 0.05);
}

.panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.panel__title {
  display: block;
  color: #0f172a;
  font-size: 31rpx;
  font-weight: 900;
}

.panel__sub {
  display: block;
  margin-top: 6rpx;
  color: #cbd5e1;
  font-size: 18rpx;
  font-weight: 900;
}

.panel__head-action {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  color: #3b82f6;
  font-size: 20rpx;
  font-weight: 900;
}

.code-box {
  margin-top: 24rpx;
  padding: 30rpx;
  border-radius: 30rpx;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(34, 197, 94, 0.08));
}

.code-box__label {
  display: block;
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 900;
}

.code-box__code {
  display: block;
  margin-top: 10rpx;
  color: #0f172a;
  font-size: 46rpx;
  font-style: italic;
  font-weight: 900;
  letter-spacing: 4rpx;
}

.code-box__hint {
  display: block;
  margin-top: 12rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.5;
}

.code-box__feedback {
  display: block;
  margin-top: 16rpx;
  padding: 16rpx 18rpx;
  border-radius: 20rpx;
  background: #dcfce7;
  color: #16a34a;
  font-size: 22rpx;
  font-weight: 900;
  line-height: 1.5;
}

.code-box__feedback--danger {
  background: #fee2e2;
  color: #ef4444;
}

.action-row {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 14rpx;
  margin-top: 24rpx;
}

.action-row__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  height: 86rpx;
  border-radius: 26rpx;
  background: #f8fafc;
  color: #0f172a;
  font-size: 24rpx;
  font-weight: 900;
}

.action-row__btn--primary {
  background: #0f172a;
  color: #fff;
}

.order-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 16rpx;
  padding: 20rpx 22rpx;
  border-radius: 24rpx;
  background: #f8fafc;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 900;
}

.order-strip text:first-child {
  color: #0f172a;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin: 0 34rpx 26rpx;
}

.stat {
  padding: 24rpx 22rpx;
  border-radius: 30rpx;
  background: #fff;
  box-shadow: 0 16rpx 38rpx rgba(15, 23, 42, 0.05);
}

.stat--green {
  background: rgba(34, 197, 94, 0.1);
}

.stat--blue {
  background: rgba(59, 130, 246, 0.1);
}

.stat--orange {
  background: rgba(245, 158, 11, 0.12);
}

.stat--dark {
  background: rgba(15, 23, 42, 0.06);
}

.stat__label {
  display: block;
  color: #64748b;
  font-size: 20rpx;
  font-weight: 900;
}

.stat__value {
  display: block;
  margin-top: 10rpx;
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 900;
}

.stat__desc {
  display: block;
  margin-top: 8rpx;
  color: #94a3b8;
  font-size: 18rpx;
  font-weight: 800;
  line-height: 1.4;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 14rpx;
  padding: 90rpx 0;
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 900;
}

.message-card {
  display: flex;
  gap: 18rpx;
  margin-top: 18rpx;
  padding: 22rpx 0 0;
  border-top: 1rpx solid #f1f5f9;
}

.message-card__icon {
  display: flex;
  width: 72rpx;
  height: 72rpx;
  flex: 0 0 72rpx;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
}

.message-card__icon--application {
  background: #8b5cf6;
}

.message-card__icon--activity {
  background: #3b82f6;
}

.message-card__icon--system {
  background: #22c55e;
}

.message-card__body {
  flex: 1;
  min-width: 0;
}

.message-card__row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14rpx;
}

.message-card__title {
  color: #0f172a;
  font-size: 24rpx;
  font-weight: 900;
}

.message-card__time {
  color: #cbd5e1;
  font-size: 18rpx;
  font-weight: 900;
  white-space: nowrap;
}

.message-card__content {
  display: block;
  margin-top: 10rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.5;
}
</style>
