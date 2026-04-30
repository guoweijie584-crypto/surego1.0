<template>
  <view class="order-detail su-page">
    <view class="order-nav" :style="navStyle">
      <view class="order-nav__row" :style="navRowStyle">
      <view class="order-nav__btn" @tap="goBackOrFallback">
        <uni-icons type="left" size="22" color="#0f172a" />
      </view>
      <text>订单详情</text>
      <view class="order-nav__btn" @tap="reloadOrder">
        <uni-icons type="refresh" size="18" color="#0f172a" />
      </view>
      </view>
    </view>

    <scroll-view scroll-y class="order-scroll" :style="contentTopStyle">
      <view v-if="!order" class="empty">
        <uni-icons type="wallet-filled" size="44" color="#cbd5e1" />
        <text>订单不存在或已被清理</text>
      </view>

      <view v-else>
        <view class="hero">
          <image class="hero__cover" :src="order.activityCover || activity.image" mode="aspectFill" />
          <view class="hero__content">
            <text class="hero__eyebrow">{{ order.type === 'ticket' ? 'TICKET ORDER' : 'SINCERITY ORDER' }}</text>
            <text class="hero__title su-line-2">{{ order.activityTitle || activity.title }}</text>
            <view class="hero__status" :class="`hero__status--${order.status}`">
              <text>{{ getOrderStatusText(order.status) }}</text>
            </view>
          </view>
        </view>

        <view class="amount-card">
          <view>
            <text>支付金额</text>
            <text>¥{{ order.amount }}</text>
          </view>
          <view>
            <text>订单类型</text>
            <text>{{ order.type === 'ticket' ? '门票' : '诚意金' }}</text>
          </view>
        </view>

        <view class="panel">
          <view class="panel__head">
            <view>
              <text class="panel__title">状态时间线</text>
              <text class="panel__sub">ORDER TIMELINE</text>
            </view>
          </view>
          <view v-for="item in timeline" :key="item.label" class="timeline">
            <view class="timeline__dot" :class="{ 'timeline__dot--active': item.active }" />
            <view>
              <text>{{ item.label }}</text>
              <text>{{ item.time || item.desc }}</text>
            </view>
          </view>
        </view>

        <view class="panel">
          <view class="panel__head">
            <view>
              <text class="panel__title">订单规则</text>
              <text class="panel__sub">RULES</text>
            </view>
          </view>
          <view v-for="item in rules" :key="item" class="rule">
            <uni-icons type="checkmarkempty" size="16" color="#22c55e" />
            <text>{{ item }}</text>
          </view>
          <text v-if="order.refundNote" class="result-note">{{ order.refundNote }}</text>
          <text v-if="order.closeReason" class="result-note result-note--danger">{{ order.closeReason }}</text>
        </view>

        <view class="action-stack">
          <view v-if="order.status === 'pending'" class="action action--primary" @tap="goPayment({ activityId: order.activityId, type: order.type, amount: order.amount }, { replace: true })">
            继续模拟支付
          </view>
          <view v-if="order.status === 'paid'" class="action action--primary" @tap="goParticipantDashboard(order.activityId, { replace: true })">
            查看入场凭证
          </view>
          <view v-if="order.status === 'paid'" class="action" @tap="handleRefund">
            模拟退款
          </view>
          <view v-if="order.status === 'pending'" class="action action--danger" @tap="handleClose">
            关闭订单
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getActivityDetail } from '@/common/api/activity.js'
import { closeOrder, getOrderDetail, getOrderStatusText, refundOrder } from '@/common/api/order.js'
import { createEmptyActivity } from '@/common/utils/activity-default.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goParticipantDashboard, goPayment } from '@/common/utils/route.js'

const orderId = ref('')
const order = ref(null)
const activity = ref(createEmptyActivity('102'))
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 30, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 26 })

const rules = computed(() => {
  if (!order.value) return []
  if (order.value.type === 'ticket') {
    return ['门票支付后锁定活动名额', '活动取消时进入退款状态', '当前为模拟支付，不调用微信支付']
  }
  return ['诚意金支付后保留名额', '签到后可进入退款状态', '爽约时可由运营关闭或备注']
})

const timeline = computed(() => {
  if (!order.value) return []
  return [
    { label: '订单创建', time: order.value.createdAt, active: true },
    { label: '支付确认', time: order.value.paidAt, desc: order.value.status === 'pending' ? '等待模拟支付' : '已完成', active: ['paid', 'refunded'].includes(order.value.status) },
    { label: '退款记录', time: order.value.refundedAt, desc: order.value.status === 'refunded' ? '已记录退款' : '暂无退款', active: order.value.status === 'refunded' },
    { label: '订单关闭', time: order.value.closedAt, desc: order.value.status === 'closed' ? '已关闭' : '未关闭', active: order.value.status === 'closed' }
  ]
})

onLoad(async (query) => {
  orderId.value = (query && query.id) || ''
  await reloadOrder()
})

onShow(async () => {
  if (orderId.value) await reloadOrder()
})

async function reloadOrder() {
  if (!orderId.value) return
  order.value = await getOrderDetail(orderId.value)
  if (order.value?.activityId) {
    activity.value = await getActivityDetail(order.value.activityId)
  }
}

async function handleRefund() {
  if (!order.value) return
  await refundOrder(order.value.id, '模拟退款已记录，真实退款将在支付专项接入', {
    order: order.value,
    activityTitle: order.value.activityTitle || activity.value.title,
    activityCover: order.value.activityCover || activity.value.image
  })
  await reloadOrder()
  uni.showToast({ title: '退款状态已更新', icon: 'none' })
}

async function handleClose() {
  if (!order.value) return
  await closeOrder(order.value.id, '用户主动关闭模拟订单', {
    order: order.value,
    activityTitle: order.value.activityTitle || activity.value.title,
    activityCover: order.value.activityCover || activity.value.image
  })
  await reloadOrder()
  uni.showToast({ title: '订单已关闭', icon: 'none' })
}
</script>

<style scoped>
.order-detail {
  min-height: 100vh;
  background: #f8fafc;
}

.order-nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  background: rgba(248, 250, 252, 0.92);
  backdrop-filter: blur(18rpx);
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 900;
}

.order-nav__row {
  display: flex;
  box-sizing: border-box;
  align-items: center;
  justify-content: space-between;
}

.order-nav__btn {
  display: flex;
  width: 68rpx;
  height: 68rpx;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.08);
}

.order-scroll {
  height: 100vh;
  box-sizing: border-box;
  padding: 0 30rpx 60rpx;
}

.empty {
  display: flex;
  min-height: 60vh;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 18rpx;
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 900;
}

.hero {
  overflow: hidden;
  border-radius: 40rpx;
  background: #0f172a;
  box-shadow: 0 22rpx 56rpx rgba(15, 23, 42, 0.14);
}

.hero__cover {
  width: 100%;
  height: 310rpx;
  background: #e2e8f0;
}

.hero__content {
  padding: 30rpx;
}

.hero__eyebrow {
  color: #34d399;
  font-size: 18rpx;
  font-weight: 900;
}

.hero__title {
  display: block;
  margin-top: 10rpx;
  color: #fff;
  font-size: 38rpx;
  font-weight: 900;
  line-height: 1.35;
}

.hero__status {
  display: inline-flex;
  margin-top: 20rpx;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: #fef3c7;
  color: #d97706;
  font-size: 22rpx;
  font-weight: 900;
}

.hero__status--paid {
  background: #dcfce7;
  color: #16a34a;
}

.hero__status--refunded {
  background: #e0e7ff;
  color: #4f46e5;
}

.hero__status--closed {
  background: #fee2e2;
  color: #ef4444;
}

.amount-card {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  margin-top: 24rpx;
}

.amount-card view {
  padding: 28rpx;
  border-radius: 30rpx;
  background: #fff;
  box-shadow: 0 14rpx 36rpx rgba(15, 23, 42, 0.06);
}

.amount-card text:first-child {
  display: block;
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 900;
}

.amount-card text:last-child {
  display: block;
  margin-top: 10rpx;
  color: #0f172a;
  font-size: 34rpx;
  font-style: italic;
  font-weight: 900;
}

.panel {
  margin-top: 24rpx;
  padding: 30rpx;
  border-radius: 34rpx;
  background: #fff;
  box-shadow: 0 14rpx 36rpx rgba(15, 23, 42, 0.06);
}

.panel__head {
  margin-bottom: 22rpx;
}

.panel__title,
.panel__sub {
  display: block;
}

.panel__title {
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 900;
}

.panel__sub {
  margin-top: 4rpx;
  color: #cbd5e1;
  font-size: 18rpx;
  font-weight: 900;
}

.timeline {
  display: flex;
  gap: 18rpx;
  padding: 18rpx 0;
  border-top: 1rpx solid #f1f5f9;
}

.timeline__dot {
  width: 20rpx;
  height: 20rpx;
  margin-top: 8rpx;
  border-radius: 50%;
  background: #cbd5e1;
}

.timeline__dot--active {
  background: #22c55e;
}

.timeline text:first-child {
  display: block;
  color: #0f172a;
  font-size: 24rpx;
  font-weight: 900;
}

.timeline text:last-child {
  display: block;
  margin-top: 6rpx;
  color: #94a3b8;
  font-size: 21rpx;
  font-weight: 800;
}

.rule {
  display: flex;
  gap: 12rpx;
  margin-top: 16rpx;
  color: #64748b;
  font-size: 23rpx;
  font-weight: 800;
}

.result-note {
  display: block;
  margin-top: 20rpx;
  padding: 18rpx;
  border-radius: 22rpx;
  background: #dcfce7;
  color: #16a34a;
  font-size: 22rpx;
  font-weight: 900;
}

.result-note--danger {
  background: #fee2e2;
  color: #ef4444;
}

.action-stack {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 28rpx;
}

.action {
  display: flex;
  height: 92rpx;
  align-items: center;
  justify-content: center;
  border-radius: 28rpx;
  background: #fff;
  color: #0f172a;
  font-size: 26rpx;
  font-weight: 900;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.06);
}

.action--primary {
  background: #0f172a;
  color: #fff;
}

.action--danger {
  background: #fee2e2;
  color: #ef4444;
}
</style>
