<template>
  <view class="login">
    <view class="login__nav">
      <view class="login__back" @tap="goBack">‹</view>
    </view>

    <view class="login__hero">
      <view class="login__logo">成</view>
      <text class="login__eyebrow">SureGo 成行</text>
      <text class="login__title">先认识一下，再一起出发</text>
      <text class="login__desc">授权后可以发起活动、报名入局、查看票券和现场签到。</text>
    </view>

    <view class="login__panel">
      <view class="login__profile">
        <image class="login__avatar" :src="profile.avatar" mode="aspectFill" />
        <view class="login__profile-copy">
          <text class="login__name">{{ profile.nickname }}</text>
          <text class="login__meta">{{ profile.mbti }} · 信用分 {{ profile.credit }}</text>
        </view>
      </view>

      <button
        class="login__primary"
        :class="{ 'login__primary--loading': isLoggingIn }"
        :disabled="isLoggingIn"
        @tap="handleLogin"
      >
        {{ isLoggingIn ? '授权中...' : '授权并继续' }}
      </button>
      <view class="login__secondary" @tap="goBack">先逛逛</view>
    </view>

    <SuWechatProfileSheet
      :visible="profileSheetVisible"
      :initial-profile="profile"
      @saved="handleProfileSaved"
      @close="handleProfileSkipped"
    />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import SuWechatProfileSheet from '@/components/surego/SuWechatProfileSheet.vue'
import { getCurrentUser } from '@/common/api/user.js'
import { getCurrentUserProfile, isSuregoProfileComplete, loginWithWeixin } from '@/common/api/auth.js'

const redirect = ref('')
const profile = ref(getCurrentUserProfile())
const isLoggingIn = ref(false)
const profileSheetVisible = ref(false)

onLoad((query = {}) => {
  redirect.value = decodeURIComponent(query.redirect || '')
  profile.value = getCurrentUserProfile()
})

async function handleLogin() {
  if (isLoggingIn.value) {
    return
  }

  isLoggingIn.value = true
  try {
    const result = await loginWithWeixin()
    const currentProfile = await getCurrentUser().catch(() => result.user || getCurrentUserProfile())
    profile.value = {
      ...profile.value,
      ...(result.user || {}),
      ...currentProfile
    }
    isLoggingIn.value = false
    if (!isSuregoProfileComplete(profile.value)) {
      profileSheetVisible.value = true
      uni.showToast({ title: '登录成功，请完善资料', icon: 'none' })
      return
    }

    finishLogin(result.mode === 'mock' ? '开发模式已授权' : '授权成功')
  } catch (error) {
    isLoggingIn.value = false
    uni.showToast({ title: '授权失败，请稍后再试', icon: 'none' })
  }
}

function handleProfileSaved(user) {
  profile.value = {
    ...profile.value,
    ...(user || {})
  }
  profileSheetVisible.value = false
  finishLogin('资料已保存')
}

function handleProfileSkipped() {
  profileSheetVisible.value = false
  finishLogin('已登录，可稍后完善资料')
}

function finishLogin(title) {
  uni.showToast({
    title,
    icon: 'none'
  })

  setTimeout(() => {
    isLoggingIn.value = false
    completeLoginNavigation()
  }, 280)
}

function completeLoginNavigation() {
  if (redirect.value) {
    uni.redirectTo({ url: redirect.value })
    return
  }
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
    return
  }
  uni.reLaunch({ url: '/pages/home/index' })
}

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
    return
  }
  uni.reLaunch({ url: '/pages/home/index' })
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  padding: 36rpx 32rpx 64rpx;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 20% 12%, rgba(255, 107, 107, 0.22), transparent 34%),
    linear-gradient(180deg, #fff8f2 0%, #f8f9f9 56%, #ffffff 100%);
}

.login__nav {
  height: 72rpx;
  display: flex;
  align-items: center;
}

.login__back {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.86);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 54rpx;
  color: #353b55;
}

.login__hero {
  padding-top: 48rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.login__logo {
  width: 112rpx;
  height: 112rpx;
  border-radius: 36rpx;
  background: #ff6b6b;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  font-weight: 800;
  box-shadow: 0 18rpx 44rpx rgba(255, 107, 107, 0.32);
}

.login__eyebrow {
  font-size: 24rpx;
  color: #ff6b6b;
  font-weight: 700;
}

.login__title {
  max-width: 560rpx;
  font-size: 56rpx;
  line-height: 1.12;
  color: #353b55;
  font-weight: 800;
}

.login__desc {
  max-width: 560rpx;
  font-size: 28rpx;
  line-height: 1.7;
  color: rgba(53, 59, 85, 0.66);
}

.login__panel {
  margin-top: 96rpx;
  padding: 28rpx;
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 22rpx 70rpx rgba(53, 59, 85, 0.12);
}

.login__profile {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 12rpx 8rpx 28rpx;
}

.login__avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: #f1f2f4;
}

.login__profile-copy {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.login__name {
  font-size: 32rpx;
  color: #353b55;
  font-weight: 800;
}

.login__meta {
  font-size: 24rpx;
  color: rgba(53, 59, 85, 0.55);
}

.login__primary {
  width: 100%;
  height: 96rpx;
  border-radius: 30rpx;
  background: #ff6b6b;
  color: #fff;
  font-size: 30rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 18rpx 40rpx rgba(255, 107, 107, 0.28);
}

.login__primary--loading {
  opacity: 0.72;
}

.login__secondary {
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(53, 59, 85, 0.58);
  font-size: 26rpx;
}
</style>
