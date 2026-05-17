<template>
  <view class="verify su-page">
    <view class="verify__nav" :style="navStyle">
      <view class="verify__nav-row" :style="navRowStyle">
        <view class="floating-back" @tap="goBackOrFallback('/pages/user/profile')">
          <SuIcon name="left" size="44" glyph-size="22" variant="inline" color="#102033" />
          <text>返回</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="verify__scroll" :style="contentTopStyle">
      <view class="page-head">
        <text>学生认证</text>
      </view>

      <view class="verify-hero">
        <SuIcon name="shield" size="84" glyph-size="42" variant="inline" color="#2388ff" />
        <view>
          <text class="pill">天津大学</text>
        </view>
      </view>

      <view class="verify-options">
        <view v-for="item in options" :key="item.title" class="verify-card">
          <SuIcon :name="item.icon" size="48" glyph-size="24" variant="inline" color="#2388ff" />
          <view>
            <text>{{ item.title }}</text>
          </view>
          <text class="verify-card__pill">{{ item.badge }}</text>
        </view>
      </view>

      <view class="bottom-cta">
        <view class="primary-button" @tap="completeVerify">完成认证</view>
        <view class="secondary-button" @tap="goBackOrFallback('/pages/home/index')">先继续浏览</view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import SuIcon from '@/components/surego/SuIcon.vue'
import { getMiniProgramNavContentStyle, getMiniProgramNavRowStyle, getMiniProgramNavStyle, goBackOrFallback } from '@/common/utils/route.js'

const navStyle = getMiniProgramNavStyle()
const navRowStyle = getMiniProgramNavRowStyle({ leftPaddingRpx: 34, minRightPaddingRpx: 24 })
const contentTopStyle = getMiniProgramNavContentStyle({ gapRpx: 24 })
const options = [
  { title: '学生邮箱验证', badge: '推荐', icon: 'email-filled' },
  { title: '学信网增强认证', badge: '增强可信', icon: 'auth-filled' },
  { title: '人工审核兜底', badge: '兜底', icon: 'info-filled' }
]
function completeVerify() {
  uni.showToast({ title: '认证状态已记录', icon: 'success' })
  setTimeout(() => {
    goBackOrFallback('/pages/home/index')
  }, 260)
}
</script>

<style scoped>
.verify { min-height: 100vh; background: #f8f9f9; }
.verify__nav { position: fixed; top: 0; right: 0; left: 0; z-index: 30; background: rgba(248, 249, 249, 0.9); backdrop-filter: blur(18px); }
.verify__nav-row { display: flex; align-items: center; }
.floating-back { display: inline-flex; align-items: center; gap: 6rpx; color: #102033; font-size: 23rpx; font-weight: 900; }
.verify__scroll { height: 100vh; box-sizing: border-box; padding: 0 34rpx 120rpx; }
.page-head text { display: block; }
.page-head text:first-child { color: #102033; font-size: 54rpx; font-weight: 950; line-height: 1.12; }
.page-head text:nth-child(2) { margin-top: 12rpx; color: #102033; font-size: 54rpx; font-weight: 950; line-height: 1.12; }
.verify-hero { display: grid; grid-template-columns: 78rpx 1fr; gap: 22rpx; margin-top: 28rpx; padding: 34rpx; border-radius: 38rpx; background: #fff; box-shadow: 0 14rpx 36rpx rgba(15, 23, 42, 0.05); }
.verify-hero view text { display: block; }
.pill { display: inline-flex !important; width: fit-content; padding: 10rpx 16rpx; border-radius: 999rpx; background: #dcfce7; color: #16a34a; font-size: 20rpx; font-weight: 950; }
.verify-hero view text:nth-child(2) { margin-top: 16rpx; color: #102033; font-size: 30rpx; font-weight: 950; line-height: 1.3; }
.verify-hero view text:nth-child(3) { margin-top: 10rpx; color: #64748b; font-size: 23rpx; font-weight: 800; line-height: 1.5; }
.verify-options { display: flex; flex-direction: column; gap: 18rpx; margin-top: 24rpx; }
.verify-card { display: grid; grid-template-columns: 46rpx 1fr auto; align-items: center; gap: 18rpx; padding: 26rpx; border-radius: 30rpx; background: #fff; box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.05); }
.verify-card view text:first-child { display: block; color: #102033; font-size: 26rpx; font-weight: 950; }
.verify-card view text:last-child { display: block; margin-top: 6rpx; color: #64748b; font-size: 21rpx; font-weight: 800; line-height: 1.4; }
.verify-card__pill { padding: 8rpx 14rpx; border-radius: 999rpx; background: #dbeafe; color: #2563eb; font-size: 19rpx; font-weight: 950; }
.info-card { margin-top: 24rpx; padding: 30rpx; border-radius: 32rpx; background: #fff; box-shadow: 0 12rpx 30rpx rgba(15, 23, 42, 0.05); }
.card-title { display: block; color: #102033; font-size: 31rpx; font-weight: 950; }
.question-list { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 18rpx; }
.question-list text { padding: 12rpx 18rpx; border-radius: 999rpx; background: #f3f6fa; color: #64748b; font-size: 22rpx; font-weight: 900; }
.bottom-cta { display: flex; flex-direction: column; gap: 16rpx; margin-top: 28rpx; }
.primary-button, .secondary-button { display: flex; height: 88rpx; align-items: center; justify-content: center; border-radius: 999rpx; font-size: 26rpx; font-weight: 950; }
.primary-button { background: #2388ff; color: #fff; box-shadow: 0 16rpx 34rpx rgba(35, 136, 255, 0.28); }
.secondary-button { border: 1rpx solid #e2e8f0; background: #fff; color: #102033; }
</style>
