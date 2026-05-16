<template>
  <view v-if="isPageLoading" class="ref-page">
    <SuPageLoading :style="contentTopStyle" text="订单加载中..." />
  </view>
  <view v-else class="ref-page">
    <view class="ref-topbar" :style="navStyle">
      <view class="ref-topbar__row" :style="navRowStyle">
        <view class="ref-back" @tap="goBackOrFallback">
          <SuIcon name="left" size="44" glyph-size="22" variant="inline" color="#102033" />
        </view>
        <text class="ref-topbar__title">试运行订单</text>
        <view class="ref-icon-button">
          <SuIcon name="wallet" size="40" glyph-size="20" variant="inline" color="#2388ff" />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="ref-scroll ref-scroll--no-tab" :style="contentTopStyle">
      <view class="ref-page-head">
        <text class="ref-page-head__eyebrow">确认占位</text>
        <text class="ref-page-head__title">{{ pageTitle }}</text>
      </view>

      <view class="ref-payment-card ref-card payment-card">
        <view class="payment-card__icon">
          <SuIcon :name="activity.partyMode === 'ticket' ? 'paperplane-filled' : 'wallet-filled'" size="64" glyph-size="32" variant="inline" color="#2388ff" />
        </view>
        <text class="payment-card__label">{{ modeTitle }}</text>
        <text class="payment-card__amount">{{ feeText }}</text>
        <text class="payment-card__desc">{{ modeDesc }}</text>
      </view>

      <view class="ref-summary-card ref-card payment-gap">
        <image :src="activity.image" mode="aspectFill" />
        <view>
          <text class="su-line-2">{{ activity.title }}</text>
          <text>{{ activity.date }} {{ activity.time }} · {{ activity.location }}</text>
        </view>
      </view>

      <view class="ref-info-card ref-card payment-gap">
        <view class="ref-section-title payment-section-title">
          <text>订单状态</text>
          <text @tap="order && goOrderDetail(order.id, { activityId: activity.id })">{{ order ? '查看订单' : '待创建' }}</text>
        </view>
        <view class="timeline">
          <text class="timeline__item timeline__item--done">已创建订单</text>
          <text class="timeline__item" :class="{ 'timeline__item--done': orderStatus === 'paid' }">待确认</text>
          <text class="timeline__item">待核销</text>
          <text class="timeline__item">{{ activity.partyMode === 'sincerity' ? '退款记录' : '结算记录' }}</text>
        </view>
        <text class="payment-note">试运行订单确认，不发生真实扣款。当前状态：{{ orderStatusText }}</text>
      </view>

      <view class="ref-bottom-cta">
        <button class="ref-primary" :disabled="isPaying" @tap="handlePay">{{ payButtonText }}</button>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { computed, ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { getActivityDetail } from '@/common/api/activity.js'
import { ensureOrderForActivity, getOrderStatusText, markOrderPaid } from '@/common/api/order.js'
import { createEmptyActivity } from '@/common/utils/activity-default.js'
import { makeRefreshHandler } from '@/common/utils/refresh.js'
import SuPageLoading from '@/components/surego/SuPageLoading.vue'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goOrderDetail, goParticipantDashboard } from '@/common/utils/route.js'

const activity = ref(createEmptyActivity('102'))
const order = ref(null)
const isPaying = ref(false)
const isPageLoading = ref(true)
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 22 })

const pageTitle = computed(() => (activity.value.partyMode === 'sincerity' ? '确认试运行诚意金，占住席位' : '确认试运行订单，核销后结算'))
const modeTitle = computed(() => (activity.value.partyMode === 'ticket' ? '门票' : '诚意金'))
const feeText = computed(() => `¥${activity.value.amount || 0}`)
const modeDesc = computed(() => {
  if (activity.value.partyMode === 'ticket') return '订单确认后保留名额，核销完成后进入结算记录。'
  return '订单确认后保留席位；到场核销后按规则登记退回状态。'
})
const orderStatus = computed(() => order.value?.status || 'pending')
const orderStatusText = computed(() => getOrderStatusText(orderStatus.value))
const payButtonText = computed(() => {
  if (isPaying.value) return '处理中...'
  if (orderStatus.value === 'paid') return '查看到场凭证'
  return '确认试运行订单'
})

onLoad(async (query) => {
  const id = (query && query.activityId) || '102'
  await loadData(id)
})

async function loadData(id = activity.value.id || '102') {
  isPageLoading.value = true
  try {
    activity.value = await getActivityDetail(id)
    order.value = await ensureOrderForActivity({
      activityId: activity.value.id,
      type: activity.value.partyMode,
      amount: activity.value.amount,
      activityTitle: activity.value.title,
      activityCover: activity.value.image
    })
  } finally {
    isPageLoading.value = false
  }
}

onPullDownRefresh(makeRefreshHandler(() => loadData(activity.value.id || '102')))

async function handlePay() {
  if (isPaying.value) return
  if (orderStatus.value === 'paid') {
    goParticipantDashboard(activity.value.id, { replace: true })
    return
  }

  isPaying.value = true
  const paid = await markOrderPaid(order.value.id, {
    order: order.value,
    activityTitle: activity.value.title,
    activityCover: activity.value.image
  })
  order.value = { ...order.value, ...paid }
  uni.showToast({ title: '订单确认成功', icon: 'none' })
  setTimeout(() => {
    goParticipantDashboard(activity.value.id, { replace: true })
  }, 260)
}
</script>

<style scoped>
.payment-card {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 16rpx;
  text-align: center;
}

.payment-card__icon {
  display: flex;
  width: 96rpx;
  height: 96rpx;
  align-items: center;
  justify-content: center;
  border-radius: 32rpx;
  background: #edf6ff;
}

.payment-card__label {
  color: #64748b;
  font-size: 23rpx;
  font-weight: 950;
}

.payment-card__amount {
  color: #102033;
  font-size: 64rpx;
  font-weight: 950;
  line-height: 1;
}

.payment-card__desc {
  color: #64748b;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.6;
}

.payment-gap {
  margin-top: 24rpx;
}

.payment-section-title {
  margin-top: 0;
}

.timeline {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10rpx;
  margin-top: 10rpx;
}

.timeline__item {
  min-height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  background: #edf6ff;
  color: #64748b;
  font-size: 21rpx;
  font-weight: 900;
  text-align: center;
}

.timeline__item--done {
  background: rgba(18, 163, 127, 0.12);
  color: #047857;
}

.payment-note {
  display: block;
  margin-top: 22rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.5;
}
</style>
