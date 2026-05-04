<template>
  <view v-if="isPageLoading" class="success su-page" :style="contentTopStyle">
    <SuPageLoading text="状态加载中..." />
  </view>
  <view v-else class="success su-page" :style="contentTopStyle">
    <view class="success__wash" />
    <view class="success__nav" :style="navStyle">
      <view class="success__nav-row" :style="navRowStyle">
        <view class="success__nav-spacer" />
        <view class="success__close" @tap="goBackOrFallback">
          <uni-icons type="closeempty" size="30" color="rgba(255,255,255,.48)" />
        </view>
      </view>
    </view>

    <view class="success__content">
      <view class="success__mark-wrap">
        <view class="success__ring">
          <view class="success__mark">
            <uni-icons type="checkmarkempty" size="66" color="#fff" />
          </view>
        </view>
        <view
          v-for="dot in dots"
          :key="dot.id"
          class="success__dot"
          :style="{ backgroundColor: dot.color, top: dot.top, left: dot.left }"
        />
      </view>

      <view class="success__copy">
        <text class="success__title">{{ title }}</text>
        <text class="success__desc">{{ description }}</text>
      </view>

      <view v-if="activity" class="success__activity">
        <image class="success__cover" :src="activity.image" mode="aspectFill" />
        <view class="success__activity-info">
          <text class="success__activity-title su-line-2">{{ activity.title }}</text>
          <text class="success__activity-meta">{{ activity.date }} {{ activity.time }}</text>
        </view>
      </view>

      <view class="success__actions">
        <view class="success__button success__button--primary" @tap="goHomeRoot">
          <uni-icons type="home-filled" size="20" color="#0f172a" />
          <text>回到首页</text>
        </view>
        <view v-if="activity" class="success__button" @tap="openNext">
          <uni-icons type="staff-filled" size="20" color="#fff" />
          <text>{{ detailButtonText }}</text>
        </view>
        <view v-if="requireApproval" class="success__button success__button--green" @tap="goActivityDetail(activity.id, { replace: true })">
          <uni-icons type="checkmarkempty" size="20" color="#fff" />
          <text>查看申请状态</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getActivityDetail } from '@/common/api/activity.js'
import { createEmptyActivity } from '@/common/utils/activity-default.js'
import SuPageLoading from '@/components/surego/SuPageLoading.vue'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goBackOrFallback, goHomeRoot, goManageDashboard, goParticipantDashboard } from '@/common/utils/route.js'

const type = ref('JOIN')
const activityId = ref('101')
const requireApproval = ref(false)
const currentActivity = ref(createEmptyActivity('101'))
const isPageLoading = ref(true)
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 44, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 8 })

const dots = [
  { id: 1, color: '#ff5e7e', top: '8rpx', left: '148rpx' },
  { id: 2, color: '#4caf50', top: '38rpx', left: '42rpx' },
  { id: 3, color: '#ffc107', top: '132rpx', left: '8rpx' },
  { id: 4, color: '#2196f3', top: '218rpx', left: '58rpx' },
  { id: 5, color: '#e91e63', top: '248rpx', left: '170rpx' },
  { id: 6, color: '#22c55e', top: '204rpx', left: '262rpx' },
  { id: 7, color: '#f59e0b', top: '92rpx', left: '286rpx' },
  { id: 8, color: '#8b5cf6', top: '18rpx', left: '236rpx' }
]

const activity = computed(() => currentActivity.value)
const isPayment = computed(() => type.value === 'PAYMENT')
const isCreate = computed(() => type.value === 'CREATE')

const title = computed(() => {
  if (isPayment.value) return '申请已提交'
  if (isCreate.value) return '活动已提交审核'
  return requireApproval.value ? '申请已发送' : '报名成功！'
})

const description = computed(() => {
  if (isPayment.value) {
    return requireApproval.value
      ? '申请已传达给局长，请耐心等待审核；通过后可在参与者中心确认订单与入场凭证。'
      : '报名链路已完成，试运营订单会记录状态但不会发生真实扣款。'
  }
  if (isCreate.value) return '你的活动已进入运营审核，审核通过后会展示给大家。'
  return requireApproval.value ? '申请已传达给局长，请耐心等待审核。' : '已成功报名，期待与你相见。'
})

const detailButtonText = computed(() => {
  if (isPayment.value) return '查看入场凭证'
  if (isCreate.value) return '进入管理页'
  return '查看活动详情'
})

onLoad(async (query) => {
  type.value = (query && query.type) || 'JOIN'
  activityId.value = (query && query.activityId) || '101'
  requireApproval.value = Boolean(query && query.requireApproval === '1')
  isPageLoading.value = true
  currentActivity.value = await getActivityDetail(activityId.value)
  isPageLoading.value = false
})

function openNext() {
  if (isPayment.value) {
    goParticipantDashboard(activity.value.id, { replace: true })
    return
  }
  if (isCreate.value) {
    goManageDashboard(activity.value.id, { replace: true })
    return
  }
  goActivityDetail(activity.value.id, { replace: true })
}
</script>

<style scoped>
.success {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  padding-right: 44rpx;
  padding-bottom: 88rpx;
  padding-left: 44rpx;
  background: #0f172a;
}

.success__wash {
  position: absolute;
  top: -120rpx;
  right: -160rpx;
  left: -160rpx;
  height: 760rpx;
  border-radius: 50%;
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.08));
  filter: blur(70rpx);
}

.success__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 3;
}

.success__nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.success__nav-spacer {
  width: 64rpx;
  height: 64rpx;
}

.success__close {
  display: flex;
  width: 64rpx;
  height: 64rpx;
  align-items: center;
  justify-content: center;
}

.success__content {
  position: relative;
  z-index: 2;
  display: flex;
  min-height: calc(100vh - 176rpx);
  align-items: center;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.success__mark-wrap {
  position: relative;
  width: 330rpx;
  height: 330rpx;
  margin-bottom: 54rpx;
}

.success__ring {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  border: 12rpx solid rgba(16, 185, 129, 0.36);
  border-radius: 50%;
}

.success__mark {
  display: flex;
  width: 210rpx;
  height: 210rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 80rpx rgba(16, 185, 129, 0.42);
}

.success__dot {
  position: absolute;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
}

.success__copy {
  max-width: 580rpx;
}

.success__title {
  display: block;
  color: #fff;
  font-size: 54rpx;
  font-weight: 900;
  line-height: 1.15;
}

.success__desc {
  display: block;
  margin-top: 22rpx;
  color: rgba(226, 232, 240, 0.72);
  font-size: 28rpx;
  font-weight: 700;
  line-height: 1.65;
}

.success__activity {
  display: flex;
  width: 100%;
  gap: 22rpx;
  margin-top: 48rpx;
  padding: 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.08);
  text-align: left;
}

.success__cover {
  width: 140rpx;
  height: 140rpx;
  flex: 0 0 140rpx;
  border-radius: 26rpx;
  background: rgba(255, 255, 255, 0.12);
}

.success__activity-info {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  justify-content: center;
}

.success__activity-title {
  color: #fff;
  font-size: 27rpx;
  font-weight: 900;
  line-height: 1.4;
}

.success__activity-meta {
  margin-top: 12rpx;
  color: rgba(226, 232, 240, 0.48);
  font-size: 22rpx;
  font-weight: 800;
}

.success__actions {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 54rpx;
}

.success__button {
  display: flex;
  height: 92rpx;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 28rpx;
  font-weight: 900;
}

.success__button--primary {
  border-color: #fff;
  background: #fff;
  color: #0f172a;
  box-shadow: 0 24rpx 60rpx rgba(255, 255, 255, 0.16);
}

.success__button--green {
  border-color: #10b981;
  background: #10b981;
  box-shadow: 0 24rpx 60rpx rgba(16, 185, 129, 0.26);
}
</style>
