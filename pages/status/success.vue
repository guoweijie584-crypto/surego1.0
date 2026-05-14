<template>
  <view v-if="isPageLoading" class="ref-page">
    <SuPageLoading :style="contentTopStyle" text="状态加载中..." />
  </view>
  <view v-else class="ref-page">
    <scroll-view scroll-y class="ref-scroll ref-scroll--no-tab success-scroll" :style="contentTopStyle">
      <view class="ref-success-card ref-card">
        <view class="ref-success-card__mark">
          <uni-icons type="checkmarkempty" size="40" color="#fff" />
        </view>
        <text class="ref-success-card__title">{{ title }}</text>
        <text class="ref-success-card__text">{{ description }}</text>
      </view>

      <view v-if="isCreate && activity" class="poster-preview ref-card">
        <view>
          <text class="ref-pill ref-pill--green">微信海报</text>
          <text class="poster-preview__title su-line-2">{{ activity.title }}</text>
          <text class="poster-preview__meta">{{ activity.date }} {{ activity.time }} · {{ activity.location }}</text>
        </view>
        <view class="poster-preview__qr">
          <uni-icons type="scan" size="36" color="#102033" />
        </view>
      </view>

      <view v-if="activity" class="ref-summary-card ref-card success-summary">
        <image :src="activity.image" mode="aspectFill" />
        <view>
          <text class="su-line-2">{{ activity.title }}</text>
          <text>{{ activity.date }} {{ activity.time }}</text>
        </view>
      </view>

      <view class="ref-stack success-actions">
        <view class="ref-primary" @tap="openPrimary">{{ primaryLabel }}</view>
        <view class="ref-secondary" @tap="goHomeRoot">{{ secondaryLabel }}</view>
        <view v-if="requireApproval && activity" class="ref-secondary" @tap="goActivityDetail(activity.id, { replace: true })">查看申请状态</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getActivityDetail } from '@/common/api/activity.js'
import { createEmptyActivity } from '@/common/utils/activity-default.js'
import SuPageLoading from '@/components/surego/SuPageLoading.vue'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goHomeRoot, goManageDashboard, goMessages, goParticipantDashboard } from '@/common/utils/route.js'

const type = ref('JOIN')
const activityId = ref('101')
const requireApproval = ref(false)
const currentActivity = ref(createEmptyActivity('101'))
const isPageLoading = ref(true)
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 28 })

const activity = computed(() => currentActivity.value)
const isPayment = computed(() => type.value === 'PAYMENT')
const isCreate = computed(() => type.value === 'CREATE')
const isPartner = computed(() => type.value === 'PARTNER')
const isTeam = computed(() => type.value === 'TEAM')
const isWaitlist = computed(() => type.value === 'WAITLIST')

const title = computed(() => {
  if (isCreate.value) return '活动已提交审核'
  if (isWaitlist.value) return '已加入候补队列'
  if (isTeam.value) return '组队申请已提交'
  if (isPartner.value) return '申请已提交'
  if (isPayment.value) return requireApproval.value ? '申请已提交' : '报名成功'
  return requireApproval.value ? '申请已发送' : '报名成功'
})

const description = computed(() => {
  if (isCreate.value) return '活动已提交审核，审核通过后会展示给大家。分享海报已经准备好，可以先发到班群或朋友圈。'
  if (isWaitlist.value) return '有席位释放时，会按顺序通知你完成占位。你可以在我的页查看候补进度。'
  if (isTeam.value) return '队长确认后会在通知里提醒你继续完善参赛准备。'
  if (isPartner.value) return '已把你的申请发给搭子帖发起人，通过后会开放私聊或群聊。'
  if (isPayment.value) {
    return requireApproval.value
      ? '申请已传达给发起人，请耐心等待审核；通过后可在到场凭证页确认订单与入场信息。'
      : '试运营订单已记录状态，不会发生真实扣款。你可以查看到场凭证。'
  }
  return requireApproval.value ? '申请已传达给发起人，请耐心等待审核。' : '你可以在我的页查看凭证、导航、核销码和退出规则。'
})

const primaryLabel = computed(() => {
  if (isCreate.value) return '进入活动管理'
  if (isWaitlist.value) return '查看候补进度'
  if (isPartner.value || isTeam.value) return '查看通知'
  if (isPayment.value || !requireApproval.value) return '查看到场凭证'
  return '查看申请状态'
})

const secondaryLabel = computed(() => (isPartner.value ? '继续看搭子' : '继续看看其他活动'))

onLoad(async (query) => {
  type.value = (query && query.type) || 'JOIN'
  activityId.value = (query && query.activityId) || '101'
  requireApproval.value = Boolean(query && query.requireApproval === '1')
  isPageLoading.value = true
  currentActivity.value = await getActivityDetail(activityId.value)
  isPageLoading.value = false
})

function openPrimary() {
  if (isCreate.value) {
    goManageDashboard(activity.value.id, { replace: true })
    return
  }
  if (isPartner.value || isTeam.value) {
    goMessages({ replace: true })
    return
  }
  if (isWaitlist.value || requireApproval.value) {
    goActivityDetail(activity.value.id, { replace: true })
    return
  }
  goParticipantDashboard(activity.value.id, { replace: true })
}
</script>

<style scoped>
.success-scroll {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.poster-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  min-height: 300rpx;
  padding: 36rpx;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(20, 58, 50, 0.94), rgba(24, 32, 27, 0.9)),
    url("https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&q=80&w=900") center/cover;
  color: #fff;
}

.poster-preview__title {
  display: block;
  margin-top: 24rpx;
  font-size: 38rpx;
  font-weight: 950;
  line-height: 1.2;
}

.poster-preview__meta {
  display: block;
  margin-top: 14rpx;
  color: rgba(255, 255, 255, 0.78);
  font-size: 23rpx;
  font-weight: 800;
  line-height: 1.45;
}

.poster-preview__qr {
  display: flex;
  width: 108rpx;
  height: 108rpx;
  flex: 0 0 108rpx;
  align-items: center;
  justify-content: center;
  border-radius: 30rpx;
  background: #fff;
}

.success-summary {
  margin-top: 24rpx;
}

.success-actions {
  margin-top: 24rpx;
}
</style>
