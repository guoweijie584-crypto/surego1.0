<template>
  <view class="payment su-page">
    <view class="payment__nav">
      <view class="payment__back" @tap="goBackOrFallback">
        <uni-icons type="left" size="24" color="#0f172a" />
      </view>
      <text>支付确认</text>
      <view class="payment__back" />
    </view>

    <view class="payment__content">
      <view class="pay-card">
        <view class="pay-card__top">
          <view class="pay-card__icon" :class="`pay-card__icon--${activity.partyMode}`">
            <uni-icons :type="activity.partyMode === 'ticket' ? 'paperplane-filled' : 'wallet-filled'" size="34" color="#fff" />
          </view>
          <text class="pay-card__title">{{ modeTitle }}</text>
          <text class="pay-card__desc">{{ modeDesc }}</text>
        </view>

        <view class="activity">
          <image class="activity__cover" :src="activity.image" mode="aspectFill" />
          <view class="activity__info">
            <text class="activity__title su-line-2">{{ activity.title }}</text>
            <text class="activity__meta">{{ activity.date }} {{ activity.time }}</text>
          </view>
        </view>

        <view class="amount">
          <text>需支付</text>
          <text>¥{{ activity.amount }}</text>
        </view>

        <view class="order-state" @tap="order && goOrderDetail(order.id)">
          <text>订单状态</text>
          <text :class="`order-state__badge order-state__badge--${orderStatus}`">{{ orderStatusText }}</text>
        </view>

        <view class="rule-list">
          <view v-for="item in rules" :key="item" class="rule">
            <uni-icons type="checkmarkempty" size="16" color="#22c55e" />
            <text>{{ item }}</text>
          </view>
        </view>

        <button class="pay-button" :disabled="isPaying" @tap="handlePay">
          {{ payButtonText }}
        </button>
        <view v-if="order" class="order-link" @tap="goOrderDetail(order.id)">查看订单详情</view>
        <text class="payment__note">当前阶段不调用真实微信支付，仅写入订单状态用于前端闭环。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getActivityDetail } from '@/common/api/activity.js'
import { ensureOrderForActivity, getOrderStatusText, markOrderPaid } from '@/common/api/order.js'
import { createEmptyActivity } from '@/common/utils/activity-default.js'
import { goBackOrFallback, goOrderDetail, goParticipantDashboard } from '@/common/utils/route.js'

const activity = ref(createEmptyActivity('102'))
const order = ref(null)
const isPaying = ref(false)

const modeTitle = computed(() => (activity.value.partyMode === 'ticket' ? '门票支付' : '诚意金支付'))
const modeDesc = computed(() => {
  if (activity.value.partyMode === 'ticket') return '支付后锁定名额，后续接入真实微信支付。'
  return '签到后全额退回，爽约将扣除诚意金。'
})
const rules = computed(() => {
  if (activity.value.partyMode === 'ticket') return ['门票支付成功后获得入场凭证', '活动取消时进入退款流程', '本次为模拟支付，不调用微信支付']
  return ['签到后诚意金全额退回', '活动开始前可查看入场凭证', '本次为模拟支付，不调用微信支付']
})
const orderStatus = computed(() => order.value?.status || 'pending')
const orderStatusText = computed(() => {
  return getOrderStatusText(orderStatus.value)
})
const payButtonText = computed(() => {
  if (isPaying.value) return '处理中...'
  if (orderStatus.value === 'paid') return '查看入场凭证'
  return '确认模拟支付'
})

onLoad(async (query) => {
  const id = (query && query.activityId) || '102'
  activity.value = await getActivityDetail(id)
  order.value = await ensureOrderForActivity({
    activityId: activity.value.id,
    type: activity.value.partyMode,
    amount: activity.value.amount,
    activityTitle: activity.value.title,
    activityCover: activity.value.image
  })
})

async function handlePay() {
  if (isPaying.value) return
  if (orderStatus.value === 'paid') {
    goParticipantDashboard(activity.value.id, { replace: true })
    return
  }

  isPaying.value = true
  const paid = await markOrderPaid(order.value.id)
  order.value = { ...order.value, ...paid }
  uni.showToast({ title: '支付成功', icon: 'none' })
  setTimeout(() => {
    goParticipantDashboard(activity.value.id, { replace: true })
  }, 260)
}
</script>

<style scoped>
.payment {
  min-height: 100vh;
  background: #f0f4f8;
}

.payment__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  display: flex;
  height: 132rpx;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 34rpx 18rpx;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(18px);
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 900;
}

.payment__back {
  display: flex;
  width: 62rpx;
  height: 62rpx;
  align-items: center;
  justify-content: center;
}

.payment__content {
  padding: 174rpx 34rpx 56rpx;
}

.pay-card {
  padding: 38rpx;
  border-radius: 46rpx;
  background: #fff;
  box-shadow: 0 24rpx 70rpx rgba(15, 23, 42, 0.08);
}

.pay-card__top {
  display: flex;
  align-items: center;
  flex-direction: column;
  text-align: center;
}

.pay-card__icon {
  display: flex;
  width: 116rpx;
  height: 116rpx;
  align-items: center;
  justify-content: center;
  border-radius: 36rpx;
  background: #ef4444;
}

.pay-card__icon--ticket {
  background: #8b5cf6;
}

.pay-card__title {
  display: block;
  margin-top: 26rpx;
  color: #0f172a;
  font-size: 44rpx;
  font-weight: 900;
}

.pay-card__desc {
  display: block;
  margin-top: 14rpx;
  color: #64748b;
  font-size: 25rpx;
  font-weight: 700;
  line-height: 1.55;
}

.activity {
  display: flex;
  gap: 22rpx;
  margin-top: 40rpx;
  padding: 20rpx;
  border-radius: 30rpx;
  background: #f8fafc;
}

.activity__cover {
  width: 142rpx;
  height: 142rpx;
  flex: 0 0 142rpx;
  border-radius: 24rpx;
  background: #e2e8f0;
}

.activity__info {
  min-width: 0;
  flex: 1;
}

.activity__title {
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 900;
  line-height: 1.4;
}

.activity__meta {
  display: block;
  margin-top: 12rpx;
  color: #94a3b8;
  font-size: 22rpx;
  font-weight: 800;
}

.amount {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-top: 34rpx;
  padding: 28rpx;
  border-radius: 30rpx;
  background: #0f172a;
  color: #fff;
}

.amount text:first-child {
  font-size: 24rpx;
  font-weight: 800;
}

.amount text:last-child {
  font-size: 56rpx;
  font-style: italic;
  font-weight: 900;
}

.order-state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 22rpx;
  padding: 22rpx 26rpx;
  border-radius: 26rpx;
  background: #f8fafc;
  color: #64748b;
  font-size: 23rpx;
  font-weight: 900;
}

.order-state__badge {
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: #fef3c7;
  color: #d97706;
}

.order-state__badge--paid {
  background: #dcfce7;
  color: #16a34a;
}

.order-state__badge--refunded {
  background: #e0e7ff;
  color: #4f46e5;
}

.order-state__badge--closed {
  background: #fee2e2;
  color: #ef4444;
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 32rpx;
}

.rule {
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: #64748b;
  font-size: 23rpx;
  font-weight: 800;
}

.pay-button {
  display: flex;
  height: 96rpx;
  align-items: center;
  justify-content: center;
  margin-top: 38rpx;
  border-radius: 30rpx;
  background: #0f172a;
  color: #fff;
  font-size: 28rpx;
  font-weight: 900;
}

.order-link {
  display: flex;
  height: 74rpx;
  align-items: center;
  justify-content: center;
  margin-top: 16rpx;
  border-radius: 24rpx;
  background: #f8fafc;
  color: #0f172a;
  font-size: 23rpx;
  font-weight: 900;
}

.payment__note {
  display: block;
  margin-top: 18rpx;
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 700;
  line-height: 1.5;
  text-align: center;
}
</style>
