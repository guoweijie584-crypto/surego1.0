<template>
  <view class="reports su-page">
    <view class="reports__nav">
      <view class="reports__back" @tap="goOpsDashboard">
        <uni-icons type="left" size="24" color="#111827" />
      </view>
      <view>
        <text class="reports__title">举报处理</text>
        <text class="reports__sub">Reports Queue</text>
      </view>
      <view class="reports__refresh" @tap="loadReports">
        <uni-icons type="refreshempty" size="22" color="#111827" />
      </view>
    </view>

    <scroll-view scroll-y class="reports__scroll">
      <view class="report-filters">
        <view
          v-for="item in reportFilters"
          :key="item.key"
          class="report-filter"
          :class="{ 'report-filter--active': activeStatus === item.key }"
          @tap="switchStatus(item.key)"
        >
          {{ item.label }}
        </view>
      </view>

      <view v-if="reports.length === 0" class="empty">
        <uni-icons type="flag" size="44" color="#cbd5e1" />
        <text>暂无举报记录</text>
      </view>

      <view class="report-list">
        <view v-for="item in reports" :key="item.id" class="report-card">
          <view class="report-card__head">
            <view>
              <text class="report-card__title">{{ item.activityTitle || 'SureGo 活动' }}</text>
              <text class="report-card__meta">举报原因：{{ reasonLabel(item.reason) }}</text>
            </view>
            <text class="report-card__badge" :class="`report-card__badge--${item.status}`">
              {{ statusLabel(item.status) }}
            </text>
          </view>
          <text class="report-card__note">{{ item.note || '用户未填写补充说明' }}</text>
          <text v-if="item.reviewNote" class="report-card__review">处理备注：{{ item.reviewNote }}</text>

          <view v-if="activeReportId === item.id" class="review-box">
            <textarea
              v-model="reviewNote"
              class="review-box__textarea"
              maxlength="120"
              adjust-position="false"
              cursor-spacing="28"
              placeholder="写给举报人的处理说明"
            />
            <view class="review-box__actions">
              <view @tap="submitReview(item, 'resolved')">确认处理</view>
              <view class="review-box__reject" @tap="submitReview(item, 'rejected')">驳回举报</view>
            </view>
          </view>

          <view v-else class="report-card__actions">
            <view @tap="openReview(item)">处理</view>
            <view @tap="submitReview(item, 'resolved')">快速解决</view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { listReports, updateReportStatus } from '@/common/api/moderation.js'
import { goOpsDashboard } from '@/common/utils/route.js'

const reportFilters = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'resolved', label: '已处理' },
  { key: 'rejected', label: '已驳回' }
]
const activeStatus = ref('pending')
const reports = ref([])
const activeReportId = ref('')
const reviewNote = ref('')

onLoad((query) => {
  if (query?.status) activeStatus.value = query.status
})

onShow(loadReports)

async function loadReports() {
  reports.value = await listReports(activeStatus.value)
}

function switchStatus(status) {
  activeStatus.value = status
  activeReportId.value = ''
  reviewNote.value = ''
  loadReports()
}

function openReview(item) {
  activeReportId.value = item.id
  reviewNote.value = item.reviewNote || ''
}

function reasonLabel(reason = 'content') {
  const labels = {
    content: '内容不适',
    spam: '垃圾信息',
    safety: '安全风险',
    other: '其他问题'
  }
  return labels[reason] || labels.content
}

function statusLabel(status = 'pending') {
  const labels = {
    pending: '待处理',
    resolved: '已处理',
    rejected: '已驳回'
  }
  return labels[status] || labels.pending
}

async function submitReview(item, status) {
  const note = reviewNote.value.trim() || (status === 'resolved' ? '运营已处理该举报。' : '举报证据不足，暂不处理。')
  await updateReportStatus(item.id, status, { reviewNote: note })
  activeReportId.value = ''
  reviewNote.value = ''
  await loadReports()
  uni.showToast({ title: status === 'resolved' ? '举报已处理' : '举报已驳回', icon: 'none' })
}
</script>

<style scoped>
.reports {
  min-height: 100vh;
  background: #f8fafc;
}

.reports__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 58rpx 34rpx 22rpx;
}

.reports__back,
.reports__refresh {
  display: flex;
  width: 72rpx;
  height: 72rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.08);
}

.reports__title,
.reports__sub {
  display: block;
  text-align: center;
}

.reports__title {
  color: #0f172a;
  font-size: 32rpx;
  font-weight: 900;
}

.reports__sub {
  margin-top: 4rpx;
  color: #94a3b8;
  font-size: 18rpx;
  font-weight: 900;
}

.reports__scroll {
  height: calc(100vh - 154rpx);
}

.report-filters {
  display: flex;
  gap: 12rpx;
  overflow-x: auto;
  padding: 14rpx 34rpx 24rpx;
  white-space: nowrap;
}

.report-filter {
  flex: 0 0 auto;
  padding: 14rpx 24rpx;
  border-radius: 999rpx;
  background: #fff;
  color: #94a3b8;
  font-size: 22rpx;
  font-weight: 900;
  box-shadow: 0 10rpx 24rpx rgba(15, 23, 42, 0.05);
}

.report-filter--active {
  background: #0f172a;
  color: #fff;
}

.report-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 0 34rpx 70rpx;
}

.report-card {
  padding: 28rpx;
  border-radius: 30rpx;
  background: #fff;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.05);
}

.report-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.report-card__title,
.report-card__meta,
.report-card__note,
.report-card__review {
  display: block;
}

.report-card__title {
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 900;
}

.report-card__meta,
.report-card__note,
.report-card__review {
  margin-top: 10rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.5;
}

.report-card__review {
  color: #16a34a;
}

.report-card__badge {
  flex: 0 0 auto;
  padding: 7rpx 14rpx;
  border-radius: 999rpx;
  background: #fef3c7;
  color: #d97706;
  font-size: 19rpx;
  font-weight: 900;
}

.report-card__badge--resolved {
  background: #dcfce7;
  color: #16a34a;
}

.report-card__badge--rejected {
  background: #fee2e2;
  color: #ef4444;
}

.report-card__actions,
.review-box__actions {
  display: flex;
  gap: 12rpx;
  margin-top: 20rpx;
}

.report-card__actions view,
.review-box__actions view {
  display: flex;
  height: 64rpx;
  align-items: center;
  justify-content: center;
  padding: 0 24rpx;
  border-radius: 20rpx;
  background: #0f172a;
  color: #fff;
  font-size: 22rpx;
  font-weight: 900;
}

.review-box {
  margin-top: 22rpx;
}

.review-box__textarea {
  width: 100%;
  min-height: 150rpx;
  box-sizing: border-box;
  padding: 22rpx;
  border-radius: 22rpx;
  background: #f8fafc;
  color: #0f172a;
  font-size: 24rpx;
  line-height: 1.5;
}

.review-box__actions .review-box__reject {
  background: #ef4444;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16rpx;
  padding: 140rpx 0;
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 900;
}
</style>
