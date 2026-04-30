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

      <view class="stats">
        <view class="stat">
          <text>{{ profile.activityCount || 0 }}</text>
          <text>活动</text>
        </view>
        <view class="stat">
          <text>{{ profile.reviewCount || 0 }}</text>
          <text>评价</text>
        </view>
        <view class="stat">
          <text>{{ profile.orderCount || 0 }}</text>
          <text>订单</text>
        </view>
      </view>

      <view class="panel">
        <view class="panel__head">
          <view>
            <text class="panel__title">SureGo 名片</text>
            <text class="panel__sub">PUBLIC PROFILE</text>
          </view>
        </view>
        <view class="info-row">
          <text>用户 ID</text>
          <text>{{ maskedUserId }}</text>
        </view>
        <view class="info-row">
          <text>角色</text>
          <text>{{ profile.roleText || '普通用户' }}</text>
        </view>
        <view class="info-row">
          <text>资料状态</text>
          <text>{{ profile.profileCompletedAt ? '已完善' : '未完善' }}</text>
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
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback } from '@/common/utils/route.js'

const userId = ref('')
const profile = ref({
  nickname: '微信用户',
  avatar: DEFAULT_USER_AVATAR,
  credit: 100,
  mbti: '',
  bio: '',
  quote: '',
  roleText: '普通用户'
})
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 20 })

const maskedUserId = computed(() => {
  const id = String(profile.value.userId || profile.value.uid || userId.value || '')
  if (!id) return '未知'
  if (id.length <= 8) return id
  return `${id.slice(0, 4)}...${id.slice(-4)}`
})

onLoad(async (query = {}) => {
  userId.value = String(query.id || query.userId || '')
  if (!userId.value) {
    uni.showToast({ title: '未找到用户', icon: 'none' })
    return
  }
  const data = await getUserProfileById(userId.value)
  profile.value = {
    ...profile.value,
    ...data,
    avatar: data.avatar || DEFAULT_USER_AVATAR,
    nickname: data.nickname || '微信用户'
  }
})
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

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 22rpx 0;
  border-top: 1rpx solid #f1f5f9;
  color: #64748b;
  font-size: 23rpx;
  font-weight: 800;
}

.info-row:first-of-type {
  margin-top: 18rpx;
}

.info-row text:last-child {
  color: #0f172a;
  text-align: right;
}
</style>
