<template>
  <view class="manage su-page">
    <view class="manage__nav">
      <view class="manage__back" @tap="goBackHome">
        <uni-icons type="left" size="24" color="#fff" />
      </view>
      <text>局面管理</text>
      <view class="manage__back" @tap="showComingSoon('编辑活动后续迁移')">
        <uni-icons type="gear-filled" size="22" color="#fff" />
      </view>
    </view>

    <scroll-view scroll-y class="manage__scroll" :scroll-into-view="scrollIntoView">
      <view class="manage__hero">
        <text class="manage__kicker">COMMAND CENTER</text>
        <text class="manage__title">{{ activity.title }}</text>
        <text class="manage__meta">{{ activity.date }} {{ activity.time }} · {{ activity.location }}</text>
      </view>

      <view class="stats">
        <view class="stat">
          <text>参与人数</text>
          <text>{{ activity.participantCount }}/{{ activity.maxParticipants }}</text>
        </view>
        <view class="stat stat--blue">
          <text>待审申请</text>
          <text>{{ pendingCount }}</text>
        </view>
        <view class="stat stat--green">
          <text>浏览</text>
          <text>{{ activity.viewCount }}</text>
        </view>
      </view>

      <view class="panel">
        <view class="panel__head">
          <text>快捷操作</text>
          <text>OPERATIONS</text>
        </view>
        <view class="action-grid">
          <view v-for="item in actions" :key="item.title" class="action" @tap="handleAction(item)">
            <view :class="['action__icon', item.tone]">
              <uni-icons :type="item.icon" size="24" color="#fff" />
            </view>
            <text>{{ item.title }}</text>
            <text>{{ item.desc }}</text>
          </view>
        </view>
      </view>

      <view id="manage-applications" class="panel">
        <view class="panel__head">
          <text>申请队列</text>
          <text>{{ applications.length }} REQUESTS</text>
        </view>
        <view v-if="applications.length === 0" class="empty">
          <uni-icons type="personadd-filled" size="38" color="#cbd5e1" />
          <text>暂无新的申请，等风来。</text>
        </view>
        <view v-for="item in applications" :key="item.id" class="applicant">
          <view class="applicant__avatar">{{ getInitial(item) }}</view>
          <view class="applicant__content">
            <text class="applicant__name">申请者</text>
            <text class="applicant__msg su-line-2">{{ item.message || '想加入这场活动' }}</text>
          </view>
          <view class="applicant__buttons">
            <view @tap="review(item, 'approved')">通过</view>
            <view @tap="review(item, 'rejected')">拒绝</view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getActivityDetail } from '@/common/api/activity.js'
import { listApplications, reviewApplication } from '@/common/api/application.js'
import { findActivityById } from '@/common/mock/activities.js'
import { goBackHome, goManageCheckin, goMessages, goPayment, showComingSoon } from '@/common/utils/route.js'

const activity = ref(findActivityById('103'))
const applications = ref([])
const scrollIntoView = ref('')

const actions = [
  { title: '审核申请', desc: '处理待加入成员', icon: 'personadd-filled', tone: 'action__icon--blue', key: 'review' },
  { title: '发群通知', desc: '同步集合信息', icon: 'chatboxes-filled', tone: 'action__icon--green', key: 'message' },
  { title: '签到核销', desc: '现场确认到场', icon: 'scan', tone: 'action__icon--dark', key: 'checkin' },
  { title: '票券设置', desc: '金额与规则', icon: 'wallet-filled', tone: 'action__icon--rose', key: 'ticket' }
]

const pendingCount = computed(() => applications.value.filter((item) => item.status === 'pending').length)

onLoad(async (query) => {
  const id = (query && query.id) || '103'
  activity.value = await getActivityDetail(id)
  applications.value = await listApplications(id)
})

function getInitial(item) {
  return item.gender === 'female' ? '她' : '他'
}

async function handleAction(item) {
  if (item.key === 'review') {
    scrollIntoView.value = ''
    await nextTick()
    scrollIntoView.value = 'manage-applications'
    return
  }

  if (item.key === 'message') {
    goMessages()
    return
  }

  if (item.key === 'checkin') {
    goManageCheckin(activity.value.id)
    return
  }

  if (item.key === 'ticket') {
    if (activity.value.partyMode === 'free') {
      uni.showToast({ title: '本局免费，无需票券', icon: 'none' })
      return
    }
    goPayment({
      activityId: activity.value.id,
      type: activity.value.partyMode,
      amount: activity.value.amount
    })
    return
  }

  showComingSoon(`${item.title}将在专项页面接入`)
}

async function review(item, status) {
  await reviewApplication(item.id, status)
  applications.value = applications.value.map((app) => (app.id === item.id ? { ...app, status } : app))
  uni.showToast({
    title: status === 'approved' ? '已通过' : '已拒绝',
    icon: 'none'
  })
}
</script>

<style scoped>
.manage {
  min-height: 100vh;
  background: #0f172a;
}

.manage__nav {
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
  color: #fff;
  font-size: 28rpx;
  font-weight: 900;
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(18px);
}

.manage__back {
  display: flex;
  width: 62rpx;
  height: 62rpx;
  align-items: center;
  justify-content: center;
}

.manage__scroll {
  height: 100vh;
}

.manage__hero {
  padding: 174rpx 40rpx 40rpx;
}

.manage__kicker {
  color: #818cf8;
  font-size: 20rpx;
  font-weight: 900;
}

.manage__title {
  display: block;
  margin-top: 14rpx;
  color: #fff;
  font-size: 42rpx;
  font-weight: 900;
  line-height: 1.38;
}

.manage__meta {
  display: block;
  margin-top: 18rpx;
  color: rgba(255, 255, 255, 0.52);
  font-size: 23rpx;
  font-weight: 800;
  line-height: 1.5;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  padding: 0 28rpx;
}

.stat {
  padding: 26rpx 20rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.08);
}

.stat text:first-child {
  display: block;
  color: rgba(255, 255, 255, 0.42);
  font-size: 19rpx;
  font-weight: 900;
}

.stat text:last-child {
  display: block;
  margin-top: 12rpx;
  color: #fff;
  font-size: 34rpx;
  font-style: italic;
  font-weight: 900;
}

.stat--blue {
  background: rgba(79, 70, 229, 0.22);
}

.stat--green {
  background: rgba(34, 197, 94, 0.18);
}

.panel {
  margin: 28rpx;
  padding: 30rpx;
  border-radius: 38rpx;
  background: #fff;
}

.panel__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 28rpx;
}

.panel__head text:first-child {
  color: #0f172a;
  font-size: 32rpx;
  font-weight: 900;
}

.panel__head text:last-child {
  color: #cbd5e1;
  font-size: 19rpx;
  font-weight: 900;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
}

.action {
  padding: 26rpx;
  border-radius: 30rpx;
  background: #f8fafc;
}

.action__icon {
  display: flex;
  width: 70rpx;
  height: 70rpx;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
}

.action__icon--blue {
  background: #4f46e5;
}

.action__icon--green {
  background: #22c55e;
}

.action__icon--dark {
  background: #0f172a;
}

.action__icon--rose {
  background: #ef4444;
}

.action text:nth-child(2) {
  display: block;
  margin-top: 18rpx;
  color: #0f172a;
  font-size: 25rpx;
  font-weight: 900;
}

.action text:nth-child(3) {
  display: block;
  margin-top: 8rpx;
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 800;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16rpx;
  padding: 70rpx 0;
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 900;
}

.applicant {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 20rpx 0;
  border-top: 1rpx solid #f1f5f9;
}

.applicant__avatar {
  display: flex;
  width: 76rpx;
  height: 76rpx;
  align-items: center;
  justify-content: center;
  border-radius: 26rpx;
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 900;
}

.applicant__content {
  flex: 1;
  min-width: 0;
}

.applicant__name {
  color: #0f172a;
  font-size: 25rpx;
  font-weight: 900;
}

.applicant__msg {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 21rpx;
  font-weight: 700;
}

.applicant__buttons {
  display: flex;
  gap: 10rpx;
}

.applicant__buttons view {
  padding: 12rpx 18rpx;
  border-radius: 18rpx;
  background: #dcfce7;
  color: #16a34a;
  font-size: 20rpx;
  font-weight: 900;
}

.applicant__buttons view:last-child {
  background: #fee2e2;
  color: #ef4444;
}
</style>
