<template>
  <view class="ops su-page">
    <view class="ops__nav">
      <view class="ops__back" @tap="goBackOrFallback">
        <uni-icons type="left" size="24" color="#111827" />
      </view>
      <view>
        <text class="ops__title">运营控制台</text>
        <text class="ops__sub">SureGo Trial Ops</text>
      </view>
      <view class="ops__report" @tap="goOpsReports('pending')">
        <uni-icons type="flag" size="20" color="#ef4444" />
      </view>
    </view>

    <scroll-view scroll-y class="ops__scroll">
      <view class="hero">
        <text class="hero__eyebrow">试运营看板</text>
        <text class="hero__title">内容、订单、签到状态一屏收口</text>
        <view class="hero__chips">
          <text>活动 {{ stats.activityCount }}</text>
          <text>待举报 {{ stats.pendingReports }}</text>
          <text>签到率 {{ stats.checkinRate }}%</text>
        </view>
      </view>

      <view class="ops-tools">
        <view class="ops-tool" @tap="goOpsUsers">
          <view class="ops-tool__icon">
            <uni-icons type="staff-filled" size="22" color="#fff" />
          </view>
          <view class="ops-tool__copy">
            <text class="ops-tool__title">用户与权限</text>
            <text class="ops-tool__desc">管理员设置用户、运营人员和管理员角色</text>
          </view>
          <uni-icons type="right" size="18" color="#94a3b8" />
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
          <text class="section-head__sub">审核、驳回、下架、恢复展示</text>
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
              <view @tap="handleModerate(item, 'visible')">恢复</view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getOpsStats, listOpsActivities, moderateActivity } from '@/common/api/moderation.js'
import { goBackOrFallback, goOpsReports, goOpsUsers } from '@/common/utils/route.js'

const stats = ref({
  activityCount: 0,
  pendingReports: 0,
  pendingActivities: 0,
  hiddenActivities: 0,
  applicationCount: 0,
  orderCount: 0,
  paidOrderCount: 0,
  pendingOrderCount: 0,
  refundedOrderCount: 0,
  checkinRate: 0
})
const activities = ref([])

const metricCards = computed(() => [
  { key: 'reports', label: '待处理举报', value: stats.value.pendingReports },
  { key: 'reviewing', label: '待审核活动', value: stats.value.pendingActivities },
  { key: 'orders', label: '订单总数', value: stats.value.orderCount },
  { key: 'paid', label: '已支付', value: stats.value.paidOrderCount },
  { key: 'refund', label: '退款/关闭', value: stats.value.refundedOrderCount },
  { key: 'hidden', label: '已下架', value: stats.value.hiddenActivities }
])

onShow(loadOpsData)

async function loadOpsData() {
  const [nextStats, nextActivities] = await Promise.all([
    getOpsStats(),
    listOpsActivities()
  ])
  stats.value = { ...stats.value, ...nextStats }
  activities.value = nextActivities
}

function getModerationLabel(status = 'visible') {
  const labels = {
    visible: '展示中',
    approved: '已通过',
    rejected: '已驳回',
    hidden: '已下架'
  }
  return labels[status] || labels.visible
}

async function handleModerate(item, moderationStatus) {
  const labels = {
    approved: '运营通过',
    rejected: '运营驳回',
    hidden: '活动已下架',
    visible: '恢复展示'
  }
  const updated = await moderateActivity(item.id, moderationStatus, {
    moderationNote: labels[moderationStatus]
  })
  activities.value = activities.value.map((activity) => (
    activity.id === item.id ? { ...activity, ...updated } : activity
  ))
  stats.value = await getOpsStats()
  uni.showToast({ title: labels[moderationStatus], icon: 'none' })
}
</script>

<style scoped>
.ops {
  min-height: 100vh;
  background: #f8fafc;
}

.ops__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 58rpx 34rpx 22rpx;
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
  height: calc(100vh - 154rpx);
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
  font-size: 38rpx;
  font-style: italic;
  font-weight: 900;
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
