<template>
  <view v-if="isPageLoading" class="ref-page">
    <SuPageLoading :style="contentTopStyle" text="参与信息加载中..." />
  </view>
  <view v-else class="ref-page">
    <view class="ref-topbar" :style="navStyle">
      <view class="ref-topbar__row" :style="navRowStyle">
        <view class="ref-back" @tap="goBackOrFallback">
          <uni-icons type="left" size="22" color="#102033" />
        </view>
        <text class="ref-topbar__title">到场凭证</text>
        <view class="ref-icon-button pass-message" @tap="goMessages">
          <uni-icons type="notification-filled" size="20" color="#102033" />
          <view v-if="unreadCount > 0" class="message-badge">
            <text>{{ unreadCount > 99 ? '99+' : unreadCount }}</text>
          </view>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="ref-scroll ref-scroll--no-tab" :style="contentTopStyle">
      <view class="ref-page-head">
        <text class="ref-page-head__eyebrow">到场凭证</text>
        <text class="ref-page-head__title">到场要用的都在这里</text>
      </view>

      <view class="ref-summary-card ref-card">
        <image :src="activity.image" mode="aspectFill" />
        <view>
          <text class="su-line-2">{{ activity.title }}</text>
          <text>{{ activity.location }}</text>
        </view>
      </view>

      <view class="ref-qr-card ref-card pass-gap">
        <SuQrCode v-if="showEntryQr" class="code-box__qr" :value="entryCode" :size="184" />
        <view v-else class="locked-qr">
          <uni-icons :type="primaryIcon" size="46" color="#94a3b8" />
        </view>
        <text class="ref-qr-card__code">{{ entryCode || '等待审核通过后生成' }}</text>
        <text class="ref-qr-card__hint">{{ entryHint }}</text>
        <text v-if="reviewFeedback" class="pass-feedback" :class="{ 'pass-feedback--danger': applicationState.key === 'rejected' }">
          {{ reviewFeedback }}
        </text>
      </view>

      <view class="ref-info-card ref-card pass-gap">
        <view class="status-line">
          <text class="ref-pill ref-pill--blue">{{ checkinState.label }}</text>
          <text>{{ activity.date }} {{ activity.time }}</text>
        </view>
        <text class="ref-info-card__text pass-meetup">{{ activity.meetup || activity.location }}</text>
        <view class="pass-status-grid">
          <view v-for="item in statCards" :key="item.label" class="pass-status" :class="`pass-status--${item.tone}`">
            <text>{{ item.value }}</text>
            <text>{{ item.label }}</text>
            <text>{{ item.desc }}</text>
          </view>
        </view>
      </view>

      <view class="ref-action-grid pass-gap">
        <view class="ref-action-grid__item" @tap="showToast('导航能力正在接入')">
          <uni-icons type="map-pin-ellipse" size="20" color="#2388ff" />
          <text>打开导航</text>
          <text>{{ activity.location }}</text>
        </view>
        <view class="ref-action-grid__item" @tap="showToast(paymentState.desc)">
          <uni-icons type="auth-filled" size="20" color="#2388ff" />
          <text>退出规则</text>
          <text>{{ paymentState.label }}</text>
        </view>
        <view class="ref-action-grid__item" @tap="showToast('申诉入口正在接入')">
          <uni-icons type="help" size="20" color="#2388ff" />
          <text>发起申诉</text>
          <text>核销或订单异常</text>
        </view>
        <view class="ref-action-grid__item" @tap="handlePrimaryAction">
          <uni-icons :type="primaryIcon" size="20" color="#2388ff" />
          <text>{{ primaryActionText }}</text>
          <text>{{ entryLabel }}</text>
        </view>
      </view>

      <view v-if="order" class="ref-info-card ref-card pass-gap" @tap="goOrderDetail(order.id, { activityId: activity.id })">
        <text class="ref-info-card__title">{{ order.type === 'ticket' ? '门票订单' : '诚意金订单' }}</text>
        <text class="ref-info-card__text">{{ getOrderStatusText(order.status) }} · 点击查看订单详情</text>
      </view>

      <view class="ref-info-card ref-card pass-gap">
        <text class="ref-info-card__title">核销后继续联系</text>
        <text class="ref-info-card__text">到场确认后可查看发起人放置的二维码或群二维码，由你自己决定是否继续联系。</text>
        <view class="contact-lock">
          <uni-icons type="scan" size="26" color="#2388ff" />
          <text>核销后可看</text>
        </view>
      </view>

      <view class="ref-info-card ref-card pass-gap">
        <view class="ref-section-title pass-section-title">
          <text>相关消息</text>
          <text @tap="goMessages">进入通知</text>
        </view>
        <view v-if="relatedMessages.length === 0" class="ref-empty">
          <uni-icons type="notification-filled" size="38" color="#cbd5e1" />
          <text>暂无活动相关消息</text>
        </view>
        <view v-for="item in relatedMessages" :key="item.id" class="pass-message-card" @tap="handleMessageTap(item)">
          <text class="ref-pill" :class="`pass-message-card__pill--${item.type}`">{{ item.type === 'application' ? '报名审核' : item.type === 'activity' ? '活动通知' : '系统' }}</text>
          <text class="pass-message-card__title su-line-1">{{ item.title }}</text>
          <text class="pass-message-card__content su-line-2">{{ item.content }}</text>
          <text class="pass-message-card__time">{{ getMessageTime(item) }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { getActivityDetail, getActivityStatusMeta } from '@/common/api/activity.js'
import { getCurrentUserId } from '@/common/api/auth.js'
import { listApplications } from '@/common/api/application.js'
import { buildParticipantCheckinCode, getCheckinForUser } from '@/common/api/checkin.js'
import { getUnreadMessageCount, listMessages, markMessageRead } from '@/common/api/message.js'
import { getOrderStatusText, listOrders } from '@/common/api/order.js'
import { createEmptyActivity } from '@/common/utils/activity-default.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import SuPageLoading from '@/components/surego/SuPageLoading.vue'
import { formatMessageTime } from '@/common/utils/time-format.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goBackOrFallback, goManageDashboard, goMessages, goOrderDetail, goParticipantDashboard, goPayment } from '@/common/utils/route.js'
import SuQrCode from '@/components/surego/SuQrCode.vue'

const activityId = ref('103')
const activity = ref(createEmptyActivity('103'))
const application = ref(null)
const order = ref(null)
const checkin = ref(null)
const entryCode = ref('')
const relatedMessages = ref([])
const unreadCount = ref(0)
const isPageLoading = ref(true)
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 22 })

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
  if (applicationState.value.key === 'rejected') return rejectReason || '发起人暂未填写拒绝原因'
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
  return '请向局长出示入场二维码'
})

const statCards = computed(() => [
  { label: '报名状态', value: applicationState.value.label, desc: '当前入局审核结果', tone: applicationState.value.key === 'approved' ? 'green' : 'blue' },
  { label: '支付状态', value: paymentState.value.label, desc: paymentState.value.desc, tone: paymentState.value.key === 'paid' ? 'green' : 'orange' },
  { label: '签到状态', value: checkinState.value.label, desc: checkinState.value.desc, tone: checkinState.value.key === 'done' ? 'green' : 'dark' }
])

const showEntryQr = computed(() => {
  if (!entryCode.value || checkin.value) return false
  if (applicationState.value.key !== 'approved' && !activity.value.isCreator) return false
  if (activity.value.partyMode !== 'free' && paymentState.value.key !== 'paid') return false
  return true
})

const primaryActionText = computed(() => {
  if (activity.value.isCreator) return '进入管理台'
  if (isTerminalActivity.value) return '查看活动详情'
  if (applicationState.value.key === 'pending') return '等待审核'
  if (applicationState.value.key === 'rejected') return '返回详情页'
  if (['refunded', 'closed'].includes(paymentState.value.key)) return '查看订单'
  if (activity.value.partyMode !== 'free' && paymentState.value.key !== 'paid') return '去支付'
  if (checkin.value) return '已完成签到'
  return '出示凭证'
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

onPullDownRefresh(makeRefreshHandler(loadState))

async function loadState() {
  isPageLoading.value = true
  try {
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
  } finally {
    isPageLoading.value = false
  }
}

function getMessageTime(item) {
  return formatMessageTime(item.createdAt)
}

function showToast(title) {
  uni.showToast({ title, icon: 'none' })
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
    uni.showToast({ title: '等待发起人审核', icon: 'none' })
    return
  }

  if (applicationState.value.key === 'rejected') {
    goActivityDetail(activityId.value)
    return
  }

  if (['refunded', 'closed'].includes(paymentState.value.key) && order.value) {
    goOrderDetail(order.value.id, { activityId: activity.value.id })
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

  uni.showToast({ title: '请向局长出示入场二维码', icon: 'none' })
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
.pass-gap {
  margin-top: 24rpx;
}

.pass-message {
  position: relative;
}

.message-badge {
  position: absolute;
  top: 4rpx;
  right: 2rpx;
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
}

.locked-qr {
  display: flex;
  width: 184rpx;
  height: 184rpx;
  align-items: center;
  justify-content: center;
  border-radius: 34rpx;
  background: #edf6ff;
}

.pass-feedback {
  color: #047857;
  font-size: 22rpx;
  font-weight: 900;
  line-height: 1.45;
}

.pass-feedback--danger {
  color: #b91c1c;
}

.status-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.status-line > text:last-child {
  color: #64748b;
  font-size: 22rpx;
  font-weight: 900;
}

.pass-meetup {
  margin-top: 20rpx;
}

.pass-status-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 24rpx;
}

.pass-status {
  min-width: 0;
  border-radius: 28rpx;
  background: #edf6ff;
  padding: 20rpx 16rpx;
}

.pass-status text:first-child {
  display: block;
  color: #102033;
  font-size: 26rpx;
  font-weight: 950;
}

.pass-status text:nth-child(2),
.pass-status text:nth-child(3) {
  display: block;
  margin-top: 8rpx;
  color: #64748b;
  font-size: 19rpx;
  font-weight: 850;
  line-height: 1.35;
}

.contact-lock {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 24rpx;
  border-radius: 999rpx;
  background: #edf6ff;
  padding: 14rpx 18rpx;
  color: #1d4ed8;
  font-size: 22rpx;
  font-weight: 950;
}

.pass-section-title {
  margin-top: 0;
}

.pass-message-card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 24rpx 0;
  border-top: 1rpx solid #edf2f7;
}

.pass-message-card__title {
  color: #102033;
  font-size: 27rpx;
  font-weight: 950;
}

.pass-message-card__content,
.pass-message-card__time {
  color: #64748b;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.45;
}

.pass-message-card__pill--application {
  background: rgba(139, 92, 246, 0.12);
  color: #6d28d9;
}

.pass-message-card__pill--activity {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}

.pass-message-card__pill--system {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}
</style>
