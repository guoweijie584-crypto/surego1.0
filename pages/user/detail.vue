<template>
  <view class="public-profile su-page">
    <view class="public-profile__nav" :style="navStyle">
      <view class="public-profile__nav-row" :style="navRowStyle">
        <view class="public-profile__back" @tap="goBackOrFallback">
          <uni-icons type="left" size="24" color="#0f172a" />
        </view>
        <text class="public-profile__title">个人资料</text>
        <view class="public-profile__spacer" />
      </view>
    </view>

    <scroll-view scroll-y class="public-profile__scroll" :style="contentTopStyle">
      <view class="hero">
        <view class="hero__avatar-wrap">
          <image class="hero__avatar" :src="profile.avatar" mode="aspectFill" />
          <view class="hero__glow" />
        </view>
        <view class="hero__body">
          <view class="hero__name-row">
            <text class="hero__name">{{ profile.nickname }}</text>
            <text class="hero__credit">信用 {{ profile.credit || 100 }}</text>
          </view>
          <text class="hero__meta">{{ profile.mbti || 'MBTI 未填写' }}</text>
          <text class="hero__bio">{{ profile.bio || '这个成员还没有填写简介。' }}</text>
          <text class="hero__quote">{{ profile.quote || '期待在下一场活动里认识 TA。' }}</text>
        </view>
      </view>

      <view v-if="hasActivityContext" class="context-card">
        <view class="context-card__icon">
          <uni-icons type="person-filled" size="20" color="#4f46e5" />
        </view>
        <view class="context-card__copy">
          <text class="context-card__title">来自同一场活动</text>
          <text class="context-card__text">你正在查看这位成员的公开 SureGo 名片。</text>
        </view>
      </view>

      <view class="stats">
        <view class="stat">
          <text>{{ profile.activityCount || 0 }}</text>
          <text>活动</text>
        </view>
        <view class="stat">
          <text>{{ profile.hostedCount || 0 }}</text>
          <text>主办</text>
        </view>
        <view class="stat">
          <text>{{ profile.joinedCount || 0 }}</text>
          <text>参与</text>
        </view>
      </view>

      <view class="panel">
        <view class="panel__head">
          <view>
            <text class="panel__title">最近公开活动</text>
            <text class="panel__sub">PUBLIC ACTIVITIES</text>
          </view>
        </view>
        <view v-if="recentActivities.length === 0" class="empty">
          <uni-icons type="calendar" size="36" color="#cbd5e1" />
          <text>暂无公开活动</text>
        </view>
        <view v-for="item in recentActivities" :key="item.id" class="activity-row" @tap="openActivity(item)">
          <image class="activity-row__cover" :src="item.image" mode="aspectFill" />
          <view class="activity-row__body">
            <view class="activity-row__line">
              <text class="activity-row__title su-line-1">{{ item.title }}</text>
              <text class="activity-row__badge" :class="`activity-row__badge--${item.relation || 'joined'}`">
                {{ getActivityRelationLabel(item.relation) }}
              </text>
            </view>
            <text class="activity-row__meta">{{ getActivityMeta(item) }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { DEFAULT_USER_AVATAR } from '@/common/api/auth.js'
import { getUserProfileById } from '@/common/api/user.js'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goActivityDetail, goBackOrFallback } from '@/common/utils/route.js'

const userId = ref('')
const contextActivityId = ref('')
const profile = ref({
  nickname: '微信用户',
  avatar: DEFAULT_USER_AVATAR,
  credit: 100,
  mbti: '',
  bio: '',
  quote: '',
  activityCount: 0,
  hostedCount: 0,
  joinedCount: 0,
  recentActivities: []
})
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 20 })

const hasActivityContext = computed(() => Boolean(contextActivityId.value))
const recentActivities = computed(() => Array.isArray(profile.value.recentActivities) ? profile.value.recentActivities : [])

onLoad(async (query = {}) => {
  userId.value = String(query.id || query.userId || '')
  contextActivityId.value = String(query.activityId || '')
  if (!userId.value) {
    uni.showToast({ title: '未找到用户', icon: 'none' })
    return
  }
  const data = await getUserProfileById(userId.value)
  profile.value = {
    ...profile.value,
    ...data,
    avatar: data.avatar || DEFAULT_USER_AVATAR,
    nickname: data.nickname || '微信用户',
    recentActivities: Array.isArray(data.recentActivities) ? data.recentActivities : []
  }
})

function getActivityRelationLabel(relation = '') {
  return relation === 'hosted' ? '主办' : '参与'
}

function getActivityMeta(item = {}) {
  return [item.date, item.time, item.city || item.location].filter(Boolean).join(' · ') || '公开活动'
}

function openActivity(item = {}) {
  if (!item.id) return
  goActivityDetail(item.id)
}
</script>

<style scoped>
.public-profile {
  min-height: 100vh;
  background: #f8f9f9;
}

.public-profile__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
  background: rgba(248, 249, 249, 0.9);
  backdrop-filter: blur(18px);
}

.public-profile__nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.public-profile__back,
.public-profile__spacer {
  display: flex;
  width: 78rpx;
  height: 78rpx;
  align-items: center;
  justify-content: center;
}

.public-profile__back {
  border: 1rpx solid #f1f5f9;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 14rpx 34rpx rgba(15, 23, 42, 0.06);
}

.public-profile__title {
  color: #0f172a;
  font-size: 30rpx;
  font-weight: 900;
}

.public-profile__scroll {
  height: 100vh;
  box-sizing: border-box;
}

.hero {
  display: flex;
  gap: 34rpx;
  margin: 0 34rpx 26rpx;
  padding: 34rpx 34rpx 38rpx;
  border-radius: 40rpx;
  background: #fff;
  box-shadow: 0 18rpx 50rpx rgba(15, 23, 42, 0.07);
}

.hero__avatar-wrap {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  flex: 0 0 160rpx;
}

.hero__avatar {
  position: relative;
  z-index: 2;
  width: 160rpx;
  height: 160rpx;
  border: 8rpx solid #fff;
  border-radius: 50%;
  background: #f1f5f9;
  box-shadow: 0 20rpx 48rpx rgba(15, 23, 42, 0.14);
}

.hero__glow {
  position: absolute;
  inset: -8rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #22c55e, #ff6b6b);
  filter: blur(10rpx);
  opacity: 0.24;
}

.hero__body {
  flex: 1;
  min-width: 0;
}

.hero__name-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex-wrap: wrap;
}

.hero__name {
  color: #0f172a;
  font-size: 42rpx;
  font-style: italic;
  font-weight: 900;
}

.hero__credit {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #22c55e;
  color: #fff;
  font-size: 18rpx;
  font-weight: 900;
}

.hero__meta,
.hero__bio,
.hero__quote {
  display: block;
  margin-top: 12rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.5;
}

.hero__quote {
  padding-left: 18rpx;
  border-left: 4rpx solid rgba(34, 197, 94, 0.35);
  color: #94a3b8;
}

.context-card {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin: 0 34rpx 26rpx;
  padding: 22rpx 24rpx;
  border: 1rpx solid #e0e7ff;
  border-radius: 28rpx;
  background: #eef2ff;
}

.context-card__icon {
  display: flex;
  width: 56rpx;
  height: 56rpx;
  flex: 0 0 56rpx;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  background: #fff;
}

.context-card__copy {
  flex: 1;
  min-width: 0;
}

.context-card__title,
.context-card__text {
  display: block;
}

.context-card__title {
  color: #1e293b;
  font-size: 24rpx;
  font-weight: 900;
}

.context-card__text {
  margin-top: 6rpx;
  color: #64748b;
  font-size: 21rpx;
  font-weight: 800;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin: 0 34rpx 26rpx;
}

.stat {
  padding: 24rpx 20rpx;
  border-radius: 28rpx;
  background: #fff;
  box-shadow: 0 14rpx 36rpx rgba(15, 23, 42, 0.05);
}

.stat text:first-child {
  display: block;
  color: #0f172a;
  font-size: 34rpx;
  font-style: italic;
  font-weight: 900;
}

.stat text:last-child {
  display: block;
  margin-top: 8rpx;
  color: #94a3b8;
  font-size: 20rpx;
  font-weight: 900;
}

.panel {
  margin: 0 34rpx 44rpx;
  padding: 30rpx;
  border-radius: 34rpx;
  background: #fff;
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
  margin-top: 6rpx;
  color: #94a3b8;
  font-size: 18rpx;
  font-weight: 900;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 14rpx;
  padding: 70rpx 0 48rpx;
  color: #94a3b8;
  font-size: 23rpx;
  font-weight: 900;
}

.activity-row {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 0;
  border-top: 1rpx solid #f1f5f9;
}

.activity-row:first-of-type {
  margin-top: 18rpx;
}

.activity-row__cover {
  width: 118rpx;
  height: 118rpx;
  flex: 0 0 118rpx;
  border-radius: 24rpx;
  background: #e2e8f0;
}

.activity-row__body {
  flex: 1;
  min-width: 0;
}

.activity-row__line {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.activity-row__title {
  flex: 1;
  min-width: 0;
  color: #0f172a;
  font-size: 26rpx;
  font-style: italic;
  font-weight: 900;
}

.activity-row__badge {
  flex: 0 0 auto;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: #e0e7ff;
  color: #4f46e5;
  font-size: 18rpx;
  font-weight: 900;
}

.activity-row__badge--hosted {
  background: #dcfce7;
  color: #16a34a;
}

.activity-row__meta {
  display: block;
  margin-top: 16rpx;
  color: #94a3b8;
  font-size: 21rpx;
  font-weight: 800;
  line-height: 1.4;
}
</style>
