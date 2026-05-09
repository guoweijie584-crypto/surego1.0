<template>
  <view v-if="isPageLoading" class="members-page">
    <SuPageLoading :style="contentTopStyle" text="成员加载中..." />
  </view>
  <view v-else-if="loadError" class="members-page">
    <view class="topbar" :style="navStyle">
      <view class="topbar__row" :style="navRowStyle">
        <view class="topbar__button" @tap="goBackOrFallback">
          <uni-icons type="left" size="20" color="#0f172a" />
        </view>
        <view class="topbar__title">
          <text>成员列表</text>
          <text>LOAD FAILED</text>
        </view>
        <view class="topbar__button" @tap="refreshMembers">
          <uni-icons type="refresh" size="18" color="#0f172a" />
        </view>
      </view>
    </view>
    <view class="members-error" :style="contentTopStyle">
      <text class="members-error__title">成员加载失败</text>
      <text class="members-error__text">{{ loadError }}</text>
      <view class="members-error__button" @tap="refreshMembers">重新加载</view>
    </view>
  </view>
  <view v-else class="members-page">
    <view class="topbar" :style="navStyle">
      <view class="topbar__row" :style="navRowStyle">
        <view class="topbar__button" @tap="goBackOrFallback">
          <uni-icons type="left" size="20" color="#0f172a" />
        </view>
        <view class="topbar__title">
          <text>成员列表</text>
          <text>{{ confirmedMembers.length }} CONFIRMED</text>
        </view>
        <view class="topbar__button" @tap="refreshMembers">
          <uni-icons type="refresh" size="18" color="#0f172a" />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="members-scroll" :style="contentTopStyle">
      <view class="hero">
        <image class="hero__cover" :src="activity.image" mode="aspectFill" />
        <view class="hero__content">
          <text class="hero__eyebrow">SUREGO CREW</text>
          <text class="hero__title su-line-2">{{ activity.title }}</text>
          <view class="hero__meta">
            <text>{{ activity.date }} {{ activity.time }}</text>
            <text>{{ activity.location }}</text>
          </view>
        </view>
      </view>

      <view class="stats">
        <view class="stat">
          <text>{{ confirmedMembers.length }}</text>
          <text>已确认</text>
        </view>
        <view class="stat">
          <text>{{ pendingMembers.length }}</text>
          <text>待审核</text>
        </view>
        <view class="stat">
          <text>{{ seatsLeft }}</text>
          <text>剩余名额</text>
        </view>
      </view>

      <view class="section">
        <view class="section__head">
          <view>
            <text class="section__title">已确认成员</text>
            <text class="section__sub">APPROVED MEMBERS</text>
          </view>
        </view>

        <view v-for="member in confirmedMembers" :key="member.id" class="member-card" @tap="openMemberProfile(member)">
          <image class="member-card__avatar" :src="member.avatar" mode="aspectFill" />
          <view class="member-card__body">
            <view class="member-card__line">
              <text class="member-card__name">{{ member.name }}</text>
              <text class="member-card__role" :class="{ 'member-card__role--leader': member.role === '局长' }">{{ member.role }}</text>
            </view>
            <text class="member-card__desc su-line-1">{{ member.desc }}</text>
          </view>
          <uni-icons type="right" size="16" color="#cbd5e1" />
        </view>
      </view>

      <view class="section">
        <view class="section__head">
          <view>
            <text class="section__title">申请动态</text>
            <text class="section__sub">APPLICATION QUEUE</text>
          </view>
        </view>

        <view v-if="pendingMembers.length === 0" class="empty">
          <uni-icons type="personadd-filled" size="34" color="#cbd5e1" />
          <text>暂无待审核申请</text>
        </view>
        <view v-for="item in pendingMembers" :key="item.id" class="pending-card">
          <view class="pending-card__avatar">{{ item.gender === 'female' ? '女' : '友' }}</view>
          <view class="pending-card__body">
            <text>待审核申请</text>
            <text class="su-line-1">{{ item.message || '想加入这场活动' }}</text>
          </view>
          <text>{{ item.mbti || 'MBTI' }}</text>
        </view>
      </view>
    </scroll-view>

    <view v-if="selectedMember" class="member-modal">
      <view class="member-modal__mask" @tap="selectedMember = null" />
      <view class="member-modal__panel">
        <image class="member-modal__avatar" :src="selectedMember.avatar" mode="aspectFill" />
        <text class="member-modal__name">{{ selectedMember.name }}</text>
        <text class="member-modal__role">{{ selectedMember.role }}</text>
        <text class="member-modal__desc">{{ selectedMember.desc }}</text>
        <view class="member-modal__button" @tap="selectedMember = null">知道了</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getActivityDetail } from '@/common/api/activity.js'
import { listApplications } from '@/common/api/application.js'
import { listActivityMembers } from '@/common/api/member.js'
import { createEmptyActivity } from '@/common/utils/activity-default.js'
import SuPageLoading from '@/components/surego/SuPageLoading.vue'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback, goUserDetail } from '@/common/utils/route.js'

const activity = ref(createEmptyActivity())
const applications = ref([])
const memberProfiles = ref([])
const selectedMember = ref(null)
const isPageLoading = ref(true)
const loadError = ref('')
const activityId = ref('')
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 30, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 20 })
const members = [
  {
    id: 'default_leader',
    name: 'SureGo',
    role: '局长',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=SureGo',
    desc: 'SureGo 活动成员'
  }
]

const confirmedMembers = computed(() => {
  if (memberProfiles.value.length) return memberProfiles.value
  const leader = {
    id: `leader_${activity.value.id}`,
    userId: activity.value.creatorId || activity.value.creator_id,
    name: activity.value.organizer || '局长',
    role: '局长',
    avatar: activity.value.organizerAvatar || members[0].avatar,
    desc: '本局发起人，负责审核、集合和现场节奏'
  }
  const approved = applications.value
    .filter((item) => item.status === 'approved')
    .map((item, index) => ({
      id: item.id,
      userId: item.userId || item.user_id,
      name: item.nickname || `参与者 ${index + 1}`,
      role: '参与者',
      avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(item.userId || item.id)}`,
      desc: item.reviewNote || item.message || '已通过报名审核'
    }))
  const staticMembers = members
    .filter((item) => item.role !== '局长')
    .slice(0, Math.max(0, Number(activity.value.participantCount || 1) - 1))
    .map((item) => ({ ...item, desc: item.desc || 'SureGo 活动常客，信用分稳定' }))

  const merged = [leader, ...approved, ...staticMembers]
  const seen = new Set()
  return merged.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
})

const pendingMembers = computed(() => applications.value.filter((item) => item.status === 'pending'))

const seatsLeft = computed(() => {
  if (!activity.value.hasParticipantLimit) return '不限'
  return Math.max(0, Number(activity.value.maxParticipants || 0) - confirmedMembers.value.length)
})

onLoad(async (query) => {
  activityId.value = String((query && query.id) || '').trim()
  await loadMembers()
})

async function loadMembers() {
  isPageLoading.value = true
  try {
    loadError.value = ''
    if (!activityId.value) throw new Error('缺少活动 ID，请从活动详情页重新进入。')
    activity.value = await getActivityDetail(activityId.value)
    if (!activity.value?.id) throw new Error('活动不存在或已下架。')
    const [applicationResult, memberResult] = await Promise.allSettled([
      listApplications(activityId.value),
      listActivityMembers(activityId.value)
    ])
    applications.value = applicationResult.status === 'fulfilled' ? applicationResult.value : []
    memberProfiles.value = memberResult.status === 'fulfilled' ? memberResult.value : []
    if (applicationResult.status === 'rejected' || memberResult.status === 'rejected') {
      uni.showToast({ title: '部分成员数据加载失败', icon: 'none' })
    }
  } catch (error) {
    loadError.value = error?.message || '成员加载失败，请稍后重试。'
    uni.showToast({ title: loadError.value, icon: 'none' })
  } finally {
    isPageLoading.value = false
  }
}

async function refreshMembers() {
  await loadMembers()
  if (!loadError.value) {
    uni.showToast({ title: '成员已刷新', icon: 'none' })
  }
}

function openMemberProfile(member) {
  if (member?.userId || member?.id) {
    goUserDetail(member.userId || member.id, { activityId: activity.value.id })
    return
  }
  selectedMember.value = member
}
</script>

<style scoped>
.members-page {
  min-height: 100vh;
  background: #f8fafc;
}

.topbar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  background: rgba(248, 250, 252, 0.9);
  backdrop-filter: blur(18rpx);
}

.topbar__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.topbar__button {
  display: flex;
  width: 72rpx;
  height: 72rpx;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.08);
}

.topbar__title {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 4rpx;
}

.topbar__title text:first-child {
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 900;
}

.topbar__title text:last-child {
  color: #94a3b8;
  font-size: 18rpx;
  font-weight: 900;
}

.members-scroll {
  height: 100vh;
  box-sizing: border-box;
  padding-right: 28rpx;
  padding-bottom: 48rpx;
  padding-left: 28rpx;
}

.members-error {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin: 0 28rpx;
  padding: 34rpx;
  border-radius: 34rpx;
  background: #fff;
  box-shadow: 0 22rpx 48rpx rgba(15, 23, 42, 0.12);
}

.members-error__title {
  color: #0f172a;
  font-size: 34rpx;
  font-weight: 900;
}

.members-error__text {
  color: #64748b;
  font-size: 25rpx;
  font-weight: 700;
  line-height: 1.5;
}

.members-error__button {
  width: 220rpx;
  height: 72rpx;
  border-radius: 999rpx;
  background: #0f172a;
  color: #fff;
  font-size: 24rpx;
  font-weight: 900;
  line-height: 72rpx;
  text-align: center;
}

.hero {
  overflow: hidden;
  border-radius: 36rpx;
  background: #0f172a;
  box-shadow: 0 22rpx 48rpx rgba(15, 23, 42, 0.16);
}

.hero__cover {
  width: 100%;
  height: 300rpx;
  background: #e2e8f0;
}

.hero__content {
  padding: 26rpx 30rpx 34rpx;
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
  font-size: 36rpx;
  font-weight: 900;
  line-height: 1.25;
}

.hero__meta {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 18rpx;
  color: #cbd5e1;
  font-size: 22rpx;
  font-weight: 800;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin-top: 22rpx;
}

.stat {
  display: flex;
  min-height: 118rpx;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8rpx;
  border-radius: 28rpx;
  background: #fff;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.06);
}

.stat text:first-child {
  color: #0f172a;
  font-size: 34rpx;
  font-weight: 900;
}

.stat text:last-child {
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 900;
}

.section {
  margin-top: 24rpx;
  padding: 30rpx;
  border-radius: 34rpx;
  background: #fff;
  box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.06);
}

.section__head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.section__title,
.section__sub {
  display: block;
}

.section__title {
  color: #0f172a;
  font-size: 28rpx;
  font-weight: 900;
}

.section__sub {
  margin-top: 4rpx;
  color: #cbd5e1;
  font-size: 18rpx;
  font-weight: 900;
}

.member-card,
.pending-card {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 20rpx 0;
  border-top: 1rpx solid #f1f5f9;
}

.member-card__avatar {
  width: 86rpx;
  height: 86rpx;
  border-radius: 28rpx;
  background: #e2e8f0;
}

.member-card__body,
.pending-card__body {
  flex: 1;
  min-width: 0;
}

.member-card__line {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.member-card__name {
  color: #0f172a;
  font-size: 26rpx;
  font-weight: 900;
}

.member-card__role {
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  background: #f1f5f9;
  color: #64748b;
  font-size: 18rpx;
  font-weight: 900;
}

.member-card__role--leader {
  background: #fee2e2;
  color: #ef4444;
}

.member-card__desc,
.pending-card__body text:last-child {
  display: block;
  margin-top: 8rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 800;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 14rpx;
  min-height: 180rpx;
  color: #94a3b8;
  font-size: 23rpx;
  font-weight: 900;
}

.pending-card__avatar {
  display: flex;
  width: 74rpx;
  height: 74rpx;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 24rpx;
  font-weight: 900;
}

.pending-card__body text:first-child,
.pending-card > text {
  color: #0f172a;
  font-size: 22rpx;
  font-weight: 900;
}

.member-modal {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 80;
}

.member-modal__mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(15, 23, 42, 0.5);
}

.member-modal__panel {
  position: absolute;
  right: 48rpx;
  left: 48rpx;
  top: 50%;
  padding: 52rpx 40rpx 40rpx;
  border-radius: 42rpx;
  background: #fff;
  text-align: center;
  transform: translateY(-50%);
}

.member-modal__avatar {
  width: 148rpx;
  height: 148rpx;
  border-radius: 36rpx;
}

.member-modal__name,
.member-modal__role,
.member-modal__desc {
  display: block;
}

.member-modal__name {
  margin-top: 24rpx;
  color: #0f172a;
  font-size: 38rpx;
  font-weight: 900;
}

.member-modal__role {
  margin-top: 8rpx;
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 900;
}

.member-modal__desc {
  margin-top: 22rpx;
  color: #64748b;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.5;
}

.member-modal__button {
  display: flex;
  height: 82rpx;
  align-items: center;
  justify-content: center;
  margin-top: 30rpx;
  border-radius: 26rpx;
  background: #0f172a;
  color: #fff;
  font-size: 26rpx;
  font-weight: 900;
}
</style>
