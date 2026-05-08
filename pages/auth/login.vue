<template>
  <view class="login" :style="contentTopStyle">
    <view class="login__nav" :style="navStyle">
      <view class="login__nav-row" :style="navRowStyle">
        <view class="login__back" @tap="goBack">Back</view>
      </view>
    </view>

    <view class="login__hero">
      <view class="login__logo">SG</view>
      <text class="login__eyebrow">SureGo</text>
      <text class="login__title">Sign in to continue</text>
      <text class="login__desc">After signing in, you can create activities, apply, view tickets and check in.</text>
    </view>

    <view class="login__panel">
      <view class="login__profile">
        <image class="login__avatar" :src="profile.avatar" mode="aspectFill" />
        <view class="login__profile-copy">
          <text class="login__name">{{ profile.nickname }}</text>
          <text class="login__meta">{{ profile.mbti }} · Credit {{ profile.credit }}</text>
        </view>
      </view>

      <button
        class="login__primary"
        :class="{ 'login__primary--loading': isLoggingIn }"
        :disabled="isLoggingIn"
        @tap="handleLogin"
      >
        {{ isLoggingIn ? 'Signing in...' : 'Sign in and continue' }}
      </button>
      <view class="login__secondary" @tap="goBack">Skip for now</view>
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
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, normalizeInternalUrl } from '@/common/utils/route.js'

const redirect = ref('')
const profile = ref(getCurrentUserProfile())
const isLoggingIn = ref(false)
const profileSheetVisible = ref(false)
const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 32, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 28 })

onLoad((query = {}) => {
  const rawRedirect = decodeURIComponent(query.redirect || '')
  redirect.value = rawRedirect ? normalizeInternalUrl(rawRedirect, '') : ''
  profile.value = getCurrentUserProfile()
})

async function handleLogin() {
  if (isLoggingIn.value) return

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
      uni.showToast({ title: 'Signed in. Complete your profile.', icon: 'none' })
      return
    }

    finishLogin('Signed in')
  } catch (error) {
    isLoggingIn.value = false
    uni.showToast({ title: 'Sign in failed. Try again later.', icon: 'none' })
  }
}

function handleProfileSaved(user) {
  profile.value = {
    ...profile.value,
    ...(user || {})
  }
  profileSheetVisible.value = false
  finishLogin('Profile saved')
}

function handleProfileSkipped() {
  profileSheetVisible.value = false
  finishLogin('Signed in')
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
  padding-right: 32rpx;
  padding-bottom: 64rpx;
  padding-left: 32rpx;
  box-sizing: border-box;
  background:
    radial-gradient(circle at 20% 12%, rgba(255, 107, 107, 0.22), transparent 34%),
    linear-gradient(180deg, #fff8f2 0%, #f8f9f9 56%, #ffffff 100%);
}

.login__nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 20;
}

.login__nav-row {
  display: flex;
  align-items: center;
}

.login__back {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 96rpx;
  height: 64rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.86);
  color: #353b55;
  font-size: 24rpx;
  font-weight: 800;
}

.login__hero {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding-top: 32rpx;
}

.login__logo {
  width: 104rpx;
  height: 104rpx;
  border-radius: 32rpx;
  background: #0f172a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 900;
  box-shadow: 0 22rpx 48rpx rgba(15, 23, 42, 0.18);
}

.login__eyebrow {
  color: #ff6b6b;
  font-size: 24rpx;
  font-weight: 900;
  letter-spacing: 6rpx;
  text-transform: uppercase;
}

.login__title {
  color: #151826;
  font-size: 58rpx;
  font-weight: 900;
  line-height: 1.08;
}

.login__desc {
  color: #697083;
  font-size: 28rpx;
  line-height: 1.7;
}

.login__panel {
  margin-top: 56rpx;
  padding: 34rpx;
  border-radius: 44rpx;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 28rpx 70rpx rgba(15, 23, 42, 0.1);
}

.login__profile {
  display: flex;
  align-items: center;
  gap: 22rpx;
  margin-bottom: 34rpx;
}

.login__avatar {
  width: 112rpx;
  height: 112rpx;
  border-radius: 36rpx;
  background: #eef2f7;
}

.login__profile-copy {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.login__name {
  color: #151826;
  font-size: 34rpx;
  font-weight: 900;
}

.login__meta {
  color: #7b8194;
  font-size: 24rpx;
}

.login__primary {
  height: 96rpx;
  border: 0;
  border-radius: 30rpx;
  background: #151826;
  color: #fff;
  font-size: 30rpx;
  font-weight: 900;
  line-height: 96rpx;
}

.login__primary--loading {
  opacity: 0.72;
}

.login__secondary {
  margin-top: 26rpx;
  color: #7b8194;
  font-size: 26rpx;
  font-weight: 800;
  text-align: center;
}
</style>
