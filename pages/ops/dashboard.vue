<template>
  <view class="ops su-page">
    <view class="ops__nav" :style="navStyle">
      <view class="ops__nav-row" :style="navRowStyle">
        <view class="ops__back" @tap="goBackOrFallback">
          <SuIcon name="left" size="48" glyph-size="24" variant="inline" color="#111827" />
        </view>
        <view>
          <text class="ops__title">运营控制台</text>
        </view>
        <view class="ops__report" @tap="goOpsReports('pending')">
          <SuIcon name="flag" size="40" glyph-size="20" variant="inline" color="#ef4444" />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="ops__scroll" :style="contentTopStyle">
      <view class="ops-tools">
        <view class="ops-tool" @tap="goOpsUsers">
          <view class="ops-tool__icon">
            <SuIcon name="people" size="44" glyph-size="22" variant="inline" color="#fff" />
          </view>
          <view class="ops-tool__copy">
            <text class="ops-tool__title">用户与权限</text>
          </view>
          <SuIcon name="arrowRight" size="36" glyph-size="18" variant="inline" color="#94a3b8" />
        </view>
      </view>

      <view class="metric-grid">
        <view v-for="item in metricCards" :key="item.key" class="metric-card">
          <text class="metric-card__value">{{ item.value }}</text>
          <text class="metric-card__label">{{ item.label }}</text>
        </view>
      </view>

      <view class="section-head">
        <view>
          <text class="section-head__title">活动治理</text>
        </view>
        <view class="section-head__link" @tap="loadOpsData">刷新</view>
      </view>

      <view class="activity-list">
        <view v-for="item in activities" :key="item.id" class="activity-card">
          <image class="activity-card__cover" :src="item.image || item.cover" mode="aspectFill" />
          <view class="activity-card__body">
            <view class="activity-card__top">
              <text class="activity-card__title su-line-1">{{ item.title }}</text>
              <text class="activity-card__badge" :class="`activity-card__badge--${item.moderationStatus}`">
                {{ getModerationLabel(item.moderationStatus) }}
              </text>
            </view>
            <text class="activity-card__meta">{{ item.date }} {{ item.time }} · {{ item.location }}</text>
            <text v-if="item.moderationNote" class="activity-card__note">{{ item.moderationNote }}</text>
            <view class="activity-card__actions">
              <view @tap="handleModerate(item, 'approved')">通过</view>
              <view @tap="handleModerate(item, 'rejected')">驳回</view>
              <view @tap="handleModerate(item, 'hidden')">下架</view>
              <view @tap="handleModerate(item, 'approved')">恢复</view>
            </view>
          </view>
        </view>
      </view>

      <view class="section-head">
        <view>
          <text class="section-head__title">搭子治理</text>
        </view>
      </view>

      <view class="activity-list">
        <view v-for="item in partnerPosts" :key="item.id" class="activity-card">
          <image class="activity-card__cover" :src="item.image || item.cover || '/static/logo.png'" mode="aspectFill" />
          <view class="activity-card__body">
            <view class="activity-card__top">
              <text class="activity-card__title su-line-1">{{ item.title }}</text>
              <text class="activity-card__badge" :class="`activity-card__badge--${item.moderationStatus}`">
                {{ getModerationLabel(item.moderationStatus) }}
              </text>
            </view>
            <text class="activity-card__meta">{{ item.schedule || '时间待定' }} · {{ item.location || '地点待定' }}</text>
            <text v-if="item.moderationNote" class="activity-card__note">{{ item.moderationNote }}</text>
            <view class="activity-card__actions">
              <view @tap="handleModeratePartner(item, 'approved')">通过</view>
              <view @tap="handleModeratePartner(item, 'rejected')">驳回</view>
              <view @tap="handleModeratePartner(item, 'hidden')">下架</view>
              <view @tap="handleModeratePartner(item, 'approved')">恢复</view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getOpsStats, listOpsActivities, listOpsPartnerPosts, moderateActivity, moderatePartnerPost } from '@/common/api/moderation.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goOpsReports, goOpsUsers } from '@/common/utils/route.js'

const stats = ref({
  activityCount: 0,
  pendingReports: 0,
  pendingActivities: 0,
  hiddenActivities: 0,
  partnerCount: 0,
  pendingPartners: 0,
  hiddenPartners: 0,
  applicationCount: 0,
  orderCount: 0,
  paidOrderCount: 0,
  pendingOrderCount: 0,
  refundedOrderCount: 0,
  checkinRate: 0
})
const activities = ref([])
const partnerPosts = ref([])
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 18 })

const metricCards = computed(() => [
  { key: 'reports', label: '待处理举报', value: stats.value.pendingReports },
  { key: 'reviewing', label: '待审核活动', value: stats.value.pendingActivities },
  { key: 'partnerReviewing', label: '待审核搭子', value: stats.value.pendingPartners },
  { key: 'orders', label: '订单总数', value: stats.value.orderCount },
  { key: 'paid', label: '已支付', value: stats.value.paidOrderCount },
  { key: 'hidden', label: '已下架', value: Number(stats.value.hiddenActivities || 0) + Number(stats.value.hiddenPartners || 0) }
])

onShow(loadOpsData)

async function loadOpsData() {
  const [nextStats, nextActivities, nextPartnerPosts] = await Promise.all([
    getOpsStats(),
    listOpsActivities(),
    listOpsPartnerPosts()
  ])
  stats.value = { ...stats.value, ...nextStats }
  activities.value = nextActivities
  partnerPosts.value = nextPartnerPosts
}

function getModerationLabel(status = 'pending') {
  const labels = {
    pending: '待审核',
    visible: '展示中',
    approved: '已通过',
    rejected: '已驳回',
    hidden: '已下架'
  }
  return labels[status] || labels.pending
}

async function handleModerate(item, moderationStatus) {
  const isRestore = moderationStatus === 'approved' && item.moderationStatus === 'hidden'
  if (!isRestore && item.moderationStatus === moderationStatus) {
    uni.showToast({ title: '状态未变化', icon: 'none' })
    return
  }
  const labels = {
    approved: '运营通过',
    rejected: '运营驳回',
    hidden: '活动已下架'
  }
  const updated = await moderateActivity(item.id, moderationStatus, {
    activity: item,
    previousModerationStatus: item.moderationStatus,
    moderationNote: isRestore ? '恢复展示' : labels[moderationStatus]
  })
  activities.value = activities.value.map((activity) => (
    activity.id === item.id ? { ...activity, ...updated } : activity
  ))
  stats.value = await getOpsStats()
  uni.showToast({ title: moderationStatus === 'approved' && item.moderationStatus === 'hidden' ? '恢复展示' : labels[moderationStatus], icon: 'none' })
}

async function handleModeratePartner(item, moderationStatus) {
  const isRestore = moderationStatus === 'approved' && item.moderationStatus === 'hidden'
  if (!isRestore && item.moderationStatus === moderationStatus) {
    uni.showToast({ title: '状态未变化', icon: 'none' })
    return
  }
  const labels = {
    approved: '运营通过',
    rejected: '运营驳回',
    hidden: '搭子已下架'
  }
  const updated = await moderatePartnerPost(item.id, moderationStatus, {
    moderationNote: isRestore ? '恢复展示' : labels[moderationStatus]
  })
  partnerPosts.value = partnerPosts.value.map((post) => (
    post.id === item.id ? { ...post, ...updated } : post
  ))
  stats.value = await getOpsStats()
  uni.showToast({ title: isRestore ? '恢复展示' : labels[moderationStatus], icon: 'none' })
}
</script>

<style scoped>
.ops {
  min-height: 100vh;
  background: #f8fafc;
}

.ops__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  background: rgba(248, 250, 252, 0.9);
  backdrop-filter: blur(18px);
}

.ops__nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ops__back,
.ops__report {
  display: flex;
  width: 72rpx;
  height: 72rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.08);
}

.ops__title,
.ops__sub {
  display: block;
  text-align: center;
}

.ops__title {
  color: #0f172a;
  font-size: 32rpx;
  font-weight: 900;
}

.ops__sub {
  margin-top: 4rpx;
  color: #94a3b8;
  font-size: 18rpx;
  font-weight: 900;
}

.ops__scroll {
  height: 100vh;
  box-sizing: border-box;
}

.hero {
  margin: 10rpx 34rpx 28rpx;
  padding: 38rpx;
  border-radius: 36rpx;
  background: #0f172a;
  color: #fff;
}

.hero__eyebrow,
.hero__title {
  display: block;
}

.hero__eyebrow {
  color: #93c5fd;
  font-size: 20rpx;
  font-weight: 900;
}

.hero__title {
  margin-top: 14rpx;
  font-size: 38rpx;
  font-weight: 900;
  line-height: 1.35;
}

.hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 28rpx;
}

.hero__chips text {
  padding: 9rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.12);
  font-size: 20rpx;
  font-weight: 900;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  padding: 0 34rpx;
}

.ops-tools {
  padding: 0 34rpx 28rpx;
}

.ops-tool {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  background: #fff;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.06);
}

.ops-tool__icon {
  display: flex;
  width: 68rpx;
  height: 68rpx;
  align-items: center;
  justify-content: center;
  border-radius: 22rpx;
  background: #0f172a;
}

.ops-tool__copy {
  flex: 1;
  min-width: 0;
}

.ops-tool__title,
.ops-tool__desc {
  display: block;
}

.ops-tool__title {
  color: #0f172a;
  font-size: 26rpx;
  font-weight: 900;
}

.ops-tool__desc {
  margin-top: 6rpx;
  color: #94a3b8;
  font-size: 21rpx;
  font-weight: 800;
}

.metric-card {
  padding: 24rpx 18rpx;
  border-radius: 26rpx;
  background: #fff;
  box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.05);
}

.metric-card__value,
.metric-card__label {
  display: block;
}

.metric-card__value {
  color: #0f172a;
  font-size: 38rpx; font-weight: 900;
}

.metric-card__label {
  margin-top: 6rpx;
  color: #94a3b8;
  font-size: 19rpx;
  font-weight: 900;
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 38rpx 34rpx 18rpx;
}

.section-head__title,
.section-head__sub {
  display: block;
}

.section-head__title {
  color: #0f172a;
  font-size: 31rpx;
  font-weight: 900;
}

.section-head__sub,
.section-head__link {
  margin-top: 6rpx;
  color: #94a3b8;
  font-size: 21rpx;
  font-weight: 900;
}

.section-head__link {
  color: #3b82f6;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 0 34rpx 70rpx;
}

.activity-card {
  display: flex;
  gap: 20rpx;
  padding: 22rpx;
  border-radius: 30rpx;
  background: #fff;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.05);
}

.activity-card__cover {
  width: 128rpx;
  height: 128rpx;
  border-radius: 22rpx;
  background: #e2e8f0;
}

.activity-card__body {
  flex: 1;
  min-width: 0;
}

.activity-card__top {
  display: flex;
  gap: 12rpx;
  align-items: center;
}

.activity-card__title {
  flex: 1;
  color: #0f172a;
  font-size: 26rpx;
  font-weight: 900;
}

.activity-card__badge {
  flex: 0 0 auto;
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: #dcfce7;
  color: #16a34a;
  font-size: 18rpx;
  font-weight: 900;
}

.activity-card__badge--rejected,
.activity-card__badge--hidden {
  background: #fee2e2;
  color: #ef4444;
}

.activity-card__badge--pending {
  background: #fef3c7;
  color: #d97706;
}

.activity-card__meta,
.activity-card__note {
  display: block;
  margin-top: 10rpx;
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 800;
}

.activity-card__note {
  color: #ef4444;
}

.activity-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 14rpx;
}

.activity-card__actions view {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: #f1f5f9;
  color: #334155;
  font-size: 19rpx;
  font-weight: 900;
}
</style>
